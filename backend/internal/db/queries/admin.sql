-- name: ListUsersAdmin :many
SELECT
  u.id, u.clerk_id, u.email, u.name, u.plan, u.is_admin, u.created_at,
  COUNT(DISTINCT p.id)::int AS product_count,
  COUNT(DISTINCT pr.id)::int AS proof_count
FROM users u
LEFT JOIN products p ON p.user_id = u.id
LEFT JOIN proofs pr ON pr.product_id = p.id
WHERE u.is_admin = false
  AND (u.name ILIKE '%' || @search::text || '%' OR u.email ILIKE '%' || @search::text || '%' OR @search::text = '')
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
FROM users
WHERE is_admin = false;

-- name: RecordPageView :exec
INSERT INTO page_views (path, referrer, user_agent, utm_source, utm_medium, utm_campaign)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetTotalPageViews :one
SELECT COUNT(*)::int AS total FROM page_views
WHERE path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%';

-- name: GetTodayPageViews :one
SELECT COUNT(*)::int AS total FROM page_views
WHERE created_at >= CURRENT_DATE
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%';

-- name: GetPeriodPageViews :one
SELECT COUNT(*)::int AS total FROM page_views
WHERE created_at > now() - @period::interval
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%';

-- name: GetPageViewsByDay :many
SELECT
  date_trunc('day', created_at)::date AS date,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%'
GROUP BY date
ORDER BY date;

-- name: GetTopPages :many
SELECT path, COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%'
GROUP BY path
ORDER BY views DESC
LIMIT 10;

-- name: GetTopReferrers :many
SELECT
  COALESCE(NULLIF(referrer, ''), '(direct)') AS referrer,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%'
  AND (referrer IS NULL OR referrer = '' OR (
    referrer NOT LIKE '%/dashboard%'
    AND referrer NOT LIKE '%vercel.app%'
  ))
GROUP BY referrer
ORDER BY views DESC
LIMIT 10;

-- name: GetTopUTMSources :many
SELECT
  utm_source,
  COUNT(*)::int AS views
FROM page_views
WHERE created_at > now() - @period::interval
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%'
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
  AND path NOT LIKE '/dashboard%' AND path NOT LIKE '/admin%'
  AND (utm_source IS NOT NULL AND utm_source != '')
GROUP BY utm_source, utm_campaign
ORDER BY views DESC
LIMIT 20;

-- name: CountUsersAdmin :one
SELECT COUNT(*)::int AS total
FROM users
WHERE is_admin = false
  AND (name ILIKE '%' || @search::text || '%' OR email ILIKE '%' || @search::text || '%' OR @search::text = '');

-- name: GetRecentSignups :many
SELECT id, clerk_id, email, name, created_at
FROM users
WHERE is_admin = false
  AND created_at > now() - interval '7 days'
ORDER BY created_at DESC;

-- name: GetTotalProducts :one
SELECT COUNT(*)::int AS total
FROM products
WHERE user_id NOT IN (SELECT id FROM users WHERE is_admin = true);

-- name: GetTotalProofs :one
SELECT COUNT(*)::int AS total
FROM proofs
WHERE product_id IN (
  SELECT p.id FROM products p
  JOIN users u ON u.id = p.user_id
  WHERE u.is_admin = false
);

-- name: IsUserAdmin :one
SELECT is_admin FROM users WHERE clerk_id = $1;
