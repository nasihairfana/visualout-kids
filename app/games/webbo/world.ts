/**
 * Webbo's Letter City: the 3D world. Plain three.js, loaded only by `WebboScene.vue` on /abc/web,
 * so the rest of the app never downloads it. (This folder isn't scanned for auto-imports.)
 *
 * The world only draws and animates. Game rules (what's right, hints, waiting, progress) live in
 * `useChoiceActivity`, shared with Find the letter. Taps arrive through real <button>s that the
 * world keeps positioned over each balloon, so they are big, accessible and need no 3D picking.
 *
 * Layout: buildings stand every SPAN units along x. Webbo sits on building k's roof; the round's
 * three letter balloons float over the street to its right. A caught balloon is pulled in by a web
 * and pops into its picture, which gets pinned to the building as Webbo swings on to the next roof.
 */
import * as THREE from 'three'

export interface WorldLetter {
  id: string
  /** What's printed on the balloon, e.g. "B". */
  label: string
  /** Picture shown when it pops, e.g. /illustrations/ball.svg (null → the word is drawn). */
  picture: string | null
  word: string
}

export interface WorldState {
  waiting: boolean
  calming: boolean
  hint: boolean
}

/** Screen space covered by the game's own controls, so balloons are framed clear of them. */
export interface Insets { top: number, right: number, bottom: number, left: number }

export interface WorldOptions {
  canvas: HTMLCanvasElement
  /** Element the balloon buttons are added to; it should overlay the canvas exactly. */
  hitLayer: HTMLElement
  onPick: (id: string) => void
  /** Play a short effect (the world has no audio of its own). */
  onSound?: (name: 'wiggle' | 'whoosh' | 'giggle') => void
  reducedMotion: boolean
}

export const SPAN = 10
const HEIGHTS = [6, 7.5, 5.5, 8, 6.5, 7, 5.8]
export const FOV = 40
export const BALLOON_R = 1.15
export const MIN_HIT_PX = 88

export const COLORS = {
  ink: 0x2b2240,
  webbo: 0x8e7cf0,
  webboDark: 0x5b47c9,
  web: 0xffffff,
  buildings: [0xffd8c2, 0xcfe7ff, 0xc9f2df, 0xe5dbff, 0xfff0b3, 0xffd6e5],
  balloons: [0xffb59a, 0x9cc8f5, 0x9ad9b8, 0xc3b1f7, 0xffd66b, 0xf7a8c6],
  ground: 0xd7f2e2,
}

const FONT = '900 200px ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif'

// ---- small helpers --------------------------------------------------------------------------

export const ease = {
  out: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
}

interface Tween { start: number, duration: number, update: (p: number) => void, done?: () => void }

export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Index into a list that also works for negative numbers (buildings behind the start). */
export const pick = <T>(list: readonly T[], index: number) => list[((index % list.length) + list.length) % list.length]!

export const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`

/** A thin cylinder between two points: used for every strand of web. */
function makeStrand() {
  const geometry = new THREE.CylinderGeometry(0.045, 0.045, 1, 6, 1, true)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: COLORS.web }))
  mesh.visible = false
  return mesh
}

const UP = new THREE.Vector3(0, 1, 0)
export function setStrand(strand: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) {
  const dir = to.clone().sub(from)
  const length = dir.length()
  strand.visible = length > 0.01
  strand.position.copy(from).addScaledVector(dir, 0.5)
  strand.scale.set(1, Math.max(length, 0.001), 1)
  strand.quaternion.setFromUnitVectors(UP, dir.normalize())
}

// ---- Webbo ----------------------------------------------------------------------------------

/** Webbo: a round, friendly spider. Deliberately not a costumed superhero. */
function buildWebbo() {
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

  const purple = new THREE.MeshLambertMaterial({ color: COLORS.webbo })
  const dark = new THREE.MeshLambertMaterial({ color: COLORS.webboDark })
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const black = new THREE.MeshBasicMaterial({ color: COLORS.ink })
  const pink = new THREE.MeshBasicMaterial({ color: 0xff9fbf })

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), purple)
  head.scale.set(1, 0.92, 0.95)
  body.add(head)
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 18), dark)
  back.position.set(0, 0.05, -0.62)
  body.add(back)

  const eyes = new THREE.Group()
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), white)
    eye.position.set(side * 0.26, 0.16, 0.56)
    eye.scale.set(1, 1.1, 0.6)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), black)
    pupil.position.set(side * 0.24, 0.13, 0.7)
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), white)
    shine.position.set(side * 0.21, 0.19, 0.8)
    eyes.add(eye, pupil, shine)
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), pink)
    cheek.position.set(side * 0.46, -0.12, 0.6)
    cheek.rotation.y = side * 0.55
    body.add(cheek)
  }
  body.add(eyes)

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20, Math.PI), black)
  smile.position.set(0, -0.12, 0.66)
  smile.rotation.z = Math.PI
  body.add(smile)

  // Six bendy legs, three a side, as tubes along gentle curves. The front two limbs are arms.
  const legs: THREE.Mesh[] = []
  for (const side of [-1, 1]) {
    for (let i = 1; i < 4; i++) {
      const z = 0.3 - i * 0.32
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.5, -0.1, z),
        new THREE.Vector3(side * 0.95, 0.3, z * 1.25),
        new THREE.Vector3(side * 1.25, -0.55, z * 1.5),
      ])
      const leg = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.07, 6, false), dark)
      leg.userData.phase = i * 0.8 + (side > 0 ? 0.4 : 0)
      body.add(leg)
      legs.push(leg)
    }
  }

  const arms = [-1, 1].map(side => buildArm(side, purple, dark))
  for (const arm of arms) body.add(arm.group)

  group.userData = { body, eyes, legs, arms }
  return group
}

/** Arm angle (about z) with the hand hanging down and out at Webbo's side. */
const restAngle = (side: number) => -side * 2.35
const Y_AXIS = new THREE.Vector3(0, 1, 0)

interface Arm {
  side: number
  /** Pivots at the shoulder; the arm points along its local +Y. */
  group: THREE.Group
  fingers: THREE.Group[]
  /** The tip of the pointing finger, where webs come from. */
  tip: THREE.Object3D
}

/** An arm with a round mitten hand and four short fingers, for Webbo's "wiggle and point" move. */
function buildArm(side: number, skin: THREE.Material, dark: THREE.Material): Arm {
  const group = new THREE.Group()
  group.position.set(side * 0.6, -0.05, 0.38)
  group.rotation.z = restAngle(side)
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.56, 8), dark)
  upper.position.y = 0.28
  group.add(upper)

  const hand = new THREE.Group()
  hand.position.y = 0.62
  group.add(hand)
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skin)
  palm.scale.set(1, 0.9, 0.7)
  hand.add(palm)
  const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), skin)
  thumb.position.set(-side * 0.15, 0.04, 0.05)
  hand.add(thumb)

  const fingers: THREE.Group[] = []
  let tip = new THREE.Object3D()
  ;[-0.1, -0.035, 0.035, 0.1].forEach((x, i) => {
    const finger = new THREE.Group()
    finger.position.set(x * -side, 0.12, 0)
    const bone = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.12, 4, 8), skin)
    bone.position.y = 0.09
    finger.add(bone)
    finger.userData.phase = i * 0.9
    hand.add(finger)
    fingers.push(finger)
    if (i === 0) {
      tip = new THREE.Object3D()
      tip.position.y = 0.2
      finger.add(tip)
    }
  })
  return { side, group, fingers, tip }
}

// ---- city -------------------------------------------------------------------------------------

interface Building { index: number, height: number, mesh: THREE.Mesh }

export function windowTexture(color: number, height: number) {
  const rows = Math.round(height * 1.1)
  return canvasTexture(128, rows * 48, (ctx) => {
    ctx.fillStyle = hex(color)
    ctx.fillRect(0, 0, 128, rows * 48)
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 3; c++) {
        if ((r * 3 + c) % 7 === 3) continue // a few windows "off", so it isn't a perfect grid
        roundRect(ctx, 14 + c * 38, 12 + r * 48, 24, 28, 7)
        ctx.fill()
      }
    }
  })
}

function buildBuilding(index: number): Building {
  const height = pick(HEIGHTS, index)
  const color = pick(COLORS.buildings, index)
  const side = new THREE.Color(color).multiplyScalar(0.88)
  const roof = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35)
  const front = new THREE.MeshLambertMaterial({ map: windowTexture(color, height) })
  const sides = new THREE.MeshLambertMaterial({ color: side })
  const top = new THREE.MeshLambertMaterial({ color: roof })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(5, height, 4), [sides, sides, top, sides, front, sides])
  mesh.position.set(index * SPAN, height / 2, 0)
  return { index, height, mesh }
}

// ---- balloons ---------------------------------------------------------------------------------

export interface Balloon {
  letter: WorldLetter
  group: THREE.Group
  skin: THREE.Mesh
  label: THREE.Mesh
  halo: THREE.Mesh
  home: THREE.Vector3
  phase: number
  wiggleStart: number
  /** Drawn this many times bigger (the rooftop view's far signs), 1 for balloons. */
  size: number
  /** Leaving (caught or floating away): no longer tappable, ignores bobbing. */
  leaving: boolean
  button: HTMLButtonElement
}

export function letterTexture(label: string) {
  return canvasTexture(256, 256, (ctx) => {
    ctx.font = FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 18
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.strokeText(label, 128, 140)
    ctx.fillStyle = hex(COLORS.ink)
    ctx.fillText(label, 128, 140)
  })
}

let haloTexture: THREE.Texture | null = null
export function glowTexture() {
  haloTexture ??= canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 20, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,201,77,0.95)')
    g.addColorStop(1, 'rgba(255,201,77,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
  return haloTexture
}

/** A white rounded card with the letter's picture, drawn once the image has loaded. */
export function pictureCard(letter: WorldLetter) {
  const material = new THREE.MeshBasicMaterial({ transparent: true })
  const paint = (image: HTMLImageElement | null) => {
    material.map?.dispose()
    material.map = canvasTexture(256, 256, (ctx) => {
      ctx.shadowColor = 'rgba(43,34,64,0.25)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 6
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, 14, 10, 228, 228, 44)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      if (image) {
        ctx.drawImage(image, 44, 36, 168, 168)
      }
      else {
        ctx.fillStyle = hex(COLORS.ink)
        ctx.font = '800 40px ui-rounded, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(letter.word, 128, 136)
      }
    })
    material.needsUpdate = true
  }
  paint(null)
  if (letter.picture) {
    const image = new Image()
    image.onload = () => paint(image)
    image.src = letter.picture
  }
  return new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), material)
}

// ---- the world --------------------------------------------------------------------------------

export class WebboWorld {
  protected renderer: THREE.WebGLRenderer
  protected scene = new THREE.Scene()
  protected camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200)
  protected lastFrame = performance.now()
  protected frame = 0
  protected tweens: Tween[] = []
  protected now = 0

  protected webbo = buildWebbo()
  protected webStrand = makeStrand()
  protected buildings = new Map<number, Building>()
  protected balloons: Balloon[] = []
  protected pictures: THREE.Mesh[] = []
  protected confetti: Array<{ mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }> = []
  protected clouds = new THREE.Group()
  /** Ground and hills: moved along with the camera, so the city can go on for ever. */
  protected backdrop = new THREE.Group()

  /** What each arm is doing: hanging, waving above the head, or pointing at a spot in the world. */
  protected armPose: Array<{ pose: 'rest' | 'up' | 'point', at?: THREE.Vector3 }> = [{ pose: 'rest' }, { pose: 'rest' }]
  /** What the fingers are doing: still, wiggling (like spider legs), or pointing. */
  protected fingers: 'still' | 'wiggle' | 'point' = 'still'
  /** Letters caught since the last finale, for the picture parade. */
  protected session: WorldLetter[] = []
  protected parade: THREE.Mesh[] = []
  /**
   * A finger that went down on Webbo. It stays 'pending' until it has moved a little; then it's
   * a 'throw' (towards the targets: the swipe-to-throw kids love) or a 'turn' (sideways: spin
   * Webbo round to see his face). Lifting a 'pending' finger was a tap on Webbo.
   */
  protected swipe: { pointerId: number, x: number, y: number, mode: 'pending' | 'throw' | 'turn', startTurn: number, greeted: boolean } | null = null
  /** Which way Webbo faces when nobody is holding him (radians about y). */
  protected restTurn = 0.25
  /** Where a child is turning Webbo to, or null to let him settle back to `restTurn`. */
  protected turnGoal: number | null = null
  protected dancing = false
  /** Until when Webbo's legs wiggle as if tickled. */
  protected tickledUntil = 0

  /** Which roof Webbo is on. */
  protected perch = 0
  protected started = false
  protected moving = false
  protected state: WorldState = { waiting: false, calming: false, hint: false }
  protected targetId: string | null = null
  protected insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
  protected portrait = false
  /** The roof point the camera frames; it travels with Webbo during a swing. */
  protected focus = new THREE.Vector3()
  protected cameraGoal = new THREE.Vector3()
  protected lookGoal = new THREE.Vector3()
  protected look = new THREE.Vector3()
  protected slowFrames = 0
  protected frames = 0
  /** How far balloons bob up and down. */
  protected bobAmount = 0.18

  constructor(protected opts: WorldOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.buildScenery()
    this.scene.add(this.webbo, this.webStrand)
    this.resize()
    this.loop = this.loop.bind(this)
    this.frame = requestAnimationFrame(this.loop)
    document.addEventListener('visibilitychange', this.onVisibility)
    const layer = opts.hitLayer
    layer.addEventListener('pointerdown', this.onSwipeStart)
    layer.addEventListener('pointermove', this.onSwipeMove)
    layer.addEventListener('pointerup', this.onSwipeEnd)
    layer.addEventListener('pointercancel', this.endSwipe)
  }

  // ---- public API (called by WebboScene.vue) --------------------------------------------------

  /** Show a new round: three balloons, one of them `targetId`. Swings to the next roof if needed. */
  setRound(choices: WorldLetter[], targetId: string) {
    this.targetId = targetId
    this.finishTweens()
    for (const card of this.parade) this.disposeObject(card)
    this.parade = []
    this.restArms()
    const first = !this.started
    this.started = true
    this.clearBalloons()
    if (first) {
      this.ensureBuildings()
      this.placeWebbo(0)
      this.spawnBalloons(choices, 0)
      this.frameCamera(true)
      return
    }
    // Pin last round's picture to this building, then swing on and bring the new balloons in.
    this.pinPictures()
    const delay = this.swingToNextRoof()
    this.spawnBalloons(choices, delay)
  }

  setState(state: WorldState) {
    this.state = { ...state }
  }

  /** A wrong pick: that balloon wobbles. */
  wiggle(id: string) {
    const balloon = this.balloons.find(b => b.letter.id === id && !b.leaving)
    if (balloon) balloon.wiggleStart = this.now
  }

  /** Bounce the target balloon gently (a tap while the question is still being asked). */
  nudge() {
    this.webboHop(0.25)
  }

  /**
   * The right balloon was picked: wiggle-and-point, web it in, pop it into its picture, and
   * celebrate ('big' = found without the hint: a dance and a bigger burst).
   */
  catch(id: string, celebration: 'big' | 'gentle' = 'big') {
    const balloon = this.balloons.find(b => b.letter.id === id && !b.leaving)
    if (!balloon) return
    balloon.leaving = true
    this.session.push(balloon.letter)
    for (const other of this.balloons) {
      if (other !== balloon) this.floatAway(other)
    }

    const hand = () => this.tipPosition()
    const from = balloon.group.position.clone()
    const popAt = this.webbo.position.clone().add(new THREE.Vector3(1.9, 1.7, 0.9))
    const quick = this.opts.reducedMotion

    // 1. Wiggle, point, and shoot the web.
    this.wiggleAndPoint(balloon.group.position, celebration === 'big' ? 0.5 : 0.3, () => this.tween(quick ? 0 : 0.22, (p) => {
      setStrand(this.webStrand, hand(), hand().lerp(balloon.group.position, p))
    }, () => {
      // 2. Pull the balloon in on the web.
      this.tween(quick ? 0 : 0.55, (p) => {
        balloon.group.position.lerpVectors(from, popAt, ease.inOut(p))
        setStrand(this.webStrand, hand(), balloon.group.position)
      }, () => {
        // 3. Pop! The picture appears where the balloon was.
        this.webStrand.visible = false
        this.removeBalloon(balloon)
        this.burst(popAt, COLORS.balloons)
        const card = pictureCard(balloon.letter)
        card.position.copy(popAt)
        card.userData.building = this.perch
        this.scene.add(card)
        this.pictures.push(card)
        this.tween(quick ? 0 : 0.5, p => card.scale.setScalar(Math.max(0.01, ease.back(p))))
        this.dance(celebration === 'big' ? 1.6 : 0.9, celebration === 'big')
        if (celebration === 'big') this.tween(0, () => this.burst(popAt.clone().add(new THREE.Vector3(0, 1.2, 0)), [0xffc94d, 0xffffff, 0xff8a6b]), undefined, 0.25)
      })
    }))
  }

  /** Webbo shows its web move (wiggle the fingers, point up, whoosh) so the child can copy it. */
  showMove() {
    const up = this.webbo.position.clone().add(new THREE.Vector3(1.5, 6, 0.6))
    this.wiggleAndPoint(up, 0.9, () => this.tween(0.8, () => {}, () => this.restArms()))
  }

  /**
   * The end of a round of five: fireworks, Webbo dances, and the pictures caught fly up into a row.
   * Returns how long it lasts, so the game can show its own celebration afterwards.
   */
  finale() {
    this.finishTweens()
    const letters = this.session.slice(-5)
    this.session = []
    const quick = this.opts.reducedMotion
    // The last picture caught joins the parade instead of staying where it popped.
    for (const card of [...this.pictures]) {
      if (card.userData.pinned) continue
      this.disposeObject(card)
      this.pictures.splice(this.pictures.indexOf(card), 1)
    }
    // Lay the row out in the free part of the screen, just under the game's top controls.
    const rect = this.opts.canvas.getBoundingClientRect()
    const z = this.paradePlaneZ()
    const top = this.toWorld(rect.left + rect.width / 2, rect.top + this.insets.top + 70, z)
    const left = this.toWorld(rect.left + this.insets.left + 50, rect.top + rect.height / 2, z).x
    const right = this.toWorld(rect.right - this.insets.right - 50, rect.top + rect.height / 2, z).x
    const count = Math.max(1, letters.length)
    const spacing = Math.min(2.6, (right - left) / Math.max(1, count - 1))
    const scale = Math.min(0.95, spacing / 2.5)
    const look = new THREE.Vector3((left + right) / 2, top.y - 0.4, 0)
    const rowY = look.y
    letters.forEach((letter, i) => {
      const card = pictureCard(letter)
      const from = this.webbo.position.clone().add(new THREE.Vector3(0, 0.8, 0.6))
      const to = new THREE.Vector3(look.x + (i - (letters.length - 1) / 2) * spacing, rowY + (i % 2) * 0.35, z)
      card.position.copy(from)
      card.scale.setScalar(0.01)
      this.scene.add(card)
      this.parade.push(card)
      this.tween(quick ? 0 : 0.6, (p) => {
        card.position.lerpVectors(from, to, ease.out(p))
        card.scale.setScalar(Math.max(0.01, scale * ease.back(p)))
      }, undefined, quick ? 0 : 0.15 + i * 0.18)
    })
    // Fireworks: bursts of confetti across the sky.
    for (let i = 0; i < 6; i++) {
      const at = new THREE.Vector3(look.x + (i - 2.5) * spacing * 0.9, rowY - 1.5 - (i % 3) * 1.1, z - 2)
      this.tween(0, () => this.burst(at, i % 2 ? COLORS.balloons : [0xffc94d, 0xffffff, 0xff8a6b]), undefined, 0.2 + i * 0.32)
    }
    this.dance(2.6, true)
    return quick ? 0.6 : 2.6
  }

  /** The plane the finale's picture row sits on, in front of everything else. */
  protected paradePlaneZ() {
    return 2.4
  }

  /** Space taken by the game's controls, in CSS pixels. */
  setInsets(insets: Insets) {
    this.insets = insets
    this.frameCamera(true)
  }

  resize() {
    const canvas = this.opts.canvas
    const width = canvas.clientWidth || 1
    const height = canvas.clientHeight || 1
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    const portrait = width / height < 0.9
    if (portrait !== this.portrait && this.started) {
      this.portrait = portrait
      this.relayout()
    }
    this.portrait = portrait
    this.frameCamera(true)
  }

  /** The screen changed between portrait and landscape: move the targets to suit. */
  protected relayout() {
    this.balloons.forEach((b, i) => { if (!b.leaving) b.home.copy(this.balloonSpot(i)) })
  }

  /** The vertical plane (z) a swiped web is drawn to and the finale's pictures line up on. */
  protected targetPlaneZ() {
    return 1.4
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    document.removeEventListener('visibilitychange', this.onVisibility)
    const layer = this.opts.hitLayer
    layer.removeEventListener('pointerdown', this.onSwipeStart)
    layer.removeEventListener('pointermove', this.onSwipeMove)
    layer.removeEventListener('pointerup', this.onSwipeEnd)
    layer.removeEventListener('pointercancel', this.endSwipe)
    for (const b of this.balloons) b.button.remove()
    this.disposeObject(this.scene)
    ;(this.scene.background as THREE.Texture | null)?.dispose()
    haloTexture?.dispose()
    haloTexture = null
    this.renderer.dispose()
  }

  // ---- scenery ----------------------------------------------------------------------------------

  protected buildScenery() {
    this.scene.background = canvasTexture(4, 256, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, '#a9d6ff')
      g.addColorStop(0.65, '#dff0ff')
      g.addColorStop(1, '#fff4e6')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 4, 256)
    })
    this.scene.fog = new THREE.Fog(0xe6f2ff, 45, 120)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfee, 2.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(6, 12, 9)
    this.scene.add(sun)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 80), new THREE.MeshLambertMaterial({ color: COLORS.ground }))
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, 0, -10)
    this.backdrop.add(ground)

    // Soft hills far behind, and clouds that drift slowly. Low-poly: they're blurred by fog anyway.
    const hill = new THREE.MeshLambertMaterial({ color: 0xb8e6cb })
    for (let i = -6; i < 7; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(9 + pick([0, 3, 6], i), 16, 8), hill)
      mesh.position.set(i * 17, -4, -38 - pick([0, 6], i))
      this.backdrop.add(mesh)
    }
    this.scene.add(this.backdrop)
    const puff = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35 })
    for (let i = 0; i < 12; i++) {
      const cloud = new THREE.Group()
      for (let j = 0; j < 3; j++) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(1.5 + (j % 2) * 0.6, 10, 8), puff)
        ball.position.set(j * 1.7 - 1.7, (j % 2) * 0.6, 0)
        cloud.add(ball)
      }
      cloud.position.set(i * 14 - 84, 15 + (i % 3) * 2.5, -26 - (i % 4) * 3)
      this.clouds.add(cloud)
    }
    this.scene.add(this.clouds)
  }

  /** Build the roofs around Webbo and drop the ones (and their pictures) far behind. */
  protected ensureBuildings() {
    for (let i = this.perch - 2; i <= this.perch + 3; i++) {
      if (this.buildings.has(i)) continue
      const building = buildBuilding(i)
      this.buildings.set(i, building)
      this.scene.add(building.mesh)
    }
    for (const [i, building] of this.buildings) {
      if (i >= this.perch - 3) continue
      this.disposeObject(building.mesh)
      this.buildings.delete(i)
    }
    for (const card of [...this.pictures]) {
      if ((card.userData.building as number) >= this.perch - 3) continue
      this.disposeObject(card)
      this.pictures.splice(this.pictures.indexOf(card), 1)
    }
  }

  protected disposeObject(object: THREE.Object3D) {
    this.scene.remove(object)
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      for (const m of materials) {
        (m as THREE.MeshBasicMaterial).map?.dispose()
        m.dispose()
      }
    })
  }

  protected roofOf(index: number) {
    return this.buildings.get(index)?.height ?? pick(HEIGHTS, index)
  }

  protected perchPoint(index: number) {
    return new THREE.Vector3(index * SPAN, this.roofOf(index) + 0.72, 0.4)
  }

  protected placeWebbo(index: number) {
    this.perch = index
    this.webbo.position.copy(this.perchPoint(index))
    this.focus.copy(this.webbo.position)
    this.restTurn = 0.25
    this.webbo.rotation.set(0, this.restTurn, 0)
  }

  // ---- balloons -------------------------------------------------------------------------------

  /** Where the i-th balloon floats, relative to Webbo's roof. Portrait stacks them up a column. */
  protected balloonSpot(i: number) {
    const base = this.perchPoint(this.perch)
    const spots: Array<[x: number, y: number]> = this.portrait
      ? [[5.3, 2.3], [3.4, 5.1], [5.5, 7.9]]
      : [[3.4, 3.4], [6.0, 5.2], [8.5, 3.0]]
    const [x, y] = spots[i]!
    return new THREE.Vector3(base.x + x, base.y + y, 1.4)
  }

  protected spawnBalloons(choices: WorldLetter[], delay: number) {
    choices.forEach((letter, i) => {
      const group = new THREE.Group()
      const color = pick(COLORS.balloons, this.perch * 2 + i)
      const skin = new THREE.Mesh(
        new THREE.SphereGeometry(BALLOON_R, 32, 24),
        new THREE.MeshLambertMaterial({ color, transparent: true, emissive: color, emissiveIntensity: 0.18 }),
      )
      skin.scale.set(1, 1.15, 1)
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.24, 10), skin.material)
      knot.position.y = -BALLOON_R * 1.15 - 0.06
      knot.rotation.x = Math.PI
      const stringPoints = Array.from({ length: 9 }, (_, j) => new THREE.Vector3(Math.sin(j * 1.3) * 0.12, -BALLOON_R * 1.15 - 0.15 - j * 0.28, 0))
      const string = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(stringPoints),
        new THREE.LineBasicMaterial({ color: COLORS.ink, transparent: true, opacity: 0.35 }),
      )
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(BALLOON_R * 1.55, BALLOON_R * 1.55),
        new THREE.MeshBasicMaterial({ map: letterTexture(letter.label), transparent: true, depthWrite: false }),
      )
      label.position.set(0, 0.05, BALLOON_R + 0.02)
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(BALLOON_R * 4.2, BALLOON_R * 4.6),
        new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false }),
      )
      halo.position.z = -0.4
      halo.visible = false
      group.add(halo, skin, knot, string, label)

      const home = this.balloonSpot(i)
      group.position.copy(home).add(new THREE.Vector3(0, -9, 0))
      group.scale.setScalar(0.01)
      this.scene.add(group)

      const button = this.createHitButton(letter)

      const balloon: Balloon = { letter, group, skin, label, halo, home, phase: i * 2.1, wiggleStart: -10, leaving: true, button, size: 1 }
      this.balloons.push(balloon)

      // Rise up from the street and become tappable.
      this.tween(this.opts.reducedMotion ? 0 : 0.7, (p) => {
        group.position.lerpVectors(home.clone().add(new THREE.Vector3(0, -9, 0)), home, ease.out(p))
        group.scale.setScalar(Math.max(0.01, ease.back(p)))
      }, () => { balloon.leaving = false }, delay + i * 0.12)
    })
  }

  /** The invisible button the world keeps over a balloon (or sign) so it can be tapped. */
  protected createHitButton(letter: WorldLetter) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'webbo-hit'
    button.setAttribute('aria-label', `Letter ${letter.label}`)
    button.dataset.letter = letter.id
    button.addEventListener('click', () => this.opts.onPick(letter.id))
    this.opts.hitLayer.appendChild(button)
    return button
  }

  protected floatAway(balloon: Balloon) {
    balloon.leaving = true
    const from = balloon.group.position.clone()
    this.tween(this.opts.reducedMotion ? 0 : 1.1, (p) => {
      balloon.group.position.copy(from).add(new THREE.Vector3(0, p * 7, 0))
      this.setOpacity(balloon, 1 - p)
    }, () => this.removeBalloon(balloon))
  }

  protected removeBalloon(balloon: Balloon) {
    balloon.button.remove()
    this.scene.remove(balloon.group)
    // Everything but the shared glow texture belongs to this balloon alone.
    balloon.group.traverse((o) => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material as THREE.MeshBasicMaterial | undefined
      if (mesh === balloon.label) material?.map?.dispose()
      material?.dispose()
    })
    this.balloons = this.balloons.filter(b => b !== balloon)
  }

  protected clearBalloons() {
    for (const balloon of [...this.balloons]) this.removeBalloon(balloon)
  }

  protected setOpacity(balloon: Balloon, opacity: number) {
    (balloon.skin.material as THREE.MeshLambertMaterial).opacity = opacity
    ;(balloon.label.material as THREE.MeshBasicMaterial).opacity = opacity
  }

  // ---- moving on ----------------------------------------------------------------------------

  /** Stick caught pictures onto the front of the building they were caught at. */
  protected pinPictures() {
    for (const card of this.pictures) {
      if (card.userData.pinned) continue
      card.userData.pinned = true
      const building = card.userData.building as number
      const from = card.position.clone()
      const to = new THREE.Vector3(building * SPAN + (Math.random() - 0.5) * 1.6, this.roofOf(building) - 1.8 - Math.random() * 1.5, 2.08)
      const fromScale = card.scale.x
      const tilt = (Math.random() - 0.5) * 0.24
      this.tween(this.opts.reducedMotion ? 0 : 0.7, (p) => {
        card.position.lerpVectors(from, to, ease.inOut(p))
        card.scale.setScalar(fromScale + (0.62 - fromScale) * p)
        card.rotation.z = tilt * p
      })
    }
  }

  /** Web up to the sky and swing across to the next roof. Returns how long it takes. */
  protected swingToNextRoof() {
    const from = this.webbo.position.clone()
    const next = this.perch + 1
    this.perch = next
    this.ensureBuildings()
    const to = this.perchPoint(next)
    const anchor = new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + 7.5, -0.6)
    // A shallow dip, so Webbo stays in view (the camera frames the roofs, not the street below).
    const low = new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) - 1.2, 0.4)

    if (this.opts.reducedMotion) {
      this.webbo.position.copy(to)
      this.focus.copy(to)
      this.frameCamera(true)
      return 0.1
    }
    this.moving = true
    const hand = () => this.tipPosition()
    this.armPose[1] = { pose: 'point', at: anchor }
    this.fingers = 'point'
    this.opts.onSound?.('whoosh')
    this.tween(0.25, p => setStrand(this.webStrand, hand(), hand().lerp(anchor, p)), () => {
      const curve = new THREE.QuadraticBezierCurve3(from, low, to)
      this.tween(1.25, (p) => {
        const t = ease.inOut(p)
        this.webbo.position.copy(curve.getPoint(t))
        // The camera follows along the street, so Webbo never leaves the screen.
        this.focus.lerpVectors(from, to, t)
        this.frameCamera(false)
        const tangent = curve.getTangent(t)
        this.webbo.rotation.z = -tangent.y * 0.5
        setStrand(this.webStrand, hand(), anchor)
      }, () => {
        this.webStrand.visible = false
        this.webbo.rotation.z = 0
        this.moving = false
        this.restArms()
        this.webboHop(0.35)
      })
    })
    return 1.3
  }

  // ---- Webbo's hands --------------------------------------------------------------------------

  protected get arms() {
    return this.webbo.userData.arms as Arm[]
  }

  /** Where webs come from: the pointing fingertip of Webbo's right hand. */
  protected tipPosition() {
    this.webbo.updateMatrixWorld(true)
    return this.arms[1]!.tip.getWorldPosition(new THREE.Vector3())
  }

  protected restArms() {
    this.armPose = [{ pose: 'rest' }, { pose: 'rest' }]
    this.fingers = 'still'
  }

  /** Raise the right hand towards `at`, wiggle the fingers, then point and whoosh. */
  protected wiggleAndPoint(at: THREE.Vector3, wiggleFor: number, then: () => void) {
    this.armPose[1] = { pose: 'point', at: at.clone() }
    if (this.opts.reducedMotion) {
      this.fingers = 'point'
      then()
      return
    }
    this.fingers = 'wiggle'
    this.opts.onSound?.('wiggle')
    this.tween(wiggleFor, () => {}, () => {
      this.fingers = 'point'
      this.opts.onSound?.('whoosh')
      then()
    })
  }

  /** A happy dance: arms up and waving, a hop, and (for a big one) a spin. */
  protected dance(duration: number, spin: boolean) {
    this.endSwipe()
    this.dancing = true
    this.armPose = [{ pose: 'up' }, { pose: 'up' }]
    this.fingers = 'still'
    if (this.opts.reducedMotion) {
      this.tween(duration, () => {}, () => {
        this.dancing = false
        this.restArms()
      })
      return
    }
    const body = this.webbo.userData.body as THREE.Group
    const turn = this.webbo.rotation.y
    this.tween(duration, (p) => {
      body.position.y = Math.abs(Math.sin(p * Math.PI * (spin ? 3 : 2))) * 0.45
      if (spin) this.webbo.rotation.y = turn + ease.inOut(Math.min(1, p * 1.6)) * Math.PI * 2
    }, () => {
      body.position.y = 0
      this.webbo.rotation.y = turn
      this.dancing = false
      this.restArms()
    })
  }

  /** Turn Webbo towards where the child is turning him (or back to rest), at a gentle, capped speed. */
  protected settleTurn(dt: number) {
    if (this.moving || this.dancing) return
    const goal = this.turnGoal ?? this.restTurn
    const diff = goal - this.webbo.rotation.y
    if (Math.abs(diff) < 0.001) return
    if (this.opts.reducedMotion) {
      this.webbo.rotation.y = goal
      return
    }
    const step = Math.sign(diff) * Math.min(Math.abs(diff) * Math.min(1, dt * 10), 7 * dt)
    this.webbo.rotation.y += step
  }

  /** Move arms and fingers a little towards their pose each frame. */
  protected animateArms(dt: number, t: number) {
    const k = Math.min(1, dt * 12)
    const inverse = this.webbo.quaternion.clone().invert()
    const goal = new THREE.Quaternion()
    const euler = new THREE.Euler()
    this.arms.forEach((arm, i) => {
      const pose = this.armPose[i]!
      if (pose.pose === 'point' && pose.at) {
        const shoulder = arm.group.getWorldPosition(new THREE.Vector3())
        const dir = pose.at.clone().sub(shoulder).normalize().applyQuaternion(inverse)
        goal.setFromUnitVectors(Y_AXIS, dir)
      }
      else if (pose.pose === 'up') {
        goal.setFromEuler(euler.set(0, 0, -arm.side * 0.45 + Math.sin(t * 9 + arm.side) * 0.35))
      }
      else {
        goal.setFromEuler(euler.set(0, 0, restAngle(arm.side) + Math.sin(t * 1.8 + arm.side) * 0.05))
      }
      arm.group.quaternion.slerp(goal, k)
      arm.fingers.forEach((finger, f) => {
        let bend = 0
        if (this.fingers === 'wiggle') bend = Math.sin(t * 26 + finger.userData.phase) * 0.6
        else if (this.fingers === 'point' && i === 1) bend = f === 0 ? 0 : 1.5
        finger.rotation.x += (bend - finger.rotation.x) * Math.min(1, dt * 18)
      })
    })
  }

  // ---- swiping a web from Webbo to a balloon ---------------------------------------------------

  /** Whether a sideways drag on Webbo turns him (only where it can't be mistaken for a throw). */
  protected canTurnByDrag() {
    return false
  }

  protected onSwipeStart = (e: PointerEvent) => {
    if (e.target !== this.opts.hitLayer || this.swipe) return
    const webbo = this.toScreen(this.webbo.position)
    const reach = Math.max(70, this.screenSize(1.6, this.webbo.position))
    if (Math.hypot(e.clientX - webbo.x, e.clientY - webbo.y) > reach) return
    this.swipe = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, mode: 'pending', startTurn: this.webbo.rotation.y, greeted: false }
    this.opts.hitLayer.setPointerCapture(e.pointerId)
  }

  protected onSwipeMove = (e: PointerEvent) => {
    const swipe = this.swipe
    if (!swipe || e.pointerId !== swipe.pointerId) return
    const dx = e.clientX - swipe.x
    const dy = e.clientY - swipe.y
    if (swipe.mode === 'pending') {
      if (Math.hypot(dx, dy) < 16) return
      // Anything heading upwards is a throw; only a clearly sideways drag turns Webbo.
      const upwards = dy < -0.5 * Math.abs(dx)
      swipe.mode = !upwards && this.canTurnByDrag() && this.canTurn() ? 'turn' : 'throw'
    }
    // A turn that then heads clearly up towards the targets becomes a throw after all.
    if (swipe.mode === 'turn' && dy < -60 && -dy > Math.abs(dx) * 0.8) {
      swipe.mode = 'throw'
      this.turnGoal = null
    }
    if (swipe.mode === 'turn') {
      this.turnWebbo(swipe, dx)
      return
    }
    this.fingers = 'point'
    const at = this.toWorld(e.clientX, e.clientY, this.targetPlaneZ())
    this.armPose[1] = { pose: 'point', at }
    setStrand(this.webStrand, this.tipPosition(), at)
  }

  /**
   * Letting go over a balloon picks it, like letting go of a web. (Picking on the way would catch
   * whichever balloon the finger crossed first, not the one the child was aiming for.)
   * A finger that never really moved was a tap on Webbo: he reacts, but nothing is picked.
   */
  protected onSwipeEnd = (e: PointerEvent) => {
    const swipe = this.swipe
    if (!swipe || e.pointerId !== swipe.pointerId) return
    const aimed = swipe.mode === 'throw' && this.balloons.find((b) => {
      if (b.leaving) return false
      const box = b.button.getBoundingClientRect()
      return e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom
    })
    const tapped = swipe.mode === 'pending'
    this.endSwipe()
    if (aimed) {
      this.opts.onSound?.('whoosh')
      this.opts.onPick(aimed.letter.id)
    }
    else if (tapped && this.canTurn()) {
      this.greet(true)
    }
  }

  protected endSwipe = () => {
    if (!this.swipe) return
    try { this.opts.hitLayer.releasePointerCapture(this.swipe.pointerId) }
    catch { /* already released */ }
    const threw = this.swipe.mode === 'throw'
    this.swipe = null
    this.turnGoal = null
    // Only a throw moved the arms; a turn's wave finishes on its own.
    if (threw) {
      this.webStrand.visible = false
      this.restArms()
    }
  }

  // ---- playing with Webbo (never part of the game's scoring) -----------------------------------

  /** Webbo can be played with except while he's jumping, swinging or dancing. */
  protected canTurn() {
    return !this.moving && !this.dancing
  }

  /** The way Webbo faces when he looks straight at the child (towards the camera). */
  protected faceCameraTurn() {
    return Math.atan2(this.camera.position.x - this.webbo.position.x, this.camera.position.z - this.webbo.position.z)
  }

  /** Follow the finger round; when he ends up facing the child, he says hello. */
  protected turnWebbo(swipe: NonNullable<WebboWorld['swipe']>, dx: number) {
    const face = this.faceCameraTurn()
    // Reduced motion: no following the finger, he simply turns to face the child.
    this.turnGoal = this.opts.reducedMotion ? face : swipe.startTurn + dx * 0.014
    const off = Math.atan2(Math.sin(this.webbo.rotation.y - face), Math.cos(this.webbo.rotation.y - face))
    if (!swipe.greeted && Math.abs(off) < 0.5) {
      swipe.greeted = true
      this.greet(false)
    }
  }

  /** A wave, a giggle and a little leg wiggle (and a hop, for a tap). */
  protected greet(hop: boolean) {
    this.opts.onSound?.('giggle')
    this.tickledUntil = this.now + 0.7
    this.armPose[0] = { pose: 'up' }
    this.tween(1, () => {}, () => { if (!this.dancing) this.armPose[0] = { pose: 'rest' } })
    if (hop) this.webboHop(0.35)
  }

  /** Screen position (CSS pixels, relative to the page) of a point in the world. */
  protected toScreen(point: THREE.Vector3) {
    const rect = this.opts.canvas.getBoundingClientRect()
    const p = point.clone().project(this.camera)
    return { x: rect.left + (p.x * 0.5 + 0.5) * rect.width, y: rect.top + (-p.y * 0.5 + 0.5) * rect.height }
  }

  /** How many pixels tall something `size` units tall looks at `point`. */
  protected screenSize(size: number, point: THREE.Vector3) {
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    return (size / (2 * this.camera.position.distanceTo(point) * tan)) * this.opts.canvas.clientHeight
  }

  /** The world point under a screen position, on the plane z = `z`. */
  protected toWorld(clientX: number, clientY: number, z: number) {
    const rect = this.opts.canvas.getBoundingClientRect()
    const ndc = new THREE.Vector3(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1, 0.5)
    const dir = ndc.unproject(this.camera).sub(this.camera.position).normalize()
    const distance = (z - this.camera.position.z) / dir.z
    return this.camera.position.clone().addScaledVector(dir, distance)
  }

  /** Hills drift by slower than the city (a little depth); clouds wrap around as they drift. */
  protected moveScenery(t: number, still: boolean) {
    this.backdrop.position.x = this.camera.position.x * 0.7
    this.clouds.position.x = this.camera.position.x * 0.8 + (still ? 0 : (t * 0.25) % 14)
  }

  protected webboHop(height: number) {
    if (this.opts.reducedMotion) return
    const body = this.webbo.userData.body as THREE.Group
    this.tween(0.5, (p) => { body.position.y = Math.sin(p * Math.PI) * height })
  }

  protected burst(at: THREE.Vector3, colors: number[]) {
    if (this.opts.reducedMotion) return
    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.14),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide, transparent: true }),
      )
      mesh.position.copy(at)
      const angle = (i / 22) * Math.PI * 2
      const velocity = new THREE.Vector3(Math.cos(angle) * 4, Math.sin(angle) * 4 + 3, (Math.random() - 0.5) * 2)
      this.scene.add(mesh)
      this.confetti.push({ mesh, velocity, life: 1.1 })
    }
  }

  // ---- camera ---------------------------------------------------------------------------------

  /** Frame Webbo's roof and the balloons, inside the area not covered by the game's controls. */
  protected frameCamera(snap: boolean) {
    const canvas = this.opts.canvas
    const W = canvas.clientWidth || 1
    const H = canvas.clientHeight || 1
    const base = this.focus
    // The world box to keep in view, relative to Webbo's roof.
    const box = this.portrait
      ? { x0: -1.6, x1: 7.2, y0: -1.4, y1: 9.6 }
      : { x0: -1.8, x1: 10.0, y0: -1.4, y1: 6.8 }
    const freeW = Math.max(0.3, (W - this.insets.left - this.insets.right) / W)
    const freeH = Math.max(0.3, (H - this.insets.top - this.insets.bottom) / H)
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const boxW = box.x1 - box.x0
    const boxH = box.y1 - box.y0
    const distance = Math.max(boxW / (2 * tan * this.camera.aspect * freeW), boxH / (2 * tan * freeH))
    // Shift the aim so the box sits in the middle of the free area, not the middle of the screen.
    const visibleH = 2 * distance * tan
    const visibleW = visibleH * this.camera.aspect
    const shiftX = ((this.insets.right - this.insets.left) / 2 / W) * visibleW
    const shiftY = ((this.insets.top - this.insets.bottom) / 2 / H) * visibleH
    this.lookGoal.set(base.x + (box.x0 + box.x1) / 2 + shiftX, base.y + (box.y0 + box.y1) / 2 + shiftY, 0.5)
    this.cameraGoal.set(this.lookGoal.x, this.lookGoal.y + 0.6, this.lookGoal.z + distance)
    if (snap || this.opts.reducedMotion) {
      this.camera.position.copy(this.cameraGoal)
      this.look.copy(this.lookGoal)
      this.camera.lookAt(this.look)
    }
  }

  // ---- frame loop -----------------------------------------------------------------------------

  /** Jump every running animation to its end (e.g. Next tapped while a balloon is still popping). */
  protected finishTweens() {
    for (let guard = 0; this.tweens.length && guard < 20; guard++) {
      for (const tween of this.tweens.splice(0)) {
        tween.update(1)
        tween.done?.()
      }
    }
  }

  protected tween(duration: number, update: (p: number) => void, done?: () => void, delay = 0) {
    this.tweens.push({ start: this.now + delay, duration, update, done })
  }

  protected onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame)
    }
    else {
      this.lastFrame = performance.now()
      this.frame = requestAnimationFrame(this.loop)
    }
  }

  protected loop() {
    this.frame = requestAnimationFrame(this.loop)
    const time = performance.now()
    const dt = Math.min((time - this.lastFrame) / 1000, 0.1)
    this.lastFrame = time
    this.now += dt
    this.watchSpeed(dt)

    // Tweens (copy first: finishing one may start another).
    for (const tween of [...this.tweens]) {
      if (this.now < tween.start) continue
      const p = tween.duration <= 0 ? 1 : Math.min(1, (this.now - tween.start) / tween.duration)
      tween.update(p)
      if (p >= 1) {
        this.tweens.splice(this.tweens.indexOf(tween), 1)
        tween.done?.()
      }
    }

    const still = this.opts.reducedMotion
    const t = this.now

    // Webbo breathes, blinks and wiggles its legs.
    const { body, eyes, legs } = this.webbo.userData as { body: THREE.Group, eyes: THREE.Group, legs: THREE.Mesh[] }
    if (!still) {
      body.scale.set(1, 1 + Math.sin(t * 2.2) * 0.025, 1)
      const busy = this.moving || t < this.tickledUntil
      for (const leg of legs) leg.rotation.x = Math.sin(t * (busy ? 9 : 2) + leg.userData.phase) * (busy ? 0.25 : 0.06)
    }
    this.moveScenery(t, still)
    eyes.scale.y = (t % 4.2) > 4.05 ? 0.15 : 1
    this.animateArms(dt, still ? 0 : t)
    this.settleTurn(dt)

    // Balloons bob, dim while the question is asked, wobble when wrong, glow as a hint.
    const dim = this.state.calming ? 0.35 : this.state.waiting ? 0.6 : 1
    for (const b of this.balloons) {
      if (!b.leaving) {
        const bob = still ? 0 : Math.sin(t * 1.3 + b.phase) * this.bobAmount
        b.group.position.set(b.home.x, b.home.y + bob, b.home.z)
        const current = (b.skin.material as THREE.MeshLambertMaterial).opacity
        this.setOpacity(b, current + (dim - current) * Math.min(1, dt * 8))
        const age = t - b.wiggleStart
        b.group.rotation.z = age < 0.7 ? Math.sin(age * 28) * 0.28 * (1 - age / 0.7) : (still ? 0 : Math.sin(t * 0.9 + b.phase) * 0.05)
        const hinted = this.state.hint && !this.state.waiting && b.letter.id === this.targetId
        b.halo.visible = hinted
        if (hinted) b.halo.scale.setScalar(1 + Math.sin(t * 4) * 0.12)
        const goal = (this.state.calming ? 0.92 : 1) * b.size
        b.group.scale.setScalar(b.group.scale.x + (goal - b.group.scale.x) * Math.min(1, dt * 8))
      }
    }

    // Confetti falls and fades.
    for (const c of [...this.confetti]) {
      c.life -= dt
      c.velocity.y -= 9 * dt
      c.mesh.position.addScaledVector(c.velocity, dt)
      c.mesh.rotation.x += dt * 8
      c.mesh.rotation.y += dt * 5
      ;(c.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, c.life / 1.1)
      if (c.life <= 0) {
        this.scene.remove(c.mesh)
        c.mesh.geometry.dispose()
        ;(c.mesh.material as THREE.Material).dispose()
        this.confetti.splice(this.confetti.indexOf(c), 1)
      }
    }

    // Camera glides after Webbo, slowly, so it never feels like a ride.
    if (!still) {
      const k = 1 - Math.exp(-dt * 2.2)
      this.camera.position.lerp(this.cameraGoal, k)
      this.look.lerp(this.lookGoal, k)
      this.camera.lookAt(this.look)
    }

    this.renderer.render(this.scene, this.camera)
    this.placeButtons()
  }

  /** Keep each balloon's button over the balloon on screen, at least MIN_HIT_PX big. */
  protected placeButtons() {
    const H = this.opts.canvas.clientHeight
    const W = this.opts.canvas.clientWidth
    // Where Webbo is on screen (the start of a swipe), for tests and debugging.
    const webbo = this.toScreen(this.webbo.position)
    const where = `${Math.round(webbo.x)},${Math.round(webbo.y)}`
    if (this.opts.hitLayer.dataset.webbo !== where) this.opts.hitLayer.dataset.webbo = where
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const point = new THREE.Vector3()
    for (const b of this.balloons) {
      point.copy(b.group.position).project(this.camera)
      const x = (point.x * 0.5 + 0.5) * W
      const y = (-point.y * 0.5 + 0.5) * H
      const depth = this.camera.position.distanceTo(b.group.position)
      const diameter = (BALLOON_R * 2.3 * b.size / (2 * depth * tan)) * H
      const size = Math.max(MIN_HIT_PX, diameter * 1.25)
      const style = b.button.style
      style.width = style.height = `${size}px`
      style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`
      b.button.disabled = b.leaving
    }
  }

  /** If the phone struggles, drop to a lighter resolution rather than stutter. */
  protected watchSpeed(dt: number) {
    if (this.frames > 240) return
    this.frames++
    if (dt > 0.045) this.slowFrames++
    if (this.frames === 240 && this.slowFrames > 80 && this.renderer.getPixelRatio() > 1) {
      this.renderer.setPixelRatio(1)
      this.resize()
    }
  }
}

/** Whether this device can draw the 3D city at all. */
export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  }
  catch {
    return false
  }
}
