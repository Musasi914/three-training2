import Experience from "./Experience";
import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import fragmentShaderPosition from "./glsl/fragmentShaderPosition.glsl";
import fragmentShaderVelocity from "./glsl/fragmentShaderVelocity.glsl";
import BirdGeometry from "./BirdGeometry";
import birdVS from "./glsl/birdVS.glsl";
import birdFS from "./glsl/birdFS.glsl";
export default class Example {
  static WIDTH = 32;
  static BIRDS = Example.WIDTH * Example.WIDTH;
  //鳥は3次元空間で-400 から +400 の範囲（X, Y, Z各軸）内、すなわち800×800×800の立方体内を移動できます。
  static BOUNDS = 800;
  static BOUNDS_HALF = Example.BOUNDS / 2;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  gpuCompute!: GPUComputationRenderer;
  positionVariable!: Variable;
  velocityVariable!: Variable;
  positionUniforms!: { [uniform: string]: THREE.IUniform<any> };
  velocityUniforms!: { [uniform: string]: THREE.IUniform<any> };

  mouseX: number = 0;
  mouseY: number = 0;

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

    const dtPosition = this.gpuCompute.createTexture();
    const dtVelocity = this.gpuCompute.createTexture();
    this.fillPositionTexture(dtPosition);
    this.fillVelocityTexture(dtVelocity);

    this.positionVariable = this.gpuCompute.addVariable(
      "texturePosition",
      fragmentShaderPosition,
      dtPosition
    );
    this.velocityVariable = this.gpuCompute.addVariable(
      "textureVelocity",
      fragmentShaderVelocity,
      dtVelocity
    );

    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.positionVariable,
      this.velocityVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable,
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
    this.velocityUniforms["freedomFactor"] = { value: 1.0 };
    this.velocityUniforms["predator"] = { value: new THREE.Vector3() };
    this.velocityVariable.material.defines.BOUNDS = Example.BOUNDS.toFixed(2);

    // this.velocityVariable.wrapS = THREE.RepeatWrapping;
    // this.velocityVariable.wrapT = THREE.RepeatWrapping;
    // this.positionVariable.wrapS = THREE.RepeatWrapping;
    // this.positionVariable.wrapT = THREE.RepeatWrapping;

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  private fillPositionTexture(texture: THREE.DataTexture) {
    const theArray = texture.image.data;

    for (let i = 0; i < theArray.length; i += 4) {
      theArray[i] = Math.random() * Example.BOUNDS - Example.BOUNDS_HALF;
      theArray[i + 1] = Math.random() * Example.BOUNDS - Example.BOUNDS_HALF;
      theArray[i + 2] = Math.random() * Example.BOUNDS - Example.BOUNDS_HALF;
      theArray[i + 3] = 1;
    }
  }

  private fillVelocityTexture(texture: THREE.DataTexture) {
    const theArray = texture.image.data;

    for (let i = 0; i < theArray.length; i += 4) {
      theArray[i] = (Math.random() - 0.5) * 10;
      theArray[i + 1] = (Math.random() - 0.5) * 10;
      theArray[i + 2] = (Math.random() - 0.5) * 10;
      theArray[i + 3] = 1;
    }
  }

  private onPointerMove(event: PointerEvent) {
    this.mouseX = event.clientX - this.experience.canvasWrapper.clientWidth / 2;
    this.mouseY =
      event.clientY - this.experience.canvasWrapper.clientHeight / 2;
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
      uniforms: this.birdUniforms,
      side: THREE.DoubleSide,
      vertexShader: birdVS,
      fragmentShader: birdFS,
    });

    const birdMesh = new THREE.Mesh(geometry, material);
    birdMesh.matrixAutoUpdate = false;
    birdMesh.rotation.y = Math.PI / 2;
    birdMesh.updateMatrix();
    this.scene.add(birdMesh);
  }

  resize() {}

  update() {
    this.positionUniforms["time"].value = this.experience.time.elapsed / 1000;
    this.positionUniforms["delta"].value = this.experience.time.delta;
    this.velocityUniforms["time"].value = this.experience.time.elapsed / 1000;
    this.velocityUniforms["delta"].value = this.experience.time.delta;

    this.birdUniforms.time.value += this.experience.time.delta;
    this.birdUniforms.delta.value = this.experience.time.delta;

    // -0.5 ~ 0.5
    this.velocityUniforms["predator"].value.set(
      (0.5 * this.mouseX) / (this.experience.canvasWrapper.clientWidth / 2),
      (-0.5 * this.mouseY) / (this.experience.canvasWrapper.clientHeight / 2),
      0
    );

    this.mouseX = 10000;
    this.mouseY = 10000;

    this.gpuCompute.compute();
    this.birdUniforms.texturePosition.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.birdUniforms.textureVelocity.value =
      this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
  }
}
