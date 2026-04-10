import Example from "../Example";
import Experience from "../Experience";

export class World {
  experience: Experience;
  scene: Experience["scene"];
  resource: Experience["resource"];
  example: Example | null = null;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;

    this.resource = this.experience.resource;
    this.resource.on("ready", () => {
      this.example = new Example();
    });
  }

  resize() {
    this.example?.resize();
  }

  update() {
    this.example?.update();
  }
}
