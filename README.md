# My First ABC · Visualout Kids

A gentle A–Z alphabet toy for children aged 2–3. It's the first game in **Visualout Kids**, an
open-source educational platform by Visualout.

It's built with Nuxt 4, Vue 3 (`<script setup lang="ts">`), TypeScript and Tailwind CSS v4. It's an
installable PWA that works offline.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run generate     # static build + service worker in .output/public
npx serve .output/public   # or any static host
```

To install it on Android, open the deployed site in Chrome and choose **Add to Home screen** or
**Install app**. Once installed, it runs fully offline.

## What's in the game

| Mode | Route | How it plays |
|---|---|---|
| **Explore** | `/explore?letter=a` | Shows one big letter (upper and lower case), a picture and the word. Tapping the letter says it, and tapping the picture says the word. You can use the big arrows or swipe. The A–Z grid button is for grown-ups. Going past Z shows "Great exploring!" |
| **Find the letter** | `/find` | Asks "Where is A?", shows an A in a frame, and offers 3 big letters. All cards are plain white, so the twin can only be found by its shape, not its colour. There's no score, timer or red. Each session is 5 rounds and ends with a celebration |
| **Match** | `/match` | Shows a letter and 3 pictures, and asks "Which one starts with A?" It follows the same rules as Find the letter |
| Parents | `/parents` | Opened by **holding** the lock button on Home for 2 seconds. It has volume, auto-speak, device-voice fallback, music and progress reset. It also shows which letter shapes the child recognises, plus content status and privacy notes |

### Looking, not guessing

With 3 choices and unlimited tries, tapping at random always wins in the end. Find the letter and
Match are built so that looking pays off and guessing doesn't (see `useChoiceActivity.ts`):

- **Wait, then look.** The choices are dimmed for the first second of each round, and while the question
  is being asked, and the letter to find glows. A tap during the wait does nothing except bounce that letter.
- **Calm pause for guesses.** A wrong tap within 0.8 s of the choices waking up counts as a guess. The
  choices settle, the letter to find pulses, and the voice says "Look carefully!" before asking again.
- **Wrong taps teach.** The tapped letter names itself ("That's M."), then the question repeats.
- **Bigger reward for really looking.** Finding the answer on the first or second try gives a burst of
  stars and "Wonderful!". After two misses the answer glows as a hint, and finding it then gives one star
  and "You found it!". It's still warm, never a fail.
- **Difficulty adapts.** Find the letter starts with very different shapes (A, O, S). When most recent
  rounds are right first time, it moves to mixed letters, then to rounds with a look-alike (E with F,
  B with P). If the child starts guessing again, it steps back down.
- **Honest progress.** A letter only counts as recognised after 3 first-try picks in a row. This is
  stored on the device only and shown in Parent settings.

## Project structure

```
app/
  types/learning.ts            Language-agnostic content model (AlphabetPack, AlphabetLetter, SpokenClip)
  data/english-alphabets.ts    English A–Z content, phrases, asset registration ← edit content here
  composables/
    useAudio.ts                Audio service: one speech channel, fallbacks, synthesized effects, music
    useSoundSettings.ts        Persisted parent sound settings (on-device only)
    useGameProgress.ts         Explored letters, first-try history, difficulty level (on-device only)
    useAlphabetGame.ts         Content access, round generation (avoids look-alike letters), round sessions
    useChoiceActivity.ts       Reusable "pick 1 of 3" engine: wait-then-look, calm pause, hints, no score
  components/
    alphabet/                  AlphabetGameHome, AlphabetExplore, AlphabetCard, AlphabetNavigation,
                               LetterQuiz, LetterObjectMatch, ObjectIllustration
    game/                      Reusable across future games: AudioButton, GameFeedback, GameTopBar,
                               ParentGate, ParentSettings, RoundProgress, SoundToggle, AppIcon
  pages/                       index, explore, find, match, parents
public/
  illustrations/               26 placeholder SVGs (see ASSETS.md)
  audio/en/…                   Empty, waiting for recordings (see ASSETS.md)
  icons/                       App icons
```

### Adding another language later

1. Add `app/data/<lang>-alphabets.ts` that exports an `AlphabetPack`.
2. Pass it to `useAlphabetGame(pack)`. Today it defaults to English. A language picker in Parent
   settings would be the only new UI.
3. Put its recordings in `public/audio/<lang>/`.

The components never hard-code letters, words or phrases.

## Audio behaviour

- Only one voice clip plays at a time. New speech always stops the previous clip.
- The fallback order is: **local recording → on-device system voice (if a parent allows it) → silence.**
  The app never calls an online TTS API. It prefers voices that report `localService`.
  On Android, the system default is the on-device TTS engine.
- The tap, success, try-again and celebrate sounds are synthesized with Web Audio, so they need no
  files. The "try again" sound is a warm rising tone, never a buzzer.
- Sound only plays in response to a tap: a tap on a button, or the tap that started a round.
  Audio stops when the app goes to the background.
- Background music is supported but **off by default**, and no track ships yet.

## Child safety & privacy

The app has no login, ads, purchases, analytics, trackers, external links, notifications or social
features. The only data stored is sound preferences, explored letter ids and whether each letter was
recently picked right first time, kept in `localStorage` on the device. Parents can clear it. Parent settings sit behind a press-and-hold gate,
away from the game controls.

## Accessibility & touch

- Every primary control is at least 64 px. The main controls are 80–96 px.
- Letter ink on pastel backgrounds is high contrast. Correct and wrong states use motion, size and
  voice as well as colour.
- The app turns off pull-to-refresh, page scrolling during play, long-press menus and image
  dragging. Only the Parents page scrolls.
- It respects `prefers-reduced-motion`.
- Layouts adapt to portrait phones, landscape phones and tablets.

## Known gaps before release

- **Offline install not yet verified on a real device.** The build precaches every file (63
  entries, including all routes and illustrations), but the dev sandbox couldn't run a service worker.
  Check this on an Android phone: install → airplane mode → relaunch.
- All audio is still to be recorded, and all illustrations are placeholders. See [ASSETS.md](ASSETS.md).
- Usability testing with parents and children aged 2–3 is still to do.

## License

Open source. Add the Visualout Kids license of choice (e.g. MIT for code, CC BY for artwork) before publishing.
