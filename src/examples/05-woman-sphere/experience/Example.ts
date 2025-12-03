import { TransformControls } from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import * as THREE from "three";
import { CCDIKSolver } from "three/addons/animation/CCDIKSolver.js";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];
  camera: Experience["camera"];
  namedObjects: Record<string, THREE.Mesh | THREE.Bone | THREE.Group> = {};

  cubeCamera!: THREE.CubeCamera;
  ccdikSolver: CCDIKSolver;

  v0 = new THREE.Vector3();
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;
    this.camera = this.experience.camera;

    this.setModel();

    this.setCamera();

    this.namedObjects.hand_l.attach(this.namedObjects.boule);

    this.setBouleMaterial();
    this.ccdikSolver = this.setCCDIKSolver();

    this.setTransformControls();
  }

  private setModel() {
    const gltf = this.resource.items.model;
    gltf.scene.traverse((child: THREE.Mesh | THREE.Bone | THREE.Group) => {
      if (
        child.name === "head" ||
        child.name === "lowerarm_l" ||
        child.name === "Upperarm_l" ||
        child.name === "hand_l" ||
        child.name === "target_hand_l" ||
        child.name === "boule" ||
        child.name === "Kira_Shirt_left"
      ) {
        this.namedObjects[child.name] = child;
      }
    });
    this.scene.add(gltf.scene);
  }

  private setCamera() {
    const targetPosition = this.namedObjects.boule.position;
    this.camera.instance.lookAt(targetPosition);
    this.camera.controls.target.copy(targetPosition);
  }

  private setBouleMaterial() {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      type: THREE.HalfFloatType,
    });
    this.cubeCamera = new THREE.CubeCamera(0.1, 40, cubeRenderTarget);
    this.scene.add(this.cubeCamera);
    const mirrorSphereMaterial = new THREE.MeshBasicMaterial({
      envMap: cubeRenderTarget.texture,
    });
    (this.namedObjects.boule as THREE.Mesh).material = mirrorSphereMaterial;
  }
  private setCCDIKSolver() {
    const skelton = this.namedObjects.Kira_Shirt_left;
    const iks = [
      {
        target: 22,
        effector: 6,
        links: [
          {
            index: 5,
            rotationMin: new THREE.Vector3(1.2, -1.8, -0.4),
            rotationMax: new THREE.Vector3(1.7, -1.1, 0.3),
          },
          {
            index: 4,
            rotationMin: new THREE.Vector3(0.1, -0.7, -1.8),
            rotationMax: new THREE.Vector3(1.1, 0, -1.4),
          },
        ],
      },
    ];
    const solver = new CCDIKSolver(skelton as THREE.SkinnedMesh, iks);

    return solver;
  }

  private setTransformControls() {
    const transformControls = new TransformControls(
      this.camera.instance,
      this.experience.canvasWrapper
    );
    transformControls.attach(this.namedObjects.target_hand_l);
    this.scene.add(transformControls.getHelper());

    transformControls.addEventListener(
      "mouseDown",
      () => (this.experience.camera.controls.enabled = false)
    );
    transformControls.addEventListener(
      "mouseUp",
      () => (this.experience.camera.controls.enabled = true)
    );
  }

  update() {
    if (!this.namedObjects.boule || !this.cubeCamera) return;

    this.namedObjects.boule.visible = false;
    this.namedObjects.boule.getWorldPosition(this.cubeCamera.position);
    this.cubeCamera.update(this.experience.renderer.instance, this.scene);
    this.namedObjects.boule.visible = true;

    this.namedObjects.boule.getWorldPosition(this.v0);
    this.camera.controls.target.lerp(this.v0, 0.1);

    this.namedObjects.boule.getWorldPosition(this.v0);
    this.namedObjects.head.lookAt(this.v0);
    this.namedObjects.head.rotation.set(
      this.namedObjects.head.rotation.x,
      this.namedObjects.head.rotation.y + Math.PI,
      this.namedObjects.head.rotation.z
    );

    this.ccdikSolver.update();
  }
}
