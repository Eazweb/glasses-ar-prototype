"use client";
import { useEffect, useState, RefObject } from "react";

/**
 * Custom hook to manage video ready state
 * @param videoRef Reference to the video element
 * @returns boolean indicating if video is ready to play
 */
export const useVideoReady = (videoRef: RefObject<HTMLVideoElement | null>) => {
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setVideoReady(true);

    video.addEventListener("canplay", handleCanPlay);

    if (video.readyState >= 3) {
      setVideoReady(true); // in case video is already ready
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [videoRef]);

  return videoReady;
};
