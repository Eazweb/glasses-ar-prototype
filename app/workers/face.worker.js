// app/workers/face.worker.js
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

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
  const T3 = landmarkToWorld(landmarks[10]);
  const C3 = landmarkToWorld(landmarks[175]);
  if (!T3 || !C3 || !LE2_3 || !RE2_3) return null;
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
  eyeMid.y -= 0.035;
  eyeMid.z += 0;
  // 2. Scale
  const GLASSES_EYEDISTANCE_MULTIPLIER_3D = 0.0033;
  const scale = distance(LE2_3, RE2_3) * GLASSES_EYEDISTANCE_MULTIPLIER_3D;
  // 3. Build coordinate system
  const initialUp = normalize(sub(T3, C3));
  const initialRight = normalize(sub(RE2_3, LE2_3));
  const forward = normalize(cross(initialRight, initialUp));
  const right = normalize(cross(initialUp, forward));
  // 4. Rotation matrix (3x3)
  const rot = [
    [right.x, initialUp.x, forward.x],
    [right.y, initialUp.y, forward.y],
    [right.z, initialUp.z, forward.z],
  ];
  // 5. Convert to quaternion (Three.js convention)
  function matrixToQuaternion(m) {
    // m is 3x3
    const m00 = m[0][0],
      m01 = m[0][1],
      m02 = m[0][2];
    const m10 = m[1][0],
      m11 = m[1][1],
      m12 = m[1][2];
    const m20 = m[2][0],
      m21 = m[2][1],
      m22 = m[2][2];
    const trace = m00 + m11 + m22;
    let qw, qx, qy, qz;
    if (trace > 0) {
      let s = 0.5 / Math.sqrt(trace + 1.0);
      qw = 0.25 / s;
      qx = (m21 - m12) * s;
      qy = (m02 - m20) * s;
      qz = (m10 - m01) * s;
    } else if (m00 > m11 && m00 > m22) {
      let s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
      qw = (m21 - m12) / s;
      qx = 0.25 * s;
      qy = (m01 + m10) / s;
      qz = (m02 + m20) / s;
    } else if (m11 > m22) {
      let s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
      qw = (m02 - m20) / s;
      qx = (m01 + m10) / s;
      qy = 0.25 * s;
      qz = (m12 + m21) / s;
    } else {
      let s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
      qw = (m10 - m01) / s;
      qx = (m02 + m20) / s;
      qy = (m12 + m21) / s;
      qz = 0.25 * s;
    }
    return { x: qx, y: qy, z: qz, w: qw };
  }
  const quaternion = matrixToQuaternion(rot);
  // 6. Yaw for offset
  const targetYaw = Math.atan2(forward.x, forward.z);
  const forwardShift = yawZOffset(targetYaw, forward, 0.028);
  const lateralShift = yawXOffset(targetYaw, right, 0.02);
  eyeMid = add(add(eyeMid, forwardShift), lateralShift);
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
    }
  }
};
