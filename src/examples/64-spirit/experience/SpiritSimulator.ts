import * as THREE from "three";
import quadVert from "./glsl/quad.vert";
import throughFrag from "./glsl/through.frag";
import positionSimFrag from "./glsl/positionSim.frag";

/** The-Spirit 256×256 */
export const SIM_TEXTURE_WIDTH = 256;
export const SIM_TEXTURE_HEIGHT = 256;
export const SIM_AMOUNT = SIM_TEXTURE_WIDTH * SIM_TEXTURE_HEIGHT;

export type SpiritSimUniforms = {
  speed: number;
  dieSpeed: number;
  radius: number;
  curlSize: number;
  attraction: number;
};

export class SpiritSimulator {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  mesh: THREE.Mesh;

  copyMaterial: THREE.RawShaderMaterial;
  positionMaterial: THREE.RawShaderMaterial;

  positionRenderTarget!: THREE.WebGLRenderTarget;
  prevPositionRenderTarget!: THREE.WebGLRenderTarget;
  textureDefaultPosition!: THREE.DataTexture;

  initAnimation = 0;

  readonly uniforms: SpiritSimUniforms = {
    speed: 1,
    dieSpeed: 0.015,
    radius: 0.6,
    curlSize: 0.02,
    attraction: 1,
  };

  mouse3d = new THREE.Vector3();

  private precisionPrefix: string;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    const p = renderer.capabilities.precision;
    this.precisionPrefix = `precision ${p} float;\nprecision ${p} int;\nprecision ${p} sampler2D;\n`;

    if (!renderer.capabilities.isWebGL2) {
      throw new Error(
        "WebGL2 が必要です（The Spirit の GPGPU シミュレーション）"
      );
    }

    this.copyMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: {
          value: new THREE.Vector2(SIM_TEXTURE_WIDTH, SIM_TEXTURE_HEIGHT),
        },
        uTex: { value: null },
      },
      vertexShader: this.precisionPrefix + quadVert,
      fragmentShader: this.precisionPrefix + throughFrag,
      blending: THREE.NoBlending,
      depthTest: false,
      depthWrite: false,
    });

    this.positionMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: {
          value: new THREE.Vector2(SIM_TEXTURE_WIDTH, SIM_TEXTURE_HEIGHT),
        },
        texturePosition: { value: null },
        textureDefaultPosition: { value: null },
        mouse3d: { value: new THREE.Vector3() },
        speed: { value: 1 },
        dieSpeed: { value: 0 },
        radius: { value: 0.6 },
        curlSize: { value: 0.02 },
        attraction: { value: 1 },
        time: { value: 0 },
        initAnimation: { value: 0 },
      },
      vertexShader: this.precisionPrefix + quadVert,
      fragmentShader: this.precisionPrefix + positionSimFrag,
      blending: THREE.NoBlending,
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.copyMaterial
    );
    this.scene.add(this.mesh);

    const rtOpts: THREE.RenderTargetOptions = {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };

    this.positionRenderTarget = new THREE.WebGLRenderTarget(
      SIM_TEXTURE_WIDTH,
      SIM_TEXTURE_HEIGHT,
      rtOpts
    );
    this.prevPositionRenderTarget = this.positionRenderTarget.clone();

    this.textureDefaultPosition = this.createDefaultPositionTexture();
    this.copyTexture(this.textureDefaultPosition, this.positionRenderTarget);
    this.copyTexture(
      this.positionRenderTarget.texture,
      this.prevPositionRenderTarget
    );
  }

  private createDefaultPositionTexture(): THREE.DataTexture {
    const positions = new Float32Array(SIM_AMOUNT * 4);
    for (let i = 0; i < SIM_AMOUNT; i++) {
      const i4 = i * 4;
      const r = (0.5 + Math.random() * 0.5) * 50;
      const phi = (Math.random() - 0.5) * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi);
      positions[i4 + 1] = r * Math.sin(phi);
      positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi);
      positions[i4 + 3] = Math.random();
    }
    const texture = new THREE.DataTexture(
      positions,
      SIM_TEXTURE_WIDTH,
      SIM_TEXTURE_HEIGHT,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
  }

  private copyTexture(
    input: THREE.Texture,
    output: THREE.WebGLRenderTarget
  ): void {
    this.mesh.material = this.copyMaterial;
    this.copyMaterial.uniforms.uTex.value = input;
    this.renderer.setRenderTarget(output);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  update(dtMs: number): void {
    const u = this.uniforms;
    if (!(u.speed || u.dieSpeed)) return;

    const deltaRatio = dtMs / (1000 / 60);
    const prevClear = new THREE.Color();
    this.renderer.getClearColor(prevClear);
    const prevAlpha = this.renderer.getClearAlpha();
    const autoClear = this.renderer.autoClear;

    this.renderer.autoClear = false;

    const tmp = this.positionRenderTarget;
    this.positionRenderTarget = this.prevPositionRenderTarget;
    this.prevPositionRenderTarget = tmp;

    this.mesh.material = this.positionMaterial;
    this.positionMaterial.uniforms.textureDefaultPosition.value =
      this.textureDefaultPosition;
    this.positionMaterial.uniforms.texturePosition.value =
      this.prevPositionRenderTarget.texture;
    this.positionMaterial.uniforms.speed.value = u.speed * deltaRatio;
    this.positionMaterial.uniforms.dieSpeed.value = u.dieSpeed * deltaRatio;
    this.positionMaterial.uniforms.radius.value = u.radius;
    this.positionMaterial.uniforms.curlSize.value = u.curlSize;
    this.positionMaterial.uniforms.attraction.value = u.attraction;
    this.positionMaterial.uniforms.initAnimation.value = this.initAnimation;
    this.positionMaterial.uniforms.mouse3d.value.copy(this.mouse3d);
    this.positionMaterial.uniforms.time.value += dtMs * 0.001;

    this.renderer.setRenderTarget(this.positionRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    this.renderer.setClearColor(prevClear, prevAlpha);
    this.renderer.autoClear = autoClear;
  }

  get positionTexture(): THREE.Texture {
    return this.positionRenderTarget.texture;
  }

  get prevPositionTexture(): THREE.Texture {
    return this.prevPositionRenderTarget.texture;
  }
}
