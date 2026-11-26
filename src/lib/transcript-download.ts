import { request } from './client';
import { duration } from './format';

export type MeetingTranscript = {
  title: string;
  started: number;
  lines: { at: number; speaker: string; text: string }[];
};
export function speakerLine(at: number, started: number, speaker: string) {
  return '[' + duration((at - started) / 1000) + '] ' + speaker;
}
export async function downloadTranscript(id: string, format: 'txt' | 'pdf') {
  const transcript = await request<MeetingTranscript>('/api/meetings/' + id + '/transcript');
  if (!transcript.lines.length) throw new Error('No spoken captions were saved for this meeting.');
  let blob: Blob;
  if (format === 'pdf') {
    const { transcriptPdf } = await import('./transcript-pdf');
    blob = await transcriptPdf(transcript);
  } else {
    const text = [
      transcript.title,
      'Meeting transcript',
      new Date(transcript.started).toISOString(),
      '',
      ...transcript.lines.map(
        (line) => speakerLine(line.at, transcript.started, line.speaker) + ': ' + line.text,
      ),
    ];
    blob = new Blob([text.join('\r\n') + '\r\n'], { type: 'text/plain;charset=utf-8' });
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'playground-meet-' + id + '-transcript.' + format;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
