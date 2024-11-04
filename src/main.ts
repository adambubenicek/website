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
  width = entries[0].contentBoxSize[0].inlineSize;
  height = entries[0].contentBoxSize[0].blockSize;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  if (dpr > 0) {
    Scene.resize(scene, width, height, dpr);
    console.log(scene)
  }
});

resizeObserver.observe(canvas);

function animate(time: DOMHighResTimeStamp) {
  Scene.render(scene, time);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
