"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function HistoryAtmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = canvas.current;
    const shell = node?.closest<HTMLElement>(".history-shell");
    if (!node || !shell) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0,
      width = 0,
      height = 0,
      time = 0,
      last = 0;
    let x = 0.75,
      y = 0.28,
      targetX = x,
      targetY = y;
    const stopped = () => paused || preference.matches || document.hidden;
    const paint = (now: number) => {
      raf = 0;
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      if (!stopped()) time += dt;
      x += (targetX - x) * 0.045;
      y += (targetY - y) * 0.045;
      ctx.clearRect(0, 0, width, height);
      const cx = width * (0.77 + (x - 0.5) * 0.045),
        cy = height * (0.3 + (y - 0.5) * 0.05);
      const radius = Math.min(width * 0.28, height * 0.42);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5);
      glow.addColorStop(0, "#a9ce681c");
      glow.addColorStop(1, "#a9ce6800");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      // Three inclined particle orbits echo the sculpture in How it works.
      for (let lane = 0; lane < 3; lane++) {
        const tilt = lane * 1.047 + time * 0.035;
        const cos = Math.cos(tilt),
          sin = Math.sin(tilt);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.strokeStyle = "rgba(194,219,154,.10)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 100; i++) {
          const a = (i / 100) * Math.PI * 2 + time * (0.12 + lane * 0.025);
          const px = Math.cos(a) * radius,
            py = Math.sin(a) * radius * 0.38;
          const depth = (Math.sin(a) + 1) / 2;
          const sx = cx + px * cos - py * sin,
            sy = cy + px * sin + py * cos;
          ctx.fillStyle = `rgba(194,219,154,${0.08 + depth * 0.3})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.6 + depth * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (let i = 0; i < 26; i++) {
        const sx = ((i * 0.6180339 + time * 0.006) % 1) * width;
        const sy =
          ((((i * 0.381966 + Math.sin(i) * 0.03) % 1) + 1) % 1) * height;
        ctx.strokeStyle = `rgba(178,206,140,${0.035 + (i % 4) * 0.012})`;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 30 + (i % 5) * 25, sy);
        ctx.stroke();
      }
      if (!stopped()) raf = requestAnimationFrame(paint);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      shell.dataset.motionPaused = String(paused || preference.matches);
      paint(performance.now());
    };
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio, 1.25);
      node.width = width * dpr;
      node.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      start();
    };
    const pointer = (e: PointerEvent) => {
      targetX = e.clientX / width;
      targetY = e.clientY / height;
    };
    const seen = new WeakSet<Element>();
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            reveal.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    const observe = () =>
      shell
        .querySelectorAll(
          ".dashboard-heading,.dashboard-toolbar,.dashboard-empty,.metrics-ledger,.dashboard-charts article,.history-heading,.history-table tbody tr,.history-detail",
        )
        .forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          el.setAttribute("data-reveal", "");
          reveal.observe(el);
        });
    const mutations = new MutationObserver(observe);
    mutations.observe(shell, { childList: true, subtree: true });
    observe();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointer, { passive: true });
    document.addEventListener("visibilitychange", start);
    preference.addEventListener("change", start);
    resize();
    return () => {
      cancelAnimationFrame(raf);
      reveal.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointer);
      document.removeEventListener("visibilitychange", start);
      preference.removeEventListener("change", start);
    };
  }, [paused]);
  return (
    <>
      <canvas ref={canvas} className="archive-atmosphere" aria-hidden="true" />
      <button
        className="archive-motion"
        aria-pressed={paused}
        onClick={() => setPaused((v) => !v)}
        aria-label={
          paused
            ? "Retomar animações do histórico"
            : "Pausar animações do histórico"
        }
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
        <span>{paused ? "Retomar movimento" : "Pausar movimento"}</span>
      </button>
    </>
  );
}
