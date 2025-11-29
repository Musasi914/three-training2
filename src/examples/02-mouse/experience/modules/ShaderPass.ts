import * as THREE from "three";
import Experience from "../Experience";
import type { ShaderPassProps } from "../type/type";

export default class ShaderPass {
  experience: Experience;
  renderer: Experience["renderer"];

  shaderPassProps: ShaderPassProps;
  scene!: THREE.Scene;
  camera!: THREE.Camera;

  uniforms: Record<string, THREE.IUniform> | null = null;
  material: THREE.ShaderMaterial | null = null;
  geometry: THREE.PlaneGeometry | null = null;
  plane: THREE.Mesh | null = null;

  constructor(props: ShaderPassProps) {
    this.experience = Experience.getInstance();
    this.renderer = this.experience.renderer;

    this.shaderPassProps = props;
    if (this.shaderPassProps.material) {
      this.uniforms = this.shaderPassProps.material.uniforms;
    }

    this.initShaderPass();
  }

  initShaderPass() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    if (this.uniforms) {
      this.material = new THREE.ShaderMaterial(this.shaderPassProps.material);
      this.geometry = new THREE.PlaneGeometry(2, 2);
      this.plane = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.plane);
    }
  }

  update() {
    this.renderer.instance.setRenderTarget(this.shaderPassProps.output);
    this.renderer.instance.render(this.scene, this.camera);
    this.renderer.instance.setRenderTarget(null);
  }
}
