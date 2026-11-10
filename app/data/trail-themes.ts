/**
 * Letter Trails worlds: who walks the trail, where to, and what the place looks like.
 * Art is drawn in `components/trail/TrailArt.vue` (PLACEHOLDER: simple original shapes until final
 * illustrations exist; see ASSETS.md). Colours stay soft so the letter tiles are always the
 * clearest thing on screen.
 */
export type TrailArtKind =
  // characters and goals
  | 'bunny' | 'carrots' | 'bird' | 'nest' | 'puppy' | 'doghouse' | 'duckling' | 'duck'
  | 'cat' | 'kitten' | 'calf' | 'elephant' | 'butterfly' | 'flower' | 'child' | 'parents'
  // scenery
  | 'tree' | 'pine' | 'bush' | 'blossom' | 'cloud' | 'cabbage' | 'fence' | 'cottage' | 'barn' | 'hay'
  | 'reeds' | 'lily' | 'acacia' | 'rock' | 'mountain' | 'balloon' | 'sunflower' | 'sun' | 'mushroom'

export interface TrailTheme {
  id: string
  /** Shown to grown-ups and read out: "Bunny finds the carrots". */
  title: string
  hero: TrailArtKind
  goal: TrailArtKind
  /** Said on arrival, e.g. "Bunny found the carrots!" */
  arrival: string
  /** Stars needed before this world opens (all Letter Trails stars together). */
  unlockAt: number
  colors: {
    skyTop: string
    skyBottom: string
    ground: string
    /** The map panel the tiles sit on. */
    map: string
    road: string
    /** Tile border and highlights. */
    accent: string
  }
  /** Decorations around the edges of the screen, never under the tiles. */
  scenery: TrailArtKind[]
}

export const TRAIL_THEMES: TrailTheme[] = [
  {
    id: 'garden',
    title: 'Bunny finds the carrots',
    hero: 'bunny',
    goal: 'carrots',
    arrival: 'Bunny found the carrots!',
    unlockAt: 0,
    colors: { skyTop: '#bfe6ff', skyBottom: '#e8f7ff', ground: '#b9e4a0', map: '#f6e2bd', road: '#e6c48f', accent: '#ff9f6b' },
    scenery: ['cabbage', 'sunflower', 'cabbage', 'fence', 'blossom', 'cloud', 'sun', 'cabbage', 'bush'],
  },
  {
    id: 'forest',
    title: 'Bird finds its nest',
    hero: 'bird',
    goal: 'nest',
    arrival: 'Bird found its nest!',
    unlockAt: 6,
    colors: { skyTop: '#c7ecff', skyBottom: '#eefaf2', ground: '#a9dea0', map: '#e9f5d5', road: '#cfe3a7', accent: '#6bb8f0' },
    scenery: ['tree', 'pine', 'cloud', 'tree', 'mushroom', 'pine', 'blossom', 'cloud', 'bush'],
  },
  {
    id: 'village',
    title: 'Puppy goes home',
    hero: 'puppy',
    goal: 'doghouse',
    arrival: 'Puppy is home!',
    unlockAt: 12,
    colors: { skyTop: '#ffe3c8', skyBottom: '#fff5e8', ground: '#c7e8b0', map: '#fbeedd', road: '#efd2a8', accent: '#f2a65a' },
    scenery: ['cottage', 'tree', 'fence', 'cottage', 'cloud', 'blossom', 'sun', 'bush', 'cottage'],
  },
  {
    id: 'pond',
    title: 'Duckling finds its mum',
    hero: 'duckling',
    goal: 'duck',
    arrival: 'Duckling found its mum!',
    unlockAt: 18,
    colors: { skyTop: '#bdeaff', skyBottom: '#e6f9ff', ground: '#a8dfc4', map: '#dff4ea', road: '#b9e0d2', accent: '#4cc2c4' },
    scenery: ['reeds', 'lily', 'cloud', 'reeds', 'blossom', 'lily', 'sun', 'bush', 'reeds'],
  },
  {
    id: 'farm',
    title: 'Cat finds the kitten',
    hero: 'cat',
    goal: 'kitten',
    arrival: 'Cat found the kitten!',
    unlockAt: 24,
    colors: { skyTop: '#cbe8ff', skyBottom: '#f3f9ff', ground: '#cde6a0', map: '#f7ecd0', road: '#e8cf98', accent: '#e8a03c' },
    scenery: ['barn', 'hay', 'sunflower', 'fence', 'cloud', 'hay', 'tree', 'sun', 'sunflower'],
  },
  {
    id: 'savanna',
    title: 'Little elephant finds mum',
    hero: 'calf',
    goal: 'elephant',
    arrival: 'Little elephant found mum!',
    unlockAt: 30,
    colors: { skyTop: '#ffe0bf', skyBottom: '#fff3df', ground: '#e8d79a', map: '#fbefd2', road: '#ecd29a', accent: '#d98c4a' },
    scenery: ['acacia', 'mountain', 'rock', 'acacia', 'sun', 'cloud', 'rock', 'bush', 'mountain'],
  },
  {
    id: 'meadow',
    title: 'Butterfly finds the flower',
    hero: 'butterfly',
    goal: 'flower',
    arrival: 'Butterfly found the flower!',
    unlockAt: 36,
    colors: { skyTop: '#e3dcff', skyBottom: '#fbf3ff', ground: '#bfe8b4', map: '#f4ecfb', road: '#ddcdee', accent: '#b08ae8' },
    scenery: ['blossom', 'sunflower', 'cloud', 'blossom', 'mountain', 'blossom', 'cloud', 'bush', 'blossom'],
  },
  {
    id: 'park',
    title: 'Little one finds mum and dad',
    hero: 'child',
    goal: 'parents',
    arrival: 'You found mum and dad!',
    unlockAt: 45,
    colors: { skyTop: '#c4e6ff', skyBottom: '#f2fbff', ground: '#b4e3a8', map: '#eef6e2', road: '#d6e6bd', accent: '#ff8fb1' },
    scenery: ['tree', 'balloon', 'cloud', 'mountain', 'tree', 'balloon', 'sun', 'bush', 'blossom'],
  },
]

export const themeById = (id: string | null | undefined) => TRAIL_THEMES.find(t => t.id === id) ?? TRAIL_THEMES[0]!
