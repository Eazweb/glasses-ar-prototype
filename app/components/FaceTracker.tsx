// components/FaceTracker.tsx
"use client";
import React, { useRef, useEffect, useState, RefObject } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { useVideoReady } from "../hooks/useVideoReady";
import { useTextureVersion } from "../hooks/useTextureVersion";

import { useOccluderReady } from "../hooks/useOccluderReady";
import { useGlassesReady } from "../hooks/useGlassesReady";

import FaceCanvas2D from "./FaceCanvas2D";
import OverlayControls from "./OverlayControls";
import FaceCanvas3D from "./FaceCanvas3D";

type Mode = "2D" | "3D";

export default function FaceTracker() {
  const IS_DEV = process.env.NEXT_PUBLIC_ENV === "development";

  // grab videoRef + landmarksRef from your hook
  const { videoRef, landmarks } = useFaceLandmarker();

  // local mode toggle
  const [mode, setMode] = useState<Mode>(IS_DEV ? "3D" : "3D");

  // overlay toggles - separate for 2D and 3D
  const [overlays2D, setOverlays2D] = useState({
    showAll: false,
    showEyes: false,
    showMask: false,
    showGlasses: false,
  });

  const [overlays3D, setOverlays3D] = useState({
    showAll: false,
    showEyes: false,
    showMask: false,
    showGlasses: true,
    showGrid: false,
    showOccluder: true,
  });

  // FPS control for 3D rendering
  const [fps3D, setFps3D] = useState(60);

  // Use custom hook for video ready state
  const videoReady = useVideoReady(videoRef);

  // Use custom hook for occluder ready state
  const [occluderReady, onOccluderRendered] = useOccluderReady();

  // Use custom hook for glasses ready state
  const [glassesReady, onGlassesRendered] = useGlassesReady();

  // Use custom hook for texture version management
  const videoTextureVersion = useTextureVersion(mode);

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

      {/* 2D canvas */}
      {IS_DEV && mode === "2D" && (
        <>
          <FaceCanvas2D
            videoRef={videoRef}
            landmarks={landmarks}
            showAll={overlays2D.showAll}
            showEyes={overlays2D.showEyes}
            showMask={overlays2D.showMask}
            showGlasses={overlays2D.showGlasses}
          />
          <OverlayControls
            showAll={overlays2D.showAll}
            showEyes={overlays2D.showEyes}
            showMask={overlays2D.showMask}
            showGlasses={overlays2D.showGlasses}
            onToggleAll={() =>
              setOverlays2D((prev) => ({ ...prev, showAll: !prev.showAll }))
            }
            onToggleEyes={() =>
              setOverlays2D((prev) => ({ ...prev, showEyes: !prev.showEyes }))
            }
            onToggleMask={() =>
              setOverlays2D((prev) => ({ ...prev, showMask: !prev.showMask }))
            }
            onToggleGlasses={() =>
              setOverlays2D((prev) => ({
                ...prev,
                showGlasses: !prev.showGlasses,
              }))
            }
          />
        </>
      )}

      {mode === "3D" && (
        <>
          <FaceCanvas3D
            videoRef={videoRef as RefObject<HTMLVideoElement>}
            videoReady={videoReady}
            landmarks={landmarks}
            videoTextureVersion={videoTextureVersion}
            fps={IS_DEV ? fps3D : 24}
            showOccluder={IS_DEV ? overlays3D.showOccluder : true}
            showGlasses={IS_DEV ? overlays3D.showGlasses : occluderReady}
            showAll={IS_DEV ? overlays3D.showAll : false}
            showEyes={IS_DEV ? overlays3D.showEyes : false}
            showMask={IS_DEV ? overlays3D.showMask : false}
            showGrid={IS_DEV ? overlays3D.showGrid : false}
            onOccluderRendered={onOccluderRendered}
            onGlassesRendered={onGlassesRendered}
          />
          {IS_DEV && (
            <OverlayControls
              showAll={overlays3D.showAll}
              showEyes={overlays3D.showEyes}
              showMask={overlays3D.showMask}
              showGlasses={overlays3D.showGlasses}
              showGrid={overlays3D.showGrid}
              showOccluder={overlays3D.showOccluder}
              onToggleAll={() =>
                setOverlays3D((prev) => ({ ...prev, showAll: !prev.showAll }))
              }
              onToggleEyes={() =>
                setOverlays3D((prev) => ({ ...prev, showEyes: !prev.showEyes }))
              }
              onToggleMask={() =>
                setOverlays3D((prev) => ({ ...prev, showMask: !prev.showMask }))
              }
              onToggleGlasses={() =>
                setOverlays3D((prev) => ({
                  ...prev,
                  showGlasses: !prev.showGlasses,
                }))
              }
              onToggleGrid={() =>
                setOverlays3D((prev) => ({
                  ...prev,
                  showGrid: !prev.showGrid,
                }))
              }
              onToggleOccluder={() =>
                setOverlays3D((prev) => ({
                  ...prev,
                  showOccluder: !prev.showOccluder,
                }))
              }
              fps3D={fps3D}
              setFps3D={setFps3D}
            />
          )}
        </>
      )}

      {/* simple mode switch */}
      {IS_DEV && (
        <button
          onClick={() => setMode((m) => (m === "2D" ? "3D" : "2D"))}
          className="absolute top-0 right-0 translate-y-[-100%] rounded bg-neutral-600 px-4 py-2 font-medium text-white"
        >
          {mode === "2D" ? "Switch to 3D" : "Switch to 2D"}
        </button>
      )}
    </div>
  );
}
