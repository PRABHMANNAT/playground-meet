// Native windows navigate on the participant's device. Link previews use the separate public URL policy.
export function resolveBrowserInput(
  input: string,
): { kind: 'page' | 'search'; url: string } | null {
  const value = input.trim();
  if (!value || value.length > 2000 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const address =
    /^https?:\/\//i.test(value) ||
    /^(?:localhost|\[[a-f\d:]+\]|[^\s/:]+\.[^\s/:]+)(?::\d+)?(?:[/?#]\S*)?$/i.test(value);
  if (!address) {
    if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) return null;
    return { kind: 'search', url: 'https://duckduckgo.com/?q=' + encodeURIComponent(value) };
  }
  try {
    const url = new URL(/^https?:/i.test(value) ? value : 'https://' + value);
    return url.hostname && !url.username && !url.password ? { kind: 'page', url: url.href } : null;
  } catch {
    return null;
  }
}

export function browserDestination(input: string): string | null {
  return resolveBrowserInput(input)?.url ?? null;
}
