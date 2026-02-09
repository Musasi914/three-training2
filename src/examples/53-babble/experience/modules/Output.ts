import * as THREE from "three";
import Experience from "../Experience";
import faceVert from "../glsl/face.vert?raw";
import babbleFrag from "../glsl/babble.frag?raw";
import type Pointer from "./Pointer";
import { Textures } from "./Textures";
import { GUI } from "lil-gui";

export default class Output {
  private experience: Experience;
  private time: Experience["time"];
  private pointer: Pointer;

  private textures: Textures;
  private mesh?: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  private readonly resolution = new THREE.Vector2(1, 1);
  private readonly pointerUv = new THREE.Vector2(0.5, 0.5);

  private readonly backgroundCoveredScale = new THREE.Vector2(1, 1);
  private readonly filterCoveredScale = new THREE.Vector2(1, 1);
  private readonly maskCoveredScale = new THREE.Vector2(1, 1);

  private readonly bubbleOffset = new THREE.Vector2(0, 0);
  private gui?: GUI;

  constructor(pointer: Pointer) {
    this.experience = Experience.getInstance();
    this.time = this.experience.time;
    this.pointer = pointer;
    this.textures = new Textures();

    void this.init();
  }

  private computeCoveredScale(textureAspect: number, screenAspect: number) {
    // "cover" 表示: 余る方向を切り取る（uvのサンプリング範囲を狭める）
    if (screenAspect < textureAspect) {
      return { x: screenAspect / textureAspect, y: 1.0 };
    }
    return { x: 1.0, y: textureAspect / screenAspect };
  }

  private applyCoveredScale(
    target: THREE.Vector2,
    texture: THREE.Texture,
    screenAspect: number
  ) {
    const aspect = (texture.userData.aspect as number | undefined) ?? 1.0;
    const s = this.computeCoveredScale(aspect, screenAspect);
    target.set(s.x, s.y);
  }

  private updateViewportUniforms() {
    const { width, height, pixelRatio } = this.experience.config;
    this.resolution.set(width * pixelRatio, height * pixelRatio);

    const screenAspect = width / Math.max(height, 1);

    if (!this.mesh) return;
    const mat = this.mesh.material;

    mat.uniforms.resolution.value = this.resolution;

    this.applyCoveredScale(
      this.backgroundCoveredScale,
      mat.uniforms.backgroundTex.value as THREE.Texture,
      screenAspect
    );
    this.applyCoveredScale(
      this.filterCoveredScale,
      mat.uniforms.filterTex.value as THREE.Texture,
      screenAspect
    );
    this.applyCoveredScale(
      this.maskCoveredScale,
      mat.uniforms.maskTex.value as THREE.Texture,
      screenAspect
    );

    mat.uniforms.backgroundCoveredScale.value = this.backgroundCoveredScale;
    mat.uniforms.filterCoveredScale.value = this.filterCoveredScale;
    mat.uniforms.maskCoveredScale.value = this.maskCoveredScale;
  }

  private async init() {
    await this.textures.load();

    const backgroundTex = this.textures.get("background");
    const bottleTex = this.textures.get("bottle");
    const filterTex = this.textures.get("filter");
    const maskTex = this.textures.get("mask");
    const noiseTex = this.textures.get("noise");

    const bottleAspect = (bottleTex.userData.aspect as number | undefined) ?? 1.0;

    const material = new THREE.ShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: babbleFrag,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      uniforms: {
        backgroundTex: { value: backgroundTex },
        bottleTex: { value: bottleTex },
        filterTex: { value: filterTex },
        maskTex: { value: maskTex },
        noiseTex: { value: noiseTex },
        resolution: { value: this.resolution },
        pointerUv: { value: this.pointerUv },
        time: { value: 0 },
        backgroundCoveredScale: { value: this.backgroundCoveredScale },
        filterCoveredScale: { value: this.filterCoveredScale },
        maskCoveredScale: { value: this.maskCoveredScale },
        bottleAspect: { value: bottleAspect },
        bubbleOffset: { value: this.bubbleOffset },
        // 画面内でのボトルの“高さ”（0..1）。好みで調整できるようUniformにしておく
        bottleHeight: { value: 0.72 },
      },
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.experience.scene.add(this.mesh);

    this.updateViewportUniforms();
    this.initGui();
  }

  private initGui() {
    if (this.gui) return;
    if (!this.mesh) return;

    // 既存の例と同様に、必要なときだけ GUI を生成
    this.gui = new GUI({ title: "53 Babble" });

    const params = {
      offsetX: 0,
      offsetY: 0,
      reset: () => {
        params.offsetX = 0;
        params.offsetY = 0;
        this.bubbleOffset.set(0, 0);
        this.gui?.controllersRecursive().forEach((c) => c.updateDisplay());
      },
    };

    const folder = this.gui.addFolder("Bubble");
    folder
      .add(params, "offsetX", -0.3, 0.3, 0.001)
      .name("offsetX")
      .onChange((v: number) => {
        this.bubbleOffset.x = v;
      });
    folder
      .add(params, "offsetY", -0.3, 0.3, 0.001)
      .name("offsetY")
      .onChange((v: number) => {
        this.bubbleOffset.y = v;
      });
    folder.add(params, "reset").name("reset");
    folder.open();
  }

  resize() {
    if (!this.mesh) return;
    this.updateViewportUniforms();
  }

  update() {
    if (!this.mesh) return;

    this.pointerUv.copy(this.pointer.state.uv);

    const mat = this.mesh.material;
    mat.uniforms.pointerUv.value = this.pointerUv;
    mat.uniforms.time.value = this.time.elapsed / 1000;
  }
}

