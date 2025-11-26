import EventEmitter from "./EventEmitter";

export class Time extends EventEmitter {
  start: number;
  current: number;
  elapsed: number;
  delta: number;

  constructor() {
    super();

    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16 / 1000;

    this.tick();
  }

  private tick() {
    window.requestAnimationFrame(this.tick.bind(this));

    const currentTime = Date.now();
    this.delta = (currentTime - this.current) / 1000;
    this.current = currentTime;
    this.elapsed = this.current - this.start;

    this.trigger("tick");
  }
}
