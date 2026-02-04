import * as THREE from "three";
import ShaderPass from "./ShaderPass";
import faceVert from "../glsl/face.vert?raw";
import pressureFrag from "../glsl/pressure.frag?raw";

export default class Project extends ShaderPass {
  constructor(
    output: THREE.WebGLRenderTarget,
    params: {
      px: THREE.Vector2;
      dt: number;
      velocity: THREE.Texture;
      pressure: THREE.Texture;
    }
  ) {
    super({
      material: {
        vertexShader: faceVert,
        fragmentShader: pressureFrag,
        uniforms: {
          boundarySpace: { value: new THREE.Vector2(0, 0) },
          pressure: { value: params.pressure },
          velocity: { value: params.velocity },
          px: { value: params.px },
          dt: { value: params.dt },
        },
      },
      output,
    });
  }

  render(velocity: THREE.Texture, pressure: THREE.Texture) {
    if (!this.uniforms) return;
    this.uniforms.velocity.value = velocity;
    this.uniforms.pressure.value = pressure;
    super.update();
  }
}
