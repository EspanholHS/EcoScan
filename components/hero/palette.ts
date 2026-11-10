import { clamp, mix } from "./timeline";

type RGB = [number, number, number];
const interpolate = (a: RGB, b: RGB, t: number): RGB =>
  a.map((v, i) => mix(v, b[i], t)) as RGB;
export function luminance(rgb: RGB) {
  const linear = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
export function contrast(a: RGB, b: RGB) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** The ink changes polarity at the contrast crossover, never through invisible grey. */
export function journeyPalette(darkness: number) {
  const background = interpolate(
    [0.89, 0.92, 0.84],
    [0.035, 0.083, 0.056],
    clamp(darkness),
  );
  const darkest: RGB = [0.008, 0.012, 0.009],
    lightest: RGB = [0.995, 0.999, 0.995];
  const lightInk =
    contrast(lightest, background) > contrast(darkest, background);
  const limit = lightInk ? lightest : darkest;
  const readable = (preferred: RGB) => {
    if (contrast(preferred, background) >= 4.5) return preferred;
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(interpolate(preferred, limit, mid), background) >= 4.5)
        hi = mid;
      else lo = mid;
    }
    return interpolate(preferred, limit, hi);
  };
  const ink = readable(lightInk ? [0.89, 0.94, 0.85] : [0.085, 0.18, 0.12]);
  const muted = readable(lightInk ? [0.66, 0.74, 0.62] : [0.32, 0.39, 0.29]);
  const accent = readable(lightInk ? [0.8, 0.87, 0.66] : [0.42, 0.51, 0.31]);
  const css = (color: RGB) =>
    `rgb(${color.map((c) => (c * 255).toFixed(3)).join(" ")})`;
  return {
    background,
    ink,
    muted,
    accent,
    paperCSS: css(background),
    inkCSS: css(ink),
    mutedCSS: css(muted),
    accentCSS: css(accent),
    lineCSS: css(interpolate(background, ink, 0.21)),
  };
}
