/**
 * Draws a small dot at _every_ MediaPipe landmark.
 * @param ctx         Canvas 2D context
 * @param w           Canvas width in pixels
 * @param h           Canvas height in pixels
 * @param landmarks   Array of normalized {x,y} landmarks
 * @param color       Dot color (default white)
 * @param radius      Dot radius (default 1.5px)
 */
export function drawAllLandmarks2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: { x: number; y: number }[],
  color: string = "white",
  radius: number = 1,
) {
  ctx.fillStyle = color;
  for (const pt of landmarks) {
    const x = pt.x * w;
    const y = pt.y * h;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}
