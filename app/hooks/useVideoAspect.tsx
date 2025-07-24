import { useEffect, useState } from "react";

export function useVideoAspect(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  videoReady: boolean,
): number | null {
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    if (!videoReady || !videoRef.current) return;
    const video = videoRef.current;

    // console.log("videoWidth", video.videoWidth);
    // console.log("videoHeight", video.videoHeight);

    function updateAspect() {
      if (video.videoWidth && video.videoHeight) {
        setAspect(video.videoWidth / video.videoHeight);
      }
    }

    // Update on metadata load (in case videoReady is true before metadata is loaded)
    video.addEventListener("loadedmetadata", updateAspect);
    // Try immediately in case metadata is already loaded
    updateAspect();

    return () => {
      video.removeEventListener("loadedmetadata", updateAspect);
    };
  }, [videoRef, videoReady]);

  return aspect;
}
