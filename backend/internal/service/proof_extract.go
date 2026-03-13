package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
)

type ProofExtractService struct {
	apiKey     string
	httpClient *http.Client
}

func NewProofExtractService() *ProofExtractService {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return nil
	}
	return &ProofExtractService{
		apiKey:     apiKey,
		httpClient: &http.Client{},
	}
}

type ExtractResult struct {
	AuthorName  string `json:"author_name"`
	AuthorTitle string `json:"author_title"`
	ContentText string `json:"content_text"`
	Platform    string `json:"platform"`
}

// Vision API request types (different from launch.go's text-only types)

type visionContentBlock struct {
	Type      string              `json:"type"`
	Text      string              `json:"text,omitempty"`
	Source    *visionImageSource  `json:"source,omitempty"`
	MediaType string              `json:"media_type,omitempty"`
}

type visionImageSource struct {
	Type      string `json:"type"`
	MediaType string `json:"media_type"`
	Data      string `json:"data"`
}

type visionRequest struct {
	Model     string           `json:"model"`
	MaxTokens int              `json:"max_tokens"`
	Messages  []visionMessage  `json:"messages"`
}

type visionMessage struct {
	Role    string               `json:"role"`
	Content []visionContentBlock `json:"content"`
}

func (s *ProofExtractService) ExtractFromScreenshot(ctx context.Context, imageBytes []byte, mediaType string) (*ExtractResult, error) {
	b64Data := base64.StdEncoding.EncodeToString(imageBytes)

	body := visionRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 1024,
		Messages: []visionMessage{
			{
				Role: "user",
				Content: []visionContentBlock{
					{
						Type: "image",
						Source: &visionImageSource{
							Type:      "base64",
							MediaType: mediaType,
							Data:      b64Data,
						},
					},
					{
						Type: "text",
						Text: `Extract the following from this screenshot of a social media post or testimonial:

1. author_name: The name or username of the person who wrote this
2. author_title: Their title, role, or bio description (if visible)
3. content_text: The main text content of the post/comment/testimonial
4. platform: One of: product_hunt, reddit, twitter, hackernews, indiehackers, direct, other

Respond with ONLY valid JSON, no markdown formatting:
{"author_name": "...", "author_title": "...", "content_text": "...", "platform": "..."}

If a field is not visible, use an empty string.`,
					},
				},
			},
		},
	}

	bodyJSON, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyJSON))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", s.apiKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		slog.Error("Claude Vision API error", "status", resp.StatusCode, "body", string(respBody))
		return nil, fmt.Errorf("Claude API returned status %d", resp.StatusCode)
	}

	var claudeResp claudeResponse
	if err := json.Unmarshal(respBody, &claudeResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	slog.Info("Claude Vision API call",
		"prompt_tokens", claudeResp.Usage.InputTokens,
		"completion_tokens", claudeResp.Usage.OutputTokens,
	)

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from Claude")
	}

	var result ExtractResult
	if err := json.Unmarshal([]byte(claudeResp.Content[0].Text), &result); err != nil {
		return nil, fmt.Errorf("parse extraction result: %w", err)
	}

	return &result, nil
}
