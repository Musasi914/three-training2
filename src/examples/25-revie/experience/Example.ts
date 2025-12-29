import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./shaders/vert.glsl";
import fragmentShader from "./shaders/frag.glsl";
import fragmentShaderPos from "./shaders/particles.glsl";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  baseGeometry!: THREE.TorusGeometry;
  bufferGeometry!: THREE.BufferGeometry;
  material!: THREE.ShaderMaterial;
  torus!: THREE.Points;
  count!: number;

  particleCount!: number;

  gpuCompute!: GPUComputationRenderer;
  gpgpuSize!: number;
  particlesPosVariable!: Variable;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    // Base Geometry
    this.baseGeometry = new THREE.TorusGeometry(3, 1, 128, 256);
    this.count = this.baseGeometry.attributes.position.count;

    this.gpgpuSize = Math.ceil(Math.sqrt(this.count));

    this.bufferGeometry = new THREE.BufferGeometry();
    this.bufferGeometry.setDrawRange(0, this.count);
    const geoUv = new Float32Array(this.count * 2);
    for (let y = 0; y < this.gpgpuSize; y++) {
      for (let x = 0; x < this.gpgpuSize; x++) {
        const index = y * this.gpgpuSize + x;
        const i2 = index * 2;
        geoUv[i2 + 0] = (x + 0.5) / this.gpgpuSize;
        geoUv[i2 + 1] = (y + 0.5) / this.gpgpuSize;
      }
    }
    this.bufferGeometry.setAttribute(
      "aUv",
      new THREE.BufferAttribute(geoUv, 2)
    );

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uParticlesTexture: { value: null },
      },
    });
    this.torus = new THREE.Points(this.bufferGeometry, this.material);
    this.scene.add(this.torus);

    // GPGPU
    this.gpuCompute = new GPUComputationRenderer(
      this.gpgpuSize,
      this.gpgpuSize,
      this.renderer.instance
    );
    const pos0 = this.gpuCompute.createTexture();
    this.particlesPosVariable = this.gpuCompute.addVariable(
      "texturePosition",
      fragmentShaderPos,
      pos0
    );
    this.gpuCompute.setVariableDependencies(this.particlesPosVariable, [
      this.particlesPosVariable,
    ]);

    this.particlesPosVariable.material.uniforms.uTime = { value: 0 };

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;
      pos0.image.data[i4 + 0] =
        this.baseGeometry.attributes.position.array[i3 + 0];
      pos0.image.data[i4 + 1] =
        this.baseGeometry.attributes.position.array[i3 + 1];
      pos0.image.data[i4 + 2] =
        this.baseGeometry.attributes.position.array[i3 + 2];
      pos0.image.data[i4 + 3] = Math.random();
    }

    this.particlesPosVariable.material.uniforms.uBase = { value: pos0 };

    this.gpuCompute.init();
  }

  resize() {}

  update() {
    this.gpuCompute.compute();

    this.material.uniforms.uParticlesTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.particlesPosVariable).texture;

    this.particlesPosVariable.material.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;

    this.renderer.instance.render(this.scene, this.experience.camera.instance);
  }
}
