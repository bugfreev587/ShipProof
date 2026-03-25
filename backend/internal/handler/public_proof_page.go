package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	db "github.com/xiaobo/shipproof/internal/db"
)

type PublicProofPageHandler struct {
	queries *db.Queries
}

func NewPublicProofPageHandler(queries *db.Queries) *PublicProofPageHandler {
	return &PublicProofPageHandler{queries: queries}
}

func (h *PublicProofPageHandler) GetProofPage(w http.ResponseWriter, r *http.Request) {
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

	config, err := h.queries.GetProofPageConfig(r.Context(), product.ID)
	if err != nil {
		// Return defaults if no config exists
		type defaultConfig struct {
			Headline        string `json:"headline"`
			Subtitle        string `json:"subtitle"`
			Theme           string `json:"theme"`
			Layout          string `json:"layout"`
			ShowBranding    bool   `json:"show_branding"`
			BgColor         string `json:"bg_color"`
			HeaderTextColor string `json:"header_text_color"`
			Enabled         bool   `json:"enabled"`
		}

		type response struct {
			Product db.Product    `json:"product"`
			Config  defaultConfig `json:"config"`
			Proofs  []db.Proof    `json:"proofs"`
		}

		proofs, _ := h.queries.ListApprovedProofsByProductID(r.Context(), product.ID)
		if proofs == nil {
			proofs = []db.Proof{}
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(response{
			Product: product,
			Config: defaultConfig{
				Headline:        "What people are saying",
				Subtitle:        "",
				Theme:           "dark",
				Layout:          "masonry",
				ShowBranding:    true,
				BgColor:         "#0F0F10",
				HeaderTextColor: "#F1F1F3",
				Enabled:         true,
			},
			Proofs: proofs,
		})
		return
	}

	// Get approved proofs for the proof page
	proofs, err := h.queries.ListPublicProofPageProofs(r.Context(), product.ID)
	if err != nil {
		// Fallback to all approved proofs
		proofs2, _ := h.queries.ListApprovedProofsByProductID(r.Context(), product.ID)
		if proofs2 == nil {
			proofs2 = []db.Proof{}
		}

		type response struct {
			Product db.Product  `json:"product"`
			Config  interface{} `json:"config"`
			Proofs  []db.Proof  `json:"proofs"`
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(response{
			Product: product,
			Config:  config,
			Proofs:  proofs2,
		})
		return
	}

	type response struct {
		Product db.Product  `json:"product"`
		Config  interface{} `json:"config"`
		Proofs  interface{} `json:"proofs"`
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response{
		Product: product,
		Config:  config,
		Proofs:  proofs,
	})
}

func (h *PublicProofPageHandler) GetEmbedProofs(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	embed, err := h.queries.GetEmbedBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, `{"error":"embed not found"}`, http.StatusNotFound)
		return
	}

	product, err := h.queries.GetProductByID(r.Context(), embed.ProductID)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	proofs, err := h.queries.ListProofsByEmbedID(r.Context(), embed.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list proofs"}`, http.StatusInternalServerError)
		return
	}

	type embedConfig struct {
		Theme            string `json:"theme"`
		ShowPlatformIcon bool   `json:"show_platform_icon"`
		BorderRadius     int32  `json:"border_radius"`
		CardSpacing      int32  `json:"card_spacing"`
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

	type response struct {
		Embed   embedConfig `json:"embed"`
		Product db.Product  `json:"product"`
		Proofs  interface{} `json:"proofs"`
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response{
		Embed: embedConfig{
			Theme:            embed.Theme.String,
			ShowPlatformIcon: embed.ShowPlatformIcon.Bool,
			BorderRadius:     embed.BorderRadius.Int32,
			CardSpacing:      embed.CardSpacing.Int32,
			ShowBranding:     embed.ShowBranding.Bool,
			BgColor:          embed.BgColor.String,
			TransparentBg:    embed.TransparentBg.Bool,
			HeaderTextColor:  embed.HeaderTextColor.String,
			Subtitle:         embed.Subtitle.String,
			ShowHeader:       embed.ShowHeader.Bool,
			Layout:           embed.Layout,
			VisibleCount:     embed.VisibleCount.Int32,
			CardSize:         embed.CardSize.Int32,
			CardHeight:       embed.CardHeight.Int32,
			TextFontSize:     embed.TextFontSize.Int32,
			TextFont:         embed.TextFont.String,
			TextBold:         embed.TextBold.Bool,
			BgOpacity:        embed.BgOpacity.Int32,
			Rows:             embed.Rows.Int32,
			WidthPercent:     embed.WidthPercent.Int32,
			MaxItems:         embed.MaxItems.Int32,
		},
		Product: product,
		Proofs:  proofs,
	})
}
