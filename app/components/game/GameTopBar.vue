<script setup lang="ts">
/** Home button · centre slot · sound toggle. Shared by every activity screen. */
const { stop, effect } = useAudio()

function goHome() {
  stop()
  effect('page')
  navigateTo('/')
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
