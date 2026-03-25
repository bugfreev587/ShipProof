package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	db "github.com/xiaobo/shipproof/internal/db"
)

// PlanLimits defines the limits for each plan tier.
type PlanLimits struct {
	MaxProducts       int  // -1 = unlimited
	MaxProofs         int  // per product; -1 = unlimited
	MaxGenerations    int  // per month; -1 = unlimited
	MaxVersions       int  // per product; -1 = unlimited
	MaxSpaces         int  // per product; 0 = none, -1 = unlimited
	MaxWalls          int  // per product; -1 = unlimited
	MaxEmbeds         int  // per product; -1 = unlimited
	MaxPendingProofs  int  // per product pending queue; -1 = unlimited
	CanRemoveBranding bool
}

// LimitsFor returns the plan limits for a given plan.
func LimitsFor(plan db.UserPlan) PlanLimits {
	switch plan {
	case db.UserPlanPro:
		return PlanLimits{
			MaxProducts:       1,
			MaxProofs:         -1,
			MaxGenerations:    -1,
			MaxVersions:       -1,
			MaxSpaces:         1,
			MaxWalls:          -1,
			MaxEmbeds:         3,
			MaxPendingProofs:  50,
			CanRemoveBranding: false,
		}
	case db.UserPlanBusiness:
		return PlanLimits{
			MaxProducts:       10,
			MaxProofs:         -1,
			MaxGenerations:    -1,
			MaxVersions:       -1,
			MaxSpaces:         10,
			MaxWalls:          -1,
			MaxEmbeds:         -1,
			MaxPendingProofs:  -1,
			CanRemoveBranding: true,
		}
	default: // free
		return PlanLimits{
			MaxProducts:       1,
			MaxProofs:         5,
			MaxGenerations:    -1, // free — AI generation is now unlimited
			MaxVersions:       3,
			MaxSpaces:         1,
			MaxWalls:          1,
			MaxEmbeds:         1,
			MaxPendingProofs:  10,
			CanRemoveBranding: false,
		}
	}
}

type PlanService struct {
	queries *db.Queries
}

func NewPlanService(queries *db.Queries) *PlanService {
	return &PlanService{queries: queries}
}

func (s *PlanService) CheckProductLimit(ctx context.Context, userID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxProducts < 0 {
		return nil
	}
	count, err := s.queries.CountProductsByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to check product limit: %w", err)
	}
	if int(count) >= limits.MaxProducts {
		return &PlanLimitError{
			Message: fmt.Sprintf("Product limit reached (%d). Upgrade your plan to create more products.", limits.MaxProducts),
		}
	}
	return nil
}

func (s *PlanService) CheckProofLimit(ctx context.Context, productID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxProofs < 0 {
		return nil
	}
	count, err := s.queries.CountProofsByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("failed to check proof limit: %w", err)
	}
	if int(count) >= limits.MaxProofs {
		return &PlanLimitError{
			Message: fmt.Sprintf("Proof limit reached (%d per product). Upgrade to Pro for unlimited proofs.", limits.MaxProofs),
		}
	}
	return nil
}

func (s *PlanService) CheckGenerationLimit(ctx context.Context, userID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxGenerations < 0 {
		return nil
	}
	count, err := s.queries.CountDraftsThisMonth(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to check generation limit: %w", err)
	}
	if int(count) >= limits.MaxGenerations {
		return &PlanLimitError{
			Message: "Monthly generation limit reached. Upgrade to Pro for unlimited generations.",
		}
	}
	return nil
}

func (s *PlanService) CheckVersionLimit(ctx context.Context, productID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxVersions < 0 {
		return nil
	}
	count, err := s.queries.CountVersionsByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("failed to check version count: %w", err)
	}
	if int(count) >= limits.MaxVersions {
		return &PlanLimitError{
			Message: "Version limit reached. Upgrade to Pro for unlimited versions.",
		}
	}
	return nil
}

func (s *PlanService) CheckSpaceLimit(ctx context.Context, productID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxSpaces < 0 {
		return nil
	}
	if limits.MaxSpaces == 0 {
		return &PlanLimitError{
			Message: "Spaces is a Pro feature. Upgrade to create embed spaces.",
		}
	}
	count, err := s.queries.CountSpacesByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("failed to check space limit: %w", err)
	}
	if int(count) >= limits.MaxSpaces {
		return &PlanLimitError{
			Message: fmt.Sprintf("Space limit reached (%d). Upgrade your plan to create more spaces.", limits.MaxSpaces),
		}
	}
	return nil
}

func (s *PlanService) CheckWallLimit(ctx context.Context, productID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxWalls < 0 {
		return nil
	}
	count, err := s.queries.CountWallsByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("failed to check wall limit: %w", err)
	}
	if int(count) >= limits.MaxWalls {
		return &PlanLimitError{
			Message: fmt.Sprintf("Wall limit reached (%d). Upgrade to Pro for unlimited walls.", limits.MaxWalls),
		}
	}
	return nil
}

func (s *PlanService) CheckEmbedLimit(ctx context.Context, productID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxEmbeds < 0 {
		return nil
	}
	count, err := s.queries.CountEmbedsByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("failed to check embed limit: %w", err)
	}
	if int(count) >= limits.MaxEmbeds {
		return &PlanLimitError{
			Message: fmt.Sprintf("Embed limit reached (%d). Upgrade your plan to create more embeds.", limits.MaxEmbeds),
		}
	}
	return nil
}

func (s *PlanService) CheckPendingProofLimit(ctx context.Context, productID uuid.UUID, plan db.UserPlan) error {
	limits := LimitsFor(plan)
	if limits.MaxPendingProofs < 0 {
		return nil
	}
	count, err := s.queries.CountPendingProofsByProduct(ctx, productID)
	if err != nil {
		return fmt.Errorf("failed to check pending proof limit: %w", err)
	}
	if int(count) >= limits.MaxPendingProofs {
		return &PlanLimitError{
			Message: "Pending queue is full. Approve or reject existing submissions first.",
		}
	}
	return nil
}

func (s *PlanService) ForceShowBranding(plan db.UserPlan) bool {
	return !LimitsFor(plan).CanRemoveBranding
}
