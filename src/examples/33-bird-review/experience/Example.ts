import Experience from "./Experience";
import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import fragmentShaderPosition from "./glsl/fragmentShaderPosition.glsl";
import fragmentShaderVelocity from "./glsl/fragmentShaderVelocity.glsl";
import birdVS from "./glsl/birdVS.glsl";
import birdFS from "./glsl/birdFS.glsl";
import BirdGeometry from "./BirdGeometry";
export default class Example {
  static WIDTH = 32;
  static BIRDS = Example.WIDTH * Example.WIDTH;
  //鳥は3次元空間で-400 から +400 の範囲（X, Y, Z各軸）内、すなわち800×800×800の立方体内を移動できます。
  static BOUNDS = 800;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  gpuCompute!: GPUComputationRenderer;
  positionVariable!: Variable;
  velocityVariable!: Variable;
  positionUniforms!: { [uniform: string]: THREE.IUniform<any> };
  velocityUniforms!: { [uniform: string]: THREE.IUniform<any> };

  mouse: THREE.Vector2 = new THREE.Vector2();

  birdUniforms!: { [uniform: string]: THREE.IUniform<any> };

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.gui.close();

    this.initComputeRenderer();

    this.experience.canvasWrapper.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );

    this.initBirds();
  }

  private initComputeRenderer() {
    this.gpuCompute = new GPUComputationRenderer(
      Example.WIDTH,
      Example.WIDTH,
      this.renderer.instance
    );

    const pos0 = this.gpuCompute.createTexture();
    const vel0 = this.gpuCompute.createTexture();

    this.fillPositionTexture(pos0);
    this.fillVelocityTexture(vel0);

    this.velocityVariable = this.gpuCompute.addVariable(
      "textureVelocity",
      fragmentShaderVelocity,
      vel0
    );
    this.positionVariable = this.gpuCompute.addVariable(
      "texturePosition",
      fragmentShaderPosition,
      pos0
    );

    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.velocityVariable,
      this.positionVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.velocityVariable,
      this.positionVariable,
    ]);

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.positionUniforms["time"] = { value: 0 };
    this.positionUniforms["delta"] = { value: 0 };
    this.velocityUniforms["time"] = { value: 1.0 };
    this.velocityUniforms["delta"] = { value: 0.0 };
    this.velocityUniforms["separationDistance"] = { value: 20.0 };
    this.velocityUniforms["alignmentDistance"] = { value: 20.0 };
    this.velocityUniforms["cohesionDistance"] = { value: 20.0 };
    this.velocityUniforms["predator"] = { value: new THREE.Vector3() };
    this.velocityVariable.material.defines.BOUNDS = Example.BOUNDS.toFixed(2);

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }
  private fillPositionTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;
    for (let i = 0; i < array.length; i += 4) {
      array[i] = (Math.random() - 0.5) * Example.BOUNDS;
      array[i + 1] = (Math.random() - 0.5) * Example.BOUNDS;
      array[i + 2] = (Math.random() - 0.5) * Example.BOUNDS;
      array[i + 3] = 1;
    }
  }
  private fillVelocityTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;
    for (let i = 0; i < array.length; i += 4) {
      array[i] = (Math.random() - 0.5) * 10;
      array[i + 1] = (Math.random() - 0.5) * 10;
      array[i + 2] = (Math.random() - 0.5) * 10;
      array[i + 3] = 1;
    }
  }

  private onPointerMove(event: PointerEvent) {
    // Convert the pointer position to values in the range [-1, 1]
    const rect = this.experience.canvasWrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    this.mouse.x = x * 2 - 1;
    this.mouse.y = -(y * 2 - 1);
  }

  private initBirds() {
    const geometry = new BirdGeometry();

    this.birdUniforms = {
      time: { value: 0 },
      delta: { value: 0 },
      texturePosition: { value: null },
      textureVelocity: { value: null },
      color: { value: new THREE.Color(0x666666) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: birdVS,
      fragmentShader: birdFS,
      side: THREE.DoubleSide,
      uniforms: this.birdUniforms,
    });

    const birdMesh = new THREE.Mesh(geometry, material);
    // birdMesh.matrixAutoUpdate = false;
    birdMesh.rotation.y = Math.PI / 2;
    // birdMesh.updateMatrix();
    this.scene.add(birdMesh);
  }

  resize() {}

  update() {
    this.positionUniforms["time"].value = this.experience.time.elapsed / 1000;
    this.positionUniforms["delta"].value = this.experience.time.delta;
    this.velocityUniforms["time"].value = this.experience.time.elapsed / 1000;
    this.velocityUniforms["delta"].value = this.experience.time.delta;

    // -0.5 ~ 0.5
    this.velocityUniforms["predator"].value.set(
      this.mouse.x / 2,
      this.mouse.y / 2,
      0
    );

    this.mouse.x = 10000;
    this.mouse.y = 10000;

    this.gpuCompute.compute();
    this.birdUniforms.textureVelocity.value =
      this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
    this.birdUniforms.texturePosition.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
  }
}
