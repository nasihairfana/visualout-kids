<script setup lang="ts">
import type { Cell, TrailLevel } from '~/games/trail/levels'
import type { TrailTheme } from '~/data/trail-themes'

/**
 * The map: square letter tiles joined by roads, the animal at the start and its goal at the end.
 *
 * Moving: tap a tile, or drag the animal along. The board only reports which tile the child
 * went for (`select`); the game decides whether it's the next step. A drag only ever tries the
 * tile next to where the animal stands, so sliding across the map can't skip ahead.
 * On a tall screen the map is turned on its side, so it always fits big.
 */
const props = defineProps<{
  level: TrailLevel
  theme: TrailTheme
  /** How far along the trail the animal is (0 = start). */
  position: number
  /** The tile to glow as a hint, if any. */
  hint: Cell | null
  /** A tile that was a wrong pick; `n` changes every time so the wobble replays. */
  wobble: { cell: Cell, n: number } | null
  done: boolean
}>()
const emit = defineEmits<{ select: [cell: Cell], hero: [] }>()

/** Local development only: tiles say which trail step they are, for automated tests. */
const DEV = import.meta.dev

const box = ref<HTMLElement | null>(null)
const size = reactive({ w: 0, h: 0 })
let observer: ResizeObserver | null = null
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    size.w = entry!.contentRect.width
    size.h = entry!.contentRect.height
  })
  if (box.value) observer.observe(box.value)
})
onBeforeUnmount(() => observer?.disconnect())

// ---- layout ------------------------------------------------------------------------------------

/** Turn the map on its side when the space is taller than wide. */
const turned = computed(() => size.h > size.w * 1.05 && props.level.cols > props.level.rows)
const shown = computed(() => (turned.value ? { rows: props.level.cols, cols: props.level.rows } : { rows: props.level.rows, cols: props.level.cols }))
const GAP = 0.14
const PAD = 0.22
const tile = computed(() => {
  const { rows, cols } = shown.value
  const across = (n: number) => n + (n - 1) * GAP + 2 * PAD
  return Math.max(40, Math.min(128, Math.floor(Math.min(size.w / across(cols), size.h / across(rows)))))
})
const gap = computed(() => Math.round(tile.value * GAP))
const pad = computed(() => Math.round(tile.value * PAD))
const mapSize = computed(() => ({
  w: shown.value.cols * tile.value + (shown.value.cols - 1) * gap.value + 2 * pad.value,
  h: shown.value.rows * tile.value + (shown.value.rows - 1) * gap.value + 2 * pad.value,
}))

/** Top-left corner of a cell on screen, inside the map. */
function corner(cell: Cell) {
  const col = turned.value ? cell.r : cell.c
  const row = turned.value ? cell.c : cell.r
  return { x: pad.value + col * (tile.value + gap.value), y: pad.value + row * (tile.value + gap.value) }
}
function centre(cell: Cell) {
  const { x, y } = corner(cell)
  return { x: x + tile.value / 2, y: y + tile.value / 2 }
}
const same = (a: Cell | null | undefined, b: Cell | null | undefined) => !!a && !!b && a.r === b.r && a.c === b.c

// ---- roads ---------------------------------------------------------------------------------------

/** A road between every pair of neighbouring tiles, so the map reads as connected. */
const roads = computed(() => {
  const list: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }> = []
  for (let r = 0; r < props.level.rows; r++) {
    for (let c = 0; c < props.level.cols; c++) {
      if (c + 1 < props.level.cols) list.push({ a: centre({ r, c }), b: centre({ r, c: c + 1 }) })
      if (r + 1 < props.level.rows) list.push({ a: centre({ r, c }), b: centre({ r: r + 1, c }) })
    }
  }
  return list
})
/** The part of the trail already walked, drawn golden. */
const walked = computed(() => props.level.path.slice(0, props.position + 1).map(centre).map(p => `${p.x},${p.y}`).join(' '))

// ---- tiles, start, goal, animal ---------------------------------------------------------------

const TILE_COLOURS = [
  { bg: '#FFF4E0', border: '#FFC078' }, { bg: '#E7F5FF', border: '#74C0FC' }, { bg: '#EBFBEE', border: '#8CE99A' },
  { bg: '#F3F0FF', border: '#B197FC' }, { bg: '#FFF0F6', border: '#FAA2C1' }, { bg: '#FFF9DB', border: '#FFD43B' },
]
const tiles = computed(() => props.level.tiles.map((t, i) => {
  const walkedOn = t.step !== null && t.step <= props.position
  return {
    ...t,
    ...corner(t),
    colour: TILE_COLOURS[(i * 7 + t.r * 3) % TILE_COLOURS.length]!,
    walkedOn,
    hinted: same(props.hint, t),
    key: `${t.r}-${t.c}`,
  }
}))
const start = computed(() => corner(props.level.path[0]!))
const goalCell = computed(() => props.level.path[props.level.path.length - 1]!)
const goal = computed(() => corner(goalCell.value))

/** The animal stands on the current cell and faces the way it last went. */
const hero = computed(() => corner(props.level.path[props.position]!))
const facingLeft = ref(false)
watch(() => props.position, (now, before) => {
  if (now <= before) return
  const a = centre(props.level.path[before]!)
  const b = centre(props.level.path[now]!)
  if (Math.abs(b.x - a.x) > 1) facingLeft.value = b.x < a.x
})

// ---- touch ----------------------------------------------------------------------------------------

/** The grid cell under a point on screen, or null if it's in a gap or outside the map. */
function cellAt(clientX: number, clientY: number): Cell | null {
  const map = box.value?.querySelector<HTMLElement>('[data-map]')
  if (!map) return null
  const rect = map.getBoundingClientRect()
  const x = clientX - rect.left - pad.value
  const y = clientY - rect.top - pad.value
  const step = tile.value + gap.value
  const col = Math.floor(x / step)
  const row = Math.floor(y / step)
  // Be generous: a touch in the gap still counts for the nearer tile.
  if (col < 0 || row < 0 || col >= shown.value.cols || row >= shown.value.rows) return null
  return turned.value ? { r: col, c: row } : { r: row, c: col }
}
const nextTo = (a: Cell, b: Cell) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1

let pointer: { id: number, down: Cell | null, dragging: boolean, moved: boolean, last: Cell | null } | null = null
const grabbed = ref(false)

function onDown(e: PointerEvent) {
  if (props.done || pointer) return
  const cell = cellAt(e.clientX, e.clientY)
  const here = props.level.path[props.position]!
  pointer = { id: e.pointerId, down: cell, dragging: same(cell, here), moved: false, last: cell }
  if (pointer.dragging) {
    grabbed.value = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
}

function onMove(e: PointerEvent) {
  if (!pointer || pointer.id !== e.pointerId || !pointer.dragging || props.done) return
  const cell = cellAt(e.clientX, e.clientY)
  if (!cell || same(cell, pointer.last)) return
  pointer.last = cell
  pointer.moved = true
  // Only ever try the tile right next to the animal: a drag can't jump ahead.
  if (nextTo(cell, props.level.path[props.position]!)) emit('select', cell)
}

function onUp(e: PointerEvent) {
  if (!pointer || pointer.id !== e.pointerId) return
  const { down, dragging, moved } = pointer
  pointer = null
  grabbed.value = false
  if (props.done || moved) return
  const cell = cellAt(e.clientX, e.clientY)
  if (!cell || !same(cell, down)) return
  if (dragging) emit('hero')
  else emit('select', cell)
}

function onCancel() {
  pointer = null
  grabbed.value = false
}

/** Keyboard and screen readers: tiles are real buttons. (Pointers are handled by the board.) */
function onKey(e: MouseEvent, cell: Cell) {
  if (e.detail === 0) emit('select', cell)
}
</script>

<template>
  <div ref="box" class="relative grid size-full place-items-center">
    <div
      data-map
      class="relative touch-none select-none rounded-[2rem] shadow-[0_10px_0_rgb(43_34_64/0.12),0_18px_40px_-12px_rgb(43_34_64/0.35)]"
      :style="{ width: `${mapSize.w}px`, height: `${mapSize.h}px`, background: theme.colors.map, outline: `4px dashed ${theme.colors.accent}66`, outlineOffset: '-10px' }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    >
      <!-- Roads -->
      <svg class="pointer-events-none absolute inset-0" :width="mapSize.w" :height="mapSize.h" aria-hidden="true">
        <g stroke-linecap="round">
          <line v-for="(r, i) in roads" :key="`r${i}`" :x1="r.a.x" :y1="r.a.y" :x2="r.b.x" :y2="r.b.y" :stroke="theme.colors.road" :stroke-width="tile * 0.34" />
          <line v-for="(r, i) in roads" :key="`d${i}`" :x1="r.a.x" :y1="r.a.y" :x2="r.b.x" :y2="r.b.y" stroke="#fff" stroke-opacity=".55" :stroke-width="tile * 0.05" :stroke-dasharray="`${tile * 0.08} ${tile * 0.12}`" />
          <polyline :points="walked" fill="none" stroke="#FFC94D" :stroke-width="tile * 0.3" stroke-linejoin="round" class="transition-all duration-300" />
          <polyline :points="walked" fill="none" stroke="#fff" stroke-opacity=".8" :stroke-width="tile * 0.06" :stroke-dasharray="`${tile * 0.02} ${tile * 0.16}`" stroke-linejoin="round" />
        </g>
      </svg>

      <!-- Start: a soft grassy patch -->
      <div class="absolute rounded-full" :style="{ left: `${start.x + tile * 0.08}px`, top: `${start.y + tile * 0.08}px`, width: `${tile * 0.84}px`, height: `${tile * 0.84}px`, background: theme.colors.ground, boxShadow: 'inset 0 -6px 0 rgb(43 34 64 / 0.08)' }" />

      <!-- Goal -->
      <div
        class="absolute grid place-items-center rounded-full"
        :class="done ? 'animate-bounce-soft' : 'animate-glow'"
        :style="{ left: `${goal.x - tile * 0.1}px`, top: `${goal.y - tile * 0.1}px`, width: `${tile * 1.2}px`, height: `${tile * 1.2}px`, background: '#fff8', border: `4px solid ${theme.colors.accent}` }"
        role="img"
        aria-label="The goal"
      >
        <TrailArt :kind="theme.goal" :flip="true" class="size-[86%]" />
      </div>

      <!-- Letter tiles -->
      <button
        v-for="t in tiles"
        :key="t.key"
        type="button"
        class="absolute grid place-items-center font-black leading-none transition-[transform,background-color,box-shadow] duration-200"
        :class="[
          wobble && wobble.cell.r === t.r && wobble.cell.c === t.c && 'animate-wiggle',
          t.hinted && 'animate-glow',
        ]"
        :style="{
          left: `${t.x}px`,
          top: `${t.y}px`,
          width: `${tile}px`,
          height: `${tile}px`,
          borderRadius: `${tile * 0.24}px`,
          fontSize: `${tile * 0.56}px`,
          color: '#2B2240',
          background: t.walkedOn ? '#FFD43B' : t.colour.bg,
          border: `${Math.max(3, tile * 0.06)}px solid ${t.walkedOn ? '#F59F00' : t.colour.border}`,
          boxShadow: t.walkedOn ? '0 2px 0 rgb(43 34 64 / 0.15)' : '0 5px 0 rgb(43 34 64 / 0.15)',
          transform: t.walkedOn ? 'translateY(3px)' : undefined,
        }"
        :aria-label="`Letter ${t.text}`"
        :data-cell="t.key"
        :data-step="DEV && t.step !== null ? t.step : undefined"
        @click="onKey($event, t)"
      >
        {{ t.text }}
        <span v-if="t.walkedOn" class="absolute -right-1.5 -top-1.5 grid size-[34%] place-items-center rounded-full bg-white text-[0.32em] text-mint-ink shadow" aria-hidden="true">✓</span>
      </button>

      <!-- The animal -->
      <div
        class="pointer-events-none absolute transition-transform duration-300 ease-out motion-reduce:transition-none"
        :style="{ width: `${tile}px`, height: `${tile}px`, transform: `translate(${hero.x - (done ? tile * 0.45 : 0)}px, ${hero.y - tile * 0.12}px) scale(${grabbed ? 1.15 : 1})` }"
        role="img"
        :aria-label="theme.title"
      >
        <TrailArt :kind="theme.hero" :flip="facingLeft" class="size-full drop-shadow-md" :class="done ? 'animate-bounce-soft' : 'animate-float'" />
      </div>
    </div>
  </div>
</template>
