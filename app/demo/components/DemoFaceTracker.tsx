// demo/components/DemoFaceTracker.tsx

"use client";
import React, { RefObject, useState } from "react";
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

  const [videoTextureReady, setVideoTextureReady] = useState(false);
  const loading = IS_DEV
    ? false
    : !(videoReady && occluderReady && glassesReady && videoTextureReady);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {IS_DEV && (
        <div className="absolute top-0 left-0 z-50 flex items-center justify-center bg-neutral-950">
          <span className="text-xl text-white">DEV MODE</span>
        </div>
      )}

      {/* Blur video + overlay with smooth fade */}
      <div
        className={
          "absolute inset-0 z-50 transition-opacity duration-200 ease-out " +
          (loading ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover blur-sm"
          muted
          playsInline
          autoPlay
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
          <div className="size-14 animate-spin rounded-full border-t-4 border-b-4 border-white"></div>
          <span className="m-4 text-lg text-white sm:text-xl">Loading...</span>
        </div>
      </div>

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
        onVideoTextureReady={() => setVideoTextureReady(true)}
        model={model}
      />
    </div>
  );
}
