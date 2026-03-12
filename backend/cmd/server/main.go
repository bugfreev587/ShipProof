package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	db "github.com/xiaobo/shipproof/internal/db"
	"github.com/xiaobo/shipproof/internal/handler"
	"github.com/xiaobo/shipproof/internal/middleware"
	"github.com/xiaobo/shipproof/internal/service"
)

func main() {
	_ = godotenv.Load()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
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
		productHandler := handler.NewProductHandler(queries, userService)
		launchService := service.NewLaunchService(queries)
		launchHandler := handler.NewLaunchHandler(queries, launchService, userService)

		// Storage service (graceful: nil if R2 not configured)
		storageService, _ := service.NewStorageService()

		proofHandler := handler.NewProofHandler(queries, userService, storageService)
		widgetHandler := handler.NewWidgetHandler(queries, userService)
		wallHandler := handler.NewWallHandler(queries, userService)
		publicHandler := handler.NewPublicHandler(queries)

		r.Post("/api/webhooks/clerk", webhookHandler.HandleClerkWebhook)

		// Public API routes (no auth)
		r.Get("/api/public/products/{slug}/proofs", publicHandler.GetProductProofs)
		r.Get("/api/public/walls/{slug}/proofs", publicHandler.GetWallProofs)

		// Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth)

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
			r.Post("/api/products/{id}/confirm", launchHandler.ConfirmVersion)
			r.Get("/api/products/{id}/versions", launchHandler.ListVersions)
			r.Get("/api/products/{id}/versions/{vid}", launchHandler.GetVersion)

			// Proofs
			r.Post("/api/products/{id}/proofs", proofHandler.Create)
			r.Get("/api/products/{id}/proofs", proofHandler.List)
			r.Put("/api/proofs/{pid}", proofHandler.Update)
			r.Delete("/api/proofs/{pid}", proofHandler.Delete)
			r.Put("/api/proofs/{pid}/featured", proofHandler.ToggleFeatured)
			r.Put("/api/proofs/{pid}/order", proofHandler.UpdateOrder)
			r.Post("/api/proofs/{pid}/tags", proofHandler.AddTag)
			r.Delete("/api/proofs/{pid}/tags/{tag}", proofHandler.RemoveTag)

			// Widget Config
			r.Get("/api/products/{id}/widget", widgetHandler.Get)
			r.Put("/api/products/{id}/widget", widgetHandler.Update)

			// Walls
			r.Get("/api/products/{id}/walls", wallHandler.List)
			r.Post("/api/products/{id}/walls", wallHandler.Create)
			r.Get("/api/walls/{wid}", wallHandler.Get)
			r.Put("/api/walls/{wid}", wallHandler.Update)
			r.Delete("/api/walls/{wid}", wallHandler.Delete)
			r.Post("/api/walls/{wid}/proofs", wallHandler.AddProof)
			r.Delete("/api/walls/{wid}/proofs/{pid}", wallHandler.RemoveProof)
			r.Put("/api/walls/{wid}/proofs/order", wallHandler.UpdateProofOrder)
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
