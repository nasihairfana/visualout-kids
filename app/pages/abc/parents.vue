<script setup lang="ts">
useHead({ title: 'Parents · My First ABC' })
</script>

<template>
  <!-- The only scrolling screen; it's for grown-ups. -->
  <div class="safe-screen flex flex-col gap-4 overflow-y-auto bg-cream">
    <GameTopBar>
      <h1 class="text-2xl font-black">Parents</h1>
      <template #end><span class="size-16" /></template>
    </GameTopBar>
    <ParentSettings />
  </div>
</template>
