import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vertex.vert";
import fragmentShader from "./glsl/fragment.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  camera: Experience["camera"];

  trusknotMesh!: THREE.Mesh;
  sphereMesh!: THREE.Mesh;
  trusMesh!: THREE.Mesh;
  material: THREE.ShaderMaterial;

  params = {
    color: 0xffffff,
    decay: 0.2,
    specularPower: 50.0,
  };

  pointLightHelper!: THREE.Mesh;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.camera = this.experience.camera;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(this.params.color) },
        uPointLightPos: { value: new THREE.Vector3(0.0, 2.5, 0.0) },
        uDecay: { value: 0.2 },
        uSpecularPower: { value: 50.0 },
      },
    });

    this.createObjects();
    this.createLightHelper();
    this.createGUI();
  }

  private createObjects() {
    this.trusknotMesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
      this.material
    );
    this.trusknotMesh.position.x = -4;
    this.scene.add(this.trusknotMesh);

    this.sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      this.material
    );
    this.scene.add(this.sphereMesh);

    this.trusMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.5),
      this.material
    );
    this.trusMesh.position.x = 4;
    this.scene.add(this.trusMesh);
  }

  private createLightHelper() {
    const directionalLightHelper = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial()
    );
    directionalLightHelper.material.color.setRGB(0.1, 0.1, 1.0);
    directionalLightHelper.material.side = THREE.DoubleSide;
    directionalLightHelper.position.set(0, 0, 3);
    this.scene.add(directionalLightHelper);

    const pointLightHelper = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 2),
      new THREE.MeshBasicMaterial()
    );
    pointLightHelper.material.color.setRGB(1, 0.1, 0.1);
    pointLightHelper.position.set(0, 2.5, 0);
    this.scene.add(pointLightHelper);

    this.pointLightHelper = pointLightHelper;
  }

  private createGUI() {
    this.gui.addColor(this.params, "color").onChange(() => {
      this.material.uniforms.uColor.value.set(this.params.color);
    });
    this.gui
      .add(this.params, "decay")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange(() => {
        this.material.uniforms.uDecay.value = this.params.decay;
      });
    this.gui
      .add(this.params, "specularPower")
      .min(1)
      .max(100)
      .step(1)
      .onChange(() => {
        this.material.uniforms.uSpecularPower.value = Number(
          this.params.specularPower
        );
      });
  }

  update() {
    const elapsed = this.experience.time.elapsed / 1000;
    this.trusknotMesh.rotation.z = elapsed;
    this.trusknotMesh.rotation.x = elapsed / 2;
    this.sphereMesh.rotation.z = elapsed / 4;
    this.sphereMesh.rotation.x = elapsed;
    this.trusMesh.rotation.z = elapsed / 8;
    this.trusMesh.rotation.x = elapsed;

    this.pointLightHelper.position.x = Math.sin(elapsed * 2) * 2;
    this.material.uniforms.uPointLightPos.value =
      this.pointLightHelper.position;
  }
}
