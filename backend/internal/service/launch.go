package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/xiaobo/shipproof/internal/db"
)

type LaunchService struct {
	queries     *db.Queries
	planService *PlanService
	apiKey      string
	httpClient  *http.Client
}

func NewLaunchService(queries *db.Queries, planService *PlanService) *LaunchService {
	return &LaunchService{
		queries:     queries,
		planService: planService,
		apiKey:      os.Getenv("ANTHROPIC_API_KEY"),
		httpClient:  &http.Client{Timeout: 120 * time.Second},
	}
}

type GenerateRequest struct {
	ProductID        uuid.UUID `json:"product_id"`
	LaunchType       string    `json:"launch_type"`
	Platforms        []string  `json:"platforms"`
	RedditSubreddits []string  `json:"reddit_subreddits"`
	LaunchNotes      string    `json:"launch_notes"`
}

type GenerateResult struct {
	Draft db.LaunchDraft
}

func (s *LaunchService) Generate(ctx context.Context, req GenerateRequest, product db.Product, user db.User) (*GenerateResult, error) {
	// Plan limit check for generation
	if err := s.planService.CheckGenerationLimit(ctx, user.ID, user.Plan); err != nil {
		return nil, err
	}

	content, err := s.callClaudeAPI(ctx, req, product)
	if err != nil {
		return nil, fmt.Errorf("AI generation failed: %w", err)
	}

	platformsJSON, _ := json.Marshal(req.Platforms)
	contentJSON := json.RawMessage(content)

	draft, err := s.queries.UpsertDraft(ctx, db.UpsertDraftParams{
		ProductID:   req.ProductID,
		LaunchType:  db.LaunchType(req.LaunchType),
		Platforms:   platformsJSON,
		Content:     contentJSON,
		LaunchNotes: pgtype.Text{String: req.LaunchNotes, Valid: req.LaunchNotes != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to save draft: %w", err)
	}

	return &GenerateResult{Draft: draft}, nil
}

func (s *LaunchService) ConfirmVersion(ctx context.Context, productID uuid.UUID, title string, user db.User, timezoneOffset int) (*db.LaunchVersion, error) {
	// Plan limit check for versions
	if err := s.planService.CheckVersionLimit(ctx, productID, user.Plan); err != nil {
		return nil, err
	}

	draft, err := s.queries.GetDraftByProductID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("no draft found: %w", err)
	}

	maxNum, err := s.queries.GetMaxVersionNumber(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get max version number: %w", err)
	}
	nextNum := maxNum + 1

	// JS getTimezoneOffset() returns minutes *ahead* of UTC as negative,
	// e.g. UTC+8 → -480. We negate to get the Go offset.
	loc := time.FixedZone("client", -timezoneOffset*60)
	now := time.Now().In(loc)
	// Format: v{N}_{MMDDYYYYHHmm}
	versionLabel := fmt.Sprintf("v%d_%s",
		nextNum,
		now.Format("01022006")+now.Format("1504"),
	)

	version, err := s.queries.CreateVersion(ctx, db.CreateVersionParams{
		ProductID:     productID,
		VersionNumber: nextNum,
		VersionLabel:  versionLabel,
		Title:         title,
		LaunchType:    draft.LaunchType,
		Platforms:     draft.Platforms,
		Content:       draft.Content,
		LaunchNotes:   draft.LaunchNotes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create version: %w", err)
	}

	_ = s.queries.DeleteDraftByProductID(ctx, productID)

	return &version, nil
}

// RegenerateField regenerates a specific field/section within a platform.
type RegenerateFieldRequest struct {
	Platform  string `json:"platform"`   // e.g. "product_hunt", "reddit", "twitter", etc.
	Field     string `json:"field"`      // e.g. "description", "maker_comment", "first_comment", "body", "thread"
	Index     int    `json:"index"`      // for arrays: reddit post index, twitter tweet index (-1 if not applicable)
	Subreddit string `json:"subreddit"`  // for reddit: which subreddit
}

func (s *LaunchService) RegenerateField(ctx context.Context, req RegenerateFieldRequest, product db.Product, launchNotes string) (string, error) {
	systemPrompt := `You are an expert launch content writer for indie hackers and startup founders.
You will regenerate a SINGLE specific piece of content. Return ONLY the raw text content, no JSON wrapping, no markdown fences.`

	userPrompt := buildRegenerateFieldPrompt(req, product, launchNotes)

	body := claudeRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 2048,
		System:    systemPrompt,
		Messages:  []claudeMessage{{Role: "user", Content: userPrompt}},
	}

	bodyJSON, _ := json.Marshal(body)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyJSON))
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("x-api-key", s.apiKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")
	httpReq.Header.Set("content-type", "application/json")

	start := time.Now()
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		slog.Error("Claude API error (regenerate field)", "status", resp.StatusCode, "body", string(respBody))
		return "", fmt.Errorf("Claude API returned status %d", resp.StatusCode)
	}

	var claudeResp claudeResponse
	if err := json.Unmarshal(respBody, &claudeResp); err != nil {
		return "", err
	}

	slog.Info("Claude API call (regenerate field)",
		"prompt_tokens", claudeResp.Usage.InputTokens,
		"completion_tokens", claudeResp.Usage.OutputTokens,
		"duration_ms", time.Since(start).Milliseconds(),
	)

	if len(claudeResp.Content) == 0 {
		return "", fmt.Errorf("empty response from Claude")
	}

	return claudeResp.Content[0].Text, nil
}

func buildRegenerateFieldPrompt(req RegenerateFieldRequest, product db.Product, launchNotes string) string {
	name := product.Name
	url := ""
	if product.Url.Valid {
		url = product.Url.String
	}
	desc := ""
	if product.Description.Valid {
		desc = product.Description.String
	}

	productInfo := fmt.Sprintf("Product: %s\nURL: %s\nDescription: %s", name, url, desc)
	if launchNotes != "" {
		productInfo += fmt.Sprintf("\n\nLaunch Notes (use as primary context):\n%s", launchNotes)
	}

	switch req.Platform {
	case "product_hunt":
		switch req.Field {
		case "description":
			return fmt.Sprintf("%s\n\nRegenerate the Product Hunt description. Write 3-4 paragraphs covering problem → solution → key features → CTA. Friendly, personal, non-salesy.", productInfo)
		case "maker_comment":
			return fmt.Sprintf("%s\n\nRegenerate the Product Hunt maker comment. Write a personal story about why you built this + ask for feedback. Friendly, humble, authentic.", productInfo)
		}
	case "reddit":
		return fmt.Sprintf("%s\n\nRegenerate a Reddit post body for %s. Frame as sharing/discussion, avoid pure self-promotion. Markdown format, authentic voice.", productInfo, req.Subreddit)
	case "hackernews":
		return fmt.Sprintf("%s\n\nRegenerate the Hacker News first comment. Cover technical decisions and motivation. Honest, humble, no marketing language.", productInfo)
	case "twitter":
		return fmt.Sprintf("%s\n\nRegenerate a single tweet for a launch thread. Must be under 280 characters. Use emoji sparingly. Make it engaging.", productInfo)
	case "indiehackers":
		return fmt.Sprintf("%s\n\nRegenerate the IndieHackers post body. Share the building journey honestly, include learnings, ask for community feedback. Build-in-public style.", productInfo)
	}

	return fmt.Sprintf("%s\n\nRegenerate the %s %s content.", productInfo, req.Platform, req.Field)
}

type PlanLimitError struct {
	Message string
}

func (e *PlanLimitError) Error() string {
	return e.Message
}

// Claude API types

type claudeRequest struct {
	Model     string           `json:"model"`
	MaxTokens int              `json:"max_tokens"`
	System    string           `json:"system"`
	Messages  []claudeMessage  `json:"messages"`
}

type claudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type claudeResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
	StopReason string `json:"stop_reason"`
	Usage      struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

func (s *LaunchService) callClaudeAPI(ctx context.Context, req GenerateRequest, product db.Product) ([]byte, error) {
	systemPrompt := buildSystemPrompt(req.Platforms, req.RedditSubreddits)
	userPrompt := buildUserPrompt(req, product)

	body := claudeRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 16384,
		System:    systemPrompt,
		Messages: []claudeMessage{
			{Role: "user", Content: userPrompt},
		},
	}

	bodyJSON, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyJSON))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("x-api-key", s.apiKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")
	httpReq.Header.Set("content-type", "application/json")

	start := time.Now()
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("Claude API request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		slog.Error("Claude API error", "status", resp.StatusCode, "body", string(respBody))
		return nil, fmt.Errorf("Claude API returned status %d", resp.StatusCode)
	}

	var claudeResp claudeResponse
	if err := json.Unmarshal(respBody, &claudeResp); err != nil {
		return nil, fmt.Errorf("failed to parse Claude response: %w", err)
	}

	duration := time.Since(start)
	slog.Info("Claude API call",
		"prompt_tokens", claudeResp.Usage.InputTokens,
		"completion_tokens", claudeResp.Usage.OutputTokens,
		"duration_ms", duration.Milliseconds(),
	)

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from Claude")
	}

	if claudeResp.StopReason == "max_tokens" {
		slog.Warn("Claude response truncated",
			"output_tokens", claudeResp.Usage.OutputTokens,
		)
		return nil, fmt.Errorf("Claude response was truncated (used %d tokens), please try again with fewer platforms", claudeResp.Usage.OutputTokens)
	}

	text := claudeResp.Content[0].Text

	// Extract JSON from response (may be wrapped in ```json ... ```)
	jsonContent := extractJSON(text)

	// Validate it's valid JSON
	var check json.RawMessage
	if err := json.Unmarshal([]byte(jsonContent), &check); err != nil {
		// Log a snippet for debugging
		snippet := jsonContent
		if len(snippet) > 500 {
			snippet = snippet[:200] + "\n...\n" + snippet[len(snippet)-200:]
		}
		slog.Error("Claude returned invalid JSON",
			"error", err,
			"stop_reason", claudeResp.StopReason,
			"output_tokens", claudeResp.Usage.OutputTokens,
			"raw_length", len(text),
			"extracted_length", len(jsonContent),
			"snippet", snippet,
		)
		return nil, fmt.Errorf("Claude returned invalid JSON: %w", err)
	}

	return []byte(jsonContent), nil
}

func extractJSON(text string) string {
	// Find the first '{' and last '}' to extract the JSON object,
	// regardless of code fences or surrounding text.
	first := -1
	for i := 0; i < len(text); i++ {
		if text[i] == '{' {
			first = i
			break
		}
	}
	last := -1
	for i := len(text) - 1; i >= 0; i-- {
		if text[i] == '}' {
			last = i
			break
		}
	}
	if first >= 0 && last > first {
		return text[first : last+1]
	}
	return text
}

func buildSystemPrompt(platforms []string, subreddits []string) string {
	prompt := `You are an expert launch content writer for indie hackers and startup founders. You understand the culture, rules, and best practices of each platform.

Generate launch content in JSON format. Only include the platforms requested. Follow these rules strictly:

**Product Hunt:**
- title: Short, punchy, max 60 characters
- subtitle: One-line value proposition
- description: 3-4 paragraphs covering problem → solution → key features → CTA
- maker_comment: Personal story + why you built this + ask for feedback. Friendly, personal, non-salesy.

**Reddit:**
- Each subreddit gets its own entry in the array
- r/SaaS: Direct product introduction, title describes the pain point
- r/startups: Focus on journey and lessons learned
- r/sideproject: Show what you built + request feedback
- r/webdev: Technical angle, implementation details
- General: Avoid pure self-promotion, frame as sharing/discussion. No external links in title.
- title: Engaging, describes value or pain point
- body: Markdown format, authentic voice

**Hacker News (Show HN):**
- title: "Show HN: [Product Name] – [one-line description]"
- first_comment: Technical decisions, motivation, honest and humble tone. No marketing language.

**Twitter/X:**
- Generate a thread of 5-8 tweets
- Tweet 1: Hook + core value proposition
- Middle tweets: Feature highlights, build story, screenshot suggestions
- Last tweet: CTA + link placeholder
- Each tweet MUST be under 280 characters
- Use emoji sparingly

**IndieHackers:**
- title: Journey/build-in-public style
- body: Share the process honestly, include numbers if available, ask for community feedback

Return ONLY valid JSON, no other text.`

	return prompt
}

func buildUserPrompt(req GenerateRequest, product db.Product) string {
	name := product.Name
	url := ""
	if product.Url.Valid {
		url = product.Url.String
	}
	desc := ""
	if product.Description.Valid {
		desc = product.Description.String
	}
	descLong := ""
	if product.DescriptionLong.Valid {
		descLong = product.DescriptionLong.String
	}
	audience := ""
	if product.TargetAudience.Valid {
		audience = product.TargetAudience.String
	}

	platformStr := ""
	for _, p := range req.Platforms {
		platformStr += "- " + p + "\n"
	}

	subredditStr := ""
	if len(req.RedditSubreddits) > 0 {
		for _, sr := range req.RedditSubreddits {
			subredditStr += "  - " + sr + "\n"
		}
	}

	launchTypeLabel := map[string]string{
		"initial":        "Initial Launch",
		"feature_update": "Feature Update",
		"major_update":   "Major Update",
	}
	ltLabel := launchTypeLabel[req.LaunchType]
	if ltLabel == "" {
		ltLabel = req.LaunchType
	}

	launchNotes := ""
	if req.LaunchNotes != "" {
		launchNotes = req.LaunchNotes
	}

	prompt := fmt.Sprintf(`Generate launch content for the following product:

**Product Name:** %s
**Product URL:** %s
**Short Description:** %s
**Detailed Description:** %s
**Target Audience:** %s
**Launch Type:** %s

**Platforms to generate for:**
%s`, name, url, desc, descLong, audience, ltLabel, platformStr)

	if launchNotes != "" {
		prompt += fmt.Sprintf("\n**Launch Notes (IMPORTANT — use these as the primary context and talking points for all generated content):**\n%s\n", launchNotes)
	}

	if subredditStr != "" {
		prompt += fmt.Sprintf("\n**Reddit Subreddits:**\n%s", subredditStr)
	}

	prompt += `

Generate the JSON content with ONLY the requested platforms as keys. Use these exact key names: "product_hunt", "reddit", "hackernews", "twitter", "indiehackers".

For reddit, return an array of objects with "subreddit", "title", and "body" fields.
For twitter, return an object with a "thread" array of tweet strings.`

	// Add pgtype.Text helper
	_ = pgtype.Text{}

	return prompt
}
