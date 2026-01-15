import Experience from "./Experience";
import * as THREE from "three";
import GPUPickHelper from "./PickHelper";

export default class Example {
  static numObjects = 100;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  resource: Experience["resource"];
  pickHelper: GPUPickHelper;

  pickingScene!: THREE.Scene;
  idToObject: Record<number, THREE.Mesh> = {};
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.resource = this.experience.resource;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.gui.close();
    this.camera = this.experience.camera;

    this.createPickingScene();

    this.createRandomBoxes();

    this.pickHelper = new GPUPickHelper();
  }

  private createPickingScene() {
    this.pickingScene = new THREE.Scene();
    this.pickingScene.background = new THREE.Color(0x000000);
  }

  private createRandomBoxes() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const frame = this.resource.items.frame as THREE.Texture;
    frame.colorSpace = THREE.SRGBColorSpace;
    frame.anisotropy = 8;

    const randomColor = () =>
      `hsl(${Math.random() * 360}, ${Math.random() * 50 + 50}%, 50%)`;

    for (let i = 0; i < Example.numObjects; i++) {
      const id = i + 1;
      const material = new THREE.MeshPhongMaterial({
        color: randomColor(),
        map: frame,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
      });

      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);

      this.idToObject[id] = cube;

      cube.position.set(
        THREE.MathUtils.randFloatSpread(40),
        THREE.MathUtils.randFloatSpread(40),
        THREE.MathUtils.randFloatSpread(40)
      );
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      cube.scale.set(
        Math.random() * 3 + 3,
        Math.random() * 3 + 3,
        Math.random() * 3 + 3
      );

      const pickingMaterial = new THREE.MeshPhongMaterial({
        emissive: new THREE.Color().setHex(id, THREE.NoColorSpace),
        color: new THREE.Color(0, 0, 0),
        specular: new THREE.Color(0, 0, 0),
        map: frame,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
        blending: THREE.NoBlending,
      });
      const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
      this.pickingScene.add(pickingCube);
      pickingCube.position.copy(cube.position);
      pickingCube.rotation.copy(cube.rotation);
      pickingCube.scale.copy(cube.scale);
    }
  }

  resize() {}

  update() {
    this.camera.cameraPole.rotation.y = this.experience.time.elapsed / 10000;
    this.pickHelper.pick(
      this.pickingScene,
      this.camera.instance,
      this.idToObject
    );
  }
}
