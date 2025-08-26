// app/workers/face.worker.js
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import {
  GLASSES_EYEDISTANCE_MULTIPLIER_3D,
  GLASSES_OFFSET_3D,
  LATERAL_OFFSET_3D,
  FORWARD_OFFSET_3D,
} from "@/app/utils/config";
import { computeAdvancedRotation } from "@/app/utils/advancedRotation";
import {
  calculatePitchYOffset,
  calculatePitchZOffset,
} from "@/app/utils/pitchPositionOffset";

let faceLandmarker = null;
let lastVideoTime = -1;

// Initialize the FaceLandmarker model
async function setup() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: self.location.origin + "/model.task/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
  });
  // Signal that the worker is ready
  self.postMessage({ type: "WORKER_READY" });
}

setup();

// --- Glasses positioning math (ported from useGlassesPositioning) ---
function computeGlassesTransform(landmarks) {
  // Utility: landmarkToWorld
  const PLANE_SCALE = { x: 0.9, y: 0.9, z: 0.6 };
  const PLANE_Z = 0;
  function landmarkToWorld(pt) {
    return {
      x: (pt.x - 0.5) * PLANE_SCALE.x,
      y: (0.5 - pt.y) * PLANE_SCALE.y,
      z: pt.z !== undefined ? -pt.z * PLANE_SCALE.z + PLANE_Z : PLANE_Z,
    };
  }
  // Utility: Yaw Z offset
  function yawZOffset(yaw, forward, intensity = 0.028, maxYaw = 0.6) {
    const clampedYaw = Math.min(Math.abs(yaw), maxYaw);
    const strength = clampedYaw / maxYaw;
    return {
      x: forward.x * strength * intensity,
      y: forward.y * strength * intensity,
      z: forward.z * strength * intensity,
    };
  }
  // Utility: Yaw X offset
  function yawXOffset(yaw, right, intensity = 0.02, maxYaw = 0.6) {
    const clampedYaw = Math.max(Math.min(yaw, maxYaw), -maxYaw);
    const strength = clampedYaw / maxYaw;
    const eased = Math.sign(strength) * Math.pow(Math.abs(strength), 1.8);
    return {
      x: right.x * eased * intensity,
      y: right.y * eased * intensity,
      z: right.z * eased * intensity,
    };
  }
  // Math
  const LE2_3 = landmarkToWorld(landmarks[224]);
  const RE2_3 = landmarkToWorld(landmarks[444]);
  const LE2 = landmarkToWorld(landmarks[133]);
  const RE2 = landmarkToWorld(landmarks[463]);
  const T3 = landmarkToWorld(landmarks[10]);
  const C3 = landmarkToWorld(landmarks[175]);
  if (!T3 || !C3 || !LE2_3 || !RE2_3 || !LE2 || !RE2) return null;
  // Vector math
  function vec3(a) {
    return [a.x, a.y, a.z];
  }
  function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }
  function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }
  function mul(a, s) {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
  }
  function normalize(a) {
    const l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    return l === 0
      ? { x: 0, y: 0, z: 0 }
      : { x: a.x / l, y: a.y / l, z: a.z / l };
  }
  function cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }
  function distance(a, b) {
    return Math.sqrt(
      (a.x - b.x) * (a.x - b.x) +
        (a.y - b.y) * (a.y - b.y) +
        (a.z - b.z) * (a.z - b.z),
    );
  }
  // 1. Eye midpoint
  let eyeMid = mul(add(LE2_3, RE2_3), 0.5);
  eyeMid.x += GLASSES_OFFSET_3D.x;
  eyeMid.y += GLASSES_OFFSET_3D.y;
  eyeMid.z += GLASSES_OFFSET_3D.z;

  // 2. Scale
  const scale = distance(LE2_3, RE2_3) * GLASSES_EYEDISTANCE_MULTIPLIER_3D;
  // 3. Build coordinate system
  const initialUp = normalize(sub(T3, C3));
  const initialRight = normalize(sub(RE2, LE2));
  const forward = normalize(cross(initialRight, initialUp));
  const right = normalize(cross(initialUp, forward));
  // 4. Rotation matrix (3x3)
  const rot = [
    [right.x, initialUp.x, forward.x],
    [right.y, initialUp.y, forward.y],
    [right.z, initialUp.z, forward.z],
  ];
  // 5. Convert to quaternion using the advanced, eased method
  const quaternion = computeAdvancedRotation(rot);

  // 6. Yaw for offset
  const targetYaw = Math.atan2(forward.x, forward.z);
  const forwardShift = yawZOffset(targetYaw, forward, FORWARD_OFFSET_3D);
  const lateralShift = yawXOffset(targetYaw, right, LATERAL_OFFSET_3D);
  eyeMid = add(add(eyeMid, forwardShift), lateralShift);

  // 7. Pitch-based positional offset
  const pitch = Math.asin(-rot[1][2]); // Extract pitch from rotation matrix
  const pitchYOffset = calculatePitchYOffset(pitch);
  const pitchZOffset = calculatePitchZOffset(pitch);

  eyeMid.y -= pitchYOffset;
  eyeMid.z -= pitchZOffset;

  // Return transform
  return {
    position: eyeMid,
    scale,
    quaternion,
  };
}

// Listen for messages from the main thread
self.onmessage = (event) => {
  const { type, videoFrame } = event.data;

  if (type === "VIDEO_FRAME") {
    if (!faceLandmarker) return;

    const nowInMs = Date.now();
    // Always run detection on every frame
    const results = faceLandmarker.detectForVideo(videoFrame, nowInMs);
    // Post the detected landmarks back to the main thread
    if (results.faceLandmarks.length > 0) {
      // Compute glasses transform
      const glassesTransform = computeGlassesTransform(
        results.faceLandmarks[0],
      );
      self.postMessage({
        type: "LANDMARKS_RESULT",
        landmarks: results.faceLandmarks,
        glassesTransform,
      });
    } else {
      // Send empty result when no face is detected
      self.postMessage({
        type: "LANDMARKS_RESULT",
        landmarks: [],
        glassesTransform: null,
      });
    }
  }
};
