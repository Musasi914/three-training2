import { OrbitControls } from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  material: THREE.ShaderMaterial | null = null;
  view1El: HTMLDivElement;
  view2El: HTMLDivElement;

  camera2!: THREE.PerspectiveCamera;
  cameraHelper1!: THREE.CameraHelper;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.createPlane();
    this.createCube();
    this.createSphere();

    this.createCameraHelper();

    this.view1El = document.querySelector("#view1") as HTMLDivElement;
    this.view2El = document.querySelector("#view2") as HTMLDivElement;

    // view1のカメラを操作できるようにする
    // const controls = new OrbitControls(
    //   this.experience.camera.instance,
    //   this.view1El
    // );

    this.createView2Camera();
  }

  private createPlane() {
    const planeSize = 40;
    const texture = this.resource.items.board;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }
  private createCube() {
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: "#8ac" });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(cubeSize + 1, cubeSize / 2, 0);
    cube.castShadow = true;
    this.scene.add(cube);
  }
  private createSphere() {
    const sphereSize = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(
      sphereSize,
      sphereWidthDivisions,
      sphereHeightDivisions
    );
    const sphereMat = new THREE.MeshPhongMaterial({ color: "#ca8" });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(-sphereSize - 1, sphereSize + 2, 0);
    sphere.castShadow = true;
    this.scene.add(sphere);
  }

  private createCameraHelper() {
    this.cameraHelper1 = new THREE.CameraHelper(
      this.experience.camera.instance
    );
    this.scene.add(this.cameraHelper1);
  }

  private createView2Camera() {
    this.camera2 = new THREE.PerspectiveCamera(60, 2, 0.1, 500);
    this.camera2.position.set(40, 10, 30);
    this.camera2.lookAt(0, 5, 0);

    const controls2 = new OrbitControls(this.camera2, this.view2El);
    controls2.target.set(0, 5, 0);
    controls2.update();
  }

  private setScissorForElement(el: HTMLDivElement) {
    const canvasRect = this.experience.canvasWrapper.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // compute a canvas relative rectangle
    const right = Math.min(elRect.right, canvasRect.right) - canvasRect.left;
    const left = Math.max(elRect.left - canvasRect.left, 0);
    const bottom = Math.min(elRect.bottom, canvasRect.bottom) - canvasRect.top;
    const top = Math.max(0, elRect.top - canvasRect.top);

    const width = Math.min(canvasRect.width, right - left);
    const height = Math.min(canvasRect.height, bottom - top);

    this.experience.renderer.instance.setScissor(left, top, width, height);
    this.experience.renderer.instance.setViewport(left, top, width, height);

    return width / height;
  }

  update() {
    this.experience.renderer.instance.setScissorTest(true);

    const aspect1 = this.setScissorForElement(this.view1El);
    this.experience.camera.instance.left = -aspect1;
    this.experience.camera.instance.right = aspect1;
    // this.experience.camera.instance.aspect = aspect1;
    this.experience.camera.instance.updateProjectionMatrix();
    this.cameraHelper1.update();
    this.cameraHelper1.visible = false;
    this.experience.renderer.instance.render(
      this.scene,
      this.experience.camera.instance
    );

    const aspect2 = this.setScissorForElement(this.view2El);
    this.camera2.aspect = aspect2;
    this.camera2.updateProjectionMatrix();
    this.cameraHelper1.visible = true;
    this.experience.renderer.instance.render(this.scene, this.camera2);
  }
}
