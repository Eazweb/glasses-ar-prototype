import { useEffect } from "react";
import * as THREE from "three";
import { Group } from "three";
import { GLASSES_EYEDISTANCE_MULTIPLIER_3D } from "../utils/config";
import { landmarkToWorld } from "../utils/landmarkToWorld";
import { computeAdvancedRotation } from "../utils/advancedRotation";
import {
  calculatePitchYOffset,
  calculatePitchZOffset,
} from "../utils/pitchPositionOffset";

// Smoothing for position (less aggressive than rotation)
const SMOOTH_POSITION = 0.5;
let smoothedEyeMid = new THREE.Vector3();

export function useGlassesPositioningAdvanced(
  landmarks: { x: number; y: number; z?: number }[],
  pivot: React.RefObject<Group | null>,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled || !landmarks.length || !pivot.current) return;

    // 1. Get landmarks and convert to 3D world space
    const LE2_3 = landmarkToWorld(landmarks[224]);
    const RE2_3 = landmarkToWorld(landmarks[444]);
    const T3 = landmarkToWorld(landmarks[10]);
    const C3 = landmarkToWorld(landmarks[175]);

    if (!T3 || !C3 || !LE2_3 || !RE2_3) return;

    // 2. Calculate position and scale
    const eyeMid = new THREE.Vector3()
      .addVectors(LE2_3, RE2_3)
      .multiplyScalar(0.5);
    eyeMid.y -= 0.035;

    const scale = LE2_3.distanceTo(RE2_3) * GLASSES_EYEDISTANCE_MULTIPLIER_3D;

    // 3. Build a stable 3D coordinate system
    const initialUp = new THREE.Vector3().subVectors(T3, C3).normalize();
    const initialRight = new THREE.Vector3()
      .subVectors(RE2_3, LE2_3)
      .normalize();
    const forward = new THREE.Vector3()
      .crossVectors(initialRight, initialUp)
      .normalize();
    const right = new THREE.Vector3()
      .crossVectors(initialUp, forward)
      .normalize();

    // 4. Create the rotation matrix from these basis vectors
    const rotationMatrix = [
      [right.x, initialUp.x, forward.x],
      [right.y, initialUp.y, forward.y],
      [right.z, initialUp.z, forward.z],
    ];

    // 5. Compute rotation with the new advanced, eased method
    const quaternion = computeAdvancedRotation(rotationMatrix);

    // 6. Apply positional offsets for yaw
    const targetYaw = Math.atan2(forward.x, forward.z);
    const forwardShift = useYawZOffset(targetYaw, forward, 0.028);
    const lateralShift = useYawXOffset(targetYaw, right, 0.02);
    eyeMid.add(forwardShift).add(lateralShift);

    // 7. Apply pitch-based positional offset
    const pitch = Math.asin(-rotationMatrix[1][2]); // Extract pitch from rotation matrix
    const pitchYOffset = calculatePitchYOffset(pitch);
    const pitchZOffset = calculatePitchZOffset(pitch);

    eyeMid.y += pitchYOffset;
    eyeMid.z += pitchZOffset;

    // 8. Apply smoothing to position
    smoothedEyeMid.lerp(eyeMid, SMOOTH_POSITION);

    // 9. Commit transforms
    pivot.current.position.copy(smoothedEyeMid);
    pivot.current.scale.setScalar(scale);
    pivot.current.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    );
  }, [landmarks, pivot, enabled]);
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
