import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Experience from "./Experience";
import * as THREE from "three";
import particleVert from "./glsl/particle.vert";
import particleFrag from "./glsl/particle.frag";

gsap.registerPlugin(ScrollTrigger);

export default class Example {
  static BOX_SIZE = 600 as const;
  static GRID_COUNT = 40 as const;
  static LAYER_COUNT = 45 as const;
  static NUM_PARTICLES =
    Example.GRID_COUNT * Example.GRID_COUNT * Example.LAYER_COUNT;
  static MAX_DEPTH = 800 as const;

  experience: Experience;
  gui: Experience["gui"];
  scene: Experience["scene"];
  renderer: Experience["renderer"];
  camera: Experience["camera"];
  config: Experience["config"];

  private points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private scrollProgress = { value: 0 };

  constructor() {
    this.experience = Experience.getInstance();
    this.gui = this.experience.gui;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.config = this.experience.config;

    this.points = this.createPoints();
    this.scene.add(this.points);

    // this.camera.controls.autoRotate = false;
    // this.camera.controls.enabled = false;

    this.setupScrollTrigger();
    this.setupGui();
  }

  private createPoints() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(Example.NUM_PARTICLES * 3);
    const aZIndex = new Float32Array(Example.NUM_PARTICLES);
    const aRandom = new Float32Array(Example.NUM_PARTICLES * 3);

    const gridCellSize = Example.BOX_SIZE / Example.GRID_COUNT;
    const depthPerLayer = Example.MAX_DEPTH / Example.LAYER_COUNT;

    let particleIndex = 0;
    for (
      let layerIndex = Example.LAYER_COUNT - 1;
      layerIndex >= 0;
      layerIndex--
    ) {
      const zPositionMultiplier = -layerIndex;
      for (let rowIndex = 0; rowIndex < Example.GRID_COUNT; rowIndex++) {
        const centeredColumn = rowIndex - (Example.GRID_COUNT - 1) / 2;
        for (
          let columnIndex = 0;
          columnIndex < Example.GRID_COUNT;
          columnIndex++
        ) {
          const centeredRow = columnIndex - (Example.GRID_COUNT - 1) / 2;
          positions[particleIndex * 3 + 0] = centeredColumn * gridCellSize;
          positions[particleIndex * 3 + 1] = centeredRow * gridCellSize;
          positions[particleIndex * 3 + 2] =
            zPositionMultiplier * depthPerLayer;

          aZIndex[particleIndex] = layerIndex / Example.LAYER_COUNT;
          aRandom[particleIndex * 3 + 0] = Math.random();
          aRandom[particleIndex * 3 + 1] = Math.random();
          aRandom[particleIndex * 3 + 2] = Math.random();

          particleIndex++;
        }
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aZIndex", new THREE.BufferAttribute(aZIndex, 1));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(aRandom, 3));

    const noisePosOffset = new THREE.Vector3(
      Math.random() * 1000,
      Math.random() * 1000,
      Math.random() * 1000
    );

    // パーティクル1つの画面ピクセルサイズ
    // gridCellSize を基準に、透視投影（FOV・距離）を考慮してスクリーンサイズに変換
    const pointSize =
      (0.9 * gridCellSize * this.config.height) /
      (Example.BOX_SIZE * Math.tan((this.camera.instance.fov * Math.PI) / 360));

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSizeProgress: { value: 0 },
        uRandomProgress: { value: 0 },
        uDepth: { value: 0 },
        uRandom: { value: 0 },
        uNoisePosOffset: { value: noisePosOffset },
        uBoxSize: { value: 1 / Example.BOX_SIZE },
        uPointSize: { value: pointSize },
        uMaxDepth: { value: Example.MAX_DEPTH },
        uResolution: {
          value: new THREE.Vector2(this.config.width, this.config.height),
        },
        uColor: { value: new THREE.Color(0xffffff) },
        uBgColor: { value: new THREE.Color(0x333333) },
        uCameraPosition: { value: this.camera.instance.position },
      },
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      transparent: true,
      depthTest: true,
    });

    const points = new THREE.Points(geometry, material);
    points.position.set(0, 0, 0);
    return points;
  }

  private setupScrollTrigger() {
    const scrollSection = document.querySelector("#scrollSection");
    if (!scrollSection) return;

    ScrollTrigger.create({
      trigger: scrollSection,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        this.scrollProgress.value = self.progress;
      },
    });
  }

  private setupGui() {
    const folder = this.gui.addFolder("Particle");
    folder
      .add(this.scrollProgress, "value", 0, 1, 0.01)
      .name("Scroll Progress");
    folder.open();
  }

  resize() {
    const material = this.points.material;
    if (material.uniforms.uResolution) {
      material.uniforms.uResolution.value.set(
        this.config.width,
        this.config.height
      );
    }
    const pointSize =
      (0.9 * (Example.BOX_SIZE / Example.GRID_COUNT) * this.config.height) /
      (Example.BOX_SIZE * Math.tan((this.camera.instance.fov * Math.PI) / 360));
    material.uniforms.uPointSize.value = pointSize;
  }

  update() {
    const progress = this.scrollProgress.value;
    const material = this.points.material;

    material.uniforms.uTime.value = this.experience.time.elapsed * 0.001;
    material.uniforms.uDepth.value = progress;
    material.uniforms.uSizeProgress.value = Math.pow(progress, 1.5);
    material.uniforms.uRandomProgress.value = Math.pow(progress, 2);
    material.uniforms.uRandom.value = progress;
    material.uniforms.uCameraPosition.value.copy(this.camera.instance.position);
  }
}
