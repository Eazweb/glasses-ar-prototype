import { useState, useCallback } from "react";

/**
 * Hook to track when the glasses have rendered at least once.
 * Returns [glassesReady, onGlassesRendered].
 * Pass onGlassesRendered as a prop to DrawGlasses3D and call it in useEffect or after render.
 */
export function useGlassesReady(): [boolean, () => void] {
  const [glassesReady, setGlassesReady] = useState(false);

  // Callback to be called by DrawGlasses3D after its first render
  const onGlassesRendered = useCallback(() => {
    setGlassesReady(true);
  }, []);

  return [glassesReady, onGlassesRendered];
}
