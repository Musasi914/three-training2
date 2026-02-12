import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import computeVelocityFrag from "../glsl/computeVelocity.frag?raw";
import computeDyeFrag from "../glsl/computeDye.frag?raw";
import computePressureFrag from "../glsl/computePressure.frag?raw";
import computeProjectFrag from "../glsl/computeProject.frag?raw";
import faceVert from "../glsl/face.vert?raw";
import divergenceFrag from "../glsl/divergence.frag?raw";

export type FluidSimParams = {
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
};

export type FluidSimTuning = {
  resolutionScale: number;
  dt: number;
  pressureIterations: number;
  velocityDissipation: number;
  dyeDissipation: number;
  splatRadius: number; // in cells
  forceStrength: number;
  dyeIntensity: number;
};

export type FluidSimInput = {
  pointerUv: THREE.Vector2;
  pointerDeltaUv: THREE.Vector2;
  pointerMovedThisFrame: boolean;
  color: THREE.Color;
};

export class FluidSim {
  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;

  private velocityCompute: GPUComputationRenderer | null = null;
  private pressureCompute: GPUComputationRenderer | null = null;
  private projectCompute: GPUComputationRenderer | null = null;
  private dyeCompute: GPUComputationRenderer | null = null;

  private velocityVar: Variable | null = null;
  private pressureVar: Variable | null = null;
  private projectVar: Variable | null = null;
  private dyeVar: Variable | null = null;

  private divergenceTarget: THREE.WebGLRenderTarget | null = null;
  private divergenceScene: THREE.Scene | null = null;
  private divergenceCamera: THREE.OrthographicCamera | null = null;
  private divergenceMesh: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.ShaderMaterial
  > | null = null;

  private px: THREE.Vector2;

  tuning: FluidSimTuning;

  constructor(params: FluidSimParams) {
    this.renderer = params.renderer;
    this.width = Math.max(2, Math.round(params.width));
    this.height = Math.max(2, Math.round(params.height));
    this.px = new THREE.Vector2(1 / this.width, 1 / this.height);

    this.tuning = {
      resolutionScale: 1,
      dt: 0.016,
      pressureIterations: 24,
      velocityDissipation: 0.99,
      dyeDissipation: 0.985,
      splatRadius: 80,
      forceStrength: 80,
      dyeIntensity: 2.0,
    };

    this.rebuild();
  }

  resize(width: number, height: number) {
    const nextW = Math.max(2, Math.round(width));
    const nextH = Math.max(2, Math.round(height));
    if (nextW === this.width && nextH === this.height) return;

    this.width = nextW;
    this.height = nextH;
    this.px.set(1 / this.width, 1 / this.height);

    this.rebuild();
  }

  private rebuild() {
    this.disposeInternal();

    // 51 と同じ: HalfFloat（速度/圧力/染料の安定性と互換性優先）
    this.velocityCompute = this.createComputeRenderer();
    this.pressureCompute = this.createComputeRenderer();
    this.projectCompute = this.createComputeRenderer();
    this.dyeCompute = this.createComputeRenderer();

    // 変数（GPUComputationRendererは内部でping-pongを管理）
    this.velocityVar = this.velocityCompute.addVariable(
      "textureVelocity",
      computeVelocityFrag,
      this.velocityCompute.createTexture()
    );
    this.pressureVar = this.pressureCompute.addVariable(
      "texturePressure",
      computePressureFrag,
      this.pressureCompute.createTexture()
    );
    this.projectVar = this.projectCompute.addVariable(
      "textureVelocityProj",
      computeProjectFrag,
      this.projectCompute.createTexture()
    );
    this.dyeVar = this.dyeCompute.addVariable(
      "textureDye",
      computeDyeFrag,
      this.dyeCompute.createTexture()
    );

    // pressure の Jacobi 反復は自分自身の前フレームを読む必要がある
    this.pressureCompute.setVariableDependencies(this.pressureVar, [
      this.pressureVar,
    ]);

    this.setupDivergencePass();
    this.setupUniforms();

    const error =
      this.velocityCompute.init() ??
      this.pressureCompute.init() ??
      this.projectCompute.init() ??
      this.dyeCompute.init();
    if (error) throw new Error(error);
  }

  private disposeInternal() {
    this.velocityCompute?.dispose();
    this.pressureCompute?.dispose();
    this.projectCompute?.dispose();
    this.dyeCompute?.dispose();
    this.velocityCompute = null;
    this.pressureCompute = null;
    this.projectCompute = null;
    this.dyeCompute = null;

    this.velocityVar = null;
    this.pressureVar = null;
    this.projectVar = null;
    this.dyeVar = null;

    this.divergenceTarget?.dispose();
    this.divergenceTarget = null;

    if (this.divergenceMesh) {
      this.divergenceMesh.geometry.dispose();
      this.divergenceMesh.material.dispose();
    }
    this.divergenceMesh = null;
    this.divergenceScene = null;
    this.divergenceCamera = null;
  }

  private createComputeRenderer() {
    const gcr = new GPUComputationRenderer(
      this.width,
      this.height,
      this.renderer
    );
    gcr.setDataType(THREE.HalfFloatType);
    return gcr;
  }

  private createRenderTarget() {
    return new THREE.WebGLRenderTarget(this.width, this.height, {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
  }

  private setupDivergencePass() {
    this.divergenceTarget = this.createRenderTarget();

    this.divergenceScene = new THREE.Scene();
    this.divergenceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.divergenceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: faceVert,
        fragmentShader: divergenceFrag,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uVelocity: { value: new THREE.Texture() },
          uPx: { value: this.px.clone() },
          uDt: { value: this.tuning.dt },
        },
      })
    );
    this.divergenceScene.add(this.divergenceMesh);
  }

  private setupUniforms() {
    if (
      !this.velocityVar ||
      !this.pressureVar ||
      !this.projectVar ||
      !this.dyeVar ||
      !this.divergenceTarget
    ) {
      return;
    }

    // velocity uniforms
    this.velocityVar.material.uniforms.uVelocityPrev = {
      value: new THREE.Texture(),
    };
    this.velocityVar.material.uniforms.uDt = { value: this.tuning.dt };
    this.velocityVar.material.uniforms.uDissipation = {
      value: this.tuning.velocityDissipation,
    };
    this.velocityVar.material.uniforms.uPointerUv = {
      value: new THREE.Vector2(0.5, 0.5),
    };
    this.velocityVar.material.uniforms.uPointerDeltaUv = {
      value: new THREE.Vector2(0, 0),
    };
    this.velocityVar.material.uniforms.uPointerActive = { value: 0 };
    this.velocityVar.material.uniforms.uSplatRadius = {
      value: this.tuning.splatRadius,
    };
    this.velocityVar.material.uniforms.uForceStrength = {
      value: this.tuning.forceStrength,
    };

    // pressure uniforms
    this.pressureVar.material.uniforms.uDivergence = {
      value: this.divergenceTarget.texture,
    };
    this.pressureVar.material.uniforms.uPx = { value: this.px.clone() };

    // project uniforms
    this.projectVar.material.uniforms.uVelocity = {
      value: new THREE.Texture(),
    };
    this.projectVar.material.uniforms.uPressure = {
      value: new THREE.Texture(),
    };
    this.projectVar.material.uniforms.uPx = { value: this.px.clone() };
    this.projectVar.material.uniforms.uDt = { value: this.tuning.dt };

    // dye uniforms
    this.dyeVar.material.uniforms.uDyePrev = { value: new THREE.Texture() };
    this.dyeVar.material.uniforms.uVelocity = { value: new THREE.Texture() };
    this.dyeVar.material.uniforms.uDt = { value: this.tuning.dt };
    this.dyeVar.material.uniforms.uDissipation = {
      value: this.tuning.dyeDissipation,
    };
    this.dyeVar.material.uniforms.uPointerUv = {
      value: new THREE.Vector2(0.5, 0.5),
    };
    this.dyeVar.material.uniforms.uPointerActive = { value: 0 };
    this.dyeVar.material.uniforms.uSplatRadius = {
      value: this.tuning.splatRadius,
    };
    this.dyeVar.material.uniforms.uColor = {
      value: new THREE.Color("#4aa3ff"),
    };
    this.dyeVar.material.uniforms.uIntensity = {
      value: this.tuning.dyeIntensity,
    };
  }

  private renderDivergence(velocity: THREE.Texture, dt: number) {
    if (!this.divergenceMesh || !this.divergenceTarget) return;
    if (!this.divergenceScene || !this.divergenceCamera) return;

    const mat = this.divergenceMesh.material;
    mat.uniforms.uVelocity.value = velocity;
    mat.uniforms.uDt.value = dt;

    this.renderer.setRenderTarget(this.divergenceTarget);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.divergenceScene, this.divergenceCamera);
    this.renderer.setRenderTarget(null);
  }

  private getCurrentTexture(
    variable: Variable | null,
    compute: GPUComputationRenderer | null
  ) {
    if (!variable || !compute) return null;
    return compute.getCurrentRenderTarget(variable).texture;
  }

  update(input: FluidSimInput) {
    if (
      !this.velocityCompute ||
      !this.pressureCompute ||
      !this.projectCompute ||
      !this.dyeCompute ||
      !this.velocityVar ||
      !this.pressureVar ||
      !this.projectVar ||
      !this.dyeVar
    ) {
      return;
    }

    const dt = Math.min(1 / 30, Math.max(1 / 240, this.tuning.dt));

    // 押下状態は使わない（移動しているなら常に注入）
    const pointerActive = input.pointerMovedThisFrame;

    // 1) velocity advection + force（前フレームの「投影済み速度」を読む）
    const prevVelocity = this.velocityTexture;
    this.velocityVar.material.uniforms.uVelocityPrev.value = prevVelocity;
    this.velocityVar.material.uniforms.uDt.value = dt;
    this.velocityVar.material.uniforms.uDissipation.value =
      this.tuning.velocityDissipation;
    (this.velocityVar.material.uniforms.uPointerUv.value as THREE.Vector2).copy(
      input.pointerUv
    );
    (
      this.velocityVar.material.uniforms.uPointerDeltaUv.value as THREE.Vector2
    ).copy(input.pointerDeltaUv);
    this.velocityVar.material.uniforms.uPointerActive.value = pointerActive
      ? 1
      : 0;
    this.velocityVar.material.uniforms.uSplatRadius.value =
      this.tuning.splatRadius;
    this.velocityVar.material.uniforms.uForceStrength.value =
      this.tuning.forceStrength;
    this.velocityCompute.compute();

    const velocity =
      this.getCurrentTexture(this.velocityVar, this.velocityCompute) ??
      prevVelocity;

    // 2) divergence
    // pxはresizeで変わるので、毎フレーム追従させる（コストは軽微）
    if (this.divergenceMesh) {
      (this.divergenceMesh.material.uniforms.uPx.value as THREE.Vector2).copy(
        this.px
      );
    }
    this.renderDivergence(velocity, dt);

    // 3) pressure solve (Jacobi iterations)
    this.pressureVar.material.uniforms.uDivergence.value =
      this.divergenceTarget?.texture;
    (this.pressureVar.material.uniforms.uPx.value as THREE.Vector2).copy(
      this.px
    );
    for (let i = 0; i < this.tuning.pressureIterations; i++) {
      this.pressureCompute.compute();
    }
    const pressure =
      this.getCurrentTexture(this.pressureVar, this.pressureCompute) ??
      new THREE.Texture();

    // 4) projection
    this.projectVar.material.uniforms.uVelocity.value = velocity;
    this.projectVar.material.uniforms.uPressure.value = pressure;
    (this.projectVar.material.uniforms.uPx.value as THREE.Vector2).copy(
      this.px
    );
    this.projectVar.material.uniforms.uDt.value = dt;
    this.projectCompute.compute();

    // 5) dye advection + splat (uses projected velocity)
    const projectedVelocity =
      this.getCurrentTexture(this.projectVar, this.projectCompute) ?? velocity;

    this.dyeVar.material.uniforms.uDyePrev.value = this.dyeTexture;
    this.dyeVar.material.uniforms.uVelocity.value = projectedVelocity;
    this.dyeVar.material.uniforms.uDt.value = dt;
    this.dyeVar.material.uniforms.uDissipation.value =
      this.tuning.dyeDissipation;
    (this.dyeVar.material.uniforms.uPointerUv.value as THREE.Vector2).copy(
      input.pointerUv
    );
    this.dyeVar.material.uniforms.uPointerActive.value = pointerActive ? 1 : 0;
    this.dyeVar.material.uniforms.uSplatRadius.value = this.tuning.splatRadius;
    this.dyeVar.material.uniforms.uIntensity.value = this.tuning.dyeIntensity;
    (this.dyeVar.material.uniforms.uColor.value as THREE.Color).copy(
      input.color
    );

    this.dyeCompute.compute();
  }

  get velocityTexture(): THREE.Texture {
    const tex = this.getCurrentTexture(this.projectVar, this.projectCompute);
    return tex ?? new THREE.Texture();
  }

  get dyeTexture(): THREE.Texture {
    const tex = this.getCurrentTexture(this.dyeVar, this.dyeCompute);
    return tex ?? new THREE.Texture();
  }
}
