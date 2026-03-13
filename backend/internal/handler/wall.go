package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type WallHandler struct {
	queries     *db.Queries
	userService *service.UserService
	planService *service.PlanService
}

func NewWallHandler(queries *db.Queries, userService *service.UserService, planService *service.PlanService) *WallHandler {
	return &WallHandler{queries: queries, userService: userService, planService: planService}
}

var wallSlugRegex = regexp.MustCompile(`[^a-z0-9]+`)

func generateWallSlug(name string) string {
	slug := strings.ToLower(name)
	slug = wallSlugRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = uuid.New().String()[:8]
	}
	return slug + "-" + uuid.New().String()[:6]
}

func (h *WallHandler) verifyProductOwnership(w http.ResponseWriter, r *http.Request, productID uuid.UUID) (*db.Product, *db.User, bool) {
	product, err := h.queries.GetProductByID(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return nil, nil, false
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return nil, nil, false
	}

	return &product, &user, true
}

func (h *WallHandler) verifyWallOwnership(w http.ResponseWriter, r *http.Request, wallID uuid.UUID) (*db.Wall, bool) {
	wall, err := h.queries.GetWallByID(r.Context(), wallID)
	if err != nil {
		slog.Warn("wall not found", "wall_id", wallID, "error", err)
		http.Error(w, `{"error":"wall not found"}`, http.StatusNotFound)
		return nil, false
	}

	product, err := h.queries.GetProductByID(r.Context(), wall.ProductID)
	if err != nil {
		slog.Warn("product not found for wall", "wall_id", wallID, "product_id", wall.ProductID, "error", err)
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return nil, false
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return nil, false
	}

	return &wall, true
}

func (h *WallHandler) List(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	walls, err := h.queries.ListWallsByProductID(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to list walls"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(walls)
}

func (h *WallHandler) Create(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, user, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	// Plan limit check
	if err := h.planService.CheckWallLimit(user.Plan); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	wall, err := h.queries.CreateWall(r.Context(), db.CreateWallParams{
		ProductID: productID,
		Name:      req.Name,
		Slug:      generateWallSlug(req.Name),
	})
	if err != nil {
		http.Error(w, `{"error":"failed to create wall"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wall)
}

func (h *WallHandler) Get(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	wall, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wall)
}

func (h *WallHandler) Update(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	wall, err := h.queries.UpdateWall(r.Context(), db.UpdateWallParams{
		ID:   wallID,
		Name: req.Name,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update wall"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wall)
}

func (h *WallHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	var req struct {
		Theme            string `json:"theme"`
		BorderRadius     int32  `json:"border_radius"`
		CardSpacing      int32  `json:"card_spacing"`
		ShowPlatformIcon bool   `json:"show_platform_icon"`
		ShowBranding     bool   `json:"show_branding"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	wall, err := h.queries.UpdateWallConfig(r.Context(), db.UpdateWallConfigParams{
		ID:               wallID,
		Theme:            db.WidgetTheme(req.Theme),
		BorderRadius:     req.BorderRadius,
		CardSpacing:      req.CardSpacing,
		ShowPlatformIcon: req.ShowPlatformIcon,
		ShowBranding:     req.ShowBranding,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update wall config"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wall)
}

func (h *WallHandler) Delete(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	if err := h.queries.DeleteWall(r.Context(), wallID); err != nil {
		http.Error(w, `{"error":"failed to delete wall"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *WallHandler) ListProofs(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	proofs, err := h.queries.ListProofsByWallID(r.Context(), wallID)
	if err != nil {
		http.Error(w, `{"error":"failed to list wall proofs"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(proofs)
}

func (h *WallHandler) AddProof(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	var req struct {
		ProofID      string `json:"proof_id"`
		DisplayOrder int32  `json:"display_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	proofID, err := uuid.Parse(req.ProofID)
	if err != nil {
		http.Error(w, `{"error":"invalid proof_id"}`, http.StatusBadRequest)
		return
	}

	wp, err := h.queries.AddProofToWall(r.Context(), db.AddProofToWallParams{
		WallID:       wallID,
		ProofID:      proofID,
		DisplayOrder: req.DisplayOrder,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to add proof to wall"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wp)
}

func (h *WallHandler) RemoveProof(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.RemoveProofFromWall(r.Context(), db.RemoveProofFromWallParams{
		WallID:  wallID,
		ProofID: proofID,
	}); err != nil {
		http.Error(w, `{"error":"failed to remove proof from wall"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *WallHandler) UpdateProofOrder(w http.ResponseWriter, r *http.Request) {
	wallID, err := uuid.Parse(chi.URLParam(r, "wid"))
	if err != nil {
		http.Error(w, `{"error":"invalid wall id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyWallOwnership(w, r, wallID)
	if !ok {
		return
	}

	var req struct {
		Orders []struct {
			ProofID      string `json:"proof_id"`
			DisplayOrder int32  `json:"display_order"`
		} `json:"orders"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	for _, o := range req.Orders {
		proofID, err := uuid.Parse(o.ProofID)
		if err != nil {
			continue
		}
		h.queries.UpdateWallProofOrder(r.Context(), db.UpdateWallProofOrderParams{
			WallID:       wallID,
			ProofID:      proofID,
			DisplayOrder: o.DisplayOrder,
		})
	}

	w.WriteHeader(http.StatusNoContent)
}
