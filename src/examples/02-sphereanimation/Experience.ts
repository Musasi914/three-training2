import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { Size } from "@shared/utils/Size";
import { Time } from "@shared/utils/Time";
import * as THREE from "three";
import { World } from "./World";
import { GUI } from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module.js";

export default class Experience {
  static instance: Experience;
  static getInstance(): Experience {
    return this.instance;
  }

  canvasWrapper: HTMLDivElement;
  config: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  size: Size;
  time: Time;
  gui: GUI;
  stats: Stats;
  scene: THREE.Scene;
  camera: Camera;
  renderer: Renderer;
  world: World;

  constructor(canvasWrapper: HTMLDivElement) {
    // 既にインスタンスが存在する場合は破棄（ホットリロード対応）
    if (Experience.instance) {
      Experience.instance.dispose();
    }
    
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
  }

  private update() {
    this.camera.update();
    this.renderer.update();
    this.world.update();
    this.stats.update();
  }

  dispose() {
    // クリーンアップ処理
    this.size.off("resize");
    this.time.off("tick");
    this.renderer.instance.dispose();
    this.gui.destroy();
    if (this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }
  }
}

