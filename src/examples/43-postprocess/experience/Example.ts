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
  static WIDTH = 5;
  static DIVIDE = 128;

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];
  duck: THREE.Group | null = null;

  waterMaterial!: CustomShaderMaterial;
  waterMesh!: THREE.Mesh;

  gpuCompute!: GPUComputationRenderer;
  heightVariable!: Variable;

  simplexNoise = new SimplexNoise();

  readWaterLevelShader!: THREE.ShaderMaterial;
  readWaterLevelRenderTarget!: THREE.WebGLRenderTarget;
  // readWaterLevelImage!: Uint8Array;
  readWaterLevelPixels!: Float32Array;

  waterNormal = new THREE.Vector3();
  duckTargetQuat = new THREE.Quaternion();
  yAxis = new THREE.Vector3(0, 1, 0);
  duckFloatOffset = -0.01;

  raycasterMesh!: THREE.Mesh;
  raycaster!: THREE.Raycaster;
  pointer = new THREE.Vector2(-9999, -9999);
  intersectPoint = new THREE.Vector2(-9999, -9999);
  prevIntersectPoint = new THREE.Vector2(-9999, -9999);
  pointerDown = false;

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;

    this.initWater();
    this.initGPUCompute();
    this.initReadWaterLevel();
    this.initRaycaster();
    this.initDuck();

    this.initEventListener();
  }

  private initWater() {
    const geometry = new THREE.PlaneGeometry(
      Example.WIDTH,
      Example.WIDTH,
      Example.DIVIDE,
      Example.DIVIDE
    );
    this.waterMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader,
      color: 0x6ccdf9,
      roughness: 0,
      metalness: 0.8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      uniforms: {
        textureHeight: new THREE.Uniform(null),
      },
    });
    (
      this.waterMaterial as CustomShaderMaterial & {
        defines: Record<string, string>;
      }
    ).defines.WIDTH = Example.WIDTH.toFixed(1);
    (
      this.waterMaterial as CustomShaderMaterial & {
        defines: Record<string, string>;
      }
    ).defines.DIVIDE = Example.DIVIDE.toFixed(1);
    this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.waterMesh);
  }

  private initGPUCompute() {
    this.gpuCompute = new GPUComputationRenderer(
      Example.DIVIDE,
      Example.DIVIDE,
      this.renderer
    );

    const height0 = this.gpuCompute.createTexture();
    this.fillTexture(height0);

    this.heightVariable = this.gpuCompute.addVariable(
      "textureHeight",
      heightmapFragmentShader,
      height0
    );
    this.gpuCompute.setVariableDependencies(this.heightVariable, [
      this.heightVariable,
    ]);

    this.heightVariable.material.defines.WIDTH = Example.WIDTH.toFixed(1);
    this.heightVariable.material.defines.DIVIDE = Example.DIVIDE.toFixed(1);
    this.heightVariable.material.uniforms.mousePos = {
      value: this.intersectPoint,
    };
    this.heightVariable.material.uniforms.prevMousePos = {
      value: this.prevIntersectPoint,
    };

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  private initReadWaterLevel() {
    const readWaterLevelFragmentShader = /* glsl */ `
      uniform vec2 point1;
      uniform sampler2D textureHeight;

      void main() {
        vec2 cellSize = 1.0 / resolution.xy;

        float waterLevel = texture2D( textureHeight, point1 ).x;

        float xDiff =
          texture2D( textureHeight, point1 + vec2( - cellSize.x, 0.0 ) ).x -
          texture2D( textureHeight, point1 + vec2( cellSize.x, 0.0 ) ).x;

        float yDiff =
          texture2D( textureHeight, point1 + vec2( 0.0, cellSize.y ) ).x -
          texture2D( textureHeight, point1 + vec2( 0.0, -cellSize.y ) ).x;

        // ざっくり「傾き」= (高さ差) / (ワールド1単位あたりのテクセル数)
        float slopeScale = DIVIDE / WIDTH;
        vec2 normal = vec2( xDiff * slopeScale, yDiff * slopeScale );

        gl_FragColor = vec4( waterLevel, normal.x, normal.y, 0.0 );
      }
    `;

    this.readWaterLevelShader = this.gpuCompute.createShaderMaterial(
      readWaterLevelFragmentShader,
      {
        point1: { value: new THREE.Vector2() },
        textureHeight: { value: null },
      }
    );
    this.readWaterLevelShader.defines.WIDTH = Example.WIDTH.toFixed(1);
    this.readWaterLevelShader.defines.DIVIDE = Example.DIVIDE.toFixed(1);

    this.readWaterLevelPixels = new Float32Array(4);

    this.readWaterLevelRenderTarget = this.gpuCompute.createRenderTarget(
      1,
      1,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.NearestFilter,
      THREE.NearestFilter
    );
  }

  private initDuck() {
    this.duck = this.experience.resource.items.duck.scene as THREE.Group;

    this.duck.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    const half = Example.WIDTH * 0.5;
    this.duck.position.set(
      (Math.random() - 0.5) * half,
      0,
      (Math.random() - 0.5) * half
    );
    this.duck.scale.setScalar(0.5);
    this.duck.userData.velocity = new THREE.Vector3();

    this.scene.add(this.duck);
  }

  private fillTexture(texture: THREE.DataTexture) {
    for (let y = 0; y < Example.DIVIDE; y++) {
      for (let x = 0; x < Example.DIVIDE; x++) {
        const i = y * Example.DIVIDE + x;
        texture.image.data[i * 4 + 0] =
          this.simplexNoise.noise(x * 0.03, y * 0.03) * 0.1;
        texture.image.data[i * 4 + 1] = texture.image.data[i * 4];
        texture.image.data[i * 4 + 2] = 0;
        texture.image.data[i * 4 + 3] = 0;
      }
    }
  }

  private initRaycaster() {
    this.raycaster = new THREE.Raycaster();

    this.raycasterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Example.WIDTH, Example.WIDTH),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.scene.add(this.raycasterMesh);
  }

  private initEventListener() {
    const el = this.experience.canvasWrapper;
    el.addEventListener("pointermove", this.setPointerPosition.bind(this));
    el.addEventListener("pointerup", this.onPointerUp.bind(this));
    el.addEventListener("pointerdown", this.onPointerDown.bind(this));
  }

  private setPointerPosition(e: PointerEvent) {
    this.pointer.set(
      (e.clientX / this.experience.config.width) * 2 - 1,
      -(e.clientY / this.experience.config.height) * 2 + 1
    );
  }

  private onPointerDown() {
    this.pointerDown = true;
  }

  private onPointerUp() {
    this.pointerDown = false;
    this.camera.controls.enabled = true;
    this.clearIntersectPoint();
  }

  private clearIntersectPoint() {
    this.intersectPoint.set(-9999, -9999);
    this.prevIntersectPoint.set(-9999, -9999);
  }

  resize() {}

  update() {
    this.raycast();

    this.gpuCompute.compute();

    const heightTexture = this.gpuCompute.getCurrentRenderTarget(
      this.heightVariable
    ).texture;
    this.waterMaterial.uniforms.textureHeight.value = heightTexture;

    this.updateDuck(heightTexture);
  }

  private updateDuck(heightTexture: THREE.Texture) {
    if (!this.duck) return;

    const half = Example.WIDTH * 0.5;
    const limit = half - 0.2;

    const u = this.duck.position.x / Example.WIDTH + 0.5;
    // GPU側テクスチャのV方向とワールドZが反転するケースがあるため合わせる
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

    this.readWaterLevelShader.uniforms.textureHeight.value = heightTexture;
    this.readWaterLevelShader.uniforms.point1.value.set(u, v);

    this.gpuCompute.doRenderTarget(
      this.readWaterLevelShader,
      this.readWaterLevelRenderTarget
    );

    this.renderer.readRenderTargetPixels(
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

    // 位置（yは水面高さへ）
    this.duck.position.y = waterLevel + this.duckFloatOffset;

    // 速度（傾き方向へ流す）
    const velocity =
      (this.duck.userData.velocity as THREE.Vector3 | undefined) ??
      new THREE.Vector3();
    this.duck.userData.velocity = velocity;
    velocity.x += normalX * 0.002;
    velocity.z += normalZ * 0.002;
    velocity.multiplyScalar(0.98);
    this.duck.position.add(velocity);

    // 壁で反射
    if (this.duck.position.x < -limit) {
      this.duck.position.x = -limit;
      velocity.x *= -1;
    } else if (this.duck.position.x > limit) {
      this.duck.position.x = limit;
      velocity.x *= -1;
    }

    if (this.duck.position.z < -limit) {
      this.duck.position.z = -limit;
      velocity.z *= -1;
    } else if (this.duck.position.z > limit) {
      this.duck.position.z = limit;
      velocity.z *= -1;
    }

    // 姿勢（上方向を法線へ寄せる）
    this.waterNormal.set(normalX, 1, normalZ).normalize();
    this.duckTargetQuat.setFromUnitVectors(this.yAxis, this.waterNormal);
    this.duck.quaternion.slerp(this.duckTargetQuat, 0.1);
  }

  private raycast() {
    if (!this.pointerDown) return;

    this.raycaster.setFromCamera(this.pointer, this.experience.camera.instance);

    const intersects = this.raycaster.intersectObject(this.waterMesh);

    if (intersects.length > 0) {
      this.prevIntersectPoint.copy(this.intersectPoint);
      this.intersectPoint.set(intersects[0].uv!.x, intersects[0].uv!.y);
      this.camera.controls.enabled = false;
    } else {
      this.clearIntersectPoint();
    }
  }
}
