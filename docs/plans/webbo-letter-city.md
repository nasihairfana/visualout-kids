# Plan: Webbo's Letter City (3D letter game)

**Status:** Milestones 1 and 2 built (playable with placeholder art). See "What was built" at the end.
**For:** ages 2–3, as part of My First ABC.

## Why an original hero, not Spider-Man

The request was a Spider-Man letter game. Spider-Man is owned by Marvel/Disney, so using him, or a
close look-alike (red-and-blue web-slinger with a spider emblem), in a public Visualout game would
infringe their trademark and copyright. A takedown would undo the goodwill Visualout Kids is meant
to build.

Instead we create **Webbo**, a friendly little spider that Visualout owns. Toddlers get the same
thrill (swinging between buildings, shooting webs), and Webbo can become the Visualout Kids mascot
for later games.

Design rule for Webbo's art: round, cute and clearly a *spider*, in Visualout Kids pastels. No mask,
no suit, no spider emblem on the chest, and no red-and-blue scheme.

## How it plays

1. Webbo hangs from a rooftop in a soft, toy-like 3D city. Three letter balloons float between the
   buildings.
2. The voice says **"Catch the letter B!"** while the balloons wait (dimmed), exactly like Find the
   letter.
3. The child taps a balloon:
   - **Right:** Webbo shoots a web, swings across, and the balloon pops into its picture (a ball that
     bounces onto a roof). Praise, then "B is for Ball!"
   - **Wrong:** the balloon wobbles and names itself ("That's D."), then the question repeats. No
     red, no buzzer.
4. After 5 letters, Webbo swings home past all the pictures caught on the way, then celebrates.

### Rules carried over from Find the letter

These already exist in `useChoiceActivity.ts`, and the game should reuse them rather than copy them:

- Choices wait while the question is asked; a tap during the wait just bounces the target.
- A wrong tap within 0.8 s is treated as a guess: calm pause and "Look carefully!".
- Hint glow after 2 misses, with a smaller celebration when the hint was needed.
- Difficulty adapts from first-try picks, and progress is stored on the device only.

## Made for 2–3-year-olds

- **One tap does everything.** No steering, joystick, jumping, timer or score. Webbo can't fall or
  lose.
- **Gentle camera.** Slow, steady swings; no shaking, spinning or fast zooms (motion sickness).
  Respect `prefers-reduced-motion`: cut between rooftops instead of swinging.
- **Big targets.** Balloons are at least 80 px on screen at their smallest, and the tap area is
  larger than the balloon.
- **Calm.** Soft colours, no flashing, no villains or fighting.

## Technical plan

| Area | Plan |
|---|---|
| Route | `/abc/web`, a 5th card on the My First ABC home. Could move to its own game at `/web` later |
| 3D | [three.js](https://threejs.org) through [TresJS](https://tresjs.org) (Vue components for three.js). Both MIT licensed |
| Bundle | Loaded only on this route (lazy), so the other modes stay fast. Target: under 1.5 MB extra including models |
| Models | Low-poly glTF (`.glb`), compressed with Draco or meshopt. Target under 300 KB for Webbo and the city together |
| Performance | Target 60 fps on a low-end Android phone (for example, 3 GB RAM). Cap device pixel ratio at 2, no real-time shadows (baked into textures), fewer than 50k triangles on screen |
| Fallback | If WebGL is missing, or the first frames are too slow, show a flat 2D version of the same game (same rounds, same voice) |
| Offline | The service worker already caches every built file; check `.glb` is added to the Workbox `globPatterns` |
| Security | No change to the content security policy: everything is served from our own domain |
| Audio | Reuse letter, word and phrase clips. New phrases: `catch-the-letter-{a…z}`, `great-swinging`. Add them to the pack so `npm run audio` generates them |
| Progress | Count catches in the same first-try history as Find the letter, under a new mode `web` |

### Code structure (proposal)

```
app/pages/abc/web.vue                 Page; lazy-loads the scene
app/components/web/WebboGame.vue      Round logic via useChoiceActivity, UI overlay (top bar, rewards)
app/components/web/WebboScene.vue     TresJS canvas: city, Webbo, balloons, camera rig
app/components/web/WebboFlat.vue      2D fallback with the same props and events
public/models/webbo.glb, city.glb     3D art (placeholders first)
```

The scene only renders and animates; all game rules stay in `useChoiceActivity`, so they're shared
with Find the letter and can be tested without WebGL.

## Art

- **Webbo:** needs an illustrator or 3D artist. Until then, a simple placeholder made of spheres
  (body, head, eyes, eight short legs), clearly marked as a placeholder in `ASSETS.md`.
- **City:** a few modular low-poly buildings in the pastel palette, reused and recoloured.
- **Pictures:** the 26 object pictures pop out as flat cards facing the camera, so the existing
  illustrations work without 3D versions.

## Milestones

1. **Prototype:** placeholder Webbo and boxes for buildings; tap a balloon and Webbo swings. Measure
   fps and bundle size on a real low-end Android phone. *Stop here if performance isn't good enough.*
2. **Game:** rounds, voice and progress wired to `useChoiceActivity`; 2D fallback; reduced motion.
3. **Polish:** final Webbo model and city, sounds, celebration.
4. **Test with toddlers**, as in issue #5, then release.

## What was built

Playable at `/abc/web`, with a 5th card on the My First ABC home.

| Planned | Built | Why it differs |
|---|---|---|
| three.js through TresJS | **Plain three.js** in `app/games/webbo/world.ts`, loaded on demand by `WebboScene.vue` | The scene is one hand-written animation loop; TresJS would add a dependency without saving code |
| `.glb` models | **Shapes built in code** (spheres, tubes, boxes) | No art yet. Final models can replace `buildWebbo()` / `buildBuilding()` later |
| 3D picking | **Invisible `<button>` per balloon**, kept over it each frame | Bigger tap targets, keyboard and screen-reader access, and easy to test |
| Webbo swings to the balloon | **Webbo webs the balloon in** to its roof, then swings to the next roof between rounds | Easier to follow for a toddler: one clear "catch", then one clear "swing" |

Added after a child's feedback ("where are the spider's hands?"):

- **Webbo's web move.** Two of Webbo's eight limbs are arms with mitten hands. Before each web it
  wiggles its fingers and points (whoosh!). It's a move toddlers can copy with their own hands, taken
  from the Itsy Bitsy Spider finger play and deliberately not Spider-Man's hand sign. A "Do it with
  me!" intro teaches it once per visit, and a hand button shows it again. No camera: it's pretend play.
- **Swipe to throw a web.** Besides tapping, a swipe from Webbo that is released over a balloon picks
  it. Picking on release, not on crossing, means the balloon aimed at is the one caught.
- **Celebrations.** Each catch gets confetti and a dance with arms up; a first-try catch adds a spin
  and a second burst. After five balloons, fireworks and a parade of the five pictures play before
  "Great swinging!".

**Rooftop view (now the default).** Inspired by the over-the-shoulder rooftop shots common in
city-swinging games (the camera idea only; Webbo and the city stay our own): the camera stands
behind Webbo on a roof, looking out over a pastel city. Three nearby buildings carry big letter
signs; picking one makes Webbo web its sign and jump over in one gentle arc. Toddler rules: letters
only on the three nearest buildings, signs drawn bigger with distance so they look the same size,
and a camera that only glides forward (no roll, spin or upside-down swing). Portrait uses a wider
lens and a zigzag staircase of buildings so the signs never overlap. The original side-on view
remains at `/abc/web?view=side`.

**Playing with Webbo** (after kids wanted to turn him to see his face): in the rooftop view a
sideways drag turns him; facing the child he waves and giggles, and springs back on release. A tap
makes him hop and wave in every view. It never counts as a pick. Swipe-to-throw (a favourite) wins
every tie: upward drags always throw, a sideways drag that heads up becomes a throw, and the side
view keeps every drag a throw.

Size: three.js and the world are a separate ~140 KB (gzipped) file, so they load only on this page.

Tested in headless Firefox with real mouse clicks: full 5-round games in portrait (375×812) and
landscape (812×375), with WebGL off (2D fallback) and with reduced motion. All finish with "Great
swinging!", progress is saved under mode `web`, and there are no content-security-policy violations
or console errors. Tap targets measured 108–136 px.

Not done yet: final Webbo and city art (milestone 3), recordings for the new phrases, testing on a
real low-end Android phone (performance go / no-go) and with toddlers (milestone 4).

## Open questions

- Is a 3D game the right fit for ages 2–3, or should it target 3–5 and become its own game?
- Name: "Webbo" is a working name. Check it isn't already a children's character or trademark
  before the art is commissioned.
- Who makes the Webbo art, and in what budget?
- Portrait, landscape, or both? Swinging reads best in landscape.
