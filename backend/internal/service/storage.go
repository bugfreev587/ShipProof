package service

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type StorageService struct {
	client       *s3.Client
	bucket       string
	publicDomain string
}

func NewStorageService() (*StorageService, error) {
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKey := os.Getenv("R2_ACCESS_KEY_ID")
	secretKey := os.Getenv("R2_SECRET_ACCESS_KEY")
	bucket := os.Getenv("R2_BUCKET_NAME")
	publicDomain := os.Getenv("R2_PUBLIC_DOMAIN")

	if accountID == "" || accessKey == "" || secretKey == "" || bucket == "" {
		slog.Warn("R2 env vars not configured, storage uploads disabled")
		return nil, nil
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	client := s3.New(s3.Options{
		Region:      "auto",
		Credentials: credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		BaseEndpoint: &endpoint,
	})

	return &StorageService{
		client:       client,
		bucket:       bucket,
		publicDomain: publicDomain,
	}, nil
}

var allowedExtensions = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
}

const maxFileSize = 5 * 1024 * 1024 // 5MB

func (s *StorageService) UploadAvatar(ctx context.Context, filename string, reader io.Reader, size int64) (string, error) {
	if s == nil {
		return "", fmt.Errorf("storage service not configured")
	}

	if size > maxFileSize {
		return "", fmt.Errorf("file too large, max 5MB")
	}

	ext := strings.ToLower(filepath.Ext(filename))
	contentType, ok := allowedExtensions[ext]
	if !ok {
		return "", fmt.Errorf("unsupported file format, allowed: jpg, png, webp, gif")
	}

	key := fmt.Sprintf("avatars/%s%s", uuid.New().String(), ext)

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("upload failed: %w", err)
	}

	domain := strings.TrimPrefix(s.publicDomain, "https://")
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimRight(domain, "/")
	publicURL := fmt.Sprintf("https://%s/%s", domain, key)
	return publicURL, nil
}

func (s *StorageService) UploadImage(ctx context.Context, productID uuid.UUID, filename string, reader io.Reader, size int64) (string, error) {
	if s == nil {
		return "", fmt.Errorf("storage service not configured")
	}

	if size > maxFileSize {
		return "", fmt.Errorf("file too large, max 5MB")
	}

	ext := strings.ToLower(filepath.Ext(filename))
	contentType, ok := allowedExtensions[ext]
	if !ok {
		return "", fmt.Errorf("unsupported file format, allowed: jpg, png, webp, gif")
	}

	key := fmt.Sprintf("proofs/%s/%s%s", productID.String(), uuid.New().String(), ext)

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("upload failed: %w", err)
	}

	domain := strings.TrimPrefix(s.publicDomain, "https://")
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimRight(domain, "/")
	publicURL := fmt.Sprintf("https://%s/%s", domain, key)
	return publicURL, nil
}
