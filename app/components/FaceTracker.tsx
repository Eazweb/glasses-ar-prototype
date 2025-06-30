// components/FaceTracker.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import FaceMesh3D from "./FaceMesh3D";
import { drawEyeMarkers2D } from "../utils/drawEyeMarkers2D";
import { drawFaceMask2D } from "../utils/drawFaceMask2D";
import { drawAllLandmarks2D } from "../utils/drawAllLandmarks2D";
import OverlayControls from "./OverlayControls";

type Mode = "2D" | "3D";

export default function FaceTrackerNew() {
  // grab videoRef + landmarksRef from your hook
  const { videoRef, landmarks } = useFaceLandmarker();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // local mode toggle
  const [mode, setMode] = useState<Mode>("2D");

  // overlay toggles
  const [showAll, setShowAll] = useState(false);
  const [showEyes, setShowEyes] = useState(false);
  const [showMask, setShowMask] = useState(false);

  // 2D drawing effect
  useEffect(() => {
    if (mode !== "2D") return;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let id: number;

    const draw = () => {
      if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const lm = landmarks.current;
        if (lm) {
          if (showAll) drawAllLandmarks2D(ctx, canvas.width, canvas.height, lm);
          if (showEyes) drawEyeMarkers2D(ctx, canvas.width, canvas.height, lm);
          if (showMask) drawFaceMask2D(ctx, canvas.width, canvas.height, lm);
        }
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [mode, videoRef, landmarks, showAll, showEyes, showMask]);

  return (
    <div className="relative w-full">
      {/* always hidden video (hook uses it) */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* 2D canvas */}
      {mode === "2D" && (
        <>
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full" />
          <OverlayControls
            showAll={showAll}
            showEyes={showEyes}
            showMask={showMask}
            onToggleAll={() => setShowAll((f) => !f)}
            onToggleEyes={() => setShowEyes((f) => !f)}
            onToggleMask={() => setShowMask((f) => !f)}
          />
        </>
      )}

      {/* 3D canvas */}
      {mode === "3D" && landmarks.current && (
        <div className="pointer-events-none absolute top-0 left-0 w-full">
          <FaceMesh3D
            video={videoRef.current!}
            leftEye={landmarks.current[33]}
            rightEye={landmarks.current[263]}
            nose={landmarks.current[168]}
            allLandmarks={landmarks.current}
            showGuideDots={true}
            showGlasses={true}
            showFaceMesh={false}
          />
        </div>
      )}

      {/* simple mode switch */}
      <button
        onClick={() => setMode((m) => (m === "2D" ? "3D" : "2D"))}
        className="absolute right-0 bottom-full rounded bg-blue-500 px-4 py-2 text-white"
      >
        {mode === "2D" ? "Switch to 3D" : "Switch to 2D"}
      </button>
    </div>
  );
}
