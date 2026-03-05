import * as THREE from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/examples/jsm/Addons.js";
import computeVelocityFrag from "../glsl/computeVelocity.frag";
import faceVert from "../glsl/face.vert";
import divergenceFrag from "../glsl/divergence.frag";
import computePressureFrag from "../glsl/computePressure.frag";
import computeProjectFrag from "../glsl/computeProject.frag";
import Experience from "../Experience";

type FluidSimInput = {
  pointerUv: THREE.Vector2;
  pointerDeltaUv: THREE.Vector2;
  pointerMovedThisFrame: boolean;
};

type FluidSimParams = {
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
};

export default class FluidSim {
  experience: Experience;
  gui: Experience["gui"];

  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;
  // ピクセルのサイズ、もしくはピクセルの個数
  private px: THREE.Vector2;

  private velocityCompute: GPUComputationRenderer | null = null;
  private pressureCompute: GPUComputationRenderer | null = null;
  private projectCompute: GPUComputationRenderer | null = null;

  private velocityVar: Variable | null = null;
  private pressureVar: Variable | null = null;
  private projectVar: Variable | null = null;

  private divergenceTarget: THREE.WebGLRenderTarget | null = null;
  private divergenceScene: THREE.Scene | null = null;
  private divergenceCamera: THREE.OrthographicCamera | null = null;
  private divergenceMesh: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.ShaderMaterial
  > | null = null;

  private params = {
    dt: 0.032,
    isBFECC: true,
    iterations: 24,
    dissipation: 0.99,
    splatRadius: 100,
    forceStrength: 80,
  };

  constructor(params: FluidSimParams) {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;

    this.renderer = params.renderer;
    this.width = params.width;
    this.height = params.height;
    this.px = new THREE.Vector2(1 / this.width, 1 / this.height);

    this.velocityCompute = this.createComputeRenderer();
    this.pressureCompute = this.createComputeRenderer();
    this.projectCompute = this.createComputeRenderer();

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
    this.pressureCompute.setVariableDependencies(this.pressureVar, [
      this.pressureVar,
    ]);

    this.projectVar = this.projectCompute.addVariable(
      "textureVelocityProj",
      computeProjectFrag,
      this.projectCompute.createTexture()
    );

    this.divergenceTarget = new THREE.WebGLRenderTarget(
      this.width,
      this.height,
      {
        type: THREE.HalfFloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      }
    );
    this.divergenceScene = new THREE.Scene();
    this.divergenceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.divergenceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: faceVert,
        fragmentShader: divergenceFrag,
        uniforms: {
          uVelocity: { value: new THREE.Texture() },
          uPx: { value: this.px.clone() },
          uDt: { value: this.params.dt },
        },
      })
    );
    this.divergenceScene.add(this.divergenceMesh);

    this.setUniforms();

    const error =
      this.velocityCompute.init() ??
      this.pressureCompute.init() ??
      this.projectCompute.init();
    if (error !== null) {
      console.error(error);
    }

    this.createGUI();
  }

  private createGUI() {
    this.gui.add(this.params, "dt", 0.001, 0.1, 0.001);
    this.gui.add(this.params, "isBFECC").onChange((value: boolean) => {
      this.velocityVar!.material.uniforms.isBFECC.value = value;
    });
    this.gui.add(this.params, "iterations", 1, 32, 1);
    this.gui
      .add(this.params, "dissipation", 0.5, 1.0, 0.001)
      .onChange((value: number) => {
        this.velocityVar!.material.uniforms.uDissipation.value = value;
      });
    this.gui
      .add(this.params, "splatRadius", 1, 200, 1)
      .onChange((value: number) => {
        this.velocityVar!.material.uniforms.uSplatRadius.value = value;
      });
    this.gui
      .add(this.params, "forceStrength", 1, 200, 1)
      .onChange((value: number) => {
        this.velocityVar!.material.uniforms.uForceStrength.value = value;
      });
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

  private setUniforms() {
    if (!this.velocityVar || !this.divergenceTarget) return;
    const velUniform = this.velocityVar.material.uniforms;
    velUniform.uVelocityPrev = {
      value: new THREE.Texture(),
    };
    velUniform.uDt = { value: this.params.dt };
    velUniform.uDissipation = { value: this.params.dissipation };
    velUniform.uPointerUv = {
      value: new THREE.Vector2(0.5, 0.5),
    };
    velUniform.uPointerDeltaUv = {
      value: new THREE.Vector2(0, 0),
    };
    velUniform.uPointerActive = { value: 0 };
    velUniform.uSplatRadius = { value: this.params.splatRadius };
    velUniform.uForceStrength = { value: this.params.forceStrength };

    velUniform.isBFECC = { value: this.params.isBFECC };

    if (!this.pressureVar) return;
    this.pressureVar.material.uniforms.uDivergence = {
      value: this.divergenceTarget.texture,
    };
    this.pressureVar.material.uniforms.uPx = { value: this.px.clone() };

    if (!this.projectVar) return;
    const projectUniform = this.projectVar.material.uniforms;
    projectUniform.uVelocity = { value: new THREE.Texture() };
    projectUniform.uPressure = { value: new THREE.Texture() };
    projectUniform.uPx = { value: this.px.clone() };
    projectUniform.uDt = { value: this.params.dt };
  }

  update(input: FluidSimInput) {
    if (
      !this.velocityVar ||
      !this.velocityCompute ||
      !this.divergenceMesh ||
      !this.divergenceTarget ||
      !this.divergenceScene ||
      !this.divergenceCamera ||
      !this.pressureVar ||
      !this.pressureCompute ||
      !this.projectVar ||
      !this.projectCompute
    )
      return;

    // velocity advection + force
    const prevVelocity = this.velocityTexture;
    this.velocityVar.material.uniforms.uVelocityPrev.value = prevVelocity;
    this.velocityVar.material.uniforms.uPointerUv.value.copy(input.pointerUv);
    this.velocityVar.material.uniforms.uPointerDeltaUv.value.copy(
      input.pointerDeltaUv
    );
    this.velocityVar.material.uniforms.uPointerActive.value =
      input.pointerMovedThisFrame ? 1 : 0;
    this.velocityCompute.compute();

    const velocity = this.getCurrentTexture(
      this.velocityVar,
      this.velocityCompute
    );

    // divergence
    const mat = this.divergenceMesh.material;
    mat.uniforms.uPx.value = this.px;
    mat.uniforms.uVelocity.value = velocity;
    mat.uniforms.uDt.value = this.params.dt;
    this.renderer.setRenderTarget(this.divergenceTarget);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.divergenceScene, this.divergenceCamera);
    this.renderer.setRenderTarget(null);

    // pressure solve
    this.pressureVar.material.uniforms.uDivergence.value =
      this.divergenceTarget.texture;
    this.pressureVar.material.uniforms.uPx.value.copy(this.px);
    for (let i = 0; i < this.params.iterations; i++) {
      this.pressureCompute.compute();
    }
    const pressure =
      this.getCurrentTexture(this.pressureVar, this.pressureCompute) ??
      new THREE.Texture();

    //  projection
    this.projectVar.material.uniforms.uVelocity.value = velocity;
    this.projectVar.material.uniforms.uPressure.value = pressure;
    this.projectVar.material.uniforms.uPx.value.copy(this.px);
    this.projectVar.material.uniforms.uDt.value = this.params.dt;
    this.projectCompute.compute();
  }

  private getCurrentTexture(
    variable: Variable | null,
    compute: GPUComputationRenderer | null
  ): THREE.Texture | null {
    if (!variable || !compute) return null;
    return compute.getCurrentRenderTarget(variable).texture;
  }

  get velocityTexture(): THREE.Texture {
    const tex = this.getCurrentTexture(this.projectVar, this.projectCompute);
    return tex ?? new THREE.Texture();
  }
}
