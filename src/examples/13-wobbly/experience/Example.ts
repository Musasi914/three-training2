import Experience from "./Experience";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "./glsl/sphere.vert";
import fragmentShader from "./glsl/sphere.frag";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];

  sphereMaterial!: CustomShaderMaterial;
  sphere!: THREE.Mesh;
  depthMaterial!: CustomShaderMaterial;

  params = {
    metalness: 0.4,
    roughness: 0,
    transmission: 0,
    ior: 1.5,
    thickness: 1.5,
    color: new THREE.Color(1.0, 0.5, 0.5),
  };
  uniforms = {
    uTime: new THREE.Uniform(0),
    
    uPositionFrequency: new THREE.Uniform(0.5),
    uTimeFrequency: new THREE.Uniform(0.4),
    uStrength: new THREE.Uniform(0.3),

    uWarpPositionFrequency: new THREE.Uniform(0.38),
    uWarpTimeFrequency: new THREE.Uniform(0.12),
    uWarpStrength: new THREE.Uniform(1.7),

    uColorA: new THREE.Uniform(new THREE.Color(0xff0000)),
    uColorB: new THREE.Uniform(new THREE.Color(0x0000ff)),
  }
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.setEnvMap();

    this.createSphere();
    this.computeTangents();
    this.createDepthMaterial();
    this.createPlane();

    this.createGUI();
  }

  private createSphere() {
    const sphereGeometry = new THREE.IcosahedronGeometry(2, 128);
    this.sphereMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      metalness: this.params.metalness,
      roughness: this.params.roughness,
      transmission: this.params.transmission,
      ior: this.params.ior,
      thickness: this.params.thickness,
      color: this.params.color,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        ...this.uniforms,
      },
    });
    this.sphere = new THREE.Mesh(sphereGeometry, this.sphereMaterial);

    // console.log(this.sphere.geometry.computeTangents())
    
    this.sphere.castShadow = true;
    this.scene.add(this.sphere);
  }

  private computeTangents() {
    this.sphere.geometry = BufferGeometryUtils.mergeVertices(this.sphere.geometry);
    this.sphere.geometry.computeTangents();
  }

  private createDepthMaterial() {
    this.depthMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      depthPacking: THREE.RGBADepthPacking,
      vertexShader: vertexShader,
      uniforms: {
        ...this.uniforms,
      },
    });
    this.sphere.customDepthMaterial = this.depthMaterial;
  }

  private createPlane() {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial()
    );
    plane.position.z = 4;
    plane.rotation.y = Math.PI;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private setEnvMap() {
    const envMap = this.resource.items.envMap;
    this.scene.environment = envMap;
    this.scene.background = envMap;
  }

  private createGUI() {
    const material = this
      .sphereMaterial as unknown as THREE.MeshPhysicalMaterial;

    this.gui
      .add(this.params, "metalness")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value: number) => {
        material.metalness = value;
      });
    this.gui
      .add(this.params, "roughness")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value: number) => {
        material.roughness = value;
      });
    this.gui
      .add(this.params, "transmission")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value: number) => {
        material.transmission = value;
      });
    this.gui
      .add(this.params, "ior")
      .min(1)
      .max(2)
      .step(0.01)
      .onChange((value: number) => {
        material.ior = value;
      });
    this.gui
      .add(this.params, "thickness")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value: number) => {
        material.thickness = value;
      });

    this.gui.add(this.uniforms.uPositionFrequency, "value")
      .name("Position Frequency")
      .min(0)
      .max(1)
      .step(0.01);

    this.gui.add(this.uniforms.uTimeFrequency, "value")
      .name("Time Frequency")
      .min(0)
      .max(1)
      .step(0.01);

    this.gui.add(this.uniforms.uStrength, "value")
      .name("Strength")
      .min(0)
      .max(1.6)
      .step(0.01);

    this.gui.add(this.uniforms.uWarpPositionFrequency, "value")
      .name("Warp Position Frequency")
      .min(0)
      .max(1)
      .step(0.01);

    this.gui.add(this.uniforms.uWarpTimeFrequency, "value")
      .name("Warp Time Frequency")
      .min(0)
      .max(1)
      .step(0.01);

    this.gui.add(this.uniforms.uWarpStrength, "value")
      .name("Warp Strength")
      .min(0)
      .max(1.6)
      .step(0.01);
  }

  update() {
    this.sphereMaterial.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;

    this.depthMaterial.uniforms.uTime.value =
      this.experience.time.elapsed / 1000;
  }
}
