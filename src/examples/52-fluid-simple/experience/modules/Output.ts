import * as THREE from "three";
import Experience from "../Experience";
import faceVert from "../glsl/face.vert?raw";
import displayFrag from "../glsl/display.frag?raw";
import type Pointer from "./Pointer";
import { FluidSim } from "./FluidSim";

export default class Output {
  private experience: Experience;
  private renderer: THREE.WebGLRenderer;
  private time: Experience["time"];
  private pointer: Pointer;

  private sim: FluidSim;
  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private pointerColor: THREE.Color;
  private exposure = 1.6;
  private background = new THREE.Color("#000000");

  constructor(pointer: Pointer) {
    this.experience = Experience.getInstance();
    this.renderer = this.experience.renderer.instance;
    this.time = this.experience.time;
    this.pointer = pointer;

    const { width, height } = this.experience.config;
    this.sim = new FluidSim({
      renderer: this.renderer,
      width: width * 0.5,
      height: height * 0.5,
    });
    this.pointerColor = new THREE.Color("#4aa3ff");

    const material = new THREE.ShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: displayFrag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        dye: { value: this.sim.dyeTexture },
        velocity: { value: this.sim.velocityTexture },
        // 51と同様: デフォルトは速度表示（見た目のデバッグがしやすい）
        showVelocity: { value: true },
        exposure: { value: this.exposure },
        background: { value: this.background },
      },
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.experience.scene.add(this.mesh);
  }

  resize() {
    const { width, height } = this.experience.config;
    const scale = this.sim.tuning.resolutionScale;
    this.sim.resize(width * scale, height * scale);
  }

  update() {
    // 時間で色をゆっくり回す（見た目の分かりやすさ優先）
    const t = (this.time.elapsed / 1000) * 0.05;
    // 51の色味に寄せる
    this.pointerColor.setHSL(t % 1, 0.85, 0.55);

    const { uv, deltaUv, isDown, movedThisFrame } = this.pointer.state;

    this.sim.update({
      pointerUv: uv,
      pointerDeltaUv: deltaUv,
      pointerDown: isDown,
      pointerMovedThisFrame: movedThisFrame,
      color: this.pointerColor,
    });

    // Uniform は参照だが、念のため更新（51と同じ）
    this.mesh.material.uniforms.dye.value = this.sim.dyeTexture;
    this.mesh.material.uniforms.velocity.value = this.sim.velocityTexture;

  }
}

