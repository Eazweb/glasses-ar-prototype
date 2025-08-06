/**
 * Calculates positional offset based on pitch angle to keep glasses properly positioned.
 * When user looks up, glasses should move up to stay on eyebrows.
 * When user looks down, glasses should move down to stay on nose bridge.
 */

/**
 * Calculates the Y-axis offset based on pitch angle.
 * @param pitch - The pitch angle in radians (positive = looking up, negative = looking down)
 * @param intensity - How much the glasses should move (default: 0.02)
 * @param maxPitch - Maximum pitch angle to normalize against (default: 0.5 radians ~ 28 degrees)
 * @returns Y offset to add to glasses position
 */
export function calculatePitchYOffset(
  pitch: number,
  intensity = 0.02,
  maxPitch = 0.5,
): number {
  // Clamp pitch to reasonable range
  const clampedPitch = Math.max(Math.min(pitch, maxPitch), -maxPitch);

  // Normalize to [-1, 1] range
  const normalizedPitch = clampedPitch / maxPitch;

  // Apply easing curve for smoother movement
  const easedPitch =
    Math.sign(normalizedPitch) * Math.pow(Math.abs(normalizedPitch), 1.5);

  // Return Y offset (positive = move up, negative = move down)
  return easedPitch * intensity;
}

/**
 * Calculates the Z-axis offset based on pitch angle.
 * When looking down, glasses should move closer to the face.
 * When looking up, glasses stay at normal distance.
 * @param pitch - The pitch angle in radians
 * @param intensity - How much the glasses should move forward/back (default: 0.01)
 * @param maxPitch - Maximum pitch angle to normalize against (default: 0.5 radians)
 * @returns Z offset to add to glasses position (only negative values when looking down)
 */
export function calculatePitchZOffset(
  pitch: number,
  intensity = 0,
  maxPitch = 0.5,
): number {
  // Only apply effect when looking down (positive pitch)
  if (pitch <= 0) {
    return 0; // No Z movement when looking up
  }

  // Clamp positive pitch to reasonable range
  const clampedPitch = Math.min(pitch, maxPitch);
  const normalizedPitch = clampedPitch / maxPitch; // This will be positive

  // Apply easing curve for smoother movement
  const easedPitch = Math.pow(normalizedPitch, 1.5);

  // Return positive Z offset (move closer to face when looking down)
  return easedPitch * intensity;
}
