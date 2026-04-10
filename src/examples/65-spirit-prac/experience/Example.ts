import Experience from "./Experience";
import * as THREE from "three";
import SpiritSimulator, {
  SIM_TEXTURE_HEIGHT,
  SIM_TEXTURE_WIDTH,
} from "./SpiritSimulator";
import trianglesVert from "./glsl/triangles.vert";
import trianglesFrag from "./glsl/triangles.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  camera: Experience["camera"];

  floor: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;

  spiritSimulator: SpiritSimulator;

  mouse = new THREE.Vector2();

  particleMesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera;

    this.floor = this.createFloor();
    this.scene.add(this.floor);
    this.scene.fog = new THREE.FogExp2(this.floor.material.color, 0.001);
    this.scene.background = this.floor.material.color;

    this.spiritSimulator = new SpiritSimulator(this.renderer);

    window.addEventListener("mousemove", this.onMouseMove);

    const { geometry, material } = this.createTriangleParticleMesh();
    this.particleMesh = new THREE.Mesh(geometry, material);
    this.particleMesh.castShadow = true;
    this.scene.add(this.particleMesh);
  }

  // plane!: THREE.Mesh;
  // private createDebugPlane() {
  //   const geometry = new THREE.PlaneGeometry(100, 100);
  //   const material = new THREE.MeshBasicMaterial({
  //     map: this.spiritSimulator.positionTexture,
  //   });
  //   this.plane = new THREE.Mesh(geometry, material);
  //   this.scene.add(this.plane);
  // }

  private createFloor() {
    const geometry = new THREE.PlaneGeometry(4000, 4000);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 1,
      color: 0x4488ff,
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

  private createTriangleParticleMesh() {
    const w = SIM_TEXTURE_WIDTH;
    const h = SIM_TEXTURE_HEIGHT;
    const amount = w * h;

    const position = new Float32Array(amount * 3 * 3);
    const positionFlip = new Float32Array(amount * 3 * 3);
    const fboUV = new Float32Array(amount * 3 * 2);

    const PI = Math.PI;
    const angle = (PI * 2) / 3;
    const angles = [
      Math.sin(angle * 2), // 通常三角頂点1のx
      Math.cos(angle * 2), // 通常三角頂点1のy
      Math.sin(angle), // 通常三角頂点2のx
      Math.cos(angle), // 通常三角頂点2のy
      Math.sin(angle * 3), // 通常三角頂点3のx
      Math.cos(angle * 3), // 通常三角頂点3のy
      Math.sin(angle * 2 + PI), // フリップ三角頂点1のx
      Math.cos(angle * 2 + PI), // フリップ三角頂点1のy
      Math.sin(angle + PI), // フリップ三角頂点2のx
      Math.cos(angle + PI), // フリップ三角頂点2のy
      Math.sin(angle * 3 + PI), // フリップ三角頂点3のx
      Math.cos(angle * 3 + PI), // フリップ三角頂点3のy
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
      uniforms: {
        texturePosition: { value: null },
        flipRatio: { value: 0 },
        color1: { value: new THREE.Color(0xffffff) },
        color2: { value: new THREE.Color(0xffffff) },
        cameraMatrix: { value: new THREE.Matrix4() },
      },
      vertexShader: trianglesVert,
      fragmentShader: trianglesFrag,
    });

    return { geometry, material };
  }

  resize() {}

  tmpOrigin = new THREE.Vector3();
  tmpDir = new THREE.Vector3();
  update() {
    const dtMs = this.experience.time.delta * 1000;

    // カメラからマウスが指しているベクトル、つまりレイの方向を求める。
    const cam = this.camera.instance;
    this.tmpOrigin.setFromMatrixPosition(cam.matrixWorld);
    this.tmpDir.set(this.mouse.x, this.mouse.y, 0.5);
    this.tmpDir.unproject(cam).sub(this.tmpOrigin).normalize();

    //
    const dist =
      this.tmpOrigin.length() /
      Math.cos(Math.PI - this.tmpDir.angleTo(this.tmpOrigin));

    this.spiritSimulator.mouse3d
      .copy(this.tmpOrigin)
      .add(this.tmpDir.multiplyScalar(dist));

    this.spiritSimulator.update(dtMs);

    this.particleMesh.material.uniforms.texturePosition.value =
      this.spiritSimulator.positionTexture;
    this.particleMesh.material.uniforms.cameraMatrix.value.copy(
      cam.matrixWorld
    );
    this.particleMesh.material.uniforms.flipRatio.value ^= 1;
  }
}
