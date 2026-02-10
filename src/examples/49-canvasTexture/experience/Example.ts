import Experience from "./Experience";
import * as THREE from "three";
import People from "./People";
import Tree from "../Tree";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];

  people: People;
  tree: Tree;
  ground: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;

    this.people = new People();
    this.tree = new Tree();

    this.ground = this.makeGround();
  }

  private makeGround() {
    const geometry = new THREE.PlaneGeometry(400, 400);
    const material = new THREE.MeshPhongMaterial({ color: "gray" });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    return mesh;
  }

  resize() {}

  update() {}
}
