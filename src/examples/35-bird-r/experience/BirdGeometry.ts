import * as THREE from "three";
import Example from "./Example";
export default class BirdGeometry extends THREE.BufferGeometry {
  constructor() {
    super();

    const trianglesPerBird = 3;
    const pointsPerBird = trianglesPerBird * 3;
    const allPoints = Example.BIRD_COUNT * pointsPerBird;

    const vertices = new Float32Array(allPoints * 3);

    let v = 0;
    for (let i = 0; i < Example.BIRD_COUNT; i++) {
      // body
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = -20;
      vertices[v++] = 0;
      vertices[v++] = 8;
      vertices[v++] = -20;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 30;

      // wings1
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = -15;
      vertices[v++] = -20;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 15;

      // wings2
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 15;
      vertices[v++] = 20;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = -15;
    }
    // bufferGeometryにuvがないから attribute referenceが必要
    this.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const references = new Float32Array(allPoints * 2);
    const pointInBird = new Float32Array(allPoints);
    for (let i = 0; i < allPoints; i++) {
      const birdIndex = ~~(i / pointsPerBird);
      pointInBird[i] = i % pointsPerBird;
      const x = ((birdIndex % Example.WIDTH) + 0.5) / Example.WIDTH;
      const y = (~~(birdIndex / Example.WIDTH) + 0.5) / Example.WIDTH;
      references[i * 2 + 0] = x;
      references[i * 2 + 1] = y;
    }
    this.setAttribute("pointInBird", new THREE.BufferAttribute(pointInBird, 1));
    this.setAttribute("reference", new THREE.BufferAttribute(references, 2));
  }
}
