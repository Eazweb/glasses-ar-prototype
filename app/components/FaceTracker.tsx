// components/FaceTracker.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import FaceMesh3D from "./FaceMesh3D";
import FaceCanvas2D from "./FaceCanvas2D";
import OverlayControls from "./OverlayControls";

type Mode = "2D" | "3D";

export default function FaceTracker() {
  // grab videoRef + landmarksRef from your hook
  const { videoRef, landmarks } = useFaceLandmarker();

  // local mode toggle
  const [mode, setMode] = useState<Mode>("2D");

  // overlay toggles
  const [showAll, setShowAll] = useState(false);
  const [showEyes, setShowEyes] = useState(false);
  const [showMask, setShowMask] = useState(false);
  const [showGlasses, setShowGlasses] = useState(false);

  return (
    <div className="relative h-full w-full">
      {/* always hidden video (hook uses it) */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* 2D canvas */}
      {mode === "2D" && (
        <>
          <FaceCanvas2D
            videoRef={videoRef}
            landmarks={landmarks}
            showAll={showAll}
            showEyes={showEyes}
            showMask={showMask}
            showGlasses={showGlasses}
          />
          <OverlayControls
            showAll={showAll}
            showEyes={showEyes}
            showMask={showMask}
            showGlasses={showGlasses}
            onToggleAll={() => setShowAll((f) => !f)}
            onToggleEyes={() => setShowEyes((f) => !f)}
            onToggleMask={() => setShowMask((f) => !f)}
            onToggleGlasses={() => setShowGlasses((f) => !f)}
          />
        </>
      )}

      {/* 3D canvas */}
      {mode === "3D" && landmarks.current && videoRef.current && (
        <div className="pointer-events-none absolute top-0 left-0 w-full">
          <FaceMesh3D
            video={videoRef.current}
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
        className="absolute top-0 right-0 translate-y-[-100%] rounded rounded-b-none bg-neutral-600 px-4 py-2 font-medium text-white"
      >
        {mode === "2D" ? "Switch to 3D" : "Switch to 2D"}
      </button>
    </div>
  );
}
