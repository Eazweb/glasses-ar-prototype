// components/FaceTracker.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import FaceMesh3D from "./FaceMesh3D";

/**
 * Render mode for the face tracker
 */
type RenderMode = "2D" | "3D";

/**
 * Interface for facial landmark data
 */
interface FaceLandmarks {
  /** Left eye landmark coordinates */
  leftEye: any;
  /** Right eye landmark coordinates */
  rightEye: any;
  /** Nose bridge landmark coordinates */
  nose: any;
  /** All 468 facial landmarks from MediaPipe */
  allLandmarks: any[];
}

/**
 * Main face tracking component that handles both 2D and 3D glasses try-on
 *
 * Features:
 * - Real-time face detection using MediaPipe
 * - 2D mode: PNG glasses overlay with face mesh visualization
 * - 3D mode: GLB model glasses with 3D face mesh
 * - Modular toggles for glasses, face mesh, guide dots, and render mode
 *
 * @returns JSX.Element - The face tracker component
 */
export default function FaceTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>("2D");
  const [showFaceMesh, setShowFaceMesh] = useState(false);
  const [showGlasses, setShowGlasses] = useState(true);
  const [showGuideDots, setShowGuideDots] = useState(true);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(
    null,
  );

  /**
   * Initialize MediaPipe face landmarker
   */
  useEffect(() => {
    async function initLandmarker() {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      setLandmarker(faceLandmarker);
    }
    initLandmarker();
  }, []);

  /**
   * Preload glasses image to prevent flashing
   */
  useEffect(() => {
    const img = new Image();
    img.src = "/images/glasses.png";
    img.onload = () => {
      glassesImageRef.current = img;
    };
  }, []);

  /**
   * Process and structure face landmarks from MediaPipe detection
   *
   * @param face - Array of 468 facial landmarks from MediaPipe
   * @returns FaceLandmarks - Structured landmark data
   */
  const processFaceLandmarks = useCallback((face: any[]) => {
    const landmarks: FaceLandmarks = {
      leftEye: face[33],
      rightEye: face[263],
      nose: face[168],
      allLandmarks: face,
    };
    setFaceLandmarks(landmarks);
    return landmarks;
  }, []);

  /**
   * Render 2D canvas with PNG glasses overlay and face mesh
   *
   * @param ctx - Canvas 2D context
   * @param video - Video element for background
   * @param canvas - Canvas element
   * @param landmarks - Processed facial landmarks
   */
  const render2DCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      landmarks: FaceLandmarks,
    ) => {
      const { leftEye, rightEye, nose, allLandmarks } = landmarks;

      // Clear canvas and draw video background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const canvasX = (x: number) => x * canvas.width;
      const canvasY = (y: number) => y * canvas.height;

      // Draw glasses (PNG overlay) - only if showGlasses is true
      if (showGlasses) {
        console.log("Drawing glasses in 2D mode, showGlasses:", showGlasses);
        const dx = canvasX(rightEye.x) - canvasX(leftEye.x);
        const dy = canvasY(rightEye.y) - canvasY(leftEye.y);
        const eyeDist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const cx = canvasX(nose.x);
        const cy = canvasY(nose.y);

        // Load and draw glasses image
        const img = glassesImageRef.current;
        if (img) {
          console.log("Drawing glasses image, eyeDist:", eyeDist);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.drawImage(
            img,
            -eyeDist * 0.7,
            -eyeDist * 0.25,
            eyeDist * 1.4,
            eyeDist * 0.7,
          );
          ctx.restore();
        } else {
          console.log("Glasses image not loaded yet");
        }
      } else {
        console.log("Glasses disabled in 2D mode");
      }

      /**
       * Draw key landmarks (L, R, N markers)
       */
      const drawKeyLandmarks = () => {
        if (!showGuideDots) return;

        // Left eye (cyan)
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(canvasX(leftEye.x), canvasY(leftEye.y), 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText("L", canvasX(leftEye.x) + 6, canvasY(leftEye.y) + 6);

        // Right eye (magenta)
        ctx.fillStyle = "magenta";
        ctx.beginPath();
        ctx.arc(canvasX(rightEye.x), canvasY(rightEye.y), 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText("R", canvasX(rightEye.x) + 6, canvasY(rightEye.y) + 6);

        // Nose (lime)
        ctx.fillStyle = "lime";
        ctx.beginPath();
        ctx.arc(canvasX(nose.x), canvasY(nose.y), 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText("N", canvasX(nose.x) + 6, canvasY(nose.y) + 6);
      };

      /**
       * Draw face mesh if enabled
       */
      const drawFaceMesh = () => {
        if (!showFaceMesh) return;

        const keyLandmarks = [
          // Face outline
          10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
          379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
          234, 127, 162, 21, 54, 103, 67, 109,
          // Eyes
          33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160,
          161, 246, 263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385,
          386, 387, 388, 466,
          // Nose
          168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14, 15, 16,
          17, 18, 200, 199, 175,
          // Mouth
          61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88,
          178, 87, 14, 317, 402, 318, 324, 308,
        ];

        // Draw landmark dots
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        keyLandmarks.forEach((index) => {
          const landmark = allLandmarks[index];
          if (landmark) {
            ctx.moveTo(canvasX(landmark.x), canvasY(landmark.y));
            ctx.arc(
              canvasX(landmark.x),
              canvasY(landmark.y),
              1.5,
              0,
              2 * Math.PI,
            );
          }
        });
        ctx.fill();

        // Draw face outline
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        const outlineIndices = [
          10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
          379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
          234, 127, 162, 21, 54, 103, 67, 109, 10,
        ];

        ctx.beginPath();
        outlineIndices.forEach((index, i) => {
          const landmark = allLandmarks[index];
          if (landmark) {
            if (i === 0) {
              ctx.moveTo(canvasX(landmark.x), canvasY(landmark.y));
            } else {
              ctx.lineTo(canvasX(landmark.x), canvasY(landmark.y));
            }
          }
        });
        ctx.stroke();
      };

      drawKeyLandmarks();
      drawFaceMesh();
    },
    [showFaceMesh, showGlasses, showGuideDots],
  );

  /**
   * Main video processing loop
   */
  useEffect(() => {
    if (!landmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    let animationId: number;

    const processFrame = () => {
      if (video.readyState < 2) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Detect face landmarks
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.faceLandmarks.length > 0) {
        const face = results.faceLandmarks[0];
        const landmarks = processFaceLandmarks(face);

        // Render based on current mode
        if (renderMode === "2D") {
          render2DCanvas(ctx, video, canvas, landmarks);
        }
        // 3D rendering is handled by FaceMesh3D component
      }

      animationId = requestAnimationFrame(processFrame);
    };

    // Start video stream
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.play();
      processFrame();
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [landmarker, renderMode, render2DCanvas, processFaceLandmarks]);

  return (
    <div className="relative h-full w-full">
      {/* Hidden video feed */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* 2D Canvas - only visible in 2D mode */}
      {renderMode === "2D" && (
        <canvas ref={canvasRef} className="absolute top-0 left-0 z-10" />
      )}

      {/* 3D Canvas - only visible in 3D mode */}
      {renderMode === "3D" && faceLandmarks && (
        <div className="pointer-events-none absolute top-0 left-0 z-20 h-full w-full">
          <FaceMesh3D
            leftEye={faceLandmarks.leftEye}
            rightEye={faceLandmarks.rightEye}
            nose={faceLandmarks.nose}
            showFaceMesh={showFaceMesh}
            showGlasses={showGlasses}
            showGuideDots={showGuideDots}
            allLandmarks={faceLandmarks.allLandmarks}
          />
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-5 left-5 z-30 flex gap-3">
        <button
          onClick={() => setRenderMode(renderMode === "2D" ? "3D" : "2D")}
          className={`cursor-pointer rounded border-none px-3 py-2 text-white transition-colors ${
            renderMode === "3D"
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {renderMode === "2D" ? "Show 3D →" : "← Show 2D"}
        </button>

        <button
          onClick={() => setShowFaceMesh(!showFaceMesh)}
          className={`cursor-pointer rounded border-none px-3 py-2 text-white transition-colors ${
            showFaceMesh
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {showFaceMesh ? "Hide Mesh" : "Show Mesh"}
        </button>

        <button
          onClick={() => {
            console.log("Glasses toggle clicked, current state:", showGlasses);
            setShowGlasses(!showGlasses);
          }}
          className={`cursor-pointer rounded border-none px-3 py-2 text-white transition-colors ${
            showGlasses
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          {showGlasses ? "Hide Glasses" : "Show Glasses"}
        </button>

        <button
          onClick={() => setShowGuideDots(!showGuideDots)}
          className={`cursor-pointer rounded border-none px-3 py-2 text-white transition-colors ${
            showGuideDots
              ? "bg-purple-500 hover:bg-purple-600"
              : "bg-gray-400 hover:bg-gray-500"
          }`}
        >
          {showGuideDots ? "Hide Dots" : "Show Dots"}
        </button>
      </div>
    </div>
  );
}
