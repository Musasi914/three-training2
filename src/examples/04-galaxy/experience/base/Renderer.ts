import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
import Experience from "../Experience";
import * as THREE from "three";

export class Renderer {
  instance: THREE.WebGLRenderer;
  experience: Experience;
  canvasWrapper: Experience["canvasWrapper"];
  config: Experience["config"];

  composer: EffectComposer;
  renderTarget: THREE.WebGLRenderTarget;

  constructor() {
    this.experience = Experience.getInstance();
    this.canvasWrapper = this.experience.canvasWrapper;
    this.config = this.experience.config;

    this.instance = this.setInstance();

    this.renderTarget = new THREE.WebGLRenderTarget(
      this.config.width,
      this.config.height,
      {
        samples: this.config.pixelRatio === 1 ? 2 : 0,
      }
    );
    this.composer = new EffectComposer(this.instance, this.renderTarget);
    this.composer.setPixelRatio(this.config.pixelRatio);
    this.composer.setSize(this.config.width, this.config.height);
    this.composer.addPass(
      new RenderPass(this.experience.scene, this.experience.camera.instance)
    );
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        this.config.width * this.config.pixelRatio,
        this.config.height * this.config.pixelRatio
      ),
      2,
      0.5,
      0.2
    );
    this.composer.addPass(bloomPass);
  }

  private setInstance() {
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: this.config.pixelRatio === 1,
    });

    this.canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(this.config.pixelRatio);
    renderer.setSize(this.config.width, this.config.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  resize() {
    this.config = this.experience.config;
    this.instance.setPixelRatio(this.config.pixelRatio);
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.render(
      this.experience.scene,
      this.experience.camera.instance
    );
  }

  update() {
    this.composer.render(this.experience.time.delta);
  }
}
