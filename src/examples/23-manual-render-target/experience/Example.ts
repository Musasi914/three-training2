import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  renderTarget!: THREE.WebGLRenderTarget;
  rtScene!: THREE.Scene;
  rtCamera!: THREE.PerspectiveCamera;
  rtPlane!: THREE.Mesh;

  box!: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    this.renderTarget = this.createRenderTarget();

    this.createBox();
  }

  createRenderTarget() {
    const renderTarget = new THREE.WebGLRenderTarget(256, 256);
    this.rtScene = new THREE.Scene();
    this.rtPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    this.rtScene.add(this.rtPlane);
    this.rtCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.rtCamera.position.set(0, 0, 5);
    this.rtScene.add(this.rtCamera);

    return renderTarget;
  }

  private createBox() {
    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ map: this.renderTarget.texture })
    );
    this.scene.add(this.box);
  }

  resize() {}

  update() {
    this.box.rotation.x += 0.01;
    this.box.rotation.y += 0.01;

    this.rtPlane.rotation.x += 0.01;
    this.rtPlane.rotation.y += 0.01;

    this.renderer.instance.setRenderTarget(this.renderTarget);
    this.renderer.instance.render(this.rtScene, this.rtCamera);
    this.renderer.instance.setRenderTarget(null);

    this.renderer.instance.render(this.scene, this.experience.camera.instance);
  }
}
