import Experience from "./Experience";
import * as THREE from "three";
import fragmentShader from "./glsl/07-shape.frag";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  resource: Experience["resource"];
  uniforms: Record<string, THREE.Uniform> = {
    uTime: new THREE.Uniform(0),
    uResolution: new THREE.Uniform(new THREE.Vector3()),
    uMouse: new THREE.Uniform(new THREE.Vector2()),
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    const plane = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      fragmentShader,
      uniforms: this.uniforms,
    });
    this.uniforms.uResolution.value.set(
      this.renderer.domElement.width,
      this.renderer.domElement.height,
      1
    );
    this.scene.add(new THREE.Mesh(plane, material));

    window.addEventListener("mousemove", this.onMousemove.bind(this));
  }

  onMousemove(event: MouseEvent) {
    this.uniforms.uMouse.value.set(
      event.clientX / this.experience.config.width,
      1 - event.clientY / this.experience.config.height
    );
  }

  resize() {
    this.uniforms.uResolution.value.set(
      this.experience.config.width,
      this.experience.config.height
    );
  }

  update() {
    this.uniforms.uTime.value = this.experience.time.elapsed / 1000;
  }
}
