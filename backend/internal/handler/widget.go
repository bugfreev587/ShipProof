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

type WidgetHandler struct {
	queries     *db.Queries
	userService *service.UserService
}

func NewWidgetHandler(queries *db.Queries, userService *service.UserService) *WidgetHandler {
	return &WidgetHandler{queries: queries, userService: userService}
}

func (h *WidgetHandler) verifyProductOwnership(w http.ResponseWriter, r *http.Request, productID uuid.UUID) (*db.Product, *db.User, bool) {
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

func (h *WidgetHandler) Get(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	config, err := h.queries.GetWidgetConfigByProductID(r.Context(), productID)
	if err != nil {
		// Create default config if none exists
		config, err = h.queries.CreateDefaultWidgetConfig(r.Context(), productID)
		if err != nil {
			http.Error(w, `{"error":"failed to create widget config"}`, http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

type updateWidgetRequest struct {
	Theme            string `json:"theme"`
	MaxItems         int32  `json:"max_items"`
	ShowPlatformIcon bool   `json:"show_platform_icon"`
	BorderRadius     int32  `json:"border_radius"`
	CardSpacing      int32  `json:"card_spacing"`
	ShowBranding     bool   `json:"show_branding"`
}

func (h *WidgetHandler) Update(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, user, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	var req updateWidgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// Force show_branding for Free and Pro plans
	if user.Plan != db.UserPlanBusiness {
		req.ShowBranding = true
	}

	if req.Theme == "" {
		req.Theme = "dark"
	}

	// Ensure widget config exists
	_, err = h.queries.GetWidgetConfigByProductID(r.Context(), productID)
	if err != nil {
		h.queries.CreateDefaultWidgetConfig(r.Context(), productID)
	}

	config, err := h.queries.UpdateWidgetConfig(r.Context(), db.UpdateWidgetConfigParams{
		ProductID:        productID,
		Theme:            db.WidgetTheme(req.Theme),
		MaxItems:         req.MaxItems,
		ShowPlatformIcon: req.ShowPlatformIcon,
		BorderRadius:     req.BorderRadius,
		CardSpacing:      req.CardSpacing,
		ShowBranding:     req.ShowBranding,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update widget config"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}
