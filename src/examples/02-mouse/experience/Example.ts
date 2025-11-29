import Mouse from "./modules/Mouse";
import Output from "./modules/Output";

export class Example {
  mouse: Mouse;
  output: Output;

  constructor() {
    this.mouse = new Mouse();

    this.output = new Output();
  }

  update() {
    this.mouse.update();
    this.output.update();
  }
}
