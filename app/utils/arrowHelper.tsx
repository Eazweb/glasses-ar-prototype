import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { landmarkToWorld } from "./landmarkToWorld";

// Helper function to create an arrow
export function createArrow(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: string,
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const arrow = new THREE.ArrowHelper(
    direction.normalize(),
    start,
    length,
    color,
    length * 0.2, // head length
    length * 0.1, // head width
  );
  return arrow;
}

// Simple function to draw arrow between two landmarks
export function drawLandmarkArrow(
  landmarks: { x: number; y: number; z?: number }[],
  landmark1Idx: number,
  landmark2Idx: number,
  color: string = "yellow",
  label?: string,
) {
  const pt1 = landmarks[landmark1Idx];
  const pt2 = landmarks[landmark2Idx];
  if (!pt1 || !pt2) return null;

  const pos1 = landmarkToWorld(pt1);
  const pos2 = landmarkToWorld(pt2);

  return (
    <>
      <primitive object={createArrow(pos1, pos2, color)} />
      {label && (
        <group position={pos2.toArray()}>
          <Text fontSize={0.03} color={color} anchorX="left" anchorY="middle">
            {label}
          </Text>
        </group>
      )}
    </>
  );
}
