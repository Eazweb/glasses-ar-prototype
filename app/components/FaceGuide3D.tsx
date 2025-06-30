// components/FaceGuide3D.tsx
import React from "react";
import { FACE_KEYPOINTS } from "../utils/faceKeypoints";

export default function FaceGuide3D({
  landmarks,
}: {
  landmarks: { x: number; y: number; z?: number }[];
}) {
  return (
    <>
      {FACE_KEYPOINTS.map(({ idx, color }) => {
        const pt = landmarks[idx];
        if (!pt) return null;
        const ndcX = (pt.x - 0.5) * 2;
        const ndcY = -(pt.y - 0.5) * 2;
        return (
          <mesh key={idx} position={[ndcX, ndcY, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
    </>
  );
}
