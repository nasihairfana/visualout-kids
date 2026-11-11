<script setup lang="ts">
import type { Difficulty } from '~/games/numbers/rounds'
import type { TrainCar } from '~/games/numbers/journey'
import { planJourney, CARRIAGES } from '~/games/numbers/journey'
import type { NumberGame } from '~/data/number-games'
import { sayNumber, sayPhrase } from '~/data/english-numbers'

/**
 * Number Train Adventure: Bunny drives the Number Train along one railway, stopping at three
 * stations, then on to the party.
 *
 *   Number Valley          drag the numbers into the carriages, in order
 *   Missing Number Bridge  the train stops on the bridge; drag in the missing number
 *   Animal Station         passengers get on; tap a carriage to count who's in it, then drag
 *                          their number into the answer box
 *   Party Station          the whole journey, all the stars, and play again
 *
 * The train really travels: it pulls away, the world rolls past (far hills slower than near
 * ones), the wheels turn with the distance covered, smoke puffs faster, and it brakes into the
 * next station. Wrong numbers float back to the tray and say their name; nothing is ever lost,
 * and every station earns its three stars.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty }>()
const progress = useNumbersProgress()
const { say, effect, stop } = useAudio()
const { countAloud, countList, then, beat, cancel } = useCounting()
const DEV = import.meta.dev
const calm = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STATIONS = [
  { name: 'Number Valley', task: 'Put the numbers in order', phrase: 'numberValley' },
  { name: 'Missing Number Bridge', task: 'Which number is missing?', phrase: 'missingBridge' },
  { name: 'Animal Station', task: 'How many passengers?', phrase: 'animalStation' },
  { name: 'Party Station', task: 'We made it!', phrase: 'partyStation' },
] as const
const STARS_PER_STATION = 3

// ---- size of the scene -------------------------------------------------------------------------

const scene = ref<HTMLElement | null>(null)
const size = reactive({ w: 0, h: 0 })
let observer: ResizeObserver | null = null
onMounted(() => {
  observer = new ResizeObserver(([e]) => {
    size.w = e!.contentRect.width
    size.h = e!.contentRect.height
  })
  if (scene.value) observer.observe(scene.value)
})

const RATIO = 280 / 1125 // JourneyTrain's height / width
const TOP_ROOM = 92 // the top bar floats over the sky
// On a tall screen the railway runs across the middle, close to the number tiles.
const tall = computed(() => size.h > size.w * 1.2)
const trackY = computed(() => Math.round(size.h * (tall.value ? 0.66 : 0.86)))
const trainW = computed(() => Math.max(220, Math.min(size.w - 12, 780, (trackY.value - TOP_ROOM) / RATIO)))
const unit = computed(() => trainW.value / 1125)
const trainTop = computed(() => trackY.value - 274 * unit.value)
const seg = computed(() => Math.max(size.w * 1.6, 600))

// ---- the journey: where the train and the camera are, in stations ------------------------------

const trainPos = ref(-1.2)
const camPos = ref(0)
const moving = ref(false)
const trainX = computed(() => trainPos.value * seg.value + (size.w - trainW.value) / 2)
const camX = computed(() => camPos.value * seg.value)
const wheelTurn = computed(() => ((trainX.value / (24 * unit.value)) * 180) / Math.PI)

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
let raf = 0

/** Move the train (and, a moment behind, the camera) from where they are to `to`. */
function drive(to: number, ms: number, camera: boolean) {
  return new Promise<void>((resolve) => {
    const fromTrain = trainPos.value
    const fromCam = camPos.value
    const lag = camera && !calm ? 260 : 0
    const start = performance.now()
    moving.value = true
    cancelAnimationFrame(raf)
    const frame = (now: number) => {
      const t = now - start
      trainPos.value = fromTrain + (to - fromTrain) * ease(Math.min(1, t / ms))
      if (camera) camPos.value = fromCam + (to - fromCam) * ease(Math.min(1, Math.max(0, t - lag) / ms))
      if (t < ms + lag) raf = requestAnimationFrame(frame)
      else {
        moving.value = false
        resolve()
      }
    }
    raf = requestAnimationFrame(frame)
  })
}

// Smoke: quick puffs while moving, a lazy one now and then while waiting at a station.
const puffs = ref<Array<{ id: number, x: number, y: number }>>([])
let puffId = 0
let puffTimer: ReturnType<typeof setTimeout> | undefined
function puff() {
  if (!calm && size.w) {
    const id = ++puffId
    puffs.value.push({ id, x: trainX.value + 1087 * unit.value, y: trainTop.value + 64 * unit.value })
    setTimeout(() => { puffs.value = puffs.value.filter(p => p.id !== id) }, 1700)
  }
  puffTimer = setTimeout(puff, moving.value ? 200 : 1300)
}

// ---- the stations --------------------------------------------------------------------------------

type Phase = 'arrive' | 'play' | 'cheer' | 'travel' | 'party'
const phase = ref<Phase>('arrive')
const station = ref(0)
const plan = ref(planJourney(props.difficulty))
const stars = ref(0)
const showFinale = ref(false)
const unlocked = ref<NumberGame[]>([])

const placed = ref<boolean[]>([])
const bridgeDone = ref(false)
const counted = ref<string[]>([])
const answer = ref<number | null>(null)
const litCar = ref(-1)
const litSeat = ref<string | null>(null)
const hint = ref(false)
const bounce = ref<{ v: number, n: number } | null>(null)
let wrong = 0

function resetStation() {
  placed.value = Array(CARRIAGES).fill(false)
  bridgeDone.value = false
  counted.value = []
  answer.value = null
  litCar.value = -1
  litSeat.value = null
  hint.value = false
  bounce.value = null
  wrong = 0
}

/** Carriage contents for the station whose activity is on board. */
const content = ref(0)
const cars = computed<TrainCar[]>(() => {
  const p = plan.value
  if (content.value === 0) {
    const firstEmpty = placed.value.indexOf(false)
    return p.order.map((v, k) => placed.value[k]
      ? { text: String(v), state: 'filled', lit: litCar.value === k }
      : { text: '?', state: 'empty', glow: hint.value && k === firstEmpty })
  }
  if (content.value === 1) {
    return p.missing.values.map((v, k) => k !== p.missing.gap
      ? { text: String(v), state: 'given', lit: litCar.value === k }
      : bridgeDone.value
        ? { text: String(v), state: 'filled', lit: litCar.value === k }
        : { text: '?', state: 'empty', glow: hint.value })
  }
  return p.passengers.seats.map((seats, k) => ({
    text: null,
    state: 'passengers',
    passengers: seats.map((kind, i) => {
      const at = counted.value.indexOf(`${k}-${i}`)
      return { kind, count: at >= 0 ? at + 1 : null, lit: litSeat.value === `${k}-${i}` }
    }),
  }))
})

/** Number tiles still in the tray. */
const tiles = computed(() => {
  if (phase.value !== 'play') return []
  const p = plan.value
  if (content.value === 0) return p.order.filter((_, k) => !placed.value[k])
  if (content.value === 1) return bridgeDone.value ? [] : p.missing.choices
  return answer.value === null ? p.passengers.choices : []
})
// Keep the shuffled order of the first station's tiles.
const valleyOrder = ref<number[]>([])
const trayTiles = computed(() => (content.value === 0 && phase.value === 'play' ? valleyOrder.value.filter(v => tiles.value.includes(v)) : tiles.value))
const seatsInOrder = computed(() => plan.value.passengers.seats.flatMap((s, k) => s.map((_, i) => `${k}-${i}`)))

// ---- what to say ---------------------------------------------------------------------------------

const instruct = () => say(sayPhrase(STATIONS[station.value]!.phrase))

// ---- playing ---------------------------------------------------------------------------------------

function wrongTile(v: number) {
  bounce.value = { v, n: (bounce.value?.n ?? 0) + 1 }
  effect('tryAgain')
  say([sayPhrase('thats'), sayNumber(v)])
  if (++wrong >= 2) {
    hint.value = true
    if (content.value === 2) countPassengersAloud(false)
  }
}
function returnTile(v: number) {
  bounce.value = { v, n: (bounce.value?.n ?? 0) + 1 }
  effect('tap')
}

function tryPlace(v: number, k: number) {
  const p = plan.value
  if (k < 0 || placed.value[k]) return returnTile(v)
  if (p.order[k] !== v) return wrongTile(v)
  placed.value[k] = true
  hint.value = false
  wrong = 0
  effect('stroke')
  say(sayNumber(v))
  if (!placed.value.includes(false)) stationDone()
}

function tryMissing(v: number) {
  const m = plan.value.missing
  if (m.values[m.gap] !== v) return wrongTile(v)
  bridgeDone.value = true
  hint.value = false
  effect('stroke')
  say(sayNumber(v))
  stationDone()
}

function tryAnswer(v: number) {
  if (v !== plan.value.passengers.count) return wrongTile(v)
  answer.value = v
  hint.value = false
  effect('success')
  stationDone()
}

/** Tap a carriage at Animal Station: count the next passenger in it (each one only once). */
function countIn(k: number) {
  if (content.value !== 2 || phase.value !== 'play') return
  const seats = plan.value.passengers.seats[k]!
  const next = seats.findIndex((_, i) => !counted.value.includes(`${k}-${i}`))
  if (next < 0) return effect('tap')
  counted.value.push(`${k}-${next}`)
  litSeat.value = `${k}-${next}`
  effect('stroke')
  say(sayNumber(counted.value.length))
}

async function countPassengersAloud(finalCount: boolean) {
  counted.value = []
  const order = seatsInOrder.value
  const done = await countAloud(1, order.length, (n) => {
    counted.value = order.slice(0, n)
    litSeat.value = order[n - 1]!
  })
  litSeat.value = null
  if (!finalCount && done) await then([sayNumber(order.length)])
  return done
}

function tapCar(k: number) {
  if (phase.value !== 'play') return
  if (content.value === 2) return countIn(k)
  const car = cars.value[k]!
  if (car.state === 'empty') return
  say(sayNumber(Number(car.text)))
}

const drag = useDragDrop<number>({
  onTap: (v) => {
    if (phase.value !== 'play') return
    if (content.value === 0) return tryPlace(v, placed.value.indexOf(false))
    if (content.value === 1) return tryMissing(v)
    return tryAnswer(v)
  },
  onDrop: (v, target) => {
    if (phase.value !== 'play') return
    if (content.value === 0 && target?.startsWith('car-')) return tryPlace(v, Number(target.slice(4)))
    if (content.value === 1 && target === `car-${plan.value.missing.gap}`) return tryMissing(v)
    if (content.value === 2 && target === 'answer') return tryAnswer(v)
    returnTile(v)
  },
})

// ---- celebrating and travelling ----------------------------------------------------------------

async function stationDone() {
  phase.value = 'cheer'
  await beat(500)
  const p = plan.value
  const counting = content.value === 2
    ? countPassengersAloud(true)
    : countList(content.value === 0 ? p.order : p.missing.values, (i) => { litCar.value = i })
  if (!(await counting)) return
  litCar.value = -1
  stars.value += STARS_PER_STATION
  effect('celebrate')
  cheering.value = true
  await then([sayPhrase('greatJob')])
  await beat(1400)
  cheering.value = false
  travel()
}
const cheering = ref(false)
const CHEERS = ['Wonderful ordering!', 'You found it!', 'Super counting!']

async function travel() {
  const to = station.value + 1
  phase.value = 'travel'
  effect('whistle')
  say(sayPhrase('nextStop'))
  await drive(to, calm ? 900 : 4800, true)
  station.value = to
  if (to < STATIONS.length - 1) {
    resetStation()
    content.value = to
    phase.value = 'play'
    effect('whistle')
    setTimeout(instruct, 500)
  }
  else arriveAtParty()
}

function arriveAtParty() {
  phase.value = 'party'
  effect('celebrate')
  say(sayPhrase('partyStation'))
  unlocked.value = progress.complete(props.game.id, props.difficulty, 3)
  setTimeout(() => { showFinale.value = true }, calm ? 300 : 1600)
}

function shuffleTiles(values: number[]) {
  let out = [...values]
  // Never start already in order.
  while (out.every((v, i) => v === values[i])) out = [...values].sort(() => Math.random() - 0.5)
  return out
}

/** Start (or start again): the train rolls in from the left and stops at Number Valley. */
async function begin() {
  cancel()
  stop()
  showFinale.value = false
  unlocked.value = []
  plan.value = planJourney(props.difficulty)
  stars.value = 0
  station.value = 0
  content.value = 0
  resetStation()
  valleyOrder.value = shuffleTiles(plan.value.order)
  phase.value = 'arrive'
  camPos.value = 0
  trainPos.value = -1.2
  effect('whistle')
  await drive(0, calm ? 600 : 3200, false)
  phase.value = 'play'
  instruct()
}

onMounted(() => {
  puff()
  // Wait one frame so the scene has its size before the train rolls in.
  requestAnimationFrame(() => begin())
})
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(raf)
  clearTimeout(puffTimer)
  stop()
})

const journeyAt = computed(() => Math.max(0, Math.min(1, trainPos.value / (STATIONS.length - 1))))
const promptStation = computed(() => (phase.value === 'travel' ? STATIONS[station.value + 1] : STATIONS[station.value])!)
</script>

<template>
  <div class="relative flex h-dvh touch-none select-none flex-col overflow-hidden bg-[#5DB64B]">
    <!-- ================= the scene ================= -->
    <div ref="scene" class="relative min-h-0 flex-1 overflow-hidden" data-scene>
      <JourneyWorld v-if="size.w" :w="size.w" :h="size.h" :seg="seg" :track-y="trackY" :cam-x="camX" :party="phase === 'party'">
        <div class="pointer-events-auto absolute" :style="{ left: `${trainX}px`, top: `${trainTop}px` }" data-train :data-x="Math.round(trainX)" :data-moving="moving ? '' : undefined">
          <JourneyTrain
            :width="trainW"
            :cars="cars"
            :wheel-turn="wheelTurn"
            :moving="moving"
            :waving="moving || phase === 'party' || cheering"
            :drop-over="drag.ghost.over"
            :reach="trainTop"
            @tap-car="tapCar"
          />
        </div>
        <span
          v-for="p in puffs"
          :key="p.id"
          class="jt-puff absolute rounded-full bg-white"
          :style="{ left: `${p.x}px`, top: `${p.y}px`, width: `${unit * 70}px`, height: `${unit * 70}px` }"
        />
      </JourneyWorld>

      <!-- top bar floating over the sky: home · where we are · sound -->
      <div class="absolute inset-x-0 top-0 px-[max(env(safe-area-inset-left),0.75rem)] pt-[max(env(safe-area-inset-top),0.75rem)]">
        <GameTopBar>
          <button
            type="button"
            class="toy-press flex min-h-16 max-w-full items-center gap-2 rounded-[1.5rem] bg-white/90 px-4 py-1.5 text-left"
            :aria-label="`${promptStation.name}. ${promptStation.task}. Tap to hear again.`"
            data-prompt
            :data-station="station"
            :data-phase="phase"
            @click="instruct"
          >
            <AppIcon name="speaker" class="size-6 shrink-0 text-ink-soft" />
            <span class="min-w-0 leading-tight">
              <span class="block truncate text-[0.7rem] font-black uppercase tracking-[0.16em] text-ink-soft">
                {{ phase === 'travel' ? 'Next stop' : `Station ${Math.min(station + 1, 3)}` }} · {{ promptStation.name }}
              </span>
              <span class="line-clamp-2 block text-base font-black text-ink sm:text-lg">{{ phase === 'travel' ? 'Choo choo!' : promptStation.task }}</span>
            </span>
          </button>
        </GameTopBar>
      </div>

      <!-- a station's celebration -->
      <Transition enter-from-class="scale-75 opacity-0" leave-to-class="opacity-0" enter-active-class="transition duration-300" leave-active-class="transition duration-300">
        <div v-if="cheering" class="pointer-events-none absolute inset-x-0 top-[5.5rem] mx-auto flex w-fit flex-col items-center rounded-[1.75rem] bg-white/95 px-6 py-3 shadow-xl" data-cheer>
          <span class="flex items-end">
            <AppIcon v-for="n in 3" :key="n" name="star" class="animate-pop text-sunny drop-shadow [animation-fill-mode:both]" :class="n === 2 ? 'size-14' : 'size-10'" :style="{ animationDelay: `${n * 0.15}s` }" />
          </span>
          <span class="text-2xl font-black text-ink">{{ CHEERS[station] }}</span>
        </div>
      </Transition>
    </div>

    <!-- ================= the tray: journey, number tiles, answer box ================= -->
    <section class="relative z-10 flex flex-col items-center gap-2 bg-gradient-to-b from-[#6CC15A] to-[#4FA23F] px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 landscape:flex-row landscape:justify-center landscape:gap-4 landscape:pt-2">
      <div class="flex items-center gap-3">
        <!-- The journey so far -->
        <div class="flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 landscape:absolute landscape:left-3" role="img" :aria-label="`${stars} stars. ${promptStation.name}.`" data-journey>
          <span class="relative flex w-28 items-center justify-between">
            <span class="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/15" />
            <span class="absolute left-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-coral transition-[width]" :style="{ width: `calc(${journeyAt * 100}% - 0.5rem)` }" />
            <span v-for="i in 4" :key="i" class="relative size-3.5 rounded-full border-2 border-white" :class="trainPos >= i - 1 - 0.01 ? 'bg-coral' : 'bg-ink/25'" />
          </span>
          <span class="flex items-center gap-0.5 text-lg font-black text-ink" data-stars><AppIcon name="star" class="size-6 text-sunny" />{{ stars }}</span>
        </div>
        <!-- Animal Station: the answer box (beside the journey on a tall screen) -->
        <div
          v-if="tall && content === 2 && (phase === 'play' || answer !== null)"
          class="grid size-[4.5rem] place-items-center rounded-2xl border-4 border-dashed text-4xl font-black sm:size-20"
          :class="[answer !== null ? 'border-solid border-mint bg-white text-mint-ink' : 'border-white bg-white/40 text-white', drag.ghost.over === 'answer' && 'scale-110 bg-white/80']"
          data-drop="answer"
          aria-label="How many passengers? Drop the number here"
        >
          {{ answer ?? '?' }}
        </div>
      </div>

      <div class="flex min-h-[4.5rem] items-center justify-center gap-2 sm:min-h-20 sm:gap-3">
        <!-- Animal Station: the answer box -->
        <div
          v-if="!tall && content === 2 && (phase === 'play' || answer !== null)"
          class="grid size-[4.5rem] place-items-center rounded-2xl border-4 border-dashed text-4xl font-black sm:size-20"
          :class="[answer !== null ? 'border-solid border-mint bg-white text-mint-ink' : 'border-white bg-white/40 text-white', drag.ghost.over === 'answer' && 'scale-110 bg-white/80']"
          data-drop="answer"
          aria-label="How many passengers? Drop the number here"
        >
          {{ answer ?? '?' }}
        </div>
        <button
          v-for="v in trayTiles"
          :key="`${v}-${bounce?.v === v ? bounce.n : 0}`"
          type="button"
          class="toy-press grid size-16 touch-none place-items-center rounded-2xl bg-white text-4xl font-black text-ink sm:size-20"
          :class="[drag.ghost.item === v && 'opacity-30', bounce?.v === v && 'animate-wiggle']"
          :aria-label="`Number ${v}`"
          :data-tile="v"
          @pointerdown="drag.start($event, v)"
          @click="drag.keyboard($event, v)"
        >
          {{ v }}
        </button>
        <span v-if="!trayTiles.length && phase !== 'play'" class="text-lg font-black text-white drop-shadow">
          {{ phase === 'travel' ? 'Choo choo!' : phase === 'party' ? 'Hooray!' : phase === 'arrive' ? 'Here comes the train!' : '' }}
        </span>
      </div>
    </section>

    <!-- what's being dragged -->
    <div v-if="drag.ghost.item !== null" class="pointer-events-none fixed z-50 grid scale-110 place-items-center rounded-2xl bg-white text-4xl font-black text-ink shadow-2xl ring-4 ring-sunny" :style="drag.ghostStyle.value">
      {{ drag.ghost.item }}
    </div>

    <JourneyFinale
      v-if="showFinale"
      :stations="STATIONS.slice(0, 3).map(s => s.name)"
      :stars="stars"
      :passengers="plan.passengers.seats.flat()"
      :unlocked="unlocked"
      @replay="begin"
      @home="navigateTo('/numbers')"
    />

    <!-- for tests: the answers, in development only -->
    <span v-if="DEV" class="hidden" data-plan :data-order="plan.order.join(',')" :data-gap="plan.missing.gap" :data-missing="plan.missing.values[plan.missing.gap]" :data-count="plan.passengers.count" />
  </div>
</template>

<style scoped>
.jt-puff {
  opacity: 0.85;
  animation: jt-puff 1.7s ease-out forwards;
  filter: drop-shadow(0 2px 2px rgb(43 34 64 / 0.1));
}
@keyframes jt-puff {
  to { transform: translate(-60%, -220%) scale(1.8); opacity: 0; }
}
</style>
