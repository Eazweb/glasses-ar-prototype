// components/FaceMesh3D.tsx
"use client";
import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import FaceGuide3D from "./FaceGuide3D";
import { FaceMesh3DProps } from "../types/faceMesh";

function VideoBackground({ video }: { video: HTMLVideoElement }) {
  const textureRef = useRef<THREE.VideoTexture | undefined>(undefined);
  const meshRef = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBFormat;
    textureRef.current = tex;
  }, [video]);

  useFrame(() => {
    if (textureRef.current) textureRef.current.needsUpdate = true;
  });

  // compute a plane that fills the camera view at z = -5
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const height =
    2 * Math.tan(THREE.MathUtils.degToRad(perspectiveCamera.fov) / 2) * 5;
  const width = height * perspectiveCamera.aspect;

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={textureRef.current!} toneMapped={false} />
    </mesh>
  );
}

export function GlassesModel({
  leftEye,
  rightEye,
  nose,
  showGuideDots = false,
  showGlasses = true,
  allLandmarks = [],
}: FaceMesh3DProps) {
  const modelRef = useRef<THREE.Group>(null!);
  const debugRef = useRef<THREE.Mesh>(null!);
  const { scene } = useGLTF("/model/3d.glb"); // adjust path

  useFrame(() => {
    if (!leftEye || !rightEye || !modelRef.current) return;

    // center between eyes
    const cx = (leftEye.x + rightEye.x) / 2;
    const cy = (leftEye.y + rightEye.y) / 2;
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const angle = Math.atan2(dy, dx);
    const eyeDist = Math.hypot(dx, dy);

    // normalized device coords
    const ndcX = (cx - 0.5) * 2;
    const ndcY = -(cy - 0.5) * 2;

    // debug anchor
    debugRef.current.position.set(ndcX, ndcY, 0);

    if (showGlasses) {
      modelRef.current.position.set(ndcX, ndcY, 0);
      modelRef.current.rotation.set(Math.PI / 2, 0, -angle);
      modelRef.current.scale.set(eyeDist * 3, eyeDist * 3, eyeDist * 3);
    } else {
      modelRef.current.scale.set(0, 0, 0);
    }
  });

  return (
    <>
      <primitive ref={modelRef} object={scene} />

      {showGuideDots && (
        <mesh ref={debugRef}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </>
  );
}

export default function FaceMesh3D(props: FaceMesh3DProps) {
  return (
    <Canvas
      gl={{ alpha: false, antialias: true }}
      camera={{
        position: [0, 0, 2],
        fov: 75,
        aspect: window.innerWidth / window.innerHeight,
      }}
      className="w-full"
    >
      <ambientLight intensity={1} />
      <VideoBackground video={props.video} />
      <GlassesModel {...props} />
      {props.showGuideDots && props.allLandmarks && (
        <FaceGuide3D landmarks={props.allLandmarks} />
      )}
    </Canvas>
  );
}
