import { Camera } from "./base/Camera";
import { Renderer } from "./base/Renderer";
import { Resource } from "./base/Resource";
import { Size } from "@shared/utils/Size";
import { Time } from "@shared/utils/Time";
import * as THREE from "three";
import { World } from "./world/World";
import { GUI } from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { sources } from "./source";
// import { Environment } from "./world/Enviroment";

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
  resource: Resource;
  // enviroment: Environment;
  world: World;
  config: {
    width: number;
    height: number;
    pixelRatio: number;
  };

  constructor(canvasWrapper: HTMLDivElement) {
    Experience.instance = this;
    this.canvasWrapper = canvasWrapper;

    this.size = new Size();

    this.time = new Time();

    this.gui = new GUI();
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.config = this.setConfig();

    this.scene = new THREE.Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.resource = new Resource(sources);

    // this.enviroment = new Environment();
    this.world = new World();

    this.size.on("resize", this.resize.bind(this));
    this.time.on("tick", this.update.bind(this));
  }

  private setConfig() {
    const boundingBox = this.canvasWrapper.getBoundingClientRect();
    return {
      width: boundingBox.width,
      height: boundingBox.height,
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
    this.renderer.update();
    this.world.update();
  }
}
