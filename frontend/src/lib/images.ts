export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();

  // Legacy server-stored upload paths are no longer served
  if (trimmed.includes('/uploads/files/')) return undefined;

  return trimmed;
}
