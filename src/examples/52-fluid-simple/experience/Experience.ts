import * as THREE from "three";
import { Size } from "@shared/utils/Size";
import { Time } from "@shared/utils/Time";
import { Camera } from "./base/Camera";
import { Renderer } from "./base/Renderer";
import { World } from "./world/World";

export default class Experience {
  static instance: Experience;
  static getInstance(): Experience {
    return this.instance;
  }

  canvasWrapper: HTMLDivElement;
  size: Size;
  time: Time;
  scene: THREE.Scene;
  camera: Camera;
  renderer: Renderer;
  world: World;
  config: { width: number; height: number; pixelRatio: number };

  constructor(canvasWrapper: HTMLDivElement) {
    Experience.instance = this;

    this.canvasWrapper = canvasWrapper;
    this.scene = new THREE.Scene();

    this.size = new Size();
    this.time = new Time();

    this.config = this.getConfig();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.world = new World();

    this.size.on("resize", this.resize.bind(this));
    this.time.on("tick", this.update.bind(this));
  }

  private getConfig() {
    const rect = this.canvasWrapper.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };
  }

  private resize() {
    this.config = this.getConfig();
    this.camera.resize();
    this.renderer.resize();
    this.world.resize();
  }

  private update() {
    this.world.update();
    this.renderer.render();
  }
}

