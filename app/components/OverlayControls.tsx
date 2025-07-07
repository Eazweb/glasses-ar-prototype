// components/OverlayControls.tsx
"use client";
import React from "react";

interface OverlayControlsProps {
  showAll: boolean;
  showEyes: boolean;
  showMask: boolean;
  showGlasses: boolean;
  showGrid?: boolean;
  onToggleAll: () => void;
  onToggleEyes: () => void;
  onToggleMask: () => void;
  onToggleGlasses: () => void;
  onToggleGrid?: () => void;
  fps3D?: number;
  setFps3D?: (fps: number) => void;
}

export default function OverlayControls({
  showAll,
  showEyes,
  showMask,
  showGlasses,
  showGrid,
  onToggleAll,
  onToggleEyes,
  onToggleMask,
  onToggleGlasses,
  onToggleGrid,
  fps3D,
  setFps3D,
}: OverlayControlsProps) {
  return (
    <div className="absolute top-50 -right-60 z-30 flex flex-col gap-2 rounded-lg bg-white/20 p-3 backdrop-blur-lg">
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

      {/* Center Grid Control - only show in 3D mode */}
      {showGrid !== undefined && onToggleGrid && (
        <label className="inline-flex items-center text-white">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={onToggleGrid}
            className="mr-2"
          />
          Center Grid
        </label>
      )}

      {/* FPS Control for 3D */}
      {fps3D !== undefined && setFps3D && (
        <div className="mt-2 border-t border-white/20 pt-2">
          <label className="text-sm text-white">3D FPS: {fps3D}</label>
          <input
            type="range"
            min="1"
            max="60"
            value={fps3D}
            onChange={(e) => setFps3D(Number(e.target.value))}
            className="mt-1 w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-white/70">
            <span>1</span>
            <span>30</span>
            <span>60</span>
          </div>
        </div>
      )}
    </div>
  );
}
