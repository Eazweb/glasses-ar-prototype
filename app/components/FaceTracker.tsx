// components/FaceTracker.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { useVideoReady } from "../hooks/useVideoReady";
import { useTextureVersion } from "../hooks/useTextureVersion";
import FaceMesh3D from "./FaceCanvas3D";
import FaceCanvas2D from "./FaceCanvas2D";
import OverlayControls from "./OverlayControls";
import FaceCanvas3D from "./FaceCanvas3D";

type Mode = "2D" | "3D";

export default function FaceTracker() {
  // grab videoRef + landmarksRef from your hook
  const { videoRef, landmarks } = useFaceLandmarker();

  // local mode toggle
  const [mode, setMode] = useState<Mode>("2D");

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
    showGlasses: false,
    showGrid: false,
  });

  // FPS control for 3D rendering
  const [fps3D, setFps3D] = useState(30);

  // Use custom hook for video ready state
  const videoReady = useVideoReady(videoRef);

  // Use custom hook for texture version management
  const videoTextureVersion = useTextureVersion(mode);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {/* always hidden video (hook uses it) */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* 2D canvas */}
      {mode === "2D" && (
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
            videoRef={videoRef}
            videoReady={videoReady}
            landmarks={landmarks}
            showAll={overlays3D.showAll}
            showEyes={overlays3D.showEyes}
            showMask={overlays3D.showMask}
            showGlasses={overlays3D.showGlasses}
            showGrid={overlays3D.showGrid}
            videoTextureVersion={videoTextureVersion}
            fps={fps3D}
          />
          <OverlayControls
            showAll={overlays3D.showAll}
            showEyes={overlays3D.showEyes}
            showMask={overlays3D.showMask}
            showGlasses={overlays3D.showGlasses}
            showGrid={overlays3D.showGrid}
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
            fps3D={fps3D}
            setFps3D={setFps3D}
          />
        </>
      )}

      {/* simple mode switch */}
      <button
        onClick={() => setMode((m) => (m === "2D" ? "3D" : "2D"))}
        className="absolute top-0 right-0 translate-y-[-100%] rounded bg-neutral-600 px-4 py-2 font-medium text-white"
      >
        {mode === "2D" ? "Switch to 3D" : "Switch to 2D"}
      </button>
    </div>
  );
}
