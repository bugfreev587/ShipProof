package middleware

import (
	"os"
	"strings"

	"github.com/go-chi/cors"
)

func CORS() cors.Options {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Support comma-separated origins for multiple environments
	origins := strings.Split(frontendURL, ",")
	for i, o := range origins {
		origins[i] = strings.TrimSpace(o)
	}

	return cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}
}
