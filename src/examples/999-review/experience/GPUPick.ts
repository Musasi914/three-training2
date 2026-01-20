import * as THREE from "three";
import Experience from "./Experience";
import Example from "./Example";

export class GPUPick {
  example: Example = Example.getInstance();
  experience: Experience = Experience.getInstance();
  renderer: THREE.WebGLRenderer = this.experience.renderer.instance;

  pickingTexture: THREE.WebGLRenderTarget;
  pixelBuffer: Uint8Array;
  constructor() {
    this.example = Example.getInstance();
    this.renderer = this.experience.renderer.instance;

    this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
    this.pixelBuffer = new Uint8Array(4);
  }

  pick(position: THREE.Vector2, camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    camera.setViewOffset(
      this.experience.config.width,
      this.experience.config.height,
      position.x,
      position.y,
      1,
      1
    );

    this.renderer.setRenderTarget(this.pickingTexture);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);

    camera.clearViewOffset();

    this.renderer.readRenderTargetPixels(this.pickingTexture, 0, 0, 1, 1, this.pixelBuffer);

    const id = this.pixelBuffer[0] << 16 | this.pixelBuffer[1] << 8 | this.pixelBuffer[2];
    console.log(id);

  }
}