import Experience from "./Experience";
import * as THREE from "three/webgpu";
import GfxConfig from "./gfx/gfxConfig";
import {
  color,
  cos,
  cross,
  dFdx,
  dFdy,
  float,
  floatBitsToInt,
  Fn,
  Loop,
  mx_noise_vec3,
  normalize,
  normalLocal,
  positionLocal,
  positionWorld,
  sin,
  time,
  transformNormalToView,
  uint,
  uniform,
  uv,
  varying,
  vec3,
} from "three/tsl";
import { octavesNoiseVec3 } from "./gfx/utils/octavesNoise";

export default class Example {
  private experience: Experience;
  private scene: Experience["scene"];
  private gui: Experience["gui"];

  private gfxConfig: GfxConfig;
  private subdivisitions: number;

  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardNodeMaterial;
  private mesh!: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.gui.hide();

    this.gfxConfig = new GfxConfig();
    this.subdivisitions = this.gfxConfig.subdivisions;

    this.createGeometry();
    this.createMaterial();
    this.createMesh();
    this.updateMaterialNode();
    this.addToScene();
  }

  private createGeometry() {
    this.geometry = new THREE.PlaneGeometry(
      100,
      100,
      this.subdivisitions,
      this.subdivisitions
    );
    this.geometry.rotateX(-Math.PI / 2);
  }

  private createMaterial() {
    this.material = new THREE.MeshStandardNodeMaterial({
      side: THREE.DoubleSide,
    });
  }

  private createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  private addToScene() {
    this.scene.add(this.mesh);
  }

  private updateMaterialNode() {
    const {
      octaves,
      initialFrequency,
      initialAmplitude,
      warpFrequency,
      warpStrength,
    } = this.gfxConfig;
    const vPosition = varying(vec3());
    const vNormal = varying(vec3());

    this.material.positionNode = Fn(() => {
      const position = positionLocal.toVar();
      const height = vec3(0.0).toVar();
      const frequency = initialFrequency.toVar();
      const amplitude = initialAmplitude.toVar();
      const normalLookUpShift = float(0.01);
      const neighborA = positionLocal
        .add(vec3(normalLookUpShift, 0.0, 0.0))
        .toVar();
      const neighborB = positionLocal
        .add(vec3(0.0, 0.0, normalLookUpShift.negate()))
        .toVar();
      const heightA = vec3(0.0).toVar();
      const heightB = vec3(0.0).toVar();

      const ws = positionLocal.toVar();
      const wsA = neighborA.toVar();
      const wsB = neighborB.toVar();

      const warp = mx_noise_vec3(ws.mul(warpFrequency)).mul(warpStrength);
      const warpA = mx_noise_vec3(wsA.mul(warpFrequency)).mul(warpStrength);
      const warpB = mx_noise_vec3(wsB.mul(warpFrequency)).mul(warpStrength);
      ws.addAssign(warp);
      wsA.addAssign(warpA);
      wsB.addAssign(warpB);

      Loop(octaves, () => {
        const noise = octavesNoiseVec3({
          p: ws,
          freq: frequency,
          amp: amplitude,
        });

        const noiseA = octavesNoiseVec3({
          p: wsA,
          freq: frequency,
          amp: amplitude,
        });
        const noiseB = octavesNoiseVec3({
          p: wsB,
          freq: frequency,
          amp: amplitude,
        });
        height.addAssign(noise);
        heightA.addAssign(noiseA);
        heightB.addAssign(noiseB);

        frequency.mulAssign(0.5);
        amplitude.mulAssign(2.0);
      });

      position.y.addAssign(height.y);
      neighborA.y.addAssign(heightA.y);
      neighborB.y.addAssign(heightB.y);

      const toA = neighborA.sub(position).normalize();
      const toB = neighborB.sub(position).normalize();

      vNormal.assign(cross(toA, toB));
      vPosition.assign(position);

      return position;
    })();

    this.material.normalNode = transformNormalToView(vNormal);
  }

  resize() {}

  update() {}
}
