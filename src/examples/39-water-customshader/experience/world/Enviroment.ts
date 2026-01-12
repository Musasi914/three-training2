import { HDRLoader } from "three/examples/jsm/Addons.js";
import Experience from "../Experience";
import * as THREE from "three";

export default class Enviroment {
  experience: Experience;
  scene: Experience["scene"];
  loader: HDRLoader;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;

    this.loader = new HDRLoader();

    this.setBackground();
    this.setDirectionalLight();
  }

  private async setBackground() {
    const envMap = await this.loader.loadAsync("/enviromentMaps/sogen/2k.hdr");
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.environment = envMap;
    this.scene.background = envMap;
  }

  private setDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 10, -5);
    this.scene.add(directionalLight);
  }
}
