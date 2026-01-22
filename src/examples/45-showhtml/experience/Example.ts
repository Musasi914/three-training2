import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];

  labelContainerElem: HTMLDivElement;

  cubes: { cube: THREE.Mesh; elem: HTMLDivElement }[] = [];

  raycaster: THREE.Raycaster;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    this.labelContainerElem = document.querySelector(
      "#labels"
    ) as HTMLDivElement;

    this.cubes = [
      this.makeInstance(geometry, 0x44aa88, 0, "Aqua"),
      this.makeInstance(geometry, 0x8844aa, -2, "Purple"),
      this.makeInstance(geometry, 0xaa8844, 2, "Gold"),
    ];

    this.raycaster = new THREE.Raycaster();
  }

  private makeInstance(
    geometry: THREE.BoxGeometry,
    color: number,
    x: number,
    name: string
  ) {
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    cube.position.x = x;

    const elem = document.createElement("div");
    elem.textContent = name;
    this.labelContainerElem.appendChild(elem);

    return { cube, elem };
  }

  resize() {}

  update() {
    const tmpV = new THREE.Vector3();
    const time = this.experience.time.elapsed * 0.001;
    this.cubes.forEach((cubeInfo, ndx) => {
      const { cube, elem } = cubeInfo;
      const speed = 1 + ndx * 0.1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;

      cube.getWorldPosition(tmpV);

      // tmpVを正規化されたディスプレイ座標に変換
      tmpV.project(this.camera.instance);

      this.raycaster.setFromCamera(
        new THREE.Vector2(tmpV.x, tmpV.y),
        this.camera.instance
      );
      const intersectedObjects = this.raycaster.intersectObjects(
        this.scene.children
      );
      const show =
        intersectedObjects.length && cube === intersectedObjects[0].object;

      if (ndx === 0) {
        console.log(tmpV.z);
      }

      if (!show) {
        elem.style.display = "none";
      } else {
        elem.style.display = "";

        // 左端が0,右端が1
        const x = (tmpV.x * 0.5 + 0.5) * this.experience.config.width;
        const y = (tmpV.y * -0.5 + 0.5) * this.experience.config.height;

        elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        elem.style.zIndex = String(((-tmpV.z * 0.5 + 0.5) * 1000) | 0);
      }
    });
  }
}
