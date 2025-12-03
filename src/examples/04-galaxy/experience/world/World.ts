import Galaxy from "../Galaxy";
import Experience from "../Experience";

export class World {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  galaxy: Galaxy | null = null;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    this.resource = this.experience.resource;
    console.log("resource", this.resource);
    this.galaxy = new Galaxy();
  }
}
