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
	prompt := `You are an expert at writing authentic, platform-native content for product launches. You deeply understand the culture, tone, and unwritten rules of each platform.

Generate launch content in JSON format. Only include the platforms requested.

CRITICAL RULES:
1. Every post must read like a real person wrote it — not like AI-generated marketing copy.
2. Content must comply with each platform's self-promotion rules. Posts that get flagged, warned, or removed are a FAILURE.
3. Lead with story, experience, or insight — NOT with the product.
4. The product should emerge naturally from the narrative, never be the opening pitch.
5. Avoid: feature lists as the main content, marketing buzzwords, "check it out" CTAs, excessive bullet points.
6. Include: personal context, honest numbers, lessons learned, genuine questions to the community.
7. Every generation should feel unique and personal, not templated.

PLATFORM-SPECIFIC RULES:

=== Reddit ===
Reddit communities HATE self-promotion. Posts that look like ads get removed.

Content must be 70% valuable content (experience, lessons, insights) and 30% product mention.
- title: Interesting hook about your experience or lesson — NEVER the product name
- body: Open with personal context, share what you learned or struggled with, mention the product naturally as part of your story, end with a genuine question to the community
- The product URL must NEVER appear in the body. Users can find it in your profile.
- Markdown format, authentic conversational voice

Subreddit-specific tone:
- r/SaaS: Share your SaaS journey, lessons, honest numbers. Product mention OK within a valuable story.
- r/startups: Focus on founder journey, pivots, decisions. Less about the product, more about the process.
- r/sideproject: Show what you built + ask for genuine feedback. More product-focused but still needs personal story.
- r/webdev: Technical angle, interesting implementation decisions. Minimal product promotion.

Each subreddit gets its own entry in the array with "subreddit", "title", and "body" fields.

=== Hacker News (Show HN) ===
HN values technical substance and intellectual honesty. Marketing language is instantly punished.

- title: "Show HN: [Name] – [factual one-line description]" — no superlatives, no emoji
- first_comment: Explain WHY you built it (personal motivation), technical decisions and tradeoffs, what's interesting technically, what you want feedback on. Tone: like explaining to a smart colleague.

NEVER include: pricing, competitor comparisons, marketing language ("game-changer", "powerful", "all-in-one", "10x"), customer testimonials, "Happy to answer questions!"

=== Product Hunt ===
PH is the most marketing-friendly platform, but authenticity still wins.

- title: Clear value prop, under 60 characters
- subtitle: One-line value proposition
- description: 2-3 paragraphs. Problem → solution → how it works. Frame features as user benefits.
- maker_comment: This is where you get personal. Share your story, your background, why you built this. Be vulnerable about challenges. Ask for SPECIFIC feedback. This should feel like a friend telling you about their project.

=== Twitter/X ===
Twitter rewards personality and story. Pure product announcements get low engagement.

Generate a "thread" array of 5-8 tweet strings.
- Tweet 1: Hook — personal story or surprising insight (NO product link, NO product name)
- Tweet 2-3: Context — what you were struggling with, what you learned
- Tweet 4-5: The product enters naturally as part of the story
- Tweet 6-7: Interesting details — tech stack, build process, honest metrics
- Last tweet: Soft CTA — "link in bio" or "reply if you want to try it"

Each tweet MUST be under 280 characters. Conversational tone, no corporate language. Max 1-2 emoji per tweet. No hashtags except optionally #buildinpublic in the last tweet. NEVER put a URL in the first tweet.

=== IndieHackers ===
IH is the most forgiving for product mentions, but build-in-public style performs best.

- title: Journey/build-in-public style
- body: Share your journey (background, timeline), be transparent with numbers (even if zero), explain decisions and why, what's working and what's not, end with a real question for the community

IH readers love: honest metrics, technical details, pivot stories, "what I'd do differently"
IH readers hate: polished marketing copy, vague claims, no substance

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

	prompt := fmt.Sprintf(`PRODUCT BACKGROUND:
- Name: %s
- URL: %s
- One-line: %s
- Detailed: %s
- Target audience: %s

THIS LAUNCH:
- Type: %s
`, name, url, desc, descLong, audience, ltLabel)

	if launchNotes != "" {
		prompt += fmt.Sprintf("- Maker's notes (USE THIS AS PRIMARY CONTEXT — personal background, key points, metrics):\n%s\n", launchNotes)
	}

	prompt += fmt.Sprintf("\nGENERATE FOR:\n%s", platformStr)

	if subredditStr != "" {
		prompt += fmt.Sprintf("\nReddit Subreddits:\n%s", subredditStr)
	}

	prompt += `
IMPORTANT REMINDERS:
- Reddit: Story-first, product-second. NO product URL in post body. Title must NOT contain the product name. Each post must feel like genuine community participation, not promotion.
- HN: Technical, humble, no marketing language whatsoever. No pricing, no superlatives.
- Twitter: Personal hook first tweet (no product name, no URL). Product enters naturally mid-thread.
- PH: Maker comment must feel genuine and personal — like telling a friend, not pitching an investor.
- IH: Transparent journey post with real numbers and honest reflections.

Generate ONLY the requested platforms as JSON keys. Use these exact key names: "product_hunt", "reddit", "hackernews", "twitter", "indiehackers".

For reddit, return an array of objects with "subreddit", "title", and "body" fields.
For twitter, return an object with a "thread" array of tweet strings.

Write as a real indie hacker sharing their genuine experience — not as a marketer selling a product.`

	// Add pgtype.Text helper
	_ = pgtype.Text{}

	return prompt
}
