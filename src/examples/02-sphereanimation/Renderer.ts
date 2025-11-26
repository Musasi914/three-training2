import Experience from "./Experience";
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
    // 既存のcanvasを削除（ホットリロード対応）
    const existingCanvas = this.canvasWrapper.querySelector("canvas");
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: this.config.pixelRatio === 1,
    });

    this.canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0x1a1a1a, 1); // より暗い背景色
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

