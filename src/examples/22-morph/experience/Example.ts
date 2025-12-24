import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vert.vert";
import fragmentShader from "./glsl/frag.frag";
import gsap from "gsap";

export default class Example {
  static duration = 0.7;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];

  geometry!: THREE.BufferGeometry;
  material!: THREE.ShaderMaterial;
  mesh!: THREE.Points;

  targetGeometries: THREE.BufferGeometry[] = [];
  targetPositions: THREE.BufferAttribute[] = [];
  maxCountInfo: {
    count: number;
    targetGeo: THREE.BufferGeometry | null;
  } = {
    count: 0,
    targetGeo: null,
  };

  previousIndex = 0;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0 },
        uDuration: { value: Example.duration },
        uColorA: {
          value: new THREE.Color(1, 0, 0),
        },
        uColorB: {
          value: new THREE.Color(0, 1, 0),
        },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.setTargetGeos();
    this.maxCountInfo = this.targetGeometries.reduce(
      (
        acc: { count: number; targetGeo: THREE.BufferGeometry | null },
        curr: THREE.BufferGeometry
      ) => {
        if (curr.attributes.position.count > acc.count) {
          return { count: curr.attributes.position.count, targetGeo: curr };
        } else {
          return acc;
        }
      },
      { count: 0, targetGeo: null }
    );

    this.setTargetPositions();

    this.createObj();

    this.createButtonActions();
  }

  private setTargetGeos() {
    const torusGeometry = new THREE.TorusGeometry(0.8, 0.4, 24, 64);
    torusGeometry.setIndex(null);
    this.targetGeometries.push(torusGeometry);

    const torusknotGeometry = new THREE.TorusKnotGeometry(0.6, 0.35, 100, 16);
    torusknotGeometry.setIndex(null);
    this.targetGeometries.push(torusknotGeometry);

    const sphereGeometry = new THREE.SphereGeometry(1.4, 40, 40);
    sphereGeometry.setIndex(null);
    this.targetGeometries.push(sphereGeometry);
  }

  private setTargetPositions() {
    for (const targetGeometry of this.targetGeometries) {
      const newPosition = new Float32Array(this.maxCountInfo.count * 3);

      const originalPositions = targetGeometry.attributes.position.array;
      const originalCount = targetGeometry.attributes.position.count;

      for (let i = 0; i < this.maxCountInfo.count; i++) {
        if (i < originalCount) {
          newPosition[i * 3] = originalPositions[i * 3];
          newPosition[i * 3 + 1] = originalPositions[i * 3 + 1];
          newPosition[i * 3 + 2] = originalPositions[i * 3 + 2];
        } else {
          const randomIndex = Math.floor(Math.random() * originalCount);
          newPosition[i * 3] = originalPositions[randomIndex * 3];
          newPosition[i * 3 + 1] = originalPositions[randomIndex * 3 + 1];
          newPosition[i * 3 + 2] = originalPositions[randomIndex * 3 + 2];
        }
      }

      const attribute = new THREE.BufferAttribute(newPosition, 3);
      this.targetPositions.push(attribute);
    }
  }

  private createObj() {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      this.targetPositions[this.previousIndex]
    );
    this.geometry.setAttribute(
      "aTargetPosition",
      this.targetPositions[
        this.previousIndex + (1 % this.targetGeometries.length)
      ]
    );

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  private createButtonActions() {
    const btns = document.querySelectorAll<HTMLButtonElement>(".btns button");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        this.geometry.setAttribute(
          "position",
          this.targetPositions[this.previousIndex]
        );
        this.geometry.setAttribute(
          "aTargetPosition",
          this.targetPositions[index]
        );

        this.previousIndex = index;

        gsap.fromTo(
          this.material.uniforms.uProgress,
          {
            value: 0,
          },
          {
            value: 1,
            duration: 1,
            ease: "none",
          }
        );
      });
    });
  }

  resize() {}

  update() {}
}
