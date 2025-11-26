import EventEmitter from "./EventEmitter";

export class Size extends EventEmitter {
  currentWidth: number;

  constructor() {
    super();

    this.currentWidth = window.innerWidth;

    window.addEventListener("resize", () => {
      if (window.innerWidth < 768 && this.currentWidth === window.innerWidth)
        return;

      this.trigger("resize");

      this.currentWidth = window.innerWidth;
    });
  }
}
