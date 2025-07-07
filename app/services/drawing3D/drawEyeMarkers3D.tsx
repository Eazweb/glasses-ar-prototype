// utils/drawing/drawEyeMarkers3D.tsx
import React from "react";
import { Text } from "@react-three/drei";
import { FACE_KEYPOINTS } from "../../utils/faceKeypoints";
import { landmarkToWorld } from "../../utils/landmarkToWorld";

/**
 * Renders small colored spheres with text labels at left eye, right eye, and nose.
 * @param landmarks Array of normalized {x,y} landmarks
 */
export function drawEyeMarkers3D(
  landmarks: { x: number; y: number; z?: number }[],
) {
  return (
    <>
      {FACE_KEYPOINTS.map(({ idx, color, label }) => {
        const pt = landmarks[idx];
        if (!pt) return null;

        const pos = landmarkToWorld(pt);

        return (
          <group key={idx} position={pos.toArray()}>
            {/* Colored sphere */}
            <mesh>
              <sphereGeometry args={[0.01, 12, 12]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Text label */}
            <Text
              position={[0.01, 0.01, 0]}
              fontSize={0.04}
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
