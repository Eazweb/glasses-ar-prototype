import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { landmarkToWorld } from "../../utils/landmarkToWorld";
import { TRIANGULATION } from "../../utils/config";

type Props = {
  landmarks: { x: number; y: number; z?: number }[];
  onRendered?: () => void;
};

export function FaceOccluder({ landmarks, onRendered }: Props) {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();

    const positions = new Float32Array(landmarks.length * 3);
    landmarks.forEach((point, i) => {
      const world = landmarkToWorld(point);

      positions[i * 3] = world.x;
      positions[i * 3 + 1] = world.y;
      positions[i * 3 + 2] = world.z;
    });

    const indices = new Uint16Array(TRIANGULATION.flat());

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    return geom;
  }, [landmarks]);

  useEffect(() => {
    if (onRendered) onRendered();
    // Only call once after mount or when geometry changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        colorWrite={false} // 👈 hides it from being drawn
        depthWrite={true} // 👈 makes it invisible but still blocks other objects
      />
    </mesh>
  );
}
