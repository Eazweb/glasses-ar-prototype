"use client";
import React, { useRef, useEffect } from "react";
import { drawAllLandmarks2D } from "../services/drawing2D/drawAllLandmarks2D";
import { drawEyeMarkers2D } from "../services/drawing2D/drawEyeMarkers2D";
import { drawFaceMask2D } from "../services/drawing2D/drawFaceMask2D";
import { drawPngGlasses2D } from "../services/drawing2D/drawPngGlasses2D";
import { convertLandmarks } from "../utils/landmarkConversion";
import { useGlassesImage } from "../hooks/useGlassesImage";
import { FaceCanvas2DProps } from "../types/faceCanvas2D";

export default function FaceCanvas2D({
  videoRef,
  landmarks,
  showAll,
  showEyes,
  showMask,
  showGlasses,
}: FaceCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    glassesImage,
    isLoading: glassesLoading,
    error: glassesError,
  } = useGlassesImage();

  // 2D drawing effect
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;

    const draw = () => {
      if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const lm = landmarks.current;
        const convertedLandmarks = convertLandmarks(lm);

        if (convertedLandmarks.length > 0) {
          if (showAll)
            drawAllLandmarks2D(
              ctx,
              canvas.width,
              canvas.height,
              convertedLandmarks,
            );
          if (showEyes)
            drawEyeMarkers2D(
              ctx,
              canvas.width,
              canvas.height,
              convertedLandmarks,
            );
          if (showMask)
            drawFaceMask2D(
              ctx,
              canvas.width,
              canvas.height,
              convertedLandmarks,
            );
          if (showGlasses && glassesImage && !glassesLoading && !glassesError)
            drawPngGlasses2D(
              ctx,
              canvas.width,
              canvas.height,
              convertedLandmarks,
              glassesImage,
            );
        }
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [
    videoRef,
    landmarks,
    showAll,
    showEyes,
    showMask,
    showGlasses,
    glassesImage,
    glassesLoading,
    glassesError,
  ]);

  return <canvas ref={canvasRef} className="w-full" />;
}