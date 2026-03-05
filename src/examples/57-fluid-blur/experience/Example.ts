import Pointer from "./modules/Pointer";
import Output from "./modules/Output";

export default class Example {
  private pointer: Pointer;
  private output: Output;

  constructor() {
    this.pointer = new Pointer();
    this.output = new Output(this.pointer);
  }

  resize() {}

  update() {
    this.pointer.update();
    this.output.update();
  }
}
