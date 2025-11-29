import Experience from "./experience/Experience";

// 一度だけ実行されるようにする
if (
  typeof window !== "undefined" &&
  !(window as any).__01_ANIMATION_INITIALIZED__
) {
  (window as any).__01_ANIMATION_INITIALIZED__ = true;

  const canvasWrapper = document.querySelector(
    "#canvasWrapper"
  ) as HTMLDivElement;

  if (!canvasWrapper) {
    throw new Error("canvasWrapper element not found");
  }

  new Experience(canvasWrapper);
}
