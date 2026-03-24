-- name: ListUsersAdmin :many
SELECT
  u.id, u.clerk_id, u.email, u.name, u.plan, u.is_admin, u.created_at,
  COUNT(DISTINCT p.id)::int AS product_count,
  COUNT(DISTINCT pr.id)::int AS proof_count
FROM users u
LEFT JOIN products p ON p.user_id = u.id
LEFT JOIN proofs pr ON pr.product_id = p.id
WHERE (u.name ILIKE '%' || @search::text || '%' OR u.email ILIKE '%' || @search::text || '%' OR @search::text = '')
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT @limit_val::int OFFSET @offset_val::int;

-- name: GetUserStats :one
SELECT
  COUNT(*)::int AS total_users,
  COUNT(*) FILTER (WHERE plan IN ('pro', 'business'))::int AS paid_users,
  COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_users,
  COUNT(*) FILTER (WHERE plan = 'business')::int AS business_users,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS signups_this_week,
  COUNT(*) FILTER (WHERE plan IN ('pro', 'business') AND created_at > now() - interval '7 days')::int AS paid_this_week
FROM users;

-- name: RecordPageView :exec
INSERT INTO page_views (path, referrer, user_agent, utm_source, utm_medium, utm_campaign)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetTotalPageViews :one
SELECT COUNT(*)::int AS total FROM page_views;

-- name: GetTodayPageViews :one
SELECT COUNT(*)::int AS total FROM page_views WHERE created_at >= CURRENT_DATE;

-- name: GetPeriodPageViews :one
SELECT COUNT(*)::int AS total FROM page_views WHERE created_at > now() - @period::interval;

-- name: GetPageViewsByDay :many
SELECT
  date_trunc('day', created_at)::date AS date,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
GROUP BY date
ORDER BY date;

-- name: GetTopPages :many
SELECT path, COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
GROUP BY path
ORDER BY views DESC
LIMIT 10;

-- name: GetTopReferrers :many
SELECT
  COALESCE(NULLIF(referrer, ''), '(direct)') AS referrer,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
GROUP BY referrer
ORDER BY views DESC
LIMIT 10;

-- name: GetTopUTMSources :many
SELECT
  utm_source,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
  AND utm_source IS NOT NULL AND utm_source != ''
GROUP BY utm_source
ORDER BY views DESC
LIMIT 10;

-- name: GetUTMCampaigns :many
SELECT
  COALESCE(NULLIF(utm_source, ''), '(none)') AS utm_source,
  COALESCE(NULLIF(utm_campaign, ''), '(none)') AS utm_campaign,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
  AND (utm_source IS NOT NULL AND utm_source != '')
GROUP BY utm_source, utm_campaign
ORDER BY views DESC
LIMIT 20;

-- name: CountUsersAdmin :one
SELECT COUNT(*)::int AS total
FROM users
WHERE (name ILIKE '%' || @search::text || '%' OR email ILIKE '%' || @search::text || '%' OR @search::text = '');

-- name: GetRecentSignups :many
SELECT id, clerk_id, email, name, created_at
FROM users
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;

-- name: GetTotalProducts :one
SELECT COUNT(*)::int AS total FROM products;

-- name: GetTotalProofs :one
SELECT COUNT(*)::int AS total FROM proofs;

-- name: IsUserAdmin :one
SELECT is_admin FROM users WHERE clerk_id = $1;
