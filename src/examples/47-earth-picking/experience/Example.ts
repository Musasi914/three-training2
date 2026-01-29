import Experience from "./Experience";
import * as THREE from "three";
import GPUPicker from "./GPUPicker";

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
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  resource: Experience["resource"];

  data: CountryInfo[] = [];

  countryInfos: (CountryInfo & {
    position: THREE.Vector3;
    elem: HTMLDivElement;
    area: number;
    selected: boolean;
  })[] = [];

  labelContainerElem: HTMLDivElement;
  tempV = new THREE.Vector3();
  cameraToPoint = new THREE.Vector3();
  normalMatrix = new THREE.Matrix3();

  pickingScene!: THREE.Scene;

  picker: GPUPicker;
  pickPosition = new THREE.Vector2(-9999, -9999);

  numCountriesSelected = 0;

  maxNumCountries!: number;

  palette!: Uint8Array;
  paletteTexture!: THREE.DataTexture;

  unselectedColor: ArrayLike<number>;
  selectedColor: ArrayLike<number>;
  oceanColor: ArrayLike<number>;

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

    this.createPickingScene();

    this.createEarth();

    this.loadCountryData();

    this.picker = new GPUPicker();

    window.addEventListener("pointermove", this.clearPickPosition.bind(this));
    window.addEventListener("pointerup", this.pickCountry.bind(this));

    this.selectedColor = this.get255BasedColor("red");
    this.unselectedColor = this.get255BasedColor("#444");
    this.oceanColor = this.get255BasedColor("rgb(100,200,255)");
    this.resetPalette();
  }

  private pickCountry(event: PointerEvent) {
    if (this.countryInfos.length === 0) return;

    this.setPickPosition(event);

    const id = this.picker.pick(
      this.pickPosition,
      this.pickingScene,
      this.camera.instance
    );

    if (id > 0) {
      const countryInfo = this.countryInfos[id - 1];
      const selected = !countryInfo.selected;

      if (selected && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
        this.unselectAllCountries();
      }
      this.numCountriesSelected += selected ? 1 : -1;
      countryInfo.selected = selected;
      this.setPaletteColor(
        id,
        selected ? this.selectedColor : this.unselectedColor
      );
      this.paletteTexture.needsUpdate = true;
    } else {
      this.unselectAllCountries();
    }
  }

  private unselectAllCountries() {
    this.numCountriesSelected = 0;
    for (const countryInfo of this.countryInfos) {
      countryInfo.selected = false;
    }
    this.resetPalette();
  }

  private setPickPosition(event: PointerEvent) {
    this.pickPosition.set(event.clientX, event.clientY);
  }

  private clearPickPosition() {
    this.pickPosition.set(-9999, -9999);
  }

  private createPickingScene() {
    this.pickingScene = new THREE.Scene();
    this.pickingScene.background = new THREE.Color(0);
  }

  private createEarth() {
    const texture = this.resource.items["country-outlines"] as THREE.Texture;
    texture.anisotropy = 8;

    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const earth = new THREE.Mesh(geometry, material);
    this.scene.add(earth);

    const pickingTexture = this.resource.items[
      "country-index"
    ] as THREE.Texture;
    pickingTexture.generateMipmaps = false;
    pickingTexture.minFilter = THREE.NearestFilter;
    pickingTexture.magFilter = THREE.NearestFilter;

    this.maxNumCountries = 512;
    const paletteTextureWidth = this.maxNumCountries;
    const paletteTextureHeight = 1;
    this.palette = new Uint8Array(paletteTextureWidth * 4);

    this.paletteTexture = new THREE.DataTexture(
      this.palette,
      paletteTextureWidth,
      paletteTextureHeight
    );
    this.paletteTexture.minFilter = THREE.NearestFilter;
    this.paletteTexture.magFilter = THREE.NearestFilter;
    this.paletteTexture.generateMipmaps = false;

    // for (let i = 0; i < this.palette.length; i++) {
    //   this.palette[i] = Math.random() * 255;
    // }
    // this.palette.set([100, 200, 255, 255], 0);
    // this.paletteTexture.needsUpdate = true;

    const pickingGeometry = new THREE.SphereGeometry(1, 64, 32);
    const pickingMaterial = new THREE.MeshBasicMaterial({
      map: pickingTexture,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.paletteTexture = { value: this.paletteTexture };
      shader.uniforms.paletteTextureWidth = { value: paletteTextureWidth };
      shader.uniforms.indexTexture = { value: pickingTexture };

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `
          #include <common>
          uniform sampler2D indexTexture;
          uniform sampler2D paletteTexture;
          uniform float paletteTextureWidth;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
          #include <color_fragment>
          vec4 indexColor = texture2D(indexTexture, vMapUv);
          float index = indexColor.r * 255.0 + indexColor.g * 255.0 * 255.0;
          vec2 paletteUv = vec2((index + 0.5) / paletteTextureWidth, 0.5);
          vec4 paletteColor = texture2D(paletteTexture, paletteUv);
          diffuseColor.rgb = paletteColor.rgb - diffuseColor.rgb;
        `
      );
    };
    const pickingEarth = new THREE.Mesh(pickingGeometry, pickingMaterial);
    this.pickingScene.add(pickingEarth);
  }

  private async loadCountryData() {
    this.data = await this.loadJson("/json/country-info.json");

    const lonFudge = Math.PI * 1.5;
    const latFudge = Math.PI;

    const lonHelper = new THREE.Object3D();
    const latHelper = new THREE.Object3D();
    lonHelper.add(latHelper);

    const positionHelper = new THREE.Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);

    for (const countryInfo of this.data) {
      const { lat, lon, min, max, name } = countryInfo;
      lonHelper.rotation.y = THREE.MathUtils.degToRad(lon) + lonFudge;
      latHelper.rotation.x = THREE.MathUtils.degToRad(lat) + latFudge;

      positionHelper.updateWorldMatrix(true, false);
      const position = new THREE.Vector3();
      positionHelper.getWorldPosition(position);

      const elem = document.createElement("div");
      elem.textContent = name;
      this.labelContainerElem.appendChild(elem);

      const width = max[0] - min[0];
      const height = max[1] - min[1];
      const area = width * height;

      this.countryInfos.push({
        ...countryInfo,
        position,
        elem,
        area,
        selected: false,
      });
    }
  }

  private async loadJson(url: string) {
    const response = await fetch(url);
    return await response.json();
  }

  private get255BasedColor(color: THREE.Color | string) {
    const tmpColor = new THREE.Color(color);
    const base = tmpColor.toArray().map((v: number) => v * 255);
    base.push(255);
    return base;
  }

  private setPaletteColor(index: number, color: ArrayLike<number>) {
    this.palette.set(color, index * 4);
  }

  private resetPalette() {
    for (let i = 0; i < this.maxNumCountries; i++) {
      this.setPaletteColor(i, this.unselectedColor);
    }
    this.setPaletteColor(0, this.oceanColor);
    this.paletteTexture.needsUpdate = true;
  }

  resize() {}

  update() {
    this.updateLabels();
  }

  updateLabels() {
    if (!this.data) return;

    this.normalMatrix.getNormalMatrix(this.camera.instance.matrixWorldInverse);

    for (const countryInfo of this.countryInfos) {
      const { position, elem, area, selected } = countryInfo;

      const largeEnough = area > 10 * 10;
      const show = selected || (this.numCountriesSelected === 0 && largeEnough);
      if (!show) {
        elem.style.display = "none";
        continue;
      }

      this.tempV.copy(position);
      this.tempV.applyMatrix3(this.normalMatrix);

      this.cameraToPoint.copy(position);
      this.cameraToPoint
        .applyMatrix4(this.camera.instance.matrixWorldInverse)
        .normalize();

      const dot = this.tempV.dot(this.cameraToPoint);
      elem.style.display = dot < -0.5 ? "" : "none";

      this.tempV.copy(position);
      this.tempV.project(this.camera.instance);

      const x = (this.tempV.x * 0.5 + 0.5) * this.experience.config.width;
      const y = (this.tempV.y * -0.5 + 0.5) * this.experience.config.height;
      elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      elem.style.zIndex = String(((-this.tempV.z * 0.5 + 0.5) * 100000) | 0);
    }
  }
}
