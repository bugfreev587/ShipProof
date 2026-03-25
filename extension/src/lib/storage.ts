export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get("apiKey");
  return (result.apiKey as string) || null;
}

export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ apiKey: key });
}

export async function getDefaultProductId(): Promise<string | null> {
  const result = await chrome.storage.local.get("defaultProductId");
  return (result.defaultProductId as string) || null;
}

export async function setDefaultProductId(id: string): Promise<void> {
  await chrome.storage.local.set({ defaultProductId: id });
}

export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
}
