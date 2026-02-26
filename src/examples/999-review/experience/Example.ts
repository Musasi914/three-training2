// import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/plane.vert";
import fragmentShader from "./glsl/plane.frag";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  resource: Experience["resource"];

  material!: CustomShaderMaterial;

  depthMaterial!: CustomShaderMaterial;

  params = {
    uColorA: new THREE.Uniform(new THREE.Color(0xff0000)),
    uColorB: new THREE.Uniform(new THREE.Color(0x0000ff)),
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.createPlane();
    this.createSphere();

    this.createGUI();
  }

  private createGUI() {
    this.gui.addColor(this.params, "uColorA");
    this.gui.addColor(this.params, "uColorB");
  }

  private createPlane() {
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.rotation.y = (Math.PI / 180) * 90;
    mesh.position.x = -2;
    this.scene.add(mesh);
  }

  private createSphere() {
    const geometry = new THREE.SphereGeometry(1, 512, 512);
    geometry.computeTangents();

    this.depthMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
      },
      depthPacking: THREE.RGBADepthPacking,
    });

    this.material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      metalness: 0.99,
      roughness: 0.5,
      vertexShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uColorA: this.params.uColorA,
        uColorB: this.params.uColorB,
      },
      fragmentShader,
    });
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.customDepthMaterial = this.depthMaterial;
    this.scene.add(mesh);
  }

  resize() {}

  update() {
    const time = this.experience.time.elapsed / 1000;
    this.material.uniforms.uTime.value = time;
    this.depthMaterial.uniforms.uTime.value = time;
  }
}
