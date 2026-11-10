import * as THREE from "three";
import { createAtmosphere } from "./atmosphere";
import { createParticleSculpture } from "./particle-sculpture";
import { spatialFrame } from "./spatial-timeline";

export type MaterialKind = "plastic" | "metal" | "paper";
export type HeroMotion = {
  x: number;
  y: number;
  scroll: number;
  material: MaterialKind;
  focused: boolean;
  pointerActive: boolean;
};
export type SceneController = {
  setPaused(value: boolean): void;
  refresh(): void;
  dispose(): void;
};

export function mountMaterialScene(
  host: HTMLElement,
  motion: HeroMotion,
  onReady: () => void,
  onError: () => void,
): SceneController {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.transmissionResolutionScale = 0.5;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor("#090e0c");
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.z = 10.8;
  const atmosphere = createAtmosphere();
  scene.add(atmosphere.mesh);
  const sculpture = createParticleSculpture(renderer);
  const world = new THREE.Group();
  world.add(sculpture.group);
  scene.add(world);
  const ray = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointerLocal = new THREE.Vector3(20, 20, 0);

  let disposed = false,
    lost = false,
    paused = false,
    visible = true,
    raf = 0;
  let last = 0,
    time = 0,
    smoothX = 0,
    smoothY = 0,
    width = 1,
    height = 1,
    first = true;
  let departureStart: number | null = null;
  function draw(now: number) {
    if (disposed || lost) return;
    const delta = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    if (!paused) {
      time += delta;
      const ease = 1 - Math.exp(-delta * 4);
      smoothX += (motion.x - smoothX) * ease;
      smoothY += (motion.y - smoothY) * ease;
    }
    const viewHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10.8;
    const pose = spatialFrame(motion.scroll);
    camera.position.z = pose.cameraZ;
    const viewWidth = viewHeight * camera.aspect;
    world.position.set(
      viewWidth * pose.subjectX + smoothX * 0.04,
      -viewHeight * 0.035,
      pose.subjectZ,
    );
    world.scale.setScalar(((viewHeight * 0.24) / 1.91) * pose.subjectScale);
    sculpture.pose(time);
    const departure =
      departureStart === null
        ? 0
        : THREE.MathUtils.smoothstep((now - departureStart) / 700, 0, 1);
    sculpture.group.rotation.z += departure * 0.55;
    camera.updateMatrixWorld();
    world.updateMatrixWorld(true);
    pointerNdc.set(motion.x, -motion.y);
    ray.setFromCamera(pointerNdc, camera);
    interactionPlane.constant = -world.position.z;
    if (
      motion.pointerActive &&
      ray.ray.intersectPlane(interactionPlane, pointerLocal)
    ) {
      sculpture.group.worldToLocal(pointerLocal);
    } else pointerLocal.set(20, 20, 0);
    sculpture.update(
      time,
      motion.scroll,
      delta,
      pointerLocal,
      motion.pointerActive,
      height * renderer.getPixelRatio(),
      paused,
      motion.material,
      departure,
    );
    atmosphere.update(time, motion.scroll, smoothX, smoothY, width, height);
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onReady();
    }
  }
  function tick(now: number) {
    raf = 0;
    if (disposed || lost || paused || !visible || document.hidden) return;
    draw(now);
    raf = requestAnimationFrame(tick);
  }
  function start() {
    if (!raf && !disposed && !lost && !paused && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height || disposed || lost) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw(performance.now());
  }
  const sizes = new ResizeObserver(resize);
  sizes.observe(host);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  observer.observe(host);
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    onError();
  }
  document.addEventListener("visibilitychange", visibility);
  const routeParticles = (event: Event) => {
    departureStart = (event as CustomEvent<boolean>).detail
      ? performance.now()
      : null;
  };
  document.addEventListener("ecoscan:route-particles", routeParticles);
  canvas.addEventListener("webglcontextlost", contextLost);
  resize();
  start();
  return {
    refresh() {
      if (!disposed && !lost && visible && !document.hidden)
        draw(performance.now());
    },
    setPaused(value) {
      paused = value;
      cancelAnimationFrame(raf);
      raf = 0;
      if (paused) draw(performance.now());
      else start();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      sizes.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("ecoscan:route-particles", routeParticles);
      canvas.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          for (const mat of Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]) {
            materials.add(mat);
            for (const value of Object.values(mat))
              if (value instanceof THREE.Texture) textures.add(value);
          }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      sculpture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
