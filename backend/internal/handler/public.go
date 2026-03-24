package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
)

type PublicHandler struct {
	queries *db.Queries
}

func NewPublicHandler(queries *db.Queries) *PublicHandler {
	return &PublicHandler{queries: queries}
}

func (h *PublicHandler) GetProductProofs(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	product, err := h.queries.GetProductBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	proofs, err := h.queries.ListApprovedProofsByProductID(r.Context(), product.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list proofs"}`, http.StatusInternalServerError)
		return
	}

	// Get widget config
	config, err := h.queries.GetWidgetConfigByProductID(r.Context(), product.ID)
	if err != nil {
		// Return defaults if no config
		config = db.WidgetConfig{
			Theme:            db.WidgetThemeDark,
			MaxItems:         6,
			ShowPlatformIcon: true,
			BorderRadius:     12,
			CardSpacing:      16,
			ShowBranding:     true,
		}
	}

	// max_items is passed to frontend for client-side slicing in embeds.

	type response struct {
		Product db.Product      `json:"product"`
		Proofs  []db.Proof      `json:"proofs"`
		Widget  db.WidgetConfig `json:"widget"`
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response{
		Product: product,
		Proofs:  proofs,
		Widget:  config,
	})
}

func (h *PublicHandler) GetSpaceProofs(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	space, err := h.queries.GetSpaceBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, `{"error":"space not found"}`, http.StatusNotFound)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), space.ProductID)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	proofs, err := h.queries.ListProofsBySpaceID(r.Context(), space.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list proofs"}`, http.StatusInternalServerError)
		return
	}

	// Note: max_items is passed to the frontend for client-side slicing in embeds.
	// We return all proofs here so the dashboard and full page views work correctly.

	type spaceConfig struct {
		Theme            string `json:"theme"`
		ShowPlatformIcon bool   `json:"show_platform_icon"`
		BorderRadius     int32  `json:"border_radius"`
		CardSpacing      int32  `json:"card_spacing"`
		ShowBranding     bool   `json:"show_branding"`
		VisibleCount     int32  `json:"visible_count"`
		CardSize         int32  `json:"card_size"`
		BgColor          string `json:"bg_color"`
		BgOpacity        int32  `json:"bg_opacity"`
		Layout           string `json:"layout"`
		Rows             int32  `json:"rows"`
		WidthPercent     int32  `json:"width_percent"`
	}

	type response struct {
		Space   spaceConfig                 `json:"space"`
		Product db.Product                  `json:"product"`
		Proofs  []db.ListProofsBySpaceIDRow `json:"proofs"`
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response{
		Space: spaceConfig{
			Theme:            string(space.Theme),
			ShowPlatformIcon: space.ShowPlatformIcon,
			BorderRadius:     space.BorderRadius,
			CardSpacing:      space.CardSpacing,
			ShowBranding:     space.ShowBranding,
			VisibleCount:     space.VisibleCount,
			CardSize:         space.CardSize,
			BgColor:          space.BgColor,
			BgOpacity:        space.BgOpacity,
			Layout:           space.Layout,
			Rows:             space.Rows,
			WidthPercent:     space.WidthPercent,
		},
		Product: product,
		Proofs:  proofs,
	})
}

func (h *PublicHandler) RecordView(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EntityType string `json:"entity_type"`
		Slug       string `json:"slug"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.EntityType != "space" && req.EntityType != "wall" {
		http.Error(w, `{"error":"entity_type must be space or wall"}`, http.StatusBadRequest)
		return
	}
	if req.Slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	var entityID, productID uuid.UUID
	switch req.EntityType {
	case "space":
		space, err := h.queries.GetSpaceBySlug(r.Context(), req.Slug)
		if err != nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		entityID = space.ID
		productID = space.ProductID
	case "wall":
		wall, err := h.queries.GetWallBySlug(r.Context(), req.Slug)
		if err != nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		entityID = wall.ID
		productID = wall.ProductID
	}

	referrer := r.Header.Get("Referer")
	ref := pgtype.Text{}
	if referrer != "" {
		ref = pgtype.Text{String: referrer, Valid: true}
	}

	err := h.queries.RecordView(r.Context(), db.RecordViewParams{
		EntityType: req.EntityType,
		EntityID:   entityID,
		ProductID:  productID,
		Referrer:   ref,
	})
	if err != nil {
		slog.Error("failed to record view", "error", err)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *PublicHandler) GetWallProofs(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	wall, err := h.queries.GetWallBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, `{"error":"wall not found"}`, http.StatusNotFound)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), wall.ProductID)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	proofs, err := h.queries.ListProofsByWallID(r.Context(), wall.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list proofs"}`, http.StatusInternalServerError)
		return
	}

	type response struct {
		Wall    db.Wall                    `json:"wall"`
		Product db.Product                 `json:"product"`
		Proofs  []db.ListProofsByWallIDRow `json:"proofs"`
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response{
		Wall:    wall,
		Product: product,
		Proofs:  proofs,
	})
}
