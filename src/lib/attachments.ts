export const maxAttachmentBytes = 200_000_000;
export const attachmentChunkBytes = 1_000_000;
export function attachmentProblem(name: string, size: number) {
  if (
    !name.trim() ||
    name.length > 240 ||
    /[\/\\\x00-\x1f\x7f]/.test(name) ||
    ['.', '..'].includes(name)
  )
    return 'Choose an individual file with a valid filename.';
  if (!Number.isSafeInteger(size) || size < 1) return 'Choose a non-empty file.';
  if (size > maxAttachmentBytes) return 'Files must be 200 MB or smaller.';
  return '';
}
export function fileSize(bytes: number) {
  if (bytes < 1000) return bytes + ' B';
  if (bytes < 1_000_000) return Math.ceil(bytes / 1000) + ' KB';
  return Number((bytes / 1_000_000).toFixed(1)) + ' MB';
}
