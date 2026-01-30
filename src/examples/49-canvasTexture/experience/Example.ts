import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];

  ctx!: CanvasRenderingContext2D;

  canvasTexture!: THREE.CanvasTexture;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;

    this.createCanvas();
    this.createCube();
  }

  private createCanvas() {
    this.ctx = document
      .createElement("canvas")
      .getContext("2d") as CanvasRenderingContext2D;
    document.body.appendChild(this.ctx.canvas);
    this.ctx.canvas.width = 256;
    this.ctx.canvas.height = 256;
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.canvasTexture = new THREE.CanvasTexture(this.ctx.canvas);
    this.canvasTexture.colorSpace = THREE.SRGBColorSpace;
    this.canvasTexture.minFilter = THREE.NearestFilter;
    this.canvasTexture.magFilter = THREE.NearestFilter;
    this.canvasTexture.generateMipmaps = false;
    this.canvasTexture.needsUpdate = true;
  }

  private createCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }

  private drawRandomDot() {
    this.ctx.fillStyle = new THREE.Color()
      .setHSL(Math.random(), 1, Math.random())
      .getStyle();

    this.ctx.beginPath();

    const x = Math.random() * this.ctx.canvas.width;
    const y = Math.random() * this.ctx.canvas.height;
    const radius = THREE.MathUtils.randFloat(10, 64);
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  resize() {}

  update() {
    this.drawRandomDot();
    this.canvasTexture.needsUpdate = true;
  }
}
