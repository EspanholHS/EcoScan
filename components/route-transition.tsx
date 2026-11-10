"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./route-transition.css";

export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const shade = useRef<HTMLDivElement>(null);
  const destination = useRef("");
  const finish = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    if (pathname === destination.current) finish.current?.();
  }, [pathname]);
  useEffect(() => {
    let busy = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const release = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      shade.current?.setAttribute("data-visible", "false");
      document.documentElement.removeAttribute("data-route-departing");
      document.dispatchEvent(
        new CustomEvent("ecoscan:route-particles", { detail: false }),
      );
      finish.current = null;
      busy = false;
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (
        url.origin !== location.origin ||
        !["/", "/dashboard"].includes(url.pathname) ||
        url.pathname === location.pathname ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      event.preventDefault();
      if (busy) return;
      busy = true;
      destination.current = url.pathname;
      router.prefetch(url.pathname);
      document.documentElement.setAttribute("data-route-departing", "true");
      document.dispatchEvent(
        new CustomEvent("ecoscan:route-particles", { detail: true }),
      );
      // First the sculpture disperses, then a short dark fade covers the route swap.
      timers.push(
        setTimeout(
          () => shade.current?.setAttribute("data-visible", "true"),
          520,
        ),
      );
      finish.current = () => {
        timers.push(setTimeout(release, 100));
      };
      timers.push(
        setTimeout(
          () => router.push(url.pathname + url.search + url.hash),
          820,
        ),
      );
      timers.push(setTimeout(release, 8000));
    };
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("click", click, true);
      release();
    };
  }, [router]);
  return (
    <div
      ref={shade}
      className="route-shade"
      data-visible="false"
      aria-hidden="true"
    />
  );
}
