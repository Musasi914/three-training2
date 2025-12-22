export default class Scroll {
  targetScrollY: number;
  currentScrollY: number;
  scrollDiff: number;
  constructor() {
    this.targetScrollY = 0;
    this.currentScrollY = 0;
    this.scrollDiff = 0;
  }

  private lerp(start: number, end: number, ease: number) {
    start += (end - start) * ease;
    return start;
  }

  update() {
    this.targetScrollY = window.scrollY;

    this.currentScrollY = this.lerp(
      this.currentScrollY,
      this.targetScrollY,
      0.2
    );

    this.scrollDiff = this.targetScrollY - this.currentScrollY;
  }
}
