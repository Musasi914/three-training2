import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vertex.vert";
import fragmentShader from "./glsl/fragment.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  camera: Experience["camera"];

  trusknotMesh!: THREE.Mesh;
  sphereMesh!: THREE.Mesh;
  boxMesh!: THREE.Mesh;
  material: THREE.ShaderMaterial;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.camera = this.experience.camera;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
    });

    this.createObjects();
  }

  private createObjects() {
    this.trusknotMesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
      this.material
    );
    this.trusknotMesh.position.x = -4;
    this.scene.add(this.trusknotMesh);

    this.sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      this.material
    );
    this.scene.add(this.sphereMesh);

    this.boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      this.material
    );
    this.boxMesh.position.x = 4;
    this.scene.add(this.boxMesh);
  }

  update() {
    const elapsed = this.experience.time.elapsed / 1000;
    this.trusknotMesh.rotation.z = elapsed;
    this.trusknotMesh.rotation.x = elapsed / 2;
    this.sphereMesh.rotation.z = elapsed / 4;
    this.sphereMesh.rotation.x = elapsed;
    this.boxMesh.rotation.z = elapsed / 8;
    this.boxMesh.rotation.x = elapsed;
  }
}
