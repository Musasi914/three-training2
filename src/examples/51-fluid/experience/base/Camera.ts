import * as THREE from "three";
import Experience from "../Experience";

export class Camera {
  instance: THREE.OrthographicCamera;
  experience: Experience;
  scene: Experience["scene"];
  config: Experience["config"];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.config = this.experience.config;

    this.instance = this.create();
  }

  private create() {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    this.scene.add(camera);
    return camera;
  }

  resize() {
    this.config = this.experience.config;
    // OrthographicCameraはアスペクト依存しないので更新不要
  }
}
