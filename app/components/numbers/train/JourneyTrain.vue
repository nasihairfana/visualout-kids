<script setup lang="ts">
import type { TrainCar } from '~/games/numbers/journey'

/**
 * The Number Train: five carriages and a locomotive, drawn as one connected SVG so it always moves
 * as one train. Bunny drives from the cab and waves while travelling. Wheels turn with the distance
 * travelled (`wheelTurn`, degrees for a carriage wheel), and the driving rods follow them.
 *
 * Each carriage has a big window: a number, an empty slot, or animal passengers. Over each carriage
 * sits a tall invisible drop zone (`data-drop="car-k"`) reaching up into the sky, so a number only
 * has to be let go somewhere above the right carriage.
 */
const props = defineProps<{ width: number, cars: TrainCar[], wheelTurn: number, moving: boolean, waving: boolean, dropOver?: string | null, reach: number }>()
const emit = defineEmits<{ tapCar: [k: number] }>()

// Drawing units: carriages 170 wide with 12 between, then the locomotive. y runs from -70 (ears) to 210.
const CAR_W = 170
const STEP = 182
const LX = 5 * STEP
const TOTAL = LX + 215
const TOP = -70
const BOTTOM = 210
const scale = computed(() => props.width / TOTAL)
const height = computed(() => (BOTTOM - TOP) * scale.value)

const COLOURS = [
  ['#7CC4FF', '#3E8FE0'], ['#8DE39A', '#3FAE58'], ['#FFD966', '#E8A817'], ['#FF9EBB', '#E0587F'], ['#C3A6FF', '#8A63E8'],
]
const turn = (cx: number, cy: number, r: number) => `rotate(${(props.wheelTurn * 24) / r} ${cx} ${cy})`
const rod = (cx: number, cy: number, r: number) => {
  const a = ((props.wheelTurn * 24) / r) * Math.PI / 180
  return { x: cx + Math.cos(a) * r * 0.55, y: cy + Math.sin(a) * r * 0.55 }
}
const rodA = computed(() => rod(LX + 42, 176, 30))
const rodB = computed(() => rod(LX + 118, 176, 30))

/** Where a carriage's window is, as % of the train box (numbers sit there as HTML text). */
const windowBox = (k: number) => ({
  left: `${((k * STEP + 18) / TOTAL) * 100}%`,
  top: `${((56 - TOP) / (BOTTOM - TOP)) * 100}%`,
  width: `${(134 / TOTAL) * 100}%`,
  height: `${(80 / (BOTTOM - TOP)) * 100}%`,
})
const seat = (count: number, i: number) => (count === 1 ? 85 : i === 0 ? 50 : 120)
</script>

<template>
  <div class="relative" :style="{ width: `${width}px`, height: `${height}px` }">
    <svg :viewBox="`0 ${TOP} ${TOTAL} ${BOTTOM - TOP}`" class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient v-for="(c, k) in COLOURS" :id="`jt-car-${k}`" :key="k" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="c[0]" /><stop offset="1" :stop-color="c[1]" />
        </linearGradient>
        <linearGradient id="jt-loco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7B7B" /><stop offset="1" stop-color="#D63A4A" /></linearGradient>
        <linearGradient id="jt-boiler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9A8A" /><stop offset=".5" stop-color="#F0505A" /><stop offset="1" stop-color="#B8283A" /></linearGradient>
        <linearGradient id="jt-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE58A" /><stop offset="1" stop-color="#E8A817" /></linearGradient>
        <radialGradient id="jt-wheel" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7A7290" /><stop offset="1" stop-color="#3A3350" /></radialGradient>
        <radialGradient id="jt-fur" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#E3DDEA" /></radialGradient>
        <linearGradient id="jt-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#EAF4FF" /></linearGradient>
      </defs>

      <!-- soft shadow on the ground -->
      <ellipse :cx="TOTAL / 2" cy="206" :rx="TOTAL / 2" ry="9" fill="#2B2240" opacity=".14" />

      <g stroke="#2B2240" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <!-- ================= carriages ================= -->
        <g v-for="(car, k) in cars" :key="k" :class="moving && 'jt-bob'" :style="{ animationDelay: `${-k * 0.13}s` }">
          <rect :x="k * STEP + CAR_W" y="146" width="16" height="10" fill="#5C5470" />
          <rect :x="k * STEP + 6" y="146" :width="CAR_W - 12" height="20" rx="7" fill="#5C5470" />
          <rect :x="k * STEP" y="40" :width="CAR_W" height="118" rx="24" :fill="`url(#jt-car-${k % 5})`" />
          <rect :x="k * STEP - 7" y="20" :width="CAR_W + 14" height="28" rx="14" :fill="COLOURS[k % 5]![1]" />
          <rect :x="k * STEP + 10" y="25" :width="CAR_W - 40" height="7" rx="3.5" fill="#fff" opacity=".45" stroke="none" />
          <rect :x="k * STEP + 2" y="140" :width="CAR_W - 4" height="9" fill="#fff" opacity=".5" stroke="none" />
          <rect
            :x="k * STEP + 18"
            y="56"
            width="134"
            height="80"
            rx="18"
            :fill="car.state === 'empty' ? '#FFFFFFAA' : 'url(#jt-glass)'"
            :stroke-dasharray="car.state === 'empty' ? '14 10' : undefined"
            :class="car.glow && 'jt-glow'"
          />
          <!-- passengers -->
          <g v-for="(p, i) in car.passengers ?? []" :key="i" :transform="`translate(${k * STEP + seat(car.passengers!.length, i)} 104)`"><g :class="p.lit && 'jt-hop'">
            <circle v-if="p.lit" r="34" fill="#FFC94D" opacity=".55" stroke="none" />
            <template v-if="p.kind === 'rabbit'">
              <ellipse cx="-11" cy="-40" rx="8" ry="22" fill="url(#jt-fur)" /><ellipse cx="11" cy="-40" rx="8" ry="22" fill="url(#jt-fur)" />
              <ellipse cx="-11" cy="-40" rx="3.5" ry="14" fill="#FFB3C6" stroke="none" /><ellipse cx="11" cy="-40" rx="3.5" ry="14" fill="#FFB3C6" stroke="none" />
              <circle r="24" fill="url(#jt-fur)" />
            </template>
            <template v-else-if="p.kind === 'bear'">
              <circle cx="-18" cy="-18" r="9" fill="#B07A50" /><circle cx="18" cy="-18" r="9" fill="#B07A50" />
              <circle r="24" fill="#C68B5E" />
              <ellipse cy="8" rx="11" ry="8" fill="#F1D3B3" stroke="none" />
            </template>
            <template v-else-if="p.kind === 'duck'">
              <circle r="24" fill="#FFD43B" />
              <path d="M-4 -24c0-8 8-10 10-4" fill="none" />
              <ellipse cx="0" cy="8" rx="12" ry="6" fill="#FF922B" />
            </template>
            <template v-else>
              <path d="M-22 -10l-2-24 16 12zM22 -10l2-24-16 12z" fill="#FFA94D" />
              <circle r="24" fill="#FFB866" />
              <path d="M-26 6h10M-26 12h10M26 6h-10M26 12h-10" stroke-width="2.5" />
            </template>
            <circle cx="-8" cy="-3" r="3.6" fill="#2B2240" stroke="none" /><circle cx="8" cy="-3" r="3.6" fill="#2B2240" stroke="none" />
            <circle cx="-7" cy="-4.4" r="1.3" fill="#fff" stroke="none" /><circle cx="9" cy="-4.4" r="1.3" fill="#fff" stroke="none" />
            <ellipse cx="-15" cy="7" rx="5" ry="3" fill="#FF9BB3" opacity=".7" stroke="none" /><ellipse cx="15" cy="7" rx="5" ry="3" fill="#FF9BB3" opacity=".7" stroke="none" />
            <path v-if="p.kind !== 'duck'" d="M-4 6q4 4 8 0" fill="none" stroke-width="2.5" />
            <g v-if="p.count !== null" transform="translate(20 -26)">
              <circle r="15" fill="#fff" />
              <text y="6" text-anchor="middle" font-size="18" font-weight="900" fill="#2B2240" stroke="none">{{ p.count }}</text>
            </g>
          </g></g>
          <!-- wheels -->
          <g v-for="wx in [42, 128]" :key="wx" :transform="turn(k * STEP + wx, 178, 24)">
            <circle :cx="k * STEP + wx" cy="178" r="24" fill="url(#jt-wheel)" />
            <path :d="`M${k * STEP + wx - 15} 178h30M${k * STEP + wx} 163v30`" stroke="#B8B2C8" stroke-width="4" />
            <circle :cx="k * STEP + wx" cy="178" r="7" fill="#FFD43B" />
          </g>
        </g>

        <!-- ================= locomotive ================= -->
        <g :class="moving && 'jt-bob'">
          <rect :x="LX - 4" y="138" width="222" height="26" rx="9" fill="#5C5470" />
          <!-- cab -->
          <rect :x="LX" y="6" width="94" height="146" rx="16" fill="url(#jt-loco)" />
          <rect :x="LX + 14" y="22" width="64" height="58" rx="14" fill="#CFEAFF" />
          <!-- Bunny, the driver -->
          <g>
            <ellipse :cx="LX + 34" cy="-24" rx="9" ry="28" fill="url(#jt-fur)" />
            <ellipse :cx="LX + 56" cy="-26" rx="9" ry="28" fill="url(#jt-fur)" />
            <ellipse :cx="LX + 34" cy="-24" rx="4" ry="19" fill="#FFB3C6" stroke="none" />
            <ellipse :cx="LX + 56" cy="-26" rx="4" ry="19" fill="#FFB3C6" stroke="none" />
            <circle :cx="LX + 46" cy="44" r="27" fill="url(#jt-fur)" />
            <circle :cx="LX + 38" cy="40" r="4" fill="#2B2240" stroke="none" /><circle :cx="LX + 56" cy="40" r="4" fill="#2B2240" stroke="none" />
            <circle :cx="LX + 39" cy="38.5" r="1.4" fill="#fff" stroke="none" /><circle :cx="LX + 57" cy="38.5" r="1.4" fill="#fff" stroke="none" />
            <ellipse :cx="LX + 30" cy="51" rx="5.5" ry="3.4" fill="#FF9BB3" opacity=".75" stroke="none" /><ellipse :cx="LX + 64" cy="51" rx="5.5" ry="3.4" fill="#FF9BB3" opacity=".75" stroke="none" />
            <path :d="`M${LX + 43} 49l4 3 4-3`" fill="#FF8FA3" stroke-width="2.5" />
            <path :d="`M${LX + 41} 56q6 5 12 0`" fill="none" stroke-width="2.5" />
            <!-- driver's cap -->
            <path :d="`M${LX + 22} 26q24-20 48 0z`" fill="#4DABF7" />
            <rect :x="LX + 18" y="22" width="56" height="8" rx="4" fill="#1C7ED6" />
          </g>
          <!-- waving arm -->
          <g :class="waving && 'jt-wave'" :style="{ transformBox: 'view-box', transformOrigin: `${LX + 70}px 66px` }">
            <path :d="`M${LX + 70} 66L${LX + 98} 30`" stroke="#E3DDEA" stroke-width="14" />
            <path :d="`M${LX + 70} 66L${LX + 98} 30`" stroke="#FFFFFF" stroke-width="9" />
            <circle :cx="LX + 100" cy="27" r="11" fill="url(#jt-fur)" />
          </g>
          <rect :x="LX - 8" y="-6" width="110" height="22" rx="10" fill="#B8283A" />
          <!-- boiler, dome, chimney, lamp -->
          <rect :x="LX + 88" y="62" width="120" height="84" rx="40" fill="url(#jt-boiler)" />
          <path :d="`M${LX + 120} 64v80M${LX + 160} 64v80`" stroke="#FFD43B" stroke-width="6" />
          <circle :cx="LX + 132" cy="60" r="15" fill="url(#jt-gold)" />
          <rect :x="LX + 164" y="16" width="26" height="50" rx="6" fill="#4A4360" />
          <rect :x="LX + 156" y="4" width="42" height="17" rx="7" fill="#5C5470" />
          <circle :cx="LX + 208" cy="96" r="12" fill="#FFF3BF" />
          <circle :cx="LX + 208" cy="96" r="6" fill="#FFD43B" stroke="none" />
          <path :d="`M${LX + 206} 146l18 0 -10 34z`" fill="#FFD43B" />
          <rect :x="LX + 8" y="88" width="76" height="8" rx="4" fill="#fff" opacity=".4" stroke="none" />
        </g>
        <!-- big driving wheels and their rods -->
        <g v-for="[wx, r, cy] in [[42, 30, 176], [118, 30, 176], [184, 20, 186]]" :key="wx" :transform="turn(LX + wx!, cy!, r!)">
          <circle :cx="LX + wx!" :cy="cy" :r="r" fill="url(#jt-wheel)" />
          <path :d="`M${LX + wx! - r! + 6} ${cy}h${2 * r! - 12}M${LX + wx!} ${cy! - r! + 6}v${2 * r! - 12}`" stroke="#B8B2C8" stroke-width="4" />
          <circle :cx="LX + wx!" :cy="cy" r="8" fill="#FFD43B" />
        </g>
        <path :d="`M${rodA.x} ${rodA.y}L${rodB.x} ${rodB.y}`" stroke="#FFD43B" stroke-width="7" />
      </g>
    </svg>

    <!-- Numbers in the windows -->
    <template v-for="(car, k) in cars" :key="`t${k}`">
      <span
        v-if="car.text !== null"
        class="pointer-events-none absolute grid place-items-center font-black leading-none transition-transform duration-200"
        :class="[car.state === 'empty' ? 'text-ink/35' : 'text-ink', car.lit ? 'scale-125' : '', car.state === 'filled' ? 'animate-pop' : '', moving && 'jt-bob']"
        :style="{ ...windowBox(k), fontSize: `${80 * scale * 0.8}px`, animationDelay: moving ? `${-k * 0.13}s` : undefined }"
        :data-car-text="car.text"
      >{{ car.text }}</span>
    </template>

    <!-- Drop zones: everything above each carriage counts -->
    <button
      v-for="(car, k) in cars"
      :key="`z${k}`"
      type="button"
      class="absolute bottom-0 rounded-3xl transition-colors"
      :class="dropOver === `car-${k}` ? 'bg-white/30 ring-4 ring-sunny' : ''"
      :style="{ left: `${((k * STEP - 6) / TOTAL) * 100}%`, width: `${(STEP / TOTAL) * 100}%`, top: `${-reach}px` }"
      :data-drop="car.state === 'empty' ? `car-${k}` : undefined"
      :data-car="k"
      :aria-label="car.state === 'empty' ? `Empty carriage ${k + 1}` : car.state === 'passengers' ? `Carriage ${k + 1}: count the passengers` : `Carriage ${k + 1}: ${car.text}`"
      tabindex="-1"
      @click="emit('tapCar', k)"
    />
  </div>
</template>

<style scoped>
.jt-bob {
  animation: jt-bob 0.36s ease-in-out infinite alternate;
}
@keyframes jt-bob {
  to { transform: translateY(-1.5px); }
}
.jt-wave {
  animation: jt-wave 0.5s ease-in-out infinite alternate;
}
@keyframes jt-wave {
  from { transform: rotate(-18deg); }
  to { transform: rotate(16deg); }
}
.jt-hop {
  animation: jt-hop 0.4s ease-out;
}
@keyframes jt-hop {
  40% { transform: translateY(-8px); }
}
.jt-glow {
  animation: jt-glow 1.4s ease-in-out infinite;
}
@keyframes jt-glow {
  50% { stroke: #ffc94d; }
}
@media (prefers-reduced-motion: reduce) {
  .jt-bob, .jt-wave, .jt-hop, .jt-glow { animation: none; }
}
</style>
