package middleware

import (
	"net/http"

	db "github.com/xiaobo/shipproof/internal/db"
)

// AdminOnly middleware checks that the authenticated user has is_admin = true.
// Must be used after the Auth middleware so that the user_id is in context.
func AdminOnly(queries *db.Queries) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clerkID := GetClerkUserID(r.Context())
			if clerkID == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			isAdmin, err := queries.IsUserAdmin(r.Context(), clerkID)
			if err != nil || !isAdmin {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
