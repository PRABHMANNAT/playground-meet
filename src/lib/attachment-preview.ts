// Older chat events only have a filename. The preview endpoint always checks the bytes.
export function previewFromName(filename: string) {
  if (/\.(jpe?g|jfif|png|apng|gif|webp|avif|bmp|ico)$/i.test(filename)) return 'image';
  if (/\.(mp4|m4v|webm|mov|ogv)$/i.test(filename)) return 'video';
  return null;
}

export function previewMime(header: Uint8Array, filename: string) {
  const bytes = String.fromCharCode(...header.subarray(0, 256));
  if (bytes.startsWith('\xff\xd8\xff')) return 'image/jpeg';
  if (bytes.startsWith('\x89PNG\r\n\x1a\n')) return 'image/png';
  if (/^GIF8[79]a/.test(bytes)) return 'image/gif';
  if (bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP') return 'image/webp';
  if (bytes.startsWith('BM') && /\.bmp$/i.test(filename)) return 'image/bmp';
  if (bytes.startsWith('\x00\x00\x01\x00') && /\.ico$/i.test(filename)) return 'image/x-icon';
  if (bytes.startsWith('\x1a\x45\xdf\xa3') && bytes.includes('webm')) return 'video/webm';
  if (bytes.startsWith('OggS') && bytes.includes('theora')) return 'video/ogg';
  if (bytes.slice(4, 8) === 'ftyp') {
    const brand = bytes.slice(8, 12);
    if (['avif', 'avis'].includes(brand)) return 'image/avif';
    if (brand === 'qt  ') return 'video/quicktime';
    if (/^(isom|iso[2-9]|mp4[12]|avc1|M4V |dash|MSNV)$/.test(brand)) return 'video/mp4';
  }
  return null;
}

// Media elements use single byte ranges to load metadata and seek in a clip.
export function attachmentRange(value: string | null, size: number) {
  if (value === null) return { start: 0, end: size - 1 };
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const length = Number(match[2]);
    return length > 0 ? { start: Math.max(0, size - length), end: size - 1 } : null;
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end ? { start, end } : null;
}
