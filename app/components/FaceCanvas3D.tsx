"use client";
import React, { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stats } from "@react-three/drei";
import * as THREE from "three";
import { useVideoTexture } from "../hooks/useVideoTexture";
import { convertLandmarks3D } from "../utils/landmarkConversion";
import { drawAllLandmarks3D } from "../services/drawing3D/drawAllLandmarks3D";
import { drawEyeMarkers3D } from "../services/drawing3D/drawEyeMarkers3D";
import { drawFaceMask3D } from "../services/drawing3D/drawFaceMask3D";
import { drawCenterGrid3D } from "../services/drawing3D/drawCenterGrid3D";
import { FaceCanvas3DProps } from "../types/faceCanvas3D";
import { DrawGlasses3D } from "../services/drawing3D/drawGlasses3D";
import { FaceOccluder } from "../services/drawing3D/drawFaceOccluder";
import { useVideoAspect } from "../hooks/useVideoAspect";
import { useLandmarkUpdater } from "../hooks/useLandmarkUpdater";
import { useDynamicPlane } from "../hooks/useDynamicPlane";
import { useDelayedVideoTexture } from "../hooks/useDelayedVideoTexture";
import { IS_DEV, VIDEO_DELAY } from "../utils/config";

// Custom FPS counter for glasses updates
function GlassesFPSDisplay({
  landmarks,
}: {
  landmarks: { x: number; y: number; z?: number }[];
}) {
  const [fps, setFps] = React.useState(0);
  const frameCountRef = React.useRef(0);
  const lastTimeRef = React.useRef(performance.now());

  React.useEffect(() => {
    if (landmarks.length > 0) {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        // Update FPS every second
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
    }
  }, [landmarks]);

  // if (!IS_DEV) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "5%",
        right: "5%",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
      }}
    >
      Glasses FPS: {fps}
    </div>
  );
}

export default function FaceCanvas3D(props: FaceCanvas3DProps) {
  const {
    videoRef,
    videoReady,
    landmarks,
    glassesTransform,
    showAll,
    showEyes,
    showMask,
    showGlasses,
    showGrid,
    showOccluder,
    videoTextureVersion,
    fps,
    onOccluderRendered,
    onGlassesRendered,
  } = props;

  // Use custom hook for controlled FPS updates of landmarks
  const landmarkVersion = useLandmarkUpdater(landmarks, fps);

  const convertedLandmarks = useMemo(
    () => {
      const result = convertLandmarks3D(landmarks.current);
      return result;
    },
    [landmarkVersion], // Force update when version changes
  );

  const videoTexture = useDelayedVideoTexture(
    videoRef,
    videoReady,
    VIDEO_DELAY,
  );

  const videoAspect = useVideoAspect(videoRef, videoReady);
  const { planeWidth, planeHeight, FOV, cameraZ } =
    useDynamicPlane(videoAspect);

  return (
    <>
      {/* <video ref={videoRef} className="hidden" playsInline muted autoPlay /> */}
      <GlassesFPSDisplay landmarks={convertedLandmarks} />
      <Canvas
        className="absolute top-0 left-0 w-full"
        camera={{ position: [0, 0, cameraZ], fov: FOV }}
        gl={{
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping,
        }}
      >
        {IS_DEV && <Stats />}
        <group scale={[-1, 1, 1]}>
          {/* Debug */}
          {/* <axesHelper args={[1]} /> */}
          {/* <gridHelper args={[10, 10]} /> */}

          <Environment preset="apartment" background={false} />
          {/* Cheap lighting instead of the expensive Environment component for mobile */}
          {/* <ambientLight intensity={0.8} /> */}
          {/* <directionalLight position={[2, 3, 5]} intensity={1} /> */}

          {/* Simple point lights for the scene */}
          {/* {[
            {
              position: [0, 1, 0.8] as [number, number, number],
              color: "#FFFFF7",
              intensity: 0.4,
            },
            {
              position: [1, 0, 0.5] as [number, number, number],
              color: "white",
              intensity: 0.1,
            },
            {
              position: [-1, 0, 0.5] as [number, number, number],
              color: "white",
              intensity: 0.1,
            },
          ].map((light, index) => (
            <React.Fragment key={index}>
              <pointLight
                position={light.position}
                intensity={light.intensity}
                color={light.color}
              />
              <mesh position={light.position}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color={light.color} />
              </mesh>
            </React.Fragment>
          ))} */}
          {/* Show video background - fill entire viewport */}
          {videoTexture && (
            <mesh
              scale={[planeWidth, planeHeight, 1]}
              position={[0, 0, -0.08]}
              renderOrder={-1000}
            >
              <planeGeometry />
              <meshBasicMaterial
                map={videoTexture}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          )}
          {/* Render landmarks using points for better performance */}
          {convertedLandmarks.length > 0 && (
            <>
              {showOccluder && (
                <FaceOccluder
                  landmarks={convertedLandmarks}
                  onRendered={onOccluderRendered}
                />
              )}

              {/* Render all landmarks */}
              {showAll && drawAllLandmarks3D(convertedLandmarks)}

              {/* Render eye markers */}
              {showEyes && drawEyeMarkers3D(convertedLandmarks)}

              {/* Render face mask */}
              {showMask && drawFaceMask3D(convertedLandmarks)}

              {/* Render glasses*/}
              {showGlasses && (
                <DrawGlasses3D
                  landmarks={convertedLandmarks}
                  glassesTransform={glassesTransform?.current}
                  onRendered={onGlassesRendered}
                />
              )}
            </>
          )}

          {/* Debug */}
          {IS_DEV && <OrbitControls />}
          {/* Center reference grid */}
          {drawCenterGrid3D(showGrid)}
          {/* Debug: Show a single landmark at center */}
          {/* {convertedLandmarks.length > 0 && (
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="red" />
            </mesh>
          )} */}
        </group>
      </Canvas>
    </>
  );
}
