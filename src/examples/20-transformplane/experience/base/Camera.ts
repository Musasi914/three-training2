import * as THREE from "three";
import Experience from "../Experience";
// import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Camera {
  static FOV = 50;
  static NEAR = 1;
  static FAR = 1000;
  instance: THREE.PerspectiveCamera;
  experience: Experience;
  scene: Experience["scene"];
  config: Experience["config"];
  // controls: OrbitControls;
  // controls: MapControls;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.config = this.experience.config;

    this.instance = this.setInstance();
    // this.controls = this.setOrbitControls();
  }

  private setInstance() {
    const camera = new THREE.PerspectiveCamera(
      Camera.FOV,
      this.config.width / this.config.height,
      Camera.NEAR,
      Camera.FAR
    );
    const fovRad = (Camera.FOV / 2) * (Math.PI / 180);
    const distance = this.config.height / (2 * Math.tan(fovRad));
    camera.position.set(0, 0, distance);
    this.scene.add(camera);
    return camera;
  }

  // private setOrbitControls() {
  //   const controls = new OrbitControls(
  //     this.instance,
  //     this.experience.canvasWrapper
  //   );
  //   return controls;
  // }

  resize() {
    this.config = this.experience.config;
    this.instance.aspect = this.config.width / this.config.height;
    this.instance.updateProjectionMatrix();

    const fovRad = (Camera.FOV / 2) * (Math.PI / 180);
    const distance = this.config.height / 200 / Math.tan(fovRad);
    this.instance.position.set(0, 0, distance);
  }
}
