# My First ABC — assets to supply

The game ships with generated speech and placeholder artwork. This file lists exactly
what is still a placeholder and where real files go. **Nothing in the code points at a file
that doesn't exist**: a path is only switched on once it is listed in
`app/data/audio-manifest.json`, which `npm run audio` writes from what is on disk.

## Current status

| Asset | Status | What the app does meanwhile |
|---|---|---|
| Letter recordings (26) | **Generated** (Kokoro `af_heart`) | Can be replaced by human recordings at any time |
| Word recordings (26) | **Generated** | Same as above |
| Phrase recordings (113, instructions & praise) | **Generated** | Same as above |
| Object sounds (optional) | **Missing** | No sound. These are optional extras |
| Background music (optional) | **Missing** | The toggle is disabled in Parent settings |
| Illustrations (26) | **Placeholder SVGs** in `public/illustrations/` | Simple stand-in drawings. If a file fails to load, an emoji is shown instead |
| Interaction sounds (tap, success, try-again, celebrate) | **Done** | Generated live with the Web Audio API, so no files are needed |
| App icons | Done (first pass) | `public/icons/icon.svg`. Re-run `npx pwa-assets-generator` after changing it |

## Audio

Format: **MP3, mono, 44.1 kHz, about 96 kbps**. Trim the silence at both ends (leave about 50 ms),
normalise to about −16 LUFS, and keep each clip under 2 seconds where you can. Use one warm,
friendly adult voice for everything, and speak slowly and clearly.

### 1. Letter names: `public/audio/en/letters/{id}.mp3`

`a.mp3` … `z.mp3`. Say the **letter name** ("ay", "bee", "see"), not the phonics sound.
(A phonics pack can be added later as its own data set.)

### 2. Words: `public/audio/en/words/{word-slug}.mp3`

```
apple ball cat dog elephant fish goat house ice-cream juice kite lion mango
nest orange parrot queen rabbit sun tiger umbrella van watermelon xylophone yo-yo zebra
```

### 3. Phrases: `public/audio/en/phrases/{name}.mp3`

| File | Text |
|---|---|
| `where-is-{id}.mp3` (26) | "Where is A?" |
| `which-starts-with-{id}.mp3` (26) | "A. Which one starts with A?" |
| `{id}-is-for.mp3` (26) | "A is for Apple!" |
| `thats-{id}.mp3` (26) | "That's A." Said when a wrong letter is tapped |
| `wonderful.mp3` | "Wonderful!" |
| `well-done.mp3` | "Yay! Well done!" |
| `you-found-it.mp3` | "You found it!" Softer praise, used after the hint |
| `look-carefully.mp3` | "Look carefully!" Said gently, after a too-quick guess |
| `try-again.mp3` | "Let's try again!" |
| `almost.mp3` | "Almost! Try another one." |
| `great-exploring.mp3` | "Great exploring!" |
| `great-finding.mp3` | "Great finding!" |
| `great-matching.mp3` | "Great matching!" |
| `lets-write-{id}.mp3` (26) | "Let's write A!" Said when a letter appears in Write |
| `you-wrote-{id}.mp3` (26) | "You wrote A!" Said when the child finishes tracing it |
| `great-writing.mp3` | "Great writing!" |

### 4. Object sounds (optional): `public/audio/en/objects/{word-slug}.mp3`

These are short, gentle and never startling: a crunch for apple, a soft "meow" for cat, a bounce
for ball, a soft "baa" for goat. Use a **gentle purr, not a roar** for the lion and tiger. Keep them
under 1.5 seconds. They only play after the word, when the child taps the picture.

### 5. Background music (optional): `public/audio/music/{name}.mp3`

Use a soft loop of 30 to 60 seconds with no lyrics. Set `backgroundMusic` in the pack. Music
stays **off by default**, and a parent has to turn it on.

### Generated speech (`npm run audio`)

`scripts/generate-audio.mjs` voices every letter, word and phrase with
[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), an open (Apache-2.0) neural TTS model that runs
on your machine. Nothing is sent online and the app itself never calls a TTS service. Voice
`af_heart` at 0.9× speed. Each clip is trimmed, gently compressed, brought to −16 LUFS under a peak limiter and saved in the
format above.

```sh
npm run audio              # voice anything missing, then rewrite the manifest
npm run audio -- --force   # re-voice clips the script made before (after changing the voice or text)
npm run audio -- --scan    # just rescan public/audio and rewrite the manifest
```

The first run downloads the model (about 330 MB) to the Hugging Face cache. The clip list comes from
`audioCatalog()` in `app/data/english-alphabets.ts`, so a new phrase there is picked up
automatically. If the model mispronounces something, add a respelling in `engineText()` in the
script. It already says "Eh is for Apple" so "A" isn't read as the article "uh".

### Replacing with human recordings

Copy the file over the generated one at the same path, then run `npm run audio -- --scan`.
The manifest's `generated` map stores a hash of every file the script made. A file you replace no
longer matches, so it drops out of that map and is never overwritten, even with `--force`.

The service worker precaches everything in `public/audio`, so recordings work offline after the
next install or update. If a registered file is missing or broken, the app logs nothing to the
child. It falls back to the device voice and doesn't request that file again during the session.

## Illustrations: `public/illustrations/{word-slug}.svg`

All 26 files exist as **placeholders**. Each one starts with a `PLACEHOLDER` comment. To replace one:

1. Overwrite the file, keeping the same name. SVG is preferred. For WebP or PNG, change the
   extension in `assetsFor()`.
2. Use a square canvas, put the object centred with about 8% padding, and use a transparent
   background. The card colour comes from the theme.
3. Keep each file under 30 KB for fast loading on low-end Android devices.
4. Add the letter id to `FINAL_ART` so Parent settings reports it as final.
