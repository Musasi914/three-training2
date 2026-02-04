import * as THREE from "three";
import Experience from "../Experience";
import faceVert from "../glsl/face.vert?raw";
import displayFrag from "../glsl/display.frag?raw";
import Simulation from "./Simulation";

type OutputOptions = {
  exposure: number;
  background: string;
};

export default class Output {
  experience: Experience;
  scene: Experience["scene"];
  renderer: Experience["renderer"]["instance"];
  camera: Experience["camera"]["instance"];
  gui: Experience["gui"];

  simulation: Simulation;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  options: OutputOptions = {
    exposure: 1.6,
    background: "#000000",
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera.instance;
    this.gui = this.experience.gui;

    this.simulation = new Simulation();

    const material = new THREE.ShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: displayFrag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        boundarySpace: { value: new THREE.Vector2(0, 0) },
        dye: { value: this.simulation.dyeTexture },
        velocity: { value: this.simulation.velocityTexture },
        // NOTE: 染料の見た目調整が終わるまで、速度表示を常時ONにする
        showVelocity: { value: true },
        exposure: { value: this.options.exposure },
        background: { value: new THREE.Color(this.options.background) },
      },
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.scene.add(this.mesh);

    this.setupGui();
  }

  private setupGui() {
    const f = this.gui.addFolder("Display");
    f.add(this.options, "exposure", 0.1, 5.0, 0.01).onChange((v: number) => {
      this.mesh.material.uniforms.exposure.value = v;
    });
    f.addColor(this.options, "background").onChange((v: string) => {
      (this.mesh.material.uniforms.background.value as THREE.Color).set(v);
    });
    f.close();
  }

  resize() {
    this.simulation.resize();
  }

  update() {
    this.simulation.update();

    // Uniforms are references, but念のため更新
    this.mesh.material.uniforms.dye.value = this.simulation.dyeTexture;
    this.mesh.material.uniforms.velocity.value =
      this.simulation.velocityTexture;

    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
  }
}
