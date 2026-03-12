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
  created_at: string;
  updated_at: string;
}

export interface LaunchDraft {
  id: string;
  product_id: string;
  launch_type: string;
  platforms: string[];
  content: Record<string, unknown>;
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
  created_at: string;
}

// --- Products ---

export function listProducts(token: string) {
  return fetchApi<Product[]>("/api/products", {}, token);
}

export function getProduct(id: string, token: string) {
  return fetchApi<Product>(`/api/products/${id}`, {}, token);
}

export function createProduct(
  data: { name: string; url?: string; description?: string },
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
) {
  return fetchApi<LaunchDraft>(
    `/api/products/${productId}/draft`,
    { method: "PUT", body: JSON.stringify({ content }) },
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

// --- Proof Types ---

type PgUUID = { Bytes: string; Valid: boolean };
type PgDate = { Time: string; Valid: boolean };

export interface Proof {
  id: string;
  product_id: string;
  status: string;
  collection_method: string;
  source_platform: string;
  source_url: PgText;
  content_type: string;
  content_text: PgText;
  content_image_url: PgText;
  author_name: string;
  author_title: PgText;
  author_avatar_url: PgText;
  proof_date: PgDate;
  linked_version_id: PgUUID;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
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
  created_at: string;
  updated_at: string;
}

export interface WallProof {
  id: string;
  wall_id: string;
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
    max_items: number;
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

export function fetchPublicWallProofs(slug: string) {
  return fetchApi<PublicWallResponse>(
    `/api/public/walls/${slug}/proofs`,
  );
}
