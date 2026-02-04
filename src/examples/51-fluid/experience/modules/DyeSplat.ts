import * as THREE from "three";
import ShaderPass from "./ShaderPass";
import Pointer from "./Pointer";
import mouseVert from "../glsl/mouse.vert?raw";
import dyeSplatFrag from "../glsl/dyeSplat.frag?raw";

type DyeSplatOptions = {
  radius: number;
  intensity: number;
  color: THREE.Color;
  pressToApply: boolean;
};

export default class DyeSplat extends ShaderPass {
  pointer: Pointer;
  mesh: THREE.Mesh;

  constructor(output: THREE.WebGLRenderTarget, params: { px: THREE.Vector2 }) {
    super({ output });
    this.pointer = Pointer.getInstance();

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: mouseVert,
      fragmentShader: dyeSplatFrag,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        px: { value: params.px },
        center: { value: new THREE.Vector2(0, 0) },
        scale: { value: new THREE.Vector2(1, 1) },
        intensity: { value: 1.0 },
        color: { value: new THREE.Color("#2affff") },
      },
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  render(target: THREE.WebGLRenderTarget, options: DyeSplatOptions) {
    const { movedThisFrame, position, isDown } = this.pointer.state;
    if (!movedThisFrame) return;
    if (options.pressToApply && !isDown) return;

    const px = (this.mesh.material as THREE.ShaderMaterial).uniforms.px
      .value as THREE.Vector2;
    const radiusX = options.radius * px.x;
    const radiusY = options.radius * px.y;

    const cx = Math.min(Math.max(position.x, -1 + radiusX), 1 - radiusX);
    const cy = Math.min(Math.max(position.y, -1 + radiusY), 1 - radiusY);

    const uniforms = (this.mesh.material as THREE.ShaderMaterial).uniforms;
    uniforms.center.value.set(cx, cy);
    uniforms.scale.value.set(options.radius, options.radius);
    uniforms.intensity.value = options.intensity;
    (uniforms.color.value as THREE.Color).copy(options.color);

    this.shaderPassProps.output = target;
    this.renderToTarget(target);
  }
}
