package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type ProofPageHandler struct {
	queries     *db.Queries
	userService *service.UserService
	planService *service.PlanService
}

func NewProofPageHandler(queries *db.Queries, userService *service.UserService, planService *service.PlanService) *ProofPageHandler {
	return &ProofPageHandler{queries: queries, userService: userService, planService: planService}
}

func (h *ProofPageHandler) verifyProductOwnership(w http.ResponseWriter, r *http.Request, productID uuid.UUID) (*db.Product, *db.User, bool) {
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

func (h *ProofPageHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	config, err := h.queries.GetProofPageConfig(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"proof page config not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

func (h *ProofPageHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, user, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	var req struct {
		Headline        string `json:"headline"`
		Subtitle        string `json:"subtitle"`
		Theme           string `json:"theme"`
		Layout          string `json:"layout"`
		ShowBranding    bool   `json:"show_branding"`
		BgColor         string `json:"bg_color"`
		HeaderTextColor string `json:"header_text_color"`
		Enabled         bool   `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// Force show_branding for plans that don't allow removal
	if h.planService.ForceShowBranding(user.Plan) {
		req.ShowBranding = true
	}

	err = h.queries.UpdateProofPageConfig(r.Context(), db.UpdateProofPageConfigParams{
		ID:                    productID,
		ProofPageTitle:        pgtype.Text{String: req.Headline, Valid: true},
		ProofPageSubtitle:     pgtype.Text{String: req.Subtitle, Valid: true},
		ProofPageTheme:        pgtype.Text{String: req.Theme, Valid: true},
		ProofPageShowForm:     pgtype.Bool{Bool: req.Enabled, Valid: true},
		ProofPageFormHeading:  pgtype.Text{String: "", Valid: true},
		ProofPageShowBranding: pgtype.Bool{Bool: req.ShowBranding, Valid: true},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update proof page config"}`, http.StatusInternalServerError)
		return
	}

	// Re-fetch the updated config to return it
	config, err := h.queries.GetProofPageConfig(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch updated config"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

func (h *ProofPageHandler) ListProofs(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	proofs, err := h.queries.ListProofPageProofs(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to list proof page proofs"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(proofs)
}

func (h *ProofPageHandler) AddProof(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
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

	err = h.queries.AddProofToProofPage(r.Context(), db.AddProofToProofPageParams{
		ProductID:    productID,
		ProofID:      proofID,
		DisplayOrder: pgtype.Int4{Int32: req.DisplayOrder, Valid: true},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to add proof to proof page"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *ProofPageHandler) RemoveProof(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.RemoveProofFromProofPage(r.Context(), db.RemoveProofFromProofPageParams{
		ProductID: productID,
		ProofID:   proofID,
	}); err != nil {
		http.Error(w, `{"error":"failed to remove proof from proof page"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProofPageHandler) ReorderProofs(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
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
		h.queries.UpdateProofPageProofOrder(r.Context(), db.UpdateProofPageProofOrderParams{
			ProductID:    productID,
			ProofID:      proofID,
			DisplayOrder: pgtype.Int4{Int32: o.DisplayOrder, Valid: true},
		})
	}

	w.WriteHeader(http.StatusNoContent)
}
