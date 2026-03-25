package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	slogbetterstack "github.com/samber/slog-betterstack"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/handler"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

func main() {
	_ = godotenv.Load()

	stdoutHandler := slog.NewJSONHandler(os.Stdout, nil)

	var logHandler slog.Handler
	bsToken := os.Getenv("BETTERSTACK_TOKEN")
	if bsToken != "" {
		bsHandler := slogbetterstack.Option{
			Token: bsToken,
		}.NewBetterstackHandler()
		logHandler = fanoutHandler{handlers: []slog.Handler{stdoutHandler, bsHandler}}
	} else {
		logHandler = stdoutHandler
	}

	logger := slog.New(logHandler)
	slog.SetDefault(logger)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	var queries *db.Queries
	if dbURL != "" {
		pool, err := pgxpool.New(context.Background(), dbURL)
		if err != nil {
			slog.Error("failed to connect to database", "error", err)
			os.Exit(1)
		}
		defer pool.Close()

		if err := pool.Ping(context.Background()); err != nil {
			slog.Error("failed to ping database", "error", err)
			os.Exit(1)
		}
		slog.Info("connected to database")
		queries = db.New(pool)
	} else {
		slog.Warn("DATABASE_URL not set, running without database")
	}

	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(middleware.CORS()))

	// Public routes
	r.Get("/api/health", handler.Health)

	if queries != nil {
		webhookHandler := handler.NewWebhookHandler(queries)
		userService := service.NewUserService(queries)
		planService := service.NewPlanService(queries)
		productHandler := handler.NewProductHandler(queries, userService, planService)
		launchService := service.NewLaunchService(queries, planService)
		launchHandler := handler.NewLaunchHandler(queries, launchService, userService)

		// Storage service (graceful: nil if R2 not configured)
		storageService, _ := service.NewStorageService()

		extractService := service.NewProofExtractService()
		proofHandler := handler.NewProofHandler(queries, userService, storageService, planService, extractService)
		widgetHandler := handler.NewWidgetHandler(queries, userService, planService)
		wallHandler := handler.NewWallHandler(queries, userService, planService)
		spaceHandler := handler.NewSpaceHandler(queries, userService, planService)
		publicHandler := handler.NewPublicHandler(queries)
		analyticsHandler := handler.NewAnalyticsHandler(queries, userService)
		adminHandler := handler.NewAdminHandler(queries)
		// Stripe config: prod + optional sandbox
		prodConfig := handler.StripeConfig{
			SecretKey:              os.Getenv("STRIPE_SECRET_KEY"),
			WebhookSecret:          os.Getenv("STRIPE_WEBHOOK_SECRET"),
			ProMonthlyPriceID:      os.Getenv("STRIPE_PRO_MONTHLY_PRICE_ID"),
			ProYearlyPriceID:       os.Getenv("STRIPE_PRO_YEARLY_PRICE_ID"),
			BusinessMonthlyPriceID: os.Getenv("STRIPE_BUSINESS_MONTHLY_PRICE_ID"),
			BusinessYearlyPriceID:  os.Getenv("STRIPE_BUSINESS_YEARLY_PRICE_ID"),
		}

		var sandboxConfig *handler.StripeConfig
		if sk := os.Getenv("STRIPE_SANDBOX_SECRET_KEY"); sk != "" {
			sandboxConfig = &handler.StripeConfig{
				SecretKey:              sk,
				WebhookSecret:          os.Getenv("STRIPE_SANDBOX_WEBHOOK_SECRET"),
				ProMonthlyPriceID:      os.Getenv("STRIPE_SANDBOX_PRO_MONTHLY_PRICE_ID"),
				ProYearlyPriceID:       os.Getenv("STRIPE_SANDBOX_PRO_YEARLY_PRICE_ID"),
				BusinessMonthlyPriceID: os.Getenv("STRIPE_SANDBOX_BUSINESS_MONTHLY_PRICE_ID"),
				BusinessYearlyPriceID:  os.Getenv("STRIPE_SANDBOX_BUSINESS_YEARLY_PRICE_ID"),
			}
		}

		sandboxEmails := parseEmails(os.Getenv("SANDBOX_USER_EMAILS"))
		stripeHandler := handler.NewStripeHandler(queries, userService, prodConfig, sandboxConfig, sandboxEmails)
		userHandler := handler.NewUserHandler(userService, prodConfig, sandboxConfig, sandboxEmails)

		r.Post("/api/webhooks/clerk", webhookHandler.HandleClerkWebhook)
		r.Post("/api/webhooks/stripe", stripeHandler.HandleWebhook)

		// Public API routes (no auth)
		r.Get("/api/public/products/{slug}/proofs", publicHandler.GetProductProofs)
		r.Get("/api/public/walls/{slug}/proofs", publicHandler.GetWallProofs)
		r.Get("/api/public/spaces/{slug}/proofs", publicHandler.GetSpaceProofs)
		r.Post("/api/public/views", publicHandler.RecordView)
		r.Post("/api/analytics/pageview", adminHandler.RecordPageView)

		settingsHandler := handler.NewSettingsHandler(queries, userService)

		// Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthWithApiKey(queries))

			// User
			r.Get("/api/user/me", userHandler.GetCurrentUser)

			// Settings (API Key)
			r.Get("/api/settings/api-key", settingsHandler.GetApiKeyStatus)
			r.Post("/api/settings/api-key", settingsHandler.GenerateApiKey)
			r.Delete("/api/settings/api-key", settingsHandler.DeleteApiKey)

			// Stripe
			r.Post("/api/stripe/create-checkout", stripeHandler.CreateCheckout)
			r.Post("/api/stripe/create-portal", stripeHandler.CreatePortal)
			r.Get("/api/stripe/subscription-status", stripeHandler.GetSubscriptionStatus)
			r.Post("/api/stripe/reactivate", stripeHandler.ReactivateSubscription)

			// Products
			r.Get("/api/products", productHandler.List)
			r.Post("/api/products", productHandler.Create)
			r.Get("/api/products/{id}", productHandler.Get)
			r.Put("/api/products/{id}", productHandler.Update)
			r.Delete("/api/products/{id}", productHandler.Delete)

			// Launch Content
			r.Post("/api/products/{id}/generate", launchHandler.Generate)
			r.Post("/api/products/{id}/regenerate-field", launchHandler.RegenerateField)
			r.Get("/api/products/{id}/draft", launchHandler.GetDraft)
			r.Put("/api/products/{id}/draft", launchHandler.SaveDraft)
			r.Delete("/api/products/{id}/draft", launchHandler.DeleteDraft)
			r.Post("/api/products/{id}/confirm", launchHandler.ConfirmVersion)
			r.Get("/api/products/{id}/versions", launchHandler.ListVersions)
			r.Get("/api/products/{id}/versions/{vid}", launchHandler.GetVersion)
			r.Delete("/api/products/{id}/versions/{vid}", launchHandler.DeleteVersion)

			// Proofs
			r.Post("/api/products/{id}/proofs", proofHandler.Create)
			r.Get("/api/products/{id}/proofs", proofHandler.List)
			r.Get("/api/proofs/{pid}", proofHandler.Get)
			r.Put("/api/proofs/{pid}", proofHandler.Update)
			r.Delete("/api/proofs/{pid}", proofHandler.Delete)
			r.Put("/api/proofs/{pid}/approve", proofHandler.Approve)
			r.Put("/api/proofs/{pid}/featured", proofHandler.ToggleFeatured)
			r.Put("/api/proofs/{pid}/order", proofHandler.UpdateOrder)
			r.Get("/api/products/{id}/tags", proofHandler.ListProductTags)
			r.Post("/api/proofs/{pid}/tags", proofHandler.AddTag)
			r.Delete("/api/proofs/{pid}/tags/{tag}", proofHandler.RemoveTag)
			r.Post("/api/proofs/extract-screenshot", proofHandler.ExtractScreenshot)
			r.Post("/api/upload/avatar", proofHandler.UploadAvatar)

			// Widget Config
			r.Get("/api/products/{id}/widget", widgetHandler.Get)
			r.Put("/api/products/{id}/widget", widgetHandler.Update)

			// Walls
			r.Get("/api/products/{id}/walls", wallHandler.List)
			r.Post("/api/products/{id}/walls", wallHandler.Create)
			r.Get("/api/walls/{wid}", wallHandler.Get)
			r.Put("/api/walls/{wid}", wallHandler.Update)
			r.Put("/api/walls/{wid}/config", wallHandler.UpdateConfig)
			r.Delete("/api/walls/{wid}", wallHandler.Delete)
			r.Get("/api/walls/{wid}/proofs", wallHandler.ListProofs)
			r.Post("/api/walls/{wid}/proofs", wallHandler.AddProof)
			r.Delete("/api/walls/{wid}/proofs/{pid}", wallHandler.RemoveProof)
			r.Put("/api/walls/{wid}/proofs/order", wallHandler.UpdateProofOrder)

			// Analytics
			r.Get("/api/analytics/views", analyticsHandler.GetViews)

			// Admin routes (requires admin middleware)
			r.Group(func(r chi.Router) {
				r.Use(middleware.AdminOnly(queries))
				r.Get("/api/admin/stats", adminHandler.GetStats)
				r.Get("/api/admin/analytics", adminHandler.GetAnalytics)
				r.Get("/api/admin/users", adminHandler.ListUsers)
				r.Get("/api/admin/recent-signups", adminHandler.RecentSignups)
			})

			// Spaces
			r.Get("/api/products/{id}/spaces", spaceHandler.List)
			r.Post("/api/products/{id}/spaces", spaceHandler.Create)
			r.Get("/api/spaces/{sid}", spaceHandler.Get)
			r.Put("/api/spaces/{sid}", spaceHandler.Update)
			r.Put("/api/spaces/{sid}/config", spaceHandler.UpdateConfig)
			r.Delete("/api/spaces/{sid}", spaceHandler.Delete)
			r.Get("/api/spaces/{sid}/proofs", spaceHandler.ListProofs)
			r.Post("/api/spaces/{sid}/proofs", spaceHandler.AddProof)
			r.Delete("/api/spaces/{sid}/proofs/{pid}", spaceHandler.RemoveProof)
			r.Put("/api/spaces/{sid}/proofs/order", spaceHandler.UpdateProofOrder)
		})
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		slog.Info("server starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server shutdown failed", "error", err)
	}

	slog.Info("server stopped")
}

// fanoutHandler sends each log record to multiple slog.Handler destinations.
type fanoutHandler struct {
	handlers []slog.Handler
}

func (f fanoutHandler) Enabled(ctx context.Context, level slog.Level) bool {
	for _, h := range f.handlers {
		if h.Enabled(ctx, level) {
			return true
		}
	}
	return false
}

func (f fanoutHandler) Handle(ctx context.Context, record slog.Record) error {
	for _, h := range f.handlers {
		if h.Enabled(ctx, record.Level) {
			_ = h.Handle(ctx, record)
		}
	}
	return nil
}

func (f fanoutHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	handlers := make([]slog.Handler, len(f.handlers))
	for i, h := range f.handlers {
		handlers[i] = h.WithAttrs(attrs)
	}
	return fanoutHandler{handlers: handlers}
}

func (f fanoutHandler) WithGroup(name string) slog.Handler {
	handlers := make([]slog.Handler, len(f.handlers))
	for i, h := range f.handlers {
		handlers[i] = h.WithGroup(name)
	}
	return fanoutHandler{handlers: handlers}
}

// parseEmails splits a comma-separated email list into a set.
func parseEmails(s string) map[string]bool {
	emails := make(map[string]bool)
	for _, e := range strings.Split(s, ",") {
		e = strings.TrimSpace(e)
		if e != "" {
			emails[e] = true
		}
	}
	return emails
}
