import { RefObject } from "react";

export interface FaceLandmarkerReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: RefObject<any[]>;
}
