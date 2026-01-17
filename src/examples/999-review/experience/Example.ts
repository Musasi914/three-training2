// import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import Experience from "./Experience";
import * as THREE from "three";
// import {
//   GPUComputationRenderer,
//   SimplexNoise,
//   type Variable,
// } from "three/examples/jsm/Addons.js";
// import vertexShader from "./glsl/sphere.vert";
// import fragmentShader from "./glsl/sphere.frag";

type Settings = {
  min: number;
  max: number;
  ncols: number;
  nrows: number;
  xllcorner: number;
  yllcorner: number;
  cellsize: number;
  NODATA_value: number;
  data: (number | undefined)[][];
};

export default class Example {
  static url =
    "https://threejs.org/manual/examples/resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc";

  settings: Settings = {
    min: Infinity,
    max: -Infinity,
    ncols: 0,
    nrows: 0,
    xllcorner: 0,
    yllcorner: 0,
    cellsize: 0,
    NODATA_value: 0,
    data: [],
  };

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  resource: Experience["resource"];

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.resource = this.experience.resource;

    this.settingData().then(() => {
      console.log(this.settings);
      this.createSphere();
      this.createBox();
    });
  }

  private async settingData() {
    const res = await fetch(Example.url);
    const jsonRes = await res.text();

    jsonRes.split("\n").forEach((line) => {
      const data = line.trim().split(/\s+/);
      if (data.length === 2) {
        const key = data[0] as keyof Settings;
        if (key !== "data") this.settings[key] = Number(data[1]);
      } else if (data.length > 2) {
        const newArray = data.map((value) => {
          if (value === "-9999") return undefined;

          this.settings.min = Math.min(this.settings.min, Number(value));
          this.settings.max = Math.max(this.settings.max, Number(value));
          return Number(value);
        });

        this.settings.data.push(newArray);
      }
    });
  }

  private createSphere() {
    const texture = this.resource.items.earth as THREE.Texture;
    const geometry = new THREE.SphereGeometry();
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  private createBox() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, 0, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const latHelper = new THREE.Group();
    this.scene.add(latHelper);
    const lonHelper = new THREE.Group();
    latHelper.add(lonHelper);
    const boxHelper = new THREE.Group();
    boxHelper.position.z = 1;
    lonHelper.add(boxHelper);

    const originHelper = new THREE.Group();
    originHelper.position.z = 0.5;
    boxHelper.add(originHelper);

    const range = this.settings.max - this.settings.min;

    this.settings.data.forEach((row, latNdx) => {
      row.forEach((value, lonNdx) => {
        if (value === undefined) return;

        const amount = (value - this.settings.min) / range;

        latHelper.rotation.x =
          (Math.PI / 180) * (latNdx + this.settings.yllcorner + 90);
        lonHelper.rotation.y =
          (Math.PI / 180) * (lonNdx + this.settings.xllcorner - 30);

        const box = new THREE.Mesh(geometry, material);
        this.scene.add(box);

        boxHelper.scale.set(
          0.005,
          0.005,
          THREE.MathUtils.lerp(0.01, 0.5, amount)
        );
        originHelper.updateWorldMatrix(true, false);
        box.applyMatrix4(originHelper.matrixWorld);
      });
    });
  }

  resize() {}

  update() {}
}
