import Experience from "./Experience";
import * as THREE from "three";

type SceneInfo = {
  mesh: THREE.Mesh;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  elem: HTMLSpanElement;
};

export default class Example {
  private experience: Experience;
  private scene: Experience["scene"];
  private gui: Experience["gui"];
  private renderer: THREE.WebGLRenderer;

  private sceneInfo1: SceneInfo;
  private sceneInfo2: SceneInfo;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.gui.hide();
    this.renderer = this.experience.renderer.instance;

    this.createLight();

    this.sceneInfo1 = this.setupScene1();
    this.sceneInfo2 = this.setupScene2();
  }

  private createLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-1, 2, 4);
    this.scene.add(directionalLight);
  }

  private setupScene1() {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: "red" })
    );
    this.scene.add(box);

    return {
      mesh: box,
      scene: this.scene,
      camera: this.experience.camera.instance,
      elem: document.querySelector("#box") as HTMLSpanElement,
    };
  }

  private setupScene2() {
    const scene = new THREE.Scene();

    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.set(0, 1, 2);
    camera.lookAt(0, 0, 0);

    const pyramid = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 4, 2),
      new THREE.MeshPhongMaterial({ color: "blue" })
    );
    scene.add(pyramid);
    scene.add(new THREE.DirectionalLight(0xffffff, 5));

    return {
      mesh: pyramid,
      scene: scene,
      camera: camera,
      elem: document.querySelector("#pyramid") as HTMLSpanElement,
    };
  }

  resize() {}

  private setScissorForElement(sceneInfo: SceneInfo) {
    const { elem, camera, scene } = sceneInfo;

    const { left, right, top, bottom, width, height } =
      elem.getBoundingClientRect();

    const margin = height;
    const isOffscreen =
      bottom < -margin ||
      top > this.renderer.domElement.clientHeight + margin ||
      right < -margin ||
      left > this.renderer.domElement.clientWidth + margin;

    if (isOffscreen) {
      return;
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const positiveYUpBottom = this.renderer.domElement.clientHeight - bottom;
    this.renderer.setScissor(left, positiveYUpBottom, width, height);
    this.renderer.setViewport(left, positiveYUpBottom, width, height);

    this.renderer.render(scene, camera);
  }

  update() {
    const transform = window.scrollY;
    this.renderer.domElement.style.transform = `translateY(${transform}px)`;

    this.renderer.setScissorTest(true);
    this.setScissorForElement(this.sceneInfo1);
    this.setScissorForElement(this.sceneInfo2);

    this.sceneInfo1.mesh.rotation.y += 0.01;
    this.sceneInfo2.mesh.rotation.y += 0.01;
  }
}
