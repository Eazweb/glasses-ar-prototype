// hooks/useVideoTexture.ts
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function useVideoTexture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  ready: boolean,
  version: number, // this forces re-creation
) {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null,
  );

  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current;
    if (!video) return;

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    texture.needsUpdate = true;

    setVideoTexture(texture);

    return () => {
      texture.dispose();
    };
  }, [videoRef, ready, version]);

  return videoTexture;
}
