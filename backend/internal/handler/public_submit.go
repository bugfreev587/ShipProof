package handler

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/ratelimit"
	"github.com/xiaobo/shipproof/internal/service"
)

type PublicSubmitHandler struct {
	queries     *db.Queries
	planService *service.PlanService
	limiter     *ratelimit.Limiter
}

func NewPublicSubmitHandler(queries *db.Queries, planService *service.PlanService, limiter *ratelimit.Limiter) *PublicSubmitHandler {
	return &PublicSubmitHandler{queries: queries, planService: planService, limiter: limiter}
}

func (h *PublicSubmitHandler) SubmitProof(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		AuthorName      string `json:"author_name"`
		AuthorEmail     string `json:"author_email"`
		AuthorHandle    string `json:"author_handle"`
		AuthorTitle     string `json:"author_title"`
		ContentText     string `json:"content_text"`
		ContentImageUrl string `json:"content_image_url"`
		Rating          int32  `json:"rating"`
		SourcePlatform  string `json:"source_platform"`
		HoneypotField   string `json:"honeypot_field"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Honeypot check — silently accept
	if req.HoneypotField != "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Thanks! Your proof is pending review.",
		})
		return
	}

	// Hash IP for rate limiting
	ipHash := fmt.Sprintf("%x", sha256.Sum256([]byte(r.RemoteAddr)))

	// Rate limit checks — silently accept if rate limited
	if !h.limiter.Allow("ip:"+ipHash+":hour", 3, time.Hour) ||
		!h.limiter.Allow("ip:"+ipHash+":day", 5, 24*time.Hour) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Thanks! Your proof is pending review.",
		})
		return
	}

	// Look up product by slug (product.slug)
	product, err := h.queries.GetProductBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return
	}

	// Product-level rate limit
	if !h.limiter.Allow("product:"+product.ID.String()+":hour", 20, time.Hour) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Thanks! Your proof is pending review.",
		})
		return
	}

	// Look up product owner's plan to check pending limit
	owner, err := h.queries.GetUserByID(r.Context(), product.UserID)
	if err != nil {
		slog.Error("failed to get product owner", "product_id", product.ID, "error", err)
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	// Check pending proof count vs plan limit
	pendingCount, err := h.queries.CountPendingProofsByProduct(r.Context(), product.ID)
	if err != nil {
		slog.Error("failed to count pending proofs", "product_id", product.ID, "error", err)
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	maxPending := 10 // free
	if owner.Plan == db.UserPlanPro {
		maxPending = 50
	}
	if owner.Plan == db.UserPlanBusiness {
		maxPending = -1 // unlimited
	}
	if maxPending >= 0 && int(pendingCount) >= maxPending {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Thanks! Your proof is pending review.",
		})
		return
	}

	// Validate required fields
	var errors []string
	if strings.TrimSpace(req.AuthorName) == "" {
		errors = append(errors, "author_name is required")
	}
	if strings.TrimSpace(req.AuthorEmail) == "" || !strings.Contains(req.AuthorEmail, "@") {
		errors = append(errors, "a valid author_email is required")
	}
	contentText := strings.TrimSpace(req.ContentText)
	if len(contentText) < 20 {
		errors = append(errors, "content_text must be at least 20 characters")
	}
	if len(contentText) > 500 {
		errors = append(errors, "content_text must be at most 500 characters")
	}
	if len(errors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":  "validation failed",
			"errors": errors,
		})
		return
	}

	// Determine source platform
	sourcePlatform := db.SourcePlatformDirect
	if req.SourcePlatform != "" {
		sourcePlatform = db.SourcePlatform(req.SourcePlatform)
	}

	// Create the proof
	proof, err := h.queries.CreatePublicProof(r.Context(), db.CreatePublicProofParams{
		ProductID:      product.ID,
		SourcePlatform: sourcePlatform,
		ContentText: pgtype.Text{
			String: contentText,
			Valid:  true,
		},
		ContentImageUrl: pgtype.Text{
			String: req.ContentImageUrl,
			Valid:  req.ContentImageUrl != "",
		},
		AuthorName: req.AuthorName,
		AuthorEmail: pgtype.Text{
			String: req.AuthorEmail,
			Valid:  req.AuthorEmail != "",
		},
		AuthorHandle: pgtype.Text{
			String: req.AuthorHandle,
			Valid:  req.AuthorHandle != "",
		},
		AuthorTitle: pgtype.Text{
			String: req.AuthorTitle,
			Valid:  req.AuthorTitle != "",
		},
		Rating:          pgtype.Int4{Int32: req.Rating, Valid: req.Rating > 0},
		SubmittedIpHash: pgtype.Text{String: ipHash, Valid: true},
	})
	if err != nil {
		slog.Error("failed to create public proof", "product_id", product.ID, "error", err)
		http.Error(w, `{"error":"failed to submit proof"}`, http.StatusInternalServerError)
		return
	}

	slog.Info("public proof submitted", "proof_id", proof.ID, "product_id", product.ID)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Thanks! Your proof is pending review.",
	})
}

// SubmitProofByShortSlug uses proof_page_slug instead of product.slug
func (h *PublicSubmitHandler) SubmitProofByShortSlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, `{"error":"slug is required"}`, http.StatusBadRequest)
		return
	}

	// Look up product by proof_page_slug
	product, err := h.queries.GetProductByProofPageSlug(r.Context(), slug)
	if err != nil {
		http.Error(w, `{"error":"proof page not found"}`, http.StatusNotFound)
		return
	}

	// Rewrite the URL param and delegate to the main handler
	// We need to create a modified request with the product slug
	// Instead, just inline the same logic with the resolved product

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var req struct {
		AuthorName      string `json:"author_name"`
		AuthorEmail     string `json:"author_email"`
		AuthorHandle    string `json:"author_handle"`
		AuthorTitle     string `json:"author_title"`
		ContentText     string `json:"content_text"`
		ContentImageUrl string `json:"content_image_url"`
		Rating          int32  `json:"rating"`
		SourcePlatform  string `json:"source_platform"`
		HoneypotField   string `json:"honeypot_field"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.HoneypotField != "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Thanks! Your proof is pending review."})
		return
	}

	ipHash := fmt.Sprintf("%x", sha256.Sum256([]byte(r.RemoteAddr)))

	if !h.limiter.Allow("ip:"+ipHash+":hour", 3, time.Hour) ||
		!h.limiter.Allow("ip:"+ipHash+":day", 5, 24*time.Hour) ||
		!h.limiter.Allow("product:"+product.ID.String()+":hour", 20, time.Hour) {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Thanks! Your proof is pending review."})
		return
	}

	owner, err := h.queries.GetUserByID(r.Context(), product.UserID)
	if err != nil {
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}

	pendingCount, _ := h.queries.CountPendingProofsByProduct(r.Context(), product.ID)
	maxPending := 10
	if owner.Plan == db.UserPlanPro {
		maxPending = 50
	}
	if owner.Plan == db.UserPlanBusiness {
		maxPending = -1
	}
	if maxPending >= 0 && int(pendingCount) >= maxPending {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Thanks! Your proof is pending review."})
		return
	}

	var errors []string
	if strings.TrimSpace(req.AuthorName) == "" {
		errors = append(errors, "author_name is required")
	}
	if strings.TrimSpace(req.AuthorEmail) == "" || !strings.Contains(req.AuthorEmail, "@") {
		errors = append(errors, "a valid author_email is required")
	}
	contentText := strings.TrimSpace(req.ContentText)
	if len(contentText) < 20 {
		errors = append(errors, "content_text must be at least 20 characters")
	}
	if len(contentText) > 500 {
		errors = append(errors, "content_text must be at most 500 characters")
	}
	if len(errors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "validation failed", "errors": errors})
		return
	}

	sourcePlatform := db.SourcePlatformDirect
	if req.SourcePlatform != "" {
		sourcePlatform = db.SourcePlatform(req.SourcePlatform)
	}

	_, err = h.queries.CreatePublicProof(r.Context(), db.CreatePublicProofParams{
		ProductID:       product.ID,
		SourcePlatform:  sourcePlatform,
		ContentText:     pgtype.Text{String: contentText, Valid: true},
		ContentImageUrl: pgtype.Text{String: req.ContentImageUrl, Valid: req.ContentImageUrl != ""},
		AuthorName:      req.AuthorName,
		AuthorEmail:     pgtype.Text{String: req.AuthorEmail, Valid: req.AuthorEmail != ""},
		AuthorHandle:    pgtype.Text{String: req.AuthorHandle, Valid: req.AuthorHandle != ""},
		AuthorTitle:     pgtype.Text{String: req.AuthorTitle, Valid: req.AuthorTitle != ""},
		Rating:          pgtype.Int4{Int32: req.Rating, Valid: req.Rating > 0},
		SubmittedIpHash: pgtype.Text{String: ipHash, Valid: true},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to submit proof"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Thanks! Your proof is pending review."})
}
