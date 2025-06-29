import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

/**
 * Props interface for FaceMesh3D component
 */
interface FaceMesh3DProps {
  /** Left eye landmark coordinates */
  leftEye: any;
  /** Right eye landmark coordinates */
  rightEye: any;
  /** Nose bridge landmark coordinates */
  nose: any;
  /** Whether to show the face mesh overlay */
  showFaceMesh?: boolean;
  /** Whether to show the 3D glasses model */
  showGlasses?: boolean;
  /** Whether to show the guide dots (L, R, N markers) */
  showGuideDots?: boolean;
  /** All 468 facial landmarks from MediaPipe */
  allLandmarks?: any[];
}

/**
 * 3D glasses model component that renders GLB model and face mesh
 *
 * Features:
 * - Real-time positioning based on facial landmarks
 * - 3D face mesh visualization with landmark spheres
 * - Toggleable glasses and mesh visibility
 * - Debug markers for key facial points
 *
 * @param props - FaceMesh3DProps containing landmark data and visibility flags
 * @returns JSX.Element - The 3D glasses model component
 */
export function GlassesModel({
  leftEye,
  rightEye,
  nose,
  showFaceMesh = false,
  showGlasses = true,
  showGuideDots = false,
  allLandmarks,
}: FaceMesh3DProps) {
  const modelRef = useRef<THREE.Group>(null);
  const debugRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF("/model/3d.glb");

  /**
   * Animation frame update for real-time positioning
   */
  useFrame(() => {
    if (!leftEye || !rightEye || !modelRef.current || !debugRef.current) return;

    // normalized center & vector
    const cx = (leftEye.x + rightEye.x) / 2;
    const cy = (leftEye.y + rightEye.y) / 2;
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const angle = Math.atan2(dy, dx);
    const eyeDist = Math.hypot(dx, dy);

    // map [0,1] → NDC [-1,1]
    const ndcX = (cx - 0.5) * 2;
    const ndcY = -(cy - 0.5) * 2;

    // Always position the debug sphere
    debugRef.current.position.set(ndcX, ndcY, -1.2);

    // 1) position & rotate your model - only if showGlasses is true
    if (showGlasses) {
      console.log(
        "Drawing glasses in 3D mode, showGlasses:",
        showGlasses,
        "eyeDist:",
        eyeDist,
      );
      modelRef.current.position.set(ndcX, ndcY, -1.2);
      modelRef.current.rotation.set(Math.PI / 2, 0, -angle);
      modelRef.current.scale.set(eyeDist * 3, eyeDist * 3, eyeDist * 3);
    } else {
      console.log("Glasses disabled in 3D mode");
      // Hide the model by scaling it to 0
      modelRef.current.scale.set(0, 0, 0);
    }
  });

  /**
   * Convert normalized coordinates to NDC (Normalized Device Coordinates)
   *
   * @param x - Normalized x coordinate [0,1]
   * @param y - Normalized y coordinate [0,1]
   * @returns [number, number, number] - NDC coordinates [-1,1] with z-depth
   */
  const toNDC = (x: number, y: number): [number, number, number] => {
    return [(x - 0.5) * 2, -(y - 0.5) * 2, -1.2];
  };

  return (
    <>
      {/* 3D glasses model */}
      <primitive ref={modelRef} object={scene} />

      {/* Debug sphere at anchor point */}
      <mesh ref={debugRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>

      {/* Left eye marker (cyan) */}
      {leftEye && showGuideDots && (
        <mesh position={toNDC(leftEye.x, leftEye.y)}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="cyan" />
        </mesh>
      )}

      {/* Right eye marker (magenta) */}
      {rightEye && showGuideDots && (
        <mesh position={toNDC(rightEye.x, rightEye.y)}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="magenta" />
        </mesh>
      )}

      {/* Nose marker (lime) */}
      {nose && showGuideDots && (
        <mesh position={toNDC(nose.x, nose.y)}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="lime" />
        </mesh>
      )}

      {/* Face mesh in 3D */}
      {showFaceMesh && allLandmarks && (
        <>
          {/* Draw key landmarks as 3D spheres */}
          {allLandmarks.slice(0, 50).map((landmark, index) => (
            <mesh key={index} position={toNDC(landmark.x, landmark.y)}>
              <sphereGeometry args={[0.01, 6, 6]} />
              <meshBasicMaterial
                color="rgba(255, 255, 255, 0.6)"
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Axes helper for orientation reference */}
      <axesHelper args={[0.3]} />
    </>
  );
}

/**
 * Main FaceMesh3D component that provides the 3D canvas context
 *
 * Features:
 * - Three.js canvas with alpha blending
 * - Optimized camera setup for face tracking
 * - Ambient lighting for consistent visibility
 *
 * @param props - FaceMesh3DProps containing landmark data and visibility flags
 * @returns JSX.Element - The 3D face mesh component
 */
export default function FaceMesh3D(props: FaceMesh3DProps) {
  return (
    <Canvas
      gl={{ alpha: true }}
      camera={{ position: [0, 0, 2], fov: 75 }}
      className="h-full w-full"
    >
      <ambientLight intensity={1} />
      <GlassesModel {...props} />
    </Canvas>
  );
}
