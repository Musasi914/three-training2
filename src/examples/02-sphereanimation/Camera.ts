import * as THREE from "three";
import Experience from "./Experience";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// この例専用のカメラ設定（01-animationとは異なる設定）
const FOV = 50;
const NEAR = 0.1;
const FAR = 200;
const CAMERA_POSITION: [number, number, number] = [0, 5, 10]; // より高い位置から見下ろす

export class Camera {
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
      FOV,
      this.config.width / this.config.height,
      NEAR,
      FAR
    );
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(0, 0, 0); // 原点を向く
    this.scene.add(camera);
    return camera;
  }

  private setOrbitControls() {
    const controls = new OrbitControls(
      this.instance,
      this.experience.canvasWrapper
    );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    return controls;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.aspect = this.config.width / this.config.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}

