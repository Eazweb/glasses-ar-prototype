// utils/drawing/drawEyeMarkers3D.tsx
import React from "react";
import { Text } from "@react-three/drei";
import { FACE_KEYPOINTS } from "../faceKeypoints";

/**
 * Renders small colored spheres with text labels at left eye, right eye, and nose.
 * @param landmarks Array of normalized {x,y} landmarks
 * @param scaleX X-axis scaling factor
 * @param scaleY Y-axis scaling factor
 * @param zDepth Z-position depth
 */
export function drawEyeMarkers3D(
  landmarks: { x: number; y: number }[],
  scaleX: number = 2,
  scaleY: number = 1.5,
  zDepth: number = 0.01,
) {
  return (
    <>
      {FACE_KEYPOINTS.map(({ idx, color, label }) => {
        const pt = landmarks[idx];
        if (!pt) return null;

        const pos = [(pt.x - 0.5) * scaleX, -(pt.y - 0.5) * scaleY, zDepth];

        return (
          <group key={idx} position={pos as [number, number, number]}>
            {/* Colored sphere */}
            <mesh>
              <sphereGeometry args={[0.008, 12, 12]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Text label */}
            <Text
              position={[0.01, 0.01, 0]}
              fontSize={0.02}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {label}
            </Text>
          </group>
        );
      })}
    </>
  );
}
