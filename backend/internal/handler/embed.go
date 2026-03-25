package handler

import (
	"encoding/json"
	"log/slog"
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

type EmbedHandler struct {
	queries     *db.Queries
	userService *service.UserService
	planService *service.PlanService
}

func NewEmbedHandler(queries *db.Queries, userService *service.UserService, planService *service.PlanService) *EmbedHandler {
	return &EmbedHandler{queries: queries, userService: userService, planService: planService}
}

var embedSlugRegex = regexp.MustCompile(`[^a-z0-9]+`)

func generateEmbedSlug(name string) string {
	slug := strings.ToLower(name)
	slug = embedSlugRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = uuid.New().String()[:8]
	}
	return slug + "-" + uuid.New().String()[:6]
}

func (h *EmbedHandler) verifyProductOwnership(w http.ResponseWriter, r *http.Request, productID uuid.UUID) (*db.Product, *db.User, bool) {
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

func (h *EmbedHandler) verifyEmbedOwnership(w http.ResponseWriter, r *http.Request, embedID uuid.UUID) (*db.Embed, bool) {
	embed, err := h.queries.GetEmbedByID(r.Context(), embedID)
	if err != nil {
		slog.Warn("embed not found", "embed_id", embedID, "error", err)
		http.Error(w, `{"error":"embed not found"}`, http.StatusNotFound)
		return nil, false
	}

	product, err := h.queries.GetProductByID(r.Context(), embed.ProductID)
	if err != nil {
		slog.Warn("product not found for embed", "embed_id", embedID, "product_id", embed.ProductID, "error", err)
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return nil, false
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return nil, false
	}

	return &embed, true
}

func (h *EmbedHandler) List(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	embeds, err := h.queries.ListEmbedsByProductID(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to list embeds"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(embeds)
}

func (h *EmbedHandler) Create(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, user, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	// Inline embed limit check (will be moved to PlanService later)
	count, err := h.queries.CountEmbedsByProductID(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to check embed limit"}`, http.StatusInternalServerError)
		return
	}
	maxEmbeds := 1 // free
	if user.Plan == db.UserPlanPro {
		maxEmbeds = 3
	}
	if user.Plan == db.UserPlanBusiness {
		maxEmbeds = -1
	}
	if maxEmbeds >= 0 && int(count) >= maxEmbeds {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(map[string]string{"error": "Embed limit reached. Upgrade your plan to create more embeds."})
		return
	}

	var req struct {
		Name   string `json:"name"`
		Layout string `json:"layout"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	// Default layout
	if req.Layout != "inline_strip" && req.Layout != "wall_grid" {
		req.Layout = "inline_strip"
	}

	embed, err := h.queries.CreateEmbed(r.Context(), db.CreateEmbedParams{
		ProductID: productID,
		Name:      req.Name,
		Slug:      generateEmbedSlug(req.Name),
		Layout:    req.Layout,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to create embed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(embed)
}

func (h *EmbedHandler) Get(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	embed, ok := h.verifyEmbedOwnership(w, r, embedID)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(embed)
}

func (h *EmbedHandler) Update(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
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

	embed, err := h.queries.UpdateEmbed(r.Context(), db.UpdateEmbedParams{
		ID:   embedID,
		Name: req.Name,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update embed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(embed)
}

func (h *EmbedHandler) Delete(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
	if !ok {
		return
	}

	if err := h.queries.DeleteEmbed(r.Context(), embedID); err != nil {
		http.Error(w, `{"error":"failed to delete embed"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *EmbedHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
	if !ok {
		return
	}

	var req struct {
		Theme            string `json:"theme"`
		BorderRadius     int32  `json:"border_radius"`
		CardSpacing      int32  `json:"card_spacing"`
		ShowPlatformIcon bool   `json:"show_platform_icon"`
		ShowBranding     bool   `json:"show_branding"`
		BgColor          string `json:"bg_color"`
		TransparentBg    bool   `json:"transparent_bg"`
		HeaderTextColor  string `json:"header_text_color"`
		Subtitle         string `json:"subtitle"`
		ShowHeader       bool   `json:"show_header"`
		Layout           string `json:"layout"`
		VisibleCount     int32  `json:"visible_count"`
		CardSize         int32  `json:"card_size"`
		CardHeight       int32  `json:"card_height"`
		TextFontSize     int32  `json:"text_font_size"`
		TextFont         string `json:"text_font"`
		TextBold         bool   `json:"text_bold"`
		BgOpacity        int32  `json:"bg_opacity"`
		Rows             int32  `json:"rows"`
		WidthPercent     int32  `json:"width_percent"`
		MaxItems         int32  `json:"max_items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// Force show_branding for plans that don't allow removal
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err == nil && h.planService.ForceShowBranding(user.Plan) {
		req.ShowBranding = true
	}

	embed, err := h.queries.UpdateEmbedConfig(r.Context(), db.UpdateEmbedConfigParams{
		ID:               embedID,
		Layout:           req.Layout,
		Theme:            pgtype.Text{String: req.Theme, Valid: true},
		BorderRadius:     pgtype.Int4{Int32: req.BorderRadius, Valid: true},
		CardSpacing:      pgtype.Int4{Int32: req.CardSpacing, Valid: true},
		ShowPlatformIcon: pgtype.Bool{Bool: req.ShowPlatformIcon, Valid: true},
		ShowBranding:     pgtype.Bool{Bool: req.ShowBranding, Valid: true},
		BgColor:          pgtype.Text{String: req.BgColor, Valid: true},
		TransparentBg:    pgtype.Bool{Bool: req.TransparentBg, Valid: true},
		ShowHeader:       pgtype.Bool{Bool: req.ShowHeader, Valid: true},
		HeaderTextColor:  pgtype.Text{String: req.HeaderTextColor, Valid: true},
		Subtitle:         pgtype.Text{String: req.Subtitle, Valid: true},
		MaxItems:         pgtype.Int4{Int32: req.MaxItems, Valid: true},
		VisibleCount:     pgtype.Int4{Int32: req.VisibleCount, Valid: true},
		CardSize:         pgtype.Int4{Int32: req.CardSize, Valid: true},
		CardHeight:       pgtype.Int4{Int32: req.CardHeight, Valid: true},
		TextFontSize:     pgtype.Int4{Int32: req.TextFontSize, Valid: true},
		TextFont:         pgtype.Text{String: req.TextFont, Valid: true},
		TextBold:         pgtype.Bool{Bool: req.TextBold, Valid: true},
		BgOpacity:        pgtype.Int4{Int32: req.BgOpacity, Valid: true},
		Rows:             pgtype.Int4{Int32: req.Rows, Valid: true},
		WidthPercent:     pgtype.Int4{Int32: req.WidthPercent, Valid: true},
		AutoScroll:       pgtype.Bool{Bool: true, Valid: true},
		ScrollDirection:  pgtype.Text{String: "left", Valid: true},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update embed config"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(embed)
}

func (h *EmbedHandler) ListProofs(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
	if !ok {
		return
	}

	proofs, err := h.queries.ListProofsByEmbedID(r.Context(), embedID)
	if err != nil {
		http.Error(w, `{"error":"failed to list embed proofs"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(proofs)
}

func (h *EmbedHandler) AddProof(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
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

	ep, err := h.queries.AddProofToEmbed(r.Context(), db.AddProofToEmbedParams{
		EmbedID:      embedID,
		ProofID:      proofID,
		DisplayOrder: pgtype.Int4{Int32: req.DisplayOrder, Valid: true},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to add proof to embed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ep)
}

func (h *EmbedHandler) RemoveProof(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
	if !ok {
		return
	}

	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.RemoveProofFromEmbed(r.Context(), db.RemoveProofFromEmbedParams{
		EmbedID: embedID,
		ProofID: proofID,
	}); err != nil {
		http.Error(w, `{"error":"failed to remove proof from embed"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *EmbedHandler) UpdateProofOrder(w http.ResponseWriter, r *http.Request) {
	embedID, err := uuid.Parse(chi.URLParam(r, "eid"))
	if err != nil {
		http.Error(w, `{"error":"invalid embed id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyEmbedOwnership(w, r, embedID)
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
		h.queries.UpdateEmbedProofOrder(r.Context(), db.UpdateEmbedProofOrderParams{
			EmbedID:      embedID,
			ProofID:      proofID,
			DisplayOrder: pgtype.Int4{Int32: o.DisplayOrder, Valid: true},
		})
	}

	w.WriteHeader(http.StatusNoContent)
}
