import * as THREE from "three";
import Experience from "../Experience";

type PointerState = {
  /** -1..1 (NDC) */
  position: THREE.Vector2;
  /** 前フレームとの差分（NDC） */
  delta: THREE.Vector2;
  /** 前フレームの position */
  previous: THREE.Vector2;
  /** 押下中（mouse/touch/pen） */
  isDown: boolean;
  /** 前フレームから現在までに move を受けたか */
  movedSinceLastUpdate: boolean;
  /** 今フレームで move が発生したか（update() 後に参照する） */
  movedThisFrame: boolean;
};

export default class Pointer {
  static instance: Pointer;
  static getInstance(): Pointer {
    return this.instance;
  }

  experience: Experience;
  canvasWrapper: Experience["canvasWrapper"];

  state: PointerState;

  constructor() {
    Pointer.instance = this;

    this.experience = Experience.getInstance();
    this.canvasWrapper = this.experience.canvasWrapper;

    this.state = {
      position: new THREE.Vector2(0, 0),
      previous: new THREE.Vector2(0, 0),
      delta: new THREE.Vector2(0, 0),
      isDown: false,
      movedSinceLastUpdate: false,
      movedThisFrame: false,
    };

    this.bind();
  }

  private bind() {
    // ポインタ系APIに統一（マウス/タッチ/ペン）
    const el = this.canvasWrapper;
    el.style.touchAction = "none";

    el.addEventListener("pointerdown", (e) => {
      this.state.isDown = true;
      this.updateFromEvent(e);
      // 押下直後に巨大なdeltaが出ないよう初期化
      this.state.previous.copy(this.state.position);
      this.state.delta.set(0, 0);
      el.setPointerCapture?.(e.pointerId);
    });

    el.addEventListener("pointermove", (e) => {
      this.updateFromEvent(e);
    });

    const up = (e: PointerEvent) => {
      this.state.isDown = false;
      this.updateFromEvent(e);
      this.state.previous.copy(this.state.position);
      this.state.delta.set(0, 0);
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
    const rect = this.canvasWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    this.state.position.set(x, y);
    this.state.movedSinceLastUpdate = true;
  }

  update() {
    this.state.movedThisFrame = this.state.movedSinceLastUpdate;
    this.state.delta.subVectors(this.state.position, this.state.previous);
    this.state.previous.copy(this.state.position);
    this.state.movedSinceLastUpdate = false;
  }
}
