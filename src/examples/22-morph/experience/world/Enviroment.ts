// import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import Experience from "../Experience";
import * as THREE from "three";

export class Environment {
  experience: Experience;
  scene: Experience["scene"];
  renderer: Experience["renderer"];

  directionalLight!: THREE.DirectionalLight;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;

    // this.setBackground();
    this.setAmbientLight();
    this.setDirectionalLight();
    // this.setSpotLight();
  }

  // private async setBackground() {
  //   const loader = new HDRLoader();
  //   const envMap = await loader.loadAsync("/enviromentMaps/2k.hdr");
  //   envMap.mapping = THREE.EquirectangularReflectionMapping;
  //   this.scene.environment = envMap;
  //   this.scene.background = envMap;
  // }

  private setAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);
  }

  private setDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    this.directionalLight.position.set(0, 10, 5);
    this.directionalLight.target.position.set(-5, 0, 0);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 512;
    this.directionalLight.shadow.mapSize.height = 512;
    // directionalLight.shadow.camera.near = 1;
    // directionalLight.shadow.camera.far = 5;
    // directionalLight.shadow.bias = 0.001;
    // directionalLight.shadow.normalBias = 0.001;
    // directionalLight.shadow.camera.left = -7;
    // directionalLight.shadow.camera.right = 7;
    // directionalLight.shadow.camera.top = 7;
    // directionalLight.shadow.camera.bottom = -7;
    this.directionalLight.layers.enable(1);
    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
  }

  // private setSpotLight() {
  //   const spotLight = new THREE.SpotLight(0xffffff, 60);
  //   this.scene.add(spotLight);
  // }
}
