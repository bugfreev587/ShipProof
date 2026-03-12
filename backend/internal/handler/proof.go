package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type ProofHandler struct {
	queries        *db.Queries
	userService    *service.UserService
	storageService *service.StorageService
	planService    *service.PlanService
}

func NewProofHandler(queries *db.Queries, userService *service.UserService, storageService *service.StorageService, planService *service.PlanService) *ProofHandler {
	return &ProofHandler{queries: queries, userService: userService, storageService: storageService, planService: planService}
}

// verifyProductOwnership returns the product if the current user owns it.
func (h *ProofHandler) verifyProductOwnership(w http.ResponseWriter, r *http.Request, productID uuid.UUID) (*db.Product, *db.User, bool) {
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

// verifyProofOwnership returns the proof if the current user owns it (via product).
func (h *ProofHandler) verifyProofOwnership(w http.ResponseWriter, r *http.Request, proofID uuid.UUID) (*db.Proof, bool) {
	proof, err := h.queries.GetProofByID(r.Context(), proofID)
	if err != nil {
		http.Error(w, `{"error":"proof not found"}`, http.StatusNotFound)
		return nil, false
	}

	product, err := h.queries.GetProductByID(r.Context(), proof.ProductID)
	if err != nil {
		http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
		return nil, false
	}

	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil || user.ID != product.UserID {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return nil, false
	}

	return &proof, true
}

type createProofRequest struct {
	SourcePlatform  string   `json:"source_platform"`
	SourceURL       string   `json:"source_url"`
	ContentType     string   `json:"content_type"`
	ContentText     string   `json:"content_text"`
	ContentImageURL string   `json:"content_image_url"`
	AuthorName      string   `json:"author_name"`
	AuthorTitle     string   `json:"author_title"`
	AuthorAvatarURL string   `json:"author_avatar_url"`
	LinkedVersionID string   `json:"linked_version_id"`
	Tags            []string `json:"tags"`
}

func (h *ProofHandler) Create(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	product, user, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	// Plan limit check
	if err := h.planService.CheckProofLimit(r.Context(), product.ID, user.Plan); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	var req createProofRequest

	// Support both JSON and multipart/form-data
	contentTypeHeader := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentTypeHeader, "multipart/form-data") {
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, `{"error":"invalid form data"}`, http.StatusBadRequest)
			return
		}
		req.SourcePlatform = r.FormValue("source_platform")
		req.SourceURL = r.FormValue("source_url")
		req.ContentType = r.FormValue("content_type")
		req.ContentText = r.FormValue("content_text")
		req.AuthorName = r.FormValue("author_name")
		req.AuthorTitle = r.FormValue("author_title")
		req.AuthorAvatarURL = r.FormValue("author_avatar_url")
		req.LinkedVersionID = r.FormValue("linked_version_id")

		if tags := r.FormValue("tags"); tags != "" {
			json.Unmarshal([]byte(tags), &req.Tags)
		}

		// Handle file upload
		file, header, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			if h.storageService != nil {
				imageURL, err := h.storageService.UploadImage(r.Context(), productID, header.Filename, file, header.Size)
				if err != nil {
					http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
					return
				}
				req.ContentImageURL = imageURL
				if req.ContentType == "" {
					req.ContentType = "image"
				}
			}
		}
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
			return
		}
	}

	if req.AuthorName == "" {
		http.Error(w, `{"error":"author_name is required"}`, http.StatusBadRequest)
		return
	}

	if req.ContentType == "" {
		req.ContentType = "text"
	}
	if req.SourcePlatform == "" {
		req.SourcePlatform = "other"
	}

	var linkedVersionID pgtype.UUID
	if req.LinkedVersionID != "" {
		vid, err := uuid.Parse(req.LinkedVersionID)
		if err == nil {
			linkedVersionID = pgtype.UUID{Bytes: vid, Valid: true}
		}
	}

	proof, err := h.queries.CreateProof(r.Context(), db.CreateProofParams{
		ProductID:       productID,
		SourcePlatform:  db.SourcePlatform(req.SourcePlatform),
		SourceUrl:       pgtype.Text{String: req.SourceURL, Valid: req.SourceURL != ""},
		ContentType:     db.ContentType(req.ContentType),
		ContentText:     pgtype.Text{String: req.ContentText, Valid: req.ContentText != ""},
		ContentImageUrl: pgtype.Text{String: req.ContentImageURL, Valid: req.ContentImageURL != ""},
		AuthorName:      req.AuthorName,
		AuthorTitle:     pgtype.Text{String: req.AuthorTitle, Valid: req.AuthorTitle != ""},
		AuthorAvatarUrl: pgtype.Text{String: req.AuthorAvatarURL, Valid: req.AuthorAvatarURL != ""},
		LinkedVersionID: linkedVersionID,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to create proof"}`, http.StatusInternalServerError)
		return
	}

	// Add tags
	for _, tag := range req.Tags {
		tag = strings.TrimSpace(tag)
		if tag != "" {
			h.queries.AddTagToProof(r.Context(), db.AddTagToProofParams{
				ProofID: proof.ID,
				Tag:     tag,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(proof)
}

func (h *ProofHandler) List(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	_, _, ok := h.verifyProductOwnership(w, r, productID)
	if !ok {
		return
	}

	proofs, err := h.queries.ListProofsByProductID(r.Context(), productID)
	if err != nil {
		http.Error(w, `{"error":"failed to list proofs"}`, http.StatusInternalServerError)
		return
	}

	// Enrich with tags
	type proofWithTags struct {
		db.Proof
		Tags []string `json:"tags"`
	}
	result := make([]proofWithTags, 0, len(proofs))
	for _, p := range proofs {
		tags, _ := h.queries.ListTagsByProofID(r.Context(), p.ID)
		tagStrings := make([]string, 0, len(tags))
		for _, t := range tags {
			tagStrings = append(tagStrings, t.Tag)
		}
		result = append(result, proofWithTags{Proof: p, Tags: tagStrings})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

type updateProofRequest struct {
	ContentText     string `json:"content_text"`
	ContentImageURL string `json:"content_image_url"`
	AuthorName      string `json:"author_name"`
	AuthorTitle     string `json:"author_title"`
	AuthorAvatarURL string `json:"author_avatar_url"`
	SourcePlatform  string `json:"source_platform"`
	SourceURL       string `json:"source_url"`
	LinkedVersionID string `json:"linked_version_id"`
}

func (h *ProofHandler) Update(w http.ResponseWriter, r *http.Request) {
	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyProofOwnership(w, r, proofID)
	if !ok {
		return
	}

	var req updateProofRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.SourcePlatform == "" {
		req.SourcePlatform = "other"
	}

	var linkedVersionID pgtype.UUID
	if req.LinkedVersionID != "" {
		vid, err := uuid.Parse(req.LinkedVersionID)
		if err == nil {
			linkedVersionID = pgtype.UUID{Bytes: vid, Valid: true}
		}
	}

	updated, err := h.queries.UpdateProof(r.Context(), db.UpdateProofParams{
		ID:              proofID,
		ContentText:     pgtype.Text{String: req.ContentText, Valid: req.ContentText != ""},
		ContentImageUrl: pgtype.Text{String: req.ContentImageURL, Valid: req.ContentImageURL != ""},
		AuthorName:      req.AuthorName,
		AuthorTitle:     pgtype.Text{String: req.AuthorTitle, Valid: req.AuthorTitle != ""},
		AuthorAvatarUrl: pgtype.Text{String: req.AuthorAvatarURL, Valid: req.AuthorAvatarURL != ""},
		SourcePlatform:  db.SourcePlatform(req.SourcePlatform),
		SourceUrl:       pgtype.Text{String: req.SourceURL, Valid: req.SourceURL != ""},
		LinkedVersionID: linkedVersionID,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to update proof"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

func (h *ProofHandler) Delete(w http.ResponseWriter, r *http.Request) {
	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyProofOwnership(w, r, proofID)
	if !ok {
		return
	}

	if err := h.queries.DeleteProof(r.Context(), proofID); err != nil {
		http.Error(w, `{"error":"failed to delete proof"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProofHandler) ToggleFeatured(w http.ResponseWriter, r *http.Request) {
	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyProofOwnership(w, r, proofID)
	if !ok {
		return
	}

	proof, err := h.queries.ToggleProofFeatured(r.Context(), proofID)
	if err != nil {
		http.Error(w, `{"error":"failed to toggle featured"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(proof)
}

func (h *ProofHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyProofOwnership(w, r, proofID)
	if !ok {
		return
	}

	var req struct {
		DisplayOrder int32 `json:"display_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.UpdateProofOrder(r.Context(), db.UpdateProofOrderParams{
		ID:           proofID,
		DisplayOrder: req.DisplayOrder,
	}); err != nil {
		http.Error(w, `{"error":"failed to update order"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProofHandler) AddTag(w http.ResponseWriter, r *http.Request) {
	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyProofOwnership(w, r, proofID)
	if !ok {
		return
	}

	var req struct {
		Tag string `json:"tag"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Tag == "" {
		http.Error(w, `{"error":"tag is required"}`, http.StatusBadRequest)
		return
	}

	tag, err := h.queries.AddTagToProof(r.Context(), db.AddTagToProofParams{
		ProofID: proofID,
		Tag:     strings.TrimSpace(req.Tag),
	})
	if err != nil {
		http.Error(w, `{"error":"failed to add tag"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(tag)
}

func (h *ProofHandler) RemoveTag(w http.ResponseWriter, r *http.Request) {
	proofID, err := uuid.Parse(chi.URLParam(r, "pid"))
	if err != nil {
		http.Error(w, `{"error":"invalid proof id"}`, http.StatusBadRequest)
		return
	}

	_, ok := h.verifyProofOwnership(w, r, proofID)
	if !ok {
		return
	}

	tag := chi.URLParam(r, "tag")
	if tag == "" {
		http.Error(w, `{"error":"tag is required"}`, http.StatusBadRequest)
		return
	}

	if err := h.queries.RemoveTagFromProof(r.Context(), db.RemoveTagFromProofParams{
		ProofID: proofID,
		Tag:     tag,
	}); err != nil {
		http.Error(w, `{"error":"failed to remove tag"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
