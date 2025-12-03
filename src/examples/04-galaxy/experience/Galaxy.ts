import Experience from "./Experience";
import * as THREE from "three";

export default class Galaxy {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  params: {
    size: number;
    count: number;
    radius: number;
    split: number;
    spin: number;
    randomness: number;
    randomnessPower: number;
  } = {
    size: 0.1,
    count: 10000,
    radius: 20,
    split: 4,
    spin: 0.2,
    randomness: 3,
    randomnessPower: 4,
  };
  particleGeometry!: THREE.BufferGeometry;
  particleMaterial!: THREE.PointsMaterial;
  points!: THREE.Points;
  radiusArray: number[] = [];

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
    this.particleMaterial = new THREE.PointsMaterial({
      size: this.params.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const positions = this.createPositions();
    const colors = this.createColors();

    this.particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    this.points = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.scene.add(this.points);
  }

  private createPositions() {
    const positions = new Float32Array(this.params.count * 3);
    for (let i = 0; i < this.params.count; i++) {
      const radius = this.params.radius * Math.random();
      this.radiusArray.push(radius);
      const theta =
        ((Math.PI * 2) / this.params.split) * (i % this.params.split);
      const plusSpin = radius * this.params.spin;

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

      positions[i * 3 + 0] = Math.cos(theta + plusSpin) * radius + randomX;
      positions[i * 3 + 1] = randomY;
      positions[i * 3 + 2] = Math.sin(theta + plusSpin) * radius + randomZ;
    }
    return positions;
  }

  private createColors() {
    const colors = new Float32Array(this.params.count * 3);
    for (let i = 0; i < this.params.count; i++) {
      const centerColor = new THREE.Color("#ff5588");
      const edgeColor = new THREE.Color("#4e6ef2");
      const color = centerColor.lerp(
        edgeColor,
        this.radiusArray[i] / this.params.radius
      );
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }

  private createGUI() {
    this.gui
      .add(this.params, "size")
      .min(0.01)
      .max(0.1)
      .step(0.001)
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
}
