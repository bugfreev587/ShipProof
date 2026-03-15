package handler

import (
	"encoding/json"
	"net/http"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type AnalyticsHandler struct {
	queries     *db.Queries
	userService *service.UserService
}

func NewAnalyticsHandler(queries *db.Queries, userService *service.UserService) *AnalyticsHandler {
	return &AnalyticsHandler{queries: queries, userService: userService}
}

type entityViewCount struct {
	EntityID   string `json:"entity_id"`
	EntityName string `json:"entity_name"`
	ViewCount  int64  `json:"view_count"`
}

type analyticsResponse struct {
	SpaceViews     int64             `json:"space_views"`
	WallViews      int64             `json:"wall_views"`
	SpaceBreakdown []entityViewCount `json:"space_breakdown"`
	WallBreakdown  []entityViewCount `json:"wall_breakdown"`
}

func (h *AnalyticsHandler) GetViews(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusUnauthorized)
		return
	}

	products, err := h.queries.ListProductsByUserID(r.Context(), user.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list products"}`, http.StatusInternalServerError)
		return
	}

	resp := analyticsResponse{
		SpaceBreakdown: []entityViewCount{},
		WallBreakdown:  []entityViewCount{},
	}

	// Build lookup maps for entity names
	spaceNames := make(map[string]string)
	wallNames := make(map[string]string)

	for _, p := range products {
		spaces, _ := h.queries.ListSpacesByProductID(r.Context(), p.ID)
		for _, s := range spaces {
			spaceNames[s.ID.String()] = s.Name
		}
		walls, _ := h.queries.ListWallsByProductID(r.Context(), p.ID)
		for _, wall := range walls {
			wallNames[wall.ID.String()] = wall.Name
		}

		grouped, err := h.queries.CountViewsByProductGrouped(r.Context(), p.ID)
		if err != nil {
			continue
		}

		for _, row := range grouped {
			switch row.EntityType {
			case "space":
				resp.SpaceViews += row.ViewCount
				name := spaceNames[row.EntityID.String()]
				resp.SpaceBreakdown = append(resp.SpaceBreakdown, entityViewCount{
					EntityID:   row.EntityID.String(),
					EntityName: name,
					ViewCount:  row.ViewCount,
				})
			case "wall":
				resp.WallViews += row.ViewCount
				name := wallNames[row.EntityID.String()]
				resp.WallBreakdown = append(resp.WallBreakdown, entityViewCount{
					EntityID:   row.EntityID.String(),
					EntityName: name,
					ViewCount:  row.ViewCount,
				})
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
