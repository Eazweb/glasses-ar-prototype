// utils/drawing/drawFaceMask3D.tsx
import React from "react";
import * as THREE from "three";
import {
  FACE_OUTLINE_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  NOSE_BRIDGE_INDICES,
  MOUTH_OUTLINE_INDICES,
} from "../faceKeypoints";

/**
 * Helper to draw a colored polyline using landmarks.
 */
function DrawPolyline({
  indices,
  landmarks,
  color,
  scaleX,
  scaleY,
  zDepth,
  closed = true,
}: {
  indices: number[];
  landmarks: { x: number; y: number }[];
  color: string;
  scaleX: number;
  scaleY: number;
  zDepth: number;
  closed?: boolean;
}) {
  const positions = indices.map((i) => {
    const pt = landmarks[i];
    if (!pt) return [0, 0, zDepth];
    return [(pt.x - 0.5) * scaleX, -(pt.y - 0.5) * scaleY, zDepth];
  });

  if (closed && positions.length > 0) {
    positions.push(positions[0]);
  }

  const linePoints = positions.map((p) => new THREE.Vector3(...p));

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            new Float32Array(linePoints.flatMap((p) => [p.x, p.y, p.z])),
            3,
          ]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}

/**
 * Renders 3D equivalents of face mask: outline, eyes, nose, mouth
 * @param landmarks Array of normalized {x,y} landmarks
 * @param scaleX X-axis scaling factor
 * @param scaleY Y-axis scaling factor
 * @param zDepth Z-position depth
 */
export function drawFaceMask3D(
  landmarks: { x: number; y: number }[],
  scaleX: number = 2,
  scaleY: number = 1.5,
  zDepth: number = 0.01,
) {
  return (
    <>
      <DrawPolyline
        indices={FACE_OUTLINE_INDICES}
        landmarks={landmarks}
        color="white"
        scaleX={scaleX}
        scaleY={scaleY}
        zDepth={zDepth}
      />
      <DrawPolyline
        indices={LEFT_EYE_INDICES}
        landmarks={landmarks}
        color="cyan"
        scaleX={scaleX}
        scaleY={scaleY}
        zDepth={zDepth}
      />
      <DrawPolyline
        indices={RIGHT_EYE_INDICES}
        landmarks={landmarks}
        color="cyan"
        scaleX={scaleX}
        scaleY={scaleY}
        zDepth={zDepth}
      />
      <DrawPolyline
        indices={NOSE_BRIDGE_INDICES}
        landmarks={landmarks}
        color="lime"
        scaleX={scaleX}
        scaleY={scaleY}
        zDepth={zDepth}
        closed={false}
      />
      <DrawPolyline
        indices={MOUTH_OUTLINE_INDICES}
        landmarks={landmarks}
        color="magenta"
        scaleX={scaleX}
        scaleY={scaleY}
        zDepth={zDepth}
      />
    </>
  );
}
