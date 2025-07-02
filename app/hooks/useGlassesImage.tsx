import { useState, useEffect } from "react";
import { GlassesImageReturn } from "../types/glassesImage";

/**
 * Custom hook for loading and managing the glasses PNG image
 *
 * Loads the glasses image from the public folder once and caches it
 * for efficient reuse across renders. Provides loading state and error handling.
 *
 * @example
 * ```tsx
 * const { glassesImage, isLoading, error } = useGlassesImage();
 *
 * if (isLoading) return <div>Loading glasses...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (glassesImage) {
 *   // Use glassesImage for drawing
 * }
 * ```
 */
export function useGlassesImage(): GlassesImageReturn {
  const [glassesImage, setGlassesImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setGlassesImage(img);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError("Failed to load glasses image");
      setIsLoading(false);
    };

    // Load the glasses image from public folder
    img.src = "/images/glasses.png";
  }, []);

  return { glassesImage, isLoading, error };
}
