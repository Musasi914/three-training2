// import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vert.vert";
import fragmentShader from "./glsl/frag.frag";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  resource: Experience["resource"];

  material!: CustomShaderMaterial;

  params = {
    count: 2000,
    radius: 30,
    height: 30,
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.createLand();

    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.y = -0.4;
    this.scene.add(mesh);
  }

  private createLand() {
    const geometry = new THREE.PlaneGeometry(50, 50, 1024, 1024);
    geometry.rotateX(-Math.PI * 0.5);
    geometry.deleteAttribute("normal");
    geometry.deleteAttribute("uv");

    this.material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMove: { value: false },
        uColorWaterDeep: new THREE.Uniform(new THREE.Color(0x002b3d)),
        uColorWaterSurface: new THREE.Uniform(new THREE.Color(0x66a8ff)),
        uColorSand: new THREE.Uniform(new THREE.Color(0xfff3b0)),
        uColorGrass: new THREE.Uniform(new THREE.Color(0x85d534)),
        uColorRock: new THREE.Uniform(new THREE.Color(0xbfbd8d)),
        uColorSnow: new THREE.Uniform(new THREE.Color(0xffffff)),
      },
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.z = -17;

    this.gui.add(this.material.uniforms.uMove, "value").name("Move");
    // .onChange(() => {
    //   this.material.uniforms.uMove.value =
    //     !this.material.uniforms.uMove.value;
    // });
    this.scene.add(mesh);
  }

  resize() {}

  update() {
    this.material.uniforms.uTime.value = this.experience.time.elapsed / 1000;
  }
}
