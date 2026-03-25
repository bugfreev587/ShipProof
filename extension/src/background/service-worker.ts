function detectPlatform(url: string): string {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("producthunt.com")) return "product_hunt";
  if (url.includes("news.ycombinator.com")) return "hackernews";
  if (url.includes("indiehackers.com")) return "indiehackers";
  return "other";
}

// --- Context Menus ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-text-to-shipproof",
    title: "Save text to ShipProof",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "save-image-to-shipproof",
    title: "Save image to ShipProof",
    contexts: ["image"],
  });
});

function showPageToast(tabId: number, text: string) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg: string) => {
      const toast = document.createElement("div");
      toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;
        background:#141418;border:1px solid #6366F1;
        color:#EDEDEF;font-family:Inter,system-ui,sans-serif;
        font-size:13px;padding:12px 20px;border-radius:12px;
        z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,0.5);
        opacity:0;transition:opacity 200ms ease;
      `;
      toast.textContent = msg;
      document.body.appendChild(toast);
      requestAnimationFrame(() => { toast.style.opacity = "1"; });
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 200);
      }, 3000);
    },
    args: [text],
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-text-to-shipproof") {
    chrome.storage.local.set({
      pendingText: info.selectionText || "",
      pendingUrl: tab?.url || "",
      pendingPlatform: detectPlatform(tab?.url || ""),
    });
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#6366F1" });
    if (tab?.id) {
      showPageToast(tab.id, "\u2713 Text captured! Click the ShipProof icon to save.");
    }
  }
  if (info.menuItemId === "save-image-to-shipproof") {
    chrome.storage.local.set({
      pendingImageUrl: info.srcUrl || "",
      pendingUrl: tab?.url || "",
      pendingPlatform: detectPlatform(tab?.url || ""),
    });
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#6366F1" });
    if (tab?.id) {
      showPageToast(tab.id, "\u2713 Image captured! Click the ShipProof icon to save.");
    }
  }
});

// --- Success Badge ---

function showSuccessBadge() {
  chrome.action.setBadgeText({ text: "\u2713" });
  chrome.action.setBadgeBackgroundColor({ color: "#22C55E" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2000);
}

// --- Message Handler ---

chrome.runtime.onMessage.addListener(
  (
    message: Record<string, unknown>,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (message.type === "API_REQUEST") {
      const { url, method, headers, body } = message as {
        url: string;
        method: string;
        headers: Record<string, string>;
        body?: unknown;
      };

      const fetchOptions: RequestInit = { method, headers };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      fetch(url, fetchOptions)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            sendResponse({
              success: false,
              error: data.error || `HTTP ${res.status}`,
              status: res.status,
            });
          } else {
            sendResponse({ success: true, data });
          }
        })
        .catch((err) => {
          sendResponse({ success: false, error: (err as Error).message });
        });

      return true;
    }

    if (message.type === "UPLOAD_IMAGE_PROOF") {
      const { apiUrl, apiKey, imageDataUrl, sourcePlatform, sourceUrl } =
        message as {
          apiUrl: string;
          apiKey: string;
          imageDataUrl: string;
          sourcePlatform: string;
          sourceUrl: string;
        };

      fetch(imageDataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const formData = new FormData();
          formData.append("image", blob, "screenshot.png");
          formData.append("content_type", "image");
          formData.append("author_name", "Screenshot");
          formData.append("source_platform", sourcePlatform);
          formData.append("source_url", sourceUrl);
          formData.append("status", "pending");
          formData.append("collection_method", "extension");

          return fetch(apiUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
          });
        })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            sendResponse({
              success: false,
              error: data.error || `HTTP ${res.status}`,
            });
          } else {
            showSuccessBadge();
            sendResponse({ success: true, data });
          }
        })
        .catch((err) => {
          sendResponse({ success: false, error: (err as Error).message });
        });

      return true;
    }

    if (message.type === "GET_TAB_INFO") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        sendResponse({
          success: true,
          data: { url: tab?.url || "", title: tab?.title || "" },
        });
      });
      return true;
    }

    if (message.type === "CAPTURE_VISIBLE") {
      chrome.tabs.captureVisibleTab(
        { format: "png", quality: 90 },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse({ success: true, data: { dataUrl } });
          }
        },
      );
      return true;
    }

    if (message.type === "CAPTURE_AND_CROP") {
      const { rect, devicePixelRatio } = message as {
        rect: { x: number; y: number; width: number; height: number };
        devicePixelRatio: number;
      };

      chrome.tabs.captureVisibleTab(
        { format: "png" },
        (dataUrl) => {
          if (chrome.runtime.lastError || !dataUrl) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError?.message || "Capture failed",
            });
            return;
          }
          // Store full screenshot + rect for popup to crop via Canvas
          chrome.storage.local.set({
            capturedImage: dataUrl,
            capturedRect: rect,
            capturedDpr: devicePixelRatio,
          });
          // Show badge to prompt user to click icon
          chrome.action.setBadgeText({ text: "1" });
          chrome.action.setBadgeBackgroundColor({ color: "#22C55E" });
          sendResponse({ success: true });
        },
      );
      return true;
    }

    if (message.type === "START_AREA_CAPTURE") {
      // Inject content script and send message to it
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          sendResponse({ success: false, error: "No active tab" });
          return;
        }
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            files: ["content/area-selector.js"],
          },
          () => {
            if (chrome.runtime.lastError) {
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              });
              return;
            }
            chrome.tabs.sendMessage(tabs[0].id!, {
              type: "START_AREA_CAPTURE",
            });
            sendResponse({ success: true });
          },
        );
      });
      return true;
    }

    if (message.type === "GET_SELECTION") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          sendResponse({ success: true, data: { text: "" } });
          return;
        }
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => window.getSelection()?.toString() || "",
          },
          (results) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: true, data: { text: "" } });
            } else {
              sendResponse({
                success: true,
                data: { text: results?.[0]?.result || "" },
              });
            }
          },
        );
      });
      return true;
    }

    if (message.type === "SHOW_SUCCESS_BADGE") {
      showSuccessBadge();
      sendResponse({ success: true });
      return true;
    }

    return false;
  },
);
