import {
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

  geometry!: THREE.BufferGeometry;
  material!: THREE.ShaderMaterial;
  sphere!: THREE.Points;
  count!: number;

  computation!: GPUComputationRenderer;
  gpgpuSize!: number;
  particlesVariable!: Variable;

  particleGeometry!: THREE.BufferGeometry;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    this.createSphere();

    this.computation = new GPUComputationRenderer(
      this.gpgpuSize,
      this.gpgpuSize,
      this.renderer.instance
    );

    const baseParticlesTexture = this.computation.createTexture();

    this.particlesVariable = this.computation.addVariable(
      "uParticles",
      gpgpuParticlesShader,
      baseParticlesTexture
    );
    this.computation.setVariableDependencies(this.particlesVariable, [
      this.particlesVariable,
    ]);
    this.particlesVariable.material.uniforms.uTime = { value: 0 };

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      baseParticlesTexture.image.data[i4 + 0] =
        this.geometry.attributes.position.array[i3 + 0];
      baseParticlesTexture.image.data[i4 + 1] =
        this.geometry.attributes.position.array[i3 + 1];
      baseParticlesTexture.image.data[i4 + 2] =
        this.geometry.attributes.position.array[i3 + 2];
      baseParticlesTexture.image.data[i4 + 3] = Math.random();
    }

    this.particlesVariable.material.uniforms.uBase = {
      value: baseParticlesTexture,
    };

    this.computation.init();
    // this.createDebug();
  }

  createSphere() {
    this.geometry = new THREE.SphereGeometry(3, 128, 128);
    this.count = this.geometry.attributes.position.count;
    this.gpgpuSize = Math.ceil(Math.sqrt(this.count));

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setDrawRange(0, this.count);

    const particlesUvArray = new Float32Array(this.count * 2);
    for (let y = 0; y < this.gpgpuSize; y++) {
      for (let x = 0; x < this.gpgpuSize; x++) {
        const index = y * this.gpgpuSize + x;
        const i2 = index * 2;
        particlesUvArray[i2 + 0] = (x + 0.5) / this.gpgpuSize;
        particlesUvArray[i2 + 1] = (y + 0.5) / this.gpgpuSize;
      }
    }

    this.particleGeometry.setAttribute(
      "aParticleUv",
      new THREE.BufferAttribute(particlesUvArray, 2)
    );

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uParticlesTexture: new THREE.Uniform(new THREE.Texture()),
      },
      transparent: true,
      depthWrite: false,
    });

    this.sphere = new THREE.Points(this.particleGeometry, this.material);
    this.scene.add(this.sphere);
  }

  // private createDebug() {
  //   const debug = new THREE.Mesh(
  //     new THREE.PlaneGeometry(3, 3),
  //     new THREE.MeshBasicMaterial({
  //       map: this.computation.getCurrentRenderTarget(this.particlesVariable)
  //         .texture,
  //     })
  //   );
  //   this.scene.add(debug);
  // }

  resize() {}

  update() {
    this.computation.compute();

    this.material.uniforms.uParticlesTexture.value =
      this.computation.getCurrentRenderTarget(this.particlesVariable).texture;

    this.particlesVariable.material.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;

    this.renderer.instance.render(this.scene, this.experience.camera.instance);
  }
}
