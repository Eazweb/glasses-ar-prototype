// components/OverlayControls.tsx
"use client";
import React from "react";

interface OverlayControlsProps {
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  onToggleAll: () => void;
  onToggleEyes: () => void;
  onToggleMask: () => void;
}

export default function OverlayControls({
  showAll,
  showEyes,
  showMask,
  onToggleAll,
  onToggleEyes,
  onToggleMask,
}: OverlayControlsProps) {
  return (
    <div className="bg-opacity-50 absolute top-4 right-4 z-30 flex flex-col gap-2 rounded bg-black p-3">
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
    </div>
  );
}
