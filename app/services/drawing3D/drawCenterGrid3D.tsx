import React from "react";

/**
 * Renders a center reference grid with X, Y, Z axes for orientation
 * @param showGrid Whether to show the center reference grid
 */
export function drawCenterGrid3D(showGrid: boolean) {
  if (!showGrid) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* X-axis line (red) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-2, 0, 0, 2, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="red" linewidth={1} />
      </line>

      {/* Y-axis line (green) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -1.5, 0, 0, 1.5, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="green" linewidth={1} />
      </line>

      {/* Z-axis line (blue) - going into screen */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, -1, 0, 0, 1]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="blue" linewidth={1} />
      </line>

      {/* Center point */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}
