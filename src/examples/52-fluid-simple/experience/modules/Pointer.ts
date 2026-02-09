import * as THREE from "three";
import Experience from "../Experience";

type PointerState = {
  /** 0..1 (UV) */
  uv: THREE.Vector2;
  /** 前フレームとの差分（UV） */
  deltaUv: THREE.Vector2;
  /** 前フレームの uv */
  previousUv: THREE.Vector2;
  /** 押下中（mouse/touch/pen） */
  isDown: boolean;
  /** 前フレームから move を受けたか */
  movedSinceLastUpdate: boolean;
  /** 今フレームで move が発生したか（update() 後に参照する） */
  movedThisFrame: boolean;
};

export default class Pointer {
  private experience: Experience;
  private el: HTMLDivElement;
  state: PointerState;

  constructor() {
    this.experience = Experience.getInstance();
    this.el = this.experience.canvasWrapper;

    this.state = {
      uv: new THREE.Vector2(0.5, 0.5),
      previousUv: new THREE.Vector2(0.5, 0.5),
      deltaUv: new THREE.Vector2(0, 0),
      isDown: false,
      movedSinceLastUpdate: false,
      movedThisFrame: false,
    };

    this.bind();
  }

  private bind() {
    const el = this.el;
    el.style.touchAction = "none";

    el.addEventListener("pointerdown", (e) => {
      this.state.isDown = true;
      this.updateFromEvent(e);
      // 押下直後に巨大なdeltaが出ないよう初期化
      this.state.previousUv.copy(this.state.uv);
      this.state.deltaUv.set(0, 0);
      el.setPointerCapture?.(e.pointerId);
    });

    el.addEventListener("pointermove", (e) => {
      this.updateFromEvent(e);
    });

    const up = (e: PointerEvent) => {
      this.state.isDown = false;
      this.updateFromEvent(e);
      this.state.previousUv.copy(this.state.uv);
      this.state.deltaUv.set(0, 0);
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", () => {
      this.state.isDown = false;
    });
  }

  private updateFromEvent(e: PointerEvent) {
    const rect = this.el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;

    this.state.uv.set(x, y);
    this.state.movedSinceLastUpdate = true;
  }

  update() {
    this.state.movedThisFrame = this.state.movedSinceLastUpdate;
    this.state.deltaUv.subVectors(this.state.uv, this.state.previousUv);
    this.state.previousUv.copy(this.state.uv);
    this.state.movedSinceLastUpdate = false;
  }
}

