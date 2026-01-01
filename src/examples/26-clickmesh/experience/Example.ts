import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  geometry: THREE.SphereGeometry;
  material: THREE.MeshBasicMaterial;

  things: {
    mesh: THREE.Mesh;
    time: number;
    velocity: THREE.Vector3;
  }[] = [];

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;
    this.gui.close();

    this.geometry = new THREE.SphereGeometry(5, 4, 4);
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    window.addEventListener("mousemove", this.onMousemove.bind(this));
  }

  onMousemove(event: MouseEvent) {
    const thing = new THREE.Mesh(this.geometry, this.material);
    thing.position.set(
      event.clientX - this.experience.config.width / 2,
      -(event.clientY - this.experience.config.height / 2),
      0
    );
    this.scene.add(thing);
    this.things.push({
      mesh: thing,
      time: 2,
      velocity: new THREE.Vector3(
        THREE.MathUtils.randFloat(-100, 100),
        THREE.MathUtils.randFloat(-100, 100),
        THREE.MathUtils.randFloat(-100, 100)
      ),
    });
  }

  resize() {}

  update() {
    this.things.forEach((thing) => {
      thing.time -= this.experience.time.delta;
      if (thing.time <= 0) {
        this.scene.remove(thing.mesh);
        this.things.splice(this.things.indexOf(thing), 1);
      } else {
        thing.mesh.scale.set(thing.time, thing.time, thing.time);
        thing.mesh.position.addScaledVector(
          thing.velocity,
          this.experience.time.delta
        );
      }
    });
  }
}
