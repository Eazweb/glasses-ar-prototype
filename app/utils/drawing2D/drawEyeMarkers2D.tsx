// utils/drawFaceMarkers2D.tsx
import { EYE_MARKER_RADIUS_2D } from "../config";
import { FACE_KEYPOINTS } from "../faceKeypoints";

/**
 * Draws colored markers and labels at key facial landmarks
 *
 * Renders small colored circles with text labels at the three main face keypoints:
 * - Left eye (cyan "L")
 * - Right eye (magenta "R")
 * - Nose tip (lime "N")
 *
 * @param ctx - Canvas 2D rendering context
 * @param w - Canvas width in pixels
 * @param h - Canvas height in pixels
 * @param landmarks - Array of normalized {x,y} landmarks
 *
 * @example
 * ```typescript
 * drawEyeMarkers2D(ctx, 640, 480, convertedLandmarks);
 * ```
 */
export function drawEyeMarkers2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: { x: number; y: number }[],
) {
  // Set font for landmark labels
  ctx.font = "8px sans-serif";

  // Iterate through each key facial landmark
  for (const { idx, color, label } of FACE_KEYPOINTS) {
    const pt = landmarks[idx];
    if (!pt) continue; // Skip if landmark not found

    // Convert normalized coordinates to pixel coordinates
    const x = pt.x * w;
    const y = pt.y * h;

    // Draw colored circle marker
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, EYE_MARKER_RADIUS_2D, 0, 2 * Math.PI);
    ctx.fill();

    // Draw text label (you can change this color)
    ctx.fillStyle = "#fff"; // White text for better contrast
    ctx.fillText(label, x + 6, y + 6); // Offset text slightly from center
  }
}
