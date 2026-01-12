import * as THREE from "three";
import Experience from "../Experience";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Camera {
  static FOV = 75;
  static NEAR = 0.1;
  static FAR = 1000;

  instance: THREE.PerspectiveCamera;
  experience: Experience;
  scene: Experience["scene"];
  config: Experience["config"];
  controls: OrbitControls;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.config = this.experience.config;

    this.instance = this.setInstance();
    this.controls = this.setOrbitControls();
  }

  private setInstance() {
    const camera = new THREE.PerspectiveCamera(
      Camera.FOV,
      this.config.width / this.config.height,
      Camera.NEAR,
      Camera.FAR
    );
    camera.position.set(0, 4, 2);
    camera.lookAt(0, 0, 0);
    this.scene.add(camera);
    return camera;
  }

  private setOrbitControls() {
    const controls = new OrbitControls(
      this.instance,
      this.experience.canvasWrapper
    );
    return controls;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.aspect = this.config.width / this.config.height;
    this.instance.updateProjectionMatrix();
  }
}
