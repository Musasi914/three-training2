// import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/plane.vert";
import fragmentShader from "./glsl/plane.frag";
import gsap from "gsap";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  resource: Experience["resource"];

  material!: THREE.ShaderMaterial;

  params = {
    count: 2000,
    radius: 30,
    height: 30,
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: {
          value: new THREE.Vector2(
            this.experience.config.width,
            this.experience.config.height
          ),
        },
        uProgress: { value: 0 },
        uHeight: { value: this.params.height },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const startBtn = document.getElementById("btn-start");
    // const explosionBtn = document.getElementById("btn-explosion");
    startBtn?.addEventListener("click", () => {
      this.createFireWork();
    });
  }

  private createFireWork() {
    const geometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(3 * this.params.count);
    const randomArray = new Float32Array(this.params.count);
    const randomTimeArray = new Float32Array(this.params.count);
    const tailOffsetArray = new Float32Array(this.params.count);

    for (let i = 0; i < this.params.count; i++) {
      const theta = Math.asin(Math.random() * 2 - 1);
      const phi = Math.random() * 2 * Math.PI;

      const radius =
        this.params.radius + Math.random() * this.params.radius * 0.1;

      const rSinTheta = radius * Math.sin(theta);
      const rCosTheta = radius * Math.cos(theta);

      const i3 = i * 3;
      positionArray[i3 + 0] = rCosTheta * Math.cos(phi);
      positionArray[i3 + 1] = rCosTheta * Math.sin(phi);
      positionArray[i3 + 2] = rSinTheta;

      randomArray[i] = Math.random() * 0.5 + 0.5;
      randomTimeArray[i] = Math.random() * 0.1 + 1;
      tailOffsetArray[i] = Math.pow(Math.random(), 4.0);
    }

    geometry.setAttribute(
      "aRandom",
      new THREE.Float32BufferAttribute(randomArray, 1)
    );
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionArray, 3)
    );
    geometry.setAttribute(
      "aRandomTime",
      new THREE.Float32BufferAttribute(randomTimeArray, 1)
    );
    geometry.setAttribute(
      "aTailOffset",
      new THREE.Float32BufferAttribute(tailOffsetArray, 1)
    );

    const material = this.material.clone();

    const points = new THREE.Points(geometry, material);
    points.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
    this.scene.add(points);

    gsap.fromTo(
      material.uniforms.uProgress,
      {
        value: 0,
      },
      {
        value: 1,
        duration: 5,
        ease: "none",
        onComplete: () => {
          material.dispose();
          geometry.dispose();
          this.scene.remove(points);
        },
      }
    );
  }

  resize() {
    this.material.uniforms.uResolution.value.set(
      this.experience.config.width,
      this.experience.config.height
    );
  }

  update() {}
}
