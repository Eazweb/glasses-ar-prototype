// utils/faceKeypoints.tsx
export const FACE_KEYPOINTS = [
  { idx: 33, color: "cyan", label: "L" },
  { idx: 263, color: "magenta", label: "R" },
  { idx: 168, color: "lime", label: "N" },
];

export const FACE_OUTLINE_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

export const LEFT_EYE_INDICES = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];

export const RIGHT_EYE_INDICES = [
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388,
  466,
];

export const NOSE_BRIDGE_INDICES = [
  152, 200, 17, 14, 0, 164, 1, 4, 5, 195, 197, 6, 168, 8, 9, 151, 10,
];

export const MOUTH_OUTLINE_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 61, 185, 40, 39, 37, 0,
  267, 269, 270, 409, 291,
];
