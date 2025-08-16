export interface GlassesModel {
  path: string;
  scale: number;
  offset: { x: number; y: number; z: number };
}

export const GLASSES_MODELS: Record<string, GlassesModel> = {
  aviator_sunglasses: {
    path: "/model/models/aviator_fixed_origin.glb", // checked origin in blender, origin issue persists
    scale: 0.088,
    offset: { x: 0, y: -0.01, z: 0.02 },
  },
  black_sunglasses: {
    path: "/model/models/black_sunglasses_fixed_origin_decimated.glb", // working
    scale: 12,
    offset: { x: 0, y: -0.01, z: 0.03 },
  },
  black_frame: {
    path: "/model/models/black_frame_fixed_origin.glb", // working
    scale: 12,
    offset: { x: 0, y: 0, z: 0.03 },
  },
  cazal: {
    path: "/model/models/cazal_fixed_origin.glb", // working
    scale: 7,
    offset: { x: 0, y: 0, z: 0.05 },
  },
  chrome: {
    path: "/model/models/chrome.glb",
    scale: 11.0,
    offset: { x: 0, y: 0, z: 0.08 },
  },
  dwi_sunglasses: {
    path: "/model/models/dwi_sunglasses_fixed_origin.glb",
    scale: 0.012,
    offset: { x: 0, y: -0.01, z: 0.035 },
  },
  glasses_1: {
    path: "/model/models/glasses (1).glb", // misaligned
    scale: 1.0,
    offset: { x: 0, y: 0, z: 0 },
  },
  glasses_2: {
    path: "/model/models/glasses (2).glb", // not working
    scale: 1.0,
    offset: { x: 0, y: 0, z: 0 },
  },
  glasses_3: {
    path: "/model/models/glasses (3).glb", // misaligned
    scale: 0.0055,
    offset: { x: 0, y: -0.05, z: 0.05 },
  },
  glasses: {
    path: "/model/models/glasses.glb",
    scale: 0.003,
    offset: { x: 0, y: -0.18, z: -0.15 },
  },
  prada_vintage_star: {
    path: "/model/models/prada_fixed_origin_compressed.glb",
    scale: 0.6,
    offset: { x: 0, y: -0.01, z: 0.07 },
  },
  ray_ban: {
    path: "/model/models/rayban_fixed_origin_compressed_decimated.glb", // almost working
    scale: 0.79,
    offset: { x: 0, y: -0.02, z: 0.05 },
  },
  sunglasses: {
    path: "/model/models/sunglasses_fixed_origin.glb",
    scale: 2.5,
    offset: { x: 0, y: -0.02, z: 0.06 },
  },
  white_gold_sunglass: {
    path: "/model/models/white_gold_sunglasses_fixed_origin_compressed_decimated.glb", // almost working
    scale: 11.5,
    offset: { x: 0, y: 0, z: 0.03 },
  },
};

// Helper function to get model by ID
export const getGlassesModel = (modelId: string): GlassesModel | null => {
  return GLASSES_MODELS[modelId] || null;
};

// Helper function to get all available model IDs
export const getAvailableModelIds = (): string[] => {
  return Object.keys(GLASSES_MODELS);
};
