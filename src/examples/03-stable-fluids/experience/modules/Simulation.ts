import * as THREE from "three";
import Experience from "../Experience";
import ExternalForce from "./ExternalForce";
import Advection from "./Advection";
import Divergence from "./Divergence";
import Poisson from "./Poisson";
import Pressure from "./Pressure";

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
    /** 単位はセル。50セル分ってこと */
    cursor_size: 100,
    viscous: 30,
    isBounce: false,
    dt: 0.014,
    isViscous: false,
    BFECC: false,
  };

  externalForce: ExternalForce | null = null;
  advection: Advection | null = null;
  divergence: Divergence | null = null;
  boundarySpace: THREE.Vector2;
  poisson: Poisson | null = null;
  pressure: Pressure | null = null;

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

    this.boundarySpace = new THREE.Vector2(0, 0);

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

    this.advection = new Advection({
      cellScale: this.cellScale,
      fboSize: this.fboSize,
      dt: this.options.dt,
      src: this.fbos.vel_0,
      dst: this.fbos.vel_1,
    });

    this.divergence = new Divergence({
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.vel_1,
      dst: this.fbos.divergence,
      dt: this.options.dt,
    });

    this.poisson = new Poisson({
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.divergence,
      dst: this.fbos.pressure_1,
      dst_: this.fbos.pressure_0,
    });

    this.pressure = new Pressure({
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src_p: this.fbos.pressure_0,
      src_v: this.fbos.vel_1,
      dst: this.fbos.vel_0,
      dt: this.options.dt,
    });

    // iOSデバイス検出（iPhone/iPad/iPodを網羅）
    // iPadOS 13以降のiPadは「MacIntel」として報告される場合があるため、
    // maxTouchPointsも確認して確実に検出する
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    console.log(navigator);
    document.body.appendChild(document.createElement("div")).innerHTML =
      navigator.userAgent;
  }

  update() {
    if (this.options.isBounce) {
      this.boundarySpace.set(0, 0);
    } else {
      this.boundarySpace.copy(this.cellScale);
    }

    // 1. 移流: vel_0を読み込んでvel_1に書き込む
    this.advection?.update({
      dt: this.options.dt,
      isBounce: this.options.isBounce,
      BFECC: this.options.BFECC,
    });
    // 2. 外部力: vel_1に加算（加算ブレンディング）
    this.externalForce?.render({
      cursor_size: this.options.cursor_size,
      mouse_force: this.options.mouse_force,
      cellScale: this.cellScale,
    });
    // 3. 発散の計算: vel_1を読み込む
    this.divergence?.render({ vel: this.fbos.vel_1 });
    const pressure = this.poisson?.render({
      iterations: this.options.iterations_poisson,
    });

    if (!pressure) return;
    this.pressure?.render({ vel: this.fbos.vel_1, pressure });
  }
}
