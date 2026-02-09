import Experience from "../Experience";
import { Example } from "../Example";

export class World {
  private example: Example;

  constructor() {
    // 他のExample群と揃えて、Singleton 初期化を前提にする
    Experience.getInstance();
    this.example = new Example();
  }

  resize() {
    this.example.resize();
  }

  update() {
    this.example.update();
  }
}

