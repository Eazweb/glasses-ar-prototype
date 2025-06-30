// utils/drawFaceStructure2D.tsx
import {
  FACE_OUTLINE_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  NOSE_BRIDGE_INDICES,
  MOUTH_OUTLINE_INDICES,
} from "./faceKeypoints";

/**
 * Draws:
 * - White oval around the face
 * - Cyan rings around both eyes
 * - Lime vertical nose bridge
 * - Magenta ring around the mouth
 * - Yellow horizontal line across nose center
 */
export function drawFaceMask2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lm: { x: number; y: number }[],
) {
  // pixel converter
  const toPx = (i: number) => [lm[i].x * w, lm[i].y * h] as [number, number];

  // generic ring drawer
  const drawRing = (indices: number[], color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    indices.forEach((i, j) => {
      const [x, y] = toPx(i);
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  };

  // generic line drawer
  const drawLine = (indices: number[], color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    indices.forEach((i, j) => {
      const [x, y] = toPx(i);
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  // 1) Face oval (white)
  drawRing(FACE_OUTLINE_INDICES, "white");

  // 2) Eyes (cyan)
  drawRing(LEFT_EYE_INDICES, "cyan");
  drawRing(RIGHT_EYE_INDICES, "cyan");

  // 3) Nose bridge (lime) — open polyline
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.beginPath();
  NOSE_BRIDGE_INDICES.forEach((i, j) => {
    const [x, y] = toPx(i);
    j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 4) Mouth (magenta)
  drawRing(MOUTH_OUTLINE_INDICES, "magenta");

  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 1;
  ctx.beginPath();

  ctx.stroke();
}
