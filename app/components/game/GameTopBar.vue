<script setup lang="ts">
/**
 * Home button · centre slot · sound toggle. Shared by every activity screen.
 * Home goes to the game's own home, or to `home` when an activity has its own map (Letter Trails).
 */
const props = defineProps<{ home?: string }>()
const { stop, effect } = useAudio()
const gameHome = useGameHome()

function goHome() {
  stop()
  effect('page')
  navigateTo(props.home ?? gameHome.value)
}
</script>

<template>
  <header class="flex items-center justify-between gap-3">
    <button type="button" class="toy-press grid size-16 place-items-center rounded-full bg-white" aria-label="Home" @click="goHome">
      <AppIcon name="home" class="size-8" />
    </button>
    <div class="flex min-w-0 flex-1 justify-center">
      <slot />
    </div>
    <slot name="end">
      <SoundToggle />
    </slot>
  </header>
</template>
