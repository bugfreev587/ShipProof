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

export interface Product {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  url: { String: string; Valid: boolean };
  description: { String: string; Valid: boolean };
  created_at: string;
  updated_at: string;
}

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
  data: { name: string; url?: string; description?: string },
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
