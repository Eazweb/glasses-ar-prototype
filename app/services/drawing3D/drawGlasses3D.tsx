// services/drawing3D/drawGlasses3D.tsx
import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Group, MeshStandardMaterial, Mesh } from "three";
import { useGlassesPositioning } from "../../hooks/useGlassesPositioning";
import { useGlassesDebug } from "../../hooks/useGlassesDebug";

export function DrawGlasses3D({
  landmarks,
}: {
  landmarks: { x: number; y: number; z?: number }[];
}) {
  const pivot = useRef<Group>(null);
  // const { scene } = useGLTF("/model/3d-2-rotated-fixed-newmat.glb"); // already pre-rotated in Blender

  const { scene } = useGLTF("/model/models/cazal.glb"); // the other model

  // Apply materials to the glasses model ( optional )
  // useEffect(() => {
  //   scene.traverse((child) => {
  //     if (child instanceof Mesh) {
  //       // Apply a new material to all meshes in the model
  //       child.material = new MeshStandardMaterial({
  //         color: "#444444", // Dark gray
  //         metalness: 0.9, // Very metallic
  //         roughness: 0.2, // Smooth surface
  //       });
  //     }
  //   });
  // }, [scene]);

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
