import Experience from "./Experience";
import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vRd;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;

  // Ray direction in world space (from camera to this fragment)
  vRd = vWorldPosition - cameraPosition;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uBrightness;
uniform float uDecay;
uniform float uSpeed;
uniform float uScale;
uniform float uOffset;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform float uHfade;

varying vec3 vWorldPosition;
varying vec3 vRd;

#define time uTime

#ifndef AURORA_STEPS
#define AURORA_STEPS 32
#endif

#ifndef AURORA_OCTAVES
#define AURORA_OCTAVES 3
#endif

mat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}
mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);
float tri(in float x){return clamp(abs(fract(x)-.5),0.01,0.49);}
vec2 tri2(in vec2 p){return vec2(tri(p.x)+tri(p.y),tri(p.y+tri(p.x)));}

float triNoise2d(in vec2 p, mat2 rot)
{
  float z=1.8;
  float z2=2.5;
  float rz = 0.;
  p *= mm2(p.x*0.06);
  vec2 bp = p;
  for (int i=0; i<AURORA_OCTAVES; i++ )
  {
    vec2 dg = tri2(bp*1.85)*.75;
    dg *= rot;
    p -= dg/z2;

    bp *= 1.3;
    z2 *= .45;
    z *= .42;
    p *= 1.21 + (rz-1.0)*.02;

    rz += tri(p.x+tri(p.y))*z;
    p*= -m2;
  }
  return clamp(1./pow(rz*29., 1.3),0.,.55);
}

float hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

vec4 aurora(vec3 ro, vec3 rd)
{
  vec4 col = vec4(0);
  vec4 avgCol = vec4(0);
  mat2 rot = mm2(uTime * uSpeed);

  float dcy = exp2(-2.5);
  float dcyStep = exp2(-uDecay);

  for(int i=0;i<AURORA_STEPS;i++)
  {
    float fi = float(i);
    float of = 0.006*hash21(gl_FragCoord.xy)*smoothstep(0.,15., fi);
    float i14 = fi * sqrt(fi) * 0.65;
    float pt = ((.8 + i14 * 0.002) - ro.y) / (rd.y * 2. + 0.4);
    pt -= of;
    vec3 bpos = ro + pt*rd;
    vec2 p = bpos.zx;
    float rzt = triNoise2d(p * uScale, rot);
    vec4 col2 = vec4(0,0,0, rzt);

    // Gradient color mapping
    float t = fi / max(1.0, float(AURORA_STEPS - 1));
    vec3 c = mix(uColor1, uColor2, smoothstep(0.0, 0.4, t));
    c = mix(c, uColor3, smoothstep(0.4, 0.8, t));
    c = mix(c, uColor4, smoothstep(0.8, 1.0, t));

    col2.rgb = c * rzt;

    avgCol =  mix(avgCol, col2, .5);
    col += avgCol*dcy*smoothstep(0.,5., fi);
    dcy *= dcyStep;

    // Early-out when contribution becomes negligible.
    if (dcy < 1e-4) {
      break;
    }
  }

  col *= smoothstep(0.0, uHfade, rd.y);

  return col * uBrightness;
}

void main() {
  vec3 rd = normalize(vRd);

  // Pattern space origin. Keep it stable so the aurora behaves like skybox.
  vec3 ro = vec3(0.0, 0.0, uOffset);

  // Sky Gradient
  vec3 bg = mix(uSkyBottom, uSkyTop, smoothstep(0.0, 1.0, rd.y + .2));

  vec4 aur = vec4(0.0);
  if (rd.y > 0.0) {
    aur = aurora(ro, rd);
  }

  float alpha = clamp(aur.a, 0.0, 1.0);
  vec3 auroraColor = aur.rgb * alpha;

  // Additive blending with sky
  vec3 col = bg + auroraColor;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

type AuroraParams = {
  quality: AuroraQuality;
  brightness: number;
  decay: number;
  speed: number;
  scale: number;
  offset: number;
  hfade: number;
  skyTop: string;
  skyBottom: string;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
};

type AuroraQuality = "low" | "medium" | "high";

type QualitySettings = {
  steps: number;
  octaves: number;
  segments: { width: number; height: number };
};

const QUALITY_SETTINGS: Record<AuroraQuality, QualitySettings> = {
  low: { steps: 20, octaves: 2, segments: { width: 32, height: 16 } },
  medium: { steps: 32, octaves: 3, segments: { width: 48, height: 24 } },
  high: { steps: 60, octaves: 4, segments: { width: 64, height: 32 } },
};

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  resource: Experience["resource"];

  private skyMesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private uniforms: Record<string, THREE.Uniform>;
  private params: AuroraParams;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.params = {
      quality: "medium",
      brightness: 3.0,
      decay: 0.1,
      speed: 0.25,
      scale: 1.0,
      offset: 0.0,
      hfade: 0.45,
      skyTop: "#0b1a3a",
      skyBottom: "#02030a",
      color1: "#2affff",
      color2: "#00ff77",
      color3: "#7b00ff",
      color4: "#ff4bd6",
    };

    this.uniforms = this.createUniforms(this.params);

    const quality = QUALITY_SETTINGS[this.params.quality];
    const geometry = new THREE.SphereGeometry(
      50,
      quality.segments.width,
      quality.segments.height
    );
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      defines: {
        AURORA_STEPS: quality.steps,
        AURORA_OCTAVES: quality.octaves,
      },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      toneMapped: true,
    });

    this.skyMesh = new THREE.Mesh(geometry, material);
    this.skyMesh.frustumCulled = false;
    this.skyMesh.renderOrder = -1;
    this.scene.add(this.skyMesh);

    this.setupGui();
  }

  private createUniforms(params: AuroraParams): Record<string, THREE.Uniform> {
    return {
      uTime: new THREE.Uniform(0),
      uBrightness: new THREE.Uniform(params.brightness),
      uDecay: new THREE.Uniform(params.decay),
      uSpeed: new THREE.Uniform(params.speed),
      uScale: new THREE.Uniform(params.scale),
      uOffset: new THREE.Uniform(params.offset),
      uHfade: new THREE.Uniform(params.hfade),
      uSkyTop: new THREE.Uniform(new THREE.Color(params.skyTop)),
      uSkyBottom: new THREE.Uniform(new THREE.Color(params.skyBottom)),
      uColor1: new THREE.Uniform(new THREE.Color(params.color1)),
      uColor2: new THREE.Uniform(new THREE.Color(params.color2)),
      uColor3: new THREE.Uniform(new THREE.Color(params.color3)),
      uColor4: new THREE.Uniform(new THREE.Color(params.color4)),
    };
  }

  private setupGui() {
    const f = this.gui.addFolder("Aurora");
    f.add(this.params, "quality", ["low", "medium", "high"]).onChange(
      (v: AuroraQuality) => {
        this.applyQuality(v);
      }
    );
    f.add(this.params, "brightness", 0, 10, 0.01).onChange((v: number) => {
      this.uniforms.uBrightness.value = v;
    });
    f.add(this.params, "decay", 0, 0.4, 0.001).onChange((v: number) => {
      this.uniforms.uDecay.value = v;
    });
    f.add(this.params, "speed", 0, 2, 0.001).onChange((v: number) => {
      this.uniforms.uSpeed.value = v;
    });
    f.add(this.params, "scale", 0.1, 5, 0.01).onChange((v: number) => {
      this.uniforms.uScale.value = v;
    });
    f.add(this.params, "offset", -10, 10, 0.01).onChange((v: number) => {
      this.uniforms.uOffset.value = v;
    });
    f.add(this.params, "hfade", 0, 1, 0.001).onChange((v: number) => {
      this.uniforms.uHfade.value = v;
    });

    const setColor = (key: string, value: string) => {
      (this.uniforms[key].value as THREE.Color).set(value);
    };

    f.addColor(this.params, "skyTop").onChange((v: string) => {
      setColor("uSkyTop", v);
    });
    f.addColor(this.params, "skyBottom").onChange((v: string) => {
      setColor("uSkyBottom", v);
    });
    f.addColor(this.params, "color1").onChange((v: string) => {
      setColor("uColor1", v);
    });
    f.addColor(this.params, "color2").onChange((v: string) => {
      setColor("uColor2", v);
    });
    f.addColor(this.params, "color3").onChange((v: string) => {
      setColor("uColor3", v);
    });
    f.addColor(this.params, "color4").onChange((v: string) => {
      setColor("uColor4", v);
    });
  }

  private applyQuality(quality: AuroraQuality) {
    const q = QUALITY_SETTINGS[quality];

    // Update defines (compile-time constants)
    this.skyMesh.material.defines = {
      ...(this.skyMesh.material.defines ?? {}),
      AURORA_STEPS: q.steps,
      AURORA_OCTAVES: q.octaves,
    };
    this.skyMesh.material.needsUpdate = true;

    // Update geometry segments (cheap compared to fragment cost, but helps a bit)
    this.skyMesh.geometry.dispose();
    this.skyMesh.geometry = new THREE.SphereGeometry(
      50,
      q.segments.width,
      q.segments.height
    );
  }

  resize() {}

  update() {
    // Keep the sky centered on the camera so it behaves like a skybox.
    this.skyMesh.position.copy(this.camera.instance.position);

    this.uniforms.uTime.value = this.experience.time.elapsed / 1000;
  }
}
