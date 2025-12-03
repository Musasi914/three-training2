import * as THREE from "three";
import ShaderPass from "./ShaderPass";
import type { Props } from "../type/type";
import face_vert from "../glsl/face.vert?raw";
import divergence_frag from "../glsl/divergence.frag?raw";

export default class Divergence extends ShaderPass {
  constructor(props: Props) {
    super({
      material: {
        vertexShader: face_vert,
        fragmentShader: divergence_frag,
        uniforms: {
          boundarySpace: {
            value: props.boundarySpace,
          },
          velocity: {
            value: props.src?.texture,
          },
          px: {
            value: props.cellScale,
          },
          dt: {
            value: props.dt,
          },
        },
      },
      output: props.dst,
    });
  }

  render({ vel }: { vel: THREE.WebGLRenderTarget }) {
    if (!this.uniforms) return;

    this.uniforms.velocity.value = vel.texture;
    super.update();
  }
}
