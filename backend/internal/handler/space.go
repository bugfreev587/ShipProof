package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type SpaceHandler struct {
	queries     *db.Queries
	userService *service.UserService
	planService *service.PlanService
}

func NewSpaceHandler(queries *db.Queries, userService *service.UserService, planService *service.PlanService) *SpaceHandler {
	return &SpaceHandler{queries: queries, userService: userService, planService: planService}
}

func (h *SpaceHandler) verifyProductOwnership(w http.ResponseWriter, r *http.Request, productID uuid.UUID) (*db.Product, *db.User, bool) {
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

func (h *SpaceHandler) verifySpaceOwnership(w http.ResponseWriter, r *http.Request, spaceID uuid.UUID) (*db.Space, bool) {
	space, err := h.queries.GetSpaceByID(r.Context(), spaceID)
	if err != nil {
		http.Error(w, `{"error":"space not found"}`, http.StatusNotFound)
		return nil, false
	}

	product, err := h.queries.GetProductByID(r.Context(), space.ProductID)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return nil, false
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return nil, false
	}

	return &space, true
}

func (h *SpaceHandler) List(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	spaces, err := h.queries.ListSpacesByProductID(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to list spaces"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(spaces)
}

func (h *SpaceHandler) Create(w http.ResponseWriter, r *http.Request) {
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
	if err := h.planService.CheckSpaceLimit(r.Context(), productID, user.Plan); err != nil {
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

	space, err := h.queries.CreateSpace(r.Context(), db.CreateSpaceParams{
		ProductID: productID,
		Name:      req.Name,
		Slug:      generateWallSlug(req.Name),
	})
	if err != nil {
		http.Error(w, `{"error":"failed to create space"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(space)
}

func (h *SpaceHandler) Get(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	space, ok := h.verifySpaceOwnership(w, r, spaceID)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(space)
}

func (h *SpaceHandler) Update(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifySpaceOwnership(w, r, spaceID)
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

	space, err := h.queries.UpdateSpace(r.Context(), db.UpdateSpaceParams{
		ID:   spaceID,
		Name: req.Name,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update space"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(space)
}

func (h *SpaceHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifySpaceOwnership(w, r, spaceID)
	if !ok {
		return
	}

	var req struct {
		Theme            string `json:"theme"`
		MaxItems         int32  `json:"max_items"`
		ShowPlatformIcon bool   `json:"show_platform_icon"`
		BorderRadius     int32  `json:"border_radius"`
		CardSpacing      int32  `json:"card_spacing"`
		ShowBranding     bool   `json:"show_branding"`
		VisibleCount     int32  `json:"visible_count"`
		CardSize         string `json:"card_size"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// Defaults
	if req.VisibleCount < 1 || req.VisibleCount > 10 {
		req.VisibleCount = 3
	}
	if req.CardSize != "small" && req.CardSize != "medium" && req.CardSize != "large" {
		req.CardSize = "medium"
	}

	space, err := h.queries.UpdateSpaceConfig(r.Context(), db.UpdateSpaceConfigParams{
		ID:               spaceID,
		Theme:            db.WidgetTheme(req.Theme),
		MaxItems:         req.MaxItems,
		ShowPlatformIcon: req.ShowPlatformIcon,
		BorderRadius:     req.BorderRadius,
		CardSpacing:      req.CardSpacing,
		ShowBranding:     req.ShowBranding,
		VisibleCount:     req.VisibleCount,
		CardSize:         req.CardSize,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update space config"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(space)
}

func (h *SpaceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifySpaceOwnership(w, r, spaceID)
	if !ok {
		return
	}

	if err := h.queries.DeleteSpace(r.Context(), spaceID); err != nil {
		http.Error(w, `{"error":"failed to delete space"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *SpaceHandler) AddProof(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifySpaceOwnership(w, r, spaceID)
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

	sp, err := h.queries.AddProofToSpace(r.Context(), db.AddProofToSpaceParams{
		SpaceID:      spaceID,
		ProofID:      proofID,
		DisplayOrder: req.DisplayOrder,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to add proof to space"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sp)
}

func (h *SpaceHandler) RemoveProof(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifySpaceOwnership(w, r, spaceID)
	if !ok {
		return
	}

	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.RemoveProofFromSpace(r.Context(), db.RemoveProofFromSpaceParams{
		SpaceID: spaceID,
		ProofID: proofID,
	}); err != nil {
		http.Error(w, `{"error":"failed to remove proof from space"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *SpaceHandler) UpdateProofOrder(w http.ResponseWriter, r *http.Request) {
	spaceID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		http.Error(w, `{"error":"invalid space id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifySpaceOwnership(w, r, spaceID)
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
		h.queries.UpdateSpaceProofOrder(r.Context(), db.UpdateSpaceProofOrderParams{
			SpaceID:      spaceID,
			ProofID:      proofID,
			DisplayOrder: o.DisplayOrder,
		})
	}

	w.WriteHeader(http.StatusNoContent)
}
