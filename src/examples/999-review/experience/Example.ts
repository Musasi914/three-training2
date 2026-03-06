import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  resource: Experience["resource"];

  planeGeometry!: THREE.PlaneGeometry;
  material!: THREE.MeshStandardMaterial;
  plane!: THREE.Mesh;

  params = {
    displacementScale: 0.1,
    displacementBias: 0.1,
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.resource = this.experience.resource;

    const texture = this.resource.items.img as THREE.Texture;
    const heightmap = this.resource.items.heightmap as THREE.Texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = false;

    this.planeGeometry = new THREE.PlaneGeometry(3, 4, 128, 128);
    this.material = new THREE.MeshStandardMaterial({
      map: texture,
      displacementMap: heightmap,
      displacementScale: this.params.displacementScale,
      displacementBias: this.params.displacementBias,
    });
    this.plane = new THREE.Mesh(this.planeGeometry, this.material);
    this.scene.add(this.plane);

    this.createGUI();
  }

  createGUI() {
    this.gui.add(this.material, "displacementScale").min(0).max(1).step(0.01);
    this.gui.add(this.material, "displacementBias").min(0).max(1).step(0.01);
  }

  resize() {}

  update() {}
}
