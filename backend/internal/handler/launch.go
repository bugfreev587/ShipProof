package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type LaunchHandler struct {
	queries     *db.Queries
	service     *service.LaunchService
	userService *service.UserService
}

func NewLaunchHandler(queries *db.Queries, svc *service.LaunchService, userService *service.UserService) *LaunchHandler {
	return &LaunchHandler{queries: queries, service: svc, userService: userService}
}

// verifyProductOwnership checks that the current user owns the product
func (h *LaunchHandler) verifyProductOwnership(r *http.Request) (db.Product, db.User, error) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		return db.Product{}, db.User{}, err
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		return db.Product{}, db.User{}, err
	}

	product, err := h.queries.GetProductByID(r.Context(), productID)
	if err != nil {
		return db.Product{}, db.User{}, err
	}

	if product.UserID != user.ID {
		return db.Product{}, db.User{}, errors.New("forbidden")
	}

	return product, user, nil
}

type generateRequest struct {
	LaunchType       string   `json:"launch_type"`
	Platforms        []string `json:"platforms"`
	RedditSubreddits []string `json:"reddit_subreddits"`
	LaunchNotes      string   `json:"launch_notes"`
}

// POST /api/products/{id}/generate
func (h *LaunchHandler) Generate(w http.ResponseWriter, r *http.Request) {
	product, user, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	var req generateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.LaunchType == "" || len(req.Platforms) == 0 {
		http.Error(w, `{"error":"launch_type and platforms are required"}`, http.StatusBadRequest)
		return
	}

	result, err := h.service.Generate(r.Context(), service.GenerateRequest{
		ProductID:        product.ID,
		LaunchType:       req.LaunchType,
		Platforms:        req.Platforms,
		RedditSubreddits: req.RedditSubreddits,
		LaunchNotes:      req.LaunchNotes,
	}, product, user)
	if err != nil {
		var planErr *service.PlanLimitError
		if errors.As(err, &planErr) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusPaymentRequired)
			json.NewEncoder(w).Encode(map[string]string{"error": planErr.Message})
			return
		}
		slog.Error("generation failed", "error", err, "product_id", product.ID)
		http.Error(w, `{"error":"generation failed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result.Draft)
}

// POST /api/products/{id}/regenerate-field
func (h *LaunchHandler) RegenerateField(w http.ResponseWriter, r *http.Request) {
	product, _, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	var req service.RegenerateFieldRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// Get launch_notes from current draft
	var launchNotes string
	if draft, err := h.queries.GetDraftByProductID(r.Context(), product.ID); err == nil && draft.LaunchNotes.Valid {
		launchNotes = draft.LaunchNotes.String
	}

	text, err := h.service.RegenerateField(r.Context(), req, product, launchNotes)
	if err != nil {
		slog.Error("regeneration failed", "error", err, "product_id", product.ID)
		http.Error(w, `{"error":"regeneration failed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"text": text})
}

// GET /api/products/{id}/draft
func (h *LaunchHandler) GetDraft(w http.ResponseWriter, r *http.Request) {
	product, _, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	draft, err := h.queries.GetDraftByProductID(r.Context(), product.ID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"draft": nil})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"draft": draft})
}

// PUT /api/products/{id}/draft
func (h *LaunchHandler) SaveDraft(w http.ResponseWriter, r *http.Request) {
	product, _, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	var body struct {
		Content   json.RawMessage `json:"content"`
		Platforms []string        `json:"platforms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// If platforms provided, use them; otherwise keep existing
	var platformsJSON json.RawMessage
	if len(body.Platforms) > 0 {
		platformsJSON, _ = json.Marshal(body.Platforms)
	} else {
		// Fetch existing draft to preserve platforms
		existing, err := h.queries.GetDraftByProductID(r.Context(), product.ID)
		if err != nil {
			http.Error(w, `{"error":"no draft to update"}`, http.StatusNotFound)
			return
		}
		platformsJSON = existing.Platforms
	}

	// If content is empty (all platforms discarded), delete the draft
	if body.Content != nil {
		var contentMap map[string]interface{}
		if err := json.Unmarshal(body.Content, &contentMap); err == nil && len(contentMap) == 0 {
			if err := h.queries.DeleteDraftByProductID(r.Context(), product.ID); err != nil {
				http.Error(w, `{"error":"failed to delete draft"}`, http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	draft, err := h.queries.UpdateDraftContent(r.Context(), db.UpdateDraftContentParams{
		ProductID: product.ID,
		Content:   body.Content,
		Platforms: platformsJSON,
	})
	if err != nil {
		http.Error(w, `{"error":"no draft to update"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(draft)
}

// DELETE /api/products/{id}/draft
func (h *LaunchHandler) DeleteDraft(w http.ResponseWriter, r *http.Request) {
	product, _, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	if err := h.queries.DeleteDraftByProductID(r.Context(), product.ID); err != nil {
		http.Error(w, `{"error":"failed to delete draft"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type confirmRequest struct {
	Title          string `json:"title"`
	TimezoneOffset int    `json:"timezone_offset"` // minutes offset from UTC (JS: new Date().getTimezoneOffset())
}

// POST /api/products/{id}/confirm
func (h *LaunchHandler) ConfirmVersion(w http.ResponseWriter, r *http.Request) {
	product, user, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	var req confirmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		http.Error(w, `{"error":"title is required"}`, http.StatusBadRequest)
		return
	}

	version, err := h.service.ConfirmVersion(r.Context(), product.ID, req.Title, user, req.TimezoneOffset)
	if err != nil {
		var planErr *service.PlanLimitError
		if errors.As(err, &planErr) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusPaymentRequired)
			json.NewEncoder(w).Encode(map[string]string{"error": planErr.Message})
			return
		}
		http.Error(w, `{"error":"failed to confirm version"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(version)
}

// GET /api/products/{id}/versions
func (h *LaunchHandler) ListVersions(w http.ResponseWriter, r *http.Request) {
	product, _, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	versions, err := h.queries.ListVersionsByProductID(r.Context(), product.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list versions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(versions)
}

// GET /api/products/{id}/versions/{vid}
func (h *LaunchHandler) GetVersion(w http.ResponseWriter, r *http.Request) {
	_, _, err := h.verifyProductOwnership(r)
	if err != nil {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}

	vid, err := uuid.Parse(chi.URLParam(r, "vid"))
	if err != nil {
		http.Error(w, `{"error":"invalid version id"}`, http.StatusBadRequest)
		return
	}

	version, err := h.queries.GetVersionByID(r.Context(), vid)
	if err != nil {
		http.Error(w, `{"error":"version not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(version)
}

func (h *LaunchHandler) DeleteVersion(w http.ResponseWriter, r *http.Request) {
	vid, err := uuid.Parse(chi.URLParam(r, "vid"))
	if err != nil {
		http.Error(w, `{"error":"invalid version id"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteVersion(r.Context(), vid); err != nil {
		http.Error(w, `{"error":"failed to delete version"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
