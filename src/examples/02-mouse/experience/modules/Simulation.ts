import * as THREE from "three";
import Experience from "../Experience";
import ExternalForce from "./ExternalForce";

type FBOType = {
  // 速度
  vel_0: THREE.WebGLRenderTarget;
  vel_1: THREE.WebGLRenderTarget;

  // 粘性
  vel_viscous0: THREE.WebGLRenderTarget;
  vel_viscous1: THREE.WebGLRenderTarget;

  // pressure算出のための発散の値
  divergence: THREE.WebGLRenderTarget;

  // 圧力
  pressure_0: THREE.WebGLRenderTarget;
  pressure_1: THREE.WebGLRenderTarget;
};

export default class Simulation {
  experience: Experience;
  config: Experience["config"];
  gui: Experience["gui"];

  resolution!: number;
  /** シミュレーションのセルの横の数 */
  width!: number;
  /** シミュレーションのセルの縦の数 */
  height!: number;
  /** 1セルが正規化座標系でどれだけ大きいか */
  cellScale!: THREE.Vector2;
  planeG!: THREE.PlaneGeometry;
  fboSize!: THREE.Vector2;
  fbos!: FBOType;

  options = {
    iterations_poisson: 32,
    iterations_viscous: 32,
    mouse_force: 20,
    resolution: 0.5,
    /** 単位はセル。100セル分ってこと */
    cursor_size: 100,
    viscous: 30,
    isBounce: false,
    dt: 0.014,
    isViscous: false,
    BFECC: true,
  };

  externalForce: ExternalForce | null = null;

  constructor() {
    this.experience = Experience.getInstance();
    this.config = this.experience.config;
    this.gui = this.experience.gui;

    this.initGUI();

    this.setUp();

    console.log(
      this.width,
      this.height,
      this.cellScale,
      this.fboSize,
      this.fbos
    );

    this.createShaderPass();
  }

  private setUp() {
    this.resolution = 0.25;
    this.width = Math.round(this.config.width * this.resolution);
    this.height = Math.round(this.config.height * this.resolution);

    this.cellScale = new THREE.Vector2(1 / this.width, 1 / this.height);

    this.planeG = new THREE.PlaneGeometry(
      2 - this.cellScale.x * 2,
      2 - this.cellScale.y * 2
    );

    this.fboSize = new THREE.Vector2(this.width, this.height);

    this.fbos = {
      vel_0: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
        type: THREE.FloatType,
      }),
      vel_1: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
        type: THREE.FloatType,
      }),
      vel_viscous0: new THREE.WebGLRenderTarget(
        this.fboSize.x,
        this.fboSize.y,
        {
          type: THREE.FloatType,
        }
      ),
      vel_viscous1: new THREE.WebGLRenderTarget(
        this.fboSize.x,
        this.fboSize.y,
        {
          type: THREE.FloatType,
        }
      ),
      divergence: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
        type: THREE.FloatType,
      }),
      pressure_0: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
        type: THREE.FloatType,
      }),
      pressure_1: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
        type: THREE.FloatType,
      }),
    };
  }

  private initGUI() {
    this.gui.add(this.options, "mouse_force", 20, 200);
    this.gui.add(this.options, "cursor_size", 10, 200);
    this.gui.add(this.options, "isViscous");
    this.gui.add(this.options, "viscous", 0, 500);
    this.gui.add(this.options, "iterations_viscous", 1, 32);
    this.gui.add(this.options, "iterations_poisson", 1, 32);
    this.gui.add(this.options, "dt", 1 / 200, 1 / 30);
    this.gui.add(this.options, "BFECC");
    this.gui.close();
  }

  private createShaderPass() {
    this.externalForce = new ExternalForce({
      cellScale: this.cellScale,
      cursorSize: this.options.cursor_size,
      dst: this.fbos.vel_1,
    });
  }

  update() {
    this.externalForce?.render();
  }
}
