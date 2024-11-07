import Scene from "./scene.ts";

const canvas = document.querySelector("canvas")!;

const gl = canvas.getContext("webgl2");

if (!gl) {
  throw "Webgl2 not supported";
}

const scene = Scene(gl)


let dpr = 0
function handleDPRChange() {
  dpr = window.devicePixelRatio;

  scene.setDPR(dpr)

  const media = matchMedia(`(resolution: ${dpr}dppx)`);
  media.addEventListener("change", handleDPRChange, { once: true });
}

handleDPRChange();


const resizeObserver = new ResizeObserver((entries) => {
  const width = entries[0].contentBoxSize[0].inlineSize;
  const height = entries[0].contentBoxSize[0].blockSize;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  scene.setResolution(width, height)
});

scene.setIconSize(30)

resizeObserver.observe(canvas);
