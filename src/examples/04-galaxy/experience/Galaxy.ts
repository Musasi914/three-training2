import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vertex.glsl";
import fragmentShader from "./glsl/fragment.glsl";

export default class Galaxy {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  params = {
    size: 400,
    count: 50000,
    radius: 20,
    split: 5,
    spin: 0.2,
    randomness: 4,
    randomnessPower: 3,
    insideColor: new THREE.Color("#ff5588"),
    outsideColor: new THREE.Color("#4e6ef2"),
  };
  particleGeometry!: THREE.BufferGeometry;
  particleMaterial!: THREE.ShaderMaterial;
  points!: THREE.Points;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    this.createParticles();
    this.createGUI();
  }

  private createParticles() {
    this.scene.remove(this.points);
    if (this.particleGeometry) this.particleGeometry.dispose();
    if (this.particleMaterial) this.particleMaterial.dispose();

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.params.size * this.experience.config.pixelRatio },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const { positions, colors, scales, randomness } = this.createAttributes();

    this.particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(colors, 3)
    );
    this.particleGeometry.setAttribute(
      "aScale",
      new THREE.BufferAttribute(scales, 1)
    );
    this.particleGeometry.setAttribute(
      "aRandomness",
      new THREE.BufferAttribute(randomness, 3)
    );

    this.points = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.scene.add(this.points);
  }

  private createAttributes() {
    const positions = new Float32Array(this.params.count * 3);
    const colors = new Float32Array(this.params.count * 3);
    const scales = new Float32Array(this.params.count * 1);
    const randomness = new Float32Array(this.params.count * 3);

    for (let i = 0; i < this.params.count; i++) {
      const radius = this.params.radius * Math.random();
      const theta =
        ((Math.PI * 2) / this.params.split) * (i % this.params.split);
      const plusSpin = radius * this.params.spin;

      positions[i * 3 + 0] = Math.cos(theta + plusSpin) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(theta + plusSpin) * radius;

      // color
      const mixedColor = this.params.insideColor.clone();
      const color = mixedColor.lerp(
        this.params.outsideColor,
        radius / this.params.radius
      );
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // scale
      scales[i] = Math.random();

      // randomness
      const randomX =
        Math.pow(Math.random() - 0.5, this.params.randomnessPower) *
        (Math.random() >= 0.5 ? -1 : 1) *
        this.params.randomness *
        radius;
      const randomY =
        Math.pow(Math.random() - 0.5, this.params.randomnessPower) *
        (Math.random() >= 0.5 ? -1 : 1) *
        this.params.randomness *
        radius;
      const randomZ =
        Math.pow(Math.random() - 0.5, this.params.randomnessPower) *
        (Math.random() >= 0.5 ? -1 : 1) *
        this.params.randomness *
        radius;

      randomness[i * 3 + 0] = randomX;
      randomness[i * 3 + 1] = randomY;
      randomness[i * 3 + 2] = randomZ;
    }
    return { positions, colors, scales, randomness };
  }

  private createGUI() {
    this.gui
      .add(this.params, "size")
      .min(1)
      .max(5000)
      .step(0.1)
      .onChange(this.createParticles.bind(this));
    this.gui
      .add(this.params, "count")
      .min(100)
      .max(100000)
      .step(100)
      .onChange(this.createParticles.bind(this));
    this.gui
      .add(this.params, "radius")
      .min(1)
      .max(30)
      .step(1)
      .onChange(this.createParticles.bind(this));
    this.gui
      .add(this.params, "split")
      .min(1)
      .max(10)
      .step(1)
      .onChange(this.createParticles.bind(this));
    this.gui
      .add(this.params, "spin")
      .min(-1)
      .max(1)
      .step(0.01)
      .onChange(this.createParticles.bind(this));
    this.gui
      .add(this.params, "randomness")
      .min(0)
      .max(10)
      .step(0.01)
      .onChange(this.createParticles.bind(this));
    this.gui
      .add(this.params, "randomnessPower")
      .min(1)
      .max(10)
      .step(1)
      .onChange(this.createParticles.bind(this));
  }

  update() {
    this.particleMaterial.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;
  }
}
