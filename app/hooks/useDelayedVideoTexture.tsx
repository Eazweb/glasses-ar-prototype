import { useEffect, useState, useRef } from "react";
import * as THREE from "three";

/**
 * Creates a THREE.CanvasTexture from a video element with a configurable frame delay.
 * This is used to synchronize the video feed with AR overlays that might have processing lag.
 * @param videoRef Ref to the HTMLVideoElement.
 * @param videoReady Boolean indicating if the video is ready to be processed.
 * @param delayInFrames The number of frames to delay the video texture. Defaults to 2.
 * @returns A THREE.CanvasTexture of the delayed video feed, or null if not ready.
 */
export function useDelayedVideoTexture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  videoReady: boolean,
  delayInFrames: number = 120,
) {
  const [delayedTexture, setDelayedTexture] =
    useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameBuffer = useRef<ImageData[]>([]).current;

  useEffect(() => {
    // console.log("[DelayedTexture] Effect triggered. videoReady:", videoReady);
    if (!videoReady || !videoRef.current || !videoRef.current.videoWidth) {
      console.log("[DelayedTexture] Pre-condition not met. Exiting effect.");
      return;
    }
    // console.log(
    //   "[DelayedTexture] Pre-condition met. Video dimensions:",
    //   videoRef.current.videoWidth,
    //   "x",
    //   videoRef.current.videoHeight,
    // );

    const video = videoRef.current;

    // Initialize canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      // console.error("[DelayedTexture] Failed to get 2D context.");
      return;
    }
    // console.log("[DelayedTexture] Canvas and context are ready.");

    // Set canvas dimensions to match the video feed
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

    // Create the texture that will be displayed in the scene
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat; // Use RGBA for sRGB textures
    setDelayedTexture(texture);
    // console.log("[DelayedTexture] Texture created and set.");

    let frameCount = 0;
    let animationFrameId: number;

    const renderLoop = () => {
      if (!video || video.paused || video.ended || !ctx) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      frameCount++;
      // Draw current video frame to the canvas to get its data
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const currentFrame = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        frameBuffer.push(currentFrame);
      } catch (e) {
        console.error("[DelayedTexture] Error getting ImageData:", e);
      }

      if (frameCount % 60 === 0) {
        // Log every ~second
        // console.log(
        //   "[DelayedTexture] Render loop running. Frame buffer size:",
        //   frameBuffer.length,
        // );
      }

      // If the buffer is full enough, render the delayed frame
      if (frameBuffer.length > delayInFrames) {
        const delayedFrame = frameBuffer.shift(); // Get the oldest frame
        if (delayedFrame) {
          ctx.putImageData(delayedFrame, 0, 0);
          texture.needsUpdate = true; // Signal to Three.js to update the texture
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };
    // console.log("[DelayedTexture] Starting render loop.");
    renderLoop();

    // Cleanup function
    return () => {
      // console.log("[DelayedTexture] Cleaning up effect.");
      cancelAnimationFrame(animationFrameId);
      texture.dispose();
      // Clear buffer on cleanup
      frameBuffer.length = 0;
    };
  }, [videoRef, videoReady, delayInFrames, frameBuffer]);

  return delayedTexture;
}
