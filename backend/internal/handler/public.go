package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

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

	// Limit proofs to max_items
	if int(config.MaxItems) < len(proofs) {
		proofs = proofs[:config.MaxItems]
	}

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

	// Limit proofs to max_items
	if int(space.MaxItems) < len(proofs) {
		proofs = proofs[:space.MaxItems]
	}

	type spaceConfig struct {
		Theme            string `json:"theme"`
		MaxItems         int32  `json:"max_items"`
		ShowPlatformIcon bool   `json:"show_platform_icon"`
		BorderRadius     int32  `json:"border_radius"`
		CardSpacing      int32  `json:"card_spacing"`
		ShowBranding     bool   `json:"show_branding"`
		VisibleCount     int32  `json:"visible_count"`
		CardSize         int32  `json:"card_size"`
		BgColor          string `json:"bg_color"`
		BgOpacity        int32  `json:"bg_opacity"`
	}

	type response struct {
		Space   spaceConfig                    `json:"space"`
		Product db.Product                     `json:"product"`
		Proofs  []db.ListProofsBySpaceIDRow    `json:"proofs"`
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response{
		Space: spaceConfig{
			Theme:            string(space.Theme),
			MaxItems:         space.MaxItems,
			ShowPlatformIcon: space.ShowPlatformIcon,
			BorderRadius:     space.BorderRadius,
			CardSpacing:      space.CardSpacing,
			ShowBranding:     space.ShowBranding,
			VisibleCount:     space.VisibleCount,
			CardSize:         space.CardSize,
			BgColor:          space.BgColor,
			BgOpacity:        space.BgOpacity,
		},
		Product: product,
		Proofs:  proofs,
	})
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
