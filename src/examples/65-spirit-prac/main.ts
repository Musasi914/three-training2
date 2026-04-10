import Experience from "./experience/Experience";

const canvasWrapper = document.querySelector(
  "#canvasWrapper"
) as HTMLDivElement;
if (!canvasWrapper) {
  throw new Error("canvasWrapper element not found");
}

new Experience(canvasWrapper);
