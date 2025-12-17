import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/earth.vert";
import fragmentShader from "./glsl/earth.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  material: THREE.ShaderMaterial | null = null;

  sunPosition: THREE.Vector3;
  earth!: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.sunPosition = new THREE.Vector3()
    this.createSun();
    this.createEarth();
  }

  private createSun() {
    const sunGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);

    const radius = 3;
    const params = {
      theta: 0,
      phi: 0
    }
    const x = radius * Math.cos(params.theta) * Math.sin(params.phi);
    const y = radius * Math.sin(params.theta);
    const z = radius * Math.cos(params.theta) * Math.cos(params.phi);
    sun.position.set(x,y,z)
    this.sunPosition.set(x,y,z)

    this.gui.add(params, "theta").min(-Math.PI / 2).max(Math.PI / 2).step(0.1).onChange(()=>{
      const x = radius * Math.cos(params.theta) * Math.sin(params.phi);
      const y = radius * Math.sin(params.theta);
      const z = radius * Math.cos(params.theta) * Math.cos(params.phi);
      sun.position.set(x,y,z)
      this.sunPosition.set(x,y,z)
    });
    this.gui.add(params, "phi").min(0).max(Math.PI * 2).step(0.1).onChange(()=>{
      const x = radius * Math.cos(params.theta) * Math.sin(params.phi);
      const y = radius * Math.sin(params.theta);
      const z = radius * Math.cos(params.theta) * Math.cos(params.phi);
      sun.position.set(x,y,z)
      this.sunPosition.set(x,y,z)
    });

    this.scene.add(sun);
  }

  private createEarth() {
    const dayTexture = this.resource.items.earthDay as THREE.Texture;
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    // dayTexture.magFilter = THREE.NearestFilter;
    // dayTexture.minFilter = THREE.NearestFilter;
    dayTexture.anisotropy = 8;
    
    const nightTexture = this.resource.items.earthNight as THREE.Texture;
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    // nightTexture.magFilter = THREE.NearestFilter;
    // nightTexture.minFilter = THREE.NearestFilter;
    nightTexture.anisotropy = 8;
    const specularCloudsTexture = this.resource.items.earthSpecularClouds;
    specularCloudsTexture.anisotropy = 8;

    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uDayTexture: { value: dayTexture },
        uNightTexture: { value: nightTexture },
        uSpecularCloudsTexture: { value: specularCloudsTexture },
        uSunDirection: { value: this.sunPosition }
      },
    });
    this.earth = new THREE.Mesh(geometry, material);
    this.scene.add(this.earth);
  }

  update() {
    this.earth.rotation.y = this.experience.time.elapsed / 4000;
  }
}
