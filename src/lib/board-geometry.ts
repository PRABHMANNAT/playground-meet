import type { Stroke } from './types';
export const boardWidth = 1600,
  boardHeight = 900;
export type BoardTool = 'pen' | 'line' | 'rectangle';
export type Point = [number, number];
export function drawingPoints(tool: BoardTool, points: Point[]): Point[] {
  const first = points[0],
    last = points[points.length - 1];
  if (tool === 'rectangle') return [first, [last[0], first[1]], last, [first[0], last[1]], first];
  if (tool === 'line' || points.length === 1) return [first, last];
  return points;
}
export function paperPoints(stroke: Pick<Stroke, 'points' | 'wide'>): Point[] {
  // Earlier rooms used a square sheet. Center it without stretching the ink.
  return stroke.points.map(([x, y]) => [
    stroke.wide ? x * boardWidth : (boardWidth - boardHeight) / 2 + x * boardHeight,
    y * boardHeight,
  ]);
}
export function isDot(points: Point[]) {
  return points.every((p) => p[0] === points[0][0] && p[1] === points[0][1]);
}
