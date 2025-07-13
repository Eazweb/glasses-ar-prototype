
export function smartZBoost(z: number, index: number): number {
  if (isNaN(z)) return 0;

  // Nose bridge, lips, chin — puff these out more
  const extraDepthIndices = new Set([
    1, 2, 4, 5, 6, 9, 10, 11, // Nose bridge + tip
    13, 14, 17, 18, 84, 91, 185, // Lips
    152, 377, 378, 379, 400, // Chin
  ]);

  // Slight boost for cheekbones
  const cheekIndices = new Set([50, 280, 115, 345]);

  if (extraDepthIndices.has(index)) return z * 4.0;
  if (cheekIndices.has(index)) return z * 2.5;

  // Default: mild exaggeration
  return z * 1.5;
}
