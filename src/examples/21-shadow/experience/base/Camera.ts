import * as THREE from "three";
import Experience from "../Experience";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Camera {
  static FOV = 50;
  static NEAR = 1;
  static FAR = 100;
  static CAMERA_POSITION: [number, number, number] = [0, 20, 20];
  instance: THREE.PerspectiveCamera;
  experience: Experience;
  scene: Experience["scene"];
  config: Experience["config"];
  controls: OrbitControls;
  // controls: MapControls;

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
    camera.position.set(...Camera.CAMERA_POSITION);
    this.scene.add(camera);
    return camera;
  }

  private setOrbitControls() {
    const a = document.querySelector("#view1") as HTMLDivElement;
    const controls = new OrbitControls(this.instance, a);
    return controls;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.aspect = this.config.width / this.config.height;
    this.instance.updateProjectionMatrix();
  }
}
