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
  static BOUNDS_HALF = Example.BOUNDS * 0.5;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];

  gpuCompute!: GPUComputationRenderer;
  heightmapVariable!: Variable;
  waterMesh!: THREE.Mesh;
  poolBorder!: THREE.Mesh;
  meshRay!: THREE.Mesh;
  sun!: THREE.DirectionalLight;

  mouseDown = false;
  mouseCoords = new THREE.Vector2();
  raycaster = new THREE.Raycaster();

  simplex = new SimplexNoise();
  frame = 0;
  tmpHeightmap: THREE.Texture | null = null;

  effectController = {
    mouseSize: 0.2,
    mouseDeep: 0.01,
    viscosity: 0.93,
    speed: 6,
    wireframe: false,
    shadow: false,
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;

    this.setupGUI();
    this.initWater();
    this.setupEventListeners();
  }

  private setupGUI() {
    const valuesChanger = () => {
      this.heightmapVariable.material.uniforms["mouseSize"].value =
        this.effectController.mouseSize;
      this.heightmapVariable.material.uniforms["deep"].value =
        this.effectController.mouseDeep;
      this.heightmapVariable.material.uniforms["viscosity"].value =
        this.effectController.viscosity;
    };

    this.gui
      .add(this.effectController, "mouseSize", 0.1, 1.0, 0.1)
      .onChange(valuesChanger);
    this.gui
      .add(this.effectController, "mouseDeep", 0.01, 1.0, 0.01)
      .onChange(valuesChanger);
    this.gui
      .add(this.effectController, "viscosity", 0.9, 0.999, 0.001)
      .onChange(valuesChanger);
    this.gui.add(this.effectController, "speed", 3, 13, 1);
    this.gui.add(this.effectController, "wireframe").onChange((v: boolean) => {
      (this.waterMesh.material as WaterMaterial).wireframe = v;
      (this.poolBorder.material as WaterMaterial).wireframe = v;
    });
    this.gui
      .add(this.effectController, "shadow")
      .onChange((v: boolean) => this.addShadow(v));
  }

  private setupEventListeners() {
    const canvasWrapper = this.experience.canvasWrapper;
    canvasWrapper.style.touchAction = "none";
    canvasWrapper.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );
    canvasWrapper.addEventListener(
      "pointerdown",
      this.onPointerDown.bind(this)
    );
    canvasWrapper.addEventListener("pointerup", this.onPointerUp.bind(this));
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
    this.poolBorder.castShadow = true;

    // Mesh for raycasting
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

  private addShadow(v: boolean) {
    this.renderer.instance.shadowMap.enabled = v;
    this.sun.castShadow = v;

    if (v) {
      this.renderer.instance.shadowMap.type = THREE.VSMShadowMap;
      const shadow = this.sun.shadow;
      shadow.mapSize.width = shadow.mapSize.height = 2048;
      shadow.radius = 2;
      shadow.bias = -0.0005;
      const shadowCam = shadow.camera;
      const s = 5;
      shadowCam.near = 0.1;
      shadowCam.far = 6;
      shadowCam.right = shadowCam.top = s;
      shadowCam.left = shadowCam.bottom = -s;
    } else {
      if (this.sun.shadow) {
        this.sun.shadow.dispose();
      }
    }
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

  private raycast() {
    const uniforms = this.heightmapVariable.material.uniforms;
    if (this.mouseDown) {
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
    } else {
      uniforms["mousePos"].value.set(10000, 10000);
    }
  }

  resize() {}

  update() {
    this.raycast();

    this.frame++;

    if (this.frame >= 7 - this.effectController.speed) {
      // Do the gpu computation
      this.gpuCompute.compute();
      this.tmpHeightmap = this.gpuCompute.getCurrentRenderTarget(
        this.heightmapVariable
      ).texture;

      // Get compute output in custom uniform
      if (this.waterMesh) {
        (this.waterMesh.material as WaterMaterial).heightmap =
          this.tmpHeightmap;
      }

      this.frame = 0;
    }
  }
}
