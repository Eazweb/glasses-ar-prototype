export interface FaceCanvas3DProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoReady: boolean;
  landmarks: React.MutableRefObject<number[][] | null>;
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  showGlasses: boolean;
  showGrid: boolean;
  showOccluder: boolean;
  videoTextureVersion: number;
  fps: number;
  onOccluderRendered?: () => void;
  onGlassesRendered?: () => void;
}
