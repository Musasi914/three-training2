import Experience from "../Experience";
import * as THREE from "three";
import type Pointer from "./Pointer";
import FluidSim from "./FluidSim";
import faceVert from "../glsl/face.vert?raw";
import outputFrag from "../glsl/output.frag?raw";

export default class Output {
  private experience: Experience;
  private gui: Experience["gui"];
  private scene: Experience["scene"];
  private renderer: THREE.WebGLRenderer;
  private time: Experience["time"];
  private pointer: Pointer;

  private sim: FluidSim;

  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private pointerColor: THREE.Color = new THREE.Color("#4aa3ff");

  constructor(pointer: Pointer) {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.time = this.experience.time;
    this.pointer = pointer;

    this.sim = new FluidSim({
      renderer: this.renderer,
      width: this.experience.config.width,
      height: this.experience.config.height,
    });

    const material = new THREE.ShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: outputFrag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uVelocity: { value: this.sim.velocityTexture },
        uImg: { value: this.experience.resource.items["img"] },
        uImageAspect: {
          value: 640 / 427,
        },
        uPlaneAspect: {
          value: this.experience.config.width / this.experience.config.height,
        },
        uIsBlur: {
          value: true,
        },
      },
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.scene.add(this.mesh);

    this.gui = this.experience.gui;
    this.gui.add(material.uniforms.uIsBlur, "value").name("Is Blur");
  }

  update() {
    const t = (this.time.elapsed / 1000) * 0.05;
    this.pointerColor.setHSL(t % 1, 0.85, 0.55);

    this.sim.update({
      pointerUv: this.pointer.state.uv,
      pointerDeltaUv: this.pointer.state.deltaUv,
      pointerMovedThisFrame: this.pointer.state.movedThisFrame,
    });

    this.mesh.material.uniforms.uVelocity.value = this.sim.velocityTexture;
  }
}
