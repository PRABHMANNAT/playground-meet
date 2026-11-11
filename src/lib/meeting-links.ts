// Shared by navigation, history and invitation copy actions.
export const meetingCodePattern = /^[a-f0-9]{6}-[a-f0-9]{6}-[a-f0-9]{6}$/;

export function meetingPath(id: string, recap = false) {
  if (!meetingCodePattern.test(id)) throw new Error('Invalid meeting code.');
  return `/playground-meet/${id}${recap ? '/recap' : ''}`;
}

export function meetingInviteUrl(id: string, origin: string) {
  return new URL(meetingPath(id), new URL(origin).origin).href;
}

export function parseMeetingLink(input: string) {
  const text = input.trim();
  if (meetingCodePattern.test(text)) return text;
  let path: string;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    path = url.pathname;
  } catch {
    if (!text.startsWith('/')) return '';
    path = text.split(/[?#]/)[0];
  }
  // Keep previously shared /room links usable, including recap URLs.
  const match = path.match(/^\/(?:playground-meet|room)\/([^/]+)(?:\/recap)?\/?$/);
  return match && meetingCodePattern.test(match[1]) ? match[1] : '';
}
