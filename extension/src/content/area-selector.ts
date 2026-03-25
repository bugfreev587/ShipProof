chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "START_AREA_CAPTURE") {
    startAreaCapture();
  }
});

function startAreaCapture() {
  // Overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;top:0;left:0;width:100vw;height:100vh;
    background:rgba(0,0,0,0.4);z-index:2147483647;cursor:crosshair;
  `;
  document.body.appendChild(overlay);

  // Hint
  const hint = document.createElement("div");
  hint.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:rgba(20,20,24,0.9);backdrop-filter:blur(8px);
    color:#EDEDEF;font-family:Inter,system-ui,sans-serif;
    font-size:13px;padding:8px 20px;border-radius:999px;
    z-index:2147483647;pointer-events:none;
    border:1px solid rgba(30,30,36,0.8);
  `;
  hint.textContent = "Drag to select area \u00b7 Press Esc to cancel";
  document.body.appendChild(hint);

  // Selection box
  const selection = document.createElement("div");
  selection.style.cssText = `
    position:fixed;border:2px solid #6366F1;border-radius:4px;
    z-index:2147483647;pointer-events:none;display:none;
    box-shadow:0 0 0 9999px rgba(0,0,0,0.4);background:transparent;
  `;
  document.body.appendChild(selection);

  // Size label
  const sizeLabel = document.createElement("div");
  sizeLabel.style.cssText = `
    position:fixed;background:#141418;color:#8B8B92;
    font-family:'SF Mono','JetBrains Mono',monospace;
    font-size:11px;padding:2px 8px;border-radius:4px;
    z-index:2147483647;pointer-events:none;display:none;
    border:1px solid #1E1E24;
  `;
  document.body.appendChild(sizeLabel);

  let startX = 0,
    startY = 0,
    isDragging = false;

  overlay.addEventListener("mousedown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    selection.style.display = "block";
    overlay.style.background = "transparent";
  });

  overlay.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const x = Math.min(startX, e.clientX);
    const y = Math.min(startY, e.clientY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    selection.style.left = x + "px";
    selection.style.top = y + "px";
    selection.style.width = w + "px";
    selection.style.height = h + "px";
    sizeLabel.style.display = "block";
    sizeLabel.style.left = x + w + 8 + "px";
    sizeLabel.style.top = y + h + 8 + "px";
    sizeLabel.textContent = `${w} \u00d7 ${h}`;
  });

  overlay.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    const rect = {
      x: Math.min(startX, e.clientX),
      y: Math.min(startY, e.clientY),
      width: Math.abs(e.clientX - startX),
      height: Math.abs(e.clientY - startY),
    };
    cleanup();
    if (rect.width < 10 || rect.height < 10) return;

    chrome.runtime.sendMessage({
      type: "CAPTURE_AND_CROP",
      rect,
      devicePixelRatio: window.devicePixelRatio,
    });
  });

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") cleanup();
  };
  document.addEventListener("keydown", onKeydown);

  function cleanup() {
    overlay.remove();
    hint.remove();
    selection.remove();
    sizeLabel.remove();
    document.removeEventListener("keydown", onKeydown);
  }
}
