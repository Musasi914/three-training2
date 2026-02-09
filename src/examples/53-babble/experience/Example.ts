import Output from "./modules/Output";
import Pointer from "./modules/Pointer";

export class Example {
  private pointer: Pointer;
  private output: Output;

  constructor() {
    this.pointer = new Pointer();
    this.output = new Output(this.pointer);
  }

  resize() {
    this.output.resize();
  }

  update() {
    this.pointer.update();
    this.output.update();
  }
}

