const el = document.querySelector('canvas')
const onResizeCallbacks = []

let dpr = 0;
let width = 0;
let height = 0;

export const gl = el.getContext("webgl2")


function handleResolutionChange() {
  if (width === 0 || height === 0 || dpr === 0) {
    return
  }

  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)

  gl.viewport(0, 0, width, height)

  for (const cb of onResizeCallbacks) {
    cb(width, height, dpr)
  }
}


function handleDPRChange() {
  dpr = window.devicePixelRatio;

  const media = matchMedia(`(resolution: ${dpr}dppx)`)
  media.addEventListener('change', handleDPRChange, { once: true })

  handleResolutionChange()
}

handleDPRChange()


const resizeObserver = new ResizeObserver(entries => {
  width = entries[0].contentBoxSize[0].inlineSize;
  height = entries[0].contentBoxSize[0].blockSize;

  handleResolutionChange()
})

resizeObserver.observe(el)


export default {
  get width() {
    return width
  },
  get height() {
    return height
  },
  get dpr() {
    return dpr
  },
  onResolutionChange(cb) {
    onResizeCallbacks.push(cb)
  }
}
