import * as THREE from "three";
import Experience from "./Experience";
import Example from "./Example";

export default class GPUPickHelper {
  experience: Experience = Experience.getInstance();
  renderer: THREE.WebGLRenderer = this.experience.renderer.instance;

  pickedObject:
    | (THREE.Mesh & { material: THREE.MeshPhongMaterial })
    | undefined;
  pickedObjectSavedColor: number | undefined;

  pickingTexture: THREE.WebGLRenderTarget;
  pixelBuffer: Uint8Array;

  example: Example = Example.getInstance();
  idToObject: Example["idToObject"] = this.example.idToObject;

  constructor() {
    this.pickedObject;
    this.pickedObjectSavedColor;

    this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
    this.pixelBuffer = new Uint8Array(4);
  }

  pick(cssPosition: THREE.Vector2, scene: THREE.Scene, camera: THREE.PerspectiveCamera, time: number) {
    if (this.pickedObject && this.pickedObjectSavedColor !== undefined) {
    this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
    this.pickedObject = undefined;
    }
    
    const pixelRatio = this.experience.config.pixelRatio;
    
    // set the view offset to represent just a single pixel under the mouse
    camera.setViewOffset(
        this.renderer.getContext().drawingBufferWidth,   // full width
        this.renderer.getContext().drawingBufferHeight,  // full top
        cssPosition.x * pixelRatio | 0,             // rect x
        cssPosition.y * pixelRatio | 0,             // rect y
        1,                                          // rect width
        1,                                          // rect height
    );

    // render the scene
    this.renderer.setRenderTarget(this.pickingTexture)
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);

    // clear the view offset so rendering returns to normal
    camera.clearViewOffset();

    this.renderer.readRenderTargetPixels(
        this.pickingTexture,
        0,   // x
        0,   // y
        1,   // width
        1,   // height
      this.pixelBuffer);
    
    const id =
        (this.pixelBuffer[0] << 16) |
        (this.pixelBuffer[1] <<  8) |
      (this.pixelBuffer[2]);
    

    const intersectedObject = this.idToObject[id];
    if (intersectedObject && intersectedObject.material instanceof THREE.MeshPhongMaterial) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObject as THREE.Mesh & { material: THREE.MeshPhongMaterial };
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color to flashing red/yellow
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}
