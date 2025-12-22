import Experience from "./Experience";
import * as THREE from "three";
import { SUBTRACTION, Brush, Evaluator } from "three-bvh-csg";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "./glsl/vert.vert";
import fragmentShader from "./glsl/frag.frag";
export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];

  terrainGeometry!: THREE.PlaneGeometry;
  terrainMaterial!: CustomShaderMaterial;
  terrainMesh!: THREE.Mesh;

  uniforms = {
    uTime: new THREE.Uniform(0),
    uColorWaterDeep: new THREE.Uniform(new THREE.Color(0x002b3d)),
    uColorWaterSurface: new THREE.Uniform(new THREE.Color(0x66a8ff)),
    uColorSand: new THREE.Uniform(new THREE.Color(0xfff3b0)),
    uColorGrass: new THREE.Uniform(new THREE.Color(0x85d534)),
    uColorRock: new THREE.Uniform(new THREE.Color(0xbfbd8d)),
    uColorSnow: new THREE.Uniform(new THREE.Color(0xffffff)),
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.gui.hide();

    this.createBox();

    this.createTerrain();

    this.createWater();
  }

  private createBox() {
    const box1 = new Brush(new THREE.BoxGeometry(11, 2, 11));
    const box2 = new Brush(new THREE.BoxGeometry(10, 2.1, 10));
    box2.updateMatrixWorld();
    const evaluator = new Evaluator();
    const result = evaluator.evaluate(box1, box2, SUBTRACTION);
    result.geometry.clearGroups();
    result.material = new THREE.MeshStandardMaterial();
    result.castShadow = true;
    result.receiveShadow = true;

    this.scene.add(result);
  }

  private createTerrain() {
    this.terrainGeometry = new THREE.PlaneGeometry(10, 10, 512, 512);
    this.terrainGeometry.rotateX(-Math.PI / 2);
    this.terrainGeometry.deleteAttribute("normal");
    this.terrainGeometry.deleteAttribute("uv");

    const depthMaterial = this.createDepthMaterial();

    this.terrainMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshStandardMaterial,
      metalness: 0,
      roughness: 0.4,
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
    });

    this.terrainMesh = new THREE.Mesh(
      this.terrainGeometry,
      this.terrainMaterial
    );
    this.terrainMesh.castShadow = true;
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.customDepthMaterial = depthMaterial;
    this.scene.add(this.terrainMesh);
  }

  private createDepthMaterial() {
    const depthMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader,
      uniforms: this.uniforms,
      depthPacking: THREE.RGBADepthPacking,
    });
    return depthMaterial;
  }

  private createWater() {
    const waterGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);

    const waterMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      roughness: 0.3,
    });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = -0.1;
    water.rotation.x = -Math.PI / 2;
    this.scene.add(water);
  }

  resize() {}

  update() {
    this.terrainMaterial.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;
  }
}
