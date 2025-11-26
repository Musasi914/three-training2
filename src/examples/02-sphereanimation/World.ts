import * as THREE from "three";
import Experience from "./Experience";
import { gsap } from "gsap";

export class World {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];

  // 例: 跳ね回る球体
  sphere: THREE.Mesh | null = null;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;

    // ライトを追加（この例専用の設定 - より明るく）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // 点光源を追加
    const pointLight = new THREE.PointLight(0xff00ff, 0.5);
    pointLight.position.set(-5, 5, 5);
    this.scene.add(pointLight);

    // 球体を作成
    this.createSphere();

    // GUI設定（オプション）
    this.setupGUI();
  }

  private createSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff6b6b,
      metalness: 0.7,
      roughness: 0.2,
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.sphere.position.y = 2;
    this.sphere.castShadow = true;
    this.scene.add(this.sphere);

    // GSAPで複雑なアニメーション
    if (this.sphere) {
      const timeline = gsap.timeline({ repeat: -1, yoyo: true });
      
      timeline.to(this.sphere.position, {
        y: 5,
        duration: 1,
        ease: "power2.inOut",
      });

      timeline.to(this.sphere.rotation, {
        x: Math.PI * 2,
        duration: 2,
        ease: "none",
      }, 0);

      timeline.to(this.sphere.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 1,
        ease: "elastic.out(1, 0.3)",
      }, 0);
    }
  }

  private setupGUI() {
    if (!this.sphere) return;

    const folder = this.gui.addFolder("Sphere");
    folder.add(this.sphere.position, "x", -5, 5, 0.1);
    folder.add(this.sphere.position, "y", -5, 5, 0.1);
    folder.add(this.sphere.position, "z", -5, 5, 0.1);
    folder.open();
  }

  update() {
    // 必要に応じて毎フレーム更新
  }
}

