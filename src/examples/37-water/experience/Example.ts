import Experience from "./Experience";
import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
  SimplexNoise,
} from "three/examples/jsm/Addons.js";
import heightmapFragmentShader from "./glsl/heightmap.frag.glsl";
import { WaterMaterial } from "./WaterMaterial";

export default class Example {
  static WIDTH = 128;
  static BOUNDS = 6;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];

  waterMesh!: THREE.Mesh;
  poolBorder!: THREE.Mesh;
  meshRay!: THREE.Mesh;
  sun!: THREE.DirectionalLight;

  gpuCompute!: GPUComputationRenderer;
  heightmapVariable!: Variable;

  simplex = new SimplexNoise();

  mouseDown = false;
  mouseCoords = new THREE.Vector2();
  raycaster = new THREE.Raycaster();

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;

    this.initWater();
    this.setupEventListeners();
  }

  private initWater() {
    // Create water mesh
    const geometry = new THREE.PlaneGeometry(
      Example.BOUNDS,
      Example.BOUNDS,
      Example.WIDTH - 1,
      Example.WIDTH - 1
    );

    const material = new WaterMaterial({
      color: 0x9bd2ec,
      metalness: 0.9,
      roughness: 0,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    this.waterMesh = new THREE.Mesh(geometry, material);
    this.waterMesh.rotation.x = -Math.PI * 0.5;
    this.waterMesh.matrixAutoUpdate = false;
    this.waterMesh.updateMatrix();
    this.waterMesh.receiveShadow = true;
    this.waterMesh.castShadow = true;
    this.scene.add(this.waterMesh);

    // Pool border
    const borderGeom = new THREE.TorusGeometry(4.2, 0.1, 12, 4);
    borderGeom.rotateX(Math.PI * 0.5);
    borderGeom.rotateY(Math.PI * 0.25);
    this.poolBorder = new THREE.Mesh(
      borderGeom,
      new THREE.MeshStandardMaterial({ color: 0x908877, roughness: 0.2 })
    );
    this.scene.add(this.poolBorder);
    this.poolBorder.receiveShadow = true;
    this.poolBorder.castShadow = true; // // Pool border

    // // Mesh for raycasting
    const geometryRay = new THREE.PlaneGeometry(
      Example.BOUNDS,
      Example.BOUNDS,
      1,
      1
    );
    this.meshRay = new THREE.Mesh(
      geometryRay,
      new THREE.MeshBasicMaterial({ color: 0xffffff, visible: false })
    );
    this.meshRay.rotation.x = -Math.PI / 2;
    this.meshRay.matrixAutoUpdate = false;
    this.meshRay.updateMatrix();
    this.scene.add(this.meshRay);

    // Light
    this.sun = new THREE.DirectionalLight(0xffffff, 4.0);
    this.sun.position.set(-1, 2.6, 1.4);
    this.scene.add(this.sun);

    // Initialize GPGPU
    this.initGPGPU();
  }

  private initGPGPU() {
    this.gpuCompute = new GPUComputationRenderer(
      Example.WIDTH,
      Example.WIDTH,
      this.renderer.instance
    );

    const heightmap0 = this.gpuCompute.createTexture();
    this.fillTexture(heightmap0);

    this.heightmapVariable = this.gpuCompute.addVariable(
      "heightmap",
      heightmapFragmentShader,
      heightmap0
    );

    this.gpuCompute.setVariableDependencies(this.heightmapVariable, [
      this.heightmapVariable,
    ]);

    this.heightmapVariable.material.uniforms["mousePos"] = {
      value: new THREE.Vector2(10000, 10000),
    };
    this.heightmapVariable.material.uniforms["mouseSize"] = { value: 0.2 };
    this.heightmapVariable.material.uniforms["viscosity"] = { value: 0.93 };
    this.heightmapVariable.material.uniforms["deep"] = { value: 0.01 };
    this.heightmapVariable.material.defines.BOUNDS = Example.BOUNDS.toFixed(1);

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  private fillTexture(texture: THREE.DataTexture) {
    const waterMaxHeight = 0.1;

    const noise = (x: number, y: number) => {
      let multR = waterMaxHeight;
      let mult = 0.025;
      let r = 0;
      for (let i = 0; i < 15; i++) {
        r += multR * this.simplex.noise(x * mult, y * mult);
        multR *= 0.53 + 0.025 * i;
        mult *= 1.25;
      }
      return r;
    };

    const pixels = texture.image.data;

    let p = 0;
    for (let j = 0; j < Example.WIDTH; j++) {
      for (let i = 0; i < Example.WIDTH; i++) {
        const x = (i * 128) / Example.WIDTH;
        const y = (j * 128) / Example.WIDTH;

        pixels[p + 0] = noise(x, y);
        pixels[p + 1] = pixels[p + 0];
        pixels[p + 2] = 0;
        pixels[p + 3] = 1;

        p += 4;
      }
    }
  }

  private setupEventListeners() {
    this.experience.canvasWrapper.addEventListener(
      "pointerdown",
      this.onPointerDown.bind(this)
    );
    this.experience.canvasWrapper.addEventListener(
      "pointerup",
      this.onPointerUp.bind(this)
    );
    this.experience.canvasWrapper.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );
  }

  private onPointerDown() {
    this.mouseDown = true;
  }

  private onPointerUp() {
    this.mouseDown = false;
    this.camera.controls.enabled = true;
  }

  private onPointerMove(event: PointerEvent) {
    const dom = this.renderer.instance.domElement;
    this.mouseCoords.set(
      (event.clientX / dom.clientWidth) * 2 - 1,
      -(event.clientY / dom.clientHeight) * 2 + 1
    );
  }

  resize() {}

  update() {
    this.raycast();

    this.gpuCompute.compute();

    if (!this.waterMesh) return;

    (this.waterMesh.material as WaterMaterial).heightmap =
      this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable).texture;
  }

  private raycast() {
    const uniforms = this.heightmapVariable.material.uniforms;
    if (!this.mouseDown) {
      uniforms["mousePos"].value.set(10000, 10000);
      return;
    }

    this.raycaster.setFromCamera(this.mouseCoords, this.camera.instance);
    const intersects = this.raycaster.intersectObject(this.meshRay);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      uniforms["mousePos"].value.set(point.x, point.z);
      if (this.camera.controls.enabled) {
        this.camera.controls.enabled = false;
      }
    } else {
      uniforms["mousePos"].value.set(10000, 10000);
    }
  }
}
