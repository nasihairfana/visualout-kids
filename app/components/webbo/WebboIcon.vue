<script setup lang="ts">
/**
 * Webbo, flat: the home-screen card, the 2D fallback and the intro. Same character as the 3D model
 * in `games/webbo/world.ts`: a round lilac spider with big eyes, six legs and two arms with mitten
 * hands. Deliberately not a costumed hero.
 * PLACEHOLDER art until the final Webbo design exists (see ASSETS.md).
 *
 * `pose`: 'rest' (hands down), 'point' (right hand up, pointing: Webbo's web move) or 'up' (both
 * hands up, celebrating). `wiggle` makes the fingers wiggle.
 */
withDefaults(defineProps<{ happy?: boolean, pose?: 'rest' | 'point' | 'up', wiggle?: boolean }>(), {
  happy: false,
  pose: 'rest',
  wiggle: false,
})

const ARMS = {
  rest: { left: [36, 62, 18, 76], right: [84, 62, 102, 76] },
  point: { left: [36, 62, 18, 76], right: [84, 54, 104, 30] },
  up: { left: [36, 54, 16, 30], right: [84, 54, 104, 30] },
}
</script>

<template>
  <svg viewBox="0 0 120 100" aria-hidden="true" class="overflow-visible">
    <g stroke="#5B47C9" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M36 60 Q18 52 8 68" /><path d="M38 68 Q22 70 14 84" /><path d="M42 74 Q32 84 30 94" />
      <path d="M84 60 Q102 52 112 68" /><path d="M82 68 Q98 70 106 84" /><path d="M78 74 Q88 84 90 94" />
      <!-- Arms -->
      <line :x1="ARMS[pose].left[0]" :y1="ARMS[pose].left[1]" :x2="ARMS[pose].left[2]" :y2="ARMS[pose].left[3]" stroke-width="6" />
      <line :x1="ARMS[pose].right[0]" :y1="ARMS[pose].right[1]" :x2="ARMS[pose].right[2]" :y2="ARMS[pose].right[3]" stroke-width="6" />
    </g>
    <!-- Mitten hands; when pointing, one finger sticks out of the right hand. -->
    <g fill="#8E7CF0" stroke="#5B47C9" stroke-width="2.5">
      <circle :cx="ARMS[pose].left[2]" :cy="ARMS[pose].left[3]" r="7" :class="wiggle && 'webbo-wiggle'" />
      <circle :cx="ARMS[pose].right[2]" :cy="ARMS[pose].right[3]" r="7" :class="wiggle && 'webbo-wiggle'" />
      <rect v-if="pose === 'point' && !wiggle" x="104" y="16" width="5" height="12" rx="2.5" transform="rotate(30 106 28)" />
    </g>
    <ellipse cx="60" cy="58" rx="30" ry="28" fill="#8E7CF0" />
    <ellipse cx="49" cy="52" rx="10" ry="11.5" fill="#fff" />
    <ellipse cx="71" cy="52" rx="10" ry="11.5" fill="#fff" />
    <circle cx="50" cy="54" r="5" fill="#2B2240" /><circle cx="70" cy="54" r="5" fill="#2B2240" />
    <circle cx="48.5" cy="51.5" r="1.6" fill="#fff" /><circle cx="68.5" cy="51.5" r="1.6" fill="#fff" />
    <circle cx="38" cy="66" r="4" fill="#FF9FBF" /><circle cx="82" cy="66" r="4" fill="#FF9FBF" />
    <path :d="happy ? 'M50 68 Q60 80 70 68' : 'M52 69 Q60 75 68 69'" stroke="#2B2240" stroke-width="3.2" stroke-linecap="round" fill="none" />
  </svg>
</template>

<style scoped>
.webbo-wiggle {
  transform-box: fill-box;
  transform-origin: center;
  animation: webbo-wiggle 0.18s ease-in-out infinite alternate;
}
@keyframes webbo-wiggle {
  from { transform: rotate(-18deg) scale(1.05); }
  to { transform: rotate(18deg) scale(0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .webbo-wiggle { animation: none; }
}
</style>
