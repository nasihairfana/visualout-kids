<script setup lang="ts">
import type { TrailArtKind } from '~/data/trail-themes'

/**
 * Letter Trails art: characters, their goals and scenery, drawn in the same style as
 * public/illustrations (pastel fills, ink outline, dot eyes, pink cheeks).
 * PLACEHOLDER art: simple original shapes until the final illustrations exist (see ASSETS.md).
 * Characters face right; `flip` turns them to face left.
 */
defineProps<{ kind: TrailArtKind, flip?: boolean }>()

const INK = '#2B2240'
</script>

<template>
  <svg viewBox="0 0 100 100" aria-hidden="true" class="overflow-visible">
    <g :transform="flip ? 'translate(100 0) scale(-1 1)' : undefined" :stroke="INK" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- ============ characters ============ -->
      <template v-if="kind === 'bunny'">
        <path d="M40 40c-8-14-9-34 0-36s13 21 10 35zM56 40c-3-14 1-36 10-34s7 22-1 36z" fill="#F8F9FA" />
        <path d="M42 34c-4-10-5-24 0-25s8 15 6 24zM60 34c-1-10 2-24 7-23s3 15-2 24z" fill="#FFC9D6" stroke="none" />
        <ellipse cx="44" cy="74" rx="26" ry="20" fill="#F8F9FA" />
        <circle cx="21" cy="72" r="6" fill="#fff" />
        <ellipse cx="56" cy="52" rx="20" ry="17" fill="#F8F9FA" />
        <circle cx="62" cy="49" r="3.2" :fill="INK" stroke="none" /><circle cx="63" cy="48" r="1.1" fill="#fff" stroke="none" />
        <ellipse cx="66" cy="58" rx="4" ry="2.4" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M72 53l4 2-4 2z" fill="#FF8FA3" />
        <ellipse cx="36" cy="92" rx="8" ry="4" fill="#fff" /><ellipse cx="56" cy="92" rx="8" ry="4" fill="#fff" />
      </template>

      <template v-else-if="kind === 'bird'">
        <path d="M14 62l-10-6 2 12z" fill="#4DABF7" />
        <ellipse cx="46" cy="60" rx="32" ry="26" fill="#74C0FC" />
        <ellipse cx="52" cy="70" rx="18" ry="12" fill="#D0EBFF" stroke="none" />
        <path d="M30 56q10 16 26 8" fill="#4DABF7" />
        <circle cx="62" cy="48" r="3.4" :fill="INK" stroke="none" /><circle cx="63" cy="47" r="1.2" fill="#fff" stroke="none" />
        <ellipse cx="66" cy="58" rx="4" ry="2.4" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M76 50l12 4-12 5z" fill="#FFB84D" />
        <path d="M40 86v8M52 86v8" fill="none" stroke="#F59F00" />
      </template>

      <template v-else-if="kind === 'puppy'">
        <ellipse cx="42" cy="74" rx="26" ry="18" fill="#F3D2A4" />
        <path d="M18 70q-10-4-8-12" fill="none" />
        <circle cx="58" cy="46" r="20" fill="#F3D2A4" />
        <path d="M42 34c-10 0-14 18-8 26 4 4 8-8 8-26zM72 32c8 2 10 18 4 24-4 2-6-10-4-24z" fill="#B07B4F" />
        <ellipse cx="66" cy="54" rx="9" ry="7" fill="#FFF3E0" />
        <circle cx="54" cy="44" r="3.2" :fill="INK" stroke="none" /><circle cx="55" cy="43" r="1.1" fill="#fff" stroke="none" />
        <circle cx="66" cy="44" r="3.2" :fill="INK" stroke="none" /><circle cx="67" cy="43" r="1.1" fill="#fff" stroke="none" />
        <ellipse cx="69" cy="51" rx="3.6" ry="2.6" :fill="INK" stroke="none" />
        <path d="M66 57q3 6 6 0" fill="#FF8FA3" />
        <path d="M30 90v-6M50 90v-6" fill="none" />
      </template>

      <template v-else-if="kind === 'duckling' || kind === 'duck'">
        <g :fill="kind === 'duck' ? '#FFFFFF' : '#FFE066'">
          <path d="M14 70c0-14 14-22 30-20h14c14 0 22 10 20 22-2 14-18 20-34 20S14 84 14 70z" />
          <circle cx="62" cy="40" r="15" />
        </g>
        <path d="M28 66q12 14 26 4" fill="none" />
        <path d="M74 40l14 2-14 6z" fill="#FFA94D" />
        <circle cx="64" cy="36" r="3" :fill="INK" stroke="none" /><circle cx="65" cy="35" r="1" fill="#fff" stroke="none" />
        <ellipse cx="66" cy="45" rx="3.6" ry="2.2" fill="#FF9BB3" opacity=".7" stroke="none" />
      </template>

      <template v-else-if="kind === 'cat' || kind === 'kitten'">
        <g :fill="kind === 'cat' ? '#FFA94D' : '#CED4DA'">
          <path d="M16 78c0-14 10-22 28-22s26 8 26 22c0 10-10 14-26 14S16 88 16 78z" />
          <path d="M44 34l4-16 10 10 10-10 4 16c4 6 4 16-4 22-8 6-20 6-28-2-4-6-2-14 4-20z" />
        </g>
        <path d="M16 74q-12-6-6-22" fill="none" />
        <circle cx="52" cy="40" r="3" :fill="INK" stroke="none" /><circle cx="53" cy="39" r="1" fill="#fff" stroke="none" />
        <circle cx="64" cy="40" r="3" :fill="INK" stroke="none" /><circle cx="65" cy="39" r="1" fill="#fff" stroke="none" />
        <path d="M56 46l2 2 2-2z" fill="#FF8FA3" />
        <path d="M58 48q-3 4-6 1M58 48q3 4 6 1M44 46h-8M44 50h-7M72 46h8M72 50h7" fill="none" stroke-width="1.5" />
      </template>

      <template v-else-if="kind === 'calf' || kind === 'elephant'">
        <g :fill="kind === 'elephant' ? '#ADB5BD' : '#CED4DA'">
          <path d="M12 66c0-18 14-28 34-28s30 10 30 28-12 26-32 26-32-8-32-26z" />
          <path d="M70 44c12 0 18 10 16 22-2 8 2 14 6 18" fill="none" stroke-width="7" stroke="#2B2240" />
          <path d="M70 44c12 0 18 10 16 22-2 8 2 14 6 18" fill="none" stroke-width="3" :stroke="kind === 'elephant' ? '#ADB5BD' : '#CED4DA'" />
          <circle cx="66" cy="46" r="16" />
          <path d="M54 36c-12-6-24 4-18 18 4 8 14 6 18-2z" />
        </g>
        <ellipse cx="44" cy="44" rx="7" ry="9" fill="#FFC9D6" stroke="none" />
        <circle cx="70" cy="42" r="3" :fill="INK" stroke="none" /><circle cx="71" cy="41" r="1" fill="#fff" stroke="none" />
        <ellipse cx="72" cy="51" rx="3.6" ry="2.2" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M24 88v6M40 90v6M56 90v6" fill="none" stroke-width="5" />
      </template>

      <template v-else-if="kind === 'butterfly'">
        <path d="M48 46C34 20 8 22 12 40s26 16 36 10zM52 46c14-26 40-24 36-6s-26 16-36 10z" fill="#E599F7" />
        <path d="M48 54c-12 2-26 12-20 24s20 0 20-16zM52 54c12 2 26 12 20 24s-20 0-20-16z" fill="#FFA8C5" />
        <circle cx="28" cy="38" r="4" fill="#fff" stroke="none" /><circle cx="72" cy="38" r="4" fill="#fff" stroke="none" />
        <ellipse cx="50" cy="54" rx="5" ry="18" fill="#845EF7" />
        <path d="M48 36q-6-12-12-14M52 36q6-12 12-14" fill="none" />
        <circle cx="52" cy="42" r="1.8" :fill="INK" stroke="none" />
      </template>

      <template v-else-if="kind === 'child'">
        <path d="M34 64h32l4 26H30z" fill="#74C0FC" />
        <path d="M38 90v6M62 90v6" fill="none" stroke-width="5" />
        <circle cx="50" cy="42" r="20" fill="#F1C9A5" />
        <path d="M30 40c0-14 10-20 20-20s20 6 20 18c-6-6-16-8-26-4-6 2-10 4-14 6z" fill="#6B4226" />
        <circle cx="44" cy="44" r="2.8" :fill="INK" stroke="none" /><circle cx="58" cy="44" r="2.8" :fill="INK" stroke="none" />
        <ellipse cx="40" cy="51" rx="3.4" ry="2" fill="#FF9BB3" opacity=".7" stroke="none" />
        <ellipse cx="62" cy="51" rx="3.4" ry="2" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M45 52q6 5 12 0" fill="none" />
      </template>

      <template v-else-if="kind === 'parents'">
        <path d="M14 58h24l4 32H10zM60 58h24l4 32H56z" fill="#B197FC" />
        <path d="M58 58h28l-2 32H60z" fill="#63E6BE" />
        <path d="M16 90v6M34 90v6M64 90v6M80 90v6" fill="none" stroke-width="5" />
        <path d="M40 66q8 6 18 0" fill="none" stroke-width="4" />
        <circle cx="26" cy="38" r="15" fill="#F1C9A5" />
        <path d="M11 38c-2-14 8-20 15-20s17 6 15 20c-4-8-10-10-15-10s-11 2-15 10z" fill="#3B2A20" />
        <circle cx="72" cy="38" r="15" fill="#E0B48C" />
        <path d="M57 40c-2-16 8-22 15-22s17 6 15 22c-2 10 2 16 4 20H54c2-4 4-10 3-20z" fill="#8C5A3C" />
        <circle cx="72" cy="40" r="12" fill="#E0B48C" stroke="none" />
        <circle cx="21" cy="40" r="2.4" :fill="INK" stroke="none" /><circle cx="31" cy="40" r="2.4" :fill="INK" stroke="none" />
        <circle cx="67" cy="40" r="2.4" :fill="INK" stroke="none" /><circle cx="77" cy="40" r="2.4" :fill="INK" stroke="none" />
        <path d="M22 46q4 4 8 0M68 46q4 4 8 0" fill="none" />
      </template>

      <!-- ============ goals ============ -->
      <template v-else-if="kind === 'carrots'">
        <g v-for="(x, i) in [28, 50, 72]" :key="i" :transform="`rotate(${(i - 1) * 16} ${x} 60)`">
          <path :d="`M${x - 9} 44h18l-9 46z`" fill="#FF922B" />
          <path :d="`M${x - 5} 56h6M${x - 3} 68h5`" fill="none" stroke-width="1.6" />
          <path :d="`M${x} 44c-8-12-6-22 0-26 6 4 8 14 0 26zM${x} 44c-12-6-16-14-12-20 8 2 12 10 12 20zM${x} 44c12-6 16-14 12-20-8 2-12 10-12 20z`" fill="#69DB7C" />
        </g>
      </template>

      <template v-else-if="kind === 'nest'">
        <ellipse cx="38" cy="54" rx="9" ry="12" fill="#A5D8FF" /><ellipse cx="62" cy="54" rx="9" ry="12" fill="#A5D8FF" />
        <ellipse cx="50" cy="50" rx="9" ry="12" fill="#D0EBFF" />
        <path d="M10 58c2 26 18 36 40 36s38-10 40-36c-14 8-66 8-80 0z" fill="#B07B4F" />
        <path d="M16 66q34 10 68 0M24 78q26 9 52 0" fill="none" stroke="#7A4E2D" />
      </template>

      <template v-else-if="kind === 'doghouse'">
        <path d="M18 46h64v46H18z" fill="#F3D9B1" />
        <path d="M10 50 50 16l40 34z" fill="#FF8A6B" />
        <path d="M38 92V70a12 12 0 0 1 24 0v22z" :fill="INK" />
        <path d="M24 60h8M68 60h8" fill="none" />
        <path d="M44 34h12" fill="none" stroke-width="3" />
        <path d="M70 92c0-4 4-6 6-4 2-2 6 0 6 4s-4 4-6 2c-2 2-6 2-6-2z" fill="#fff" stroke-width="1.6" />
      </template>

      <template v-else-if="kind === 'flower'">
        <path d="M50 58v38" fill="none" stroke="#2F9E44" stroke-width="4" />
        <path d="M50 80c-10-10-22-8-24-2 8 6 18 6 24 2zM50 74c8-10 20-10 22-4-8 6-16 6-22 4z" fill="#69DB7C" />
        <g fill="#FF8FB1">
          <circle cx="50" cy="20" r="13" /><circle cx="70" cy="34" r="13" /><circle cx="62" cy="56" r="13" />
          <circle cx="38" cy="56" r="13" /><circle cx="30" cy="34" r="13" />
        </g>
        <circle cx="50" cy="40" r="11" fill="#FFD43B" />
        <circle cx="46" cy="38" r="1.8" :fill="INK" stroke="none" /><circle cx="54" cy="38" r="1.8" :fill="INK" stroke="none" />
        <path d="M46 44q4 3 8 0" fill="none" stroke-width="1.6" />
      </template>

      <!-- ============ scenery ============ -->
      <template v-else-if="kind === 'tree'">
        <path d="M44 96V62h12v34z" fill="#B07B4F" />
        <circle cx="50" cy="40" r="28" fill="#8CE99A" /><circle cx="32" cy="52" r="16" fill="#69DB7C" /><circle cx="68" cy="52" r="16" fill="#69DB7C" />
        <circle cx="40" cy="34" r="4" fill="#FF8FB1" stroke="none" /><circle cx="60" cy="42" r="4" fill="#FF8FB1" stroke="none" />
      </template>
      <template v-else-if="kind === 'pine'">
        <path d="M46 96V80h8v16z" fill="#B07B4F" />
        <path d="M50 6 22 46h12L18 66h14L14 84h72L68 66h14L66 46h12z" fill="#51CF66" />
      </template>
      <template v-else-if="kind === 'bush'">
        <path d="M8 90c-4-14 8-24 18-20 2-12 18-16 26-6 8-10 26-6 26 8 12 0 18 10 14 18z" fill="#8CE99A" />
      </template>
      <template v-else-if="kind === 'blossom'">
        <path d="M50 60v36" fill="none" stroke="#2F9E44" stroke-width="3" />
        <g fill="#FFC9D6"><circle cx="50" cy="34" r="10" /><circle cx="64" cy="44" r="10" /><circle cx="58" cy="60" r="10" /><circle cx="42" cy="60" r="10" /><circle cx="36" cy="44" r="10" /></g>
        <circle cx="50" cy="48" r="7" fill="#FFD43B" />
      </template>
      <template v-else-if="kind === 'cloud'">
        <path d="M18 70c-12 0-12-18 0-18 0-14 18-20 26-8 6-12 28-10 28 6 14-2 18 20 2 20z" fill="#fff" stroke="#D0EBFF" />
      </template>
      <template v-else-if="kind === 'cabbage'">
        <circle cx="50" cy="62" r="30" fill="#8CE99A" />
        <path d="M50 34c-12 10-12 46 0 58M50 34c12 10 12 46 0 58M24 50c12 4 20 14 26 42M76 50c-12 4-20 14-26 42" fill="none" stroke="#2F9E44" stroke-width="1.8" />
      </template>
      <template v-else-if="kind === 'fence'">
        <path d="M6 58h88M6 78h88" fill="none" stroke="#B07B4F" stroke-width="5" />
        <path v-for="x in [12, 34, 56, 78]" :key="x" :d="`M${x} 44l6-8 6 8v50H${x}z`" fill="#E9C99B" />
      </template>
      <template v-else-if="kind === 'cottage'">
        <path d="M18 50h64v44H18z" fill="#FFF3BF" />
        <path d="M10 54 50 20l40 34z" fill="#74C0FC" />
        <path d="M42 94V72h16v22z" fill="#B07B4F" /><path d="M24 62h12v10H24zM64 62h12v10H64z" fill="#D0EBFF" />
      </template>
      <template v-else-if="kind === 'barn'">
        <path d="M14 46 50 18l36 28v48H14z" fill="#FFA8A8" />
        <path d="M38 94V66h24v28zM38 66l24 28M62 66 38 94" fill="#fff" />
        <path d="M44 34h12v10H44z" fill="#fff" />
      </template>
      <template v-else-if="kind === 'hay'">
        <rect x="14" y="54" width="72" height="38" rx="10" fill="#FFD43B" />
        <path d="M26 54v38M50 54v38M74 54v38" fill="none" stroke="#E8A03C" />
      </template>
      <template v-else-if="kind === 'reeds'">
        <path d="M30 96V36M50 96V24M70 96V40" fill="none" stroke="#2F9E44" stroke-width="3" />
        <rect x="26" y="30" width="8" height="18" rx="4" fill="#B07B4F" /><rect x="46" y="18" width="8" height="18" rx="4" fill="#B07B4F" /><rect x="66" y="34" width="8" height="18" rx="4" fill="#B07B4F" />
        <path d="M50 96c-14-10-24-26-24-40M50 96c12-12 24-22 30-30" fill="none" stroke="#51CF66" stroke-width="3" />
      </template>
      <template v-else-if="kind === 'lily'">
        <ellipse cx="50" cy="74" rx="40" ry="16" fill="#99E9F2" stroke="#66D9E8" />
        <path d="M30 72c0-8 20-8 22 0l-12 2z" fill="#69DB7C" />
        <circle cx="62" cy="68" r="7" fill="#FFC9D6" />
      </template>
      <template v-else-if="kind === 'acacia'">
        <path d="M48 96V58l-10-12M52 58l14-10" fill="none" stroke="#B07B4F" stroke-width="6" />
        <ellipse cx="50" cy="38" rx="40" ry="12" fill="#A9E34B" />
      </template>
      <template v-else-if="kind === 'rock'">
        <path d="M14 92c0-18 14-30 30-30 10-8 26-4 32 8 10 4 14 12 12 22z" fill="#DEE2E6" />
      </template>
      <template v-else-if="kind === 'mountain'">
        <path d="M2 94 36 26l20 34 12-16 30 50z" fill="#C5B9F5" />
        <path d="M36 26l-9 18 9-4 8 6zM68 44l-6 10 6-3 6 4z" fill="#fff" stroke="none" />
      </template>
      <template v-else-if="kind === 'balloon'">
        <path d="M50 66q-6 14 2 30" fill="none" stroke-width="1.6" />
        <ellipse cx="50" cy="40" rx="20" ry="25" fill="#FF8FB1" />
        <path d="M46 66h8l-4-4z" fill="#FF8FB1" />
        <ellipse cx="43" cy="30" rx="4" ry="7" fill="#fff" opacity=".6" stroke="none" />
      </template>
      <template v-else-if="kind === 'sunflower'">
        <path d="M50 56v40" fill="none" stroke="#2F9E44" stroke-width="4" />
        <path d="M50 78c-10-8-20-6-22 0 8 4 16 4 22 0z" fill="#69DB7C" />
        <g fill="#FFD43B"><circle v-for="a in 10" :key="a" :cx="50 + 20 * Math.cos(a * 0.628)" :cy="36 + 20 * Math.sin(a * 0.628)" r="8" /></g>
        <circle cx="50" cy="36" r="12" fill="#B07B4F" />
      </template>
      <template v-else-if="kind === 'sun'">
        <g stroke="#FFC94D" stroke-width="4"><path v-for="a in 8" :key="a" :d="`M${50 + 30 * Math.cos(a * 0.785)} ${50 + 30 * Math.sin(a * 0.785)}L${50 + 42 * Math.cos(a * 0.785)} ${50 + 42 * Math.sin(a * 0.785)}`" /></g>
        <circle cx="50" cy="50" r="22" fill="#FFD43B" stroke="#FFC94D" />
      </template>
      <template v-else-if="kind === 'mushroom'">
        <path d="M40 94V60h20v34z" fill="#FFF3E0" />
        <path d="M14 62c0-24 18-36 36-36s36 12 36 36z" fill="#FF8A6B" />
        <circle cx="36" cy="46" r="5" fill="#fff" stroke="none" /><circle cx="60" cy="40" r="6" fill="#fff" stroke="none" />
      </template>
    </g>
  </svg>
</template>
