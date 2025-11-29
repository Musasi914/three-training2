import * as THREE from "three";
import face_vert from "../glsl/face.vert?raw";
import color_frag from "../glsl/color.frag?raw";
import Experience from "../Experience";
import Simulation from "./Simulation";

export default class Output {
  experience: Experience;
  scene: Experience["scene"];
  output: THREE.Mesh;
  simulation: Simulation;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;

    this.simulation = new Simulation();

    this.output = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: face_vert,
        fragmentShader: color_frag,
        uniforms: {
          // velocity: {
          //   value: this.simulation.fbos.vel_1.texture,
          // },
          boundarySpace: {
            value: new THREE.Vector2(),
          },
        },
      })
    );
    this.scene.add(this.output);
  }

  update() {
    this.experience.renderer.instance.render(
      this.experience.scene,
      this.experience.camera.instance
    );

    this.simulation.update();
  }
}
