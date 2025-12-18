import Experience from "./Experience";
import * as THREE from "three";
import vertexShader from "./glsl/vert.vert";
import fragmentShader from "./glsl/frag.frag";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];

  planeGeometry!: THREE.PlaneGeometry;
  material!: THREE.ShaderMaterial;
  plane!: THREE.Points;

  canvas2D!: HTMLCanvasElement;
  context!: CanvasRenderingContext2D;
  canvasParams = {
    width: 256,
    height: 256,
  };
  canvasCursor = {
    x: 999,
    y: 999,
  };

  mouse = {
    x: 999,
    y: 999,
  };
  raycaster!: THREE.Raycaster;
  raycasterPlane!: THREE.Mesh;

  canvasTexture!: THREE.CanvasTexture;

  previousCanvasCursor = {
    x: 999,
    y: 999,
  };

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.createCanvas2D();
    this.createPlane();

    this.experience.canvasWrapper.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this)
    );

    this.setRaycaster();
  }

  private createPlane() {
    const texture = this.resource.items.a as THREE.Texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    this.planeGeometry = new THREE.PlaneGeometry(3, 3, 64, 64);
    this.planeGeometry.setIndex(null);
    this.planeGeometry.deleteAttribute("normal");
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uResolution: {
          value: new THREE.Vector2(
            this.experience.config.width,
            this.experience.config.height
          ),
        },
        uCanvasTexture: { value: this.canvasTexture },
      },
    });
    this.plane = new THREE.Points(this.planeGeometry, this.material);

    this.plane.updateMatrixWorld();

    const aRandomArray = new Float32Array(
      this.planeGeometry.attributes.position.count
    );
    const aRandomArc = new Float32Array(
      this.planeGeometry.attributes.position.count
    );
    for (let i = 0; i < aRandomArray.length; i++) {
      aRandomArray[i] = Math.random();
      aRandomArc[i] = Math.random() * Math.PI * 2;
    }
    this.planeGeometry.attributes.aRandom = new THREE.BufferAttribute(
      aRandomArray,
      1
    );
    this.planeGeometry.attributes.aRandomArc = new THREE.BufferAttribute(
      aRandomArc,
      1
    );
    this.scene.add(this.plane);
  }

  private createCanvas2D() {
    this.canvas2D = document.createElement("canvas");
    this.canvas2D.width = this.canvasParams.width;
    this.canvas2D.height = this.canvasParams.height;
    this.canvas2D.style.position = "absolute";
    this.canvas2D.style.bottom = "0";
    this.canvas2D.style.left = "0";
    this.canvas2D.style.zIndex = "1000";
    document.body.appendChild(this.canvas2D);

    this.context = this.canvas2D.getContext("2d") as CanvasRenderingContext2D;
    this.context.fillStyle = "black";
    this.context.fillRect(
      0,
      0,
      this.canvasParams.width,
      this.canvasParams.height
    );

    this.canvasTexture = new THREE.CanvasTexture(this.canvas2D);
  }

  private onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / this.experience.config.width) * 2 - 1;
    this.mouse.y = (-event.clientY / this.experience.config.height) * 2 + 1;
  }

  private setRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.raycasterPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial()
    );
    this.scene.add(this.raycasterPlane);
    this.raycasterPlane.visible = false;
  }

  resize() {
    this.material?.uniforms.uResolution.value.set(
      this.experience.config.width,
      this.experience.config.height
    );
  }

  update() {
    this.canvasTexture.needsUpdate = true;

    this.raycast();

    this.drawBackground();
    this.drawCursor();

    this.previousCanvasCursor.x = this.canvasCursor.x;
    this.previousCanvasCursor.y = this.canvasCursor.y;
  }

  private raycast() {
    this.raycaster.setFromCamera(
      new THREE.Vector2(this.mouse.x, this.mouse.y),
      this.experience.camera.instance
    );
    const intersects = this.raycaster.intersectObject(this.raycasterPlane);
    if (intersects.length > 0 && intersects[0].uv) {
      this.canvasCursor.x = intersects[0].uv.x;
      this.canvasCursor.y = 1 - intersects[0].uv.y;
    }
  }

  private drawBackground() {
    this.context.fillStyle = "black";
    this.context.globalCompositeOperation = "source-over";
    this.context.globalAlpha = 0.02;
    this.context.fillRect(
      0,
      0,
      this.canvasParams.width,
      this.canvasParams.height
    );
  }
  private drawCursor() {
    // 前回の位置と現在の位置が異なる場合のみカーソルを描画
    const hasMoved =
      Math.abs(this.canvasCursor.x - this.previousCanvasCursor.x) > 0.001 ||
      Math.abs(this.canvasCursor.y - this.previousCanvasCursor.y) > 0.001;

    if (!hasMoved) {
      return;
    }

    this.context.beginPath();
    this.context.fillStyle = "white";
    this.context.globalAlpha = 1;
    this.context.arc(
      this.canvasCursor.x * this.canvasParams.width,
      this.canvasCursor.y * this.canvasParams.height,
      20,
      0,
      2 * Math.PI
    );
    this.context.fill();
    this.context.closePath();
  }
}
