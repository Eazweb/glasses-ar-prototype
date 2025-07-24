import { useMemo } from "react";

export function useDynamicPlane(videoAspect: number | null) {
  // Set plane width to 1 for simplicity
  const planeWidth = 1;
  const planeHeight = videoAspect ? planeWidth / videoAspect : 1;

  // Camera FOV in degrees (from props or default)
  const FOV = 70;
  // Calculate camera Z so the plane fills the vertical FOV
  const fovRad = (FOV * Math.PI) / 180;
  const cameraZ = planeHeight / (2 * Math.tan(fovRad / 2));

  return useMemo(
    () => ({ planeWidth, planeHeight, FOV, fovRad, cameraZ }),
    [planeWidth, planeHeight, FOV, fovRad, cameraZ],
  );
}
