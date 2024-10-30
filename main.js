import { init } from './background';
import { mat4 } from 'gl-matrix';

const canvasEl = document.querySelector('canvas')
const gridSizeEl = document.querySelector('#grid-size')

const gl = canvasEl.getContext("webgl2");

let dpr = window.devicePixelRatio;
let canvasWidth, canvasHeight, gridSize;
const projection = mat4.create()

const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    if (entry.target === canvasEl) {
      let width, height;

      canvasWidth = entry.contentBoxSize[0].inlineSize;
      canvasHeight = entry.contentBoxSize[0].blockSize;

      if (entry.devicePixelContentBoxSize) {
        width = entry.devicePixelContentBoxSize[0].inlineSize;
        height = entry.devicePixelContentBoxSize[0].blockSize;

        if (canvasWidth > canvasHeight) {
          dpr = width / canvasWidth;
        } else {
          dpr = height / canvasHeight;
        }
      } else {
        width = Math.round(entry.contentBoxSize[0].inlineSize * window.devicePixelRatio)
        height = Math.round(entry.contentBoxSize[0].blockSize * window.devicePixelRatio)

        dpr = window.devicePixelRatio;
      }

      canvasEl.width = width;
      canvasEl.height = height;

      gl.viewport(0,0,width, height);
      mat4.ortho(
        projection,
        0,
        width,
        height,
        0,
        -1000,
        1000,
      );

    }

    if (entry.target === gridSizeEl) {
      gridSize = entry.contentBoxSize[0].inlineSize;
    }
  }
})

resizeObserver.observe(canvasEl)
resizeObserver.observe(gridSizeEl)

const render = init(gl)
function animate(time) {
  render(time, projection, dpr)
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)


