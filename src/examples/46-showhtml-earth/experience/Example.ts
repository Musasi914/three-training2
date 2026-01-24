import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  resource: Experience["resource"];

  data: {
    name: string;
    min: [number, number];
    max: [number, number];
    area: number;
    lat: number;
    lon: number;
    population: { [key: string]: number };
    position: THREE.Vector3;
    elem: HTMLDivElement;
  }[] = [];

  labelContainerElem: HTMLDivElement;

  tempV = new THREE.Vector3();
  cameraToPoint = new THREE.Vector3();
  normalMatrix = new THREE.Matrix3();

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.labelContainerElem = document.querySelector(
      "#labels"
    ) as HTMLDivElement;

    this.createEarth();

    this.loadCountryData();
  }

  createEarth() {
    const texture = this.resource.items["country-outlines"] as THREE.Texture;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.anisotropy = 8;

    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const earth = new THREE.Mesh(geometry, material);
    this.scene.add(earth);
  }

  async loadCountryData() {
    const data = await this.loadJson("/json/country-info.json");
    this.data = data;

    const lonFudge = Math.PI * 1.5;
    const latFudge = Math.PI;

    const lonHelper = new THREE.Object3D();
    const latHelper = new THREE.Object3D();
    lonHelper.add(latHelper);

    const positionHelper = new THREE.Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);

    for (const contryInfo of this.data) {
      const { lat, lon, name } = contryInfo;
      lonHelper.rotation.y = THREE.MathUtils.degToRad(lon) + lonFudge;
      latHelper.rotation.x = THREE.MathUtils.degToRad(lat) + latFudge;

      positionHelper.updateWorldMatrix(true, false);
      const position = new THREE.Vector3();
      positionHelper.getWorldPosition(position);
      contryInfo.position = position;

      const elem = document.createElement("div");
      elem.textContent = name;

      this.labelContainerElem.appendChild(elem);
      contryInfo.elem = elem;
    }
  }

  async loadJson(url: string) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  resize() {}

  update() {
    this.updateLabels();
  }

  updateLabels() {
    if (!this.data) return;

    const minVisibleDot = 0.2;

    this.normalMatrix.getNormalMatrix(this.camera.instance.matrixWorldInverse);

    for (const contryInfo of this.data) {
      const { elem, position } = contryInfo;
      this.tempV.copy(position);
      this.tempV.applyMatrix3(this.normalMatrix);

      this.cameraToPoint.copy(position);
      this.cameraToPoint
        .applyMatrix4(this.camera.instance.matrixWorldInverse)
        .normalize();

      const dot = this.tempV.dot(this.cameraToPoint);
      if (dot > minVisibleDot) {
        elem.style.display = "none";
        continue;
      }
      elem.style.display = "";

      this.tempV.copy(position);
      this.tempV.project(this.camera.instance);

      const x = (this.tempV.x * 0.5 + 0.5) * this.experience.config.width;
      const y = (this.tempV.y * -0.5 + 0.5) * this.experience.config.height;
      elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

      elem.style.zIndex = String(((-this.tempV.z * 0.5 + 0.5) * 100000) | 0);
    }
  }
}
