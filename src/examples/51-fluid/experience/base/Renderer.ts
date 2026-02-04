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

    this.instance = this.create();
  }

  private create() {
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: this.config.pixelRatio === 1,
      powerPreference: "high-performance",
    });

    // 流体は複数パスを同一ターゲットに「足す」ので、毎回の自動クリアは無効化
    renderer.autoClear = false;

    this.canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(this.config.pixelRatio);
    renderer.setSize(this.config.width, this.config.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    return renderer;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.setPixelRatio(this.config.pixelRatio);
    this.instance.setSize(this.config.width, this.config.height);
  }
}
