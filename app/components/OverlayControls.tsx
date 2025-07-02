// components/OverlayControls.tsx
"use client";
import React from "react";

interface OverlayControlsProps {
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  showGlasses: boolean;
  onToggleAll: () => void;
  onToggleEyes: () => void;
  onToggleMask: () => void;
  onToggleGlasses: () => void;
}

export default function OverlayControls({
  showAll,
  showEyes,
  showMask,
  showGlasses,
  onToggleAll,
  onToggleEyes,
  onToggleMask,
  onToggleGlasses,
}: OverlayControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 rounded-lg bg-black/60 p-3 backdrop-blur-lg">
      <label className="inline-flex items-center text-white">
        <input
          type="checkbox"
          checked={showAll}
          onChange={onToggleAll}
          className="mr-2"
        />
        All Landmarks
      </label>
      <label className="inline-flex items-center text-white">
        <input
          type="checkbox"
          checked={showEyes}
          onChange={onToggleEyes}
          className="mr-2"
        />
        Eye Markers
      </label>
      <label className="inline-flex items-center text-white">
        <input
          type="checkbox"
          checked={showMask}
          onChange={onToggleMask}
          className="mr-2"
        />
        Face Mask
      </label>
      <label className="inline-flex items-center text-white">
        <input
          type="checkbox"
          checked={showGlasses}
          onChange={onToggleGlasses}
          className="mr-2"
        />
        Glasses
      </label>
    </div>
  );
}
