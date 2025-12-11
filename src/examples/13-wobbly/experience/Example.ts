import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.setEnvMap();
  }

  private setEnvMap() {
    const envMap = this.resource.items.envMap;
    this.scene.environment = envMap;
    this.scene.background = envMap;
  }

  update() {}
}
