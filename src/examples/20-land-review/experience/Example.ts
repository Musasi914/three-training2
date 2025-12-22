import Experience from "./Experience";
import * as THREE from "three";
import { SUBTRACTION, Brush, Evaluator } from "three-bvh-csg";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "./glsl/vert.vert";
import fragmentShader from "./glsl/frag.frag";
export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];

  terrainGeometry!: THREE.PlaneGeometry;
  terrainMaterial!: CustomShaderMaterial;
  terrainMesh!: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.gui.hide();
  }

  private createTerrain() {
    this.terrainGeometry = new THREE.PlaneGeometry(100, 100, 512, 512);
  }

  resize() {}

  update() {
    this.terrainMaterial.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;
  }
}
