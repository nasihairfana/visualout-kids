/**
 * How to write each capital letter, for the Write activity.
 *
 * Each letter is a list of strokes in the order a child should draw them, and each stroke is an
 * SVG path drawn in the direction the finger should move. The same paths draw the dotted guide,
 * the "show me" animation, the line that fills in as the child traces, and the finished letter.
 *
 * Coordinates are in a 100 × 120 box: the top of a capital is y = 12, the bottom y = 108 and the
 * middle y = 60. Stroke order follows common early-years print teaching: start at the top, and
 * do straight lines down before lines across.
 */
export const STROKE_BOX = { width: 100, height: 120 }

const O = 'M50 10 C26 10 16 36 16 60 C16 84 26 110 50 110 C74 110 84 84 84 60 C84 36 74 10 50 10'
const C = 'M80 28 C72 15 61 10 50 10 C29 10 18 34 18 60 C18 86 29 110 50 110 C61 110 72 105 80 92'

export const LETTER_STROKES: Record<string, string[]> = {
  a: ['M50 12 L18 108', 'M50 12 L82 108', 'M31 74 L69 74'],
  b: ['M28 12 L28 108', 'M28 12 L54 12 C78 12 78 58 54 58 L28 58', 'M28 58 L58 58 C86 58 86 108 58 108 L28 108'],
  c: [C],
  d: ['M26 12 L26 108', 'M26 12 L46 12 C74 12 84 36 84 60 C84 84 74 108 46 108 L26 108'],
  e: ['M30 12 L30 108', 'M30 12 L76 12', 'M30 60 L68 60', 'M30 108 L76 108'],
  f: ['M32 12 L32 108', 'M32 12 L76 12', 'M32 60 L68 60'],
  g: ['M80 28 C72 15 61 10 50 10 C29 10 18 34 18 60 C18 86 29 110 50 110 C68 110 82 98 82 70 L82 64 L56 64'],
  h: ['M24 12 L24 108', 'M76 12 L76 108', 'M24 60 L76 60'],
  i: ['M50 12 L50 108', 'M30 12 L70 12', 'M30 108 L70 108'],
  j: ['M64 12 L64 82 C64 100 56 108 44 108 C32 108 24 100 22 90', 'M44 12 L84 12'],
  k: ['M28 12 L28 108', 'M76 12 L28 64', 'M42 50 L78 108'],
  l: ['M30 12 L30 108 L76 108'],
  m: ['M18 12 L18 108', 'M18 12 L50 74 L82 12', 'M82 12 L82 108'],
  n: ['M22 12 L22 108', 'M22 12 L78 108', 'M78 108 L78 12'],
  o: [O],
  p: ['M28 12 L28 108', 'M28 12 L56 12 C82 12 82 64 56 64 L28 64'],
  q: [O, 'M58 82 L86 112'],
  r: ['M28 12 L28 108', 'M28 12 L56 12 C82 12 82 62 56 62 L28 62', 'M50 62 L80 108'],
  s: ['M78 26 C72 15 62 10 50 10 C34 10 22 19 22 34 C22 50 36 55 50 59 C66 63 80 70 80 86 C80 102 66 110 50 110 C36 110 25 104 20 93'],
  t: ['M18 12 L82 12', 'M50 12 L50 108'],
  u: ['M22 12 L22 72 C22 96 34 108 50 108 C66 108 78 96 78 72 L78 12'],
  v: ['M20 12 L50 108 L80 12'],
  w: ['M12 12 L30 108 L50 42 L70 108 L88 12'],
  x: ['M22 12 L78 108', 'M78 12 L22 108'],
  y: ['M20 12 L50 60', 'M80 12 L50 60 L50 108'],
  z: ['M22 12 L78 12 L22 108 L78 108'],
}
