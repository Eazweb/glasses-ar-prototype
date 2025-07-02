import { GLASSES_EYEDISTANCE_MULTIPLIER_2D } from "../config";
import { FACE_KEYPOINTS } from "../faceKeypoints";

/**
 * Draws PNG glasses on the canvas positioned and scaled based on face landmarks
 * @param ctx Canvas 2D context
 * @param w Canvas width in pixels
 * @param h Canvas height in pixels
 * @param landmarks Array of normalized {x,y} landmarks
 * @param img HTMLImageElement of the glasses PNG
 */
export function drawPngGlasses2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: { x: number; y: number }[],
  img: HTMLImageElement,
) {
  // Get key facial landmarks for glasses positioning using constants
  const leftEye = landmarks[FACE_KEYPOINTS[0].idx]; // Left eye outer corner
  const rightEye = landmarks[FACE_KEYPOINTS[1].idx]; // Right eye outer corner
  const nose = landmarks[FACE_KEYPOINTS[2].idx]; // Nose tip

  if (!leftEye || !rightEye || !nose) return;

  // Calculate glasses position and size
  const eyeDistance = Math.sqrt(
    Math.pow((rightEye.x - leftEye.x) * w, 2) +
      Math.pow((rightEye.y - leftEye.y) * h, 2),
  );

  // Scale glasses based on eye distance (adjust multiplier as needed)
  const glassesWidth = eyeDistance * GLASSES_EYEDISTANCE_MULTIPLIER_2D;
  const glassesHeight = glassesWidth * (img.height / img.width);

  // Position glasses centered between eyes, slightly above
  const centerX = ((leftEye.x + rightEye.x) / 2) * w;
  const centerY = ((leftEye.y + rightEye.y) / 2) * h;

  // Calculate rotation based on eye angle
  const eyeAngle = Math.atan2(
    (rightEye.y - leftEye.y) * h,
    (rightEye.x - leftEye.x) * w,
  );

  // Save context state
  ctx.save();

  // Apply transformations
  ctx.translate(centerX, centerY);
  ctx.rotate(eyeAngle);

  // Draw the glasses image
  ctx.drawImage(
    img,
    -glassesWidth / 2, // Center horizontally
    -glassesHeight / 2, // Center vertically
    glassesWidth,
    glassesHeight,
  );

  // Restore context state
  ctx.restore();
}
