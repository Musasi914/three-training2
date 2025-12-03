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
    console.log("resource", this.resource);
    this.resource.on("ready", () => {
      this.example = new Example();
    });
  }

  update() {
    this.example?.update();
  }
}
