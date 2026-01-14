import Experience from "./experience/Experience";

const canvasContainer = document.querySelector(
  "#canvasContainer"
) as HTMLDivElement;
if (!canvasContainer) {
  throw new Error("canvasContainer element not found");
}

new Experience(canvasContainer);
