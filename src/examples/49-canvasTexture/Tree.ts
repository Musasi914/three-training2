import Experience from "./experience/Experience";
import * as THREE from "three";

// 画像をレンダーターゲットに描画し、そのテクスチャをスプライトとして配置するのがミソ

export default class Tree {
  static trunkRadius = 0.2;
  static trunkHeight = 1;
  static trunkRadialSegments = 12;

  static topRadius = Tree.trunkRadius * 4;
  static topHeight = Tree.trunkHeight * 2;
  static topSegments = 12;

  experience: Experience;
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;

  trunkGeometry!: THREE.CylinderGeometry;
  topGeometry!: THREE.CylinderGeometry;

  trunkMaterial!: THREE.MeshPhongMaterial;
  topMaterial!: THREE.MeshPhongMaterial;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;

    this.trunkGeometry = new THREE.CylinderGeometry(
      Tree.trunkRadius,
      Tree.trunkRadius,
      Tree.trunkHeight,
      Tree.trunkRadialSegments
    );
    this.trunkMaterial = new THREE.MeshPhongMaterial({
      color: "brown",
    });

    this.topGeometry = new THREE.ConeGeometry(
      Tree.topRadius,
      Tree.topHeight,
      Tree.topSegments
    );
    this.topMaterial = new THREE.MeshPhongMaterial({
      color: "green",
    });

    const tree = this.makeTree(0, 0);
    const treeSpriteInfo = this.makeSpriteTexture(64, tree);
    for (let z = -50; z <= 50; z += 10) {
      for (let x = -50; x <= 50; x += 10) {
        this.makeSprite(treeSpriteInfo, x, z);
      }
    }
  }

  private makeTree(x: number, z: number) {
    const root = new THREE.Object3D();
    const trunk = new THREE.Mesh(this.trunkGeometry, this.trunkMaterial);
    trunk.position.y = Tree.trunkHeight / 2;
    root.add(trunk);

    const top = new THREE.Mesh(this.topGeometry, this.topMaterial);
    top.position.y = Tree.trunkHeight + Tree.topHeight / 2;
    root.add(top);

    root.position.set(x, 0, z);
    this.scene.add(root);

    return root;
  }

  private makeSpriteTexture(textureSize: number, obj: THREE.Object3D) {
    const rt = new THREE.WebGLRenderTarget(textureSize, textureSize);
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.scene.add(obj);

    const box = new THREE.Box3().setFromObject(obj);
    const boxSize = box.getSize(new THREE.Vector3());
    const boxCenter = box.getCenter(new THREE.Vector3());

    const fudge = 1.1;
    const size = Math.max(...boxSize) * fudge;
    this.frameArea(size, size, boxCenter, camera);

    this.renderer.autoClear = false;
    this.renderer.setRenderTarget(rt);
    this.renderer.render(this.scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.autoClear = true;

    this.scene.remove(obj);

    return {
      position: boxCenter.multiplyScalar(fudge),
      scale: size,
      texture: rt.texture,
    };
  }

  private frameArea(
    sizeToFitOnScreen: number,
    boxSize: number,
    boxCenter: THREE.Vector3,
    camera: THREE.PerspectiveCamera
  ) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen / 2;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

    camera.position.copy(boxCenter);
    camera.position.z += distance;

    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();
  }

  private makeSprite(
    spriteInfo: {
      position: THREE.Vector3;
      scale: number;
      texture: THREE.Texture;
    },
    x: number,
    z: number
  ) {
    const { texture, position, scale } = spriteInfo;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(mat);
    this.scene.add(sprite);

    sprite.position.set(position.x + x, position.y, position.z + z);
    sprite.scale.set(scale, scale, scale);
  }
}
