"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Uniforms passed to the shader for alpha fade computation */
export interface FalloffUniforms {
  uColor: THREE.Color; // Currently unused, kept for future color effects
  uAxis: THREE.Vector3; // World-space unit vector along which fade occurs
  uFadeStart: number; // World-space distance where fade starts
  uFadeEnd: number; // World-space distance where fade ends
}

/** User settings for controlling the fade behavior */
export interface ShaderSettings {
  color: string; // Hex color (currently unused, future use)
  axis: "x" | "y" | "z"; // Local axis along which to apply the fade
  fadeStartPercent: number; // 0-100: where fade starts along the local axis
  fadeEndPercent: number; // 0-100: where fade ends along the local axis
}

// ============================================================================
// SHADER PATCHING UTILITIES (Internal functions)
// ============================================================================

/**
 * Patches a material to add alpha fade functionality
 * Injects shader code into the existing PBR shader without replacing it
 */
function patchAlphaFalloffOnMaterial(
  mat: THREE.Material,
  uniforms: FalloffUniforms,
) {
  // Cast to material types that support onBeforeCompile
  const m = mat as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

  // Enable transparency for the fade effect
  m.transparent = true;
  m.depthWrite = true; // Keep depth writing to reduce sorting artifacts

  // Store the original onBeforeCompile to chain our modifications
  const prevOnCompile = m.onBeforeCompile;

  m.onBeforeCompile = (shader, renderer) => {
    // Call any existing onBeforeCompile handlers first
    prevOnCompile?.(shader, renderer);

    // Add our custom uniforms to the shader
    shader.uniforms.uAxis = { value: uniforms.uAxis.clone().normalize() };
    shader.uniforms.uFadeStart = { value: uniforms.uFadeStart };
    shader.uniforms.uFadeEnd = { value: uniforms.uFadeEnd };

    // ===== VERTEX SHADER INJECTION =====
    // Add a varying to pass world-space position to fragment shader
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `
        #include <common>
        varying vec3 vPosWorld; // World-space position for fade computation
      `,
      )
      .replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        vPosWorld = (modelMatrix * vec4(position, 1.0)).xyz; // Transform to world space
      `,
      );

    // ===== FRAGMENT SHADER INJECTION =====
    // Add uniforms and varying, then inject fade logic before final output
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `
        #include <common>
        uniform vec3 uAxis;        // World-space fade direction
        uniform float uFadeStart;  // World-space fade start distance
        uniform float uFadeEnd;    // World-space fade end distance
        varying vec3 vPosWorld;    // World-space position from vertex shader
      `,
      )
      .replace(
        "#include <dithering_fragment>",
        `
        // ===== ALPHA FADE COMPUTATION =====
        // Project world position onto the fade axis
        float posAlongAxis = dot(vPosWorld, uAxis);
        
        // Ensure start < end for consistent fade direction
        float start = min(uFadeStart, uFadeEnd);
        float end = max(uFadeStart, uFadeEnd);
        float range = end - start;
        
        // Compute fade factor (0.0 = no fade, 1.0 = full fade)
        float t = 0.0;
        if (range > 0.0001) { // Avoid division by zero
          t = (posAlongAxis - start) / range;
        }
        t = clamp(t, 0.0, 1.0); // Clamp to valid range

        // Handle inverted fade (when end < start in settings)
        if (uFadeEnd < uFadeStart) {
          t = 1.0 - t;
        }

        // Apply smooth cubic easing for natural fade transition
        float fade = t * t * (3.0 - 2.0 * t); // Smoothstep approximation
        
        // Multiply final alpha by fade factor (preserves all PBR lighting)
        gl_FragColor.a *= (1.0 - fade);
        // ===== END ALPHA FADE COMPUTATION =====

        #include <dithering_fragment>
      `,
      );

    // Store shader reference for live uniform updates
    (m as any).userData._fadeShader = shader;
  };

  // Force material to recompile with our modifications
  m.needsUpdate = true;
}

/**
 * Updates uniforms on an already-patched material
 * Called every frame to keep fade aligned with model transforms
 */
function updateFalloffUniforms(mat: THREE.Material, uniforms: FalloffUniforms) {
  // Get the shader we stored during patching
  const sh = (mat as any).userData?._fadeShader as any;
  if (!sh) return; // Material not patched yet

  // Update shader uniforms with new values
  sh.uniforms.uAxis.value.copy(uniforms.uAxis);
  sh.uniforms.uFadeStart.value = uniforms.uFadeStart;
  sh.uniforms.uFadeEnd.value = uniforms.uFadeEnd;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook that adds alpha fade to a 3D model
 *
 * @param targetRef - Ref to the group containing the model to fade
 * @param settings - Configuration for fade behavior
 *
 * How it works:
 * 1. Builds an Oriented Bounding Box (OBB) in the model's local space
 * 2. Patches all mesh materials with fade shader code (once)
 * 3. Updates uniforms every frame to keep fade aligned with transforms
 */
export function useAlphaFalloff(
  targetRef: RefObject<THREE.Object3D>,
  settings: ShaderSettings,
) {
  // ===== STATE MANAGEMENT =====
  const isPatchedRef = useRef(false); // Track if materials are patched
  const obbReadyRef = useRef(false); // Track if OBB is computed
  const obbCenterLocalRef = useRef(new THREE.Vector3()); // OBB center in local space
  const obbHalfExtentsRef = useRef(new THREE.Vector3()); // OBB half-extents in local space

  // ===== COMPUTED VALUES =====
  // Convert axis string to local unit vector
  const localAxis = useMemo(() => {
    return new THREE.Vector3(
      settings.axis === "x" ? 1 : 0,
      settings.axis === "y" ? 1 : 0,
      settings.axis === "z" ? 1 : 0,
    );
  }, [settings.axis]);

  // ===== UNIFORM COMPUTATION =====
  /**
   * Computes shader uniforms from the model's current world transform
   * This ensures the fade stays aligned with the model during rotation/movement
   */
  function computeUniformsFromOBB(root: THREE.Object3D): FalloffUniforms {
    // Get the model's current world rotation
    const worldQuat = new THREE.Quaternion();
    root.getWorldQuaternion(worldQuat);

    // Transform local axis to world space (this makes fade rotate with the model)
    const axisWorld = localAxis.clone().applyQuaternion(worldQuat).normalize();

    // Get OBB data in local space
    const centerLocal = obbCenterLocalRef.current;
    const half = obbHalfExtentsRef.current;

    // Get the half-extent along the chosen axis
    const halfAlongAxis =
      settings.axis === "x" ? half.x : settings.axis === "y" ? half.y : half.z;

    // Convert percentage settings to local offsets
    // Maps 0-100% to -half to +half along the local axis
    const offsetStartLocal =
      -halfAlongAxis + 2 * halfAlongAxis * (settings.fadeStartPercent / 100);
    const offsetEndLocal =
      -halfAlongAxis + 2 * halfAlongAxis * (settings.fadeEndPercent / 100);

    // Transform local center to world space
    const centerWorld = root.localToWorld(centerLocal.clone());

    // Compute world-space scale for one local unit along the axis
    // This accounts for any scaling applied to the model
    const stepWorld = root
      .localToWorld(centerLocal.clone().add(localAxis.clone()))
      .sub(centerWorld);
    const scaleAlongAxis = stepWorld.length();

    // Project world center onto world axis to get base distance
    const base = centerWorld.dot(axisWorld);

    // Convert local offsets to world distances
    const fadeStart = base + offsetStartLocal * scaleAlongAxis;
    const fadeEnd = base + offsetEndLocal * scaleAlongAxis;

    return {
      uColor: new THREE.Color(settings.color),
      uAxis: axisWorld,
      uFadeStart: fadeStart,
      uFadeEnd: fadeEnd,
    };
  }

  // ===== OBB BUILDING (One-time setup) =====
  useEffect(() => {
    const root = targetRef.current;
    if (!root) return;

    // Ensure world matrices are up to date
    root.updateMatrixWorld(true);

    // Build OBB by unioning all child mesh bounding boxes
    const localBox = new THREE.Box3(); // Final OBB in root local space
    const tmpBox = new THREE.Box3(); // Temporary box for each mesh
    const invRoot = new THREE.Matrix4().copy(root.matrixWorld).invert(); // Transform from world to root local

    // Traverse all child meshes
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const mesh = child as THREE.Mesh;
      const geom = mesh.geometry as THREE.BufferGeometry;

      // Ensure geometry has a bounding box
      if (!geom.boundingBox) {
        geom.computeBoundingBox();
      }
      if (!geom.boundingBox) return; // Skip if still no bounding box

      // Transform mesh's local bounding box to root's local space
      const meshLocalToWorld = mesh.matrixWorld.clone();
      const meshLocalToRoot = new THREE.Matrix4().multiplyMatrices(
        invRoot,
        meshLocalToWorld,
      );

      // Apply transform and union with overall OBB
      tmpBox.copy(geom.boundingBox);
      tmpBox.applyMatrix4(meshLocalToRoot);
      if (localBox.isEmpty()) localBox.copy(tmpBox);
      else localBox.union(tmpBox);
    });

    // Store OBB data if we found any geometry
    if (!localBox.isEmpty()) {
      localBox.getCenter(obbCenterLocalRef.current);
      const size = new THREE.Vector3();
      localBox.getSize(size);
      obbHalfExtentsRef.current.copy(size.multiplyScalar(0.5));
      obbReadyRef.current = true;
    }

    // Patch materials with initial uniforms
    const uniforms = computeUniformsFromOBB(root);

    // Patch all mesh materials (only once)
    if (!isPatchedRef.current) {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = (child.material as THREE.MeshStandardMaterial).clone();
          patchAlphaFalloffOnMaterial(mat, uniforms);
          child.material = mat;
        }
      });
      isPatchedRef.current = true;
    }
  }, [targetRef, localAxis]);

  // ===== PER-FRAME UNIFORM UPDATES =====
  useFrame(() => {
    const root = targetRef.current;
    if (!root) return;

    // Wait for OBB to be ready
    if (!obbReadyRef.current) return;

    // Ensure world matrices are current
    root.updateMatrixWorld(true);

    // Compute new uniforms based on current transform
    const uniforms = computeUniformsFromOBB(root);

    // Update all patched materials with new uniforms
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        updateFalloffUniforms(child.material, uniforms);
      }
    });
  });
}
