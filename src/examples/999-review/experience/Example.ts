// import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import Experience from "./Experience";
import * as THREE from "three";
import GPUPicker from "./GPUPicker";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

import earthFragmentShader from "./glsl/earth.frag";

const countryInfoUrl = "/json/country-info.json";

type CountryInfo = {
  name: string;
  min: [number, number];
  max: [number, number];
  area: number;
  lat: number;
  lon: number;
  population: { [key: string]: number };
};
export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  resource: Experience["resource"];
  pickingScene: THREE.Scene;

  earthMaterial!: CustomShaderMaterial;

  labelContainerElem: HTMLDivElement;

  countryInfo: CountryInfo[] = [];
  countryData: (CountryInfo & {
    elem: HTMLDivElement;
    position: THREE.Vector3;
  })[] = [];

  tempV = new THREE.Vector3();
  cameraToPoint = new THREE.Vector3();
  normalMatrix = new THREE.Matrix3();

  picker: GPUPicker;
  pickPosition = new THREE.Vector2(-9999, -9999);

  pickedCountry: CountryInfo | null = null;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    this.labelContainerElem = document.querySelector(
      "#labels"
    ) as HTMLDivElement;

    this.pickingScene = new THREE.Scene();
    this.pickingScene.background = new THREE.Color(0);

    this.setCountryData();
    this.createEarth();

    this.createPickingEarth();

    this.picker = new GPUPicker();
    this.experience.canvasWrapper.addEventListener(
      "pointermove",
      this.setPickPosition.bind(this)
    );

    this.experience.canvasWrapper.addEventListener(
      "pointerup",
      this.pickCountry.bind(this)
    );
  }

  private async setCountryData() {
    this.countryInfo = await this.fetchCountryInfo();

    const lonHelper = new THREE.Object3D();
    const latHelper = new THREE.Object3D();
    lonHelper.add(latHelper);

    const positionHelper = new THREE.Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);

    for (const countryInfo of this.countryInfo) {
      const { lat, lon, name } = countryInfo;
      lonHelper.rotation.y = (Math.PI / 180) * (lon - 90);
      latHelper.rotation.x = (Math.PI / 180) * (lat + 180);
      positionHelper.updateWorldMatrix(true, false);
      const position = new THREE.Vector3();
      positionHelper.getWorldPosition(position);

      const elem = document.createElement("div");
      elem.textContent = name;
      this.labelContainerElem.appendChild(elem);

      this.countryData.push({ ...countryInfo, position, elem });
    }
  }

  private async fetchCountryInfo() {
    const res = await fetch(countryInfoUrl);
    return await res.json();
  }

  private createEarth() {
    const texture = this.resource.items["country-outlines"] as THREE.Texture;
    texture.anisotropy = 8;

    const paletteTextureWidth = 512;
    const palette = new Uint8Array(paletteTextureWidth * 4);
    const paletteTexture = new THREE.DataTexture(
      palette,
      paletteTextureWidth,
      1
    );
    paletteTexture.minFilter = THREE.NearestFilter;
    paletteTexture.magFilter = THREE.NearestFilter;
    paletteTexture.generateMipmaps = false;

    for (let i = 0; i < paletteTextureWidth; i++) {
      palette[i * 4 + 0] = Math.random() * 255;
      palette[i * 4 + 1] = Math.random() * 255;
      palette[i * 4 + 2] = Math.random() * 255;
      palette[i * 4 + 3] = 255;
    }
    palette.set([0, 0, 200, 255], 0);
    paletteTexture.needsUpdate = true;

    const geometry = new THREE.SphereGeometry(1, 64, 32);
    this.earthMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshBasicMaterial,
      map: texture,
      fragmentShader: earthFragmentShader,
      uniforms: {
        indexTexture: { value: null },
        paletteTexture: { value: paletteTexture },
        paletteTextureWidth: { value: paletteTextureWidth },
      },
    });
    const earth = new THREE.Mesh(geometry, this.earthMaterial);
    this.scene.add(earth);
  }

  private createPickingEarth() {
    const pickingTexture = this.resource.items[
      "country-index"
    ] as THREE.Texture;
    pickingTexture.generateMipmaps = false;
    pickingTexture.minFilter = THREE.NearestFilter;
    pickingTexture.magFilter = THREE.NearestFilter;

    this.earthMaterial.uniforms.indexTexture.value = pickingTexture;

    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const material = new THREE.MeshBasicMaterial({ map: pickingTexture });
    const earth = new THREE.Mesh(geometry, material);
    this.pickingScene.add(earth);
  }

  private pickCountry() {
    if (this.countryData.length === 0) return;

    const id = this.picker.pick(
      this.pickPosition,
      this.pickingScene,
      this.camera.instance
    );
    const pickedCountry = this.countryData[id - 1] || undefined;

    if (pickedCountry && pickedCountry !== this.pickedCountry) {
      this.pickedCountry = pickedCountry;
    } else {
      this.resetPickedCountry();
    }
  }

  private resetPickedCountry() {
    this.pickedCountry = null;
  }

  private setPickPosition(event: PointerEvent) {
    this.pickPosition.x = event.clientX;
    this.pickPosition.y = event.clientY;
  }

  resize() {}

  update() {
    if (this.countryData.length === 0) return;

    this.updateLabels();
  }

  updateLabels() {
    this.normalMatrix.getNormalMatrix(this.camera.instance.matrixWorldInverse);

    for (const countryData of this.countryData) {
      const { position, elem } = countryData;

      this.tempV.copy(position);
      this.tempV.applyMatrix3(this.normalMatrix);

      this.cameraToPoint.copy(position);
      this.cameraToPoint
        .applyMatrix4(this.camera.instance.matrixWorldInverse)
        .normalize();

      const dot = this.tempV.dot(this.cameraToPoint);

      if (dot < -0.5 && this.pickedCountry === null) {
        elem.style.display = "";
      } else if (
        dot < -0.5 &&
        this.pickedCountry !== null &&
        this.pickedCountry.name === countryData.name
      ) {
        elem.style.display = "";
      } else {
        elem.style.display = "none";
        continue;
      }

      this.tempV.copy(position);
      this.tempV.project(this.camera.instance);

      elem.style.transform = `translate(-50%, -50%) translate(${
        (this.tempV.x * 0.5 + 0.5) * this.experience.config.width
      }px, ${(this.tempV.y * -0.5 + 0.5) * this.experience.config.height}px)`;
    }
  }
}
