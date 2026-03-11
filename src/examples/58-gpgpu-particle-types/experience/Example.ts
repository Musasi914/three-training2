import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import computePositionFrag from "./glsl/computePosition.frag";
import computeColorFrag from "./glsl/computeColor.frag";
import particleVert from "./glsl/particle.vert";
import particleFrag from "./glsl/particle.frag";

const DATA_TEXTURE_SIZE = 100;
const NUM_PARTICLES = DATA_TEXTURE_SIZE * DATA_TEXTURE_SIZE;
const IMG_CANVAS_SIZE = 512;
const POINT_SIZE_BASIS = 15;
const POINTER_RADIUS_BASIS = 160;
const TYPE_POINT_TEXTURE_UNIT = 64;

type FontType = {
  family: string;
  color: string;
};

const FONT_TYPES: FontType[] = [
  { family: "serif", color: "#2CE54F" },
  { family: "sans-serif", color: "#2D6DA4" },
  { family: "monospace", color: "#D2CDD1" },
  { family: "cursive", color: "#A1759D" },
  { family: "fantasy", color: "#FC953A" },
  { family: "system-ui", color: "#5864D6" },
];

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  canvasWrapper: Experience["canvasWrapper"];

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
  private typePositionTextures: THREE.DataTexture[] = [];
  private typeColorTextures: THREE.DataTexture[] = [];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;
    this.canvasWrapper = this.experience.canvasWrapper;

    this.pointTexture = this.createPointTexture();
    this.gpuCompute = new GPUComputationRenderer(
      DATA_TEXTURE_SIZE,
      DATA_TEXTURE_SIZE,
      this.renderer
    );
    this.gpuCompute.setDataType(THREE.HalfFloatType);

    this.createTypeTextures();
    this.positionVariable = this.createPositionVariable();
    this.colorVariable = this.createColorVariable();
    this.initCompute();

    this.points = this.createPoints();
    this.points.matrixAutoUpdate = false;
    this.points.updateMatrix();
    this.scene.add(this.points);

    this.canvasWrapper.style.touchAction = "none";
    this.canvasWrapper.addEventListener("pointermove", this.onPointerMove);
    this.canvasWrapper.addEventListener("click", this.onClick);
    this.resize();
  }

  private createPointTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = TYPE_POINT_TEXTURE_UNIT * FONT_TYPES.length;
    canvas.height = TYPE_POINT_TEXTURE_UNIT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D context creation failed");
    }

    for (let i = 0; i < FONT_TYPES.length; i++) {
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
    for (let i = 0; i < FONT_TYPES.length; i++) {
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
      throw new Error("2D context creation failed");
    }

    this.drawGlyph(
      context,
      IMG_CANVAS_SIZE * 0.9,
      FONT_TYPES[typeIndex].family,
      FONT_TYPES[typeIndex].color,
      IMG_CANVAS_SIZE * 0.5,
      IMG_CANVAS_SIZE * 0.5
    );

    const imageData = context.getImageData(
      0,
      0,
      IMG_CANVAS_SIZE,
      IMG_CANVAS_SIZE
    ).data;
    const activePositions: Array<[number, number]> = [];
    const activeColors: Array<[number, number, number, number]> = [];
    const pixelCount = imageData.length / 4;

    for (let i = 0; i < pixelCount; i++) {
      const i4 = i * 4;
      const alpha = imageData[i4 + 3];
      if (alpha === 0) {
        continue;
      }

      const col = i % IMG_CANVAS_SIZE;
      const row = Math.floor(i / IMG_CANVAS_SIZE);
      activePositions.push([
        col - IMG_CANVAS_SIZE * 0.5,
        -(row - IMG_CANVAS_SIZE * 0.5),
      ]);
      activeColors.push([
        imageData[i4 + 0],
        imageData[i4 + 1],
        imageData[i4 + 2],
        alpha,
      ]);
    }

    const indices = this.shuffle(
      Array.from({ length: activePositions.length }, (_, index) => index)
    );
    const positionData = positionTexture.image.data as Float32Array;
    const colorData = colorTexture.image.data as Float32Array;

    if (indices.length === 0) {
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const i4 = i * 4;
        positionData[i4 + 0] = 0;
        positionData[i4 + 1] = 0;
        positionData[i4 + 2] = 0;
        positionData[i4 + 3] = 0;
        colorData[i4 + 0] = 0;
        colorData[i4 + 1] = 0;
        colorData[i4 + 2] = 0;
        colorData[i4 + 3] = 0;
      }
      return;
    }

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const i4 = i * 4;
      const sourceIndex = indices[i % indices.length];
      const position = activePositions[sourceIndex];
      const color = activeColors[sourceIndex];

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
    color: string,
    x: number,
    y: number
  ) {
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("A", x, y);
  }

  private createPositionVariable() {
    const variable = this.gpuCompute.addVariable(
      "positionVelocityTexture",
      computePositionFrag,
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

  private createColorVariable() {
    const variable = this.gpuCompute.addVariable(
      "colorTexture",
      computeColorFrag,
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
    geometry.setAttribute(
      "randomValue",
      new THREE.BufferAttribute(randomValues, 4)
    );

    const material = new THREE.RawShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
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
        numTypes: { value: FONT_TYPES.length },
      },
    });

    return new THREE.Points(geometry, material);
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.canvasWrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width * 0.5) / this.drawScale;
    const y = -(event.clientY - rect.top - rect.height * 0.5) / this.drawScale;
    this.pointerPos.set(x, y);
    this.positionVariable.material.uniforms.pointerPos.value.copy(
      this.pointerPos
    );
    this.pointerActive = 1;
  };

  private onClick = () => {
    this.typeIndex = (this.typeIndex + 1) % FONT_TYPES.length;
    this.points.material.uniforms.typeIndex.value = this.typeIndex;
    this.positionVariable.material.uniforms.targetPositionTexture.value =
      this.typePositionTextures[this.typeIndex];
    this.colorVariable.material.uniforms.targetColorTexture.value =
      this.typeColorTextures[this.typeIndex];
    this.transitionValue = 1;
    this.pointerActive = 1;
  };

  resize() {
    const drawAreaSize = Math.min(
      this.experience.config.width,
      this.experience.config.height
    );
    this.drawScale = drawAreaSize / IMG_CANVAS_SIZE;

    this.points.material.uniforms.drawScale.value = this.drawScale;
    this.points.material.uniforms.pointSize.value =
      (POINT_SIZE_BASIS / IMG_CANVAS_SIZE) *
      drawAreaSize *
      this.experience.config.pixelRatio;
    this.positionVariable.material.uniforms.pointerForceRadius.value =
      (POINTER_RADIUS_BASIS / IMG_CANVAS_SIZE) *
      drawAreaSize *
      this.experience.config.pixelRatio;
  }

  update() {
    this.pointerActive *= 0.92;
    this.transitionValue *= 0.9;

    this.positionVariable.material.uniforms.pointerActive.value =
      this.pointerActive;
    this.positionVariable.material.uniforms.transitionValue.value =
      this.transitionValue;

    this.gpuCompute.compute();
    this.points.material.uniforms.positionVelocityTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.points.material.uniforms.colorTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.colorVariable).texture;
  }

  private randomTri() {
    return (Math.random() + Math.random() + Math.random()) / 3;
  }

  private shuffle<T>(array: T[]) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[randomIndex];
      result[randomIndex] = temp;
    }
    return result;
  }
}
