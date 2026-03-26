const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error || "Unknown error");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// --- Types ---

type PgText = { String: string; Valid: boolean };

export interface Product {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  url: PgText;
  description: PgText;
  description_long: PgText;
  target_audience: PgText;
  logo_url: PgText;
  created_at: string;
  updated_at: string;
}

export interface LaunchDraft {
  id: string;
  product_id: string;
  launch_type: string;
  platforms: string[];
  content: Record<string, unknown>;
  launch_notes: PgText;
  created_at: string;
  updated_at: string;
}

export interface LaunchVersion {
  id: string;
  product_id: string;
  version_number: number;
  version_label: string;
  title: string;
  launch_type: string;
  platforms: string[];
  content?: Record<string, unknown>;
  launch_notes: PgText;
  created_at: string;
}

// --- User ---

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  avatar_url: PgText;
  plan: "free" | "pro" | "business";
  is_admin: boolean;
  stripe_customer_id: PgText;
  stripe_subscription_id: PgText;
  pro_trial_used: boolean;
  business_trial_used: boolean;
  created_at: string;
  updated_at: string;
  stripe_prices?: {
    pro_monthly: string;
    pro_yearly: string;
    business_monthly: string;
    business_yearly: string;
  };
}

export function getCurrentUser(token: string) {
  return fetchApi<User>("/api/user/me", {}, token);
}

// --- API Key ---

export function getApiKeyStatus(token: string) {
  return fetchApi<{ has_key: boolean }>("/api/settings/api-key", {}, token);
}

export function generateApiKey(token: string) {
  return fetchApi<{ api_key: string }>(
    "/api/settings/api-key",
    { method: "POST" },
    token,
  );
}

export function deleteApiKey(token: string) {
  return fetchApi<void>(
    "/api/settings/api-key",
    { method: "DELETE" },
    token,
  );
}

export function createCheckoutSession(
  data: { price_id: string; plan: string },
  token: string,
) {
  return fetchApi<{ url: string }>(
    "/api/stripe/create-checkout",
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export function createBillingPortalSession(token: string) {
  return fetchApi<{ url: string }>(
    "/api/stripe/create-portal",
    { method: "POST" },
    token,
  );
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  status?: string;
  cancel_at_period_end: boolean;
  current_period_end: number | null;
  trial_end?: number | null;
}

export function getSubscriptionStatus(token: string) {
  return fetchApi<SubscriptionStatus>(
    "/api/stripe/subscription-status",
    {},
    token,
  );
}

export function reactivateSubscription(token: string) {
  return fetchApi<{ status: string }>(
    "/api/stripe/reactivate",
    { method: "POST" },
    token,
  );
}

// --- Products ---

export function listProducts(token: string) {
  return fetchApi<Product[]>("/api/products", {}, token);
}

export function getProduct(id: string, token: string) {
  return fetchApi<Product>(`/api/products/${id}`, {}, token);
}

export function createProduct(
  data: { name: string; url?: string; description?: string; logo_url?: string },
  token: string,
) {
  return fetchApi<Product>(
    "/api/products",
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export function updateProduct(
  id: string,
  data: {
    name: string;
    url?: string;
    description?: string;
    description_long?: string;
    target_audience?: string;
    logo_url?: string;
  },
  token: string,
) {
  return fetchApi<Product>(
    `/api/products/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    token,
  );
}

export function deleteProduct(id: string, token: string) {
  return fetchApi<void>(
    `/api/products/${id}`,
    { method: "DELETE" },
    token,
  );
}

// --- Launch Content ---

export function generateLaunchContent(
  productId: string,
  data: {
    launch_type: string;
    platforms: string[];
    reddit_subreddits?: string[];
    launch_notes?: string;
  },
  token: string,
) {
  return fetchApi<LaunchDraft>(
    `/api/products/${productId}/generate`,
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export function getDraft(productId: string, token: string) {
  return fetchApi<{ draft: LaunchDraft | null }>(
    `/api/products/${productId}/draft`,
    {},
    token,
  );
}

export function saveDraft(
  productId: string,
  content: Record<string, unknown>,
  token: string,
  platforms?: string[],
) {
  return fetchApi<LaunchDraft | void>(
    `/api/products/${productId}/draft`,
    { method: "PUT", body: JSON.stringify({ content, platforms }) },
    token,
  );
}

export function deleteDraft(productId: string, token: string) {
  return fetchApi<void>(
    `/api/products/${productId}/draft`,
    { method: "DELETE" },
    token,
  );
}

export function regenerateField(
  productId: string,
  data: {
    platform: string;
    field: string;
    index?: number;
    subreddit?: string;
  },
  token: string,
) {
  return fetchApi<{ text: string }>(
    `/api/products/${productId}/regenerate-field`,
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export function confirmVersion(
  productId: string,
  title: string,
  token: string,
) {
  return fetchApi<LaunchVersion>(
    `/api/products/${productId}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        timezone_offset: new Date().getTimezoneOffset(),
      }),
    },
    token,
  );
}

export function listVersions(productId: string, token: string) {
  return fetchApi<LaunchVersion[]>(
    `/api/products/${productId}/versions`,
    {},
    token,
  );
}

export function getVersion(
  productId: string,
  versionId: string,
  token: string,
) {
  return fetchApi<LaunchVersion>(
    `/api/products/${productId}/versions/${versionId}`,
    {},
    token,
  );
}

export function deleteVersion(
  productId: string,
  versionId: string,
  token: string,
) {
  return fetchApi<void>(
    `/api/products/${productId}/versions/${versionId}`,
    { method: "DELETE" },
    token,
  );
}

// --- Proof Types ---

type PgUUID = { Bytes: string; Valid: boolean };
type PgDate = { Time: string; Valid: boolean };

export interface Proof {
  id: string;
  product_id: string;
  status: string;
  collection_method: string;
  source_platform: string;
  source_url: string | null;
  content_type: string;
  content_text: string | null;
  content_image_url: string | null;
  author_name: string;
  author_title: string | null;
  author_avatar_url: string | null;
  proof_date: string | null;
  linked_version_id: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  author_email?: string;
  author_handle?: string;
  rating?: number;
  video_url?: string;
}

export interface ProofTag {
  id: string;
  proof_id: string;
  tag: string;
}

export interface Wall {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  theme: string;
  border_radius: number;
  card_spacing: number;
  show_platform_icon: boolean;
  show_branding: boolean;
  bg_color: string;
  transparent_bg: boolean;
  header_text_color: string;
  subtitle: string;
  show_header: boolean;
  layout: string;
  created_at: string;
  updated_at: string;
}

export interface WallProof {
  id: string;
  wall_id: string;
  proof_id: string;
  display_order: number;
}

export interface Space {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  theme: string;
  show_platform_icon: boolean;
  border_radius: number;
  card_spacing: number;
  show_branding: boolean;
  visible_count: number;
  card_size: number;
  card_height: number;
  text_font_size: number;
  text_font: string;
  text_bold: boolean;
  bg_color: string;
  bg_opacity: number;
  layout: string;
  rows: number;
  width_percent: number;
  created_at: string;
  updated_at: string;
}

export interface SpaceProof {
  id: string;
  space_id: string;
  proof_id: string;
  display_order: number;
}

export interface WidgetConfig {
  id: string;
  product_id: string;
  theme: string;
  max_items: number;
  show_platform_icon: boolean;
  border_radius: number;
  card_spacing: number;
  show_branding: boolean;
  layout: string;
  created_at: string;
  updated_at: string;
}

// --- Proofs ---

export function listProofs(productId: string, token: string) {
  return fetchApi<Proof[]>(`/api/products/${productId}/proofs`, {}, token);
}

export function createProof(productId: string, data: FormData, token: string) {
  return fetch(`${API_URL}/api/products/${productId}/proofs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: data,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new ApiError(res.status, body.error || "Unknown error");
    }
    return res.json() as Promise<Proof>;
  });
}

export function createProofJson(
  productId: string,
  data: {
    source_platform?: string;
    source_url?: string;
    content_type?: string;
    content_text?: string;
    content_image_url?: string;
    author_name: string;
    author_title?: string;
    author_avatar_url?: string;
    linked_version_id?: string;
    tags?: string[];
  },
  token: string,
) {
  return fetchApi<Proof>(
    `/api/products/${productId}/proofs`,
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export function updateProof(
  proofId: string,
  data: {
    content_text?: string;
    content_image_url?: string;
    author_name: string;
    author_title?: string;
    author_avatar_url?: string;
    source_platform?: string;
    source_url?: string;
    linked_version_id?: string;
  },
  token: string,
) {
  return fetchApi<Proof>(
    `/api/proofs/${proofId}`,
    { method: "PUT", body: JSON.stringify(data) },
    token,
  );
}

export function getProof(proofId: string, token: string) {
  return fetchApi<Proof>(`/api/proofs/${proofId}`, {}, token);
}

export function approveProof(proofId: string, token: string) {
  return fetchApi<Proof>(
    `/api/proofs/${proofId}/approve`,
    { method: "PUT" },
    token,
  );
}

export function deleteProof(proofId: string, token: string) {
  return fetchApi<void>(`/api/proofs/${proofId}`, { method: "DELETE" }, token);
}

export function toggleProofFeatured(proofId: string, token: string) {
  return fetchApi<Proof>(
    `/api/proofs/${proofId}/featured`,
    { method: "PUT" },
    token,
  );
}

export function updateProofOrder(
  proofId: string,
  displayOrder: number,
  token: string,
) {
  return fetchApi<void>(
    `/api/proofs/${proofId}/order`,
    { method: "PUT", body: JSON.stringify({ display_order: displayOrder }) },
    token,
  );
}

export function addProofTag(proofId: string, tag: string, token: string) {
  return fetchApi<ProofTag>(
    `/api/proofs/${proofId}/tags`,
    { method: "POST", body: JSON.stringify({ tag }) },
    token,
  );
}

export function removeProofTag(proofId: string, tag: string, token: string) {
  return fetchApi<void>(
    `/api/proofs/${proofId}/tags/${encodeURIComponent(tag)}`,
    { method: "DELETE" },
    token,
  );
}

// --- Screenshot Extraction ---

export interface ExtractResult {
  author_name: string;
  author_title: string;
  content_text: string;
  platform: string;
}

export function extractScreenshot(
  file: File,
  token: string,
): Promise<ExtractResult> {
  const formData = new FormData();
  formData.append("image", file);
  return fetch(`${API_URL}/api/proofs/extract-screenshot`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new ApiError(res.status, body.error || "Unknown error");
    }
    return res.json() as Promise<ExtractResult>;
  });
}

export async function uploadAvatar(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch(`${API_URL}/api/upload/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new ApiError(res.status, body.error || "Upload failed");
  }
  const data = await res.json();
  return data.url;
}

export function listProductTags(productId: string, token: string) {
  return fetchApi<string[]>(
    `/api/products/${productId}/tags`,
    {},
    token,
  );
}

// --- Widget Config ---

export function getWidgetConfig(productId: string, token: string) {
  return fetchApi<WidgetConfig>(
    `/api/products/${productId}/widget`,
    {},
    token,
  );
}

export function updateWidgetConfig(
  productId: string,
  data: {
    theme: string;
    show_platform_icon: boolean;
    border_radius: number;
    card_spacing: number;
    show_branding: boolean;
  },
  token: string,
) {
  return fetchApi<WidgetConfig>(
    `/api/products/${productId}/widget`,
    { method: "PUT", body: JSON.stringify(data) },
    token,
  );
}

// --- Walls ---

export function listWalls(productId: string, token: string) {
  return fetchApi<Wall[]>(`/api/products/${productId}/walls`, {}, token);
}

export function createWall(
  productId: string,
  name: string,
  token: string,
) {
  return fetchApi<Wall>(
    `/api/products/${productId}/walls`,
    { method: "POST", body: JSON.stringify({ name }) },
    token,
  );
}

export function getWall(wallId: string, token: string) {
  return fetchApi<Wall>(`/api/walls/${wallId}`, {}, token);
}

export function updateWall(wallId: string, name: string, token: string) {
  return fetchApi<Wall>(
    `/api/walls/${wallId}`,
    { method: "PUT", body: JSON.stringify({ name }) },
    token,
  );
}

export function deleteWall(wallId: string, token: string) {
  return fetchApi<void>(`/api/walls/${wallId}`, { method: "DELETE" }, token);
}

export function updateWallConfig(
  wallId: string,
  config: {
    theme: string;
    border_radius: number;
    card_spacing: number;
    show_platform_icon: boolean;
    show_branding: boolean;
    bg_color: string;
    transparent_bg: boolean;
    header_text_color: string;
    subtitle: string;
    show_header: boolean;
    layout: string;
  },
  token: string,
) {
  return fetchApi<Wall>(`/api/walls/${wallId}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  }, token);
}

export function listWallProofs(wallId: string, token: string) {
  return fetchApi<Proof[]>(`/api/walls/${wallId}/proofs`, {}, token);
}

export function addProofToWall(
  wallId: string,
  proofId: string,
  displayOrder: number,
  token: string,
) {
  return fetchApi<WallProof>(
    `/api/walls/${wallId}/proofs`,
    {
      method: "POST",
      body: JSON.stringify({ proof_id: proofId, display_order: displayOrder }),
    },
    token,
  );
}

export function removeProofFromWall(
  wallId: string,
  proofId: string,
  token: string,
) {
  return fetchApi<void>(
    `/api/walls/${wallId}/proofs/${proofId}`,
    { method: "DELETE" },
    token,
  );
}

export function updateWallProofOrder(
  wallId: string,
  orders: { proof_id: string; display_order: number }[],
  token: string,
) {
  return fetchApi<void>(
    `/api/walls/${wallId}/proofs/order`,
    { method: "PUT", body: JSON.stringify({ orders }) },
    token,
  );
}

// --- Spaces ---

export function listSpaces(productId: string, token: string) {
  return fetchApi<Space[]>(`/api/products/${productId}/spaces`, {}, token);
}

export function createSpace(productId: string, name: string, token: string) {
  return fetchApi<Space>(
    `/api/products/${productId}/spaces`,
    { method: "POST", body: JSON.stringify({ name }) },
    token,
  );
}

export function getSpace(spaceId: string, token: string) {
  return fetchApi<Space>(`/api/spaces/${spaceId}`, {}, token);
}

export function updateSpace(spaceId: string, name: string, token: string) {
  return fetchApi<Space>(
    `/api/spaces/${spaceId}`,
    { method: "PUT", body: JSON.stringify({ name }) },
    token,
  );
}

export function updateSpaceConfig(
  spaceId: string,
  data: {
    theme: string;
    show_platform_icon: boolean;
    border_radius: number;
    card_spacing: number;
    show_branding: boolean;
    visible_count: number;
    card_size: number;
    card_height?: number;
    text_font_size: number;
    text_font: string;
    text_bold: boolean;
    bg_color: string;
    bg_opacity: number;
    layout: string;
    rows: number;
    width_percent: number;
  },
  token: string,
) {
  return fetchApi<Space>(
    `/api/spaces/${spaceId}/config`,
    { method: "PUT", body: JSON.stringify(data) },
    token,
  );
}

export function deleteSpace(spaceId: string, token: string) {
  return fetchApi<void>(`/api/spaces/${spaceId}`, { method: "DELETE" }, token);
}

export function listSpaceProofs(spaceId: string, token: string) {
  return fetchApi<(Proof & { space_display_order: number })[]>(
    `/api/spaces/${spaceId}/proofs`,
    {},
    token,
  );
}

export function addProofToSpace(
  spaceId: string,
  proofId: string,
  displayOrder: number,
  token: string,
) {
  return fetchApi<SpaceProof>(
    `/api/spaces/${spaceId}/proofs`,
    {
      method: "POST",
      body: JSON.stringify({ proof_id: proofId, display_order: displayOrder }),
    },
    token,
  );
}

export function removeProofFromSpace(
  spaceId: string,
  proofId: string,
  token: string,
) {
  return fetchApi<void>(
    `/api/spaces/${spaceId}/proofs/${proofId}`,
    { method: "DELETE" },
    token,
  );
}

// --- Public (no auth) ---

export interface PublicProofsResponse {
  product: Product;
  proofs: Proof[];
  widget: WidgetConfig;
}

export interface PublicWallResponse {
  wall: Wall;
  product: Product;
  proofs: (Proof & { wall_display_order: number })[];
}

export function fetchPublicProofs(slug: string) {
  return fetchApi<PublicProofsResponse>(
    `/api/public/products/${slug}/proofs`,
  );
}

export interface PublicSpaceResponse {
  space: {
    theme: string;
    show_platform_icon: boolean;
    border_radius: number;
    card_spacing: number;
    show_branding: boolean;
    visible_count: number;
    card_size: number;
    card_height: number;
    text_font_size: number;
    text_font: string;
    text_bold: boolean;
    bg_color: string;
    bg_opacity: number;
  };
  product: Product;
  proofs: (Proof & { space_display_order: number })[];
}

export function fetchPublicSpaceProofs(slug: string) {
  return fetchApi<PublicSpaceResponse>(
    `/api/public/spaces/${slug}/proofs`,
  );
}

export function fetchPublicWallProofs(slug: string) {
  return fetchApi<PublicWallResponse>(
    `/api/public/walls/${slug}/proofs`,
  );
}

// --- Admin ---

export interface AdminStats {
  total_users: number;
  paid_users: number;
  pro_users: number;
  business_users: number;
  mrr: number;
  mrr_change_this_week: number;
  total_products: number;
  total_proofs: number;
  total_page_views: number;
  total_page_views_today: number;
  signups_this_week: number;
  paid_this_week: number;
  plan_distribution: { free: number; pro: number; business: number };
}

export interface AdminAnalytics {
  summary: { total_views: number; today_views: number; period_views: number };
  by_day: { date: string; views: number }[];
  by_page: { path: string; views: number }[];
  top_referrers: { referrer: string; views: number }[];
  top_utm_sources: { utm_source: string; views: number }[];
  utm_campaigns: { utm_source: string; utm_campaign: string; views: number }[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  plan: string;
  is_admin: boolean;
  product_count: number;
  proof_count: number;
  created_at: string;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRecentSignup {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export function getAdminStats(token: string) {
  return fetchApi<AdminStats>("/api/admin/stats", {}, token);
}

export function getAdminAnalytics(token: string, period = "7d") {
  return fetchApi<AdminAnalytics>(
    `/api/admin/analytics?period=${period}`,
    {},
    token,
  );
}

export function getAdminUsers(
  token: string,
  page = 1,
  limit = 20,
  search = "",
) {
  return fetchApi<AdminUsersResponse>(
    `/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    {},
    token,
  );
}

export function getAdminRecentSignups(token: string) {
  return fetchApi<AdminRecentSignup[]>(
    "/api/admin/recent-signups",
    {},
    token,
  );
}

// --- View Analytics ---

export function recordView(entityType: "space" | "wall", slug: string) {
  return fetch(`${API_URL}/api/public/views`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity_type: entityType, slug }),
  }).catch(() => {});
}

export interface ViewAnalytics {
  space_views: number;
  wall_views: number;
  space_breakdown: { entity_id: string; entity_name: string; view_count: number }[];
  wall_breakdown: { entity_id: string; entity_name: string; view_count: number }[];
}

export function getAnalytics(token: string) {
  return fetchApi<ViewAnalytics>("/api/analytics/views", {}, token);
}

// --- Proof Page Types ---

export interface ProofPageConfig {
  proof_page_title: string;
  proof_page_subtitle: string;
  proof_page_theme: string;
  proof_page_show_form: boolean;
  proof_page_form_heading: string;
  proof_page_show_branding: boolean;
}

export interface PublicProofPageData {
  product: {
    id: string;
    name: string;
    slug: string;
    url: string | null;
    description: string | null;
    logo_url: string | null;
  };
  config: {
    proof_page_title: string;
    proof_page_subtitle: string;
    proof_page_theme: string;
    proof_page_show_form: boolean;
    proof_page_form_heading: string;
    proof_page_show_branding: boolean;
  };
  proofs: Proof[];
}

export interface SubmitProofRequest {
  author_name: string;
  author_email: string;
  author_handle?: string;
  author_title?: string;
  content_text: string;
  rating?: number;
  source_platform?: string;
  content_image_url?: string;
  honeypot_field?: string;
}

export interface SubmitProofResponse {
  success: boolean;
  message: string;
}

// --- Proof Page ---

export function fetchPublicProofPage(slug: string) {
  return fetchApi<PublicProofPageData>(
    `/api/public/products/${slug}/proof-page`,
  );
}

export function getProofPageConfig(productId: string, token: string) {
  return fetchApi<ProofPageConfig>(
    `/api/products/${productId}/proof-page`,
    {},
    token,
  );
}

export function updateProofPageConfig(productId: string, config: ProofPageConfig, token: string) {
  return fetchApi<void>(
    `/api/products/${productId}/proof-page`,
    { method: "PUT", body: JSON.stringify(config) },
    token,
  );
}

export function listProofPageProofs(productId: string, token: string) {
  return fetchApi<Proof[]>(
    `/api/products/${productId}/proof-page/proofs`,
    {},
    token,
  );
}

export function addProofToProofPage(productId: string, proofId: string, displayOrder: number, token: string) {
  return fetchApi<void>(
    `/api/products/${productId}/proof-page/proofs`,
    { method: "POST", body: JSON.stringify({ proof_id: proofId, display_order: displayOrder }) },
    token,
  );
}

export function removeProofFromProofPage(productId: string, proofId: string, token: string) {
  return fetchApi<void>(
    `/api/products/${productId}/proof-page/proofs/${proofId}`,
    { method: "DELETE" },
    token,
  );
}

export function reorderProofPageProofs(productId: string, orders: { proof_id: string; display_order: number }[], token: string) {
  return fetchApi<void>(
    `/api/products/${productId}/proof-page/proofs/order`,
    { method: "PUT", body: JSON.stringify({ orders }) },
    token,
  );
}

export function rejectProof(proofId: string, token: string) {
  return fetchApi<Proof>(
    `/api/proofs/${proofId}/reject`,
    { method: "PUT" },
    token,
  );
}

export function submitPublicProof(slug: string, data: SubmitProofRequest) {
  return fetchApi<SubmitProofResponse>(
    `/api/public/products/${slug}/submit-proof`,
    { method: "POST", body: JSON.stringify(data) },
  );
}
