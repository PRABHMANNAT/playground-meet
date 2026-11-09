export async function request<T = Record<string, unknown>>(
  path: string,
  data?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(path, {
    method: method || (data === undefined ? 'GET' : 'POST'),
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.');
  return result;
}
export async function downloadSummary(id: string) {
  const { markdown } = await request<{ markdown: string }>(`/api/meetings/${id}/summary`);
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `playground-meet-${id}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
