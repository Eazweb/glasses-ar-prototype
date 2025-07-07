/**
 * Converts MediaPipe landmarks from number[][] format to {x,y}[] format
 *
 * MediaPipe returns landmarks as array of arrays: [[x1, y1], [x2, y2], ...]
 * Drawing functions expect array of objects: [{x: x1, y: y1}, {x: x2, y: y2}, ...]
 *
 * @param landmarks - Raw MediaPipe landmarks in number[][] format
 * @returns Converted landmarks in {x,y}[] format, or empty array if invalid
 *
 * @example
 * ```typescript
 * const rawLandmarks = [[0.5, 0.3], [0.7, 0.4]];
 * const converted = convertLandmarks(rawLandmarks);
 * // Result: [{x: 0.5, y: 0.3}, {x: 0.7, y: 0.4}]
 * ```
 */
export function convertLandmarks(
  landmarks: number[][] | null | undefined,
): { x: number; y: number }[] {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
    return [];
  }

  return landmarks.map((point: any) => {
    // Handle different possible formats from MediaPipe
    if (Array.isArray(point) && point.length >= 2) {
      return { x: point[0], y: point[1] };
    } else if (
      point &&
      typeof point.x === "number" &&
      typeof point.y === "number"
    ) {
      return { x: point.x, y: point.y };
    }
    // Fallback for unexpected format
    return { x: 0, y: 0 };
  });
}

/**
 * Converts MediaPipe landmarks from number[][] format to {x,y,z}[] format
 * Preserves z-coordinates when available
 *
 * MediaPipe returns landmarks as array of arrays: [[x1, y1, z1], [x2, y2, z2], ...]
 * Drawing functions expect array of objects: [{x: x1, y: y1, z: z1}, {x: x2, y: y2, z: z2}, ...]
 *
 * @param landmarks - Raw MediaPipe landmarks in number[][] format
 * @returns Converted landmarks in {x,y,z}[] format, or empty array if invalid
 *
 * @example
 * ```typescript
 * const rawLandmarks = [[0.5, 0.3, 0.1], [0.7, 0.4, 0.2]];
 * const converted = convertLandmarks3D(rawLandmarks);
 * // Result: [{x: 0.5, y: 0.3, z: 0.1}, {x: 0.7, y: 0.4, z: 0.2}]
 * ```
 */
export function convertLandmarks3D(
  landmarks: number[][] | null | undefined,
): { x: number; y: number; z?: number }[] {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
    return [];
  }

  return landmarks.map((point: any) => {
    // Handle different possible formats from MediaPipe
    if (Array.isArray(point) && point.length >= 2) {
      const result: { x: number; y: number; z?: number } = {
        x: point[0],
        y: point[1],
      };
      // Add z-coordinate if available
      if (point.length >= 3 && typeof point[2] === "number") {
        result.z = point[2];
      }
      return result;
    } else if (
      point &&
      typeof point.x === "number" &&
      typeof point.y === "number"
    ) {
      const result: { x: number; y: number; z?: number } = {
        x: point.x,
        y: point.y,
      };
      // Add z-coordinate if available
      if (typeof point.z === "number") {
        result.z = point.z;
      }
      return result;
    }
    // Fallback for unexpected format
    return { x: 0, y: 0 };
  });
}
