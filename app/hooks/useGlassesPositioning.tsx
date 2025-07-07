import { useEffect } from "react";
import * as THREE from "three";
import { Group } from "three";
import { GLASSES_EYEDISTANCE_MULTIPLIER_3D } from "../utils/config";
import { landmarkToWorld } from "../utils/landmarkToWorld";

// Smoothing state (persists across renders)
const SMOOTHING_FACTOR = 0.5;
let smoothedEuler = new THREE.Euler(0, 0, 0, "YXZ");

export function useGlassesPositioning(
  landmarks: { x: number; y: number; z?: number }[],
  pivot: React.RefObject<Group | null>,
) {
  useEffect(() => {
    if (!landmarks.length || !pivot.current) return;

    // 1. Get landmarks and convert to 3D world space
    const LE3 = landmarkToWorld(landmarks[33]); // left eye
    const RE3 = landmarkToWorld(landmarks[263]); // right eye
    const LE2_3 = landmarkToWorld(landmarks[224]); // left eyelid
    const RE2_3 = landmarkToWorld(landmarks[444]); // right eyelid
    const N3 = landmarkToWorld(landmarks[1]); // nose tip
    const B3 = landmarkToWorld(landmarks[8]); // nose bridge
    const T3 = landmarkToWorld(landmarks[10]); // top most point
    const C3 = landmarkToWorld(landmarks[175]); // chin
    const L3 = landmarkToWorld(landmarks[127]); // left most point
    const R3 = landmarkToWorld(landmarks[356]); // right most point

    if (
      !LE3 ||
      !RE3 ||
      !N3 ||
      !B3 ||
      !T3 ||
      !C3 ||
      !L3 ||
      !R3 ||
      !LE2_3 ||
      !RE2_3
    )
      return;

    // 2. Calculate position and scale
    const eyeMid = new THREE.Vector3()
      .addVectors(LE2_3, RE2_3)
      .multiplyScalar(0.5);
    eyeMid.y -= 0.05;
    eyeMid.z -= 0.08;
    const scale = LE2_3.distanceTo(RE2_3) * GLASSES_EYEDISTANCE_MULTIPLIER_3D;

    // --- BUILD A STABLE 3D COORDINATE SYSTEM ---

    // 3. Define initial Up and Right vectors from facial features
    const initialUp = new THREE.Vector3().subVectors(T3, C3).normalize();
    const initialRight = new THREE.Vector3()
      .subVectors(RE2_3, LE2_3)
      .normalize();

    // 4. Create a true Forward vector using the cross product
    // This is guaranteed to be perpendicular to both initial vectors
    const forward = new THREE.Vector3()
      .crossVectors(initialRight, initialUp)
      .normalize();

    // 5. Re-calculate the Right vector to make it truly perpendicular to the new Forward and Up
    const right = new THREE.Vector3()
      .crossVectors(initialUp, forward)
      .normalize();

    // 6. We now have a perfect, stable, orthogonal basis: (right, initialUp, forward)
    // Create the rotation matrix from these basis vectors
    const rotationMatrix = new THREE.Matrix4().makeBasis(
      right,
      initialUp,
      forward,
    );

    // 7. Decompose the final matrix into Euler angles for smoothing
    const targetEuler = new THREE.Euler().setFromRotationMatrix(
      rotationMatrix,
      "YXZ",
    );

    targetEuler.x *= 2;
    targetEuler.y *= 2;
    targetEuler.z *= 1;

    // 8. Apply smoothing
    smoothedEuler.x += (targetEuler.x - smoothedEuler.x) * SMOOTHING_FACTOR; // yaw
    smoothedEuler.y += (targetEuler.y - smoothedEuler.y) * SMOOTHING_FACTOR; // pitch
    smoothedEuler.z += (targetEuler.z - smoothedEuler.z) * SMOOTHING_FACTOR; // roll

    // 9. Commit transforms
    pivot.current.position.copy(eyeMid);
    pivot.current.scale.setScalar(scale);
    pivot.current.setRotationFromEuler(smoothedEuler);
  }, [landmarks]);
}
