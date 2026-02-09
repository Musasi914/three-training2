import * as THREE from "three";
import Experience from "../Experience";

export class Renderer {
  instance: THREE.WebGLRenderer;
  private experience: Experience;

  constructor() {
    this.experience = Experience.getInstance();
    this.instance = this.create();
  }

  private create() {
    const { config, canvasWrapper } = this.experience;

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: config.pixelRatio === 1,
      powerPreference: "high-performance",
    });

    canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(config.pixelRatio);
    renderer.setSize(config.width, config.height);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  resize() {
    const { config } = this.experience;
    this.instance.setPixelRatio(config.pixelRatio);
    this.instance.setSize(config.width, config.height);
  }

  render() {
    this.instance.setRenderTarget(null);
    this.instance.render(this.experience.scene, this.experience.camera.instance);
  }
}

