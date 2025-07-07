// utils/drawing/drawAllLandmarks3D.tsx
import React from "react";
import { landmarkToWorld } from "../../utils/landmarkToWorld";

/**
 * Renders small white dots at every landmark using efficient points rendering.
 * @param landmarks Array of normalized {x,y} landmarks
 */
export function drawAllLandmarks3D(
  landmarks: { x: number; y: number; z?: number }[],
) {
  // Convert landmarks to 3D positions using unified coordinate system
  const positions = landmarks.map((pt) => {
    const worldPos = landmarkToWorld(pt);
    return [worldPos.x, worldPos.y, worldPos.z];
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(positions.flat()), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="white"
        sizeAttenuation={true}
        transparent={true}
        alphaTest={0.5}
      />
    </points>
  );
}
