// import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import Experience from "../Experience";
// import * as THREE from "three";

export class Environment {
  experience: Experience;
  scene: Experience["scene"];
  renderer: Experience["renderer"];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;

    // this.setBackground();
    // // this.setAmbientLight();
    // this.setDirectionalLight();
    // this.setSpotLight();
  }

  // private async setBackground() {
  //   const loader = new HDRLoader();
  //   const envMap = await loader.loadAsync("/enviromentMaps/sogen/2k.hdr");
  //   envMap.mapping = THREE.EquirectangularReflectionMapping;
  //   this.scene.environment = envMap;
  //   this.scene.background = envMap;
  // }

  // private setAmbientLight() {
  //   const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  //   this.scene.add(ambientLight);
  // }

  // private setDirectionalLight() {
  //   const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  //   directionalLight.position.set(1, 1, 1);
  //   directionalLight.castShadow = true;
  //   directionalLight.shadow.mapSize.width = 1024;
  //   directionalLight.shadow.mapSize.height = 1024;
  //   this.scene.add(directionalLight);
  // }

  // private setSpotLight() {
  //   const spotLight = new THREE.SpotLight(0xffffff, 60);
  //   this.scene.add(spotLight);
  // }
}
