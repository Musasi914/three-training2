import type { Props } from "../type/type";
import ShaderPass from "./ShaderPass";
import face_vert from "../glsl/face.vert";
import poisson_frag from "../glsl/poisson.frag";

export default class Poisson extends ShaderPass {
  constructor(props: Props) {
    super({
      material: {
        vertexShader: face_vert,
        fragmentShader: poisson_frag,
        uniforms: {
          boundarySpace: {
            value: props.boundarySpace,
          },
          pressure: {
            value: props.dst_?.texture,
          },
          divergence: {
            value: props.src?.texture,
          },
          px: {
            value: props.cellScale,
          },
        },
      },
      output: props.dst,
      output0: props.dst_,
      output1: props.dst,
    });
  }

  render({ iterations }: { iterations: number }) {
    if (!this.uniforms) return;

    let p_in;
    let p_out;

    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        p_in = this.shaderPassProps.output0;
        p_out = this.shaderPassProps.output1;
      } else {
        p_in = this.shaderPassProps.output1;
        p_out = this.shaderPassProps.output0;
      }

      this.uniforms.pressure.value = p_in?.texture;
      this.shaderPassProps.output = p_out!;
      super.update();
    }

    return p_out;
  }
}
