import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { ease } from "./timeline";

const shapeShader = /* glsl */ `
 uniform vec3 uShape;
 uniform float uBurst;
 uniform float uPassage;
 uniform float uProcess;
 // Three inclined, tubular orbits share the original particles' coordinates.
 vec3 processShape(vec3 h,float seed) {
   float a=(h.y+1.75)/3.5*6.283185;
   float b=atan(h.z,h.x);
   float lane=floor(seed*3.);
   float tilt=(lane-1.)*1.05;
   float r=1.23+.105*cos(b);
   vec3 p=vec3(r*cos(a),r*sin(a),.105*sin(b));
   p.yz=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p.yz;
   float turn=lane*1.0472;
   p.xy=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*p.xy;
   return p;
 }
 vec3 selectedShape(vec3 h,float seed) {
   float a=atan(h.z,h.x), t=(h.y+1.75)/3.5;
   float radius=.78;
   float cy=(t-.5)*2.65;
   if(t<.07 || t>.93) { radius*=sqrt(fract(seed*43.17)); cy=sign(t-.5)*1.325; }
   else radius+=.035*cos(cy*35.)*smoothstep(.95,1.28,abs(cy));
   vec3 can=vec3(cos(a)*radius,cy,sin(a)*radius);
   float px=a/3.14159265*1.05;
   vec3 paper=vec3(px,h.y*.83,.22*sin(px*2.3)+.16*cos(h.y*2.)+.25*pow(abs(px),3.));
   return mix(h*uShape.x+can*uShape.y+paper*uShape.z,processShape(h,seed),uProcess);
 }
`;
const SIZE = 128;
const COUNT = SIZE * SIZE;

/** Own procedural volumes. All particles keep their identity between shapes. */
export function particleVolumes() {
  const bottle = new Float32Array(COUNT * 4);
  const cycle = new Float32Array(COUNT * 4);
  let seed = 7391;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < COUNT; i++) {
    const t = random(),
      a = random() * Math.PI * 2;
    const y = t * 3.5 - 1.75;
    let radius = 0.63;
    if (y > 0.6) radius = THREE.MathUtils.lerp(0.63, 0.235, ease(0.6, 1.3, y));
    if (y > 1.48) radius = 0.27;
    if (y < -1.55) radius *= 1 - 0.12 * ease(-1.55, -1.75, y);
    radius += 0.012 * Math.cos(y * 32) * (1 - ease(-0.7, -0.4, y));
    // A dense outer skin with a lighter interior gives a readable, granular volume.
    const shell = random() < 0.8;
    const radial = shell ? 0.92 + random() * 0.08 : Math.sqrt(random());
    const r = radius * radial;
    bottle.set([Math.cos(a) * r, y, Math.sin(a) * r, random()], i * 4);
    const u = t * Math.PI * 2;
    const v = a;
    const tube = 0.3 * radial;
    const major = 1.22 + 0.09 * Math.cos(u * 3);
    cycle.set(
      [
        (major + tube * Math.cos(v)) * Math.cos(u),
        (major + tube * Math.cos(v)) * Math.sin(u),
        tube * Math.sin(v) + 0.25 * Math.sin(u * 3),
        bottle[i * 4 + 3],
      ],
      i * 4,
    );
  }
  return { bottle, cycle };
}

/** Ping-pong GPU spring simulation; no per-particle JavaScript work in the frame loop. */
export function createParticleSculpture(renderer: THREE.WebGLRenderer) {
  const gpu = new GPUComputationRenderer(SIZE, SIZE, renderer);
  const volumes = particleVolumes();
  const home = new THREE.DataTexture(
    volumes.bottle,
    SIZE,
    SIZE,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  const destination = new THREE.DataTexture(
    volumes.cycle,
    SIZE,
    SIZE,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  home.needsUpdate = destination.needsUpdate = true;
  const initial = gpu.createTexture();
  (initial.image.data as Float32Array).set(volumes.bottle);
  const velocity = gpu.addVariable(
    "textureVelocity",
    /* glsl */ `
    ${shapeShader}
    uniform sampler2D uHome;
    uniform sampler2D uDestination;
    uniform float uMorph;
    uniform float uDt;
    uniform float uTime;
    uniform float uDeparture;
    uniform vec3 uPointer;
    uniform vec3 uImpulse;
    uniform float uActive;
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 state = texture2D(texturePosition, uv);
      vec3 p = state.xyz;
      vec3 v = texture2D(textureVelocity, uv).xyz;
      vec3 rest = mix(selectedShape(texture2D(uHome, uv).xyz,state.w), texture2D(uDestination, uv).xyz, uMorph);
      float seed = state.w * 6.283185;
      vec3 flow=vec3(sin(uTime*2.7+rest.y*3.+seed),cos(uTime*2.3+rest.x*4.+seed),sin(uTime*2.9+rest.y*2.+seed));
      rest+=flow*.055;
      vec3 plume=vec3(cos(seed*3.),sin(seed*2.),sin(seed*5.));
      rest+=plume*(uBurst*.6+uPassage*1.25);
      rest.xy+=uPassage*vec2(-rest.y,rest.x)*.55;
      float turn=uDeparture*1.4;
      rest.xz=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*rest.xz;
      rest+=plume*uDeparture*2.3;
      vec3 d = p - uPointer;
      float distanceToCursor = length(d.xy);
      float field = exp(-dot(d.xy,d.xy) / .40) * uActive;
      // Color reaches the displaced rim instead of disappearing into the empty center.
      float chroma = exp(-dot(d.xy,d.xy) / 1.15) * uActive;
      float wake = texture2D(textureVelocity,uv).w;
      vec3 radial = vec3(d.xy / max(distanceToCursor,.06), .45 + .25*sin(seed));
      vec3 swirl = vec3(-radial.y,radial.x,sin(seed)) * .65;
      vec3 force = (rest-p)*15.0 + (radial+swirl)*field*28.0 + uImpulse*field*7.0 + flow*(.45+wake*1.6);
      v = (v + force*uDt) * exp(-4.6*uDt);
      v *= min(1., 5.0/max(length(v),.0001));
      gl_FragColor = vec4(v, mix(wake,chroma,1.-exp(-uDt*(chroma>wake?9.:2.))));
    }
  `,
    gpu.createTexture(),
  );
  const position = gpu.addVariable(
    "texturePosition",
    /* glsl */ `
    uniform float uDt;
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 p = texture2D(texturePosition, uv);
      vec3 v = texture2D(textureVelocity, uv).xyz;
      gl_FragColor = vec4(p.xyz + v*uDt, p.w);
    }
  `,
    initial,
  );
  gpu.setVariableDependencies(velocity, [position, velocity]);
  gpu.setVariableDependencies(position, [position, velocity]);
  const pointer = new THREE.Vector3(20, 20, 0);
  const impulse = new THREE.Vector3();
  Object.assign(velocity.material.uniforms, {
    uShape: { value: new THREE.Vector3(1, 0, 0) },
    uBurst: { value: 0 },
    uPassage: { value: 0 },
    uProcess: { value: 0 },
    uHome: { value: home },
    uDestination: { value: destination },
    uMorph: { value: 0 },
    uDt: { value: 0 },
    uTime: { value: 0 },
    uDeparture: { value: 0 },
    uPointer: { value: pointer },
    uImpulse: { value: impulse },
    uActive: { value: 0 },
  });
  position.material.uniforms.uDt = { value: 0 };
  const error = gpu.init();
  if (error) {
    gpu.dispose();
    home.dispose();
    destination.dispose();
    throw new Error(error);
  }
  const lookups = new Float32Array(COUNT * 2);
  for (let i = 0; i < COUNT; i++) {
    lookups[i * 2] = ((i % SIZE) + 0.5) / SIZE;
    lookups[i * 2 + 1] = (Math.floor(i / SIZE) + 0.5) / SIZE;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3),
  );
  geometry.setAttribute("aLookup", new THREE.BufferAttribute(lookups, 2));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPosition: { value: gpu.getCurrentRenderTarget(position).texture },
      uVelocity: { value: gpu.getCurrentRenderTarget(velocity).texture },
      uPixels: { value: 1080 },
      uShape: { value: new THREE.Vector3(1, 0, 0) },
      uBurst: { value: 0 },
      uPassage: { value: 0 },
      uProcess: { value: 0 },
      uHome: { value: home },
      uDestination: { value: destination },
      uMorph: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec2 aLookup;
      uniform sampler2D uPosition;
      uniform sampler2D uVelocity;
      uniform float uPixels;
      ${shapeShader}
    uniform sampler2D uHome;
      uniform sampler2D uDestination;
      uniform float uMorph;
      varying float vSeed;
      varying float vEnergy;
      varying float vDepth;
      varying float vLight;
      void main() {
        vec4 state = texture2D(uPosition,aLookup);
        vec4 mv = modelViewMatrix * vec4(state.xyz,1.);
        vSeed = state.w;
        vEnergy = clamp(texture2D(uVelocity,aLookup).w,0.,1.);
        vDepth = state.z;
        vec3 h = selectedShape(texture2D(uHome,aLookup).xyz,state.w);
        vec3 c = texture2D(uDestination,aLookup).xyz;
        vec3 normalA = normalize(mix(vec3(h.x, smoothstep(.5,1.3,h.y)*.4, h.z),vec3(-.3*cos(h.x*2.3),.2*sin(h.y*2.),1.),uShape.z));
        normalA = normalize(mix(normalA,normalize(h+vec3(0.,0.,.5)),uProcess));
        vec3 normalB = normalize(c - normalize(vec3(c.xy,0.))*1.22);
        vec3 surfaceNormal = normalize(mat3(modelMatrix)*mix(normalA,normalB,uMorph));
        vLight = .14 + .86*pow(max(dot(surfaceNormal,normalize(vec3(-.8,.5,1.))),0.),1.5);
        float scale = length(modelMatrix[0].xyz);
        gl_PointSize = clamp((.010 + state.w*.008)*scale*uPixels*projectionMatrix[1][1]/-mv.z,1.,12.);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vSeed;
      varying float vEnergy;
      varying float vDepth;
      varying float vLight;
      void main() {
        vec2 q = gl_PointCoord*2.-1.;
        float d = dot(q,q);
        if(d>1.) discard;
        vec3 n = vec3(q.x,-q.y,sqrt(1.-d));
        vec3 light = normalize(vec3(-.5,.7,1.));
        float diffuse = max(dot(n,light),0.);
        float rim = pow(1.-n.z,3.);
        float spec = pow(max(dot(n,normalize(light+vec3(0,0,1))),0.),35.);
        vec3 base = mix(vec3(.24,.38,.25),vec3(.76,.84,.65),vSeed);
        float depth = .65 + .35*smoothstep(-.6,.65,vDepth);
        vec3 color = base*(.22+diffuse*.78)*depth*vLight + spec*.3*vLight + rim*vec3(.08,.14,.06);
        color = mix(color,vec3(.58,.78,.40),vEnergy*.72);
        gl_FragColor = vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(points);
  const previousPointer = new THREE.Vector3(20, 20, 0);
  let wasActive = false;
  return {
    group,
    pose(time: number) {
      group.rotation.set(
        0.06,
        Math.sin(time * 0.16) * 0.17,
        -0.13 + Math.sin(time * 0.12) * 0.025,
      );
      group.position.y = Math.sin(time * 0.36) * 0.025;
    },
    update(
      time: number,
      progress: number,
      delta: number,
      localPointer: THREE.Vector3,
      active: boolean,
      pixels: number,
      paused: boolean,
      kind: "plastic" | "metal" | "paper",
      departure = 0,
    ) {
      pointer.copy(localPointer);
      if (active && wasActive && delta > 0)
        impulse
          .copy(pointer)
          .sub(previousPointer)
          .divideScalar(delta)
          .clampLength(0, 7);
      else impulse.set(0, 0, 0);
      previousPointer.copy(pointer);
      wasActive = active;
      const uniforms = velocity.material.uniforms;
      uniforms.uDeparture.value = departure;
      const weights = uniforms.uShape.value as THREE.Vector3;
      const tx = kind === "plastic" ? 1 : 0,
        ty = kind === "metal" ? 1 : 0,
        tz = kind === "paper" ? 1 : 0;
      const distance =
        Math.abs(weights.x - tx) +
        Math.abs(weights.y - ty) +
        Math.abs(weights.z - tz);
      const blend = 1 - Math.exp(-delta * 3.4);
      weights.set(
        weights.x + (tx - weights.x) * blend,
        weights.y + (ty - weights.y) * blend,
        weights.z + (tz - weights.z) * blend,
      );
      uniforms.uBurst.value = Math.sin(Math.min(1, distance / 2) * Math.PI);
      uniforms.uPassage.value =
        Math.sin(ease(0.1, 0.32, progress) * Math.PI) ** 2;
      uniforms.uProcess.value = ease(0.13, 0.32, progress);
      material.uniforms.uProcess.value = uniforms.uProcess.value;
      material.uniforms.uShape.value.copy(weights);
      uniforms.uTime.value = time;
      uniforms.uMorph.value = ease(0.45, 0.67, progress);
      uniforms.uActive.value = active ? 1 : 0;
      // Substeps keep springs stable even on a 30 Hz frame or after a short stall.
      if (!paused && delta > 0) {
        const steps = Math.max(1, Math.ceil(delta / (1 / 90)));
        uniforms.uDt.value = delta / steps;
        position.material.uniforms.uDt.value = delta / steps;
        for (let i = 0; i < steps; i++) gpu.compute();
      }
      material.uniforms.uPosition.value =
        gpu.getCurrentRenderTarget(position).texture;
      material.uniforms.uVelocity.value =
        gpu.getCurrentRenderTarget(velocity).texture;
      material.uniforms.uPixels.value = pixels;
      material.uniforms.uMorph.value = uniforms.uMorph.value;
    },
    dispose() {
      gpu.dispose();
      home.dispose();
      destination.dispose();
    },
  };
}
