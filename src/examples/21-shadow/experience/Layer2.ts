import Experience from "./Experience";
import * as THREE from "three";

export default class Layer2 {
  experience: Experience;
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  sphereMesh!: THREE.Mesh;
  cubeMesh!: THREE.Mesh;
  gui!: Experience["gui"];
  cameraHelper!: THREE.CameraHelper;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.gui = this.experience.gui;

    this.createMeshes();
    this.createLightHelper();
    this.setLayers();
    this.createGUI();
  }

  private createMeshes() {
    const sphereRadius = 3;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 32, 16);
    const sphereMat = new THREE.MeshPhongMaterial({ color: "#ca8" });
    this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.sphereMesh.castShadow = true;
    this.sphereMesh.receiveShadow = true;
    this.sphereMesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    this.scene.add(this.sphereMesh);

    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: "#8ac" });
    this.cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    this.cubeMesh.castShadow = true;
    this.cubeMesh.receiveShadow = true;
    this.cubeMesh.position.set(cubeSize + 1, cubeSize / 2, 0);
    this.scene.add(this.cubeMesh);
  }

  private createLightHelper() {
    this.cameraHelper = new THREE.CameraHelper(
      this.experience.enviroment.directionalLight.shadow.camera
    );
    this.cameraHelper.layers.set(1);
    this.scene.add(this.cameraHelper);
  }

  private setLayers() {
    this.sphereMesh.layers.set(1);
    this.cubeMesh.layers.set(1);
  }

  private createGUI() {
    this.gui
      .add(this.experience.enviroment.directionalLight, "intensity")
      .name("Light Intensity")
      .min(0)
      .max(4)
      .step(0.01);

    const lightPositionFolder = this.gui.addFolder("Light Position");
    lightPositionFolder
      .add(this.experience.enviroment.directionalLight.position, "x")
      .name("Light Position X")
      .min(-10)
      .max(10)
      .step(0.01);
    lightPositionFolder
      .add(this.experience.enviroment.directionalLight.position, "y")
      .name("Light Position Y")
      .min(-10)
      .max(10)
      .step(0.01);
    lightPositionFolder
      .add(this.experience.enviroment.directionalLight.position, "z")
      .name("Light Position Z")
      .min(-10)
      .max(10)
      .step(0.01);

    const lightTargetFolder = this.gui.addFolder("Light Target");
    lightTargetFolder
      .add(this.experience.enviroment.directionalLight.target.position, "x")
      .name("Light Target X")
      .min(-10)
      .max(10)
      .step(0.01);
    lightTargetFolder
      .add(this.experience.enviroment.directionalLight.target.position, "y")
      .name("Light Target Y")
      .min(-10)
      .max(10)
      .step(0.01);
    lightTargetFolder
      .add(this.experience.enviroment.directionalLight.target.position, "z")
      .name("Light Target Z")
      .min(-10)
      .max(10)
      .step(0.01);

    this.gui
      .add(this.experience.enviroment.directionalLight.shadow.camera, "right")
      .name("Right")
      .min(-10)
      .max(10)
      .step(0.01)
      .onChange(this.updateCamera.bind(this));
    this.gui
      .add(this.experience.enviroment.directionalLight.shadow.camera, "left")
      .name("Left")
      .min(-10)
      .max(10)
      .step(0.01)
      .onChange(this.updateCamera.bind(this));
    this.gui
      .add(this.experience.enviroment.directionalLight.shadow.camera, "top")
      .name("Top")
      .min(-10)
      .max(10)
      .step(0.01)
      .onChange(this.updateCamera.bind(this));
    this.gui
      .add(this.experience.enviroment.directionalLight.shadow.camera, "bottom")
      .name("Bottom")
      .min(-10)
      .max(10)
      .step(0.01)
      .onChange(this.updateCamera.bind(this));
    this.gui
      .add(this.experience.enviroment.directionalLight.shadow.camera, "near")
      .name("Near")
      .min(0)
      .max(10)
      .step(0.01)
      .onChange(this.updateCamera.bind(this));
    this.gui
      .add(this.experience.enviroment.directionalLight.shadow.camera, "far")
      .name("Far")
      .min(0)
      .max(10)
      .step(0.01)
      .onChange(this.updateCamera.bind(this));
  }

  private updateCamera() {
    this.experience.enviroment.directionalLight.shadow.camera.updateProjectionMatrix();
    this.cameraHelper.update();
  }
}
