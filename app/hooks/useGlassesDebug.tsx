import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { landmarkToWorld } from "../utils/landmarkToWorld";
import { createArrow, drawLandmarkArrow } from "../utils/arrowHelper";

// Debug landmarks for glasses positioning
const GLASSES_DEBUG_LANDMARKS = [
  { idx: 33, color: "red", label: "L" }, // left eye
  { idx: 263, color: "blue", label: "R" }, // right eye
  { idx: 1, color: "yellow", label: "N" }, // nose tip
  { idx: 8, color: "orange", label: "B" }, // between eyebrows
  { idx: 175, color: "purple", label: "C" }, // chin
  { idx: 70, color: "cyan", label: "TL" }, // left temple
  { idx: 300, color: "magenta", label: "TR" }, // right temple
];

export function useGlassesDebug(
  landmarks: { x: number; y: number; z?: number }[],
  showDebug: boolean = false,
) {
  if (!showDebug) return null;

  return (
    <>
      {/* Debug spheres at the key landmarks */}
      {GLASSES_DEBUG_LANDMARKS.map(({ idx, color, label }) => {
        const pt = landmarks[idx];
        if (!pt) return null;
        const pos = landmarkToWorld(pt);
        return (
          <group key={idx} position={pos.toArray()}>
            <mesh>
              <sphereGeometry args={[0.015, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <Text
              position={[0.02, 0.02, 0]}
              fontSize={0.05}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {label}
            </Text>
          </group>
        );
      })}

      {/* STABLE 3D COORDINATE SYSTEM VECTORS */}
      {false &&
        (() => {
          const L2 = landmarks[33],
            R2 = landmarks[263],
            N2 = landmarks[1],
            B2 = landmarks[8];
          if (!L2 || !R2 || !N2 || !B2) return null;

          const L3 = landmarkToWorld(L2),
            R3 = landmarkToWorld(R2);
          const N3 = landmarkToWorld(N2),
            B3 = landmarkToWorld(B2);

          // Calculate the stable coordinate system (matching useEffect logic)
          const initialUp = new THREE.Vector3().subVectors(B3, N3).normalize();
          const initialRight = new THREE.Vector3()
            .subVectors(R3, L3)
            .normalize();
          const forward = new THREE.Vector3()
            .crossVectors(initialUp, initialRight)
            .normalize();
          const right = new THREE.Vector3()
            .crossVectors(forward, initialUp)
            .normalize();

          // Use eye midpoint as origin for coordinate system
          const eyeMid = new THREE.Vector3()
            .addVectors(L3, R3)
            .multiplyScalar(0.5);
          const arrowLength = 0.3;

          return (
            <>
              {/* RIGHT vector (red) */}
              <primitive
                object={createArrow(
                  eyeMid,
                  new THREE.Vector3().addVectors(
                    eyeMid,
                    right.clone().multiplyScalar(arrowLength),
                  ),
                  "red",
                )}
              />

              {/* UP vector (green) */}
              <primitive
                object={createArrow(
                  eyeMid,
                  new THREE.Vector3().addVectors(
                    eyeMid,
                    initialUp.clone().multiplyScalar(arrowLength),
                  ),
                  "green",
                )}
              />

              {/* FORWARD vector (blue) */}
              <primitive
                object={createArrow(
                  eyeMid,
                  new THREE.Vector3().addVectors(
                    eyeMid,
                    forward.clone().multiplyScalar(arrowLength),
                  ),
                  "blue",
                )}
              />

              {/* Coordinate system labels */}
              <group
                position={new THREE.Vector3()
                  .addVectors(
                    eyeMid,
                    right.clone().multiplyScalar(arrowLength + 0.02),
                  )
                  .toArray()}
              >
                <Text
                  fontSize={0.05}
                  color="red"
                  anchorX="center"
                  anchorY="middle"
                >
                  RIGHT
                </Text>
              </group>
              <group
                position={new THREE.Vector3()
                  .addVectors(
                    eyeMid,
                    initialUp.clone().multiplyScalar(arrowLength + 0.02),
                  )
                  .toArray()}
              >
                <Text
                  fontSize={0.05}
                  color="green"
                  anchorX="center"
                  anchorY="middle"
                >
                  UP
                </Text>
              </group>
              <group
                position={new THREE.Vector3()
                  .addVectors(
                    eyeMid,
                    forward.clone().multiplyScalar(arrowLength + 0.02),
                  )
                  .toArray()}
              >
                <Text
                  fontSize={0.05}
                  color="blue"
                  anchorX="center"
                  anchorY="middle"
                >
                  FORWARD
                </Text>
              </group>

              {/* Origin point */}
              <mesh position={eyeMid.toArray()}>
                <sphereGeometry args={[0.005, 8, 8]} />
                <meshBasicMaterial color="white" />
              </mesh>
            </>
          );
        })()}

      {/* SIMPLE LANDMARK ARROWS FOR DEBUGGING */}
      {(() => {
        return (
          <>
            {/* Example: Draw arrow from chin to top of head */}
            {drawLandmarkArrow(landmarks, 175, 10, "purple", "CHIN-TOP")}

            {/* Example: Draw arrow from nose bridge to nose tip */}
            {drawLandmarkArrow(landmarks, 127, 356, "orange", "NOSE")}

            {/* Example: Draw arrow from left eye to right eye */}
            {drawLandmarkArrow(landmarks, 224, 444, "cyan", "EYES")}

            {/* Add more arrows here by copying the line above and changing:
                landmarks, [landmark1_idx], [landmark2_idx], "color", "label" */}
          </>
        );
      })()}
    </>
  );
}
