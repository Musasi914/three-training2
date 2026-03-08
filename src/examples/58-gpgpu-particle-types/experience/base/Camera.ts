import * as THREE from "three";
import Experience from "../Experience";

export class Camera {
  static FOV = 75;
  static NEAR = 1;
  static FAR = 10000;

  instance: THREE.PerspectiveCamera;
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
    const camera = new THREE.PerspectiveCamera(
      Camera.FOV,
      this.config.width / this.config.height,
      Camera.NEAR,
      Camera.FAR
    );
    camera.position.z = 500;
    camera.lookAt(0, 0, 0);
    camera.matrixAutoUpdate = false;
    camera.updateMatrix();
    this.scene.add(camera);
    return camera;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.aspect = this.config.width / this.config.height;
    this.instance.position.z =
      this.config.height / 2 / Math.tan((this.instance.fov * Math.PI) / 360);
    this.instance.updateMatrix();
    this.instance.updateProjectionMatrix();
  }
}
