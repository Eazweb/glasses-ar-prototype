// hooks/useFaceLandmarker.tsx
import { useRef, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceLandmarkerReturn } from "../types/faceLandmarker";
import { FPS } from "../utils/config";

/**
 * Hook for face landmark detection using MediaPipe
 */
export function useFaceLandmarker(): FaceLandmarkerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarks = useRef<any[]>([]);
  const glassesTransform = useRef(null); // Add empty ref for API compatibility

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
    let lm: FaceLandmarker, id: number;
    let lastDetectionTime = 0;
    const detectionInterval = 1000 / FPS;

    (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      lm = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/model.task/face_landmarker.task" },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      const video = videoRef.current!;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          aspectRatio: { ideal: 1 / 1 },
        },
      });
      video.srcObject = stream;
      await video.play();

      const loop = () => {
        const currentTime = performance.now();

        // Only run detection at 30 FPS to reduce CPU load
        if (currentTime - lastDetectionTime >= detectionInterval) {
          try {
            const res = lm.detectForVideo(video, currentTime);
            if (res.faceLandmarks.length)
              landmarks.current = res.faceLandmarks[0];
            lastDetectionTime = currentTime;
          } catch (error) {
            console.warn("Face detection error:", error);
          }
        }

        id = requestAnimationFrame(loop);
      };
      loop();
    })();
    return () => {
      if (id) cancelAnimationFrame(id);
      if (lm) lm.close();
    };
  }, []);
  return { videoRef, landmarks, glassesTransform };
}
