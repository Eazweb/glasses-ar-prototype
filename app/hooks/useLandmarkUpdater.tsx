import { useEffect, useState, RefObject } from "react";

export function useLandmarkUpdater(landmarks: RefObject<any>, fps: number) {
  const [landmarkVersion, setLandmarkVersion] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const interval = 1000 / fps;

    const updateLandmarks = () => {
      if (
        landmarks.current &&
        Array.isArray(landmarks.current) &&
        landmarks.current.length > 0
      ) {
        setLandmarkVersion((v) => v + 1);
      }
    };

    intervalId = setInterval(updateLandmarks, interval);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [landmarks, fps]);

  return landmarkVersion;
}
