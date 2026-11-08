<script setup lang="ts">
import type { AlphabetLetter } from '~/types/learning'
import { LETTER_STROKES, STROKE_BOX } from '~/data/letter-strokes'

/**
 * A dotted capital letter the child traces with a finger.
 *
 * - The finger leaves a crayon line wherever it goes. Off-path scribbles are never "wrong";
 *   they just don't move the letter forward.
 * - Each stroke has checkpoints every few units along its path. The finger advances through them
 *   in order, with a wide tolerance, and the stroke fills in solid behind it.
 * - Lifting the finger keeps progress, so a toddler can stop and carry on.
 * - A glowing dot shows how to write the letter when it appears, when asked ("Show me"), and
 *   again for the current stroke if nothing has happened for a while.
 */
const props = defineProps<{ letter: AlphabetLetter }>()
const emit = defineEmits<{ stroke: [], complete: [] }>()

/** How close (in letter units; the letter is 96 tall) the finger must pass a checkpoint. */
const TOLERANCE = 13
/** Distance between checkpoints along a stroke. */
const STEP = 3
/** How many checkpoints ahead a single movement may jump, so fast fingers aren't punished. */
const LOOKAHEAD = 6
/** Show the current stroke again after this long without progress. */
const IDLE_MS = 7000
const DEMO_SPEED = 70 // units per second

const strokes = computed(() => LETTER_STROKES[props.letter.id] ?? [])
const theme = computed(() => themeOf(props.letter.theme))

const svg = ref<SVGSVGElement | null>(null)
/** The guide path elements, by stroke index; used to measure and sample each stroke. */
const guides: SVGPathElement[] = []

interface Checkpoint { x: number, y: number, at: number }
const checkpoints = shallowRef<Checkpoint[][]>([])
const lengths = ref<number[]>([])

const current = ref(0) // index of the stroke being traced
let next = 0 // next checkpoint on the current stroke
const filled = ref<number[]>([])
const complete = ref(false)
const crayon = ref<string[]>([]) // one polyline per finger-down, as "x,y x,y …"
const startNudge = ref(0)

const demo = reactive({ active: false, stroke: 0, length: 0, x: 0, y: 0 })
let demoToken = 0
let idleTimer: ReturnType<typeof setTimeout> | undefined

function measure() {
  checkpoints.value = guides.map((path) => {
    const total = path.getTotalLength()
    const points: Checkpoint[] = []
    for (let at = 0; at < total; at += STEP) {
      const p = path.getPointAtLength(at)
      points.push({ x: p.x, y: p.y, at })
    }
    const end = path.getPointAtLength(total)
    points.push({ x: end.x, y: end.y, at: total })
    return points
  })
  lengths.value = guides.map(p => p.getTotalLength())
}

function reset() {
  current.value = 0
  next = 0
  filled.value = strokes.value.map(() => 0)
  complete.value = false
  crayon.value = []
}

/** Where the start dot and arrow for the current stroke go; hidden once the stroke is under way. */
const start = computed(() => {
  const points = checkpoints.value[current.value]
  if (!points || complete.value || (filled.value[current.value] ?? 0) > 0) return null
  const a = points[0]!
  const b = points[Math.min(3, points.length - 1)]!
  return { x: a.x, y: a.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
})

// ---- tracing ----------------------------------------------------------------------------

function toLetterSpace(e: PointerEvent) {
  const matrix = svg.value?.getScreenCTM()
  if (!matrix) return null
  const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
  return { x: point.x, y: point.y }
}

function advance(x: number, y: number) {
  const points = checkpoints.value[current.value]
  if (!points || complete.value) return
  let reached = -1
  for (let i = next; i < Math.min(next + LOOKAHEAD, points.length); i++) {
    const p = points[i]!
    if (Math.hypot(p.x - x, p.y - y) <= TOLERANCE) reached = i
  }
  if (reached < 0) return
  next = reached + 1
  filled.value[current.value] = points[reached]!.at
  restartIdle()

  if (next >= points.length - 1) {
    filled.value[current.value] = lengths.value[current.value]!
    current.value++
    next = 0
    if (current.value >= strokes.value.length) {
      complete.value = true
      clearTimeout(idleTimer)
      emit('complete')
    }
    else {
      emit('stroke')
    }
  }
}

let last: { x: number, y: number } | null = null
let drawing = false

function onDown(e: PointerEvent) {
  if (complete.value) return
  stopDemo()
  const p = toLetterSpace(e)
  if (!p) return
  svg.value?.setPointerCapture(e.pointerId)
  drawing = true
  last = p
  crayon.value.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  // Starting far from the right place: pulse the start dot to show where to begin.
  const s = start.value
  if (s && next === 0 && Math.hypot(s.x - p.x, s.y - p.y) > TOLERANCE * 1.5) startNudge.value++
  advance(p.x, p.y)
}

function onMove(e: PointerEvent) {
  if (!drawing || !last || complete.value) return
  const p = toLetterSpace(e)
  if (!p) return
  // Check points in between too, so a quick swipe along the line still counts.
  const distance = Math.hypot(p.x - last.x, p.y - last.y)
  const steps = Math.max(1, Math.ceil(distance / 2))
  for (let i = 1; i <= steps; i++) advance(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps)
  if (distance > 0.8) {
    crayon.value[crayon.value.length - 1] += ` ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    last = p
  }
}

function onUp() {
  drawing = false
  last = null
}

// ---- show me ----------------------------------------------------------------------------

function stopDemo() {
  demoToken++
  demo.active = false
}

/** Animate a glowing dot along the strokes, from `from` to the end (or just one stroke). */
async function showMe(from = 0, only = false) {
  const token = ++demoToken
  await nextTick()
  const until = only ? from + 1 : strokes.value.length
  for (let s = from; s < until; s++) {
    const path = guides[s]
    if (!path) return
    const total = path.getTotalLength()
    demo.active = true
    demo.stroke = s
    const began = performance.now()
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        if (token !== demoToken) return resolve()
        demo.length = Math.min(total, ((now - began) / 1000) * DEMO_SPEED)
        const p = path.getPointAtLength(demo.length)
        demo.x = p.x
        demo.y = p.y
        if (demo.length < total) requestAnimationFrame(frame)
        else resolve()
      }
      requestAnimationFrame(frame)
    })
    if (token !== demoToken) return
    await new Promise(resolve => setTimeout(resolve, 280))
  }
  if (token === demoToken) demo.active = false
  restartIdle()
}

function restartIdle() {
  clearTimeout(idleTimer)
  if (complete.value) return
  idleTimer = setTimeout(() => showMe(current.value, true), IDLE_MS)
}

function clear() {
  stopDemo()
  reset()
  restartIdle()
}

onMounted(async () => {
  reset()
  await nextTick()
  measure()
  showMe()
})
onBeforeUnmount(() => {
  stopDemo()
  clearTimeout(idleTimer)
})

defineExpose({ clear, showMe: () => showMe(complete.value ? 0 : current.value, false), complete })
</script>

<template>
  <svg
    ref="svg"
    :viewBox="`0 0 ${STROKE_BOX.width} ${STROKE_BOX.height}`"
    class="block size-full touch-none select-none"
    :class="theme.ink"
    role="img"
    :aria-label="`Trace the letter ${letter.uppercase}`"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @lostpointercapture="onUp"
  >
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Dotted guide -->
      <path
        v-for="(d, i) in strokes"
        :key="`guide-${i}`"
        :ref="el => { if (el) guides[i] = el as SVGPathElement }"
        :d="d"
        stroke="currentColor"
        :stroke-opacity="complete ? 0 : i === current ? 0.45 : 0.22"
        stroke-width="5"
        stroke-dasharray="0.01 6"
        class="transition-[stroke-opacity] duration-300"
      />

      <!-- The part of each stroke the child has traced, solid -->
      <g :class="complete && 'animate-pop'" style="transform-box: view-box; transform-origin: 50% 50%">
        <path
          v-for="(d, i) in strokes"
          :key="`fill-${i}`"
          :d="d"
          stroke="currentColor"
          :stroke-width="complete ? 13 : 10"
          :stroke-dasharray="`${filled[i] ?? 0} 9999`"
          :stroke-opacity="(filled[i] ?? 0) > 0 ? 1 : 0"
          class="transition-[stroke-width] duration-300"
        />
      </g>

      <!-- Crayon: exactly where the finger went -->
      <polyline
        v-for="(points, i) in crayon"
        :key="`crayon-${i}`"
        :points="points"
        stroke="var(--color-coral)"
        stroke-width="6"
        :stroke-opacity="complete ? 0 : 0.55"
        class="transition-[stroke-opacity] duration-500"
      />

      <!-- "Show me" dot and its trail -->
      <template v-if="demo.active">
        <path
          :d="strokes[demo.stroke]"
          stroke="var(--color-sunny)"
          stroke-width="7"
          :stroke-dasharray="`${demo.length} 9999`"
          stroke-opacity="0.9"
        />
        <circle :cx="demo.x" :cy="demo.y" r="6.5" fill="var(--color-sunny)" stroke="white" stroke-width="2" />
      </template>
    </g>

    <!-- Where to start the next line, and which way to go -->
    <g v-if="start && !demo.active" :key="`start-${current}-${startNudge}`" :transform="`translate(${start.x} ${start.y})`" class="pointer-events-none">
      <circle r="9" fill="var(--color-mint-ink)" fill-opacity="0.18" class="animate-ping-soft" style="transform-box: fill-box; transform-origin: center" />
      <circle r="5.5" fill="var(--color-mint-ink)" stroke="white" stroke-width="1.6" />
      <path :transform="`rotate(${start.angle}) translate(11 0)`" d="M-2.5 -4 L2.5 0 L-2.5 4" fill="none" stroke="var(--color-mint-ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </svg>
</template>
