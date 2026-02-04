import * as THREE from "three";
import ShaderPass from "./ShaderPass";
import faceVert from "../glsl/face.vert?raw";
import poissonFrag from "../glsl/poisson.frag?raw";

type PoissonTargets = {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
};

export default class Poisson extends ShaderPass {
  private targets: PoissonTargets;

  constructor(
    divergence: THREE.Texture,
    targets: PoissonTargets,
    px: THREE.Vector2
  ) {
    super({
      material: {
        vertexShader: faceVert,
        fragmentShader: poissonFrag,
        uniforms: {
          boundarySpace: { value: new THREE.Vector2(0, 0) },
          pressure: { value: targets.read.texture },
          divergence: { value: divergence },
          px: { value: px },
        },
      },
      output: targets.write,
      output0: targets.read,
      output1: targets.write,
    });

    this.targets = targets;
  }

  setDivergence(divergence: THREE.Texture) {
    if (!this.uniforms) return;
    this.uniforms.divergence.value = divergence;
  }

  render(iterations: number) {
    if (!this.uniforms) return this.targets.read;

    let read = this.targets.read;
    let write = this.targets.write;

    for (let i = 0; i < iterations; i++) {
      this.uniforms.pressure.value = read.texture;
      this.shaderPassProps.output = write;
      super.update();

      const tmp = read;
      read = write;
      write = tmp;
    }

    this.targets.read = read;
    this.targets.write = write;

    return this.targets.read;
  }
}
