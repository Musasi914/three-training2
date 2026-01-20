import Experience from "./Experience";
import * as THREE from "three";
import fragmentShader from "./glsl/frag.frag";

export default class Example {
  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  resource: Experience["resource"];
  uniforms: Record<string, THREE.Uniform> = {
    iTime: new THREE.Uniform(0),
    iResolution: new THREE.Uniform(new THREE.Vector3())
  }

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;
    this.resource = this.experience.resource;

    const texture = this.resource.items.bayer as THREE.Texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = false;
    this.uniforms.iChannel0 = new THREE.Uniform(texture);

    const plane = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      fragmentShader,
      uniforms: this.uniforms,
    })
    this.scene.add(new THREE.Mesh(plane, material));
  } 

  resize() {}

  update() {
    this.uniforms.iTime.value = this.experience.time.elapsed / 1000;
    this.uniforms.iResolution.value.set(this.experience.config.width, this.experience.config.height, 1);
  }
 
}
