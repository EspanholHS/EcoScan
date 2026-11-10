/** Deterministic depth poses shared by camera, subject and content layers. */
import { clamp, ease, mix } from "./timeline";
export function spatialFrame(value: number) {
  const p = clamp(value);
  const arrival = ease(0.1, 0.31, p);
  const detail = ease(0.45, 0.63, p);
  const home = ease(0.77, 0.93, p);
  const passages = [
    [0.1, 0.31],
    [0.45, 0.63],
    [0.77, 0.93],
  ] as const;
  const travel = passages.map(
    ([a, b]) => Math.sin(ease(a, b, p) * Math.PI) ** 2,
  );
  const enter = [
    1,
    ease(0.21, 0.32, p),
    ease(0.53, 0.64, p),
    ease(0.82, 0.94, p),
  ];
  const exit = [
    ease(0.1, 0.22, p),
    ease(0.44, 0.55, p),
    ease(0.75, 0.84, p),
    0,
  ];
  return {
    cameraZ:
      10.8 - arrival * 1.25 - travel[0] * 0.75 - detail * 0.25 + home * 1.5,
    subjectX: mix(mix(0, -0.215, arrival), 0, home),
    subjectZ: travel[0] * 0.32 + detail * 0.18 * (1 - home),
    subjectScale: 1 - arrival * 0.08 + detail * 0.04 + travel[0] * 0.12,
    tunnel: Math.max(...travel),
    textZ: enter.map((v, i) => (1 - v) * -680 + exit[i] * 560),
    textTilt: enter.map((v, i) => (1 - v) * 8 - exit[i] * 4),
    textBlur: enter.map((v, i) => (1 - v) * 10 + exit[i] * 9),
  };
}
