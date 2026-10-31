<script setup lang="ts">
const { settings, toggleSound } = useSoundSettings()
const { effect } = useAudio()

function toggle() {
  toggleSound()
  if (settings.value.soundOn) effect('tap')
}
</script>

<template>
  <button
    type="button"
    class="toy-press grid size-16 place-items-center rounded-full bg-white"
    :class="settings.soundOn ? 'text-ink' : 'text-ink-soft'"
    :aria-label="settings.soundOn ? 'Sound on. Tap to turn off.' : 'Sound off. Tap to turn on.'"
    :aria-pressed="settings.soundOn"
    @click="toggle"
  >
    <AppIcon :name="settings.soundOn ? 'speaker' : 'speaker-off'" class="size-8" />
  </button>
</template>
