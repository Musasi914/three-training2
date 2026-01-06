import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";

type File = {
  NODATA_value: number;
  cellsize: number;
  data: number[][];
  max: number;
  min: number;
  ncols: number;
  nrows: number;
};

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    this.loadFile(
      "https://threejs.org/manual/examples/resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc"
    )
      .then(this.parseData)
      .then((file) => {
        this.drawData(file);
        this.addBoxes(file);
      });

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
    const data: number[][] = [];
    const settings: File = {
      data,
      NODATA_value: 0,
      cellsize: 0,
      max: -Infinity,
      min: Infinity,
      ncols: 0,
      nrows: 0,
    };

    text.split("\n").forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const key = parts[0] as keyof File;
        if (key in settings) {
          (settings[key] as number) = parseFloat(parts[1]);
        }
      } else if (parts.length > 2) {
        const values = parts.map((v) => {
          const value = parseFloat(v);
          if (value === settings.NODATA_value) return undefined;
          settings.max = Math.max(
            settings.max === undefined ? value : settings.max,
            value
          );
          settings.min = Math.min(
            settings.min === undefined ? value : settings.min,
            value
          );
          return value;
        });
        data.push(values as number[]);
      }
    });

    return settings;
  }
  private drawData(file: File) {
    const { min, max, data, ncols, nrows } = file;
    const range = max - min;
    const ctx = (document.getElementById(
      "canvas2d"
    ) as HTMLCanvasElement)!.getContext("2d")!;

    ctx.canvas.width = ncols;
    ctx.canvas.height = nrows;

    ctx.canvas.style.width = `${ncols * 2}px`;
    ctx.canvas.style.height = `${nrows * 2}px`;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    data.forEach((row, latNdx) => {
      row.forEach((value, lonNdx) => {
        if (value === undefined) return;
        const amount = (value - min) / range;
        const hue = 0.1;
        const saturation = 1;
        const lightness = amount;
        ctx.fillStyle = `hsl(${hue * 360}, ${saturation * 100}%, ${
          lightness * 300
        }%)`;
        ctx.fillRect(lonNdx * 1, latNdx * 1, 1, 1);
      });
    });
  }

  private addBoxes(file: File) {
    const { min, max, data } = file;
    const range = max - min;

    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // geometry.translate(0, 0, 0.5);
    // geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.5));

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

    const lonFudge = Math.PI * 0.5;
    const latFudge = Math.PI * -0.135;

    const geometries: THREE.BufferGeometry[] = [];

    data.forEach((row, latNdx) => {
      row.forEach((value, lonNdx) => {
        if (value === undefined) return;
        const amount = (value - min) / range;
        // const material = new THREE.MeshBasicMaterial();
        // const hue = THREE.MathUtils.lerp(0.7, 0.3, amount);
        // const saturation = 1;
        // const lightness = THREE.MathUtils.lerp(0.1, 1.0, amount);
        // material.color.setHSL(hue, saturation, lightness);
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const mesh = new THREE.Mesh(geometry, material);
        // this.scene.add(mesh);

        // adjust the helpers to point to the latitude and longitude
        lonHelper.rotation.y =
          THREE.MathUtils.degToRad(lonNdx - 180) + lonFudge;
        latHelper.rotation.x = THREE.MathUtils.degToRad(latNdx - 60) + latFudge;

        // use the world matrix of the position helper to
        // position this mesh.
        // positionHelper.updateWorldMatrix(true, false);
        // mesh.applyMatrix4(positionHelper.matrixWorld);
        // mesh.scale.set(0.005, 0.005, THREE.MathUtils.lerp(0.01, 0.5, amount));

        positionHelper.scale.set(
          0.005,
          0.005,
          THREE.MathUtils.lerp(0.01, 0.5, amount)
        );
        originHelper.updateWorldMatrix(true, false);
        geometry.applyMatrix4(originHelper.matrixWorld);

        geometries.push(geometry);
      });
    });
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(
      geometries,
      false
    );
    const materila = new THREE.MeshBasicMaterial({ color: "red" });
    const mesh = new THREE.Mesh(mergedGeometry, materila);
    this.scene.add(mesh);
  }

  resize() {}

  update() {}
}
