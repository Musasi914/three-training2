import type { Props } from "../type/type";
import ShaderPass from "./ShaderPass";
import * as THREE from "three";
import mouse_vert from "../glsl/mouse.vert?raw";
import externalForce_frag from "../glsl/externalForce.frag?raw";
import Mouse from "./Mouse";

/**
 * 呼び出しは以下
 * this.externalForce = new ExternalForce({
 *   cellScale: this.cellScale,
 *   cursorSize: this.options.cursor_size,
 *   dst: this.fbos.vel_1,
 * });
 */

/**
 * 重要なポイント
 * 1. 加算ブレンディング
 * 既存の速度に上書きではなく、加算する
 * 2. 境界処理
 * カーソルが画面外に出ないよう、位置をクランプ
 * 3. 力の方向
 * マウスの移動方向（diff）から力を計算し、移動方向に流れを作る
 * 4. 円形の力場
 * フラグメントシェーダーで中心から距離に応じた減衰を適用（滑らかに）
 */



export default class ExternalForce extends ShaderPass {
  mouseMesh!: THREE.Mesh;
  mouse: Mouse;
  props: Props;

  constructor(props: Props) {
    // shaderPassPropsを渡す
    super({
      output: props.dst,
    });

    this.props = props;

    this.mouse = Mouse.getInstance();

    this.init(this.props);
  }

  private init(props: Props) {
    const mouseGeometry = new THREE.PlaneGeometry(1, 1);
    const mouseMaterial = new THREE.ShaderMaterial({
      vertexShader: mouse_vert,
      fragmentShader: externalForce_frag,
      blending: THREE.AdditiveBlending,
      uniforms: {
        px: {
          value: props.cellScale,
        },
        force: {
          value: new THREE.Vector2(),
        },
        center: {
          value: new THREE.Vector2(),
        },
        scale: {
          value: new THREE.Vector2(props.cursorSize, props.cursorSize),
        },
      },
    });
    this.mouseMesh = new THREE.Mesh(mouseGeometry, mouseMaterial);
    this.scene.add(this.mouseMesh);
  }

  render() {
    if (!this.props.cellScale) return;

    const forceX = this.mouse.diff.x * 10;
    const forceY = this.mouse.diff.y * 10;

    // 正規化されたカーソルの大きさ
    const cursorSizeX =
      this.props.cursorSize *
      this.props.cellScale.x;

    const cursorSizeY =
      this.props.cursorSize *
      this.props.cellScale.y;

    const centerX = Math.min(
      Math.max(
        this.mouse.coords.x,
        -1 + cursorSizeX + this.props.cellScale.x * 2
      ),
      1 - cursorSizeX - this.props.cellScale.x * 2
    );

    const centerY = Math.min(
      Math.max(
        this.mouse.coords.y,
        -1 + cursorSizeY + this.props.cellScale.y * 2
      ),
      1 - cursorSizeY - this.props.cellScale.y * 2
    );

    const uniforms = (this.mouseMesh.material as THREE.ShaderMaterial).uniforms;

    uniforms.force.value.set(forceX, forceY);
    uniforms.center.value.set(centerX, centerY);
    uniforms.scale.value.set(
      this.props.cursorSize,
      this.props.cursorSize
    );

    super.update();
  }
}
