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
    this.instance = this.setInstance();
  }

  private setInstance() {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    this.scene.add(camera);
    return camera;
  }

  resize() {
    this.config = this.experience.config;
    const aspect = this.config.width / this.config.height;
    const baseHeight = 1;
    const halfHeight = baseHeight;
    const halfWidth = baseHeight * aspect;
    this.instance.left = -halfWidth;
    this.instance.right = halfWidth;
    this.instance.top = halfHeight;
    this.instance.bottom = -halfHeight;
    this.instance.updateProjectionMatrix();
  }
}
