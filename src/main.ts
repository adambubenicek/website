import { signal, effect, batch } from '@preact/signals-core'
import Scene from "./scene.ts";

const canvasElement = document.querySelector("canvas")!;
const gridSizeElement = document.querySelector("#grid-size")!;
const iconSizeElement = document.querySelector("#icon-size")!;

const gl = canvasElement.getContext("webgl2");

const width = signal(0)
const height = signal(0)
const iconSize = signal(0)
const gridSize = signal(0)
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
  for (const entry of entries) {
    if (entry.target === canvasElement) {
      batch(() => {
        width.value = entry.contentBoxSize[0].inlineSize;
        height.value = entry.contentBoxSize[0].blockSize;
      })
    } else if (entry.target === gridSizeElement) {
      gridSize.value = entry.contentBoxSize[0].inlineSize;
    } else if (entry.target === iconSizeElement) {
      iconSize.value = entry.contentBoxSize[0].inlineSize;
    }
  }
});

resizeObserver.observe(canvasElement);
resizeObserver.observe(gridSizeElement);
resizeObserver.observe(iconSizeElement);

effect(() => {
  canvasElement.width = Math.round(width.value * dpr.value);
  canvasElement.height = Math.round(height.value * dpr.value);
})

Scene(gl, width, height, dpr, gridSize, iconSize)
