import * as THREE from "three";
import Example from "./Example";

export default class BirdGeometry extends THREE.BufferGeometry {
  constructor() {
    super();

    const trianglesPerBird = 3;
    const triangles = Example.BIRDS * trianglesPerBird;
    const points = triangles * 3;

    // verteces
    const vertices = new Float32Array(points * 3);

    let v = 0;
    const wingsSpan = 20;

    for (let i = 0; i < Example.BIRDS; i++) {
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
      vertices[v++] = -wingsSpan;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 15;
      // wings2
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 15;
      vertices[v++] = wingsSpan;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = 0;
      vertices[v++] = -15;
    }
    this.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    // colors
    const birdColors = new Float32Array(points * 3);
    const references = new Float32Array(points * 2);
    const birdVertex = new Float32Array(points * 3);

    for (let v = 0; v < triangles * 3; v++) {
      const triangleIndex = ~~(v / 3);
      const birdIndex = ~~(triangleIndex / trianglesPerBird);
      const x = (birdIndex % Example.WIDTH) / Example.WIDTH;
      const y = ~~(birdIndex / Example.WIDTH) / Example.WIDTH;

      const c = new THREE.Color(
        0x666666 + (~~(v / 9) / Example.BIRDS) * 0x666666
      );

      birdColors[v * 3 + 0] = c.r;
      birdColors[v * 3 + 1] = c.g;
      birdColors[v * 3 + 2] = c.b;

      references[v * 2] = x;
      references[v * 2 + 1] = y;

      birdVertex[v] = v % 9;
    }

    this.setAttribute("birdColor", new THREE.BufferAttribute(birdColors, 3));
    this.setAttribute("reference", new THREE.BufferAttribute(references, 2));
    this.setAttribute("birdVertex", new THREE.BufferAttribute(birdVertex, 1));

    this.scale(0.2, 0.2, 0.2);
  }
}
