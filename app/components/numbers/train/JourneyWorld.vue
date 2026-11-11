<script setup lang="ts">
/**
 * The railway the Number Train travels along: one long world with the three stations and the
 * party station at the end, `seg` pixels apart. `camX` is how far the camera has travelled. Far
 * things move slower than near things (mountains, hills, clouds), so travelling feels deep.
 *
 *   0 · Number Valley         hills, trees, flowers
 *   1 · Missing Number Bridge a long bridge over a river, mountains, butterflies
 *   2 · Animal Station        a station building and animals on the platform
 *   3 · Party Station         balloons, bunting, stars and confetti
 *
 * The default slot is drawn in the world (the train and its smoke), so it moves with the rails.
 */
const props = defineProps<{ w: number, h: number, seg: number, trackY: number, camX: number, party: boolean }>()

const worldW = computed(() => 3 * props.seg + props.w * 1.3)
const u = computed(() => Math.max(28, Math.min(props.w, props.h * 1.7) / 10))
const layer = (factor: number) => ({ transform: `translate3d(${-props.camX * factor}px, 0, 0)` })
const repeat = (factor: number, every: number) => Array.from({ length: Math.ceil((worldW.value * factor + props.w) / every) + 1 }, (_, i) => i * every)

// The bridge spans most of the second stretch: the train stops on it, then crosses the rest.
const bridge = computed(() => ({ from: props.seg - props.w * 0.15, to: props.seg + props.w * 1.3 }))
const ground = computed(() => props.h - props.trackY)
const at = (station: number, frac: number) => station * props.seg + props.w * frac

const VALLEY = [
  { kind: 'tree', x: 0.04, s: 1.9, back: true }, { kind: 'bush', x: 0.24, s: 1.1, back: true }, { kind: 'tree', x: 0.82, s: 1.6, back: true },
  { kind: 'flower', x: 0.1, s: 0.8 }, { kind: 'sunflower', x: 0.3, s: 1 }, { kind: 'flower', x: 0.55, s: 0.7 }, { kind: 'mushroom', x: 0.72, s: 0.7 }, { kind: 'flower', x: 0.9, s: 0.8 },
] as const
// Animals waiting at the station: beside the train on a wide screen, in front of it on a tall one.
const ANIMALS = ['puppy', 'duckling', 'cat', 'elephant'] as const
const tall = computed(() => props.h > props.w * 1.2)
const animalSpot = (i: number) => tall.value
  ? { x: 0.08 + i * 0.23, top: props.trackY + ground.value * 0.12 }
  : { x: i < 2 ? 0.005 + i * 0.065 : 0.86 + (i - 2) * 0.065, top: props.trackY - u.value * 1.4 }
const BALLOONS = ['#FF8FA3', '#74C0FC', '#FFD43B', '#8CE99A', '#B197FC', '#FFA94D']
const confetti = Array.from({ length: 26 }, (_, i) => ({ left: `${(i * 37) % 100}%`, delay: `${(i % 9) * 0.22}s`, color: BALLOONS[i % 6], round: i % 2 === 0 }))
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <!-- sky and sun -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#8FD3FF] via-[#C6EBFF] to-[#F2FBFF]" />
    <div class="absolute rounded-full bg-[#FFE066] shadow-[0_0_60px_20px_#FFE06688]" :style="{ right: `${u * 0.8}px`, top: `${u * 0.5}px`, width: `${u * 1.3}px`, height: `${u * 1.3}px` }" />

    <!-- clouds (far, slow) -->
    <div class="absolute inset-y-0 left-0" :style="layer(0.15)">
      <NumberArt v-for="x in repeat(0.15, w * 0.55)" :key="x" kind="cloud" class="absolute animate-float" :style="{ left: `${x}px`, top: `${u * (0.3 + ((x / 97) % 1.4))}px`, width: `${u * 2}px`, height: `${u * 2}px` }" />
    </div>

    <!-- mountains -->
    <div class="absolute inset-y-0 left-0" :style="layer(0.3)">
      <svg v-for="x in repeat(0.3, u * 7)" :key="x" class="absolute" viewBox="0 0 200 100" :style="{ left: `${x}px`, top: `${trackY - u * 4.6}px`, width: `${u * 9}px`, height: `${u * 4.5}px` }">
        <defs><linearGradient id="jw-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9B6F2" /><stop offset="1" stop-color="#C9D2FA" /></linearGradient></defs>
        <path d="M0 100L55 22l28 30 30-40 87 88z" fill="url(#jw-mtn)" />
        <path d="M55 22l-12 17 8-3 6 7 7-9zM113 12l-13 17 9-3 7 6 8-8z" fill="#fff" />
      </svg>
    </div>

    <!-- hills -->
    <div class="absolute inset-y-0 left-0" :style="layer(0.6)">
      <svg v-for="x in repeat(0.6, u * 6)" :key="x" class="absolute" viewBox="0 0 200 60" preserveAspectRatio="none" :style="{ left: `${x}px`, top: `${trackY - u * 1.8}px`, width: `${u * 6.4}px`, height: `${u * 2}px` }">
        <defs><linearGradient id="jw-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A6E59A" /><stop offset="1" stop-color="#7CCB6C" /></linearGradient></defs>
        <path d="M0 60C20 10 70 0 100 24s60-30 100 6v30z" fill="url(#jw-hill)" />
      </svg>
    </div>

    <!-- ================= the world: ground, river, bridge, rails, stations ================= -->
    <div class="absolute inset-y-0 left-0" :style="{ ...layer(1), width: `${worldW}px` }">
      <div class="absolute inset-x-0 bg-gradient-to-b from-[#8FDB7C] to-[#5DB64B]" :style="{ top: `${trackY}px`, bottom: 0 }" />

      <!-- the river and the bridge -->
      <div class="jw-river absolute" :style="{ left: `${bridge.from}px`, width: `${bridge.to - bridge.from}px`, top: `${trackY + ground * 0.18}px`, bottom: 0 }" />
      <svg class="absolute overflow-visible" :style="{ left: `${bridge.from}px`, top: `${trackY}px`, width: `${bridge.to - bridge.from}px`, height: `${ground}px` }" :viewBox="`0 0 ${bridge.to - bridge.from} ${ground}`" preserveAspectRatio="none">
        <g stroke="#2B2240" stroke-width="3">
          <path
            v-for="x in Math.ceil((bridge.to - bridge.from) / (u * 2.2))"
            :key="x"
            :d="`M${(x - 1) * u * 2.2} 14h${u * 2.2}v${ground}h-${u * 0.35}v-${ground * 0.45}a${u * 0.75} ${ground * 0.35} 0 0 0 -${u * 1.5} 0v${ground * 0.45}h-${u * 0.35}z`"
            fill="#E0915A"
          />
        </g>
        <rect x="0" y="4" :width="bridge.to - bridge.from" height="12" fill="#C1693A" stroke="#2B2240" stroke-width="3" />
        <path v-for="x in Math.ceil((bridge.to - bridge.from) / 26)" :key="`p${x}`" :d="`M${x * 26} 4v-${u * 0.5}`" stroke="#8A4A26" stroke-width="4" />
        <rect x="0" :y="-u * 0.55" :width="bridge.to - bridge.from" height="6" fill="#8A4A26" />
      </svg>

      <!-- rails across the whole world -->
      <div class="absolute inset-x-0 jw-sleepers" :style="{ top: `${trackY - 3}px`, height: `${Math.max(8, u * 0.3)}px` }" />
      <div class="absolute inset-x-0 h-1.5 rounded-full bg-[#6B6880]" :style="{ top: `${trackY - 4}px` }" />

      <!-- 0 · Number Valley -->
      <TrailArt
        v-for="(t, i) in VALLEY"
        :key="`v${i}`"
        :kind="t.kind"
        class="jw-soft absolute"
        :style="{ left: `${at(0, t.x)}px`, width: `${u * t.s}px`, height: `${u * t.s}px`, top: 'back' in t ? `${trackY - u * t.s * 0.95}px` : `${trackY + ground * 0.35}px` }"
      />

      <!-- 1 · Missing Number Bridge: butterflies over the water -->
      <NumberArt
        v-for="i in 4"
        :key="`b${i}`"
        kind="butterfly"
        class="jw-soft absolute animate-float"
        :style="{ left: `${at(1, 0.12 + i * 0.2)}px`, top: `${trackY - u * (2.4 + (i % 2) * 1.1)}px`, width: `${u * 0.9}px`, height: `${u * 0.9}px`, animationDelay: `${-i}s` }"
      />

      <!-- 2 · Animal Station -->
      <svg class="jw-soft absolute" viewBox="0 0 220 150" :style="{ left: `${at(2, 0.3)}px`, top: `${trackY - u * 4.3}px`, width: `${u * 6.3}px`, height: `${u * 4.3}px` }">
        <g stroke="#2B2240" stroke-width="3" stroke-linejoin="round">
          <rect x="20" y="58" width="180" height="92" rx="8" fill="#FFE8CC" />
          <path d="M8 62L110 12l102 50z" fill="#FF8787" />
          <path d="M20 62h180" stroke-width="6" stroke="#FF6B6B" />
          <circle cx="110" cy="40" r="12" fill="#fff" /><path d="M110 33v7l5 3" fill="none" />
          <rect x="94" y="96" width="32" height="54" rx="6" fill="#74C0FC" />
          <rect x="38" y="84" width="34" height="30" rx="6" fill="#D0EBFF" /><rect x="148" y="84" width="34" height="30" rx="6" fill="#D0EBFF" />
          <path d="M30 72h50l-6 10H36zM140 72h50l-6 10h-38z" fill="#FFD43B" />
        </g>
      </svg>
      <div class="absolute rounded-md bg-[#D9CFC1]" :style="{ left: `${at(2, 0.02)}px`, width: `${w * 0.96}px`, top: `${trackY - u * 0.35}px`, height: `${u * 0.32}px` }" />
      <TrailArt
        v-for="(kind, i) in ANIMALS"
        :key="`a${i}`"
        :kind="kind"
        class="jw-soft absolute animate-bounce-soft"
        :style="{ left: `${at(2, animalSpot(i).x)}px`, top: `${animalSpot(i).top}px`, width: `${u * (tall ? 1.6 : 1.3)}px`, height: `${u * (tall ? 1.6 : 1.3)}px`, animationIterationCount: 'infinite', animationDuration: `${1.4 + i * 0.2}s` }"
      />
      <TrailArt v-for="i in 4" :key="`f${i}`" kind="flower" class="absolute" :style="{ left: `${at(2, i * 0.22 - 0.1)}px`, top: `${trackY + ground * (tall ? 0.6 : 0.4)}px`, width: `${u * 0.8}px`, height: `${u * 0.8}px` }" />

      <!-- 3 · Party Station -->
      <svg class="jw-soft absolute" viewBox="0 0 300 160" :style="{ left: `${at(3, 0.08)}px`, top: `${trackY - u * 4.6}px`, width: `${w * 0.84}px`, height: `${u * 4.6}px` }" preserveAspectRatio="none">
        <g stroke="#2B2240" stroke-width="3">
          <rect x="10" y="40" width="22" height="120" rx="6" fill="#B197FC" /><rect x="268" y="40" width="22" height="120" rx="6" fill="#B197FC" />
          <path d="M4 44Q150 -20 296 44" fill="none" stroke="#FF8FA3" stroke-width="16" />
          <path d="M4 44Q150 -20 296 44" fill="none" stroke="#2B2240" stroke-width="3" stroke-dasharray="2 30" />
          <path d="M30 52q120 40 240 0" fill="none" />
          <path v-for="k in 8" :key="k" :d="`M${30 + k * 27} ${58 + Math.sin(k / 2.6) * 14}l9 20 9-20z`" :fill="BALLOONS[k % 6]" />
        </g>
      </svg>
      <NumberArt
        v-for="(c, i) in BALLOONS"
        :key="`ba${i}`"
        kind="balloon"
        :tint="c"
        class="jw-soft absolute animate-float"
        :style="{ left: `${at(3, 0.02 + i * 0.17)}px`, top: `${trackY - u * (3.4 + (i % 3) * 0.7)}px`, width: `${u * 1.1}px`, height: `${u * 1.4}px`, animationDelay: `${-i * 0.6}s` }"
      />
      <NumberArt v-for="i in 5" :key="`s${i}`" kind="star" class="absolute animate-float" :style="{ left: `${at(3, i * 0.19 - 0.08)}px`, top: `${trackY + ground * 0.3}px`, width: `${u * 0.8}px`, height: `${u * 0.8}px`, animationDelay: `${-i * 0.5}s` }" />

      <slot />
    </div>

    <!-- confetti at the party -->
    <template v-if="party">
      <span v-for="(c, i) in confetti" :key="`c${i}`" class="jw-confetti absolute -top-4 block size-3" :style="{ left: c.left, animationDelay: c.delay, background: c.color, borderRadius: c.round ? '9999px' : '3px' }" />
    </template>
  </div>
</template>

<style scoped>
.jw-soft {
  filter: drop-shadow(0 6px 4px rgb(43 34 64 / 0.16));
}
.jw-sleepers {
  background: repeating-linear-gradient(90deg, #9C6B45 0 10px, transparent 10px 26px);
}
.jw-river {
  background:
    repeating-radial-gradient(ellipse 40px 6px at 20px 50%, #ffffff66 0 2px, transparent 3px 22px),
    linear-gradient(#6EC6F5, #3D9BDB);
  background-size: 80px 26px, 100% 100%;
  animation: jw-flow 2.4s linear infinite;
}
@keyframes jw-flow {
  to { background-position: -80px 0, 0 0; }
}
.jw-confetti {
  animation: jw-fall 3.4s ease-in infinite;
}
@keyframes jw-fall {
  to { transform: translateY(110vh) rotate(540deg); }
}
@media (prefers-reduced-motion: reduce) {
  .jw-river, .jw-confetti { animation: none; }
  .jw-confetti { display: none; }
}
</style>
