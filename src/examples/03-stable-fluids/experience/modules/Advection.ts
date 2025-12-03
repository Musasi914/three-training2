import type { Props } from "../type/type";
import ShaderPass from "./ShaderPass";
import face_vert from "../glsl/face.vert?raw";
import * as THREE from "three";
import advection_frag from "../glsl/advection.frag?raw";
import line_vert from "../glsl/line.vert?raw";

export default class Advection extends ShaderPass {
  line!: THREE.LineSegments;

  constructor(props: Props) {
    super({
      material: {
        vertexShader: face_vert,
        fragmentShader: advection_frag,
        uniforms: {
          fboSize: { value: props.fboSize },
          velocity: { value: props.src?.texture },
          dt: { value: props.dt },
          isBFECC: { value: false },
          // lineのため？
          boundarySpace: { value: props.cellScale },
          px: { value: props.cellScale },
        },
      },
      output: props.dst,
    });

    this.createBoundary();
  }

  private createBoundary() {
    if (this.uniforms === null) return;

    const boundaryG = new THREE.BufferGeometry();
    const vertices_boundary = new Float32Array([
      // left
      -1, -1, 0, -1, 1, 0,

      // top
      -1, 1, 0, 1, 1, 0,

      // right
      1, 1, 0, 1, -1, 0,

      // bottom
      1, -1, 0, -1, -1, 0,
    ]);

    boundaryG.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices_boundary, 3)
    );

    const boundaryM = new THREE.ShaderMaterial({
      vertexShader: line_vert,
      fragmentShader: advection_frag,
      uniforms: this.uniforms,
    });

    this.line = new THREE.LineSegments(boundaryG, boundaryM);
    this.scene.add(this.line);
  }

  update(options?: { dt?: number; isBounce?: boolean; BFECC?: boolean }) {
    if (!this.uniforms) return;

    if (options?.dt !== undefined) {
      this.uniforms.dt.value = options.dt;
    }
    if (options?.isBounce !== undefined) {
      this.line.visible = options.isBounce;
    }
    if (options?.BFECC !== undefined) {
      this.uniforms.isBFECC.value = options.BFECC;
    }

    super.update();
  }
}
