<script setup lang="ts">
/**
 * Webbo, flat: the home-screen card and the 2D fallback. Same character as the 3D model in
 * `games/webbo/world.ts`: a round lilac spider with big eyes. Deliberately not a costumed hero.
 * PLACEHOLDER art until the final Webbo design exists (see ASSETS.md).
 */
withDefaults(defineProps<{ happy?: boolean }>(), { happy: false })
</script>

<template>
  <svg viewBox="0 0 120 100" aria-hidden="true">
    <g stroke="#5B47C9" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M38 52 Q22 36 10 52" /><path d="M36 60 Q18 52 8 68" /><path d="M38 68 Q22 70 14 84" /><path d="M42 74 Q32 84 30 94" />
      <path d="M82 52 Q98 36 110 52" /><path d="M84 60 Q102 52 112 68" /><path d="M82 68 Q98 70 106 84" /><path d="M78 74 Q88 84 90 94" />
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
