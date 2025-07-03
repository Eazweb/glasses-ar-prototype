"use client";
import { useEffect, useState } from "react";

type Mode = "2D" | "3D";

/**
 * Custom hook to manage video texture version for 3D mode
 * @param mode Current canvas mode (2D or 3D)
 * @returns texture version number that increments when switching to 3D
 */
export const useTextureVersion = (mode: Mode) => {
  const [textureVersion, setTextureVersion] = useState(0);

  useEffect(() => {
    if (mode === "3D") {
      setTextureVersion((v) => v + 1);
    }
  }, [mode]);

  return textureVersion;
};
