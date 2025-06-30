// hooks/useFaceLandmarker.tsx
import { useRef, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceLandmarkerReturn } from "../types/faceLandmarker";

/**
 * Hook for face landmark detection using MediaPipe
 */
export function useFaceLandmarker(): FaceLandmarkerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarks = useRef<any[]>([]);
  useEffect(() => {
    let lm: FaceLandmarker, id: number;
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();
      const loop = () => {
        const res = lm.detectForVideo(video, performance.now());
        if (res.faceLandmarks.length) landmarks.current = res.faceLandmarks[0];
        id = requestAnimationFrame(loop);
      };
      loop();
    })();
    return () => {
      if (id) cancelAnimationFrame(id);
      if (lm) lm.close();
    };
  }, []);
  return { videoRef, landmarks };
}
