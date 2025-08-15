## useAlphaFalloff (Developer Notes)

### What this is

`useAlphaFalloff` adds an alpha fade band to an existing PBR material without replacing the shader. It patches each mesh material via `onBeforeCompile` and multiplies the final `gl_FragColor.a` by a fade factor computed in world space.

This keeps all original lighting/IBL/reflections intact, while enabling a controllable fade that aligns with the rendered glasses in 3D.

### Why this approach

- We do not author a custom shader from scratch. Instead, we inject small snippets into the stock Three.js PBR shader.
- Fade is computed in world space, so what you see on screen matches the effective coordinates after all transforms.

### High‑level flow

1. Integration (your code)

- Render your GLTF normally inside a `group` and keep a ref to it.
- Call `useAlphaFalloff(modelGroupRef, settings)` alongside the render.

2. One‑time OBB build (hook)

- We traverse child meshes, grab each geometry's local `boundingBox` (compute if missing), transform those boxes into the root group’s local space, and union them.
- We store the root‑local Oriented Bounding Box as `centerLocal` and `halfExtentsLocal`.

3. Per‑frame uniforms (hook)

- Read the root group’s world quaternion and build a world‑space axis from the selected local axis (`x|y|z`).
- Convert OBB center to world space and compute a world‑space scale for one local unit along the chosen axis.
- Convert the percentage settings to signed local offsets and map them to world distances: `fadeStartWorld = base + offsetStartLocal * scaleAlongAxis`, `fadeEndWorld = base + offsetEndLocal * scaleAlongAxis`.
- Update every patched material’s uniforms: `uAxis`, `uFadeStart`, `uFadeEnd`.

4. Material patching (hook, once)

- For each mesh, we clone the material, set `transparent = true`, `depthWrite = true`.
- Inject in vertex shader: a varying `vPosWorld` with `(modelMatrix * vec4(position, 1.0)).xyz`.
- Inject in fragment shader: compute the fade amount from `dot(vPosWorld, uAxis)` and multiply the final `gl_FragColor.a` after all PBR lighting.

### API

```ts
type ShaderSettings = {
  color: string; // currently unused for the fade itself, kept for future use
  axis: "x" | "y" | "z"; // local axis the fade runs along
  fadeStartPercent: number; // 0..100 within the model’s local OBB along the axis
  fadeEndPercent: number; // 0..100 within the model’s local OBB along the axis
};

function useAlphaFalloff(
  targetRef: React.RefObject<THREE.Object3D>,
  settings: ShaderSettings,
): void;
```

### Usage example

```tsx
// DrawGlasses3D.tsx (excerpt)
const pivot = useRef<Group>(null!);
const modelGroup = useRef<Group>(null!);
const { scene } = useGLTF(GLASSES_USED.path);

useAlphaFalloff(modelGroup, {
  color: "#ffffff",
  axis: "z",
  fadeStartPercent: 100,
  fadeEndPercent: 25,
});

return (
  <group ref={pivot}>
    <group ref={modelGroup}>
      <primitive object={scene} />
    </group>
  </group>
);
```

### How the fade region is computed (details)

- The model’s OBB is stored in root‑local space as `centerLocal` and `halfExtentsLocal`.
- The chosen local axis is turned into a world axis each frame via the root’s world quaternion.
- Settings (0..100%) are converted to signed local offsets along that axis in the range `[-half, +half]`.
- Those local offsets are scaled into world units by measuring a 1‑unit step along the local axis transformed into world space.
- Final uniform values:
  - `uAxis = axisWorld (unit vector)`
  - `uFadeStart = base + offsetStartLocal * scaleAlongAxis`
  - `uFadeEnd   = base + offsetEndLocal * scaleAlongAxis`
  - where `base = dot(centerWorld, axisWorld)`

This approach remains stable with yaw/roll/pitch, does not flip at high yaw, and avoids the “whole model fades when rotating” effect.

### Performance notes

- OBB is built once on mount by traversing meshes. Uniforms are updated every frame, which is cheap (no re‑patching).
- If you add/remove meshes or change geometry extents at runtime, you should re‑initialize the hook (e.g., remount the group or change a React key) so the OBB is rebuilt.

### Caveats

- Transparent rendering: we keep `depthWrite = true` to reduce sorting artifacts. Depending on your scene, you may wish to adjust material transparency flags.
- `uColor` is included for future extensibility; the current fade only affects alpha.
- The hook assumes a reasonably rigid model whose local extents don’t change per frame. If they do, rebuild the OBB.

### Troubleshooting

- Band flips at large yaw:
  - Fixed by computing `uAxis` in world space per frame and using OBB center/scale along the local axis.
- Entire model dims when rotating:
  - Addressed by mapping fade percentages from the local OBB and scaling to world units, so the fade band stays locked to the model.

