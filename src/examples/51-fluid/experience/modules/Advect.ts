import * as THREE from "three";
import ShaderPass from "./ShaderPass";
import faceVert from "../glsl/face.vert?raw";
import advectFrag from "../glsl/advect.frag?raw";

type AdvectParams = {
  fboSize: THREE.Vector2;
  px: THREE.Vector2;
  dt: number;
  dissipation: number;
  velocity: THREE.Texture;
  source: THREE.Texture;
};

export default class Advect extends ShaderPass {
  constructor(output: THREE.WebGLRenderTarget, params: AdvectParams) {
    super({
      material: {
        vertexShader: faceVert,
        fragmentShader: advectFrag,
        uniforms: {
          boundarySpace: { value: new THREE.Vector2(0, 0) },
          fboSize: { value: params.fboSize },
          px: { value: params.px },
          dt: { value: params.dt },
          dissipation: { value: params.dissipation },
          velocity: { value: params.velocity },
          source: { value: params.source },
        },
      },
      output,
    });
  }

  render(options: Partial<Omit<AdvectParams, "fboSize" | "px">> = {}) {
    if (!this.uniforms) return;
    if (options.dt !== undefined) this.uniforms.dt.value = options.dt;
    if (options.dissipation !== undefined) {
      this.uniforms.dissipation.value = options.dissipation;
    }
    if (options.velocity !== undefined)
      this.uniforms.velocity.value = options.velocity;
    if (options.source !== undefined)
      this.uniforms.source.value = options.source;
    super.update();
  }
}
