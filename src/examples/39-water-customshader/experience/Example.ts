import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/water.vert";
import heightmapFragmentShader from "./glsl/heightmap.frag.glsl";
import {
  GPUComputationRenderer,
  SimplexNoise,
  type Variable,
} from "three/examples/jsm/Addons.js";

export default class Example {
  static WIDTH = 6;
  static DEVIDES = 512;

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];

  waterMesh!: THREE.Mesh;
  waterMaterial!: CustomShaderMaterial;

  gpuCompute!: GPUComputationRenderer;
  heightmapVariable!: Variable;

  simplex = new SimplexNoise();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  rayplane!: THREE.Mesh;
  pointerDown = false;

  pointerIntersection = new THREE.Vector2(1000, 1000);
  previousPointerIntersection = new THREE.Vector2(1000, 1000);

  frame = 0;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;

    this.initPoolBorder();
    this.initWater();
    this.initRayPlane();
    this.initGPGPU();

    this.setEventListener();
  }

  private initPoolBorder() {
    const borderGeo = new THREE.TorusGeometry(4.2, 0.1, 12, 4);
    borderGeo.rotateX(Math.PI * 0.5);
    borderGeo.rotateY(Math.PI * 0.25);
    const poolBorder = new THREE.Mesh(
      borderGeo,
      new THREE.MeshStandardMaterial({ color: 0x908877, roughness: 0.2 })
    );
    this.scene.add(poolBorder);
    poolBorder.receiveShadow = true;
    poolBorder.castShadow = true;
  }

  private initWater() {
    const geometry = new THREE.PlaneGeometry(
      Example.WIDTH,
      Example.WIDTH,
      Example.DEVIDES,
      Example.DEVIDES
    );
    this.waterMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader,
      color: 0x2bd2ec,
      side: THREE.DoubleSide,
      metalness: 0.8,
      roughness: 0,
      transparent: true,
      opacity: 0.9,
      uniforms: {
        heightmap: { value: null },
      },
    });
    (
      this.waterMaterial as CustomShaderMaterial & { defines: any }
    ).defines.DEVIDES = Example.DEVIDES.toFixed(1);
    (
      this.waterMaterial as CustomShaderMaterial & { defines: any }
    ).defines.WIDTH = Example.WIDTH.toFixed(1);
    this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
    this.waterMesh.receiveShadow = true;
    this.waterMesh.castShadow = true;
    this.waterMesh.rotation.x = -Math.PI * 0.5;
    this.scene.add(this.waterMesh);
  }

  private initRayPlane() {
    this.rayplane = new THREE.Mesh(
      new THREE.PlaneGeometry(Example.WIDTH, Example.WIDTH),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.rayplane.rotateX(-Math.PI / 2);
    this.scene.add(this.rayplane);
  }

  private initGPGPU() {
    this.gpuCompute = new GPUComputationRenderer(
      Example.DEVIDES,
      Example.DEVIDES,
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

    this.heightmapVariable.material.uniforms.pointerIntersection = {
      value: this.pointerIntersection,
    };
    this.heightmapVariable.material.uniforms.previousPointerIntersection = {
      value: this.previousPointerIntersection,
    };

    this.heightmapVariable.material.defines.WIDTH = Example.WIDTH.toFixed(1);

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  private fillTexture(texture: THREE.DataTexture) {
    const data = texture.image.data;

    const noise = (x: number, y: number) => {
      let multR = 0.1;
      let mult = 0.01;
      let r = 0;
      // for (let i = 0; i < 15; i++) {
      //   r += multR * this.simplex.noise(x * mult, y * mult);
      //   multR *= 0.53 + 0.025 * i;
      //   mult *= 1.25;
      // }
      r += multR * this.simplex.noise(x * mult, y * mult);
      return r;
    };

    for (let i = 0; i < Example.DEVIDES; i++) {
      for (let j = 0; j < Example.DEVIDES; j++) {
        const index = i * Example.DEVIDES + j;
        data[index * 4 + 0] = noise(i, j);
        data[index * 4 + 1] = data[index * 4 + 0];
        data[index * 4 + 2] = 0;
        data[index * 4 + 3] = 1;
      }
    }
  }

  private setEventListener() {
    const el = this.experience.canvasWrapper;

    el.addEventListener("pointerdown", this.onPointerDown.bind(this));
    el.addEventListener("pointerup", this.onPointerUp.bind(this));
    el.addEventListener("pointermove", this.onPointerMove.bind(this));
  }

  private onPointerDown() {
    this.pointerDown = true;
  }
  private onPointerUp() {
    this.pointerDown = false;
    this.experience.camera.controls.enabled = true;
  }
  private onPointerMove(event: PointerEvent) {
    this.mouse.x =
      (event.clientX / this.experience.canvasWrapper.offsetWidth) * 2 - 1;
    this.mouse.y = -(
      (event.clientY / this.experience.canvasWrapper.offsetHeight) * 2 -
      1
    );
  }

  resize() {}

  update() {
    this.frame++;

    // this.raycast();

    this.gpuCompute.compute();
    this.waterMaterial.uniforms.heightmap.value =
      this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable).texture;

    this.raycast();

    this.heightmapVariable.material.uniforms.pointerIntersection.value =
      this.pointerIntersection;
    this.heightmapVariable.material.uniforms.previousPointerIntersection.value =
      this.previousPointerIntersection;
  }

  private raycast() {
    this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
    const intersect = this.raycaster.intersectObject(this.rayplane);
    if (intersect.length > 0) {
      this.experience.camera.controls.enabled = false;
      if (this.pointerDown) {
        this.previousPointerIntersection.copy(this.pointerIntersection);
        this.pointerIntersection.set(intersect[0].uv!.x, intersect[0].uv!.y);
      } else {
        this.previousPointerIntersection.set(1000, 1000);
        this.pointerIntersection.set(1000, 1000);
      }
    } else {
      this.previousPointerIntersection.set(1000, 1000);
      this.pointerIntersection.set(1000, 1000);
      this.experience.camera.controls.enabled = true;
    }
  }
}
