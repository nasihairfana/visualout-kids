<script setup lang="ts">
/**
 * Grown-ups only: press and hold for 2 seconds. Toddlers tap; they rarely hold still.
 * Keeps parent settings separate from game controls without any reading test.
 */
const emit = defineEmits<{ unlock: [] }>()
const HOLD_MS = 2000
const progress = ref(0)
let raf = 0
let start = 0

function tick(now: number) {
  progress.value = Math.min(1, (now - start) / HOLD_MS)
  if (progress.value >= 1) {
    cancel()
    emit('unlock')
    return
  }
  raf = requestAnimationFrame(tick)
}

function begin() {
  start = performance.now()
  raf = requestAnimationFrame(tick)
}

function cancel() {
  cancelAnimationFrame(raf)
  progress.value = 0
}

onBeforeUnmount(cancel)
const circumference = 2 * Math.PI * 20
</script>

<template>
  <button
    type="button"
    class="relative flex min-h-16 items-center gap-2 rounded-full bg-white/70 py-2 pl-2 pr-4 text-sm font-bold text-ink-soft"
    aria-label="Parents: press and hold for two seconds to open settings"
    @pointerdown="begin"
    @pointerup="cancel"
    @pointerleave="cancel"
    @pointercancel="cancel"
    @contextmenu.prevent
    @keydown.enter.prevent="emit('unlock')"
  >
    <span class="relative grid size-12 place-items-center">
      <svg viewBox="0 0 48 48" class="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-width="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-coral)" stroke-width="4" stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="circumference * (1 - progress)" />
      </svg>
      <AppIcon name="lock" class="size-6" />
    </span>
    <span>Parents · hold</span>
  </button>
</template>
