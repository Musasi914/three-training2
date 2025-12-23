import { OrbitControls } from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";
import Layer2 from "./Layer2";

export default class Example {
  static planeSize = 40;
  static sphereCount = 15;
  static sphereRadius = 1;
  static shadowSize = 1;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];

  planeGeometry!: THREE.PlaneGeometry;
  planeMaterial!: THREE.MeshPhongMaterial;
  planeMesh!: THREE.Mesh;

  shadowGeo!: THREE.PlaneGeometry;
  sphereGeo!: THREE.SphereGeometry;

  sphereShadowBases: {
    base: THREE.Object3D;
    sphereMesh: THREE.Mesh;
    shadowMesh: THREE.Mesh;
    y: number;
  }[] = [];

  view1El: HTMLDivElement;
  view2El: HTMLDivElement;

  camera2!: THREE.PerspectiveCamera;
  layer2!: Layer2;
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    this.createPlane();

    const { shadowGeo, sphereGeo } = this.createShadowAndSphereGeos();
    this.shadowGeo = shadowGeo;
    this.sphereGeo = sphereGeo;

    this.createSpheres();

    this.view1El = document.querySelector("#view1") as HTMLDivElement;
    this.view2El = document.querySelector("#view2") as HTMLDivElement;

    this.createView2Camera();

    this.setLayers();

    this.layer2 = new Layer2();
  }

  private createPlane() {
    const texture = this.experience.resource.items.board;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Example.planeSize / 2, Example.planeSize / 2);
    texture.generateMipmaps = false;

    this.planeGeometry = new THREE.PlaneGeometry(
      Example.planeSize,
      Example.planeSize
    );
    this.planeMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    this.planeMaterial.color.setRGB(1.5, 1.5, 1.5);
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.planeMesh.rotation.x = -Math.PI / 2;
    this.planeMesh.receiveShadow = true;
    this.scene.add(this.planeMesh);
  }

  private createSpheres() {
    for (let i = 0; i < Example.sphereCount; i++) {
      const base = new THREE.Group();
      this.scene.add(base);

      const shadowTexture = this.experience.resource.items.shadow;
      shadowTexture.colorSpace = THREE.SRGBColorSpace;
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(this.shadowGeo, shadowMat);
      shadowMesh.position.y = 0.01;
      shadowMesh.rotation.x = -Math.PI / 2;
      const shadowSize = Example.sphereRadius * 3;
      shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
      base.add(shadowMesh);

      const u = i / Example.sphereCount;
      const sphereMat = new THREE.MeshPhongMaterial();
      sphereMat.color.setHSL(u, 1, 0.74);
      const sphereMesh = new THREE.Mesh(this.sphereGeo, sphereMat);
      sphereMesh.position.set(0, Example.sphereRadius + 2, 0);
      base.add(sphereMesh);

      this.sphereShadowBases.push({
        base,
        sphereMesh,
        shadowMesh,
        y: sphereMesh.position.y,
      });
    }
  }

  private createShadowAndSphereGeos() {
    const sphereGeo = new THREE.SphereGeometry(Example.sphereRadius, 32, 16);
    const shadowGeo = new THREE.PlaneGeometry(
      Example.shadowSize,
      Example.shadowSize
    );
    return { sphereGeo, shadowGeo };
  }

  private createView2Camera() {
    this.camera2 = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.camera2.position.set(0, 20, 20);
    this.camera2.lookAt(0, 0, 0);
    const controls = new OrbitControls(this.camera2, this.view2El);
    controls.update();

    // sceneにaddする必要はない？
  }

  private setLayers() {
    this.planeMesh.layers.set(2);
    this.sphereShadowBases.forEach((sphereShadowBase) => {
      sphereShadowBase.base.layers.set(0);
    });
    this.experience.camera.instance.layers.set(0);
    this.experience.camera.instance.layers.enable(2);

    this.camera2.layers.set(1);
    this.camera2.layers.enable(2);
  }

  resize() {}

  update() {
    this.experience.renderer.instance.setScissorTest(true);

    const time = this.experience.time.elapsed / 1000;
    this.sphereShadowBases.forEach((sphereShadowBase, ndx) => {
      const { base, sphereMesh, shadowMesh, y } = sphereShadowBase;

      const u = ndx / this.sphereShadowBases.length;
      const angle = Math.PI * 2 * u + (time / 3) * (ndx % 2 === 0 ? 1 : -1);
      const radius = Math.sin(time / 10 + u - ndx) * 10;
      base.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      const interpolatedValue = Math.abs(Math.sin(time * 2 - ndx));

      // createSpheresでデフォルトがy=2になっているので、-2から2の間で補完する
      sphereMesh.position.y =
        y + THREE.MathUtils.lerp(-2, 2, interpolatedValue);

      (shadowMesh.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(1, 0.1, interpolatedValue);
    });

    // view1
    const aspect1 = this.setScissorForElement(this.view1El);
    this.experience.camera.instance.aspect = aspect1;
    this.experience.camera.instance.updateProjectionMatrix();
    this.experience.renderer.instance.render(
      this.scene,
      this.experience.camera.instance
    );

    const aspect2 = this.setScissorForElement(this.view2El);
    this.camera2.aspect = aspect2;
    this.camera2.updateProjectionMatrix();
    this.experience.renderer.instance.render(this.scene, this.camera2);
  }

  private setScissorForElement(el: HTMLDivElement) {
    const canvasRect = this.experience.canvasWrapper.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // compute a canvas relative rectangle
    const right = Math.min(elRect.right, canvasRect.right) - canvasRect.left;
    const left = Math.max(elRect.left - canvasRect.left, 0);
    const bottom = Math.min(elRect.bottom, canvasRect.bottom) - canvasRect.top;
    const top = Math.max(0, elRect.top - canvasRect.top);

    const width = Math.min(canvasRect.width, right - left);
    const height = Math.min(canvasRect.height, bottom - top);

    this.experience.renderer.instance.setScissor(left, top, width, height);
    this.experience.renderer.instance.setViewport(left, top, width, height);

    return width / height;
  }
}
