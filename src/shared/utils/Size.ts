import EventEmitter from "./EventEmitter";

export class Size extends EventEmitter {
  constructor() {
    super();

    window.addEventListener("resize", () => {
      this.trigger("resize");
    });
  }
}
