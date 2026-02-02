import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/aurora.vert";
import fragmentShader from "./glsl/aurora.frag";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  resource: Experience["resource"];

  material!: THREE.ShaderMaterial;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.scene.add(new THREE.AxesHelper(1));
    this.createSky();
  }

  private createSky() {
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      uniforms: {
        uSkyTop: { value: new THREE.Color(0x0b1a3a) },
        uSkyBottom: { value: new THREE.Color(0x02030a) },
        uTime: { value: 0 },
        uBrightness: { value: 3.0 },
        uDecay: { value: 0.1 },
        uSpeed: { value: 0.1 },
        uScale: { value: 1.0 },
        uOffset: { value: 0.0 },
        uHfade: { value: 0.45 },
        uColor1: { value: new THREE.Color("#2affff") },
        uColor2: { value: new THREE.Color("#00ff77") },
        uColor3: { value: new THREE.Color("#7b00ff") },
        uColor4: { value: new THREE.Color("#ff4bd6") },
      },
    });
    const sky = new THREE.Mesh(geometry, this.material);
    this.scene.add(sky);
  }

  resize() {}

  update() {
    this.material.uniforms.uTime.value = this.experience.time.elapsed / 1000;
  }
}
