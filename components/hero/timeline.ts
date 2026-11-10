/** A reversible scroll clock shared by typography, atmosphere and materials. */
export const CHAPTERS = [
  { name: "Início", progress: 0 },
  { name: "Como funciona", progress: 0.36 },
  { name: "Seu resultado", progress: 0.67 },
  { name: "Começar", progress: 0.94 },
] as const;
export const clamp = (n: number) =>
  Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
export function ease(a: number, b: number, n: number) {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
/** Time-based damping: identical response at different refresh rates. */
export function approach(current: number, target: number, seconds: number) {
  return mix(current, target, 1 - Math.exp(-Math.max(0, seconds) * 8));
}
export function journeyFrame(value: number, mobile = false) {
  const p = clamp(value);
  const arrival = ease(0.12, 0.31, p);
  const cycle = ease(0.39, 0.57, p);
  const returnHome = ease(0.7, 0.88, p);
  const firstWipe = ease(0.14, 0.28, p);
  const secondWipe = ease(0.41, 0.55, p);
  const thirdWipe = ease(0.71, 0.85, p);
  const dark = ease(0.4, 0.55, p) * (1 - ease(0.71, 0.87, p));
  const alpha = [
    1 - ease(0.1, 0.21, p),
    ease(0.21, 0.31, p) * (1 - ease(0.44, 0.54, p)),
    ease(0.54, 0.64, p) * (1 - ease(0.75, 0.82, p)),
    ease(0.82, 0.93, p),
  ];
  const enter = [
    1,
    ease(0.18, 0.31, p),
    ease(0.44, 0.57, p),
    ease(0.74, 0.89, p),
  ];
  const exit = [ease(0.12, 0.26, p), ease(0.4, 0.53, p), ease(0.7, 0.83, p), 0];
  const active = p < 0.21 ? 0 : p < 0.54 ? 1 : p < 0.82 ? 2 : 3;
  return {
    progress: p,
    arrival,
    cycle,
    returnHome,
    dark,
    alpha,
    // Complementary viewport masks prevent two passages painting over one another.
    textMasks: mobile
      ? [
          [firstWipe * 100, 0, 0, 0],
          [secondWipe * 100, 0, (1 - firstWipe) * 100, 0],
          [thirdWipe * 100, 0, (1 - secondWipe) * 100, 0],
          [0, 0, (1 - thirdWipe) * 100, 0],
        ]
      : [
          [0, firstWipe * 100, 0, 0],
          [0, secondWipe * 100, 0, (1 - firstWipe) * 100],
          [0, 0, 0, Math.max((1 - secondWipe) * 100, thirdWipe * 100)],
          [0, (1 - thirdWipe) * 100, 0, 0],
        ],
    active,
    textY: enter.map((v, i) => (1 - v) * 58 - exit[i] * 62),
    textScale: enter.map((v, i) => 0.97 + v * 0.03 + exit[i] * 0.025),
    anchorX: mobile
      ? 0.5
      : mix(mix(mix(0.73, 0.28, arrival), 0.5, cycle), 0.73, returnHome),
    anchorY: mobile
      ? mix(mix(mix(0.74, 0.77, arrival), 0.71, cycle), 0.74, returnHome)
      : mix(mix(mix(0.46, 0.55, arrival), 0.64, cycle), 0.43, returnHome),
    scale: mix(
      mix(
        mix(mobile ? 0.47 : 0.98, mobile ? 0.42 : 1.03, arrival),
        mobile ? 0.42 : 0.63,
        cycle,
      ),
      mobile ? 0.45 : 0.9,
      returnHome,
    ),
    disassemble: ease(0.19, 0.32, p) * (1 - ease(0.39, 0.55, p)),
    spread: cycle * (1 - returnHome),
    dock: Math.max(1 - ease(0.03, 0.15, p), ease(0.78, 0.89, p)),
  };
}
