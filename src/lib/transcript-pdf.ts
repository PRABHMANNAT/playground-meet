import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { speakerLine, type MeetingTranscript } from './transcript-download';

// Built-in PDF fonts keep English transcripts selectable and small. For other scripts
// use the browser's font fallback and shaping, including for participant names.
export async function transcriptPdf(transcript: MeetingTranscript) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(transcript.title + ' — Meeting transcript');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const margin = 48,
    width = 595,
    height = 842,
    available = width - margin * 2;
  const ink = rgb(0.09, 0.13, 0.18),
    muted = rgb(0.29, 0.34, 0.39);
  function addPage() {
    const page = pdf.addPage([width, height]);
    page.drawText('Playground Meet', { x: margin, y: 30, size: 9, font: regular, color: muted });
    page.drawText(String(pdf.getPageCount()), {
      x: width - margin - 16,
      y: 30,
      size: 9,
      font: regular,
      color: muted,
    });
    return page;
  }
  let page = addPage(),
    y = height - margin;
  async function paragraph(text: string, size: number, strong = false) {
    const font = strong ? bold : regular,
      family = (strong ? 'bold ' : '') + size + 'px sans-serif';
    const measure = (line: string) => {
      try {
        return font.widthOfTextAtSize(line, size);
      } catch {
        ctx.font = family;
        return ctx.measureText(line).width;
      }
    };
    async function draw(line: string) {
      if (y < 66) {
        page = addPage();
        y = height - margin;
      }
      try {
        font.encodeText(line);
        page.drawText(line, { x: margin, y, size, font, color: ink });
      } catch {
        canvas.width = Math.ceil(available * 3);
        canvas.height = Math.ceil(size * 1.8 * 3);
        ctx.scale(3, 3);
        ctx.font = family;
        ctx.fillStyle = '#17212c';
        ctx.fillText(line, 0, size * 1.2);
        const png = await pdf.embedPng(canvas.toDataURL('image/png'));
        page.drawImage(png, {
          x: margin,
          y: y - size * 0.6,
          width: canvas.width / 3,
          height: canvas.height / 3,
        });
      }
      y -= size * 1.5;
    }
    let line = '';
    for (const word of text.split(/\s+/u)) {
      const joined = line ? line + ' ' + word : word;
      if (measure(joined) <= available) {
        line = joined;
        continue;
      }
      if (line) await draw(line);
      line = '';
      for (const char of word) {
        if (line && measure(line + char) > available) {
          await draw(line);
          line = '';
        }
        line += char;
      }
    }
    if (line) await draw(line);
  }
  await paragraph(transcript.title, 22, true);
  await paragraph(
    'Meeting transcript · ' +
      new Date(transcript.started).toISOString().slice(0, 16).replace('T', ' ') +
      ' UTC',
    10,
  );
  y -= 16;
  for (const line of transcript.lines) {
    if (y < 89) {
      page = addPage();
      y = height - margin;
    }
    await paragraph(speakerLine(line.at, transcript.started, line.speaker), 10, true);
    await paragraph(line.text, 11);
    y -= 8;
  }
  return new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' });
}
