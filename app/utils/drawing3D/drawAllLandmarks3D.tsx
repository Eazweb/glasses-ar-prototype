// utils/drawing/drawAllLandmarks3D.tsx
import React from "react";

/**
 * Renders small white dots at every landmark using efficient points rendering.
 * @param landmarks Array of normalized {x,y} landmarks
 * @param scaleX X-axis scaling factor
 * @param scaleY Y-axis scaling factor
 * @param zDepth Z-position depth
 */
export function drawAllLandmarks3D(
  landmarks: { x: number; y: number }[],
  scaleX: number = 2,
  scaleY: number = 1.5,
  zDepth: number = 0.01,
) {
  // Convert landmarks to 3D positions
  const positions = landmarks.map((pt) => [
    (pt.x - 0.5) * scaleX,
    -(pt.y - 0.5) * scaleY,
    zDepth,
  ]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(positions.flat()), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.005}
        color="white"
        sizeAttenuation={true}
        transparent={true}
        alphaTest={0.5}
      />
    </points>
  );
}
