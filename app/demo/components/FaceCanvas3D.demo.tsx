"use client";
import React, { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stats } from "@react-three/drei";
import * as THREE from "three";
import { convertLandmarks3D } from "@/app/utils/landmarkConversion";

import { FaceOccluder } from "@/app/services/drawing3D/drawFaceOccluder";
import { useVideoAspect } from "@/app/hooks/useVideoAspect";
import { useLandmarkUpdater } from "@/app/hooks/useLandmarkUpdater";
import { useDynamicPlane } from "@/app/hooks/useDynamicPlane";
import { useDelayedVideoTexture } from "@/app/hooks/useDelayedVideoTexture";
import { IS_DEV, VIDEO_DELAY } from "@/app/utils/config";
import { DrawGlasses3DDemo } from "./drawGlasses3D.demo";
import { drawAllLandmarks3D } from "@/app/services/drawing3D/drawAllLandmarks3D";
import {
  getYawMappingDebug,
  getPitchMappingDebug,
} from "@/app/utils/advancedRotation";

// Toggle which axis to visualize: "yaw" | "pitch"
const DISPLAY_AXIS: "yaw" | "pitch" = "pitch";

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

  if (!IS_DEV) return null;

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

// Distance display component for debugging (reads from worker distanceInfo)
function DistanceDisplay({
  distanceInfo,
}: {
  distanceInfo?: {
    ratio: number;
    staticRatio?: number;
    raw: number;
    baseline: number;
    yawAbs: number;
    rangeM?: number;
  };
}) {
  if (!IS_DEV) return null;

  const ratioDyn = distanceInfo?.ratio ?? 1.0;
  const ratioStatic = distanceInfo?.staticRatio ?? ratioDyn;
  const rangeM = distanceInfo?.rangeM;

  // Prefer absolute meters if available; else use static calibrated ratio
  let distanceCategory = "Medium";
  if (typeof rangeM === "number" && !Number.isNaN(rangeM)) {
    // Thresholds in meters tuned per feedback
    // Very Close ~0.4m, Medium centered ~0.8m, Far centered ~0.9m
    if (rangeM < 0.45) distanceCategory = "Very Close";
    else if (rangeM < 0.7) distanceCategory = "Close";
    else if (rangeM < 0.85) distanceCategory = "Medium";
    else if (rangeM < 1.1) distanceCategory = "Far";
    else distanceCategory = "Very Far";
  } else {
    // Fallback to calibrated static ratio (non-converging)
    if (ratioStatic > 1.4) distanceCategory = "Very Close";
    else if (ratioStatic > 1.2) distanceCategory = "Close";
    else if (ratioStatic > 0.9) distanceCategory = "Medium";
    else if (ratioStatic > 0.7) distanceCategory = "Far";
    else distanceCategory = "Very Far";
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "20%",
        right: "5%",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
      }}
    >
      Distance: {distanceCategory}
      <br />
      {typeof rangeM === "number" && !Number.isNaN(rangeM)
        ? `Range: ${rangeM.toFixed(2)} m`
        : `Ratio: ${ratioStatic.toFixed(2)}`}
    </div>
  );
}

export default function FaceCanvas3DDemo(props: any) {
  const {
    videoRef,
    videoReady,
    landmarks,
    glassesTransform,
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
  const videoTextureFirstFrameRef = React.useRef(false);
  React.useEffect(() => {
    if (!videoTextureFirstFrameRef.current && videoTexture) {
      videoTextureFirstFrameRef.current = true;
      props.onVideoTextureReady?.();
    }
  }, [videoTexture, props]);

  const videoAspect = useVideoAspect(videoRef, videoReady);
  const { planeWidth, planeHeight, FOV, cameraZ } =
    useDynamicPlane(videoAspect);

  return (
    <>
      <GlassesFPSDisplay landmarks={convertedLandmarks} />
      {/* Axis mapping visualizer (toggle axis via DISPLAY_AXIS) */}
      {IS_DEV && (
        <AxisMappingDisplay
          axis={DISPLAY_AXIS}
          yawAbs={glassesTransform?.current?.distanceInfo?.yawAbs}
          quaternion={glassesTransform?.current?.quaternion}
        />
      )}

      <DistanceDisplay distanceInfo={glassesTransform?.current?.distanceInfo} />
      <Canvas
        className="absolute top-0 left-0 w-full"
        camera={{ position: [0, 0, cameraZ], fov: FOV }}
        gl={{
          alpha: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        {IS_DEV && <Stats />}
        <group scale={[-1, 1, 1]}>
          <Environment preset="city" background={false} />

          {videoTexture && (
            <mesh
              scale={[planeWidth, planeHeight, 1]}
              position={[0, 0, 0]}
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
              <FaceOccluder
                landmarks={convertedLandmarks}
                onRendered={onOccluderRendered}
              />

              <DrawGlasses3DDemo
                landmarks={convertedLandmarks}
                glassesTransform={glassesTransform?.current}
                onRendered={onGlassesRendered}
                model={props.model}
              />

              {/* {drawAllLandmarks3D(convertedLandmarks)} */}
            </>
          )}

          {/* Debug */}
          {IS_DEV && <OrbitControls />}
        </group>
      </Canvas>
    </>
  );
}

// Generic axis mapping visualizer (yaw or pitch)
function AxisMappingDisplay({
  axis,
  yawAbs,
  quaternion,
}: {
  axis: "yaw" | "pitch";
  yawAbs?: number;
  quaternion?: { x: number; y: number; z: number; w: number };
}) {
  function quatToMatrix(q: any) {
    if (!q) return null;
    const { x, y, z, w } = q;
    const xx = x * x,
      yy = y * y,
      zz = z * z;
    const xy = x * y,
      xz = x * z,
      yz = y * z;
    const wx = w * x,
      wy = w * y,
      wz = w * z;
    return [
      [1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy)],
      [2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx)],
      [2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy)],
    ];
  }

  let angle = 0;
  if (axis === "yaw") {
    if (typeof yawAbs === "number") {
      angle = yawAbs; // raw from worker
    } else if (quaternion) {
      const m = quatToMatrix(quaternion);
      if (m) angle = Math.atan2(m[0][2], m[2][2]);
    }
  } else {
    const m = quatToMatrix(quaternion);
    if (m) angle = Math.asin(-m[1][2]);
  }

  const dbg =
    axis === "yaw" ? getYawMappingDebug(angle) : getPitchMappingDebug(angle);
  const label = axis === "yaw" ? "Yaw" : "Pitch";

  return (
    <div
      style={{
        position: "absolute",
        top: "12%",
        left: "5%",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
      }}
    >
      <div>
        {label} t: {dbg.t.toFixed(3)}
      </div>
      <div>Mapped v: {dbg.v.toFixed(3)}</div>
      <div>Ease: {dbg.ease}</div>
      <div>Mult: {dbg.multiplier}</div>
      <div>Pts: {dbg.pointsCount}</div>
    </div>
  );
}
