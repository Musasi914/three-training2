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
    // this.setAmbientLight();
    this.setDirectionalLight();
  }

  // private async setBackground() {
  //   const envMap = await this.loader.loadAsync("/enviromentMaps/sogen/2k.hdr");
  //   envMap.mapping = THREE.EquirectangularReflectionMapping;
  //   this.scene.environment = envMap;
  //   this.scene.background = envMap;
  // }

  private async setBackground() {
    const loader = new THREE.CubeTextureLoader().setPath(
      "/enviromentMaps/town/"
    );
    const cubeTexture = await loader.loadAsync([
      "px.jpg",
      "nx.jpg",
      "py.jpg",
      "ny.jpg",
      "pz.jpg",
      "nz.jpg",
    ]);
    this.scene.background = cubeTexture;
    this.scene.environment = cubeTexture;
  }

  // private setAmbientLight() {
  //   const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  //   this.scene.add(ambientLight);
  // }

  private setDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0.5, 2.5, -5);
    this.scene.add(directionalLight);
  }
}
