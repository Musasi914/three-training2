import Experience from "../Experience";
import { Example } from "../Example";

export class World {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  example: Example;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    this.example = new Example();
  }

  resize() {
    this.example.resize();
  }

  update() {
    this.example.update();
  }
}
