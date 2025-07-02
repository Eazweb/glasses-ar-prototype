export interface FaceCanvas2DProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: React.MutableRefObject<number[][] | null>;
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  showGlasses: boolean;
}
