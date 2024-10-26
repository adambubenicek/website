const gridWidth = 8
const gridHeight = 8
const gridSize = 60


// Single dimensional array representing the entire grid.
// Each item is a single byte.
//
// 00000000
// | | | |- left 
// | | |- bottom 
// | |- top 
// |- right 
//
// 00 - empty
// 01 - to this direction
// 10 - from this direction
const grid = new Uint8Array(gridWidth * gridHeight)

const originBoxX = 2
const originBoxY = 2
const originBoxWidth = 4
const originBoxHeight = 4

const direction = {
  up: 6,
  right: 4,
  down: 2,
  left: 0
}

const values = {
  empty: 0,
  to: 1,
  from: 2
}

function printByte(val) {
  return val.toString(2).padStart(8, '0')
}

function grow(x, y, direction, value) {
  const loc = y * gridWidth + x
  const val = grid[loc]

  const mask = 3 << direction

  grid[loc] = val & (~mask) | value << direction
}

grow(originBoxX, originBoxY, direction.down, values.from)
grow(originBoxX, originBoxY, direction.right, values.to)

grow(originBoxX + originBoxWidth, originBoxY, direction.left, values.from)
grow(originBoxX + originBoxWidth, originBoxY, direction.down, values.to)

grow(originBoxX + originBoxWidth, originBoxY + originBoxHeight, direction.up, values.from)
grow(originBoxX + originBoxWidth, originBoxY + originBoxHeight, direction.left, values.to)

grow(originBoxX, originBoxY + originBoxHeight, direction.right, values.from)
grow(originBoxX, originBoxY + originBoxHeight, direction.up, values.to)

for (let i = 1; i < originBoxWidth; i++) {
  grow(originBoxX + i, originBoxY, direction.right, values.from)
  grow(originBoxX + i, originBoxY, direction.left, values.to)
  grow(originBoxX + i, originBoxY + originBoxHeight, direction.right, values.to)
  grow(originBoxX + i, originBoxY + originBoxHeight, direction.left, values.from)
}

for (let i = 1; i < originBoxHeight; i++) {
  grow(originBoxX, originBoxY + i, direction.down, values.from)
  grow(originBoxX, originBoxY + i, direction.up, values.to)
  grow(originBoxX + originBoxWidth, originBoxY + i, direction.down, values.to)
  grow(originBoxX + originBoxWidth, originBoxY + i, direction.up, values.from)
}

for (let loc in grid) {
  const y = Math.floor(loc / gridWidth)
  const x = loc - y * gridWidth;
  const val = grid[loc]

  if ((val >> 6) > 0) {
    const el = document.createElement("div")
    el.style.position = "absolute"
    el.style.top = `${(y * gridSize) - gridSize / 2}px`
    el.style.left = `${(x * gridSize)}px`
    el.style.width = `2px`
    el.style.height = `${gridSize / 2}px`
    el.style.background = 'red'
    document.body.appendChild(el)
  }

  if ((val >> 4 & 3) > 0) {
    const el = document.createElement("div")
    el.style.position = "absolute"
    el.style.top = `${(y * gridSize)}px`
    el.style.left = `${(x * gridSize)}px`
    el.style.height = `2px`
    el.style.width = `${gridSize / 2}px`
    el.style.background = 'red'
    document.body.appendChild(el)
  }

  if ((val >> 2 & 3) > 0) {
    const el = document.createElement("div")
    el.style.position = "absolute"
    el.style.top = `${(y * gridSize)}px`
    el.style.left = `${(x * gridSize)}px`
    el.style.width = `2px`
    el.style.height = `${gridSize / 2}px`
    el.style.background = 'red'
    document.body.appendChild(el)
  }

  if ((val & 3) > 0) {
    const el = document.createElement("div")
    el.style.position = "absolute"
    el.style.top = `${(y * gridSize)}px`
    el.style.left = `${(x * gridSize) - gridSize / 2}px`
    el.style.height = `2px`
    el.style.width = `${gridSize / 2}px`
    el.style.background = 'red'
    document.body.appendChild(el)
  }
}
