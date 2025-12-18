import * as THREE from "three";
import Experience from "../Experience";
// import { OrbitControls } from "three/examples/jsm/Addons.js";

const FOV = 75;
const NEAR = 0.1;
const FAR = 100;
const CAMERA_POSITION: [number, number, number] = [0, 20, 20];

export class Camera {
  instance: THREE.OrthographicCamera;
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
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR);
    camera.zoom = 0.1;
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(0, 5, 0);
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
    // this.instance.aspect = this.config.width / this.config.height;
    this.instance.updateProjectionMatrix();
  }
}
