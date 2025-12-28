import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/sphere.vert";
import fragmentShader from "./glsl/sphere.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  camera: THREE.Camera;

  meshes: { imageEl: HTMLImageElement; mesh: THREE.Mesh }[] = [];

  targetScrollY: number;
  currentScrollY: number;
  scrollDiff: number;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;
    this.camera = this.experience.camera.instance;

    this.createPlanes();

    this.targetScrollY = 0;
    this.currentScrollY = 0;
    this.scrollDiff = 0;
  }

  private async createPlanes() {
    const targetImages = Array.from(
      document.querySelectorAll(".image img")
    ) as HTMLImageElement[];

    for (const imageEl of targetImages) {
      const image = await new THREE.TextureLoader().loadAsync(imageEl.src);
      image.colorSpace = THREE.SRGBColorSpace;

      const imageElBoundingBox = imageEl.getBoundingClientRect();
      const planeWidth = imageElBoundingBox.width;
      const planeHeight = imageElBoundingBox.height;
      const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
      const planeAspect = planeWidth / planeHeight;
      const imageAspect = image.image.width / image.image.height;

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture: { value: image },
          uImageAspect: { value: imageAspect },
          uPlaneAspect: { value: planeAspect },
          uScrollDiff: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(planeWidth, planeHeight, 1);
      mesh.position.set(
        imageElBoundingBox.left -
          (this.experience.config.width - imageElBoundingBox.width) / 2,
        -imageElBoundingBox.top +
          (this.experience.config.height - imageElBoundingBox.height) / 2,
        0
      );
      this.scene.add(mesh);
      this.meshes.push({ imageEl, mesh });
    }
  }

  private setPlaneParams(imageEl: HTMLImageElement, mesh: THREE.Mesh) {
    const imageElBoundingBox = imageEl.getBoundingClientRect();
    const planeWidth = imageElBoundingBox.width;
    const planeHeight = imageElBoundingBox.height;
    mesh.scale.set(planeWidth, planeHeight, 1);
    mesh.position.set(
      imageElBoundingBox.left -
        (this.experience.config.width - imageElBoundingBox.width) / 2,
      -imageElBoundingBox.top +
        (this.experience.config.height - imageElBoundingBox.height) / 2,
      0
    );
  }

  update() {
    this.targetScrollY = window.scrollY;
    this.currentScrollY = THREE.MathUtils.lerp(
      this.currentScrollY,
      this.targetScrollY,
      0.2
    );
    this.scrollDiff = this.targetScrollY - this.currentScrollY;

    this.meshes.forEach(({ imageEl, mesh }) => {
      this.setPlaneParams(imageEl, mesh);
      (mesh.material as THREE.ShaderMaterial).uniforms.uScrollDiff.value =
        this.scrollDiff;
    });
  }
}
