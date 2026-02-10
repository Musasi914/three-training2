import * as THREE from "three";
import Experience from "./Experience";

export default class People {
  static bodyRadiusTop = 0.4;
  static bodyRadiusBottom = 0.2;
  static bodyHeight = 2;
  static bodyRadialSegments = 6;

  static headRadius = People.bodyRadiusTop * 0.8;
  static headLonSegments = 12;
  static headLatSegments = 5;

  experience: Experience;
  scene: Experience["scene"];

  canvasTexture!: THREE.CanvasTexture;

  bodyGeometry!: THREE.CylinderGeometry;
  headGeometry!: THREE.SphereGeometry;
  labelGeometry!: THREE.PlaneGeometry;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;

    this.bodyGeometry = new THREE.CylinderGeometry(
      People.bodyRadiusTop,
      People.bodyRadiusBottom,
      People.bodyHeight,
      People.bodyRadialSegments
    );
    this.headGeometry = new THREE.SphereGeometry(
      People.headRadius,
      People.headLonSegments,
      People.headLatSegments
    );
    this.labelGeometry = new THREE.PlaneGeometry(1, 1);

    this.makePerson(-3, 150, 32, "Purple People Eater", "purple");
    this.makePerson(3, 150, 32, "Green Machine", "green");
    this.makePerson(6, 150, 32, "Red Menace", "red");
  }

  private makePerson(
    x: number,
    labelWidth: number,
    size: number,
    name: string,
    color: string
  ) {
    const canvas = this.makeLabelCanvas(labelWidth, size, name);
    this.canvasTexture = new THREE.CanvasTexture(canvas);

    this.canvasTexture.minFilter = THREE.LinearFilter;

    const bodyMaterial = new THREE.MeshPhongMaterial({
      color,
      flatShading: true,
    });

    const root = new THREE.Object3D();
    root.position.x = x;

    const body = new THREE.Mesh(this.bodyGeometry, bodyMaterial);
    root.add(body);
    body.position.y = People.bodyHeight / 2;

    const head = new THREE.Mesh(this.headGeometry, bodyMaterial);
    root.add(head);
    head.position.y = People.bodyHeight + People.headRadius;

    const labelMaterial = new THREE.SpriteMaterial({
      map: this.canvasTexture,
      transparent: true,
    });

    const label = new THREE.Sprite(labelMaterial);
    root.add(label);
    label.position.y = People.bodyHeight + People.headRadius * 3;

    const labelBaseScale = 0.01;
    label.scale.x = this.canvasTexture.width * labelBaseScale;
    label.scale.y = canvas.height * labelBaseScale;

    this.scene.add(root);
    return root;
  }
  private makeLabelCanvas(baseWidth: number, size: number, name: string) {
    const borderSize = 2;
    const ctx = document
      .createElement("canvas")
      .getContext("2d") as CanvasRenderingContext2D;
    const font = `${size}px bold sans-serif`;
    ctx.font = font;
    // measure how long the name will be
    const doubleBorderSize = borderSize * 2;
    const textWidth = ctx.measureText(name).width;
    const width = baseWidth + doubleBorderSize;
    const height = size + doubleBorderSize;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // need to set font again after resizing canvas
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const scaleFactor = Math.min(1, baseWidth / textWidth);

    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.scale(scaleFactor, 1);
    ctx.fillStyle = "white";
    ctx.fillText(name, borderSize, borderSize);

    return ctx.canvas;
  }
}
