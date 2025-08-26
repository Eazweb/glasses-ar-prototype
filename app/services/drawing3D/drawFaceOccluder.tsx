import React, { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { landmarkToWorld } from "../../utils/landmarkToWorld";
import { TRIANGULATION } from "../../utils/config";

type Props = {
  landmarks: { x: number; y: number; z?: number }[];
  onRendered?: () => void;
};

export function FaceOccluder({ landmarks, onRendered }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create geometry once with static indices
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();

    // Create position buffer with the correct size (478 landmarks * 3 coordinates)
    const positions = new Float32Array(478 * 3);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Set static indices once
    const indices = new Uint16Array(TRIANGULATION.flat());
    geom.setIndex(new THREE.BufferAttribute(indices, 1));

    return geom;
  }, []); // Empty dependency array - geometry created once

  // Update vertex positions in-place each frame
  useEffect(() => {
    if (meshRef.current && landmarks.length > 0) {
      const positionAttribute = meshRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const positions = positionAttribute.array as Float32Array;

      // Update positions in-place
      landmarks.forEach((point, i) => {
        const world = landmarkToWorld(point);
        positions[i * 3] = world.x;
        positions[i * 3 + 1] = world.y;
        positions[i * 3 + 2] = world.z;
      });

      // Mark the attribute as needing update
      positionAttribute.needsUpdate = true;

      // Recompute normals for proper lighting
      meshRef.current.geometry.computeVertexNormals();
    }
  }, [landmarks]);

  useEffect(() => {
    if (onRendered) onRendered();
  }, [onRendered]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        colorWrite={false} // 👈 hides it from being drawn
        depthWrite={true} // 👈 makes it invisible but still blocks other objects
      />
    </mesh>
  );
}
