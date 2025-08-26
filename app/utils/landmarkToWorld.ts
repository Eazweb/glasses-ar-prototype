// utils/landmarkToWorld.ts
import { Vector3 } from "three";
import { smartZBoost } from "./zBooster";

// PLANE_SCALE determines how normalized landmark coordinates (0-1) are mapped to 3D world units.
// Set to 1 for both x and y to match a 1x1 video plane. Adjust z for depth exaggeration if needed.
export const PLANE_SCALE = { x: 0.95, y: 1, z: 0.6 };
// PLANE_Z is the default Z position for overlays (should match the overlays' z in the scene)
export const PLANE_Z = 0;

export function landmarkToWorld(pt: {
  x: number;
  y: number;
  z?: number;
}): Vector3 {
  return new Vector3(
    // X: 0→1 maps to –1.5→+1.5
    (pt.x - 0.5) * PLANE_SCALE.x,
    // Y: 0→1 maps to +1.125→–1.125 (flip)
    (0.5 - pt.y) * PLANE_SCALE.y,
    // Z: if pt.z exists, invert and scale it, then add plane depth,
    //    otherwise just sit at the plane’s Z
    pt.z !== undefined ? -pt.z * PLANE_SCALE.z + PLANE_Z : PLANE_Z,
  );
}

export function landmarkToWorldZBoosted(
  pt: { x: number; y: number; z?: number },
  index?: number,
): Vector3 {
  return new Vector3(
    (pt.x - 0.5) * PLANE_SCALE.x,
    (0.5 - pt.y) * PLANE_SCALE.y,
    pt.z !== undefined
      ? -smartZBoost(pt.z, index ?? -1) * PLANE_SCALE.z + PLANE_Z
      : PLANE_Z,
  );
}
