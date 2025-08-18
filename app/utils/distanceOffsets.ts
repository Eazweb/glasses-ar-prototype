export type DistanceOffsetAnchor = {
  distanceM: number; // anchor distance in meters
  forward: number; // forward offset at this distance (app units)
  lateral: number; // lateral offset at this distance (app units)
};

export type ComputeOffsetsOptions = {
  // Apply smoothstep easing between anchors instead of pure linear
  easing?: "linear" | "smoothstep";
};

// Default anchors (no-op: all values match current config so behavior is unchanged until you tweak)
// Tweak these in dev to tune feel per distance.
export const DEFAULT_DISTANCE_OFFSET_ANCHORS: DistanceOffsetAnchor[] = [
  { distanceM: 0.45, forward: 0.035, lateral: 0.07 }, // Very Close
  // Extra increments between Very Close (0.45) and Medium (0.85)
  { distanceM: 0.55, forward: 0.025, lateral: 0.055 }, // VC+1
  { distanceM: 0.65, forward: 0.022, lateral: 0.05 }, // VC+2
  { distanceM: 0.75, forward: 0.015, lateral: 0.038 }, // VC+3
  { distanceM: 0.85, forward: 0.008, lateral: 0.03 }, // Medium
  { distanceM: 1.1, forward: 0.012, lateral: 0.03 }, // Far
  { distanceM: 1.6, forward: 0.012, lateral: 0.03 }, // Very Far
];

function smoothstep(t: number): number {
  // Hermite smoothstep (0..1)
  return t * t * (3 - 2 * t);
}

/**
 * Compute smoothly interpolated offsets for a given absolute distance.
 * - Sorts anchors by distance if needed
 * - Clamps at extrema
 * - Interpolates between nearest two anchors (linear or smoothstep)
 */
export function computeDistanceOffsets(
  distanceM: number,
  anchors: DistanceOffsetAnchor[] = DEFAULT_DISTANCE_OFFSET_ANCHORS,
  options: ComputeOffsetsOptions = { easing: "smoothstep" },
): { forward: number; lateral: number } {
  if (!Number.isFinite(distanceM)) {
    // Fallback to middle anchor if distance is not available
    const mid = anchors[Math.floor(anchors.length / 2)];
    return { forward: mid.forward, lateral: mid.lateral };
  }

  // Ensure anchors are sorted
  const sorted = [...anchors].sort((a, b) => a.distanceM - b.distanceM);

  // Clamp to range
  if (distanceM <= sorted[0].distanceM) {
    return { forward: sorted[0].forward, lateral: sorted[0].lateral };
  }
  if (distanceM >= sorted[sorted.length - 1].distanceM) {
    const last = sorted[sorted.length - 1];
    return { forward: last.forward, lateral: last.lateral };
  }

  // Find spanning segment
  let i = 0;
  for (; i < sorted.length - 1; i++) {
    if (distanceM <= sorted[i + 1].distanceM) break;
  }
  const a = sorted[i];
  const b = sorted[i + 1];

  let t = (distanceM - a.distanceM) / (b.distanceM - a.distanceM);
  if (options.easing === "smoothstep")
    t = smoothstep(Math.max(0, Math.min(1, t)));

  const forward = a.forward + (b.forward - a.forward) * t;
  const lateral = a.lateral + (b.lateral - a.lateral) * t;
  return { forward, lateral };
}

/**
 * Optional helper: derive a category label from distance (align with UI thresholds).
 */
export function categoryFromDistance(
  distanceM: number,
): "Very Close" | "Close" | "Medium" | "Far" | "Very Far" {
  if (!Number.isFinite(distanceM)) return "Medium";
  if (distanceM < 0.45) return "Very Close";
  if (distanceM < 0.7) return "Close";
  if (distanceM < 0.85) return "Medium";
  if (distanceM < 1.1) return "Far";
  return "Very Far";
}
