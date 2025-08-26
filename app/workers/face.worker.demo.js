// app/workers/face.worker.js
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
// Dynamic model params (default values will be overwritten by main thread)
let GLASSES_EYEDISTANCE_MULTIPLIER_3D = 1.0;
let GLASSES_OFFSET_3D = { x: 0, y: 0, z: 0 };
import { computeAdvancedRotation } from "@/app/utils/advancedRotation";
import {
  calculatePitchYOffset,
  calculatePitchZOffset,
} from "@/app/utils/pitchPositionOffset";

import { LATERAL_OFFSET_3D, FORWARD_OFFSET_3D } from "@/app/utils/config";
import { PLANE_SCALE } from "@/app/utils/landmarkToWorld";
import {
  computeDistanceOffsets,
  DEFAULT_DISTANCE_OFFSET_ANCHORS,
} from "@/app/utils/distanceOffsets";

let faceLandmarker = null;
let lastVideoTime = -1;

// Distance-aware scaling state (robust to yaw)
let eyeDistBaseline = 0;
let eyeDistBaselineReady = false;
const EYE_EWMA_ALPHA = 0.02; // slow, stable baseline updates
const DIST_GAIN_MIN = 0.7;
const DIST_GAIN_MAX = 1.5;
let lastDistanceGain = 1.0;
const GAIN_MAX_STEP = 0.05; // limit gain change per frame
const YAW_BASELINE_MAX = 0.35; // ~20 degrees in radians

// Absolute range estimation (pinhole model, approximate)
const APPROX_HFOV_DEG = 65; // tweak per device if needed
const IPD_M = 0.063; // average interpupillary distance in meters

// Static calibration for UI (non-converging)
let calibReady = false;
let calibMean = 0;
let calibM2 = 0; // variance accumulator
let calibCount = 0;
const CALIB_MIN_FRAMES = 25;
const CALIB_YAW_MAX = 0.25; // ~14 degrees
const CALIB_REL_STD_MAX = 0.06; // 6% relative std-dev tolerance

function calibUpdate(value, yawAbs) {
  if (calibReady) return;
  if (yawAbs > CALIB_YAW_MAX) return; // only frontal-ish
  calibCount += 1;
  // Welford's online variance
  const delta = value - calibMean;
  calibMean += delta / calibCount;
  const delta2 = value - calibMean;
  calibM2 += delta * delta2;
  if (calibCount >= CALIB_MIN_FRAMES) {
    const variance = calibM2 / (calibCount - 1);
    const std = Math.sqrt(Math.max(variance, 0));
    const relStd = calibMean > 1e-6 ? std / calibMean : 1;
    if (relStd < CALIB_REL_STD_MAX) {
      calibReady = true; // lock calibration
    }
  }
}

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
function computeGlassesTransform(landmarks, frameW, frameH) {
  // Utility: landmarkToWorld
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
  // Math (use original normalized landmarks for pixel measures too)
  const LE2_3 = landmarkToWorld(landmarks[224]);
  const RE2_3 = landmarkToWorld(landmarks[444]);
  const LE2 = landmarkToWorld(landmarks[133]);
  const RE2 = landmarkToWorld(landmarks[463]);
  const T3 = landmarkToWorld(landmarks[10]);
  const C3 = landmarkToWorld(landmarks[175]);
  if (!T3 || !C3 || !LE2_3 || !RE2_3 || !LE2 || !RE2) return null;
  // Vector math
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

  // 6. Yaw for offset (and distance-aware scaling)
  const targetYaw = Math.atan2(forward.x, forward.z);

  // Robust inter-ocular distance in world (for scaling gain)
  const eyeVecWorld = sub(RE2_3, LE2_3);
  const eyeDistProj = Math.abs(
    eyeVecWorld.x * right.x + eyeVecWorld.y * right.y + eyeVecWorld.z * right.z,
  );

  // Update baseline only when yaw is small; taper alpha with yaw
  const yawAbs = Math.abs(targetYaw);
  const yawWeight = Math.max(0, 1 - yawAbs / YAW_BASELINE_MAX); // 1→0 as yaw grows
  const alpha = EYE_EWMA_ALPHA * yawWeight;

  // Update static calibration (non-converging) for UI
  calibUpdate(eyeDistProj, yawAbs);

  if (!eyeDistBaselineReady) {
    eyeDistBaseline = eyeDistProj;
    eyeDistBaselineReady = true;
  } else if (alpha > 0) {
    eyeDistBaseline += alpha * (eyeDistProj - eyeDistBaseline);
  }

  // Distance gain with clamp and rate limit (for offsets)
  const rawGain = eyeDistBaseline > 1e-6 ? eyeDistProj / eyeDistBaseline : 1.0;
  const clampedGain = Math.min(DIST_GAIN_MAX, Math.max(DIST_GAIN_MIN, rawGain));
  const deltaGain = clampedGain - lastDistanceGain;
  const limitedGain =
    lastDistanceGain +
    Math.max(-GAIN_MAX_STEP, Math.min(GAIN_MAX_STEP, deltaGain));
  lastDistanceGain = limitedGain;

  // 7. Absolute distance estimate (meters) using pinhole model with yaw correction
  // Use original normalized landmark positions for pixel measure
  const leN = landmarks[133];
  const reN = landmarks[463];
  let rangeM = NaN;
  if (leN && reN && frameW && frameH) {
    const dxPx = (reN.x - leN.x) * frameW;
    const dyPx = (reN.y - leN.y) * frameH;
    const eyeDistPx = Math.hypot(dxPx, dyPx);
    const cosYaw = Math.max(0.3, Math.cos(targetYaw)); // avoid blow-ups
    const eyeDistPxCorrected = eyeDistPx / cosYaw; // undo yaw foreshortening
    const hfovRad = (APPROX_HFOV_DEG * Math.PI) / 180;
    const fPx = (0.5 * frameW) / Math.tan(hfovRad / 2);
    rangeM = (fPx * IPD_M) / Math.max(1e-3, eyeDistPxCorrected);
    // Clamp to a sensible range
    rangeM = Math.max(0.2, Math.min(3.5, rangeM));
  }

  // 8. Apply distance-offset mapping (smooth interpolation between anchors)
  // Keep simple defaults; user will tweak anchors in DEFAULT_DISTANCE_OFFSET_ANCHORS.
  const { forward: forwardOffset, lateral: lateralOffset } =
    computeDistanceOffsets(
      typeof rangeM === "number" && !Number.isNaN(rangeM) ? rangeM : NaN,
      DEFAULT_DISTANCE_OFFSET_ANCHORS,
    );

  const forwardShift = yawZOffset(targetYaw, forward, forwardOffset);
  const lateralShift = yawXOffset(targetYaw, right, lateralOffset);
  eyeMid = add(add(eyeMid, forwardShift), lateralShift);

  // 9. Pitch-based positional offset
  const pitch = Math.asin(-rot[1][2]); // Extract pitch from rotation matrix
  const pitchYOffset = calculatePitchYOffset(pitch);
  const pitchZOffset = calculatePitchZOffset(pitch);

  eyeMid.y -= pitchYOffset;
  eyeMid.z -= pitchZOffset;

  // Return transform and distance info for UI/debug
  // Prefer static calibration ratio (non-converging) when ready; fallback to dynamic ratio
  const staticRatio =
    calibReady && calibMean > 1e-6 ? eyeDistProj / calibMean : lastDistanceGain;
  const distanceInfo = {
    ratio: lastDistanceGain, // dynamic (for offsets)
    staticRatio, // static (for UI)
    raw: eyeDistProj, // world-projected width (robust)
    baseline: eyeDistBaseline,
    yawAbs,
    rangeM, // absolute distance estimate (meters)
  };

  return {
    position: eyeMid,
    scale,
    quaternion,
    distanceInfo,
  };
}

// Listen for messages from the main thread
self.onmessage = (event) => {
  const { type, videoFrame, scale, offset } = event.data;

  if (type === "SET_MODEL_PARAMS") {
    if (typeof scale === "number" && offset) {
      GLASSES_EYEDISTANCE_MULTIPLIER_3D = scale;
      GLASSES_OFFSET_3D = offset;
    }
    return;
  }

  if (type === "VIDEO_FRAME") {
    if (!faceLandmarker) return;
    const nowInMs = Date.now();
    // Always run detection on every frame, use provided timestamp if available
    const results = faceLandmarker.detectForVideo(videoFrame, nowInMs);
    // Post the detected landmarks back to the main thread
    if (results.faceLandmarks.length > 0) {
      // Compute glasses transform (pass frame dimensions for absolute distance)
      const glassesTransform = computeGlassesTransform(
        results.faceLandmarks[0],
        videoFrame && videoFrame.width ? videoFrame.width : undefined,
        videoFrame && videoFrame.height ? videoFrame.height : undefined,
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
