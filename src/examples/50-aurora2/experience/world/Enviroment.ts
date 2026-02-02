import Experience from "../Experience";
import * as THREE from "three";

export default class Enviroment {
  experience: Experience;
  scene: Experience["scene"];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;

    this.setLights();
  }

  private setLights() {
    // オーロラ自体はシェーダーで描くが、雰囲気用に弱いライトを置いておく
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x0b1020, 0.2);
    this.scene.add(hemisphereLight);
  }
}
