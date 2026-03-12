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

export function confirmVersion(
  productId: string,
  title: string,
  token: string,
) {
  return fetchApi<LaunchVersion>(
    `/api/products/${productId}/confirm`,
    { method: "POST", body: JSON.stringify({ title }) },
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
