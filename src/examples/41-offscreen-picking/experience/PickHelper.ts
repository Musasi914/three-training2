import * as THREE from "three";
import Experience from "./Experience";

export default class GPUPickHelper {
  experience: Experience = Experience.getInstance();
  renderer: THREE.WebGLRenderer = this.experience.renderer.instance;

  pickedObject: THREE.Mesh | null = null;
  pickedObjectSavedColor: number | null = null;

  pickingTexture: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(1, 1);
  pixelBuffer: Uint8Array = new Uint8Array(4);

  pickPosition: THREE.Vector2 = new THREE.Vector2(-9999, -9999);

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const canvasWrapper = this.experience.canvasWrapper;
    canvasWrapper.addEventListener(
      "pointerdown",
      this.clearPickPosition.bind(this)
    );
    canvasWrapper.addEventListener(
      "pointerup",
      this.clearPickPosition.bind(this)
    );
    canvasWrapper.addEventListener(
      "pointermove",
      this.setPickPosition.bind(this)
    );
  }

  private clearPickPosition() {
    this.pickPosition.set(-9999, -9999);
  }

  private setPickPosition(event: PointerEvent) {
    const rect = this.experience.canvasWrapper.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) * this.experience.config.width) / rect.width;
    const y =
      ((event.clientY - rect.top) * this.experience.config.height) /
      rect.height;
    this.pickPosition.set(x, y);
    console.log(x, y);
  }

  pick(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    idToObject: Record<number, THREE.Mesh>
  ) {
    if (
      this.pickedObject &&
      "color" in this.pickedObject.material &&
      this.pickedObject.material.color instanceof THREE.Color &&
      this.pickedObjectSavedColor !== null
    ) {
      this.pickedObject.material.color.setHex(this.pickedObjectSavedColor);
      this.pickedObject = null;
    }

    camera.setViewOffset(
      this.experience.config.width,
      this.experience.config.height,
      this.pickPosition.x * this.experience.config.pixelRatio,
      this.pickPosition.y * this.experience.config.pixelRatio,
      1,
      1
    );

    this.renderer.setRenderTarget(this.pickingTexture);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);

    camera.clearViewOffset();

    this.renderer.readRenderTargetPixels(
      this.pickingTexture,
      0,
      0,
      1,
      1,
      this.pixelBuffer
    );

    const id =
      (this.pixelBuffer[0] << 16) |
      (this.pixelBuffer[1] << 8) |
      this.pixelBuffer[2];

    const intersectedObject = idToObject[id];
    if (intersectedObject) {
      this.pickedObject = intersectedObject;
      this.pickedObjectSavedColor = (
        this.pickedObject.material as THREE.MeshPhongMaterial
      ).emissive.getHex();
    }
  }
}
