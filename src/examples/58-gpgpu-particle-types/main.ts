import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";

const DATA_TEXTURE_SIZE = 100;
const NUM_PARTICLES = DATA_TEXTURE_SIZE * DATA_TEXTURE_SIZE;
const IMG_CANVAS_SIZE = 512;
const POINT_SIZE_BASIS = 15;
const POINTER_RADIUS_BASIS = 160;
const TYPE_POINT_TEXTURE_UNIT = 64;

type FontType = {
  family: string;
  color: THREE.ColorRepresentation;
};

const FONT_TYPES: FontType[] = [
  { family: "serif", color: "#2CE54F" },
  { family: "sans-serif", color: "#2D6DA4" },
  { family: "monospace", color: "#D2CDD1" },
  { family: "cursive", color: "#A1759D" },
  { family: "fantasy", color: "#FC953A" },
  { family: "system-ui", color: "#5864D6" },
];

const COMPUTE_POSITION_SHADER = `
uniform vec2 pointerPos;
uniform float pointerForceRadius;
uniform float pointerActive;
uniform float transitionValue;
uniform sampler2D targetPositionTexture;

const float FRICTION = 0.82;
const float POINTER_FORCE_FACTOR = 5.0;
const float SELF_FORCE_FACTOR = 0.10;
const float TRANSITION_FORCE_FACTOR = 120.0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 data = texture2D(positionVelocityTexture, uv);

  vec2 pos = data.xy;
  vec2 vel = data.zw;
  vec2 targetPos = texture2D(targetPositionTexture, uv).xy;

  vec2 acceleration = (targetPos - pos) * SELF_FORCE_FACTOR;

  vec2 pointerVector = targetPos - pointerPos;
  float pointerDistance = max(4.0, length(pointerVector));
  float pointerPower = max(0.0, pointerForceRadius - pointerDistance) / pointerForceRadius;
  pointerPower = smoothstep(0.1, 0.9, pointerPower * pointerPower);
  acceleration += normalize(pointerVector) * pointerPower * POINTER_FORCE_FACTOR * pointerActive;
  acceleration += normalize(pointerVector) * TRANSITION_FORCE_FACTOR * transitionValue;

  vel = (vel + acceleration) * FRICTION;
  gl_FragColor = vec4(pos + vel, vel);
}
`;

const COMPUTE_COLOR_SHADER = `
uniform sampler2D targetColorTexture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 velocity = texture2D(positionVelocityTexture, uv).zw;

  vec4 currentColor = texture2D(colorTexture, uv);
  vec4 targetColor = texture2D(targetColorTexture, uv);
  vec4 mixedColor = mix(currentColor, targetColor, 0.12);

  float speed = min(1.0, length(velocity) / 20.0);
  vec3 speedTint = vec3(speed, speed * 0.35, 0.0);
  mixedColor.rgb = clamp(mixedColor.rgb + speedTint * 32.0, 0.0, 255.0);

  gl_FragColor = mixedColor;
}
`;

const PARTICLE_VERTEX_SHADER = `
precision highp float;
precision highp int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform sampler2D positionVelocityTexture;
uniform sampler2D colorTexture;
uniform float dataTextureSize;
uniform float drawScale;
uniform float pointSize;

attribute vec3 position;
attribute float particleIndex;
attribute vec4 randomValue;

varying vec4 vColor;

void main() {
  vec4 modelPos = modelMatrix * vec4(vec3(0.0), 1.0);

  float col = mod(particleIndex, dataTextureSize);
  float row = floor(particleIndex / dataTextureSize);
  vec2 uv = (vec2(col, row) + vec2(0.5)) / dataTextureSize;

  vec4 positionVelocity = texture2D(positionVelocityTexture, uv);
  modelPos.xy += positionVelocity.xy * drawScale;

  vColor = texture2D(colorTexture, uv);
  vColor.a -= randomValue.y * 255.0 * 0.5;

  gl_Position = projectionMatrix * viewMatrix * modelPos;
  gl_PointSize = pointSize * (1.0 + 0.4 * randomValue.x + min(1.0, length(positionVelocity.zw) / 10.0));
}
`;

const PARTICLE_FRAGMENT_SHADER = `
precision highp float;
precision highp int;

uniform sampler2D pointTexture;
uniform float typeIndex;
uniform float numTypes;

varying vec4 vColor;

void main() {
  vec2 unit = vec2(1.0 / numTypes, 1.0);
  vec2 uv = gl_PointCoord.xy * unit + vec2(unit.x * typeIndex, 0.0);
  uv.y = 1.0 - uv.y;

  vec4 glyph = texture2D(pointTexture, uv);
  vec4 color = glyph * (vColor / 255.0);
  if (color.a <= 0.0) discard;

  gl_FragColor = color;
}
`;

class GpgpuParticleTypesApp {
  private wrapper: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private gpuCompute: GPUComputationRenderer;
  private positionVariable: Variable;
  private colorVariable: Variable;
  private pointTexture: THREE.Texture;
  private points: THREE.Points<THREE.BufferGeometry, THREE.RawShaderMaterial>;
  private drawScale = 1;
  private pointerPos = new THREE.Vector2(0, 0);
  private pointerActive = 0;
  private transitionValue = 0;
  private typeIndex = 0;
  private typeCount = FONT_TYPES.length;
  private typePositionTextures: THREE.DataTexture[] = [];
  private typeColorTextures: THREE.DataTexture[] = [];

  constructor(wrapper: HTMLDivElement) {
    this.wrapper = wrapper;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    this.camera.position.z = 500;
    this.camera.lookAt(0, 0, 0);
    this.camera.matrixAutoUpdate = false;
    this.camera.updateMatrix();

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.wrapper.appendChild(this.renderer.domElement);

    this.pointTexture = this.createPointTexture();
    this.gpuCompute = new GPUComputationRenderer(
      DATA_TEXTURE_SIZE,
      DATA_TEXTURE_SIZE,
      this.renderer
    );
    this.gpuCompute.setDataType(THREE.HalfFloatType);

    this.createTypeTextures();
    this.positionVariable = this.initPositionVariable();
    this.colorVariable = this.initColorVariable();
    this.initCompute();

    this.points = this.createPoints();
    this.scene.add(this.points);
    this.points.matrixAutoUpdate = false;
    this.points.updateMatrix();

    this.bindEvents();
    this.resize();
    this.render();
  }

  private createPointTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = TYPE_POINT_TEXTURE_UNIT * this.typeCount;
    canvas.height = TYPE_POINT_TEXTURE_UNIT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create 2D context for point texture");
    }

    for (let i = 0; i < this.typeCount; i++) {
      this.drawGlyph(
        context,
        TYPE_POINT_TEXTURE_UNIT * 0.9,
        FONT_TYPES[i].family,
        "#ffffff",
        TYPE_POINT_TEXTURE_UNIT * i + TYPE_POINT_TEXTURE_UNIT * 0.5,
        TYPE_POINT_TEXTURE_UNIT * 0.5
      );
    }

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  private createTypeTextures() {
    for (let i = 0; i < this.typeCount; i++) {
      const positionTexture = this.gpuCompute.createTexture();
      positionTexture.minFilter = THREE.NearestFilter;
      positionTexture.magFilter = THREE.NearestFilter;

      const colorTexture = this.gpuCompute.createTexture();
      colorTexture.minFilter = THREE.NearestFilter;
      colorTexture.magFilter = THREE.NearestFilter;

      this.fillTypeTextureData(i, positionTexture, colorTexture);
      this.typePositionTextures.push(positionTexture);
      this.typeColorTextures.push(colorTexture);
    }
  }

  private fillTypeTextureData(
    typeIndex: number,
    positionTexture: THREE.DataTexture,
    colorTexture: THREE.DataTexture
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = IMG_CANVAS_SIZE;
    canvas.height = IMG_CANVAS_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create 2D context for type texture");
    }

    this.drawGlyph(
      context,
      IMG_CANVAS_SIZE * 0.9,
      FONT_TYPES[typeIndex].family,
      FONT_TYPES[typeIndex].color,
      IMG_CANVAS_SIZE * 0.5,
      IMG_CANVAS_SIZE * 0.5
    );

    const imageData = context.getImageData(0, 0, IMG_CANVAS_SIZE, IMG_CANVAS_SIZE).data;
    const activePositions: Array<[number, number]> = [];
    const activeColors: Array<[number, number, number, number]> = [];
    const pixelCount = imageData.length / 4;

    for (let i = 0; i < pixelCount; i++) {
      const i4 = i * 4;
      const alpha = imageData[i4 + 3];
      if (alpha === 0) continue;

      const col = i % IMG_CANVAS_SIZE;
      const row = Math.floor(i / IMG_CANVAS_SIZE);
      activePositions.push([col - IMG_CANVAS_SIZE * 0.5, -(row - IMG_CANVAS_SIZE * 0.5)]);
      activeColors.push([
        imageData[i4 + 0],
        imageData[i4 + 1],
        imageData[i4 + 2],
        alpha,
      ]);
    }

    const shuffledIndices = this.shuffle(
      Array.from({ length: activePositions.length }, (_, index) => index)
    );

    const positionData = positionTexture.image.data as Float32Array;
    const colorData = colorTexture.image.data as Float32Array;
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const i4 = i * 4;
      const source = shuffledIndices[i % shuffledIndices.length];
      const position = activePositions[source];
      const color = activeColors[source];

      positionData[i4 + 0] = position[0];
      positionData[i4 + 1] = position[1];
      positionData[i4 + 2] = 0;
      positionData[i4 + 3] = 0;

      colorData[i4 + 0] = color[0];
      colorData[i4 + 1] = color[1];
      colorData[i4 + 2] = color[2];
      colorData[i4 + 3] = color[3];
    }
  }

  private drawGlyph(
    context: CanvasRenderingContext2D,
    fontSize: number,
    fontFamily: string,
    color: THREE.ColorRepresentation,
    x: number,
    y: number
  ) {
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = `${color}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("A", x, y);
  }

  private initPositionVariable() {
    const variable = this.gpuCompute.addVariable(
      "positionVelocityTexture",
      COMPUTE_POSITION_SHADER,
      this.typePositionTextures[this.typeIndex]
    );
    variable.material.uniforms.pointerPos = { value: this.pointerPos.clone() };
    variable.material.uniforms.pointerForceRadius = { value: 0 };
    variable.material.uniforms.pointerActive = { value: 0 };
    variable.material.uniforms.transitionValue = { value: 0 };
    variable.material.uniforms.targetPositionTexture = {
      value: this.typePositionTextures[this.typeIndex],
    };
    return variable;
  }

  private initColorVariable() {
    const variable = this.gpuCompute.addVariable(
      "colorTexture",
      COMPUTE_COLOR_SHADER,
      this.typeColorTextures[this.typeIndex]
    );
    variable.material.uniforms.targetColorTexture = {
      value: this.typeColorTextures[this.typeIndex],
    };
    return variable;
  }

  private initCompute() {
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.colorVariable, [
      this.colorVariable,
      this.positionVariable,
    ]);

    const error = this.gpuCompute.init();
    if (error !== null) {
      throw new Error(error);
    }
  }

  private createPoints() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(NUM_PARTICLES * 3);
    const particleIndices = new Float32Array(NUM_PARTICLES);
    const randomValues = new Float32Array(NUM_PARTICLES * 4);
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particleIndices[i] = i;
      const i4 = i * 4;
      randomValues[i4 + 0] = this.randomTri();
      randomValues[i4 + 1] = this.randomTri();
      randomValues[i4 + 2] = this.randomTri();
      randomValues[i4 + 3] = this.randomTri();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "particleIndex",
      new THREE.BufferAttribute(particleIndices, 1)
    );
    geometry.setAttribute("randomValue", new THREE.BufferAttribute(randomValues, 4));

    const material = new THREE.RawShaderMaterial({
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        pointTexture: { value: this.pointTexture },
        positionVelocityTexture: { value: null },
        colorTexture: { value: null },
        dataTextureSize: { value: DATA_TEXTURE_SIZE },
        drawScale: { value: 1 },
        pointSize: { value: 1 },
        typeIndex: { value: 0 },
        numTypes: { value: this.typeCount },
      },
    });

    return new THREE.Points(geometry, material);
  }

  private bindEvents() {
    this.wrapper.style.touchAction = "none";
    window.addEventListener("resize", this.resize);
    this.wrapper.addEventListener("pointermove", this.onPointerMove);
    this.wrapper.addEventListener("click", this.changeType);
  }

  private resize = () => {
    const rect = this.wrapper.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);

    this.camera.aspect = width / height;
    this.camera.position.z =
      (height / 2) / Math.tan((this.camera.fov * Math.PI) / 360);
    this.camera.updateMatrix();
    this.camera.updateProjectionMatrix();

    const drawAreaSize = Math.min(width, height);
    this.drawScale = drawAreaSize / IMG_CANVAS_SIZE;

    this.points.material.uniforms.drawScale.value = this.drawScale;
    this.points.material.uniforms.pointSize.value =
      (POINT_SIZE_BASIS / IMG_CANVAS_SIZE) * drawAreaSize * pixelRatio;

    this.positionVariable.material.uniforms.pointerForceRadius.value =
      (POINTER_RADIUS_BASIS / IMG_CANVAS_SIZE) * drawAreaSize * pixelRatio;
  };

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.wrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width * 0.5) / this.drawScale;
    const y = -(event.clientY - rect.top - rect.height * 0.5) / this.drawScale;

    this.pointerPos.set(x, y);
    this.positionVariable.material.uniforms.pointerPos.value.copy(this.pointerPos);
    this.pointerActive = 1;
  };

  private changeType = () => {
    this.typeIndex = (this.typeIndex + 1) % this.typeCount;
    this.points.material.uniforms.typeIndex.value = this.typeIndex;
    this.positionVariable.material.uniforms.targetPositionTexture.value =
      this.typePositionTextures[this.typeIndex];
    this.colorVariable.material.uniforms.targetColorTexture.value =
      this.typeColorTextures[this.typeIndex];
    this.transitionValue = 1;
    this.pointerActive = 1;
  };

  private render = () => {
    this.pointerActive *= 0.92;
    this.transitionValue *= 0.9;

    this.positionVariable.material.uniforms.pointerActive.value = this.pointerActive;
    this.positionVariable.material.uniforms.transitionValue.value =
      this.transitionValue;

    this.gpuCompute.compute();
    this.points.material.uniforms.positionVelocityTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.points.material.uniforms.colorTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.colorVariable).texture;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  };

  private randomTri() {
    return (Math.random() + Math.random() + Math.random()) / 3;
  }

  private shuffle<T>(array: T[]) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = result[i];
      result[i] = result[r];
      result[r] = tmp;
    }
    return result;
  }
}

const canvasWrapper = document.querySelector("#canvasWrapper") as HTMLDivElement | null;
if (!canvasWrapper) {
  throw new Error("canvasWrapper element not found");
}

new GpgpuParticleTypesApp(canvasWrapper);
