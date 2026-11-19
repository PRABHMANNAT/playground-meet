import { PDFDocument, rgb, LineCapStyle } from 'pdf-lib';
import { paperPoints, isDot, boardWidth, boardHeight } from './board-geometry';
import type { Stroke } from './types';

export async function downloadBoardPdf(strokes: Stroke[], meetingId: string, title: string) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title + ' — Whiteboard');
  const scale = 0.5,
    height = boardHeight * scale,
    page = pdf.addPage([boardWidth * scale, height]);
  for (const stroke of strokes) {
    const points = paperPoints(stroke),
      width = (stroke.width ?? 4.5) * scale;
    const hex = parseInt(stroke.color.slice(1), 16);
    const ink = rgb((hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
    if (isDot(points)) {
      page.drawCircle({
        x: points[0][0] * scale,
        y: height - points[0][1] * scale,
        size: width / 2,
        color: ink,
      });
      continue;
    }
    const path = points
      .map(([x, y], i) => (i ? 'L' : 'M') + ' ' + x * scale + ' ' + y * scale)
      .join(' ');
    page.drawSvgPath(path, {
      x: 0,
      y: height,
      borderWidth: width,
      borderColor: ink,
      borderLineCap: LineCapStyle.Round,
    });
  }
  const bytes = await pdf.save(),
    url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'whiteboard-' + meetingId + '.pdf';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
