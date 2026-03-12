-- name: GetUserByClerkID :one
SELECT * FROM users WHERE clerk_id = $1;

-- name: CreateUser :one
INSERT INTO users (clerk_id, email, name, avatar_url)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET email = $2, name = $3, avatar_url = $4, updated_at = now()
WHERE clerk_id = $1
RETURNING *;

-- name: UpdateUserPlan :one
UPDATE users
SET plan = $2, stripe_customer_id = $3, stripe_subscription_id = $4, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: UpsertUserByClerkID :one
INSERT INTO users (clerk_id, email, name)
VALUES ($1, $2, $3)
ON CONFLICT (clerk_id) DO UPDATE
SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = now()
RETURNING *;

-- name: GetUserByStripeCustomerID :one
SELECT * FROM users WHERE stripe_customer_id = $1;

-- name: CountProductsByUserID :one
SELECT COUNT(*) FROM products WHERE user_id = $1;
