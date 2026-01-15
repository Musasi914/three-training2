import * as THREE from "three";
import Experience from "../Experience";
// import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Camera {
  static FOV = 75;
  static NEAR = 0.1;
  static FAR = 200;
  static CAMERA_POSITION = [0, 0, 30] as const;

  instance: THREE.PerspectiveCamera;
  experience: Experience;
  scene: Experience["scene"];
  config: Experience["config"];
  cameraPole!: THREE.Object3D;
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
    camera.position.set(...Camera.CAMERA_POSITION);

    this.cameraPole = new THREE.Object3D();
    this.scene.add(this.cameraPole);
    this.cameraPole.add(camera);

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

    const distance =
      this.config.height / (2 * Math.tan(((Camera.FOV / 2) * Math.PI) / 180));
    this.instance.position.set(0, 0, distance);
  }
}
