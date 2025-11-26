import Experience from "../Experience";
import * as THREE from "three";

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
      alpha: false,
      antialias: this.config.pixelRatio === 1,
    });

    this.canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0x242424, 1);
    renderer.setPixelRatio(this.config.pixelRatio);
    renderer.setSize(this.config.width, this.config.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.setPixelRatio(this.config.pixelRatio);
    this.instance.setSize(this.config.width, this.config.height);
  }

  update() {
    this.instance.render(
      this.experience.scene,
      this.experience.camera.instance
    );
  }
}
