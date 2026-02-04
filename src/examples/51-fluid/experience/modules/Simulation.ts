import * as THREE from "three";
import Experience from "../Experience";
import Advect from "./Advect";
import Divergence from "./Divergence";
import Poisson from "./Poisson";
import Project from "./Project";
import ExternalForce from "./ExternalForce";
import DyeSplat from "./DyeSplat";

type DoubleFbo = {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap: () => void;
  dispose: () => void;
};

type SimulationOptions = {
  resolutionScale: number;
  dt: number;
  pressureIterations: number;
  velocityDissipation: number;
  dyeDissipation: number;
  splatRadius: number;
  forceStrength: number;
  dyeIntensity: number;
  pressToApply: boolean;
};

const createDoubleFbo = (
  createTarget: () => THREE.WebGLRenderTarget
): DoubleFbo => {
  const a = createTarget();
  const b = createTarget();

  return {
    read: a,
    write: b,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
    dispose() {
      this.read.dispose();
      this.write.dispose();
    },
  };
};

export default class Simulation {
  experience: Experience;
  renderer: THREE.WebGLRenderer;
  gui: Experience["gui"];
  config: Experience["config"];

  options: SimulationOptions = {
    resolutionScale: 0.5,
    dt: 0.016,
    pressureIterations: 24,
    velocityDissipation: 0.99,
    dyeDissipation: 0.985,
    splatRadius: 80,
    forceStrength: 80,
    dyeIntensity: 2.0,
    pressToApply: false,
  };

  private fboSize = new THREE.Vector2(1, 1);
  private px = new THREE.Vector2(1, 1);

  private velocity!: DoubleFbo;
  private dye!: DoubleFbo;
  private pressure!: DoubleFbo;
  private divergence!: THREE.WebGLRenderTarget;

  private advectVel!: Advect;
  private advectDye!: Advect;
  private externalForce!: ExternalForce;
  private divergencePass!: Divergence;
  private poisson!: Poisson;
  private project!: Project;
  private dyeSplat!: DyeSplat;

  private tmpColor = new THREE.Color();

  constructor() {
    this.experience = Experience.getInstance();
    this.renderer = this.experience.renderer.instance;
    this.gui = this.experience.gui;
    this.config = this.experience.config;

    this.setupGui();
    this.create();
  }

  get velocityTexture() {
    return this.velocity.read.texture;
  }

  get dyeTexture() {
    return this.dye.read.texture;
  }

  private setupGui() {
    const f = this.gui.addFolder("Fluid");
    f.add(this.options, "resolutionScale", 0.2, 1.0, 0.01).onFinishChange(
      () => {
        this.resize();
      }
    );
    f.add(this.options, "pressToApply");
    f.add(this.options, "splatRadius", 5, 200, 1);
    f.add(this.options, "forceStrength", 1, 200, 1);
    f.add(this.options, "dyeIntensity", 0, 10, 0.01);
    f.add(this.options, "dt", 1 / 240, 1 / 30, 0.0005);
    f.add(this.options, "pressureIterations", 1, 64, 1);
    f.add(this.options, "velocityDissipation", 0.9, 1.0, 0.0005);
    f.add(this.options, "dyeDissipation", 0.9, 1.0, 0.0005);
    f.close();
  }

  private createRenderTarget(width: number, height: number) {
    return new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
  }

  private clearTarget(target: THREE.WebGLRenderTarget) {
    const prevColor = new THREE.Color();
    this.renderer.getClearColor(prevColor);
    const prevAlpha = this.renderer.getClearAlpha();

    this.renderer.setRenderTarget(target);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear(true, true, true);
    this.renderer.setRenderTarget(null);

    this.renderer.setClearColor(prevColor, prevAlpha);
  }

  private create() {
    this.config = this.experience.config;

    const scale = this.options.resolutionScale;
    const w = Math.max(2, Math.round(this.config.width * scale));
    const h = Math.max(2, Math.round(this.config.height * scale));

    this.fboSize.set(w, h);
    this.px.set(1 / w, 1 / h);

    const createTarget = () => this.createRenderTarget(w, h);
    this.velocity = createDoubleFbo(createTarget);
    this.dye = createDoubleFbo(createTarget);
    this.pressure = createDoubleFbo(createTarget);
    this.divergence = createTarget();

    this.clearTarget(this.velocity.read);
    this.clearTarget(this.velocity.write);
    this.clearTarget(this.dye.read);
    this.clearTarget(this.dye.write);
    this.clearTarget(this.pressure.read);
    this.clearTarget(this.pressure.write);
    this.clearTarget(this.divergence);

    this.advectVel = new Advect(this.velocity.write, {
      fboSize: this.fboSize,
      px: this.px,
      dt: this.options.dt,
      dissipation: this.options.velocityDissipation,
      velocity: this.velocity.read.texture,
      source: this.velocity.read.texture,
    });

    this.advectDye = new Advect(this.dye.write, {
      fboSize: this.fboSize,
      px: this.px,
      dt: this.options.dt,
      dissipation: this.options.dyeDissipation,
      velocity: this.velocity.read.texture,
      source: this.dye.read.texture,
    });

    this.externalForce = new ExternalForce(this.velocity.read, { px: this.px });
    this.dyeSplat = new DyeSplat(this.dye.read, { px: this.px });

    this.divergencePass = new Divergence(this.divergence, {
      px: this.px,
      dt: this.options.dt,
    });

    this.poisson = new Poisson(
      this.divergence.texture,
      {
        read: this.pressure.read,
        write: this.pressure.write,
      },
      this.px
    );

    this.project = new Project(this.velocity.write, {
      px: this.px,
      dt: this.options.dt,
      velocity: this.velocity.read.texture,
      pressure: this.pressure.read.texture,
    });
  }

  resize() {
    this.dispose();
    this.create();
  }

  private dispose() {
    this.velocity?.dispose();
    this.dye?.dispose();
    this.pressure?.dispose();
    this.divergence?.dispose();
  }

  update() {
    // 1) velocity advection (semi-Lagrangian)
    this.advectVel.shaderPassProps.output = this.velocity.write;
    this.advectVel.render({
      dt: this.options.dt,
      dissipation: this.options.velocityDissipation,
      velocity: this.velocity.read.texture,
      source: this.velocity.read.texture,
    });
    this.velocity.swap();

    // 2) external force (splat) into velocity (additive)
    this.externalForce.render(this.velocity.read, {
      strength: this.options.forceStrength,
      radius: this.options.splatRadius,
      pressToApply: this.options.pressToApply,
    });

    // 3) divergence from velocity
    this.divergencePass.render(this.velocity.read.texture);

    // 4) pressure solve (Jacobi)
    this.poisson.setDivergence(this.divergence.texture);
    const pressure = this.poisson.render(this.options.pressureIterations);

    // 5) projection (make velocity divergence-free)
    this.project.shaderPassProps.output = this.velocity.write;
    this.project.render(this.velocity.read.texture, pressure.texture);
    this.velocity.swap();

    // 6) dye advection by projected velocity
    this.advectDye.shaderPassProps.output = this.dye.write;
    this.advectDye.render({
      dt: this.options.dt,
      dissipation: this.options.dyeDissipation,
      velocity: this.velocity.read.texture,
      source: this.dye.read.texture,
    });
    this.dye.swap();

    // 7) dye splat (pretty color)
    const t = this.experience.time.elapsed * 0.00003;
    this.tmpColor.setHSL(t % 1, 0.85, 0.55);
    this.dyeSplat.render(this.dye.read, {
      radius: this.options.splatRadius,
      intensity: this.options.dyeIntensity,
      color: this.tmpColor,
      pressToApply: this.options.pressToApply,
    });
  }
}
