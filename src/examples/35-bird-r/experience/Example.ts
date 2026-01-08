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

// posの第４引数は？
// velの第４引数は？

export default class Example {
  static WIDTH = 32;
  static BIRD_COUNT = Example.WIDTH * Example.WIDTH;
  static BOUNDS = 800;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  gpuCompute!: GPUComputationRenderer;
  velVariable!: Variable;
  posVariable!: Variable;

  birdUniforms!: { [uniform: string]: THREE.IUniform<any> };
  material!: THREE.ShaderMaterial;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.gui.close();

    this.initComputeRenderer();

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

    this.velVariable = this.gpuCompute.addVariable(
      "textureVelocity",
      fragmentShaderVelocity,
      vel0
    );
    this.posVariable = this.gpuCompute.addVariable(
      "texturePosition",
      fragmentShaderPosition,
      pos0
    );

    this.gpuCompute.setVariableDependencies(this.velVariable, [
      this.velVariable,
      this.posVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.posVariable, [
      this.velVariable,
      this.posVariable,
    ]);

    this.velVariable.material.uniforms.time = { value: 0 };
    this.velVariable.material.uniforms.delta = { value: 0 };
    this.posVariable.material.uniforms.time = { value: 0 };
    this.posVariable.material.uniforms.delta = { value: 0 };

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  private fillPositionTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;
    for (let i = 0; i < Example.BIRD_COUNT; i++) {
      array[i * 4 + 0] = (Math.random() - 0.5) * Example.BOUNDS;
      array[i * 4 + 1] = (Math.random() - 0.5) * Example.BOUNDS;
      array[i * 4 + 2] = (Math.random() - 0.5) * Example.BOUNDS;
      array[i * 4 + 3] = 0;
    }
  }

  private fillVelocityTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;
    for (let i = 0; i < Example.BIRD_COUNT; i++) {
      array[i * 4 + 0] = Math.random() * 10;
      array[i * 4 + 1] = Math.random() * 10;
      array[i * 4 + 2] = Math.random() * 10;
      array[i * 4 + 3] = 1;
    }
  }

  private initBirds() {
    const geometry = new BirdGeometry();
    this.birdUniforms = {
      time: { value: 0 },
      delta: { value: 0 },
      texturePosition: { value: null },
      textureVelocity: { value: null },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: birdVS,
      fragmentShader: birdFS,
      side: THREE.DoubleSide,
      uniforms: this.birdUniforms,
    });
    const birdMesh = new THREE.Mesh(geometry, this.material);
    birdMesh.rotation.y = Math.PI / 2;
    this.scene.add(birdMesh);
  }

  resize() {}

  update() {
    this.velVariable.material.uniforms.time.value =
      this.experience.time.elapsed / 1000;
    this.velVariable.material.uniforms.delta.value = this.experience.time.delta;
    this.posVariable.material.uniforms.time.value =
      this.experience.time.elapsed / 1000;
    this.posVariable.material.uniforms.delta.value = this.experience.time.delta;

    this.gpuCompute.compute();
    this.material.uniforms.textureVelocity.value =
      this.gpuCompute.getCurrentRenderTarget(this.velVariable).texture;
    this.material.uniforms.texturePosition.value =
      this.gpuCompute.getCurrentRenderTarget(this.posVariable).texture;
    this.material.uniforms.time.value = this.experience.time.elapsed / 1000;
    this.material.uniforms.delta.value = this.experience.time.delta;
  }
}
