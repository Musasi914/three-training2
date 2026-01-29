import Experience from "./Experience";
import * as THREE from "three";

export default class GPUPicker {
  experience: Experience;
  renderer: THREE.WebGLRenderer;

  pickingTexture: THREE.WebGLRenderTarget;
  pixelBuffer: Uint8Array;

  constructor() {
    this.experience = Experience.getInstance();
    this.renderer = this.experience.renderer.instance;

    this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
    this.pixelBuffer = new Uint8Array(4);
  }

  pick(
    cssPosition: THREE.Vector2,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    camera.setViewOffset(
      this.renderer.getContext().drawingBufferWidth,
      this.renderer.getContext().drawingBufferHeight,
      (cssPosition.x * this.experience.config.pixelRatio) | 0,
      (cssPosition.y * this.experience.config.pixelRatio) | 0,
      1,
      1
    );
    this.renderer.setRenderTarget(this.pickingTexture);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    camera.clearViewOffset();

    this.renderer.readRenderTargetPixels(
      this.pickingTexture,
      0,
      0,
      1,
      1,
      this.pixelBuffer
    );

    const id =
      (this.pixelBuffer[0] << 0) |
      (this.pixelBuffer[1] << 8) |
      (this.pixelBuffer[2] << 16);

    return id;
  }
}
