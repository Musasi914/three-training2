import Example from "../Example";
import Experience from "../Experience";

export class World {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  example: Example | null = null;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    this.resource = this.experience.resource;
    this.resource.on("ready", () => {
      console.log("resource ready");
    });

    this.example = new Example();
  }

  resize() {
    this.example?.resize();
  }

  update() {
    this.example?.update();
  }
}
