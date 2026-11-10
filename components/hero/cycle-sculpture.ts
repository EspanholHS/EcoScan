import * as THREE from "three";

type MaterialKind = "plastic" | "metal" | "paper";

/** A closed, softly bevelled ribbon: a continuous material becoming a new cycle. */
function ribbonPoint(t: number, v: number, inset = 0) {
  const angle = t * Math.PI * 2;
  const radial = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
  const radius = 1.43 + 0.11 * Math.sin(angle * 3 + 0.5);
  const twist = angle * 2 + 0.45;
  // The superellipse gives broad softbox reflections with gently rounded edges.
  const cos = Math.cos(v),
    sin = Math.sin(v);
  const a = Math.sign(cos) * Math.pow(Math.abs(cos), 0.58) * (0.47 - inset);
  const b =
    Math.sign(sin) * Math.pow(Math.abs(sin), 0.58) * (0.205 - inset * 0.4);
  const u = a * Math.cos(twist) - b * Math.sin(twist);
  const z = a * Math.sin(twist) + b * Math.cos(twist);
  return radial
    .multiplyScalar(radius + u)
    .add(
      new THREE.Vector3(
        0.045 * Math.cos(angle * 2),
        0.065 * Math.sin(angle * 2),
        z + 0.1 * Math.sin(angle * 3),
      ),
    );
}

function ribbonGeometry() {
  const around = 320,
    cross = 48;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= around; i++) {
    for (let j = 0; j <= cross; j++) {
      const point = ribbonPoint(i / around, (j / cross) * Math.PI * 2);
      positions.push(point.x, point.y, point.z);
      uvs.push(i / around, j / cross);
      if (i < around && j < cross) {
        const a = i * (cross + 1) + j,
          b = a + cross + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

class EdgeCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly phi: number,
    private readonly begin = 0,
    private readonly length = 1,
  ) {
    super();
  }
  getPoint(t: number) {
    return ribbonPoint(this.begin + t * this.length, this.phi);
  }
}

export function createCycleSculpture() {
  const group = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({
    color: "#a5b3a7",
    metalness: 1,
    roughness: 0.19,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    anisotropy: 0.35,
    envMapIntensity: 1.75,
  });
  const body = new THREE.Mesh(ribbonGeometry(), skin);
  group.add(body);

  const edge = new THREE.MeshPhysicalMaterial({
    color: "#dde5d4",
    metalness: 1,
    roughness: 0.17,
    envMapIntensity: 1.8,
  });
  for (const phi of [0.1, Math.PI + 0.1]) {
    const seam = new THREE.Mesh(
      new THREE.TubeGeometry(new EdgeCurve(phi), 320, 0.009, 6, true),
      edge,
    );
    group.add(seam);
  }
  const inlay = new THREE.MeshPhysicalMaterial({
    color: "#d8ef92",
    metalness: 0.35,
    roughness: 0.3,
    emissive: "#a4bb58",
    emissiveIntensity: 0.13,
    clearcoat: 1,
  });
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(
        new EdgeCurve(Math.PI * 1.7, 0.22, 0.34),
        110,
        0.018,
        8,
        false,
      ),
      inlay,
    ),
  );

  const palettes = {
    plastic: {
      color: new THREE.Color("#4f876a"),
      roughness: 0.16,
      metalness: 0.08,
      clearcoat: 1,
    },
    metal: {
      color: new THREE.Color("#a5b3a7"),
      roughness: 0.19,
      metalness: 1,
      clearcoat: 0.4,
    },
    paper: {
      color: new THREE.Color("#c5bca6"),
      roughness: 0.8,
      metalness: 0,
      clearcoat: 0,
    },
  };
  let previous = 0;
  let previousMaterial: MaterialKind = "metal";
  return {
    group,
    update(
      time: number,
      progress: number,
      x: number,
      y: number,
      material: MaterialKind,
      paused = false,
    ) {
      const dt = Math.max(0, time - previous);
      previous = time;
      const palette = palettes[material];
      const response = paused
        ? material === previousMaterial
          ? 0
          : 1
        : 1 - Math.exp(-Math.max(dt, 1 / 120) * 3.5);
      previousMaterial = material;
      skin.color.lerp(palette.color, response);
      skin.roughness = THREE.MathUtils.lerp(
        skin.roughness,
        palette.roughness,
        response,
      );
      skin.metalness = THREE.MathUtils.lerp(
        skin.metalness,
        palette.metalness,
        response,
      );
      skin.clearcoat = THREE.MathUtils.lerp(
        skin.clearcoat,
        palette.clearcoat,
        response,
      );
      group.rotation.set(
        0.12 +
          Math.sin(time * 0.16) * 0.09 +
          y * 0.08 +
          Math.sin(progress * Math.PI) * 0.2,
        -0.3 +
          Math.sin(time * 0.12) * 0.12 +
          x * 0.12 +
          progress * Math.PI * 1.25,
        -0.24 + Math.sin(time * 0.09) * 0.06 + progress * 0.8,
      );
      group.position.y = Math.sin(time * 0.45) * 0.035;
    },
  };
}
