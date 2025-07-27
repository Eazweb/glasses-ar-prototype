// hooks/useFaceWorker.tsx
import { useRef, useEffect } from "react";
import { FaceLandmarkerReturn } from "../types/faceLandmarker";
import { FPS as TARGET_FPS } from "../utils/config";

/**
 * Hook for face landmark detection using MediaPipe Web Worker
 */
export function useFaceWorker(): FaceLandmarkerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarks = useRef<any[]>([]);
  const glassesTransform = useRef<any | null>(null);

  const originalConsoleError = console.error;
  console.error = function (...args) {
    // Filter out TensorFlow Lite info messages
    if (
      args[0] &&
      args[0].includes &&
      args[0].includes("Created TensorFlow Lite XNNPACK delegate")
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  useEffect(() => {
    // Performance constants
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    // Performance tracking
    const lastFrameTimeRef = { current: 0 };
    const canvasRef = { current: null as HTMLCanvasElement | null };
    const animationFrameIdRef = { current: null as number | null };

    // Latest frame only strategy
    let workerBusy = false;
    let latestBitmap: ImageBitmap | null = null;

    (async () => {
      // Create a new worker instance from the public URL
      const worker = new Worker(
        new URL("../workers/face.worker.js", import.meta.url),
        {
          type: "module",
        },
      );

      // --- State to manage the setup flow ---
      const isWorkerReady = { current: false };

      // --- Function to handle messages from the worker ---
      worker.onmessage = (event: MessageEvent) => {
        const {
          type,
          landmarks: workerLandmarks,
          glassesTransform: workerTransform,
        } = event.data;
        if (type === "WORKER_READY") {
          isWorkerReady.current = true;
        } else if (type === "LANDMARKS_RESULT") {
          // Update the refs
          landmarks.current = workerLandmarks[0] || [];
          glassesTransform.current = workerTransform;
          workerBusy = false;
          // If a new bitmap is waiting, send it now
          if (latestBitmap) {
            workerBusy = true;
            worker.postMessage(
              { type: "VIDEO_FRAME", videoFrame: latestBitmap },
              [latestBitmap],
            );
            latestBitmap = null;
          }
        }
      };

      // Latest frame only processing
      const processFrame = () => {
        const now = performance.now();
        const timeSinceLastFrame = now - lastFrameTimeRef.current;
        if (timeSinceLastFrame < FRAME_INTERVAL) {
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
          return;
        }
        lastFrameTimeRef.current = now;

        if (
          videoRef.current &&
          videoRef.current.readyState >= 2 && // Video has data
          worker &&
          isWorkerReady.current
        ) {
          const video = videoRef.current;
          // Reuse canvas for better performance
          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx && worker) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            createImageBitmap(canvas)
              .then((bitmap) => {
                if (!workerBusy) {
                  workerBusy = true;
                  worker.postMessage(
                    { type: "VIDEO_FRAME", videoFrame: bitmap },
                    [bitmap],
                  );
                } else {
                  // If worker is busy, store the latest bitmap for next round
                  if (latestBitmap) latestBitmap.close();
                  latestBitmap = bitmap;
                }
              })
              .catch(console.error);
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      };

      const video = videoRef.current!;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          // Drastically reduce resolution for mobile performance
          width: { ideal: 360 },
          height: { ideal: 360 },
          frameRate: { max: TARGET_FPS }, // Match actual glasses FPS on mobile
        },
      });
      video.srcObject = stream;
      await video.play();
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    })();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
        canvasRef.current = null;
      }
      // Clean up any pending bitmap
      if (typeof latestBitmap !== "undefined" && latestBitmap) {
        latestBitmap.close();
      }
    };
  }, []);

  return { videoRef, landmarks, glassesTransform };
}
