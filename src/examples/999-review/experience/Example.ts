import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";
import computePositionFrag from "./glsl/computePosition.frag";
import computeColorFrag from "./glsl/computeColor.frag";
import particleVert from "./glsl/particle.vert";
import particleFrag from "./glsl/particle.frag";

export default class Example {
  static DATA_TEXTURE_SIZE = 80;
  static NUM_PARTICLES = Example.DATA_TEXTURE_SIZE * Example.DATA_TEXTURE_SIZE;
  static IMG_CANVAS_SIZE = 1300;

  static TYPE_POINT_TEXTURE_UNIT = 64;

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  resource: Experience["resource"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  canvasWrapper: Experience["canvasWrapper"];

  private gpuCompute: GPUComputationRenderer;
  private positionVariable: Variable;
  private colorVariable: Variable;
  private pos0!: THREE.DataTexture;
  private col0!: THREE.DataTexture;

  private pointerPos = new THREE.Vector2(0, 0);
  private pointerActive = 0;

  private pointTexture: THREE.Texture;
  private points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

  private drawScale: number;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.resource = this.experience.resource;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.canvasWrapper = this.experience.canvasWrapper;

    this.drawScale =
      Math.min(this.experience.config.width, this.experience.config.height) /
      Example.IMG_CANVAS_SIZE;

    this.gpuCompute = new GPUComputationRenderer(
      Example.DATA_TEXTURE_SIZE,
      Example.DATA_TEXTURE_SIZE,
      this.renderer.instance
    );
    this.gpuCompute.setDataType(THREE.HalfFloatType);

    this.createTypeTextures();
    this.positionVariable = this.createPositionVariable();
    this.colorVariable = this.createColorVariable();
    this.initCompute();

    this.pointTexture = this.createPointTexture();
    this.points = this.createPoints();
    // this.points.matrixAutoUpdate = false;
    // this.points.updateMatrix();
    this.scene.add(this.points);

    this.canvasWrapper.style.touchAction = "none";
    this.canvasWrapper.addEventListener("pointermove", this.onPointerMove);
    // this.canvasWrapper.addEventListener("click", this.onClick);
    // this.resize();
  }

  private createTypeTextures() {
    const positionTexture = this.gpuCompute.createTexture();
    const colorTexture = this.gpuCompute.createTexture();

    this.fillTypeTextureData(positionTexture, colorTexture);
    this.pos0 = positionTexture;
    this.col0 = colorTexture;
  }
  private fillTypeTextureData(
    positionTexture: THREE.DataTexture,
    colorTexture: THREE.DataTexture
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = Example.IMG_CANVAS_SIZE;
    canvas.height = Example.IMG_CANVAS_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D context creation failed");
    }

    this.drawGlyph(
      context,
      Example.IMG_CANVAS_SIZE * 0.9,
      "Arial",
      "#2CE54F",
      Example.IMG_CANVAS_SIZE * 0.5,
      Example.IMG_CANVAS_SIZE * 0.5
    );

    const imageData = context.getImageData(
      0,
      0,
      Example.IMG_CANVAS_SIZE,
      Example.IMG_CANVAS_SIZE
    ).data;

    const activePositions: [number, number][] = [];
    const activeColors: [number, number, number, number][] = [];
    const pixelCount = imageData.length / 4;

    for (let i = 0; i < pixelCount; i++) {
      const i4 = i * 4;
      const alpha = imageData[i4 + 3];
      if (alpha === 0) {
        continue;
      }

      const col = i % Example.IMG_CANVAS_SIZE;
      const row = Math.floor(i / Example.IMG_CANVAS_SIZE);
      activePositions.push([
        col - Example.IMG_CANVAS_SIZE * 0.5,
        -(row - Example.IMG_CANVAS_SIZE * 0.5),
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

    for (let i = 0; i < Example.NUM_PARTICLES; i++) {
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
    console.log(positionData);
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
      this.pos0
    );
    variable.material.uniforms.pointerPos = { value: this.pointerPos.clone() };
    variable.material.uniforms.pointerForceRadius = { value: 200 };
    variable.material.uniforms.pointerActive = { value: 0 };
    variable.material.uniforms.transitionValue = { value: 0 };
    variable.material.uniforms.targetPositionTexture = {
      value: this.pos0,
    };
    return variable;
  }

  private createColorVariable() {
    const variable = this.gpuCompute.addVariable(
      "colorTexture",
      computeColorFrag,
      this.col0
    );
    variable.material.uniforms.targetColorTexture = {
      value: this.col0,
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

  private createPointTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = Example.TYPE_POINT_TEXTURE_UNIT;
    canvas.height = Example.TYPE_POINT_TEXTURE_UNIT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D context creation failed");
    }

    this.drawGlyph(
      context,
      Example.TYPE_POINT_TEXTURE_UNIT * 0.9,
      "Arial",
      "white",
      Example.TYPE_POINT_TEXTURE_UNIT * 0.5,
      Example.TYPE_POINT_TEXTURE_UNIT * 0.5
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  private createPoints() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(Example.NUM_PARTICLES * 3);
    const particleIndices = new Float32Array(Example.NUM_PARTICLES);
    const randomValues = new Float32Array(Example.NUM_PARTICLES * 4);

    for (let i = 0; i < Example.NUM_PARTICLES; i++) {
      particleIndices[i] = i;

      const i4 = i * 4;
      randomValues[i4 + 0] = Math.random();
      randomValues[i4 + 1] = Math.random();
      randomValues[i4 + 2] = Math.random();
      randomValues[i4 + 3] = Math.random();
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

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        pointTexture: { value: this.pointTexture },
        positionVelocityTexture: { value: null },
        colorTexture: { value: null },
        dataTextureSize: { value: Example.DATA_TEXTURE_SIZE },
        pointSize: { value: 20 },
      },
    });
    return new THREE.Points(geometry, material);
  }

  private onPointerMove = (event: PointerEvent) => {
    const x =
      (event.clientX - this.canvasWrapper.clientWidth / 2) / this.drawScale;
    const y =
      -(event.clientY - this.canvasWrapper.clientHeight / 2) / this.drawScale;
    this.pointerPos.set(x, y);
    this.positionVariable.material.uniforms.pointerPos.value.copy(
      this.pointerPos
    );
    this.pointerActive = 1;
  };

  resize() {}

  update() {
    this.pointerActive *= 0.92;
    this.positionVariable.material.uniforms.pointerActive.value =
      this.pointerActive;

    this.gpuCompute.compute();
    this.points.material.uniforms.positionVelocityTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.points.material.uniforms.colorTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.colorVariable).texture;
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
