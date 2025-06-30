export interface FaceMesh3DProps {
  video: HTMLVideoElement;
  leftEye: { x: number; y: number; z?: number };
  rightEye: { x: number; y: number; z?: number };
  nose: { x: number; y: number; z?: number };
  allLandmarks?: any[];
  showGuideDots?: boolean;
  showGlasses?: boolean;
  showFaceMesh?: boolean;
}