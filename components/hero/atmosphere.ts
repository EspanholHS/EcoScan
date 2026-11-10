import * as THREE from "three";
import { spatialFrame } from "./spatial-timeline";

/** A single-pass field of travelling light. No textures or secondary render target. */
export function createAtmosphere() {
  const uniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uProgress: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2(1600, 1000) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.999, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uTravel;
      uniform float uProgress;
      uniform vec2 uPointer;
      uniform vec2 uResolution;

      float hash(float p) {
        return fract(sin(p * 127.1 + 311.7) * 43758.5453);
      }

      // One light per irregular lane. Each layer has its own depth and velocity.
      vec3 lightLayer(vec2 uv, float lanes, float speed, float seed, float depth) {
        float lane = floor(uv.y * lanes);
        float id = lane + seed;
        float h = hash(id);
        float y = (lane + .18 + .64 * hash(id + 27.3)) / lanes;
        float travel = uTime * speed * (.6 + h * .8);
        float head = fract(hash(id + 8.1) + travel);
        float distanceToHead = mod(head - uv.x + 1.0, 1.0);
        float length = mix(.025, mix(.145, .21, step(.95, depth)), hash(id + 14.7)) * depth;
        float tail = 1.0 - smoothstep(0.0, length, distanceToHead);
        // Subpixel core with a broad, low-energy glow; no bloom pass required.
        float dy = abs(uv.y - y) * uResolution.y;
        float core = 1.0 - smoothstep(.25, .85 * depth + .3, dy);
        float glow = exp(-dy * 1.05 / depth) * .22;
        float tip = exp(-distanceToHead * 800.0) * exp(-dy * .7);
        vec3 tint = mix(vec3(.82, .91, .78), vec3(.66, .91, .31),
                        step(.61, hash(id + 4.7)));
        float energy = mix(.18, .73, h) * depth;
        return tint * ((core + glow) * tail + tip * .28) * energy;
      }

      void main() {
        vec2 uv = (vUv - .5) / (1. + uTravel * .22) + .5;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (uv - .5) * vec2(aspect, 1.0);
        p -= uPointer * .014;
        float t = uTime * .16;

        // Slow material currents underneath the quicker travelling light.
        float fold = sin(p.x * 2.8 + t) * .19
                   + sin(p.x * 5.1 - t * .62) * .08;
        float ribbon = exp(-pow((p.y + fold + .1) * 4.2, 2.0));
        float counter = exp(-pow((p.y - fold - .15) * 5.5, 2.0));
        float sideLight = smoothstep(.08, .75, abs(p.x));
        float breath = .7 + .3 * sin(t * .7 + p.x * 1.2);
        vec3 color = vec3(.014, .024, .019);
        color += vec3(.021, .072, .033) * ribbon * sideLight * breath;
        color += vec3(.013, .039, .029) * counter * sideLight;

        vec3 lights = lightLayer(uv, 39.0, .038, 11.0, .50)
                    + lightLayer(uv, 27.0, .087, 71.0, .78)
                    + lightLayer(uv, 10.0, .165, 149.0, 1.0);
        // The center remains quieter for the product and typography.
        float sanctuary = exp(-dot(p * vec2(2.1, 2.9), p * vec2(2.1, 2.9)));
        color += lights * (1.0 - sanctuary * .88);

        float progression = .5 + .5 * sin(uProgress * 6.283185 - .7);
        color += vec3(.004, .012, .004) * progression * ribbon;
        float vignette = 1.0 - smoothstep(.3, 1.15, length(p * vec2(.65, 1.0)));
        color *= .65 + vignette * .35;
        float angle = atan(p.y,p.x);
        float rays = pow(max(0.,sin(angle * 28. + sin(angle*3.)*.7)),28.);
        float depthLight = rays * smoothstep(.08,.5,length(p)) * uTravel;
        color += vec3(.055,.12,.057) * depthLight;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "EcoScan / travelling light atmosphere";
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  return {
    mesh,
    update(
      time: number,
      progress: number,
      x: number,
      y: number,
      width: number,
      height: number,
    ) {
      uniforms.uTime.value = time;
      uniforms.uTravel.value = spatialFrame(progress).tunnel;
      uniforms.uProgress.value = progress;
      uniforms.uPointer.value.set(x, y);
      uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height));
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
