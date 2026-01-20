// import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import Experience from "./Experience";
import * as THREE from "three";
import { GPUPick } from "./GPUPick";
export default class Example {
  static instance: Example;
  static getInstance(): Example {
    return this.instance;
  }
  static numObjects = 100;

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  pickingScene: Experience["pickingScene"];
  renderer: Experience["renderer"];
  resource: Experience["resource"];

  idToObject: Record<number, THREE.Mesh> = {};
  pickPosition = new THREE.Vector2(-9999, -9999);
  picker: GPUPick;
  constructor() {
    Example.instance = this;
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.pickingScene = this.experience.pickingScene;
    this.renderer = this.experience.renderer;
    this.resource = this.experience.resource;
 
    this.createObjects();

    this.experience.canvasWrapper.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.experience.canvasWrapper.addEventListener('pointerout', this.clearPickPosition.bind(this));
    this.experience.canvasWrapper.addEventListener('pointerleave', this.clearPickPosition.bind(this));

    this.picker = new GPUPick();
  }

  onPointerMove(event: PointerEvent) {
    const x = event.clientX;
    const y = event.clientY;
    this.pickPosition.set(x, y);
  }

  clearPickPosition() {
    this.pickPosition.set(-9999, -9999);
  }

  createObjects() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < Example.numObjects; i++) {
      const id = i + 1;
      const material = new THREE.MeshPhongMaterial({
        color: `hsl(${Math.random()* 360 | 0}, ${Math.random()* 50 + 50 | 0}%, 50%)`,
        map: this.resource.items.frame as THREE.Texture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(THREE.MathUtils.randFloat(-20, 20), THREE.MathUtils.randFloat(-20, 20), THREE.MathUtils.randFloat(-20, 20));
      cube.rotation.set(THREE.MathUtils.randFloat(0, Math.PI), THREE.MathUtils.randFloat(0, Math.PI), 0);
      cube.scale.set(THREE.MathUtils.randFloat(3, 6), THREE.MathUtils.randFloat(3, 6), THREE.MathUtils.randFloat(3, 6));
      this.scene.add(cube);

      this.idToObject[id] = cube;
      const pickingMaterial = new THREE.MeshPhongMaterial({
        emissive: new THREE.Color().setHex(id, THREE.NoColorSpace),
        color: new THREE.Color(0, 0, 0),
        map: this.resource.items.frame as THREE.Texture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        blending: THREE.NoBlending,
      })
      const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
      this.pickingScene.add(pickingCube);
      pickingCube.position.copy(cube.position);
      pickingCube.rotation.copy(cube.rotation);
      pickingCube.scale.copy(cube.scale);
    }
  }

  resize() {}

  update() {
    this.experience.camera.controls.update();
    this.picker.pick(this.pickPosition, this.experience.camera.instance, this.pickingScene);
  }
}
