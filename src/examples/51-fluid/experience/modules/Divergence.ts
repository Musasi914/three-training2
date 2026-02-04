import * as THREE from "three";
import ShaderPass from "./ShaderPass";
import faceVert from "../glsl/face.vert?raw";
import divergenceFrag from "../glsl/divergence.frag?raw";

export default class Divergence extends ShaderPass {
  constructor(
    output: THREE.WebGLRenderTarget,
    params: { px: THREE.Vector2; dt: number }
  ) {
    super({
      material: {
        vertexShader: faceVert,
        fragmentShader: divergenceFrag,
        uniforms: {
          boundarySpace: { value: new THREE.Vector2(0, 0) },
          velocity: { value: null },
          px: { value: params.px },
          dt: { value: params.dt },
        },
      },
      output,
    });
  }

  render(velocity: THREE.Texture) {
    if (!this.uniforms) return;
    this.uniforms.velocity.value = velocity;
    super.update();
  }
}
