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
  reducedMotion: boolean
}

const SPAN = 10
const HEIGHTS = [6, 7.5, 5.5, 8, 6.5, 7, 5.8]
const FOV = 40
const BALLOON_R = 1.15
const MIN_HIT_PX = 88

const COLORS = {
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

const ease = {
  out: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
}

interface Tween { start: number, duration: number, update: (p: number) => void, done?: () => void }

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Index into a list that also works for negative numbers (buildings behind the start). */
const pick = <T>(list: readonly T[], index: number) => list[((index % list.length) + list.length) % list.length]!

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`

/** A thin cylinder between two points: used for every strand of web. */
function makeStrand() {
  const geometry = new THREE.CylinderGeometry(0.045, 0.045, 1, 6, 1, true)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: COLORS.web }))
  mesh.visible = false
  return mesh
}

const UP = new THREE.Vector3(0, 1, 0)
function setStrand(strand: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) {
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

  // Eight bendy legs, four a side, as tubes along gentle curves.
  const legs: THREE.Mesh[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
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

  group.userData = { body, eyes, legs }
  return group
}

// ---- city -------------------------------------------------------------------------------------

interface Building { index: number, height: number, mesh: THREE.Mesh }

function windowTexture(color: number, height: number) {
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

interface Balloon {
  letter: WorldLetter
  group: THREE.Group
  skin: THREE.Mesh
  label: THREE.Mesh
  halo: THREE.Mesh
  home: THREE.Vector3
  phase: number
  wiggleStart: number
  /** Leaving (caught or floating away): no longer tappable, ignores bobbing. */
  leaving: boolean
  button: HTMLButtonElement
}

function letterTexture(label: string) {
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
function glowTexture() {
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
function pictureCard(letter: WorldLetter) {
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
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200)
  private lastFrame = performance.now()
  private frame = 0
  private tweens: Tween[] = []
  private now = 0

  private webbo = buildWebbo()
  private webStrand = makeStrand()
  private buildings = new Map<number, Building>()
  private balloons: Balloon[] = []
  private pictures: THREE.Mesh[] = []
  private confetti: Array<{ mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }> = []
  private clouds = new THREE.Group()
  /** Ground and hills: moved along with the camera, so the city can go on for ever. */
  private backdrop = new THREE.Group()

  /** Which roof Webbo is on. */
  private perch = 0
  private started = false
  private moving = false
  private state: WorldState = { waiting: false, calming: false, hint: false }
  private targetId: string | null = null
  private insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
  private portrait = false
  /** The roof point the camera frames; it travels with Webbo during a swing. */
  private focus = new THREE.Vector3()
  private cameraGoal = new THREE.Vector3()
  private lookGoal = new THREE.Vector3()
  private look = new THREE.Vector3()
  private slowFrames = 0
  private frames = 0

  constructor(private opts: WorldOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.buildScenery()
    this.scene.add(this.webbo, this.webStrand)
    this.resize()
    this.loop = this.loop.bind(this)
    this.frame = requestAnimationFrame(this.loop)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  // ---- public API (called by WebboScene.vue) --------------------------------------------------

  /** Show a new round: three balloons, one of them `targetId`. Swings to the next roof if needed. */
  setRound(choices: WorldLetter[], targetId: string) {
    this.targetId = targetId
    this.finishTweens()
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

  /** The right balloon was picked: web it in and pop it into its picture. */
  catch(id: string) {
    const balloon = this.balloons.find(b => b.letter.id === id && !b.leaving)
    if (!balloon) return
    balloon.leaving = true
    for (const other of this.balloons) {
      if (other !== balloon) this.floatAway(other)
    }

    const hand = () => this.webbo.position.clone().add(new THREE.Vector3(0.55, 0.15, 0.4))
    const from = balloon.group.position.clone()
    const popAt = this.webbo.position.clone().add(new THREE.Vector3(1.9, 1.7, 0.9))
    const quick = this.opts.reducedMotion

    // 1. Shoot the web.
    this.tween(quick ? 0 : 0.22, (p) => {
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
        this.webboHop(0.6)
      })
    })
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
      // Re-lay out the floating balloons for the new shape.
      this.balloons.forEach((b, i) => { if (!b.leaving) b.home.copy(this.balloonSpot(i)) })
    }
    this.portrait = portrait
    this.frameCamera(true)
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    document.removeEventListener('visibilitychange', this.onVisibility)
    for (const b of this.balloons) b.button.remove()
    this.disposeObject(this.scene)
    ;(this.scene.background as THREE.Texture | null)?.dispose()
    haloTexture?.dispose()
    haloTexture = null
    this.renderer.dispose()
  }

  // ---- scenery ----------------------------------------------------------------------------------

  private buildScenery() {
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
  private ensureBuildings() {
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

  private disposeObject(object: THREE.Object3D) {
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

  private roofOf(index: number) {
    return this.buildings.get(index)?.height ?? pick(HEIGHTS, index)
  }

  private perchPoint(index: number) {
    return new THREE.Vector3(index * SPAN, this.roofOf(index) + 0.72, 0.4)
  }

  private placeWebbo(index: number) {
    this.perch = index
    this.webbo.position.copy(this.perchPoint(index))
    this.focus.copy(this.webbo.position)
    this.webbo.rotation.set(0, 0.25, 0)
  }

  // ---- balloons -------------------------------------------------------------------------------

  /** Where the i-th balloon floats, relative to Webbo's roof. Portrait stacks them up a column. */
  private balloonSpot(i: number) {
    const base = this.perchPoint(this.perch)
    const spots: Array<[x: number, y: number]> = this.portrait
      ? [[5.3, 2.3], [3.4, 5.1], [5.5, 7.9]]
      : [[3.4, 3.4], [6.0, 5.2], [8.5, 3.0]]
    const [x, y] = spots[i]!
    return new THREE.Vector3(base.x + x, base.y + y, 1.4)
  }

  private spawnBalloons(choices: WorldLetter[], delay: number) {
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

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'webbo-hit'
      button.setAttribute('aria-label', `Letter ${letter.label}`)
      button.dataset.letter = letter.id
      button.addEventListener('click', () => this.opts.onPick(letter.id))
      this.opts.hitLayer.appendChild(button)

      const balloon: Balloon = { letter, group, skin, label, halo, home, phase: i * 2.1, wiggleStart: -10, leaving: true, button }
      this.balloons.push(balloon)

      // Rise up from the street and become tappable.
      this.tween(this.opts.reducedMotion ? 0 : 0.7, (p) => {
        group.position.lerpVectors(home.clone().add(new THREE.Vector3(0, -9, 0)), home, ease.out(p))
        group.scale.setScalar(Math.max(0.01, ease.back(p)))
      }, () => { balloon.leaving = false }, delay + i * 0.12)
    })
  }

  private floatAway(balloon: Balloon) {
    balloon.leaving = true
    const from = balloon.group.position.clone()
    this.tween(this.opts.reducedMotion ? 0 : 1.1, (p) => {
      balloon.group.position.copy(from).add(new THREE.Vector3(0, p * 7, 0))
      this.setOpacity(balloon, 1 - p)
    }, () => this.removeBalloon(balloon))
  }

  private removeBalloon(balloon: Balloon) {
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

  private clearBalloons() {
    for (const balloon of [...this.balloons]) this.removeBalloon(balloon)
  }

  private setOpacity(balloon: Balloon, opacity: number) {
    (balloon.skin.material as THREE.MeshLambertMaterial).opacity = opacity
    ;(balloon.label.material as THREE.MeshBasicMaterial).opacity = opacity
  }

  // ---- moving on ----------------------------------------------------------------------------

  /** Stick caught pictures onto the front of the building they were caught at. */
  private pinPictures() {
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
  private swingToNextRoof() {
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
    const hand = () => this.webbo.position.clone().add(new THREE.Vector3(0, 0.6, 0))
    this.tween(0.2, p => setStrand(this.webStrand, hand(), hand().lerp(anchor, p)), () => {
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
        this.webboHop(0.35)
      })
    })
    return 1.25
  }

  private webboHop(height: number) {
    if (this.opts.reducedMotion) return
    const body = this.webbo.userData.body as THREE.Group
    this.tween(0.5, (p) => { body.position.y = Math.sin(p * Math.PI) * height })
  }

  private burst(at: THREE.Vector3, colors: number[]) {
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
  private frameCamera(snap: boolean) {
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
  private finishTweens() {
    for (let guard = 0; this.tweens.length && guard < 20; guard++) {
      for (const tween of this.tweens.splice(0)) {
        tween.update(1)
        tween.done?.()
      }
    }
  }

  private tween(duration: number, update: (p: number) => void, done?: () => void, delay = 0) {
    this.tweens.push({ start: this.now + delay, duration, update, done })
  }

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame)
    }
    else {
      this.lastFrame = performance.now()
      this.frame = requestAnimationFrame(this.loop)
    }
  }

  private loop() {
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
      for (const leg of legs) leg.rotation.x = Math.sin(t * (this.moving ? 9 : 2) + leg.userData.phase) * (this.moving ? 0.25 : 0.06)
    }
    // Hills drift by slower than the city (a little depth); clouds wrap around as they drift.
    this.backdrop.position.x = this.camera.position.x * 0.7
    this.clouds.position.x = this.camera.position.x * 0.8 + (still ? 0 : (t * 0.25) % 14)
    eyes.scale.y = (t % 4.2) > 4.05 ? 0.15 : 1

    // Balloons bob, dim while the question is asked, wobble when wrong, glow as a hint.
    const dim = this.state.calming ? 0.35 : this.state.waiting ? 0.6 : 1
    for (const b of this.balloons) {
      if (!b.leaving) {
        const bob = still ? 0 : Math.sin(t * 1.3 + b.phase) * 0.18
        b.group.position.set(b.home.x, b.home.y + bob, b.home.z)
        const current = (b.skin.material as THREE.MeshLambertMaterial).opacity
        this.setOpacity(b, current + (dim - current) * Math.min(1, dt * 8))
        const age = t - b.wiggleStart
        b.group.rotation.z = age < 0.7 ? Math.sin(age * 28) * 0.28 * (1 - age / 0.7) : (still ? 0 : Math.sin(t * 0.9 + b.phase) * 0.05)
        const hinted = this.state.hint && !this.state.waiting && b.letter.id === this.targetId
        b.halo.visible = hinted
        if (hinted) b.halo.scale.setScalar(1 + Math.sin(t * 4) * 0.12)
        const calmScale = this.state.calming ? 0.92 : 1
        b.group.scale.setScalar(b.group.scale.x + (calmScale - b.group.scale.x) * Math.min(1, dt * 8))
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
  private placeButtons() {
    const H = this.opts.canvas.clientHeight
    const W = this.opts.canvas.clientWidth
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const point = new THREE.Vector3()
    for (const b of this.balloons) {
      point.copy(b.group.position).project(this.camera)
      const x = (point.x * 0.5 + 0.5) * W
      const y = (-point.y * 0.5 + 0.5) * H
      const depth = this.camera.position.distanceTo(b.group.position)
      const diameter = (BALLOON_R * 2.3 / (2 * depth * tan)) * H
      const size = Math.max(MIN_HIT_PX, diameter * 1.25)
      const style = b.button.style
      style.width = style.height = `${size}px`
      style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`
      b.button.disabled = b.leaving
    }
  }

  /** If the phone struggles, drop to a lighter resolution rather than stutter. */
  private watchSpeed(dt: number) {
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
