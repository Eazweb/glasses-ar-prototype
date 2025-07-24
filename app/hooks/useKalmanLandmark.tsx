// hooks/useKalmanLandmark.ts
import { useMemo, useRef } from "react";
import KalmanFilter from "kalmanjs";
import * as THREE from "three";

/**
 * Returns a smoothed 3D landmark vector using Kalman filtering.
 * Automatically remembers state across frames per component (x/y/z).
 *
 * @param point - Raw landmark point { x, y, z }
 * @returns Smoothed THREE.Vector3
 */
export function useKalmanLandmark(point: { x: number; y: number; z?: number }) {
  const filters = useRef({
    x: new KalmanFilter({ R: 0.01, Q: 0.0005 }),
    y: new KalmanFilter({ R: 0.01, Q: 0.0005 }),
    z: new KalmanFilter({ R: 0.01, Q: 0.0005 }),
  });

  const smoothed = useMemo(() => {
    return new THREE.Vector3(
      filters.current.x.filter(point.x),
      filters.current.y.filter(point.y),
      filters.current.z.filter(point.z ?? 0),
    );
  }, [point.x, point.y, point.z]);

  return smoothed;
}
