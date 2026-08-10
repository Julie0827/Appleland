let ctx = null
let w = 0
let h = 0
let dpr = 1

let x = 0
let y = 0
let r = 0

let current = 0
let target = 0

let bootstrapComplete = false

const PI = Math.PI
const TAU = PI * 2
const START_ANGLE = -PI / 2

const SMOOTHING = 0.15
const SNAP_THRESHOLD = 0.98

const CANVAS_PADDING = 10

const BAR_WIDTH = 8
const BAR_TRACK_COLOR = '#e0eadd'
const BAR_FILL_COLOR = '#7fb069'
const TEXT_COLOR = '#4a6741'

const FONT = '24px monospace'

self.onmessage = (e) => {
  const { type } = e.data

  switch (type) {
    case 'INIT':
      init(e.data)
      break

    case 'PROGRESS':
      target = Math.min(Math.max(e.data.value, 0), 1)
      break

    case 'BOOTSTRAP_COMPLETE':
      bootstrapComplete = true
      target = 1
      break
  }
}

function resize() {
  ctx.canvas.width = Math.floor(w * dpr)
  ctx.canvas.height = Math.floor(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawArc(color, startAngle, endAngle) {
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, startAngle, endAngle)
  ctx.stroke()
}

function draw(showPercentage = true) {
  ctx.clearRect(0, 0, w, h)

  const endAngle = START_ANGLE + TAU * current

  drawArc(BAR_TRACK_COLOR, 0, TAU)
  drawArc(BAR_FILL_COLOR, START_ANGLE, endAngle)

  if (!showPercentage) return

  ctx.fillStyle = TEXT_COLOR
  ctx.fillText(`${Math.round(current * 100)}%`, x, y)
}

function loop() {
  current += (target - current) * SMOOTHING

  if (bootstrapComplete && current > SNAP_THRESHOLD) current = 1

  draw()

  if (current === 1) {
    requestAnimationFrame(() => {
      draw(false)
      self.postMessage({ type: 'LOADER_COMPLETE' })
    })

    return
  }

  requestAnimationFrame(loop)
}

function init(data) {
  ;({ w, h, dpr } = data)

  x = w / 2
  y = h / 2
  r = Math.min(w, h) / 2 - CANVAS_PADDING

  ctx = data.canvas.getContext('2d')

  resize()

  ctx.lineWidth = BAR_WIDTH
  ctx.lineCap = 'round'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  self.postMessage({ type: 'READY' })

  loop()
}
