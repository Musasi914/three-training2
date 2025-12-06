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

  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;
    this.camera = this.experience.camera;

    this.geometry = new THREE.PlaneGeometry(2, 2, 512, 512);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDepthColor: { value: new THREE.Color(0x186691) },
        uSurfaceColor: { value: new THREE.Color(0x9bd8ff) },
      },
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.scene.add(this.mesh);
  }

  update() {
    this.material.uniforms.uTime.value = this.experience.time.elapsed / 1000;
    // this.mesh.rotation.z = this.experience.time.elapsed / 1000;
  }
}
