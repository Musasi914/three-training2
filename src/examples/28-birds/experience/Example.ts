import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/particle.vert";
import fragmentShader from "./glsl/particle.frag";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import fragmentShaderPos from "./glsl/position.glsl";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  baseGeometry!: THREE.SphereGeometry;
  mainMaterial!: THREE.ShaderMaterial;

  basePositionCount!: number;
  gpuTextureSize!: number;

  gpuCompute!: GPUComputationRenderer;
  posVar!: Variable;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.gui.close();

    this.createBox();

    this.initGpgpu();
  }

  private createBox() {
    this.baseGeometry = new THREE.SphereGeometry(3, 128, 128);
    const bufferGeometry = new THREE.BufferGeometry();
    this.basePositionCount = this.baseGeometry.attributes.position.count;
    this.gpuTextureSize = Math.ceil(Math.sqrt(this.basePositionCount));

    bufferGeometry.setDrawRange(0, this.basePositionCount);

    const uvArray = new Float32Array(this.basePositionCount * 2);
    for (let y = 0; y < this.gpuTextureSize; y++) {
      for (let x = 0; x < this.gpuTextureSize; x++) {
        const i = y * this.gpuTextureSize + x;
        uvArray[i * 2 + 0] = (x + 0.5) / this.gpuTextureSize;
        uvArray[i * 2 + 1] = (y + 0.5) / this.gpuTextureSize;
      }
    }

    bufferGeometry.setAttribute(
      "aParticleUv",
      new THREE.BufferAttribute(uvArray, 2)
    );

    this.mainMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPositionTexture: new THREE.Uniform(new THREE.Texture()),
      },
    });
    const points = new THREE.Points(bufferGeometry, this.mainMaterial);

    this.scene.add(points);
  }

  private initGpgpu() {
    this.gpuCompute = new GPUComputationRenderer(
      this.gpuTextureSize,
      this.gpuTextureSize,
      this.renderer.instance
    );

    // Create initial state float textures
    const pos0 = this.gpuCompute.createTexture();

    // and fill in here the texture data...
    // Add texture variables
    this.posVar = this.gpuCompute.addVariable(
      "texturePosition",
      fragmentShaderPos,
      pos0
    );

    // Add variable dependencies
    this.gpuCompute.setVariableDependencies(this.posVar, [this.posVar]);

    for (let i = 0; i < this.basePositionCount; i++) {
      pos0.image.data[i * 4 + 0] =
        this.baseGeometry.attributes.position.array[i * 3 + 0];
      pos0.image.data[i * 4 + 1] =
        this.baseGeometry.attributes.position.array[i * 3 + 1];
      pos0.image.data[i * 4 + 2] =
        this.baseGeometry.attributes.position.array[i * 3 + 2];
      pos0.image.data[i * 4 + 3] = Math.random();
    }
    // Add custom uniforms
    this.posVar.material.uniforms.time = { value: 0.0 };
    this.posVar.material.uniforms.uBase = { value: pos0 };

    // Check for completeness
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  resize() {}

  update() {
    this.gpuCompute.compute();

    this.mainMaterial.uniforms.uPositionTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.posVar).texture;

    this.posVar.material.uniforms.time.value =
      this.experience.time.elapsed / 1000;
  }
}
