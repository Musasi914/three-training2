import Experience from "./Experience";
import * as THREE from "three";
import GPUPickHelper from "./PickHelper";

export default class Example {
  static numObjects = 100;
  static instance: Example;
  static getInstance(): Example {
    return this.instance;
  }

  experience: Experience = Experience.getInstance();
  scene: Experience["scene"] = this.experience.scene;
  pickingScene: Experience["pickingScene"] = this.experience.pickingScene;
  gui: Experience["gui"] = this.experience.gui;
  renderer: Experience["renderer"] = this.experience.renderer;
  camera: Experience["camera"] = this.experience.camera;
  resource: Experience["resource"] = this.experience.resource;

  pickPosition = new THREE.Vector2(-9999, -9999);
  pickHelper: GPUPickHelper;

  texture!: THREE.Texture;

  idToObject: Record<number, THREE.Mesh> = {};

  constructor() {
    Example.instance = this;
    this.gui.close();

    this.createObjects();
    window.addEventListener("pointermove", this.setPickPosition.bind(this));
    window.addEventListener("pointerout", this.clearPickPosition.bind(this));
    window.addEventListener("pointerleave", this.clearPickPosition.bind(this));

    this.pickHelper = new GPUPickHelper();
  }

  rand(min: number, max?: number) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + (max - min) * Math.random();
  }

  randomColor() {
    return `hsl(${this.rand(360) | 0}, ${this.rand(50, 100) | 0}%, 50%)`;
  }

  createObjects() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.texture = this.resource.items.frame as THREE.Texture;

    for (let i = 0; i < Example.numObjects; i++) {
      const id = i + 1;
      const material = new THREE.MeshPhongMaterial({
        color: this.randomColor(),
        map: this.texture,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      });

      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);
      this.idToObject[id] = cube;

      cube.position.set(
        this.rand(-20, 20),
        this.rand(-20, 20),
        this.rand(-20, 20)
      );
      cube.rotation.set(this.rand(Math.PI), this.rand(Math.PI), 0);
      cube.scale.set(this.rand(3, 6), this.rand(3, 6), this.rand(3, 6));

      const pickingMaterial = new THREE.MeshPhongMaterial({
        emissive: new THREE.Color().setHex(id, THREE.NoColorSpace),
        color: new THREE.Color(0, 0, 0),
        specular: new THREE.Color(0, 0, 0),
        map: this.texture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        blending: THREE.NoBlending,
      });
      const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
      this.pickingScene.add(pickingCube);
      pickingCube.position.copy(cube.position);
      pickingCube.rotation.copy(cube.rotation);
      pickingCube.scale.copy(cube.scale);
    }
  }

  clearPickPosition() {
    this.pickPosition.set(-9999, -9999);
  }

  getCanvasRelativePosition(event: PointerEvent) {
    const rect = this.experience.canvasWrapper.getBoundingClientRect();
    return {
      x:
        ((event.clientX - rect.left) * this.experience.config.width) /
        rect.width,
      y:
        ((event.clientY - rect.top) * this.experience.config.height) /
        rect.height,
    };
  }

  setPickPosition(event: PointerEvent) {
    const pos = this.getCanvasRelativePosition(event);

    this.pickPosition.x = pos.x;
    this.pickPosition.y = pos.y;
  }

  resize() {}

  update() {
    this.camera.cameraPole.rotation.y += 0.01;
    this.pickHelper.pick(
      this.pickPosition,
      this.pickingScene,
      this.camera.instance,
      this.experience.time.elapsed / 1000
    );
  }
}
