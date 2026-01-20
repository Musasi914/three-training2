import { EffectComposer, GammaCorrectionShader, RenderPass, RGBShiftShader, ShaderPass } from "three/examples/jsm/Addons.js";
import Experience from "../Experience";
import * as THREE from "three";

export class Renderer {
  instance: THREE.WebGLRenderer;
  experience: Experience;
  canvasWrapper: Experience["canvasWrapper"];
  config: Experience["config"];

  composer: EffectComposer
  renderTarget: THREE.WebGLRenderTarget;

  constructor() {
    this.experience = Experience.getInstance();
    this.canvasWrapper = this.experience.canvasWrapper;
    this.config = this.experience.config;

    this.instance = this.setInstance();

    this.renderTarget = new THREE.WebGLRenderTarget(this.config.width, this.config.height, {
      samples: this.experience.config.pixelRatio === 1 ? 2 : 0
    });
    
    this.composer = new EffectComposer(this.instance, this.renderTarget);
    this.composer.setPixelRatio(this.config.pixelRatio);
    this.composer.setSize(this.config.width, this.config.height);
    this.composer.addPass(new RenderPass(this.experience.scene, this.experience.camera.instance))

    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    this.composer.addPass(rgbShiftPass)

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaCorrectionPass)
  }

  private setInstance() {
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
    });

    this.canvasWrapper.appendChild(renderer.domElement);
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(this.config.pixelRatio);
    renderer.setSize(this.config.width, this.config.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
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
    this.composer.setPixelRatio(this.config.pixelRatio);
    this.composer.setSize(this.config.width, this.config.height);
  }

  update() {
    this.composer.render(this.experience.time.delta);
  }
}

