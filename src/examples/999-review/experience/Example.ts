// import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import Experience from "./Experience";
import * as THREE from "three";
// import {
//   GPUComputationRenderer,
//   SimplexNoise,
//   type Variable,
// } from "three/examples/jsm/Addons.js";
import vertexShader from "./glsl/sphere.vert";
import fragmentShader from "./glsl/sphere.frag";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];

  earthMaterial!: THREE.ShaderMaterial;
  earth!: THREE.Mesh;

  sunPosition = [0, 0, 1.5] as const;
  sun!: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;

    this.createSun();
    this.createSphere();
  }

  private createSun() {
    this.sun = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.03),
      new THREE.MeshBasicMaterial()
    );
    this.scene.add(this.sun);
    this.sun.position.set(...this.sunPosition);
  }

  private createSphere() {
    const dayTexture = this.experience.resource.items.day as THREE.Texture;
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.minFilter = THREE.NearestFilter;

    const nightTexture = this.experience.resource.items.night as THREE.Texture;
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.minFilter = THREE.NearestFilter;

    const specularTexture = this.experience.resource.items
      .specular as THREE.Texture;
    specularTexture.minFilter = THREE.NearestFilter;

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    this.earthMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uDayTexture: new THREE.Uniform(dayTexture),
        uNightTexture: new THREE.Uniform(nightTexture),
        uSpecularTexture: new THREE.Uniform(specularTexture),
        uSunPosition: new THREE.Uniform(new THREE.Vector3(...this.sunPosition)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(0x00aaff)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(0xff6600)),
      },
    });
    this.earth = new THREE.Mesh(geometry, this.earthMaterial);
    this.scene.add(this.earth);
  }

  resize() {}

  update() {
    this.earth.rotation.y += 0.01;
  }
}
