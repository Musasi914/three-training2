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
import Enviroment from "./world/Enviroment";

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
  pickingScene: THREE.Scene;
  camera: Camera;
  renderer: Renderer;
  resource: Resource;
  world: World;
  config: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  enviroment: Enviroment;

  constructor(canvasWrapper: HTMLDivElement) {
    Experience.instance = this;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x85d5bb, 0.04);
    this.pickingScene = new THREE.Scene();
    this.pickingScene.background = new THREE.Color(0x000000);
    this.canvasWrapper = canvasWrapper;

    this.size = new Size();

    this.time = new Time();

    this.gui = new GUI();
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.config = this.setConfig();

    this.camera = new Camera();
    this.renderer = new Renderer();
    this.resource = new Resource(sources);

    this.world = new World();
    this.enviroment = new Enviroment();

    this.size.on("resize", this.resize.bind(this));
    this.time.on("tick", this.update.bind(this));

    this.gui
      .add(this.enviroment.directionalLight, "intensity")
      .name("Light Intensity")
      .min(0)
      .max(4)
      .step(0.01);
    this.gui
      .add(this.enviroment.directionalLight.shadow, "bias")
      .name("Light Shadow Bias")
      .min(-0.01)
      .max(0.01)
      .step(0.0001);
    this.gui
      .add(this.enviroment.directionalLight.shadow, "normalBias")
      .name("Light Shadow Normal Bias")
      .min(-0.1)
      .max(0.1)
      .step(0.001);
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
