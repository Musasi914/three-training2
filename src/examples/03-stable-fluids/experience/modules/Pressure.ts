import type { Props } from "../type/type";
import ShaderPass from "./ShaderPass";
import face_vert from "../glsl/face.vert";
import pressure_frag from "../glsl/pressure.frag";
import * as THREE from "three";

export default class Pressure extends ShaderPass {
  constructor(props: Props) {
    super({
      material: {
        vertexShader: face_vert,
        fragmentShader: pressure_frag,
        uniforms: {
          boundarySpace: {
            value: props.boundarySpace,
          },
          pressure: {
            value: props.src_p?.texture,
          },
          velocity: {
            value: props.src_v?.texture,
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

  render({
    vel,
    pressure,
  }: {
    vel: THREE.WebGLRenderTarget;
    pressure: THREE.WebGLRenderTarget;
  }) {
    if (!this.uniforms) return;

    this.uniforms.velocity.value = vel.texture;
    this.uniforms.pressure.value = pressure.texture;
    super.update();
  }
}
