// components/FaceTracker.tsx
"use client";
import React, { useRef, useEffect, useState, RefObject } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { useVideoReady } from "../hooks/useVideoReady";
import { useTextureVersion } from "../hooks/useTextureVersion";
import { useOccluderReady } from "../hooks/useOccluderReady";
import { useGlassesReady } from "../hooks/useGlassesReady";

import FaceCanvas3D from "./FaceCanvas3D";

export default function FaceTracker() {
  // grab videoRef + landmarksRef from your hook
  const { videoRef, landmarks } = useFaceLandmarker();

  // Use custom hook for video ready state
  const videoReady = useVideoReady(videoRef);

  // Use custom hook for occluder ready state
  const [occluderReady, onOccluderRendered] = useOccluderReady();

  // Use custom hook for glasses ready state
  const [glassesReady, onGlassesRendered] = useGlassesReady();

  // Use custom hook for texture version management
  const videoTextureVersion = useTextureVersion("3D");

  const loading = !(videoReady && occluderReady && glassesReady);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {/* always hidden video (hook uses it) */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950">
          <div className="size-14 animate-spin rounded-full border-t-4 border-b-4 border-white"></div>
          <span className="ml-4 text-xl text-white">Loading...</span>
        </div>
      )}

      <FaceCanvas3D
        videoRef={videoRef as RefObject<HTMLVideoElement>}
        videoReady={videoReady}
        landmarks={landmarks}
        videoTextureVersion={videoTextureVersion}
        fps={24} // Hardcoded FPS for production.
        showOccluder={true}
        showGlasses={occluderReady}
        showAll={false}
        showEyes={false}
        showMask={false}
        showGrid={false}
        onOccluderRendered={onOccluderRendered}
        onGlassesRendered={onGlassesRendered}
      />
    </div>
  );
}
