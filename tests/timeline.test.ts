import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS, journeyFrame } from "../components/hero/timeline";
import { contrast, journeyPalette } from "../components/hero/palette";

test("texto e legendas mantêm contraste na atmosfera inteira, inclusive parada no meio", () => {
  for (let i = 0; i <= 1000; i++) {
    const palette = journeyPalette(i / 1000);
    assert.ok(contrast(palette.ink, palette.background) >= 4.5);
    assert.ok(contrast(palette.muted, palette.background) >= 4.5);
    assert.ok(contrast(palette.accent, palette.background) >= 4.5);
  }
});

test("a timeline limita o scroll e permanece finita nos dois layouts", () => {
  for (const mobile of [false, true]) {
    assert.deepEqual(journeyFrame(-3, mobile), journeyFrame(0, mobile));
    assert.deepEqual(journeyFrame(8, mobile), journeyFrame(1, mobile));
    for (let i = 0; i <= 1000; i++) {
      const frame = journeyFrame(i / 1000, mobile);
      for (const value of Object.values(frame).flat(2))
        assert.ok(Number.isFinite(value));
      assert.ok(frame.alpha.every((a) => a >= 0 && a <= 1));
      assert.ok(
        frame.alpha.filter((a) => a > 0).length <= 1,
        "as passagens devem dissolver sem sobreposição tipográfica",
      );
      assert.ok(frame.alpha[frame.active] === Math.max(...frame.alpha));
    }
  }
});
test("avanços, saltos e reversões entregam a mesma pose para o mesmo scroll", () => {
  const expected = Array.from({ length: 101 }, (_, i) => journeyFrame(i / 100));
  for (let i = 100; i >= 0; i--)
    assert.deepEqual(journeyFrame(i / 100), expected[i]);
  for (const index of [0, 93, 21, 78, 12, 64, 100, 0, 32])
    assert.deepEqual(journeyFrame(index / 100), expected[index]);
});
test("enquadramento, atmosfera e texto não têm saltos nas fronteiras", () => {
  for (const mobile of [false, true]) {
    let previous = journeyFrame(0, mobile);
    for (let i = 1; i <= 10000; i++) {
      const next = journeyFrame(i / 10000, mobile);
      for (const key of [
        "anchorX",
        "anchorY",
        "scale",
        "dark",
        "disassemble",
        "spread",
        "dock",
      ] as const)
        assert.ok(Math.abs(next[key] - previous[key]) < 0.005, key);
      next.textY.forEach((y, index) =>
        assert.ok(Math.abs(y - previous.textY[index]) < 0.15),
      );
      previous = next;
    }
  }
});
test("os atalhos chegam a momentos legíveis e o cenário fecha o ciclo", () => {
  CHAPTERS.forEach((chapter, index) => {
    const frame = journeyFrame(chapter.progress);
    assert.equal(frame.active, index);
    assert.equal(frame.alpha[index], 1);
  });
  assert.equal(journeyFrame(0.61).dark, 1);
  assert.equal(journeyFrame(1).dark, 0);
  assert.equal(journeyFrame(1).disassemble, 0);
  assert.equal(journeyFrame(1).spread, 0);
  assert.equal(journeyFrame(1).dock, 1);
});
test("máscaras de passagens simultâneas nunca deixam os textos se sobrepor", () => {
  for (const mobile of [false, true])
    for (let i = 0; i <= 1000; i++) {
      const frame = journeyFrame(i / 1000, mobile);
      const rects = frame.textMasks.map(([t, r, b, l]) => ({
        left: l,
        right: 100 - r,
        top: t,
        bottom: 100 - b,
      }));
      for (let j = 0; j < 3; j++) {
        if (frame.alpha[j] === 0 || frame.alpha[j + 1] === 0) continue;
        const a = rects[j],
          b = rects[j + 1];
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        assert.ok(width < 0.00001 || height < 0.00001);
      }
    }
});

test("amortecimento mantém ritmo a 30, 60 e 144 Hz e não ultrapassa o alvo ao inverter", async () => {
  const { approach } = await import("../components/hero/timeline");
  const results = [30, 60, 144].map((hz) => {
    let p = 0;
    for (let i = 0; i < hz; i++) p = approach(p, 1, 1 / hz);
    return p;
  });
  results.forEach((p) => assert.ok(Math.abs(p - results[0]) < 1e-12));
  let p = 0.8;
  for (let i = 0; i < 120; i++) {
    const next = approach(p, 0.2, 1 / 60);
    assert.ok(next >= 0.2 && next <= p);
    p = next;
  }
  assert.ok(Math.abs(p - 0.2) < 0.000001);
});
import { spatialFrame } from "../components/hero/spatial-timeline";

test("profundidade é reversível, finita e mantém a câmera fora do objeto", () => {
  const expected = Array.from({ length: 1001 }, (_, i) =>
    spatialFrame(i / 1000),
  );
  for (let i = 1000; i >= 0; i--) {
    const pose = spatialFrame(i / 1000);
    assert.deepEqual(pose, expected[i]);
    for (const n of Object.values(pose).flat()) assert.ok(Number.isFinite(n));
    assert.ok(pose.subjectScale > 0);
    assert.ok(pose.cameraZ - pose.subjectZ > 6);
    if (i > 0) {
      const before = expected[i - 1];
      for (const key of [
        "cameraZ",
        "subjectZ",
        "subjectX",
        "subjectScale",
      ] as const)
        assert.ok(Math.abs(pose[key] - before[key]) < 0.05, key);
      pose.textZ.forEach((z, j) =>
        assert.ok(Math.abs(z - before.textZ[j]) < 16),
      );
    }
  }
});

test("capítulos sem texto não voltam ao início durante a travessia", () => {
  for (const [boundary, next] of [
    [0.21, 1],
    [0.54, 2],
    [0.82, 3],
  ]) {
    assert.equal(journeyFrame(boundary - 1e-8).active, next - 1);
    assert.equal(journeyFrame(boundary).active, next);
    assert.equal(journeyFrame(boundary + 1e-8).active, next);
  }
});
