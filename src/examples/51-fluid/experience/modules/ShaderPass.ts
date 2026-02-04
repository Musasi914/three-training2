import * as THREE from "three";
import Experience from "../Experience";
import type { ShaderPassProps } from "../type/type";

export default class ShaderPass {
  experience: Experience;
  renderer: Experience["renderer"];

  shaderPassProps: ShaderPassProps;
  scene: THREE.Scene;
  camera: THREE.Camera;

  uniforms: Record<string, THREE.IUniform> | null = null;
  material: THREE.ShaderMaterial | null = null;
  geometry: THREE.PlaneGeometry | null = null;
  plane: THREE.Mesh | null = null;

  constructor(props: ShaderPassProps) {
    this.experience = Experience.getInstance();
    this.renderer = this.experience.renderer;

    this.shaderPassProps = props;
    if (props.material) {
      this.uniforms = props.material.uniforms;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    if (props.material) {
      this.material = new THREE.ShaderMaterial({
        ...props.material,
        depthTest: props.material.depthTest ?? false,
        depthWrite: props.material.depthWrite ?? false,
        blending: props.material.blending ?? THREE.NoBlending,
        transparent: props.material.transparent ?? false,
      });

      this.geometry = new THREE.PlaneGeometry(2, 2);
      this.plane = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.plane);
    }
  }

  protected renderToTarget(target: THREE.WebGLRenderTarget) {
    this.renderer.instance.setRenderTarget(target);
    this.renderer.instance.render(this.scene, this.camera);
    this.renderer.instance.setRenderTarget(null);
  }

  update() {
    this.renderToTarget(this.shaderPassProps.output);
  }
}
