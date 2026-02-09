import Experience from "./experience/Experience";

// HMRなどで多重初期化されるのを防ぐ
const GLOBAL_KEY = "__53_BABBLE_INITIALIZED__" as const;

if (typeof window !== "undefined" && !(window as any)[GLOBAL_KEY]) {
  (window as any)[GLOBAL_KEY] = true;

  const canvasWrapper = document.querySelector(
    "#canvasWrapper"
  ) as HTMLDivElement | null;

  if (!canvasWrapper) {
    throw new Error("canvasWrapper element not found");
  }

  new Experience(canvasWrapper);
}

