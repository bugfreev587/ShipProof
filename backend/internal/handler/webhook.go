package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"

	db "github.com/xiaobo/shipproof/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type WebhookHandler struct {
	queries *db.Queries
}

func NewWebhookHandler(queries *db.Queries) *WebhookHandler {
	return &WebhookHandler{queries: queries}
}

type clerkWebhookEvent struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type clerkUserData struct {
	ID            string `json:"id"`
	EmailAddress  string `json:"email_address,omitempty"`
	FirstName     string `json:"first_name,omitempty"`
	LastName      string `json:"last_name,omitempty"`
	ImageURL      string `json:"image_url,omitempty"`
	EmailAddresses []struct {
		EmailAddress string `json:"email_address"`
	} `json:"email_addresses,omitempty"`
}

func (h *WebhookHandler) HandleClerkWebhook(w http.ResponseWriter, r *http.Request) {
	// In production, verify webhook signature using CLERK_WEBHOOK_SECRET
	_ = os.Getenv("CLERK_WEBHOOK_SECRET")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read body"}`, http.StatusBadRequest)
		return
	}

	var event clerkWebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	var userData clerkUserData
	if err := json.Unmarshal(event.Data, &userData); err != nil {
		http.Error(w, `{"error":"invalid user data"}`, http.StatusBadRequest)
		return
	}

	email := userData.EmailAddress
	if email == "" && len(userData.EmailAddresses) > 0 {
		email = userData.EmailAddresses[0].EmailAddress
	}
	name := userData.FirstName
	if userData.LastName != "" {
		name += " " + userData.LastName
	}

	avatarURL := pgtype.Text{}
	if userData.ImageURL != "" {
		avatarURL = pgtype.Text{String: userData.ImageURL, Valid: true}
	}

	switch event.Type {
	case "user.created":
		_, err = h.queries.CreateUser(r.Context(), db.CreateUserParams{
			ClerkID:   userData.ID,
			Email:     email,
			Name:      name,
			AvatarUrl: avatarURL,
		})
	case "user.updated":
		_, err = h.queries.UpdateUser(r.Context(), db.UpdateUserParams{
			ClerkID:   userData.ID,
			Email:     email,
			Name:      name,
			AvatarUrl: avatarURL,
		})
	default:
		slog.Info("ignoring webhook event", "type", event.Type)
		w.WriteHeader(http.StatusOK)
		return
	}

	if err != nil {
		slog.Error("webhook handler failed", "type", event.Type, "error", err)
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	slog.Info("webhook processed", "type", event.Type, "clerk_id", userData.ID)
	w.WriteHeader(http.StatusOK)
}
