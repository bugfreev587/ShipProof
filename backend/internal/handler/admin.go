package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
)

type AdminHandler struct {
	queries *db.Queries
}

func NewAdminHandler(queries *db.Queries) *AdminHandler {
	return &AdminHandler{queries: queries}
}

// parsePeriod converts "7d", "30d", "all" into a pgtype.Interval.
func parsePeriod(s string) pgtype.Interval {
	switch s {
	case "30d":
		return pgtype.Interval{Days: 30, Valid: true}
	case "all":
		return pgtype.Interval{Days: 3650, Valid: true} // ~10 years
	default: // "7d"
		return pgtype.Interval{Days: 7, Valid: true}
	}
}

func pgtextFromPtr(s *string) pgtype.Text {
	if s == nil || *s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// POST /api/analytics/pageview — public, no auth
func (h *AdminHandler) RecordPageView(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path        string  `json:"path"`
		Referrer    *string `json:"referrer"`
		UserAgent   *string `json:"user_agent"`
		UTMSource   *string `json:"utm_source"`
		UTMMedium   *string `json:"utm_medium"`
		UTMCampaign *string `json:"utm_campaign"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Path == "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	_ = h.queries.RecordPageView(r.Context(), db.RecordPageViewParams{
		Path:        req.Path,
		Referrer:    pgtextFromPtr(req.Referrer),
		UserAgent:   pgtextFromPtr(req.UserAgent),
		UtmSource:   pgtextFromPtr(req.UTMSource),
		UtmMedium:   pgtextFromPtr(req.UTMMedium),
		UtmCampaign: pgtextFromPtr(req.UTMCampaign),
	})

	w.WriteHeader(http.StatusNoContent)
}

// GET /api/admin/stats
func (h *AdminHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	userStats, err := h.queries.GetUserStats(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to get user stats"}`, http.StatusInternalServerError)
		return
	}

	todayViews, _ := h.queries.GetTodayPageViews(r.Context())
	totalViews, _ := h.queries.GetTotalPageViews(r.Context())
	totalProducts, _ := h.queries.GetTotalProducts(r.Context())
	totalProofs, _ := h.queries.GetTotalProofs(r.Context())

	// MRR calculation: Pro=$12, Business=$29
	mrr := int(userStats.ProUsers)*12 + int(userStats.BusinessUsers)*29
	mrrChange := int(userStats.PaidThisWeek) * 12 // rough estimate

	resp := map[string]interface{}{
		"total_users":           userStats.TotalUsers,
		"paid_users":            userStats.PaidUsers,
		"pro_users":             userStats.ProUsers,
		"business_users":        userStats.BusinessUsers,
		"mrr":                   mrr,
		"mrr_change_this_week":  mrrChange,
		"total_products":        totalProducts,
		"total_proofs":          totalProofs,
		"total_page_views":      totalViews,
		"total_page_views_today": todayViews,
		"signups_this_week":     userStats.SignupsThisWeek,
		"paid_this_week":        userStats.PaidThisWeek,
		"plan_distribution": map[string]int32{
			"free":     userStats.TotalUsers - userStats.PaidUsers,
			"pro":      userStats.ProUsers,
			"business": userStats.BusinessUsers,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GET /api/admin/analytics?period=7d
func (h *AdminHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	period := parsePeriod(r.URL.Query().Get("period"))

	totalViews, _ := h.queries.GetTotalPageViews(r.Context())
	todayViews, _ := h.queries.GetTodayPageViews(r.Context())
	periodViews, _ := h.queries.GetPeriodPageViews(r.Context(), period)

	byDay, _ := h.queries.GetPageViewsByDay(r.Context(), period)
	topPages, _ := h.queries.GetTopPages(r.Context(), period)
	topReferrers, _ := h.queries.GetTopReferrers(r.Context(), period)
	topUTM, _ := h.queries.GetTopUTMSources(r.Context(), period)
	utmCampaigns, _ := h.queries.GetUTMCampaigns(r.Context(), period)

	// Format by_day
	dayData := make([]map[string]interface{}, 0, len(byDay))
	for _, d := range byDay {
		date := ""
		if d.Date.Valid {
			date = d.Date.Time.Format("2006-01-02")
		}
		dayData = append(dayData, map[string]interface{}{
			"date":  date,
			"views": d.Views,
		})
	}

	// Format top pages
	pageData := make([]map[string]interface{}, 0, len(topPages))
	for _, p := range topPages {
		pageData = append(pageData, map[string]interface{}{
			"path":  p.Path,
			"views": p.Views,
		})
	}

	// Format referrers
	refData := make([]map[string]interface{}, 0, len(topReferrers))
	for _, r := range topReferrers {
		refData = append(refData, map[string]interface{}{
			"referrer": r.Referrer,
			"views":    r.Views,
		})
	}

	// Format UTM sources
	utmData := make([]map[string]interface{}, 0, len(topUTM))
	for _, u := range topUTM {
		src := ""
		if u.UtmSource.Valid {
			src = u.UtmSource.String
		}
		utmData = append(utmData, map[string]interface{}{
			"utm_source": src,
			"views":      u.Views,
		})
	}

	// Format UTM campaigns
	campaignData := make([]map[string]interface{}, 0, len(utmCampaigns))
	for _, c := range utmCampaigns {
		campaignData = append(campaignData, map[string]interface{}{
			"utm_source":   c.UtmSource,
			"utm_campaign": c.UtmCampaign,
			"views":        c.Views,
		})
	}

	resp := map[string]interface{}{
		"summary": map[string]interface{}{
			"total_views":  totalViews,
			"today_views":  todayViews,
			"period_views": periodViews,
		},
		"by_day":          dayData,
		"by_page":         pageData,
		"top_referrers":   refData,
		"top_utm_sources": utmData,
		"utm_campaigns":   campaignData,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GET /api/admin/users?search=&page=1&limit=20
func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	users, err := h.queries.ListUsersAdmin(r.Context(), db.ListUsersAdminParams{
		Search:    search,
		OffsetVal: int32(offset),
		LimitVal:  int32(limit),
	})
	if err != nil {
		http.Error(w, `{"error":"failed to list users"}`, http.StatusInternalServerError)
		return
	}

	total, _ := h.queries.CountUsersAdmin(r.Context(), search)

	type userRow struct {
		ID           string `json:"id"`
		Email        string `json:"email"`
		Name         string `json:"name"`
		Plan         string `json:"plan"`
		IsAdmin      bool   `json:"is_admin"`
		ProductCount int32  `json:"product_count"`
		ProofCount   int32  `json:"proof_count"`
		CreatedAt    string `json:"created_at"`
	}

	rows := make([]userRow, 0, len(users))
	for _, u := range users {
		rows = append(rows, userRow{
			ID:           u.ID.String(),
			Email:        u.Email,
			Name:         u.Name,
			Plan:         string(u.Plan),
			IsAdmin:      u.IsAdmin,
			ProductCount: u.ProductCount,
			ProofCount:   u.ProofCount,
			CreatedAt:    u.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	resp := map[string]interface{}{
		"users": rows,
		"total": total,
		"page":  page,
		"limit": limit,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GET /api/admin/recent-signups
func (h *AdminHandler) RecentSignups(w http.ResponseWriter, r *http.Request) {
	signups, err := h.queries.GetRecentSignups(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to get recent signups"}`, http.StatusInternalServerError)
		return
	}

	type row struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		CreatedAt string `json:"created_at"`
	}

	rows := make([]row, 0, len(signups))
	for _, s := range signups {
		rows = append(rows, row{
			ID:        s.ID.String(),
			Email:     s.Email,
			Name:      s.Name,
			CreatedAt: s.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rows)
}
