/**
 * This file contains the advanced rotation logic for the glasses,
 * designed to be shared between the main thread (useGlassesPositioning) and the worker (face.worker.js).
 */

// --- CONFIGURATION ---
const PITCH_SETTINGS = { multiplier: 1.4, ease: "linear" };
const YAW_SETTINGS = { multiplier: 0.9, ease: "out-quad" };
const ROLL_SETTINGS = { multiplier: 1.0, ease: "linear" };

// --- EASING FUNCTIONS ---

/**
 * A collection of easing functions.
 * Given a value `t` between 0 and 1, they return an eased value.
 */
const Easing = {
  linear: (t: number) => t,
  "in-quad": (t: number) => t * t,
  "out-quad": (t: number) => t * (2 - t),
  "in-out-quad": (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * Applies a specified easing curve to a directional angle.
 * @param angle - The raw angle in radians.
 * @param multiplier - The factor to amplify the angle.
 * @param ease - The name of the easing function to use.
 * @returns The eased angle.
 */
function applyEasedRotation(
  angle: number,
  multiplier: number,
  ease: keyof typeof Easing,
): number {
  const sign = Math.sign(angle);
  const normalizedAngle = Math.abs(angle) / (Math.PI / 2); // Normalize to [0, 1] relative to 90 degrees
  const easedT = Easing[ease](Math.min(normalizedAngle, 1));
  return sign * easedT * (Math.PI / 2) * multiplier;
}

// --- CORE ROTATION LOGIC ---

/**
 * Takes a rotation matrix and computes the final, eased quaternion for the glasses.
 * @param rotationMatrix - A 3x3 rotation matrix as a nested array.
 * @returns A quaternion object {x, y, z, w}.
 */
export function computeAdvancedRotation(rotationMatrix: number[][]) {
  // --- Gimbal-Lock-Free Sequential Decomposition ---
  const { pitch, yaw, roll } = decomposeMatrix(rotationMatrix);

  // 2. Apply easing to each axis
  const easedPitch = applyEasedRotation(
    pitch,
    PITCH_SETTINGS.multiplier,
    PITCH_SETTINGS.ease as keyof typeof Easing,
  );
  const easedYaw = applyEasedRotation(
    yaw,
    YAW_SETTINGS.multiplier,
    YAW_SETTINGS.ease as keyof typeof Easing,
  );
  const easedRoll = applyEasedRotation(
    roll,
    ROLL_SETTINGS.multiplier,
    ROLL_SETTINGS.ease as keyof typeof Easing,
  );

  // 3. Recombine eased angles into the final quaternion
  return eulerToQuaternion({ x: easedPitch, y: easedYaw, z: easedRoll });
}

// --- MATRIX/QUATERNION HELPERS ---

/**
 * Decomposes a rotation matrix into yaw, pitch, and roll in a gimbal-lock-safe way.
 */
function decomposeMatrix(m: number[][]) {
  let yaw, pitch, roll;

  // Extract pitch from the matrix, handling the edge case of looking straight up or down
  pitch = Math.asin(-m[1][2]);

  if (Math.abs(m[1][2]) < 0.99999) {
    // Standard case: not looking straight up or down
    yaw = Math.atan2(m[0][2], m[2][2]);
    roll = Math.atan2(m[1][0], m[1][1]);
  } else {
    // Gimbal lock case: looking straight up or down
    // We can't distinguish between yaw and roll, so we set roll to 0 and calculate yaw
    yaw = Math.atan2(-m[2][0], m[0][0]);
    roll = 0;
  }

  return { pitch, yaw, roll };
}

/**
 * Converts a 3x3 rotation matrix to Euler angles (YXZ order).
 * @deprecated This method is prone to gimbal lock and is replaced by decomposeMatrix.
 */
function matrixToEuler(m: number[][]) {
  const m11 = m[0][0],
    m12 = m[0][1],
    m13 = m[0][2];
  const m21 = m[1][0],
    m22 = m[1][1],
    m23 = m[1][2];
  const m31 = m[2][0],
    m32 = m[2][1],
    m33 = m[2][2];

  let x, y, z;
  y = Math.asin(Math.max(-1, Math.min(1, m13)));

  if (Math.abs(m13) < 0.99999) {
    x = Math.atan2(-m23, m33);
    z = Math.atan2(-m12, m11);
  } else {
    x = Math.atan2(m32, m22);
    z = 0;
  }
  return { x, y, z };
}

/**
 * Converts Euler angles to a Quaternion.
 */
function eulerToQuaternion({ x, y, z }: { x: number; y: number; z: number }) {
  const c1 = Math.cos(y / 2); // yaw
  const s1 = Math.sin(y / 2);
  const c2 = Math.cos(z / 2); // roll
  const s2 = Math.sin(z / 2);
  const c3 = Math.cos(x / 2); // pitch
  const s3 = Math.sin(x / 2);

  const w = c1 * c2 * c3 - s1 * s2 * s3;
  const qx = s1 * s2 * c3 + c1 * c2 * s3;
  const qy = s1 * c2 * c3 + c1 * s2 * s3;
  const qz = c1 * s2 * c3 - s1 * c2 * s3;

  return { x: qx, y: qy, z: qz, w };
}
