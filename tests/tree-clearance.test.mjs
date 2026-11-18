import test from 'node:test';
import assert from 'node:assert/strict';
import { Gen, CH } from '../js/worldgen.js';
import * as B from '../js/blocks.js';

test('new spruce canopies leave enough headroom to fight and walk below the boughs', () => {
  const chunk = { cx: 0, cz: 0, blocks: new Uint8Array(16 * 16 * CH) };
  const gen = new Gen(141);
  gen.placeTree(chunk, { x: 8, y: 12, z: 8, ht: 8, kind: 'spruce' });
  for (let y = 12; y <= 15; y++) {
    for (let z = 5; z <= 11; z++) for (let x = 5; x <= 11; x++) {
      const id = chunk.blocks[x + (z << 4) + (y << 8)];
      assert.notEqual(id, B.LEAVES, 'low spruce foliage at ' + [x, y, z].join(','));
    }
  }
  assert.equal(chunk.blocks[8 + (8 << 4) + (12 << 8)], B.SPRUCE_LOG);
  assert.equal(chunk.blocks[8 + (8 << 4) + (18 << 8)], B.LEAVES);
});
