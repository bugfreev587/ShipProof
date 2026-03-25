const API_URL = "https://api.shipproof.io";
// const API_URL = "http://localhost:8080";

export interface Product {
  id: string;
  name: string;
  slug: string;
}

export interface Proof {
  id: string;
  product_id: string;
  content_type: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

async function sendToBackground(msg: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: ApiResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || "Request failed"));
      }
    });
  });
}

export async function fetchProducts(apiKey: string): Promise<Product[]> {
  return sendToBackground({
    type: "API_REQUEST",
    url: `${API_URL}/api/products`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  }) as Promise<Product[]>;
}

export async function createTextProof(
  apiKey: string,
  params: {
    productId: string;
    contentText: string;
    authorName: string;
    sourcePlatform: string;
    sourceUrl: string;
  },
): Promise<Proof> {
  return sendToBackground({
    type: "API_REQUEST",
    url: `${API_URL}/api/products/${params.productId}/proofs`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      content_type: "text",
      content_text: params.contentText,
      author_name: params.authorName || "Anonymous",
      source_platform: params.sourcePlatform,
      source_url: params.sourceUrl,
    },
  }) as Promise<Proof>;
}

export async function createImageProof(
  apiKey: string,
  params: {
    productId: string;
    imageDataUrl: string;
    sourcePlatform: string;
    sourceUrl: string;
  },
): Promise<Proof> {
  // Send the data URL to the background script which will convert and upload
  return sendToBackground({
    type: "UPLOAD_IMAGE_PROOF",
    apiUrl: `${API_URL}/api/products/${params.productId}/proofs`,
    apiKey,
    imageDataUrl: params.imageDataUrl,
    sourcePlatform: params.sourcePlatform,
    sourceUrl: params.sourceUrl,
  }) as Promise<Proof>;
}

export async function getTabInfo(): Promise<{ url: string; title: string }> {
  return sendToBackground({ type: "GET_TAB_INFO" }) as Promise<{
    url: string;
    title: string;
  }>;
}

export async function captureVisible(): Promise<string> {
  const result = (await sendToBackground({ type: "CAPTURE_VISIBLE" })) as {
    dataUrl: string;
  };
  return result.dataUrl;
}

export async function getSelection(): Promise<string> {
  const result = (await sendToBackground({ type: "GET_SELECTION" })) as {
    text: string;
  };
  return result.text;
}
