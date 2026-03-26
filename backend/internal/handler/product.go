package handler

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type ProductHandler struct {
	queries     *db.Queries
	userService *service.UserService
	planService *service.PlanService
}

func NewProductHandler(queries *db.Queries, userService *service.UserService, planService *service.PlanService) *ProductHandler {
	return &ProductHandler{queries: queries, userService: userService, planService: planService}
}

type createProductRequest struct {
	Name        string `json:"name"`
	URL         string `json:"url,omitempty"`
	Description string `json:"description,omitempty"`
	LogoURL     string `json:"logo_url,omitempty"`
}

type updateProductRequest struct {
	Name            string `json:"name"`
	URL             string `json:"url,omitempty"`
	Description     string `json:"description,omitempty"`
	DescriptionLong string `json:"description_long,omitempty"`
	TargetAudience  string `json:"target_audience,omitempty"`
	LogoURL         string `json:"logo_url,omitempty"`
}

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

func generateShortSlug() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

var proofPageSlugRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$`)

var reservedSlugs = map[string]bool{
	"tools": true, "sign-in": true, "sign-up": true, "dashboard": true,
	"admin": true, "api": true, "embed": true, "w": true, "p": true,
	"launchready": true, "pricing": true, "terms": true, "privacy": true,
}

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = slugRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = uuid.New().String()[:8]
	}
	return slug
}

func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	products, err := h.queries.ListProductsByUserID(r.Context(), user.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list products"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	// Plan limit: check product count
	if err := h.planService.CheckProductLimit(r.Context(), user.ID, user.Plan); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	var req createProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	slug := generateSlug(req.Name)
	// Append short UUID suffix to avoid slug conflicts
	slug = slug + "-" + uuid.New().String()[:6]

	product, err := h.queries.CreateProduct(r.Context(), db.CreateProductParams{
		UserID:        user.ID,
		Name:          req.Name,
		Slug:          slug,
		Url:           pgtype.Text{String: req.URL, Valid: req.URL != ""},
		Description:   pgtype.Text{String: req.Description, Valid: req.Description != ""},
		LogoUrl:       pgtype.Text{String: req.LogoURL, Valid: req.LogoURL != ""},
		ProofPageSlug: generateShortSlug(),
	})
	if err != nil {
		http.Error(w, `{"error":"failed to create product"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

func (h *ProductHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), id)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	// Verify ownership
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), id)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	var req updateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	updated, err := h.queries.UpdateProduct(r.Context(), db.UpdateProductParams{
		ID:              id,
		Name:            req.Name,
		Url:             pgtype.Text{String: req.URL, Valid: req.URL != ""},
		Description:     pgtype.Text{String: req.Description, Valid: req.Description != ""},
		DescriptionLong: pgtype.Text{String: req.DescriptionLong, Valid: req.DescriptionLong != ""},
		TargetAudience:  pgtype.Text{String: req.TargetAudience, Valid: req.TargetAudience != ""},
		LogoUrl:         pgtype.Text{String: req.LogoURL, Valid: req.LogoURL != ""},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update product"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), id)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	if err := h.queries.DeleteProduct(r.Context(), id); err != nil {
		http.Error(w, `{"error":"failed to delete product"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProductHandler) UpdateProofPageSlug(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), id)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	var req struct {
		Slug string `json:"slug"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	slug := strings.ToLower(strings.TrimSpace(req.Slug))

	// Validate length
	if len(slug) < 3 || len(slug) > 20 {
		http.Error(w, `{"error":"Slug must be 3-20 characters"}`, http.StatusBadRequest)
		return
	}

	// Validate format
	if !proofPageSlugRegex.MatchString(slug) {
		http.Error(w, `{"error":"Only lowercase letters, numbers, and hyphens allowed"}`, http.StatusBadRequest)
		return
	}

	// Check reserved words
	if reservedSlugs[slug] {
		http.Error(w, `{"error":"This slug is reserved"}`, http.StatusConflict)
		return
	}

	// Check availability
	count, err := h.queries.CheckProofPageSlugAvailable(r.Context(), db.CheckProofPageSlugAvailableParams{
		ProofPageSlug: slug,
		ID:            id,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to check slug availability"}`, http.StatusInternalServerError)
		return
	}
	if count > 0 {
		http.Error(w, `{"error":"This slug is already taken"}`, http.StatusConflict)
		return
	}

	if err := h.queries.UpdateProofPageSlug(r.Context(), db.UpdateProofPageSlugParams{
		ID:            id,
		ProofPageSlug: slug,
	}); err != nil {
		http.Error(w, `{"error":"failed to update slug"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"slug": slug})
}

func (h *ProductHandler) CheckProofPageSlug(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	slug := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("slug")))
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	if reservedSlugs[slug] {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"available": false})
		return
	}

	count, err := h.queries.CheckProofPageSlugAvailable(r.Context(), db.CheckProofPageSlugAvailableParams{
		ProofPageSlug: slug,
		ID:            id,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to check"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"available": count == 0})
}
