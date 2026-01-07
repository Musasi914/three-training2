function main() {
  const canvas = document.querySelector("#c") as HTMLCanvasElement;
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker("offscreencanvas-cubes.js", { type: "module" });
  worker.postMessage({ type: "main", canvas: offscreen }, [offscreen]);

  function sendSize() {
    worker.postMessage({
      type: "size",
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  }
  window.addEventListener("resize", sendSize);
  sendSize();
}

main();
