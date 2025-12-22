import * as THREE from "three";
import Experience from "./Experience";

export default class ImagePlane {
  experience: Experience;
  refImage: HTMLImageElement;
  mesh: THREE.Mesh;
  constructor(mesh: THREE.Mesh, img: HTMLImageElement) {
    this.experience = Experience.getInstance();

    this.refImage = img;
    this.mesh = mesh;
  }

  setParams() {
    const rect = this.refImage.getBoundingClientRect();

    this.mesh.scale.set(rect.width, rect.height, 1);

    const y = -rect.top + this.experience.config.height / 2 - rect.height / 2;
    this.mesh.position.set(0, y, 0);
  }

  update(scrollDiff: number) {
    this.setParams();
    // Ensure material is a ShaderMaterial and has 'uniforms' before assigning
    const material = this.mesh.material;
    if (
      (material as THREE.ShaderMaterial).uniforms &&
      (material as THREE.ShaderMaterial).uniforms.uScrollDiff
    ) {
      (material as THREE.ShaderMaterial).uniforms.uScrollDiff.value =
        scrollDiff;
    }
  }
}
