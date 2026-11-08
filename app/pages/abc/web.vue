<script setup lang="ts">
useHead({ title: "Webbo's Letter City · My First ABC" })

// Webbo shows its web move once per visit; after that the game starts straight away.
const introSeen = useState('webbo-intro-seen', () => false)
</script>

<template>
  <WebboIntro v-if="!introSeen" @done="introSeen = true" />
  <WebboGame v-else />
</template>
