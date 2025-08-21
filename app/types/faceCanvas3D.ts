import { FaceLandmarkerReturn } from "./faceLandmarker";

export interface FaceCanvas3DProps extends FaceLandmarkerReturn {
  videoReady: boolean;
  videoTextureVersion: number;
  fps: number;
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  showGlasses: boolean;
  showGrid: boolean;
  showOccluder: boolean;
  onOccluderRendered: () => void;
  onGlassesRendered: () => void;
  onVideoTextureReady?: () => void;
}
