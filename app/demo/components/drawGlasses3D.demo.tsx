// demo/components/drawGlasses3D.demo.tsx
import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Group } from "three";
import { useGlassesPositioning } from "@/app/hooks/useGlassesPositioning";

import { GlassesModel } from "@/app/utils/modelImports";

export function DrawGlasses3DDemo({
  landmarks,
  glassesTransform,
  onRendered,
  model,
}: {
  landmarks: { x: number; y: number; z?: number }[];
  glassesTransform?: any | null;
  onRendered?: () => void;
  model: GlassesModel;
}) {
  const pivot = useRef<Group>(null);

  const { scene } = useGLTF(model.path);

  // If glassesTransform is provided, use it directly (fast path)
  useEffect(() => {
    if (glassesTransform && pivot.current) {
      pivot.current.position.set(
        glassesTransform.position.x,
        glassesTransform.position.y,
        glassesTransform.position.z,
      );
      pivot.current.scale.setScalar(glassesTransform.scale);
      pivot.current.quaternion.set(
        glassesTransform.quaternion.x,
        glassesTransform.quaternion.y,
        glassesTransform.quaternion.z,
        glassesTransform.quaternion.w,
      );
    }
  }, [glassesTransform]);

  // Fallback to old hook if no transform is provided (slow path)
  useGlassesPositioning(landmarks, pivot, !glassesTransform);

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
