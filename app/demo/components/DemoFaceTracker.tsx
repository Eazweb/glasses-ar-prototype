// demo/components/DemoFaceTracker.tsx

"use client";
import React, { RefObject } from "react";
import { useFaceWorkerDemo } from "@/app/hooks/useFaceWorker.demo";
import { useVideoReady } from "@/app/hooks/useVideoReady";
import { useTextureVersion } from "@/app/hooks/useTextureVersion";
import { FPS, IS_DEV } from "@/app/utils/config";
import { useOccluderReady } from "@/app/hooks/useOccluderReady";
import { useGlassesReady } from "@/app/hooks/useGlassesReady";

import FaceCanvas3DDemo from "./FaceCanvas3D.demo";
import { GlassesModel } from "@/app/utils/modelImports";

export default function DemoFaceTracker({ model }: { model: GlassesModel }) {
  // uses worker to grab videoRef + landmarksRef
  const { videoRef, landmarks, glassesTransform } = useFaceWorkerDemo(model);

  // Use custom hook for video ready state
  const videoReady = useVideoReady(videoRef);

  // Use custom hook for occluder ready state
  const [occluderReady, onOccluderRendered] = useOccluderReady();

  // Use custom hook for glasses ready state
  const [glassesReady, onGlassesRendered] = useGlassesReady();

  // Use custom hook for texture version management
  const videoTextureVersion = useTextureVersion("3D");

  const loading = IS_DEV
    ? false
    : !(videoReady && occluderReady && glassesReady);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {IS_DEV && (
        <div className="absolute top-0 left-0 z-50 flex items-center justify-center bg-neutral-950">
          <span className="text-xl text-white">DEV MODE</span>
        </div>
      )}

      {/* always hidden video (hook uses it) */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950">
          <div className="size-14 animate-spin rounded-full border-t-4 border-b-4 border-white"></div>
          <span className="ml-4 text-xl text-white">Loading...</span>
        </div>
      )}

      <FaceCanvas3DDemo
        videoRef={videoRef as RefObject<HTMLVideoElement>}
        videoReady={videoReady}
        landmarks={landmarks}
        glassesTransform={glassesTransform}
        videoTextureVersion={videoTextureVersion}
        fps={FPS}
        showOccluder={true}
        showGlasses={occluderReady}
        onOccluderRendered={onOccluderRendered}
        onGlassesRendered={onGlassesRendered}
        model={model}
      />
    </div>
  );
}
