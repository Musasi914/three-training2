import * as THREE from "three";
import Experience from "../Experience";

export default class Mouse {
  static instance: Mouse;
  static getInstance(): Mouse {
    return this.instance;
  }

  experience: Experience;
  config: Experience["config"];

  mouseMoved: boolean;
  coords: THREE.Vector2;
  coords_old: THREE.Vector2;
  diff: THREE.Vector2;
  count: number;
  timer: number | null = null;
  constructor() {
    Mouse.instance = this;

    this.experience = Experience.getInstance();
    this.config = this.experience.config;

    this.mouseMoved = false;
    this.coords = new THREE.Vector2();
    this.coords_old = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.count = 0;

    this.init();
  }

  private init() {
    this.experience.canvasWrapper.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this)
    );
  }

  private onMouseMove(event: MouseEvent) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.coords.set(
      (event.clientX / this.config.width) * 2 - 1,
      -((event.clientY / this.config.height) * 2 - 1)
    );
    this.mouseMoved = true;

    this.timer = setTimeout(() => {
      this.mouseMoved = false;
    }, 100);
  }

  update() {
    this.diff.subVectors(this.coords, this.coords_old);

    this.coords_old.copy(this.coords);
  }
}
