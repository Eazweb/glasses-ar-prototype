"use client";
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useVideoTexture } from "../hooks/useVideoTexture";
import { convertLandmarks } from "../utils/landmarkConversion";
import { drawAllLandmarks3D } from "../utils/drawing3D/drawAllLandmarks3D";
import { drawEyeMarkers3D } from "../utils/drawing3D/drawEyeMarkers3D";
import { drawFaceMask3D } from "../utils/drawing3D/drawFaceMask3D";
import { FaceCanvas3DProps } from "../types/faceCanvas3D";

export default function FaceCanvas3D({
  videoRef,
  videoReady,
  landmarks,
  showAll,
  showEyes,
  showMask,
  showGlasses,
  videoTextureVersion,
  fps,
}: FaceCanvas3DProps) {
  // Use fixed interval for controlled FPS updates
  const [landmarkVersion, setLandmarkVersion] = React.useState(0);

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const interval = 1000 / fps; // Convert FPS to milliseconds

    const updateLandmarks = () => {
      if (landmarks.current && landmarks.current.length > 0) {
        setLandmarkVersion((v) => v + 1);
      }
    };

    intervalId = setInterval(updateLandmarks, interval);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [landmarks, fps]);

  const convertedLandmarks = useMemo(
    () => {
      const result = convertLandmarks(landmarks.current);
      return result;
    },
    [landmarkVersion], // Force update when version changes
  );

  const videoTexture = useVideoTexture(
    videoRef,
    videoReady,
    videoTextureVersion,
  );

  return (
    <>
      {/* <video ref={videoRef} className="hidden" playsInline muted autoPlay /> */}
      <Canvas
        className="absolute top-0 left-0 w-full"
        camera={{ position: [0, 0, 1], fov: 90 }}
        gl={{
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping,
        }}
      >
        {/* No lights needed for video texture - it's self-illuminating */}

        {/* Show video background - fill entire viewport */}
        {videoTexture && (
          <mesh scale={[3, 2.25, 1]} position={[0, 0, -0.5]}>
            <planeGeometry />
            <meshBasicMaterial map={videoTexture} />
          </mesh>
        )}

        {/* Render landmarks using points for better performance */}
        {convertedLandmarks.length > 0 && (
          <>
            {showAll && drawAllLandmarks3D(convertedLandmarks, 2, 1.5, 0.01)}

            {/* Render eye markers */}
            {showEyes && drawEyeMarkers3D(convertedLandmarks, 2, 1.5, 0.01)}

            {showMask && drawFaceMask3D(convertedLandmarks, 2, 1.5, 0.01)}
          </>
        )}

        {/* Debug: Show a single landmark at center */}
        {/* {convertedLandmarks.length > 0 && (
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="red" />
          </mesh>
        )} */}

        {/* Debug */}
        {/* <OrbitControls /> */}
      </Canvas>
    </>
  );
}
