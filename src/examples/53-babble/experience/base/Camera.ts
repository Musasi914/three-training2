import * as THREE from "three";
import Experience from "../Experience";

export class Camera {
  instance: THREE.OrthographicCamera;
  private experience: Experience;

  constructor() {
    this.experience = Experience.getInstance();
    this.instance = this.create();
  }

  private create() {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    this.experience.scene.add(camera);
    return camera;
  }

  resize() {
    // OrthographicCamera はアスペクト比に依存しない
  }
}

