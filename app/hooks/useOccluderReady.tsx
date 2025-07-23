import { useState, useCallback } from "react";

/**
 * Hook to track when the FaceOccluder has rendered at least once.
 * Returns [occluderReady, onOccluderRendered].
 * Pass onOccluderRendered as a prop to FaceOccluder and call it in useEffect or after render.
 */
export function useOccluderReady(): [boolean, () => void] {
  const [occluderReady, setOccluderReady] = useState(false);

  // Callback to be called by the FaceOccluder after its first render
  const onOccluderRendered = useCallback(() => {
    setOccluderReady(true);
  }, []);

  return [occluderReady, onOccluderRendered];
}
