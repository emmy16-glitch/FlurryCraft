// Pure blueprint rotation helpers shared by browser gameplay and tests.
// Rotation is around the Y axis, preserving the discrete voxel grid.
export function rotatedSize(size, turn = 0) {
  const n = ((turn % 4) + 4) % 4;
  return n % 2 ? [size[2], size[1], size[0]] : [...size];
}
export function rotateXZ(x, z, size, turn = 0) {
  const n = ((turn % 4) + 4) % 4;
  if (n === 1) return [size[2] - 1 - z, x];
  if (n === 2) return [size[0] - 1 - x, size[2] - 1 - z];
  if (n === 3) return [z, size[0] - 1 - x];
  return [x, z];
}
export function selectionBounds(a, b, limit = 32) {
  if (![a.x,a.y,a.z,b.x,b.y,b.z].every(Number.isInteger)) throw new Error('Aim at two valid blocks.');
  const min = [Math.min(a.x,b.x),Math.min(a.y,b.y),Math.min(a.z,b.z)];
  const max = [Math.max(a.x,b.x),Math.max(a.y,b.y),Math.max(a.z,b.z)];
  const size = max.map((v,i)=>v-min[i]+1);
  if(size.some(v=>v>limit) || size[0]*size[1]*size[2]>32768) throw new Error('Keep each building side within 32 blocks.');
  if(min[1]<0 || max[1]>=96) throw new Error('Building must be inside the world height.');
  return { min, size };
}
