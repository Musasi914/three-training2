import * as THREE from "three";
import Experience from "../Experience";
// import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Camera {
  instance: THREE.OrthographicCamera;
  experience: Experience;
  scene: Experience["scene"];
  config: Experience["config"];
  // controls: OrbitControls;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.config = this.experience.config;

    this.instance = this.setInstance();
    // this.controls = this.setOrbitControls();
  }

  private setInstance() {
    const camera = new THREE.OrthographicCamera(
      -1,1,1,-1,-1,1
    );
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
    this.instance.updateProjectionMatrix();
  }
}
