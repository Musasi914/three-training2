import * as THREE from "three";
import fullScreenVert from "./glsl/fullScreen.vert";
import throughFrag from "./glsl/through.frag";
import positionSimFrag from "./glsl/positionSim.frag";

export const SIM_TEXTURE_WIDTH = 256;
export const SIM_TEXTURE_HEIGHT = 256;
export const SIM_AMOUNT = SIM_TEXTURE_WIDTH * SIM_TEXTURE_HEIGHT;

export default class SpiritSimulator {
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  copyMaterial: THREE.ShaderMaterial;
  positionMaterial: THREE.ShaderMaterial;

  positionRenderTarget: THREE.WebGLRenderTarget;
  prevPositionRenderTarget: THREE.WebGLRenderTarget;

  defaultPositionTexture: THREE.DataTexture;

  readonly uniforms = {
    speed: 1,
    dieSpeed: 0.015,
  };
  mouse3d = new THREE.Vector3();

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();

    this.copyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        resolution: {
          value: new THREE.Vector2(SIM_TEXTURE_WIDTH, SIM_TEXTURE_HEIGHT),
        },
        uTex: { value: null },
      },
      vertexShader: fullScreenVert,
      fragmentShader: throughFrag,
      depthTest: false,
      depthWrite: false,
    });

    this.positionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        resolution: {
          value: new THREE.Vector2(SIM_TEXTURE_WIDTH, SIM_TEXTURE_HEIGHT),
        },
        texturePosition: { value: null },
        textureDefaultPosition: { value: null },
        mouse3d: { value: new THREE.Vector3() },
        speed: { value: 1 },
        dieSpeed: { value: 0.015 },
        radius: { value: 0.6 },
        curlSize: { value: 0.02 },
        attraction: { value: 1 },
        time: { value: 0 },
      },
      vertexShader: fullScreenVert,
      fragmentShader: positionSimFrag,
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.copyMaterial
    );
    this.scene.add(this.mesh);

    this.positionRenderTarget = new THREE.WebGLRenderTarget(
      SIM_TEXTURE_WIDTH,
      SIM_TEXTURE_HEIGHT,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType,
        depthBuffer: false,
      }
    );
    this.prevPositionRenderTarget = this.positionRenderTarget.clone();

    this.defaultPositionTexture = this.createDefaultPositionTexture();

    // 2枚のレンダーターゲットを最初から同じ初期状態で埋める
    this.copyMaterial.uniforms.uTex.value = this.defaultPositionTexture;
    this.renderer.setRenderTarget(this.positionRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    this.copyMaterial.uniforms.uTex.value = this.positionRenderTarget.texture;
    this.renderer.setRenderTarget(this.prevPositionRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  private createDefaultPositionTexture() {
    const positions = new Float32Array(SIM_AMOUNT * 4);

    for (let i = 0; i < SIM_AMOUNT; i++) {
      const i4 = i * 4;
      const r = (0.5 + Math.random() * 0.5) * 50; // 25~50
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
    return texture;
  }

  update(dtMs: number) {
    const deltaRatio = dtMs / (1000 / 60);

    const tmp = this.positionRenderTarget;
    this.positionRenderTarget = this.prevPositionRenderTarget;
    this.prevPositionRenderTarget = tmp;

    this.mesh.material = this.positionMaterial;
    this.positionMaterial.uniforms.textureDefaultPosition.value =
      this.defaultPositionTexture;
    this.positionMaterial.uniforms.texturePosition.value =
      this.prevPositionRenderTarget.texture;
    this.positionMaterial.uniforms.speed.value =
      this.uniforms.speed * deltaRatio;
    this.positionMaterial.uniforms.dieSpeed.value =
      this.uniforms.dieSpeed * deltaRatio;
    this.positionMaterial.uniforms.mouse3d.value.copy(this.mouse3d);
    this.positionMaterial.uniforms.time.value += dtMs * 0.001;

    this.renderer.setRenderTarget(this.positionRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  get positionTexture(): THREE.Texture {
    return this.positionRenderTarget.texture;
  }
}
