import * as Scene from "./scene";

const canvas = document.querySelector("canvas")!;

const gl = canvas.getContext("webgl2");

if (!gl) {
  throw "Webgl2 not supported";
}

const scene = Scene.create(gl);

let dpr = 0;
let width = 0;
let height = 0;

function handleDPRChange() {
  dpr = window.devicePixelRatio;

  if (width > 0 && height > 0) {
    Scene.resize(scene, width, height, dpr);
  }

  const media = matchMedia(`(resolution: ${dpr}dppx)`);
  media.addEventListener("change", handleDPRChange, { once: true });
}

handleDPRChange();

const resizeObserver = new ResizeObserver((entries) => {
  width = Math.round(entries[0].contentBoxSize[0].inlineSize * dpr);
  height = Math.round(entries[0].contentBoxSize[0].blockSize * dpr);

  canvas.width = width;
  canvas.height = height;

  if (dpr > 0) {
    Scene.resize(scene, width, height, dpr);
  }
});

resizeObserver.observe(canvas);

function animate(time: DOMHighResTimeStamp) {
  Scene.render(scene, time);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
