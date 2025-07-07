// services/drawing3D/drawGlasses3D.tsx
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Group } from "three";
import { useGlassesPositioning } from "../../hooks/useGlassesPositioning";
import { useGlassesDebug } from "../../hooks/useGlassesDebug";

export function DrawGlasses3D({
  landmarks,
}: {
  landmarks: { x: number; y: number; z?: number }[];
}) {
  const pivot = useRef<Group>(null);
  const { scene } = useGLTF("/model/3d-2-rotated-fixed.glb"); // already pre-rotated in Blender

  // Use the positioning hook
  useGlassesPositioning(landmarks, pivot);

  return (
    <>
      {/* Glasses model anchored to pivot */}
      <group ref={pivot}>
        <primitive object={scene} />
      </group>

      {/* Debug visualizations */}
      {useGlassesDebug(landmarks, false)}
    </>
  );
}
