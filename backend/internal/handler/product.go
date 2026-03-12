package handler

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
)

type ProductHandler struct {
	queries *db.Queries
}

func NewProductHandler(queries *db.Queries) *ProductHandler {
	return &ProductHandler{queries: queries}
}

type createProductRequest struct {
	Name        string `json:"name"`
	URL         string `json:"url,omitempty"`
	Description string `json:"description,omitempty"`
}

type updateProductRequest struct {
	Name        string `json:"name"`
	URL         string `json:"url,omitempty"`
	Description string `json:"description,omitempty"`
}

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

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
	user, err := h.queries.GetUserByClerkID(r.Context(), clerkID)
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
	user, err := h.queries.GetUserByClerkID(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
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
		UserID:      user.ID,
		Name:        req.Name,
		Slug:        slug,
		Url:         pgtype.Text{String: req.URL, Valid: req.URL != ""},
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
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
	user, err := h.queries.GetUserByClerkID(r.Context(), clerkID)
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
	user, err := h.queries.GetUserByClerkID(r.Context(), clerkID)
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
		ID:          id,
		Name:        req.Name,
		Url:         pgtype.Text{String: req.URL, Valid: req.URL != ""},
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
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
	user, err := h.queries.GetUserByClerkID(r.Context(), clerkID)
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
