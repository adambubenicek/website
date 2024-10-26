const gridWidth = 48
const gridHeight = 32


const grid = new Uint8Array(gridWidth * gridHeight)

const originBoxX = 12
const originBoxY = 8
const originBoxWidth = 4
const originBoxHeight = 3

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

for (let i = 1; i < originBoxWidth - 1; i++) {
  grow(originBoxX, originBoxY, direction.right, values.from)
  grow(originBoxX, originBoxY, direction.left, values.to)
  grow(originBoxX, originBoxY + originBoxHeight, direction.right, values.to)
  grow(originBoxX, originBoxY + originBoxHeight, direction.left, values.from)
}

for (let i = 1; i < originBoxHeight - 1; i++) {
  grow(originBoxX, originBoxY, direction.down, values.from)
  grow(originBoxX, originBoxY, direction.up, values.to)
  grow(originBoxX + originBoxWidth, originBoxY + originBoxHeight, direction.down, values.to)
  grow(originBoxX + originBoxWidth, originBoxY + originBoxHeight, direction.up, values.from)
}

