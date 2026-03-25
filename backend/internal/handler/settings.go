package handler

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type SettingsHandler struct {
	queries     *db.Queries
	userService *service.UserService
}

func NewSettingsHandler(queries *db.Queries, userService *service.UserService) *SettingsHandler {
	return &SettingsHandler{queries: queries, userService: userService}
}

func (h *SettingsHandler) GetApiKeyStatus(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{
		"has_key": user.ApiKey.Valid && user.ApiKey.String != "",
	})
}

func (h *SettingsHandler) GenerateApiKey(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusUnauthorized)
		return
	}

	apiKey := "sp_" + uuid.New().String()

	_, err = h.queries.SetUserApiKey(r.Context(), db.SetUserApiKeyParams{
		ID:     user.ID,
		ApiKey: pgtype.Text{String: apiKey, Valid: true},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to generate api key"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"api_key": apiKey,
	})
}

func (h *SettingsHandler) DeleteApiKey(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusUnauthorized)
		return
	}

	_, err = h.queries.SetUserApiKey(r.Context(), db.SetUserApiKeyParams{
		ID:     user.ID,
		ApiKey: pgtype.Text{Valid: false},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to delete api key"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
