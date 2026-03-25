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

      return true; // async response
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

      // Convert data URL to blob
      fetch(imageDataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const formData = new FormData();
          formData.append("image", blob, "screenshot.png");
          formData.append("content_type", "image");
          formData.append("author_name", "Screenshot");
          formData.append("source_platform", sourcePlatform);
          formData.append("source_url", sourceUrl);

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

    return false;
  },
);
