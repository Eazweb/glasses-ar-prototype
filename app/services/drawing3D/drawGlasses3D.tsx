// services/drawing3D/drawGlasses3D.tsx
import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Group, MeshStandardMaterial, Mesh } from "three";
import { useGlassesPositioning } from "../../hooks/useGlassesPositioning";
import { useGlassesDebug } from "../../hooks/useGlassesDebug";

export function DrawGlasses3D({
  landmarks,
  onRendered,
}: {
  landmarks: { x: number; y: number; z?: number }[];
  onRendered?: () => void;
}) {
  const pivot = useRef<Group>(null);

  const { scene } = useGLTF("/model/models/cazal.glb");

  // Use the positioning hook
  useGlassesPositioning(landmarks, pivot);

  useEffect(() => {
    if (onRendered && landmarks && landmarks.length > 0) {
      onRendered();
    }
    // Only call when landmarks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landmarks]);

  return (
    <>
      {/* Glasses model anchored to pivot */}
      <group ref={pivot}>
        <primitive object={scene} />
      </group>

      {/* Debug visualizations */}
      {/* {useGlassesDebug(landmarks, false)} */}
    </>
  );
}
