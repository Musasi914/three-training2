import Pointer from "./modules/Pointer";
import Output from "./modules/Output";

export class Example {
  pointer: Pointer;
  output: Output;

  constructor() {
    this.pointer = new Pointer();
    this.output = new Output();
  }

  resize() {
    this.output.resize();
  }

  update() {
    this.pointer.update();
    this.output.update();
  }
}
