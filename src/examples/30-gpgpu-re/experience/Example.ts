import {
  BufferGeometryUtils,
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./shaders/vert.glsl";
import fragmentShader from "./shaders/frag.glsl";
import gpgpuParticlesShader from "./shaders/particles.glsl";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  baseGeometry!: THREE.BufferGeometry;
  baseMateiral!: THREE.ShaderMaterial;
  baseMesh!: THREE.Points;
  baseCount!: number;
  gpgpuSize!: number;

  gpuCompute!: GPUComputationRenderer;
  posVariable!: Variable;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    this.createSphere();
    this.initGPGPU();
  }

  private createSphere() {
    const model = this.experience.resource.items.face;

    const geometries: THREE.BufferGeometry[] = [];
    model.scene.traverse((child: THREE.Mesh) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry.clone();
        geometry.applyMatrix4(child.matrixWorld);
        geometries.push(geometry);
      }
    });
    const geo = BufferGeometryUtils.mergeGeometries(geometries);
    geo.scale(20, 20, 20);

    this.baseGeometry = geo;
    this.baseCount = this.baseGeometry.attributes.position.count;
    this.gpgpuSize = Math.ceil(Math.sqrt(this.baseCount));

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setDrawRange(0, this.baseCount);

    this.baseMateiral = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTexturePosition: { value: null },
      },
    });

    // 同じ数のuvを作る。一つのuvが一つのパーティクルに対応できる
    const uvArray = new Float32Array(this.baseCount * 2);
    for (let y = 0; y < this.gpgpuSize; y++) {
      for (let x = 0; x < this.gpgpuSize; x++) {
        const i = y * this.gpgpuSize + x;
        const i2 = i * 2;
        uvArray[i2 + 0] = (x + 0.5) / this.gpgpuSize;
        uvArray[i2 + 1] = (y + 0.5) / this.gpgpuSize;
      }
    }
    bufferGeometry.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2));

    this.baseGeometry.deleteAttribute("uv");
    this.baseGeometry.deleteAttribute("normal");

    this.baseMesh = new THREE.Points(bufferGeometry, this.baseMateiral);
    this.scene.add(this.baseMesh);
  }

  private initGPGPU() {
    this.gpuCompute = new GPUComputationRenderer(
      this.gpgpuSize,
      this.gpgpuSize,
      this.renderer.instance
    );

    const posInitialTexture = this.gpuCompute.createTexture();

    for (let i = 0; i < this.baseCount; i++) {
      posInitialTexture.image.data[i * 4 + 0] =
        this.baseGeometry.attributes.position.array[i * 3 + 0];
      posInitialTexture.image.data[i * 4 + 1] =
        this.baseGeometry.attributes.position.array[i * 3 + 1];
      posInitialTexture.image.data[i * 4 + 2] =
        this.baseGeometry.attributes.position.array[i * 3 + 2];
      posInitialTexture.image.data[i * 4 + 3] = Math.random();
    }

    this.posVariable = this.gpuCompute.addVariable(
      "texturePosition",
      gpgpuParticlesShader,
      posInitialTexture
    );

    this.gpuCompute.setVariableDependencies(this.posVariable, [
      this.posVariable,
    ]);

    this.posVariable.material.uniforms.uTime = { value: 0 };
    this.posVariable.material.uniforms.uBase = { value: posInitialTexture };

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  resize() {}

  update() {
    this.gpuCompute.compute();
    this.baseMateiral.uniforms.uTexturePosition.value =
      this.gpuCompute.getCurrentRenderTarget(this.posVariable).texture;

    this.posVariable.material.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;
  }
}
