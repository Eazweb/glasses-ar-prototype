// utils/landmarkToWorld.ts
import { Vector3 } from "three";
import { smartZBoost } from "./zBooster";

export const PLANE_SCALE = { x: 3, y: 2.25, z: 1.5 };
export const PLANE_Z = -0.5;

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
