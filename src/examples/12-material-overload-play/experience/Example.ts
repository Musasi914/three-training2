import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];

  boxMaterial!: THREE.MeshStandardMaterial;

  params = {
    time: { value: 0 },
  };
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.setEnvMap();
    this.setGeometry();
  }

  private setEnvMap() {
    const envMap = this.resource.items.envMap;
    this.scene.environment = envMap;
    this.scene.background = envMap;
  }

  private setGeometry() {
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2, 100, 100, 100);

    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    });

    this.boxMaterial = new THREE.MeshStandardMaterial();
    const boxMesh = new THREE.Mesh(boxGeometry, this.boxMaterial);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.customDepthMaterial = depthMaterial;
    this.scene.add(boxMesh);

    depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.params.time;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>
        uniform float uTime;
        mat2 get2dRotateMatrix(float _angle) {
          return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
      `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        mat2 rotateMat = get2dRotateMatrix(sin(uTime) * 0.5 * position.y);
        transformed.xz = rotateMat * transformed.xz;
      `
      );
    };

    this.boxMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.params.time;
      console.log(shader.vertexShader);

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>
        uniform float uTime;
        mat2 get2dRotateMatrix(float _angle) {
          return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
      `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `
        #include <beginnormal_vertex>
        mat2 rotateMat = get2dRotateMatrix(sin(uTime) * 0.5 * position.y);
        objectNormal.xz = rotateMat * objectNormal.xz;
      `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        transformed.xz = rotateMat * transformed.xz;
      `
      );
    };

    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial();
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.receiveShadow = true;
    planeMesh.position.z = 3;
    planeMesh.rotation.y = Math.PI;
    this.scene.add(planeMesh);
  }

  update() {
    this.params.time.value = this.experience.time.elapsed / 1000;
  }
}
