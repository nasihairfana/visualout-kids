import type { GameAsk, NumbersPhrase } from './english-numbers'

/**
 * Numbers & Counting: the eleven little adventures. Each one is a themed setting of one of four
 * engines (see app/components/numbers/):
 *   collect  · move things into a basket, fish or cake, counting each one (one-to-one)
 *   find     · tap the balloon / fish / planet with the right number
 *   sequence · put numbers in order (lily pads)
 *   match    · join each number to the group with that many (butterflies, parking spaces)
 *   journey  · the Number Train Adventure: three stations along one railway (its own component)
 */
export type NumberArtKind =
  // things to count
  | 'apple' | 'strawberry' | 'carrot' | 'egg' | 'tomato' | 'pumpkin' | 'pellet' | 'worm' | 'candle'
  | 'butterfly' | 'ladybug' | 'star' | 'flower' | 'duckling' | 'shell'
  // characters and places
  | 'bunny' | 'farmer' | 'bigfish' | 'fish' | 'cake' | 'basket' | 'frog' | 'lilypad' | 'balloon'
  | 'engine' | 'carriage' | 'car' | 'rocket' | 'planet' | 'bear' | 'hen'
  // scenery
  | 'cloud' | 'sun' | 'tree' | 'bush' | 'fence' | 'barn' | 'hay' | 'reeds' | 'seaweed' | 'bubble'
  | 'rock' | 'moon' | 'twinkle' | 'gift' | 'bunting' | 'house' | 'sunflower' | 'mushroom' | 'coral'

export type NumberEngine = 'collect' | 'find' | 'sequence' | 'match' | 'journey'

export interface NumberWorld {
  skyTop: string
  skyBottom: string
  ground: string
  /** Where the horizon sits, 0–100 (100 = all sky, e.g. underwater or space). */
  horizon: number
  scenery: NumberArtKind[]
  /** Tint behind the play area, so numbers always sit on something calm. */
  panel: string
}

export interface NumberGame {
  id: string
  title: string
  engine: NumberEngine
  /** Card colours on the Numbers home (Tailwind token pair). */
  tone: string
  /** Who's in the scene. */
  hero: NumberArtKind
  /** Things to count, one per round in turn, so each round looks a bit different. */
  items: NumberArtKind[]
  /** The spoken instruction: with the round's number for collect and find games ("Collect five!"), on its own for the rest. */
  ask: GameAsk
  /** Said when a round is solved. */
  cheer: NumbersPhrase
  /** All Numbers stars together needed to open it. */
  unlockAt: number
  world: NumberWorld
}

const FARM: NumberWorld = { skyTop: '#BFE6FF', skyBottom: '#E8F6FF', ground: '#B7E4A1', horizon: 58, scenery: ['sun', 'cloud', 'barn', 'tree', 'fence', 'hay', 'sunflower', 'bush', 'cloud'], panel: '#FFF8E7' }
const GARDEN: NumberWorld = { skyTop: '#C5ECFF', skyBottom: '#F0FAFF', ground: '#A8E08F', horizon: 56, scenery: ['cloud', 'sun', 'cloud', 'tree', 'sunflower', 'bush', 'mushroom', 'flower', 'bush'], panel: '#FBFFF2' }
const SEA: NumberWorld = { skyTop: '#7FD0F5', skyBottom: '#3FA3D8', ground: '#F4DFA8', horizon: 86, scenery: ['bubble', 'seaweed', 'bubble', 'coral', 'seaweed', 'rock', 'shell', 'coral', 'seaweed'], panel: '#E8F7FF' }
const POND: NumberWorld = { skyTop: '#C9EEFF', skyBottom: '#EAF9FF', ground: '#9FDB8B', horizon: 30, scenery: ['cloud', 'sun', 'cloud', 'reeds', 'reeds', 'tree', 'flower', 'reeds', 'bush'], panel: '#9EDCF2' }
const PARTY: NumberWorld = { skyTop: '#FFE3EE', skyBottom: '#FFF4E6', ground: '#FFD8C2', horizon: 70, scenery: ['bunting', 'balloon', 'bunting', 'gift', 'balloon', 'gift', 'star', 'balloon', 'gift'], panel: '#FFFDF7' }
const TOWN: NumberWorld = { skyTop: '#D7ECFF', skyBottom: '#F3F9FF', ground: '#C8C8D6', horizon: 55, scenery: ['cloud', 'sun', 'cloud', 'house', 'tree', 'house', 'bush', 'tree', 'house'], panel: '#F4F4F8' }
const SPACE: NumberWorld = { skyTop: '#1E1B4B', skyBottom: '#3B2F7A', ground: '#3B2F7A', horizon: 100, scenery: ['moon', 'twinkle', 'twinkle', 'planet', 'twinkle', 'star', 'twinkle', 'twinkle', 'planet'], panel: '#2E2A63' }
const MEADOW: NumberWorld = { skyTop: '#D3F1FF', skyBottom: '#F5FCFF', ground: '#B5E8A0', horizon: 54, scenery: ['cloud', 'sun', 'cloud', 'flower', 'tree', 'flower', 'bush', 'mushroom', 'flower'], panel: '#FFFFFF' }

export const NUMBER_GAMES: NumberGame[] = [
  { id: 'collect', title: 'Count and Collect', engine: 'collect', tone: 'bg-mint text-mint-ink', hero: 'bunny', items: ['apple', 'carrot', 'strawberry'], ask: 'collect', cheer: 'greatCounting', unlockAt: 0, world: GARDEN },
  { id: 'balloons', title: 'Pop the Balloons', engine: 'find', tone: 'bg-rose text-rose-ink', hero: 'balloon', items: ['balloon'], ask: 'popBalloon', cheer: 'yay', unlockAt: 0, world: PARTY },
  { id: 'fish', title: 'Feed the Fish', engine: 'collect', tone: 'bg-sky text-sky-ink', hero: 'bigfish', items: ['pellet', 'worm'], ask: 'feedTheFish', cheer: 'yum', unlockAt: 0, world: SEA },
  { id: 'matching', title: 'Number Matching', engine: 'match', tone: 'bg-lilac text-lilac-ink', hero: 'butterfly', items: ['butterfly', 'ladybug', 'star', 'flower', 'duckling'], ask: 'matchThem', cheer: 'wellDone', unlockAt: 0, world: MEADOW },
  { id: 'train', title: 'Number Train Adventure', engine: 'journey', tone: 'bg-peach text-peach-ink', hero: 'engine', items: ['carriage'], ask: 'inOrder', cheer: 'allAboard', unlockAt: 0, world: TOWN },
  { id: 'frog', title: 'Number Jumping', engine: 'sequence', tone: 'bg-mint text-mint-ink', hero: 'frog', items: ['lilypad'], ask: 'jump', cheer: 'wellDone', unlockAt: 0, world: POND },
  { id: 'farmer', title: 'Help the Farmer', engine: 'collect', tone: 'bg-butter text-butter-ink', hero: 'farmer', items: ['egg', 'tomato', 'pumpkin'], ask: 'collect', cheer: 'greatCounting', unlockAt: 3, world: FARM },
  { id: 'fishing', title: 'Number Fishing', engine: 'find', tone: 'bg-sky text-sky-ink', hero: 'fish', items: ['fish'], ask: 'catchFish', cheer: 'yay', unlockAt: 6, world: SEA },
  { id: 'birthday', title: 'Birthday Counting', engine: 'collect', tone: 'bg-rose text-rose-ink', hero: 'bear', items: ['candle'], ask: 'candles', cheer: 'happyBirthday', unlockAt: 9, world: PARTY },
  { id: 'parking', title: 'Number Parking', engine: 'match', tone: 'bg-sky text-sky-ink', hero: 'car', items: ['car'], ask: 'parkThem', cheer: 'wellDone', unlockAt: 12, world: TOWN },
  { id: 'space', title: 'Space Adventure', engine: 'find', tone: 'bg-lilac text-lilac-ink', hero: 'rocket', items: ['planet'], ask: 'flyTo', cheer: 'yay', unlockAt: 15, world: SPACE },
]

export const numberGameById = (id: string) => NUMBER_GAMES.find(g => g.id === id)
