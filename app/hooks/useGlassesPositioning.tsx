import { useEffect } from "react";
import * as THREE from "three";
import { Group } from "three";
import { GLASSES_EYEDISTANCE_MULTIPLIER_3D } from "../utils/config";
import { landmarkToWorld } from "../utils/landmarkToWorld";
import { useKalmanLandmark } from "./useKalmanLandmark";

// Smoothing state (persists across renders)
const SMOOTHING_FACTOR_XYZ = 0.8;
const SMOOTH_X = 0.8; // pitch
const SMOOTH_Y = 0.8; // yaw
const SMOOTH_Z = 0.8; // roll
let smoothedEuler = new THREE.Euler(0, 0, 0, "YXZ");

export function useGlassesPositioning(
  landmarks: { x: number; y: number; z?: number }[],
  pivot: React.RefObject<Group | null>,
  enabled: boolean = true,
) {
  // Move all hook calls to the top level
  // const smoothedLandmark224 = useKalmanLandmark(
  //   landmarks[224] || { x: 0, y: 0, z: 0 },
  // );
  // const smoothedLandmark444 = useKalmanLandmark(
  //   landmarks[444] || { x: 0, y: 0, z: 0 },
  // );
  // const smoothedLandmark10 = useKalmanLandmark(
  //   landmarks[10] || { x: 0, y: 0, z: 0 },
  // );
  // const smoothedLandmark175 = useKalmanLandmark(
  //   landmarks[175] || { x: 0, y: 0, z: 0 },
  // );

  useEffect(() => {
    if (!enabled || !landmarks.length || !pivot.current) return;

    // 1. Get landmarks and convert to 3D world space
    // const LE2_3 = landmarkToWorld(smoothedLandmark224); // left eyelid
    // const RE2_3 = landmarkToWorld(smoothedLandmark444); // right eyelid
    // const T3 = landmarkToWorld(smoothedLandmark10); // top most point
    // const C3 = landmarkToWorld(smoothedLandmark175); // chin

    const LE2_3 = landmarkToWorld(landmarks[224]); // left eyelid
    const RE2_3 = landmarkToWorld(landmarks[444]); // right eyelid
    const T3 = landmarkToWorld(landmarks[10]); // top most point
    const C3 = landmarkToWorld(landmarks[175]); // chin

    if (!T3 || !C3 || !LE2_3 || !RE2_3) return;

    // 2. Calculate position and scale
    const eyeMid = new THREE.Vector3()
      .addVectors(LE2_3, RE2_3)
      .multiplyScalar(0.5);
    eyeMid.y -= 0.035;
    eyeMid.z += 0;
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

    targetEuler.x *= 1.35; // pitch
    targetEuler.y *= 1.75; // yaw
    targetEuler.z *= 1; // roll

    const yaw = targetEuler.y;

    // 8. Apply smoothing
    smoothedEuler.x += (targetEuler.x - smoothedEuler.x) * SMOOTH_X; // pitch
    smoothedEuler.y += (targetEuler.y - smoothedEuler.y) * SMOOTH_Y; // yaw
    smoothedEuler.z += (targetEuler.z - smoothedEuler.z) * SMOOTH_Z; // roll

    const forwardShift = useYawZOffset(yaw, forward, 0.028);
    const lateralShift = useYawXOffset(yaw, right, 0.02);
    eyeMid.add(forwardShift).add(lateralShift);

    // 9. Commit transforms
    pivot.current.position.copy(eyeMid);
    pivot.current.scale.setScalar(scale);
    pivot.current.setRotationFromEuler(smoothedEuler);
  }, [
    landmarks,
    // smoothedLandmark224,
    // smoothedLandmark444,
    // smoothedLandmark10,
    // smoothedLandmark175,
  ]);
}

/**
 * Calculates a forward Z-axis offset based on yaw.
 * Prevents glasses from clipping into the cheeks by pushing them slightly forward when yawing.
 *
 * @param yaw - Euler yaw in radians (positive = head turned right, negative = left)
 * @param forward - The current forward vector of the head
 * @param intensity - Max push distance at max yaw (default: 0.1)
 * @param maxYaw - Max yaw angle to normalize against (default: 0.6 radians)
 * @returns a Vector3 offset to add to position
 */
export function useYawZOffset(
  yaw: number,
  forward: THREE.Vector3,
  intensity = 0.1,
  maxYaw = 0.6,
): THREE.Vector3 {
  const clampedYaw = Math.min(Math.abs(yaw), maxYaw);
  const strength = clampedYaw / maxYaw;
  return forward.clone().multiplyScalar(strength * intensity);
}

/**
 * Calculates a lateral X-axis offset based on yaw direction.
 * Makes the glasses shift sideways when turning, to simulate more realistic head geometry.
 *
 * @param yaw - Euler yaw in radians (positive = head turned right)
 * @param right - The current right vector of the head
 * @param intensity - Max lateral offset (default: 0.05)
 * @param maxYaw - Max yaw angle to normalize against (default: 0.6 radians)
 * @returns a Vector3 offset to add to position
 */
export function useYawXOffset(
  yaw: number,
  right: THREE.Vector3,
  intensity = 0.05,
  maxYaw = 0.6,
): THREE.Vector3 {
  const clampedYaw = Math.max(Math.min(yaw, maxYaw), -maxYaw);
  const strength = clampedYaw / maxYaw; // negative = left, positive = right
  // ⏩ Ease-out curve — starts slow, speeds up
  const eased = Math.sign(strength) * Math.pow(Math.abs(strength), 1.8);

  return right.clone().multiplyScalar(eased * intensity);
}
