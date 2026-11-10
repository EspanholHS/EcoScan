import * as THREE from "three";

const smooth = (a: number, b: number, n: number) => {
  const t = THREE.MathUtils.clamp((n - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Shape-preserving cubic interpolation keeps the PET shoulder free of hard seams. */
function radiusAt(y: number) {
  const profile = [
    [-1.87, 0.075],
    [-1.84, 0.34],
    [-1.77, 0.53],
    [-1.65, 0.602],
    [-1.48, 0.625],
    [-1.25, 0.618],
    [-0.85, 0.615],
    [0.4, 0.615],
    [0.62, 0.604],
    [0.8, 0.565],
    [0.99, 0.485],
    [1.16, 0.375],
    [1.31, 0.268],
    [1.41, 0.229],
    [1.67, 0.229],
    [1.71, 0.232],
  ];
  let i = 0;
  while (i < profile.length - 2 && y > profile[i + 1][0]) i++;
  const [a, ra] = profile[i],
    [b, rb] = profile[i + 1];
  const before = profile[Math.max(0, i - 1)],
    after = profile[Math.min(profile.length - 1, i + 2)];
  let ma = (rb - before[1]) / (b - before[0]);
  let mb = (after[1] - ra) / (after[0] - a);
  const slope = (rb - ra) / (b - a);
  if (slope === 0) ma = mb = 0;
  else {
    ma =
      Math.sign(ma) === Math.sign(slope)
        ? Math.sign(slope) * Math.min(Math.abs(ma), Math.abs(slope) * 2)
        : 0;
    mb =
      Math.sign(mb) === Math.sign(slope)
        ? Math.sign(slope) * Math.min(Math.abs(mb), Math.abs(slope) * 2)
        : 0;
  }
  const t = THREE.MathUtils.clamp((y - a) / (b - a), 0, 1);
  let r =
    (2 * t * t * t - 3 * t * t + 1) * ra +
    (t * t * t - 2 * t * t + t) * (b - a) * ma +
    (-2 * t * t * t + 3 * t * t) * rb +
    (t * t * t - t * t) * (b - a) * mb;
  // Shallow structural rings, moulded into the shell rather than added as toruses.
  for (const center of [-1.34, -1.18, -0.99, 0.68]) {
    r += 0.012 * Math.exp(-Math.pow((y - center) / 0.024, 2));
    r -= 0.005 * Math.exp(-Math.pow((y - center - 0.045) / 0.018, 2));
  }
  return r;
}

function shellGeometry() {
  const around = 112,
    rows = 180;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows,
      y = THREE.MathUtils.lerp(-1.87, 1.71, v);
    const baseRadius = radiusAt(y);
    for (let col = 0; col <= around; col++) {
      const u = col / around,
        a = u * Math.PI * 2;
      const petal = 1 - smooth(-1.8, -1.46, y);
      const r =
        baseRadius + 0.037 * Math.cos(a * 5) * petal * smooth(-1.87, -1.78, y);
      const foot = 0.035 * (1 - Math.cos(a * 5)) * petal;
      positions.push(Math.sin(a) * r, y + foot, Math.cos(a) * r);
      uvs.push(u, v);
      if (row < rows && col < around) {
        const i = row * (around + 1) + col,
          j = i + around + 1;
        indices.push(i, i + 1, j, i + 1, j + 1, j);
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

function surfaceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const pixels = ctx.createImageData(512, 512);
    let seed = 1229;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const value = 126 + (seed % 5);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    // Small moulded resin-code cartouche in the lower body bump surface.
    ctx.strokeStyle = "#aeaeae";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(254, 80);
    ctx.lineTo(240, 105);
    ctx.lineTo(269, 105);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "#aeaeae";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("1", 255, 102);
    ctx.font = "7px Arial";
    ctx.fillText("PET", 255, 116);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return map;
}

function labelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#d8d7bc";
    ctx.fillRect(0, 0, 2048, 512);
    ctx.fillStyle = "#142b20";
    ctx.textAlign = "center";
    ctx.font = "600 140px Arial";
    ctx.fillText("ecoscan", 1024, 217);
    ctx.font = "25px Arial";
    ctx.fillText(
      "M A T É R I A   P A R A   U M   N O V O   C I C L O",
      1024,
      271,
    );
    ctx.strokeStyle = "#66775a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(795, 308);
    ctx.lineTo(1253, 308);
    ctx.stroke();
    ctx.font = "17px Arial";
    ctx.fillText("01   /   PET", 1024, 361);
    // A restrained circular-cycle emblem, printed rather than floating above the object.
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1024, 91, 18, -0.4, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1037, 72);
    ctx.lineTo(1043, 88);
    ctx.lineTo(1027, 84);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.font = "22px Arial";
    ctx.fillText("UM FIM É SÓ OUTRO COMEÇO.", 170, 200);
    ctx.font = "15px Arial";
    ctx.fillText("ESTUDO DE MATERIAL / ECOSCAN", 170, 240);
    for (let i = 0; i < 44; i++)
      ctx.fillRect(1610 + i * 4, 180, i % 4 === 0 ? 2 : 1, 87);
    ctx.font = "13px Arial";
    ctx.fillText("0 1   2 0 2 6   0 0 1", 1610, 293);
    ctx.strokeStyle = "#8c9876";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(1450, 490, 150 + i * 15, 220, -0.7, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

class Thread extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number) {
    const a = t * Math.PI * 5.2;
    return new THREE.Vector3(
      Math.sin(a) * 0.237,
      1.6 + t * 0.09,
      Math.cos(a) * 0.237,
    );
  }
}

export function createBottleSculpture() {
  const group = new THREE.Group();
  const resin = new THREE.MeshPhysicalMaterial({
    color: "#d4e5d6",
    metalness: 0,
    roughness: 0.075,
    transmission: 0.97,
    thickness: 0.055,
    ior: 1.46,
    attenuationColor: "#8cb39a",
    attenuationDistance: 3.2,
    clearcoat: 0.35,
    clearcoatRoughness: 0.13,
    envMapIntensity: 0.72,
    bumpMap: surfaceTexture(),
    bumpScale: 0.0016,
  });
  group.add(new THREE.Mesh(shellGeometry(), resin));
  const neckMaterial = new THREE.MeshPhysicalMaterial({
    color: "#7c9e83",
    metalness: 0.03,
    roughness: 0.2,
    clearcoat: 1,
    envMapIntensity: 0.55,
  });
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.232, 0.013, 8, 96),
    neckMaterial,
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.705;
  group.add(lip);
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new Thread(), 140, 0.009, 6, false),
      neckMaterial,
    ),
  );
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.249, 0.019, 8, 96),
    neckMaterial,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.43;
  group.add(collar);

  const cap = new THREE.Group();
  cap.position.y = 1.79;
  const capProfile = [
    [0.001, -0.155],
    [0.242, -0.155],
    [0.267, -0.144],
    [0.275, -0.115],
    [0.275, 0.115],
    [0.265, 0.146],
    [0.24, 0.157],
    [0.001, 0.157],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const capGeometry = new THREE.LatheGeometry(capProfile, 192);
  const p = capGeometry.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i),
      y = p.getY(i);
    const a = Math.atan2(z, x),
      radius = Math.hypot(x, z);
    const grip =
      radius > 0.265
        ? 1 + 0.008 * Math.cos(a * 96) * (1 - smooth(0.1, 0.145, Math.abs(y)))
        : 1;
    p.setXYZ(i, x * grip, y, z * grip);
  }
  capGeometry.computeVertexNormals();
  const capMaterial = new THREE.MeshPhysicalMaterial({
    color: "#354f39",
    roughness: 0.36,
    metalness: 0.03,
    clearcoat: 0.3,
    clearcoatRoughness: 0.38,
  });
  cap.add(new THREE.Mesh(capGeometry, capMaterial));
  const capTop = new THREE.Mesh(
    new THREE.TorusGeometry(0.202, 0.0035, 6, 80),
    capMaterial,
  );
  capTop.rotation.x = Math.PI / 2;
  capTop.position.y = 0.157;
  cap.add(capTop);
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.266, 0.266, 0.057, 128, 1, true),
    capMaterial,
  );
  seal.position.y = 1.595;
  group.add(seal);
  // Fine mould parting line, visible only in a grazing highlight.
  const sealRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.267, 0.003, 6, 96),
    capMaterial,
  );
  sealRim.rotation.x = Math.PI / 2;
  sealRim.position.y = 1.578;
  group.add(sealRim);
  group.add(cap);

  const labelMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture(),
    color: "#f1eedb",
    roughness: 0.64,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.621, 0.621, 0.66, 128, 1, true),
    labelMaterial,
  );
  // The image's central panel faces +Z, keeping the primary label readable.
  label.rotation.y = Math.PI;
  label.position.y = -0.14;
  group.add(label);

  return {
    group,
    update(
      time: number,
      progress: number,
      x: number,
      y: number,
      paused = false,
    ) {
      void paused; // The caller freezes ambient time and smoothed cursor on pause.
      const reveal =
        smooth(0.19, 0.34, progress) * (1 - smooth(0.42, 0.53, progress));
      group.rotation.set(
        0.045 + y * 0.035,
        -0.1 + Math.sin(time * 0.16) * 0.055 + x * 0.1 + progress * 0.28,
        -0.14 + Math.sin(time * 0.21) * 0.025 + reveal * 0.065,
      );
      group.position.y = Math.sin(time * 0.42) * 0.025;
      cap.position.set(reveal * 0.12, 1.79 + reveal * 0.23, 0);
      cap.rotation.y = reveal * 0.7;
    },
  };
}
