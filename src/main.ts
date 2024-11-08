import { signal, effect } from '@preact/signals-core'
import Scene from "./scene.ts";

const canvas = document.querySelector("canvas")!;
const gl = canvas.getContext("webgl2");

const width = signal(canvas.offsetWidth)
const height = signal(canvas.offsetHeight)
const iconRadius = signal(15)
const dpr = signal(window.devicePixelRatio)

if (!gl) {
  throw "Webgl2 not supported";
}

Scene(gl, width, height, dpr, iconRadius)

function handleDPRChange() {
  dpr.value = window.devicePixelRatio

  const media = matchMedia(`(resolution: ${dpr.value}dppx)`);
  media.addEventListener("change", handleDPRChange, { once: true });
}
handleDPRChange();


const resizeObserver = new ResizeObserver((entries) => {
  width.value = entries[0].contentBoxSize[0].inlineSize;
  height.value = entries[0].contentBoxSize[0].blockSize;
});

resizeObserver.observe(canvas);

effect(() => {
  canvas.width = Math.round(width.value * dpr.value);
  canvas.height = Math.round(height.value * dpr.value);
})

