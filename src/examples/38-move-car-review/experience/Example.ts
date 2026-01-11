import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";

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

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

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

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    this.createSphere();

    this.loadFile(Example.url)
      .then(this.parseData.bind(this))
      .then(this.addBoxes.bind(this));
  }

  private createSphere() {
    const texture = this.experience.resource.items.world as THREE.Texture;
    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  private async loadFile(url: string) {
    const res = await fetch(url);
    return res.text();
  }

  private parseData(text: string) {
    text.split("\n").forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const key = parts[0] as keyof Settings;
        if (key in this.settings && key !== "data") {
          this.settings[key] = Number(parts[1]);
        }
      } else if (parts.length > 2) {
        const values = parts.map((v) => {
          const value = Number(v);
          if (value === this.settings.NODATA_value) return undefined;

          this.settings.max = Math.max(value, this.settings.max);
          this.settings.min = Math.min(value, this.settings.min);
          return value;
        });

        this.settings.data.push(values);
      }
    });

    return this.settings;
  }

  private addBoxes() {
    const range = this.settings.max - this.settings.min;

    const lonHelper = new THREE.Object3D();
    this.scene.add(lonHelper);

    const latHelper = new THREE.Object3D();
    lonHelper.add(latHelper);

    const positionHelper = new THREE.Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);

    const originHelper = new THREE.Object3D();
    originHelper.position.z = 0.5;
    positionHelper.add(originHelper);

    const geometries: THREE.BufferGeometry[] = [];

    const lonFudge = Math.PI / 2;
    const latFudge = Math.PI * -0.135;

    const color = new THREE.Color();

    this.settings.data.forEach((row, latNdx) => {
      row.forEach((value, lonNdx) => {
        if (value === undefined) return;

        const amount = (value - this.settings.min) / range;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        geometry.deleteAttribute("uv");
        geometry.deleteAttribute("normal");
        // const material = new THREE.MeshBasicMaterial();
        // material.color.setHSL(1, 1, THREE.MathUtils.lerp(0.2, 1.0, amount));
        // const mesh = new THREE.Mesh(geometry, material);

        lonHelper.rotation.y =
          THREE.MathUtils.degToRad(lonNdx + this.settings.xllcorner) + lonFudge;
        latHelper.rotation.x =
          THREE.MathUtils.degToRad(latNdx + this.settings.yllcorner) + latFudge;

        positionHelper.scale.set(
          0.005,
          0.005,
          THREE.MathUtils.lerp(0.01, 0.5, amount)
        );
        originHelper.updateWorldMatrix(true, false);
        geometry.applyMatrix4(originHelper.matrixWorld);

        // color
        const hue = THREE.MathUtils.lerp(0.7, 0.3, amount);
        const saturation = 1;
        const lightness = THREE.MathUtils.lerp(0.4, 1.0, amount);
        color.setHSL(hue, saturation, lightness);
        const rgb = color.toArray().map((v) => v * 255);

        const numVerts = geometry.getAttribute("position").count;
        const colors = new Uint8Array(3 * numVerts);
        colors.forEach((_, ndx) => {
          colors[ndx] = rgb[ndx % 3];
        });
        geometry.setAttribute(
          "color",
          new THREE.BufferAttribute(colors, 3, true)
        );

        geometries.push(geometry);
      });
    });

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(
      geometries,
      false
    );
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(mergedGeometry, material);
    this.scene.add(mesh);
  }

  resize() {}

  update() {}
}
