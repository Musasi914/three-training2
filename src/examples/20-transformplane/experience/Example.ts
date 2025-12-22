import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vert.vert";
import fragmentShader from "./glsl/frag.frag";
import ImagePlane from "./ImagePlane";
import Scroll from "./Scroll";
export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];

  planeGeometry!: THREE.PlaneGeometry;
  planeMaterial!: THREE.ShaderMaterial;
  planeMesh!: THREE.Mesh;

  imagePlanes: ImagePlane[] = [];

  scroll: Scroll;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.gui.hide();

    // this.createPlane();

    const imageArray = [...document.querySelectorAll("img")];
    for (const imgEl of imageArray) {
      const texture = this.experience.resource.items.plane;
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture: { value: texture },
          uScrollDiff: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);

      const imagePlane = new ImagePlane(mesh, imgEl);
      imagePlane.setParams();
      this.imagePlanes.push(imagePlane);
    }

    this.scroll = new Scroll();
  }

  resize() {}

  update() {
    this.scroll.update();

    for (const imagePlane of this.imagePlanes) {
      imagePlane.update(this.scroll.scrollDiff);
    }
    // this.experience.camera.instance.position.y -= 10;
    // this.planeMaterial.uniforms.uTime.value =
    //   this.experience.time.elapsed / 1000;
  }
}
