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
	"github.com/stripe/stripe-go/v82/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v82/checkout/session"
	"github.com/stripe/stripe-go/v82/webhook"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

type StripeHandler struct {
	queries     *db.Queries
	userService *service.UserService
}

func NewStripeHandler(queries *db.Queries, userService *service.UserService) *StripeHandler {
	return &StripeHandler{queries: queries, userService: userService}
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

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(req.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(frontendURL + "/dashboard/settings?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(frontendURL + "/dashboard/settings"),
		Metadata: map[string]string{
			"user_id": user.ID.String(),
			"plan":    req.Plan,
		},
	}

	if user.StripeCustomerID.Valid && user.StripeCustomerID.String != "" {
		params.Customer = stripe.String(user.StripeCustomerID.String)
	} else {
		params.CustomerEmail = stripe.String(user.Email)
	}

	sess, err := checkoutsession.New(params)
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

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(user.StripeCustomerID.String),
		ReturnURL: stripe.String(frontendURL + "/dashboard/settings"),
	}

	sess, err := session.New(params)
	if err != nil {
		slog.Error("failed to create portal session", "error", err)
		http.Error(w, `{"error":"failed to create portal session"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": sess.URL})
}

// POST /api/webhooks/stripe
func (h *StripeHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 65536))
	if err != nil {
		http.Error(w, `{"error":"failed to read body"}`, http.StatusBadRequest)
		return
	}

	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	event, err := webhook.ConstructEventWithOptions(body, r.Header.Get("Stripe-Signature"), webhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		slog.Error("stripe webhook signature verification failed", "error", err)
		http.Error(w, `{"error":"invalid signature"}`, http.StatusBadRequest)
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		h.handleCheckoutCompleted(event)
	case "customer.subscription.updated":
		h.handleSubscriptionUpdated(event)
	case "customer.subscription.deleted":
		h.handleSubscriptionDeleted(event)
	case "invoice.payment_failed":
		slog.Warn("invoice payment failed", "event_id", event.ID)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"received":true}`))
}

func (h *StripeHandler) handleCheckoutCompleted(event stripe.Event) {
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
		ID:                 userID,
		Plan:               db.UserPlan(plan),
		StripeCustomerID:   pgtype.Text{String: customerID, Valid: customerID != ""},
		StripeSubscriptionID: pgtype.Text{String: subscriptionID, Valid: subscriptionID != ""},
	})
	if err != nil {
		slog.Error("failed to update user plan", "error", err, "user_id", userIDStr)
		return
	}

	slog.Info("user plan updated via checkout", "user_id", userIDStr, "plan", plan)
}

func (h *StripeHandler) handleSubscriptionUpdated(event stripe.Event) {
	var sub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		slog.Error("failed to parse subscription", "error", err)
		return
	}

	if sub.Status != stripe.SubscriptionStatusActive {
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

	// Map price ID to plan
	plan := mapPriceToPlan(sub)
	if plan == "" {
		return
	}

	_, err = h.queries.UpdateUserPlan(r_context(), db.UpdateUserPlanParams{
		ID:                 user.ID,
		Plan:               db.UserPlan(plan),
		StripeCustomerID:   pgtype.Text{String: customerID, Valid: true},
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
		ID:                 user.ID,
		Plan:               db.UserPlanFree,
		StripeCustomerID:   pgtype.Text{Valid: false},
		StripeSubscriptionID: pgtype.Text{Valid: false},
	})
	if err != nil {
		slog.Error("failed to downgrade user plan", "error", err)
	}

	slog.Info("user downgraded to free", "user_id", user.ID, "customer_id", customerID)
}

func mapPriceToPlan(sub stripe.Subscription) string {
	proMonthly := os.Getenv("STRIPE_PRO_MONTHLY_PRICE_ID")
	proYearly := os.Getenv("STRIPE_PRO_YEARLY_PRICE_ID")
	bizMonthly := os.Getenv("STRIPE_BUSINESS_MONTHLY_PRICE_ID")
	bizYearly := os.Getenv("STRIPE_BUSINESS_YEARLY_PRICE_ID")

	for _, item := range sub.Items.Data {
		if item.Price == nil {
			continue
		}
		switch item.Price.ID {
		case proMonthly, proYearly:
			return "pro"
		case bizMonthly, bizYearly:
			return "business"
		}
	}
	return ""
}

// r_context returns a background context for webhook handlers
// (webhooks don't have a request context available in sub-handlers)
func r_context() context.Context {
	return context.Background()
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
