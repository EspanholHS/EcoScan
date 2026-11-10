import test from "node:test";
import assert from "node:assert/strict";
import { particleVolumes } from "../components/hero/particle-sculpture";

test("volumes granulares são finitos, tridimensionais e preservam a identidade ao transformar", () => {
  const { bottle, cycle } = particleVolumes();
  assert.equal(bottle.length, 128 * 128 * 4);
  assert.equal(cycle.length, bottle.length);
  for (const points of [bottle, cycle]) {
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < points.length; i += 4) {
      for (let axis = 0; axis < 3; axis++) {
        const value = points[i + axis];
        assert.ok(Number.isFinite(value) && Math.abs(value) < 2.1);
        min[axis] = Math.min(min[axis], value);
        max[axis] = Math.max(max[axis], value);
      }
      assert.equal(bottle[i + 3], cycle[i + 3]);
    }
    for (let axis = 0; axis < 3; axis++) assert.ok(max[axis] - min[axis] > 0.5);
  }
});

test("reabrir a cena recompõe os mesmos volumes sem sorteio por frame", () => {
  assert.deepEqual(particleVolumes(), particleVolumes());
});
