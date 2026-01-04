import Experience from "./Experience";
import * as THREE from "three";
export default class Example {
  static TARGET_OFFSET = 0.01;
  static CAR_COUNT = 10;

  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  renderer: Experience["renderer"];

  cars: THREE.Mesh[] = [];
  curve!: THREE.CatmullRomCurve3;
  curveObject!: THREE.Line;
  currentPosition = new THREE.Vector3();
  targetPosition = new THREE.Vector3();

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.renderer = this.experience.renderer;

    this.createCurve();

    this.createCar();
  }

  private createCurve() {
    const controlPoints: [number, number, number][] = [
      [1.118281, 5.115846, -3.681386],
      [3.948875, 5.115846, -3.641834],
      [3.960072, 5.115846, -0.240352],
      [3.985447, 5.115846, 4.585005],
      [-3.793631, 5.115846, 4.585006],
      [-3.826839, 5.115846, -14.7362],
      [-14.542292, 5.115846, -14.765865],
      [-14.520929, 5.115846, -3.627002],
      [-5.452815, 5.115846, -3.634418],
      [-5.467251, 5.115846, 4.549161],
      [-13.266233, 5.115846, 4.567083],
      [-13.250067, 5.115846, -13.499271],
      [4.081842, 5.115846, -13.435463],
      [4.125436, 5.115846, -5.334928],
      [-14.521364, 5.115846, -5.239871],
      [-14.510466, 5.115846, 5.486727],
      [5.745666, 5.115846, 5.510492],
      [5.787942, 5.115846, -14.728308],
      [-5.42372, 5.115846, -14.761919],
      [-5.373599, 5.115846, -3.704133],
      [1.004861, 5.115846, -3.641834],
    ];

    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();

    // Flatten out all intermediate points for CatmullRomCurve3
    const points: THREE.Vector3[] = [];
    controlPoints.forEach((point, ndx) => {
      p0.set(...point);
      p1.set(...controlPoints[(ndx + 1) % controlPoints.length]);
      points.push(
        new THREE.Vector3().copy(p0),
        new THREE.Vector3().lerpVectors(p0, p1, 0.1),
        new THREE.Vector3().lerpVectors(p0, p1, 0.9)
      );
    });

    this.curve = new THREE.CatmullRomCurve3(points, true);
    const positions = this.curve.getPoints(500);

    const geometry = new THREE.BufferGeometry().setFromPoints(positions);
    const material = new THREE.LineBasicMaterial();
    this.curveObject = new THREE.Line(geometry, material);
    this.curveObject.position.y = -6;
    this.scene.add(this.curveObject);
  }

  private createCar() {
    const geometry = new THREE.BoxGeometry(1, 1, 3);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    for (let i = 0; i < Example.CAR_COUNT; i++) {
      const car = new THREE.Mesh(geometry, material);
      this.scene.add(car);
      this.cars.push(car);
    }
  }

  resize() {}

  update() {
    const time = this.experience.time.elapsed / 1000;

    this.cars.forEach((car, ndx) => {
      const u = time * Example.TARGET_OFFSET + ndx / Example.CAR_COUNT;
      this.curve.getPointAt(u % 1, this.currentPosition);
      this.currentPosition.applyMatrix4(this.curveObject.matrixWorld);

      this.curve.getPointAt(
        (u + Example.TARGET_OFFSET) % 1,
        this.targetPosition
      );
      this.targetPosition.applyMatrix4(this.curveObject.matrixWorld);

      car.position.copy(this.currentPosition);
      car.lookAt(this.targetPosition);
      car.position.lerpVectors(this.currentPosition, this.targetPosition, 0.5);
    });
  }
}
