import { RefObject } from "react";

export interface FaceLandmarkerReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: RefObject<any[]>;
  glassesTransform?: RefObject<any | null>; // Add optional glasses transform ref
}
