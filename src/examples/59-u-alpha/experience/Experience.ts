import * as THREE from "three";
import { GUI } from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
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
  gui: GUI;
  stats: Stats;
  scene: THREE.Scene;
  camera: Camera;
  renderer: Renderer;
  world: World;
  config: {
    width: number;
    height: number;
    pixelRatio: number;
  };

  constructor(canvasWrapper: HTMLDivElement) {
    Experience.instance = this;
    this.canvasWrapper = canvasWrapper;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#05070d");

    this.size = new Size();
    this.time = new Time();
    this.gui = new GUI();

    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.config = this.setConfig();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.world = new World();

    this.size.on("resize", this.resize.bind(this));
    this.time.on("tick", this.update.bind(this));
  }

  private setConfig() {
    const boundingBox = this.canvasWrapper.getBoundingClientRect();
    return {
      width: Math.max(1, boundingBox.width),
      height: Math.max(1, boundingBox.height),
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };
  }

  private resize() {
    this.config = this.setConfig();
    this.camera.resize();
    this.renderer.resize();
    this.world.resize();
  }

  private update() {
    this.stats.update();
    this.world.update();
    this.renderer.update();
  }
}
