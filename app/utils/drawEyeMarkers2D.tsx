// utils/drawFaceMarkers2D.tsx
import { FACE_KEYPOINTS } from "./faceKeypoints";

export function drawEyeMarkers2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: { x: number; y: number }[],
) {
  ctx.font = "12px sans-serif";
  for (const { idx, color, label } of FACE_KEYPOINTS) {
    const pt = landmarks[idx];
    if (!pt) continue;
    const x = pt.x * w,
      y = pt.y * h;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.fillText(label, x + 6, y + 6);
  }
}
