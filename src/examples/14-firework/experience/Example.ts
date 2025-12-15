import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/firework.vert";
import fragmentShader from "./glsl/firework.frag";
import gsap from "gsap";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  material: THREE.ShaderMaterial | null = null;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.createFirework(300, [0.0, 0.0, 0.0], 1);

    window.addEventListener("click", () => {
      this.createFirework(300, [0.0, 0.0, 0.0], 1);
    });
  }

  private createFirework(count: number, position: number[], radius: number) {
    const geometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(count * 3);
    const randomArray = new Float32Array(count);
    const randomTimeArray = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const customRadius = radius + Math.random() * 0.1;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * 2 * Math.PI;
      const rSinTheta = customRadius * Math.sin(theta);
      positionArray[i3 + 0] = rSinTheta * Math.cos(phi);
      positionArray[i3 + 1] = rSinTheta * Math.sin(phi);
      positionArray[i3 + 2] = customRadius * Math.cos(theta);

      randomArray[i] = Math.random() * 0.5 + 0.5;
      randomTimeArray[i] = Math.random() * 0.5 + 1;
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionArray, 3)
    );
    geometry.setAttribute(
      "random",
      new THREE.Float32BufferAttribute(randomArray, 1)
    );
    geometry.setAttribute(
      "randomTime",
      new THREE.Float32BufferAttribute(randomTimeArray, 1)
    );
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
        uColor: {
          value: new THREE.Color("#8affff"),
        },
        uProgress: {
          value: 0,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geometry, this.material);
    mesh.position.copy(new THREE.Vector3(...position));
    this.scene.add(mesh);

    gsap.to(this.material.uniforms.uProgress, {
      value: 1,
      duration: 3,
      ease: "none",
      onComplete: () => {
        this.scene.remove(mesh);
        geometry.dispose();
        this.material?.dispose();
      },
    });
  }

  resize() {
    if (this.material && this.material.uniforms.uResolution) {
      this.material.uniforms.uResolution.value.set(
        this.experience.config.width,
        this.experience.config.height
      );
    }
  }

  update() {}
}
