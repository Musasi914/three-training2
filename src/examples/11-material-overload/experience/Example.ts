import Experience from "./Experience";
import * as THREE from "three";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];

  model!: THREE.Group;
  mesh!: THREE.Mesh;
  material!: THREE.MeshStandardMaterial;

  customUniforms: Record<string, { value: number }> = {};
  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.setEnvMap();
    this.setModel();

    this.customUniforms = {
      uTime: {value: 0}
    }

    this.createPlane()

    this.scene.add(new THREE.AxesHelper(3))
  }

  private setEnvMap() {
    const envMap = this.resource.items.envMap;
    this.scene.environment = envMap;
    this.scene.background = envMap;
  }

  private setModel() {
    this.model = this.resource.items.model.scene;
    const colorTexture = this.resource.items.colorTexture;
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    const normalTexture = this.resource.items.normalTexture;
    this.material = new THREE.MeshStandardMaterial({
      map: colorTexture,
      normalMap: normalTexture,
    });

    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking
    });


    this.material.onBeforeCompile = (shader) => {

      shader.uniforms.uTime = { value: this.customUniforms.uTime.value };
      shader.uniforms.uTime = this.customUniforms.uTime;
      
      console.log(shader.vertexShader)
      shader.vertexShader = shader.vertexShader.replace("#include <common>", `
        #include <common>

        uniform float uTime;

        mat2 get2dRotateMatrix(float _angle) {
          return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
      `)

      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", `
        #include <beginnormal_vertex>

        float angle = sin(uTime) * 0.2 * position.y;
        mat2 rotateMatrix = get2dRotateMatrix(angle);

        objectNormal.xz = rotateMatrix * objectNormal.xz;
      `)

      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", 
      `
        #include <begin_vertex>
        
        transformed.xz = rotateMatrix * transformed.xz;
      `)
    }

    depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.customUniforms.uTime;
      shader.vertexShader = shader.vertexShader.replace("#include <common>", `
        #include <common>

        uniform float uTime;

        mat2 get2dRotateMatrix(float _angle) {
          return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
      `)
      
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", 
      `
        #include <begin_vertex>

        float angle = sin(uTime) * 0.2 * position.y;
        transformed.xz = get2dRotateMatrix(angle) * transformed.xz;
      `)
    }
    
    this.mesh = this.model.children[0] as THREE.Mesh;
    this.mesh.rotation.y = Math.PI / 2;
    this.mesh.material = this.material;
    this.mesh.customDepthMaterial = depthMaterial;
    this.scene.add(this.mesh);

    this.scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.material.envMapIntensity = 1;
        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private createPlane() {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial()
    );
    plane.receiveShadow = true;
    plane.rotation.y = Math.PI;
    plane.position.z = 5
    plane.position.y = -3
    this.scene.add(plane);
  }

  update() {
    this.customUniforms.uTime.value = this.experience.time.elapsed / 1000;
  }
}
