import { MutableRefObject } from "react";

export interface FaceCanvas3DProps {
  videoReady: boolean;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  landmarks: MutableRefObject<number[][] | null>;
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  showGlasses: boolean;
  showGrid: boolean;
  showOccluder: boolean;
  videoTextureVersion: number;
  fps: number;
}
