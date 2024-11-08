import { signal, effect, batch } from '@preact/signals-core'
import Scene from "./scene.ts";

const canvas = document.querySelector("canvas")!;
const gl = canvas.getContext("webgl2");

const width = signal(0)
const height = signal(0)
const iconRadius = signal(15)
const dpr = signal(0)

if (!gl) {
  throw "Webgl2 not supported";
}

function handleDPRChange() {
  dpr.value = window.devicePixelRatio

  const media = matchMedia(`(resolution: ${dpr.value}dppx)`);
  media.addEventListener("change", handleDPRChange, { once: true });
}
handleDPRChange();


const resizeObserver = new ResizeObserver((entries) => {
  batch(() => {
    width.value = entries[0].contentBoxSize[0].inlineSize;
    height.value = entries[0].contentBoxSize[0].blockSize;
  })
});

resizeObserver.observe(canvas);

effect(() => {
  canvas.width = Math.round(width.value * dpr.value);
  canvas.height = Math.round(height.value * dpr.value);
})

Scene(gl, width, height, dpr, iconRadius)
