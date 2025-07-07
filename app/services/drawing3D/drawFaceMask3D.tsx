// utils/drawing/drawFaceMask3D.tsx
import React from "react";
import * as THREE from "three";
import {
  FACE_OUTLINE_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  NOSE_BRIDGE_INDICES,
  MOUTH_OUTLINE_INDICES,
} from "../../utils/faceKeypoints";
import { landmarkToWorld } from "../../utils/landmarkToWorld";

/**
 * Helper to draw a colored polyline using landmarks.
 */
function DrawPolyline({
  indices,
  landmarks,
  color,
  closed = true,
}: {
  indices: number[];
  landmarks: { x: number; y: number; z?: number }[];
  color: string;
  closed?: boolean;
}) {
  const positions = indices.map((i) => {
    const pt = landmarks[i];
    if (!pt) return [0, 0, 0];
    const worldPos = landmarkToWorld(pt);
    return [worldPos.x, worldPos.y, worldPos.z];
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
 */
export function drawFaceMask3D(
  landmarks: { x: number; y: number; z?: number }[],
) {
  return (
    <>
      <DrawPolyline
        indices={FACE_OUTLINE_INDICES}
        landmarks={landmarks}
        color="white"
      />
      <DrawPolyline
        indices={LEFT_EYE_INDICES}
        landmarks={landmarks}
        color="cyan"
      />
      <DrawPolyline
        indices={RIGHT_EYE_INDICES}
        landmarks={landmarks}
        color="cyan"
      />
      <DrawPolyline
        indices={NOSE_BRIDGE_INDICES}
        landmarks={landmarks}
        color="lime"
        closed={false}
      />
      <DrawPolyline
        indices={MOUTH_OUTLINE_INDICES}
        landmarks={landmarks}
        color="magenta"
      />
    </>
  );
}
