import Experience from "./Experience";
import * as THREE from "three";
import trianglesVert from "./glsl/triangles.vert";
import particlesFrag from "./glsl/particles.frag";
import {
  SIM_TEXTURE_HEIGHT,
  SIM_TEXTURE_WIDTH,
  SpiritSimulator,
} from "./SpiritSimulator";

/** 床の初期色（元 floor.js の color と同じ） */
const FLOOR_INITIAL = 0x77777;

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];

  simulator: SpiritSimulator;
  particleMesh: THREE.Mesh;
  lightsGroup: THREE.Object3D;
  pointLight!: THREE.PointLight;
  floor!: THREE.Mesh;

  /** ndc */
  mouse = new THREE.Vector2();
  tmpOrigin = new THREE.Vector3();
  tmpDir = new THREE.Vector3();

  initAnimation = 0;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;

    this.simulator = new SpiritSimulator(this.renderer);

    const { geometry, material } = this.createTriangleParticleMesh();
    this.particleMesh = new THREE.Mesh(geometry, material);
    this.particleMesh.castShadow = false;
    this.scene.add(this.particleMesh);

    this.lightsGroup = this.createLights();
    this.scene.add(this.lightsGroup);

    this.floor = this.createFloor();
    this.scene.add(this.floor);

    const floorMat = this.floor.material as THREE.MeshStandardMaterial;
    this.scene.fog = new THREE.FogExp2(floorMat.color, 0.001);
    this.scene.background = floorMat.color;

    window.addEventListener("mousemove", this.onMouseMove);
  }

  private createTriangleParticleMesh(): {
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
  } {
    const w = SIM_TEXTURE_WIDTH;
    const h = SIM_TEXTURE_HEIGHT;
    const amount = w * h;

    const position = new Float32Array(amount * 3 * 3);
    const positionFlip = new Float32Array(amount * 3 * 3);
    const fboUV = new Float32Array(amount * 2 * 3);

    const PI = Math.PI;
    const angle = (PI * 2) / 3;
    const angles = [
      Math.sin(angle * 2 + PI),
      Math.cos(angle * 2 + PI),
      Math.sin(angle + PI),
      Math.cos(angle + PI),
      Math.sin(angle * 3 + PI),
      Math.cos(angle * 3 + PI),
      Math.sin(angle * 2),
      Math.cos(angle * 2),
      Math.sin(angle),
      Math.cos(angle),
      Math.sin(angle * 3),
      Math.cos(angle * 3),
    ];

    for (let i = 0; i < amount; i++) {
      const i6 = i * 6;
      const i9 = i * 9;
      if (i % 2) {
        position[i9 + 0] = angles[0]!;
        position[i9 + 1] = angles[1]!;
        position[i9 + 3] = angles[2]!;
        position[i9 + 4] = angles[3]!;
        position[i9 + 6] = angles[4]!;
        position[i9 + 7] = angles[5]!;

        positionFlip[i9 + 0] = angles[6]!;
        positionFlip[i9 + 1] = angles[7]!;
        positionFlip[i9 + 3] = angles[8]!;
        positionFlip[i9 + 4] = angles[9]!;
        positionFlip[i9 + 6] = angles[10]!;
        positionFlip[i9 + 7] = angles[11]!;
      } else {
        positionFlip[i9 + 0] = angles[0]!;
        positionFlip[i9 + 1] = angles[1]!;
        positionFlip[i9 + 3] = angles[2]!;
        positionFlip[i9 + 4] = angles[3]!;
        positionFlip[i9 + 6] = angles[4]!;
        positionFlip[i9 + 7] = angles[5]!;

        position[i9 + 0] = angles[6]!;
        position[i9 + 1] = angles[7]!;
        position[i9 + 3] = angles[8]!;
        position[i9 + 4] = angles[9]!;
        position[i9 + 6] = angles[10]!;
        position[i9 + 7] = angles[11]!;
      }

      const u = (i % w) / w;
      const v = Math.floor(i / w) / h;
      fboUV[i6 + 0] = fboUV[i6 + 2] = fboUV[i6 + 4] = u;
      fboUV[i6 + 1] = fboUV[i6 + 3] = fboUV[i6 + 5] = v;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute(
      "positionFlip",
      new THREE.BufferAttribute(positionFlip, 3)
    );
    geometry.setAttribute("fboUV", new THREE.BufferAttribute(fboUV, 2));

    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        {
          texturePosition: { value: null },
          flipRatio: { value: 0 },
          color1: { value: new THREE.Color(0xffffff) },
          color2: { value: new THREE.Color(0xffffff) },
          cameraMatrix: { value: new THREE.Matrix4() },
        },
      ]),
      vertexShader: trianglesVert,
      fragmentShader: particlesFrag,
      fog: true,
    });

    return { geometry, material };
  }

  private createLights(): THREE.Object3D {
    const group = new THREE.Object3D();
    group.position.set(0, 500, 0);

    const ambient = new THREE.AmbientLight(0x333333, 1);
    group.add(ambient);

    const pointLight = new THREE.PointLight(0xffffff, 1, 700);
    pointLight.castShadow = true;
    pointLight.shadow.bias = 0.1;
    pointLight.shadow.mapSize.width = 4096;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.camera.near = 10;
    pointLight.shadow.camera.far = 700;
    pointLight.shadow.intensity = 0.45;
    this.pointLight = pointLight;
    group.add(pointLight);

    // const d1 = new THREE.DirectionalLight(0xba8b8b, 0.5);
    // d1.position.set(1, 1, 1);
    // group.add(d1);

    // const d2 = new THREE.DirectionalLight(0x8bbab4, 0.3);
    // d2.position.set(1, 1, -1);
    // group.add(d2);

    return group;
  }

  private createFloor(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(4000, 4000, 10, 10);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 1,
      color: FLOOR_INITIAL,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -150;
    mesh.receiveShadow = true;
    return mesh;
  }

  private onMouseMove = (event: MouseEvent) => {
    const w = this.experience.config.width;
    const h = this.experience.config.height;
    this.mouse.x = (event.pageX / w) * 2 - 1;
    this.mouse.y = -(event.pageY / h) * 2 + 1;
  };

  resize() {
    /* fog / uniforms はシーンとマテリアルが追従 */
  }

  update() {
    const dtMs = this.experience.time.delta * 1000;

    this.initAnimation = Math.min(this.initAnimation + dtMs * 0.00025, 1);
    this.simulator.initAnimation = this.initAnimation;

    const cam = this.camera.instance;

    this.tmpOrigin.setFromMatrixPosition(cam.matrixWorld);
    this.tmpDir.set(this.mouse.x, this.mouse.y, 0.5);
    this.tmpDir.unproject(cam).sub(this.tmpOrigin).normalize();
    const dist =
      this.tmpOrigin.length() /
      Math.cos(Math.PI - this.tmpDir.angleTo(this.tmpOrigin));
    this.simulator.mouse3d
      .copy(this.tmpOrigin)
      .add(this.tmpDir.multiplyScalar(dist));

    this.simulator.update(dtMs);

    const mat = this.particleMesh.material as THREE.ShaderMaterial;
    mat.uniforms.texturePosition.value = this.simulator.positionTexture;
    mat.uniforms.cameraMatrix.value.copy(cam.matrixWorld);
    mat.uniforms.flipRatio.value = (mat.uniforms.flipRatio.value as number) ^ 1;
  }
}
