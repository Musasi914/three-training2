// import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import Experience from "./Experience";
import * as THREE from "three";
import waterVertexShader from "./glsl/water.vert";
import heightmapFrag from "./glsl/heightmap.frag";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/addons/misc/GPUComputationRenderer.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import duckHeightFrag from "./glsl/duckHeight.glsl";
export default class Example {
  static WIDTH = 5;
  static DIVIDES = 128;

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];

  water!: THREE.Mesh;

  gpuCompute!: GPUComputationRenderer;
  heightVariable!: Variable;

  simplexNoise = new SimplexNoise();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2(-9999, -9999);
  intersectPoint = new THREE.Vector2(-9999, -9999);
  prevIntersectPoint = new THREE.Vector2(-9999, -9999);
  raycasterPlane!: THREE.Mesh;
  pointerDown = false;

  readWaterLevelShader!: THREE.ShaderMaterial;
  readWaterLevelPixels = new Float32Array(4);
  readWaterLevelRenderTarget!: THREE.WebGLRenderTarget;
  duck!: THREE.Group;
  velocity = new THREE.Vector3();

  duckTargetQuat = new THREE.Quaternion();

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;

    this.createWater();
    this.createGPUComputation();

    this.initRaycaster();
    this.setEventListener();

    this.createDuck();
    this.initReadWaterLevel();
  }

  private initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.raycasterPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(Example.WIDTH, Example.WIDTH),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.raycasterPlane.rotateX(-Math.PI / 2);
    this.scene.add(this.raycasterPlane);
  }

  private setEventListener() {
    this.experience.canvasWrapper.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );
    this.experience.canvasWrapper.addEventListener(
      "pointerup",
      this.onPointerUp.bind(this)
    );
    this.experience.canvasWrapper.addEventListener(
      "pointerdown",
      this.onPointerDown.bind(this)
    );
  }

  private onPointerMove(event: PointerEvent) {
    this.pointer.set(
      (event.clientX / this.experience.canvasWrapper.offsetWidth) * 2 - 1,
      -((event.clientY / this.experience.canvasWrapper.offsetHeight) * 2 - 1)
    );
  }

  private onPointerUp() {
    this.pointerDown = false;
    this.camera.controls.enabled = true;
  }

  private onPointerDown() {
    this.pointerDown = true;
  }

  private createWater() {
    const waterGeometry = new THREE.PlaneGeometry(
      Example.WIDTH,
      Example.WIDTH,
      Example.DIVIDES,
      Example.DIVIDES
    );
    const waterMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: waterVertexShader,
      uniforms: {
        textureHeight: new THREE.Uniform(null),
      },
      color: "hsl(201, 72.90%, 90%)",
      side: THREE.DoubleSide,
      roughness: 0,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    });
    (
      waterMaterial as CustomShaderMaterial & {
        defines: Record<string, string>;
      }
    ).defines.DIVIDE = Example.DIVIDES.toFixed(1);
    (
      waterMaterial as CustomShaderMaterial & {
        defines: Record<string, string>;
      }
    ).defines.WIDTH = Example.WIDTH.toFixed(1);

    this.water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.water.rotation.x = -Math.PI / 2;
    this.scene.add(this.water);
  }

  private createGPUComputation() {
    // Initialization...
    // Create computation renderer
    this.gpuCompute = new GPUComputationRenderer(
      Example.DIVIDES,
      Example.DIVIDES,
      this.renderer.instance
    );
    // Create initial state float textures
    const pos0 = this.gpuCompute.createTexture();

    // and fill in here the texture data...
    this.fillTexture(pos0);

    // Add texture variables
    this.heightVariable = this.gpuCompute.addVariable(
      "textureHeight",
      heightmapFrag,
      pos0
    );

    // Add variable dependencies
    this.gpuCompute.setVariableDependencies(this.heightVariable, [
      this.heightVariable,
    ]);
    // Add custom uniforms
    this.heightVariable.material.uniforms.pointer = {
      value: this.intersectPoint,
    };
    this.heightVariable.material.uniforms.previousPointer = {
      value: this.prevIntersectPoint,
    };
    this.heightVariable.material.defines.DIVIDE = Example.DIVIDES.toFixed(1);
    this.heightVariable.material.defines.WIDTH = Example.WIDTH.toFixed(1);

    // Check for completeness
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  private fillTexture(texture: THREE.DataTexture) {
    const data = texture.image.data;
    for (let y = 0; y < Example.DIVIDES; y++) {
      for (let x = 0; x < Example.DIVIDES; x++) {
        const index = y * Example.DIVIDES + x;
        data[index * 4 + 0] = this.simplexNoise.noise(x * 0.03, y * 0.03) * 0.1;
        data[index * 4 + 1] = data[index * 4 + 0];
        data[index * 4 + 2] = 0;
        data[index * 4 + 3] = 1;
      }
    }
  }

  private createDuck() {
    this.duck = this.experience.resource.items.duck.scene as THREE.Group;
    this.duck.castShadow = true;
    this.duck.receiveShadow = true;
    this.scene.add(this.duck);
  }

  private initReadWaterLevel() {
    this.readWaterLevelShader = this.gpuCompute.createShaderMaterial(
      duckHeightFrag,
      {
        heightTexture: new THREE.Uniform(null),
        reference: new THREE.Uniform(null),
      }
    );
    this.readWaterLevelShader.defines.WIDTH = Example.WIDTH.toFixed(1);
    this.readWaterLevelShader.defines.DIVIDE = Example.DIVIDES.toFixed(1);

    this.readWaterLevelRenderTarget = this.gpuCompute.createRenderTarget(
      1,
      1,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.NearestFilter,
      THREE.NearestFilter
    );
  }

  resize() {}

  update() {
    this.gpuCompute.compute();

    const heightTexture = this.gpuCompute.getCurrentRenderTarget(
      this.heightVariable
    ).texture;
    (this.water.material as CustomShaderMaterial).uniforms.textureHeight.value =
      heightTexture;

    this.raycast();

    this.heightVariable.material.uniforms.pointer.value = this.intersectPoint;
    this.heightVariable.material.uniforms.previousPointer.value =
      this.prevIntersectPoint;

    this.updateDuck(heightTexture);
  }

  private raycast() {
    if (!this.pointerDown) {
      this.prevIntersectPoint.set(-9999, -9999);
      this.intersectPoint.set(-9999, -9999);
      return;
    }

    this.raycaster.setFromCamera(this.pointer, this.experience.camera.instance);

    const intersects = this.raycaster.intersectObject(this.raycasterPlane);
    if (intersects.length > 0) {
      this.camera.controls.enabled = false;
      this.prevIntersectPoint.copy(this.intersectPoint);
      this.intersectPoint.set(intersects[0].uv!.x, intersects[0].uv!.y);
    } else {
      this.prevIntersectPoint.set(-9999, -9999);
      this.intersectPoint.set(-9999, -9999);
    }
  }

  private updateDuck(heightTexture: THREE.Texture) {
    const half = Example.WIDTH * 0.5;
    const limit = half - 0.2;

    const u = this.duck.position.x / Example.WIDTH + 0.5;
    const v = 1 - (this.duck.position.z / Example.WIDTH + 0.5);

    const inBounds = u >= 0 && u <= 1 && v >= 0 && v <= 1;
    if (!inBounds) {
      this.duck.position.x = THREE.MathUtils.clamp(
        this.duck.position.x,
        -limit,
        limit
      );
      this.duck.position.z = THREE.MathUtils.clamp(
        this.duck.position.z,
        -limit,
        limit
      );
      return;
    }

    this.readWaterLevelShader.uniforms.heightTexture.value = heightTexture;
    this.readWaterLevelShader.uniforms.reference.value = new THREE.Vector2(
      u,
      v
    );

    this.gpuCompute.doRenderTarget(
      this.readWaterLevelShader,
      this.readWaterLevelRenderTarget
    );

    this.renderer.instance.readRenderTargetPixels(
      this.readWaterLevelRenderTarget,
      0,
      0,
      1,
      1,
      this.readWaterLevelPixels
    );

    const waterLevel = this.readWaterLevelPixels[0];
    const normalX = this.readWaterLevelPixels[1];
    const normalZ = this.readWaterLevelPixels[2];

    this.duck.position.y = waterLevel;

    this.velocity.x += normalX * 0.01;
    this.velocity.z += -normalZ * 0.01;
    this.velocity.multiplyScalar(0.98);
    this.duck.position.add(this.velocity);

    // 壁で反射
    if (this.duck.position.x < -limit) {
      this.duck.position.x = -limit;
      this.velocity.x *= -1;
    } else if (this.duck.position.x > limit) {
      this.duck.position.x = limit;
      this.velocity.x *= -1;
    }

    if (this.duck.position.z < -limit) {
      this.duck.position.z = -limit;
      this.velocity.z *= -1;
    } else if (this.duck.position.z > limit) {
      this.duck.position.z = limit;
      this.velocity.z *= -1;
    }

    this.duckTargetQuat.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(normalX, 0, normalZ)
    );
    this.duck.quaternion.slerp(this.duckTargetQuat, 0.1);
  }
}
