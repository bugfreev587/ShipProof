package handler

import (
	"encoding/json"
	"net/http"

	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type UserHandler struct {
	userService   *service.UserService
	prodConfig    StripeConfig
	sandboxConfig *StripeConfig
	sandboxEmails map[string]bool
}

func NewUserHandler(userService *service.UserService, prodConfig StripeConfig, sandboxConfig *StripeConfig, sandboxEmails map[string]bool) *UserHandler {
	return &UserHandler{
		userService:   userService,
		prodConfig:    prodConfig,
		sandboxConfig: sandboxConfig,
		sandboxEmails: sandboxEmails,
	}
}

type stripePrices struct {
	ProMonthly      string `json:"pro_monthly"`
	ProYearly       string `json:"pro_yearly"`
	BusinessMonthly string `json:"business_monthly"`
	BusinessYearly  string `json:"business_yearly"`
}

type userMeResponse struct {
	ID                   string       `json:"id"`
	ClerkID              string       `json:"clerk_id"`
	Email                string       `json:"email"`
	Name                 string       `json:"name"`
	AvatarURL            *string      `json:"avatar_url"`
	Plan                 string       `json:"plan"`
	IsAdmin              bool         `json:"is_admin"`
	StripeCustomerID     *string      `json:"stripe_customer_id"`
	StripeSubscriptionID *string      `json:"stripe_subscription_id"`
	ProTrialUsed         bool         `json:"pro_trial_used"`
	BusinessTrialUsed    bool         `json:"business_trial_used"`
	CreatedAt            string       `json:"created_at"`
	UpdatedAt            string       `json:"updated_at"`
	StripePrices         stripePrices `json:"stripe_prices"`
}

// GET /api/user/me
func (h *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	cfg := h.prodConfig
	if h.sandboxConfig != nil && h.sandboxEmails[user.Email] {
		cfg = *h.sandboxConfig
	}

	var avatarURL *string
	if user.AvatarUrl.Valid {
		avatarURL = &user.AvatarUrl.String
	}
	var customerID *string
	if user.StripeCustomerID.Valid {
		customerID = &user.StripeCustomerID.String
	}
	var subID *string
	if user.StripeSubscriptionID.Valid {
		subID = &user.StripeSubscriptionID.String
	}

	resp := userMeResponse{
		ID:                   user.ID.String(),
		ClerkID:              user.ClerkID,
		Email:                user.Email,
		Name:                 user.Name,
		AvatarURL:            avatarURL,
		Plan:                 string(user.Plan),
		IsAdmin:              user.IsAdmin,
		StripeCustomerID:     customerID,
		StripeSubscriptionID: subID,
		ProTrialUsed:         user.ProTrialUsed,
		BusinessTrialUsed:    user.BusinessTrialUsed,
		CreatedAt:            user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:            user.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		StripePrices: stripePrices{
			ProMonthly:      cfg.ProMonthlyPriceID,
			ProYearly:       cfg.ProYearlyPriceID,
			BusinessMonthly: cfg.BusinessMonthlyPriceID,
			BusinessYearly:  cfg.BusinessYearlyPriceID,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
