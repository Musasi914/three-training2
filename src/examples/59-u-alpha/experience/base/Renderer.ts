import * as THREE from "three";
import Experience from "../Experience";

export class Renderer {
  instance: THREE.WebGLRenderer;
  experience: Experience;
  canvasWrapper: Experience["canvasWrapper"];
  config: Experience["config"];

  constructor() {
    this.experience = Experience.getInstance();
    this.canvasWrapper = this.experience.canvasWrapper;
    this.config = this.experience.config;
    this.instance = this.setInstance();
  }

  private setInstance() {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0x05070d, 1);
    renderer.setPixelRatio(this.config.pixelRatio);
    renderer.setSize(this.config.width, this.config.height);
    return renderer;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.setPixelRatio(this.config.pixelRatio);
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.render(this.experience.scene, this.experience.camera.instance);
  }

  update() {
    this.instance.render(this.experience.scene, this.experience.camera.instance);
  }
}
