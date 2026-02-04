import * as THREE from "three";
import Experience from "../Experience";
import ShaderPass from "./ShaderPass";
import Pointer from "./Pointer";
import mouseVert from "../glsl/mouse.vert?raw";
import externalForceFrag from "../glsl/externalForce.frag?raw";

type ExternalForceOptions = {
  /** 速度へ注入する強さ */
  strength: number;
  /** 注入円の半径（セル単位） */
  radius: number;
  /** 押してる時だけ注入するか */
  pressToApply: boolean;
};

export default class ExternalForce extends ShaderPass {
  experience: Experience;
  pointer: Pointer;
  mesh: THREE.Mesh;

  constructor(output: THREE.WebGLRenderTarget, params: { px: THREE.Vector2 }) {
    super({ output });
    this.experience = Experience.getInstance();
    this.pointer = Pointer.getInstance();

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: mouseVert,
      fragmentShader: externalForceFrag,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        px: { value: params.px },
        force: { value: new THREE.Vector2(0, 0) },
        center: { value: new THREE.Vector2(0, 0) },
        scale: { value: new THREE.Vector2(1, 1) },
      },
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  render(target: THREE.WebGLRenderTarget, options: ExternalForceOptions) {
    const { movedThisFrame, delta, position, isDown } = this.pointer.state;
    if (!movedThisFrame) return;
    if (options.pressToApply && !isDown) return;

    const strength = options.strength;
    const fx = (delta.x / 2) * strength;
    const fy = (delta.y / 2) * strength;

    const px = (this.mesh.material as THREE.ShaderMaterial).uniforms.px
      .value as THREE.Vector2;
    const radiusX = options.radius * px.x;
    const radiusY = options.radius * px.y;

    // 端にはみ出さないようにクランプ
    const cx = Math.min(Math.max(position.x, -1 + radiusX), 1 - radiusX);
    const cy = Math.min(Math.max(position.y, -1 + radiusY), 1 - radiusY);

    const uniforms = (this.mesh.material as THREE.ShaderMaterial).uniforms;
    uniforms.force.value.set(fx, fy);
    uniforms.center.value.set(cx, cy);
    uniforms.scale.value.set(options.radius, options.radius);

    this.shaderPassProps.output = target;
    this.renderToTarget(target);
  }
}
