import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/plane.vert";
import fragmentShader from "./glsl/plane.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  camera: Experience["camera"];
  namedObjects: Record<string, THREE.Mesh | THREE.Bone | THREE.Group> = {};

  material: THREE.ShaderMaterial;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;
    this.camera = this.experience.camera;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      side: THREE.DoubleSide,
    });

    this.scene.add(
      new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    );
  }

  update() {
    this.material.uniforms.uTime.value = this.experience.time.elapsed / 1000;
  }
}
