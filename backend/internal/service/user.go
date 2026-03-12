package service

import (
	"context"

	db "github.com/xiaobo/shipproof/internal/db"
)

type UserService struct {
	queries *db.Queries
}

func NewUserService(queries *db.Queries) *UserService {
	return &UserService{queries: queries}
}

// EnsureUser gets or creates a user by clerk_id.
// This handles the case where the webhook hasn't synced the user yet.
func (s *UserService) EnsureUser(ctx context.Context, clerkID string) (db.User, error) {
	user, err := s.queries.GetUserByClerkID(ctx, clerkID)
	if err == nil {
		return user, nil
	}

	// User not found — create with placeholder email.
	// The webhook will update with real data later.
	user, err = s.queries.UpsertUserByClerkID(ctx, db.UpsertUserByClerkIDParams{
		ClerkID: clerkID,
		Email:   clerkID + "@placeholder.local",
		Name:    "",
	})
	return user, err
}
