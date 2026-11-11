export const maxBrowserUrl = 2000;

export function parseBrowserUrl(value: string): URL | null {
  if (value.length > maxBrowserUrl || !/^https:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      !host.includes('.') ||
      /^(?:\d+\.){3}\d+$/.test(host) ||
      /\.(?:localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(host) ||
      url.href.length > maxBrowserUrl
    )
      return null;
    return url;
  } catch {
    return null;
  }
}
