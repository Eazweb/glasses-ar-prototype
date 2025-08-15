// demo/components/drawGlasses3D.demo.tsx
import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Group, Vector3, Quaternion } from "three";
import { useFrame } from "@react-three/fiber";
import { useGlassesPositioning } from "@/app/hooks/useGlassesPositioning";
import { useAlphaFalloff, ShaderSettings } from "@/app/hooks/useAlphaFalloff";

import { GlassesModel } from "@/app/utils/modelImports";

// LERP factor for smooth animation
const LERP_FACTOR = 0.65;

// Default shader settings to demo the fade safely
const defaultShaderSettings: ShaderSettings = {
  color: "#ffffff",
  axis: "z",
  fadeStartPercent: 100,
  fadeEndPercent: 25,
};

export function DrawGlasses3DDemo({
  landmarks,
  glassesTransform,
  onRendered,
  model,
  shaderSettings = defaultShaderSettings,
}: {
  landmarks: { x: number; y: number; z?: number }[];
  glassesTransform?: any | null;
  onRendered?: () => void;
  model: GlassesModel;
  shaderSettings?: ShaderSettings;
}) {
  const pivot = useRef<Group>(null!);
  const modelGroup = useRef<Group>(null!);
  const { scene } = useGLTF(model.path);
  useAlphaFalloff(modelGroup, shaderSettings);

  // Target values for smooth interpolation
  const targetPosition = useRef(new Vector3());
  const targetQuaternion = useRef(new Quaternion());
  const targetScale = useRef(1);

  // If glassesTransform is provided, update target values
  useEffect(() => {
    if (glassesTransform) {
      targetPosition.current.set(
        glassesTransform.position.x,
        glassesTransform.position.y,
        glassesTransform.position.z,
      );
      targetQuaternion.current.set(
        glassesTransform.quaternion.x,
        glassesTransform.quaternion.y,
        glassesTransform.quaternion.z,
        glassesTransform.quaternion.w,
      );
      targetScale.current = glassesTransform.scale;
    }
  }, [glassesTransform]);

  // Use useFrame for smooth updates synchronized with the render loop
  useFrame(() => {
    if (pivot.current) {
      // Interpolate position
      pivot.current.position.lerp(targetPosition.current, LERP_FACTOR);

      // Interpolate rotation (slerp for quaternions)
      pivot.current.quaternion.slerp(targetQuaternion.current, LERP_FACTOR);

      // Interpolate scale
      const currentScale = pivot.current.scale.x;
      const newScale =
        currentScale + (targetScale.current - currentScale) * LERP_FACTOR;
      pivot.current.scale.setScalar(newScale);
    }
  });

  // Fallback to old hook if no transform is provided (slow path)
  useGlassesPositioning(landmarks, pivot, !glassesTransform);

  useEffect(() => {
    if (onRendered && landmarks && landmarks.length > 0) {
      onRendered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landmarks]);

  return (
    <>
      {/* Glasses model anchored to pivot */}
      <group ref={pivot}>
        <group ref={modelGroup}>
          <primitive object={scene} />
        </group>
      </group>

      {/* Debug visualizations */}
      {/* {useGlassesDebug(landmarks, false)} */}
    </>
  );
}
