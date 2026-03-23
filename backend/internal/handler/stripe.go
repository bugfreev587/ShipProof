package handler

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

// StripeConfig holds keys and price IDs for one Stripe environment (prod or sandbox).
type StripeConfig struct {
	SecretKey              string
	WebhookSecret          string
	ProMonthlyPriceID      string
	ProYearlyPriceID       string
	BusinessMonthlyPriceID string
	BusinessYearlyPriceID  string
}

type StripeHandler struct {
	queries       *db.Queries
	userService   *service.UserService
	prodConfig    StripeConfig
	sandboxConfig *StripeConfig // nil if sandbox not configured
	sandboxEmails map[string]bool
}

func NewStripeHandler(queries *db.Queries, userService *service.UserService, prodConfig StripeConfig, sandboxConfig *StripeConfig, sandboxEmails map[string]bool) *StripeHandler {
	return &StripeHandler{
		queries:       queries,
		userService:   userService,
		prodConfig:    prodConfig,
		sandboxConfig: sandboxConfig,
		sandboxEmails: sandboxEmails,
	}
}

// configForUser returns the sandbox config if the user is whitelisted, otherwise prod.
func (h *StripeHandler) configForUser(email string) StripeConfig {
	if h.sandboxConfig != nil && h.sandboxEmails[email] {
		return *h.sandboxConfig
	}
	return h.prodConfig
}

// newStripeClient creates a per-request Stripe client with the given secret key.
func newStripeClient(cfg StripeConfig) *stripe.Client {
	return stripe.NewClient(cfg.SecretKey)
}

type createCheckoutRequest struct {
	PriceID string `json:"price_id"`
	Plan    string `json:"plan"`
}

// POST /api/stripe/create-checkout
func (h *StripeHandler) CreateCheckout(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	var req createCheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.PriceID == "" || req.Plan == "" {
		http.Error(w, `{"error":"price_id and plan are required"}`, http.StatusBadRequest)
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	cfg := h.configForUser(user.Email)
	sc := newStripeClient(cfg)

	// Store the old subscription ID in metadata so we can cancel it after checkout completes
	oldSubscriptionID := ""
	if user.StripeSubscriptionID.Valid {
		oldSubscriptionID = user.StripeSubscriptionID.String
	}

	params := &stripe.CheckoutSessionCreateParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionCreateLineItemParams{
			{
				Price:    stripe.String(req.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(frontendURL + "/dashboard/settings?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(frontendURL + "/dashboard/settings"),
	}
	params.AddMetadata("user_id", user.ID.String())
	params.AddMetadata("plan", req.Plan)
	if oldSubscriptionID != "" {
		params.AddMetadata("old_subscription_id", oldSubscriptionID)
	}

	if user.StripeCustomerID.Valid && user.StripeCustomerID.String != "" {
		params.Customer = stripe.String(user.StripeCustomerID.String)
	} else {
		params.CustomerEmail = stripe.String(user.Email)
	}

	// Only offer free trial if user hasn't used trial for this specific plan
	trialUsed := (req.Plan == "pro" && user.ProTrialUsed) || (req.Plan == "business" && user.BusinessTrialUsed)
	if !trialUsed {
		params.SubscriptionData = &stripe.CheckoutSessionCreateSubscriptionDataParams{
			TrialPeriodDays: stripe.Int64(7),
		}
	}

	sess, err := sc.V1CheckoutSessions.Create(r.Context(), params)
	if err != nil {
		slog.Error("failed to create checkout session", "error", err)
		http.Error(w, `{"error":"failed to create checkout session"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": sess.URL})
}

// POST /api/stripe/create-portal
func (h *StripeHandler) CreatePortal(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	if !user.StripeCustomerID.Valid || user.StripeCustomerID.String == "" {
		http.Error(w, `{"error":"no billing account found"}`, http.StatusBadRequest)
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	cfg := h.configForUser(user.Email)
	sc := newStripeClient(cfg)

	params := &stripe.BillingPortalSessionCreateParams{
		Customer:  stripe.String(user.StripeCustomerID.String),
		ReturnURL: stripe.String(frontendURL + "/dashboard/settings"),
	}

	sess, err := sc.V1BillingPortalSessions.Create(r.Context(), params)
	if err != nil {
		slog.Error("failed to create portal session", "error", err)
		http.Error(w, `{"error":"failed to create portal session"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": sess.URL})
}

// GET /api/stripe/subscription-status
func (h *StripeHandler) GetSubscriptionStatus(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	if !user.StripeSubscriptionID.Valid || user.StripeSubscriptionID.String == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"has_subscription":     false,
			"cancel_at_period_end": false,
			"current_period_end":   nil,
		})
		return
	}

	cfg := h.configForUser(user.Email)
	sc := newStripeClient(cfg)

	sub, err := sc.V1Subscriptions.Retrieve(r.Context(), user.StripeSubscriptionID.String, &stripe.SubscriptionRetrieveParams{})
	if err != nil {
		slog.Error("failed to fetch subscription from stripe", "error", err)
		http.Error(w, `{"error":"failed to fetch subscription"}`, http.StatusInternalServerError)
		return
	}

	var periodEnd int64
	if len(sub.Items.Data) > 0 {
		periodEnd = sub.Items.Data[0].CurrentPeriodEnd
	}

	var trialEnd *int64
	if sub.TrialEnd > 0 {
		trialEnd = &sub.TrialEnd
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"has_subscription":     true,
		"status":               string(sub.Status),
		"cancel_at_period_end": sub.CancelAtPeriodEnd,
		"current_period_end":   periodEnd,
		"trial_end":            trialEnd,
	})
}

// POST /api/stripe/reactivate
func (h *StripeHandler) ReactivateSubscription(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetClerkUserID(r.Context())
	user, err := h.userService.EnsureUser(r.Context(), clerkID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	if !user.StripeSubscriptionID.Valid || user.StripeSubscriptionID.String == "" {
		http.Error(w, `{"error":"no active subscription"}`, http.StatusBadRequest)
		return
	}

	cfg := h.configForUser(user.Email)
	sc := newStripeClient(cfg)

	_, err = sc.V1Subscriptions.Update(r.Context(), user.StripeSubscriptionID.String, &stripe.SubscriptionUpdateParams{
		CancelAtPeriodEnd: stripe.Bool(false),
	})
	if err != nil {
		slog.Error("failed to reactivate subscription", "error", err)
		http.Error(w, `{"error":"failed to reactivate subscription"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "reactivated"})
}

// POST /api/webhooks/stripe
func (h *StripeHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 65536))
	if err != nil {
		http.Error(w, `{"error":"failed to read body"}`, http.StatusBadRequest)
		return
	}

	sig := r.Header.Get("Stripe-Signature")
	opts := webhook.ConstructEventOptions{IgnoreAPIVersionMismatch: true}

	// Try production webhook secret first
	event, err := webhook.ConstructEventWithOptions(body, sig, h.prodConfig.WebhookSecret, opts)
	usedConfig := h.prodConfig

	// If prod verification fails and sandbox is configured, try sandbox secret
	if err != nil && h.sandboxConfig != nil {
		event, err = webhook.ConstructEventWithOptions(body, sig, h.sandboxConfig.WebhookSecret, opts)
		usedConfig = *h.sandboxConfig
	}

	if err != nil {
		slog.Error("stripe webhook signature verification failed", "error", err)
		http.Error(w, `{"error":"invalid signature"}`, http.StatusBadRequest)
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		h.handleCheckoutCompleted(event, usedConfig)
	case "customer.subscription.updated":
		h.handleSubscriptionUpdated(event, usedConfig)
	case "customer.subscription.deleted":
		h.handleSubscriptionDeleted(event)
	case "invoice.payment_failed":
		slog.Warn("invoice payment failed", "event_id", event.ID)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"received":true}`))
}

func (h *StripeHandler) handleCheckoutCompleted(event stripe.Event, cfg StripeConfig) {
	var sess stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
		slog.Error("failed to parse checkout session", "error", err)
		return
	}

	plan := sess.Metadata["plan"]
	userIDStr := sess.Metadata["user_id"]
	if plan == "" || userIDStr == "" {
		slog.Error("missing metadata in checkout session", "session_id", sess.ID)
		return
	}

	userID, err := parseUUID(userIDStr)
	if err != nil {
		slog.Error("invalid user_id in metadata", "user_id", userIDStr)
		return
	}

	customerID := ""
	if sess.Customer != nil {
		customerID = sess.Customer.ID
	}
	subscriptionID := ""
	if sess.Subscription != nil {
		subscriptionID = sess.Subscription.ID
	}

	_, err = h.queries.UpdateUserPlan(r_context(), db.UpdateUserPlanParams{
		ID:                   userID,
		Plan:                 db.UserPlan(plan),
		StripeCustomerID:     pgtype.Text{String: customerID, Valid: customerID != ""},
		StripeSubscriptionID: pgtype.Text{String: subscriptionID, Valid: subscriptionID != ""},
	})
	if err != nil {
		slog.Error("failed to update user plan", "error", err, "user_id", userIDStr)
		return
	}

	// Cancel the old subscription to prevent stacking (only after new one is confirmed)
	if oldSubID := sess.Metadata["old_subscription_id"]; oldSubID != "" {
		sc := newStripeClient(cfg)
		_, err := sc.V1Subscriptions.Cancel(r_context(), oldSubID, &stripe.SubscriptionCancelParams{})
		if err != nil {
			slog.Warn("failed to cancel old subscription after upgrade", "error", err, "old_subscription_id", oldSubID)
		} else {
			slog.Info("cancelled old subscription after upgrade", "old_subscription_id", oldSubID, "new_plan", plan)
		}
	}

	// Mark trial as used for this plan (so they can't get another free trial for it)
	if err := h.queries.MarkTrialUsed(r_context(), db.MarkTrialUsedParams{
		ID:      userID,
		Column2: plan,
	}); err != nil {
		slog.Error("failed to mark trial used", "error", err, "user_id", userIDStr, "plan", plan)
	}

	slog.Info("user plan updated via checkout", "user_id", userIDStr, "plan", plan)
}

func (h *StripeHandler) handleSubscriptionUpdated(event stripe.Event, cfg StripeConfig) {
	var sub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		slog.Error("failed to parse subscription", "error", err)
		return
	}

	// If user cancels during a free trial, cancel immediately instead of waiting
	// until trial end — they haven't paid anything, no period to honor.
	if sub.Status == stripe.SubscriptionStatusTrialing && sub.CancelAtPeriodEnd {
		slog.Info("trial subscription cancelled by user, cancelling immediately", "subscription_id", sub.ID)
		sc := newStripeClient(cfg)
		_, err := sc.V1Subscriptions.Cancel(r_context(), sub.ID, &stripe.SubscriptionCancelParams{})
		if err != nil {
			slog.Error("failed to immediately cancel trial subscription", "error", err, "subscription_id", sub.ID)
		}
		// The cancel will trigger a subscription.deleted event which downgrades the user
		return
	}

	if sub.Status != stripe.SubscriptionStatusActive && sub.Status != stripe.SubscriptionStatusTrialing {
		return
	}

	customerID := ""
	if sub.Customer != nil {
		customerID = sub.Customer.ID
	}
	if customerID == "" {
		return
	}

	user, err := h.queries.GetUserByStripeCustomerID(r_context(), pgtype.Text{String: customerID, Valid: true})
	if err != nil {
		slog.Error("user not found for stripe customer", "customer_id", customerID)
		return
	}

	plan := h.mapPriceToPlan(sub)
	if plan == "" {
		return
	}

	_, err = h.queries.UpdateUserPlan(r_context(), db.UpdateUserPlanParams{
		ID:                   user.ID,
		Plan:                 db.UserPlan(plan),
		StripeCustomerID:     pgtype.Text{String: customerID, Valid: true},
		StripeSubscriptionID: pgtype.Text{String: sub.ID, Valid: true},
	})
	if err != nil {
		slog.Error("failed to update user plan on subscription update", "error", err)
	}
}

func (h *StripeHandler) handleSubscriptionDeleted(event stripe.Event) {
	var sub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		slog.Error("failed to parse subscription", "error", err)
		return
	}

	customerID := ""
	if sub.Customer != nil {
		customerID = sub.Customer.ID
	}
	if customerID == "" {
		return
	}

	user, err := h.queries.GetUserByStripeCustomerID(r_context(), pgtype.Text{String: customerID, Valid: true})
	if err != nil {
		slog.Error("user not found for stripe customer on deletion", "customer_id", customerID)
		return
	}

	_, err = h.queries.UpdateUserPlan(r_context(), db.UpdateUserPlanParams{
		ID:                   user.ID,
		Plan:                 db.UserPlanFree,
		StripeCustomerID:     pgtype.Text{Valid: false},
		StripeSubscriptionID: pgtype.Text{Valid: false},
	})
	if err != nil {
		slog.Error("failed to downgrade user plan", "error", err)
	}

	slog.Info("user downgraded to free", "user_id", user.ID, "customer_id", customerID)
}

// mapPriceToPlan checks price IDs from both prod and sandbox configs.
func (h *StripeHandler) mapPriceToPlan(sub stripe.Subscription) string {
	priceMap := map[string]string{
		h.prodConfig.ProMonthlyPriceID:      "pro",
		h.prodConfig.ProYearlyPriceID:       "pro",
		h.prodConfig.BusinessMonthlyPriceID: "business",
		h.prodConfig.BusinessYearlyPriceID:  "business",
	}
	if h.sandboxConfig != nil {
		priceMap[h.sandboxConfig.ProMonthlyPriceID] = "pro"
		priceMap[h.sandboxConfig.ProYearlyPriceID] = "pro"
		priceMap[h.sandboxConfig.BusinessMonthlyPriceID] = "business"
		priceMap[h.sandboxConfig.BusinessYearlyPriceID] = "business"
	}

	for _, item := range sub.Items.Data {
		if item.Price == nil {
			continue
		}
		if plan, ok := priceMap[item.Price.ID]; ok {
			return plan
		}
	}
	return ""
}

// r_context returns a background context for webhook handlers
func r_context() context.Context {
	return context.Background()
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
