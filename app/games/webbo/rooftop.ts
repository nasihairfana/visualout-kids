/**
 * Webbo's Letter City, rooftop view: the camera stands just behind Webbo on a roof, looking out
 * over the city. Three buildings ahead carry big letter signs; the right one is where Webbo jumps.
 *
 * Everything shared with the side view (Webbo, its hands and move, celebrations, confetti, tap
 * buttons, swiping, the finale and the frame loop) lives in `WebboWorld`; this class only changes
 * the city layout, the targets (signs instead of balloons), the camera and the jump.
 *
 * Gentle on purpose for 2–3-year-olds: the camera only ever glides forward, never rolls or spins,
 * and every jump lands safely. Letters are only ever on the three nearest buildings.
 */
import * as THREE from 'three'
import type { Balloon, WorldLetter, WorldOptions } from './world'
import { COLORS, WebboWorld, canvasTexture, ease, glowTexture, letterTexture, pick, pictureCard, setStrand, windowTexture } from './world'

/** Letter sign board size, before it's scaled up for distance. */
const SIGN = 2.4
/** Where Webbo stands on a roof, relative to its centre: near the front, the sign behind it. */
const STAND_Z = 1.3
/** The three target buildings, relative to Webbo: [x, z] (forward is −z). */
const SPOTS = {
  landscape: [[-6.5, -13], [0, -16.5], [6.5, -13]],
  // A zigzag staircase: near and low on the left, then right, then far and high on the left.
  portrait: [[-3.4, -9], [3.4, -15], [-1.6, -22]],
} as const
/** Target roof heights relative to Webbo's roof. Portrait climbs with distance so signs don't line up. */
const TARGET_HEIGHTS = { landscape: [-1.2, 0.6, -0.4], portrait: [-1.6, -0.2, 1.4] }

interface Roof { mesh: THREE.Mesh, x: number, z: number, height: number }

const random = (min: number, max: number) => min + Math.random() * (max - min)

export class RooftopWorld extends WebboWorld {
  protected roofs: Roof[] = []
  /** The building each target letter is on. */
  protected targets = new Map<string, Roof>()
  protected current: Roof | null = null
  protected clusters = 0

  constructor(opts: WorldOptions) {
    super(opts)
    // Signs only sway a little; they're on posts, not floating.
    this.bobAmount = 0.07
  }

  // ---- public API ---------------------------------------------------------------------------

  override setRound(choices: WorldLetter[], targetId: string) {
    this.targetId = targetId
    this.finishTweens()
    for (const card of this.parade) this.disposeObject(card)
    this.parade = []
    this.restArms()
    const first = !this.started
    this.started = true
    this.clearBalloons()
    if (first) {
      this.current = this.makeRoof(0, 0, 7, 0, false)
      this.stand(this.current)
      this.frameCamera(true)
    }
    else {
      this.tuckPictures()
    }
    this.targets.clear()
    this.spawnTargets(choices, first ? 0 : 0.15)
    this.clearBehind()
  }

  /** The right sign was picked: wiggle and point, web onto the sign, jump over, pop, dance. */
  override catch(id: string, celebration: 'big' | 'gentle' = 'big') {
    const sign = this.balloons.find(b => b.letter.id === id && !b.leaving)
    const roof = this.targets.get(id)
    if (!sign || !roof) return
    sign.leaving = true
    this.session.push(sign.letter)
    for (const other of this.balloons) {
      if (other !== sign) this.floatAway(other)
    }

    const quick = this.opts.reducedMotion
    const from = this.webbo.position.clone()
    const land = this.standPoint(roof)
    const anchor = sign.group.position.clone().add(new THREE.Vector3(0, SIGN * sign.size * 0.5, 0))
    const hand = () => this.tipPosition()

    const pop = () => {
      this.webStrand.visible = false
      this.moving = false
      this.current = roof
      this.stand(roof)
      this.frameCamera(quick)
      const at = sign.group.position.clone()
      const turn = sign.group.rotation.y
      this.removeBalloon(sign)
      this.burst(at, COLORS.balloons)
      const card = pictureCard(sign.letter)
      card.position.copy(at)
      card.rotation.y = turn
      card.userData.roof = roof
      this.scene.add(card)
      this.pictures.push(card)
      const size = Math.max(1, sign.size)
      this.tween(quick ? 0 : 0.5, p => card.scale.setScalar(Math.max(0.01, size * ease.back(p))))
      this.dance(celebration === 'big' ? 1.6 : 0.9, celebration === 'big')
      if (celebration === 'big') this.tween(0, () => this.burst(at.clone().add(new THREE.Vector3(0, 1.6, 0)), [0xffc94d, 0xffffff, 0xff8a6b]), undefined, 0.25)
    }

    this.wiggleAndPoint(anchor, celebration === 'big' ? 0.5 : 0.3, () => {
      if (quick) return pop()
      // Web onto the sign…
      this.tween(0.22, p => setStrand(this.webStrand, hand(), hand().lerp(anchor, p)), () => {
        // …and jump over in one gentle arc, the camera gliding along behind.
        this.moving = true
        const top = new THREE.Vector3((from.x + land.x) / 2, Math.max(from.y, land.y) + 3.2, (from.z + land.z) / 2)
        const curve = new THREE.QuadraticBezierCurve3(from, top, land)
        this.tween(1.25, (p) => {
          const t = ease.inOut(p)
          this.webbo.position.copy(curve.getPoint(t))
          this.webbo.rotation.x = Math.sin(p * Math.PI) * -0.35
          if (p < 0.75) setStrand(this.webStrand, hand(), anchor)
          else this.webStrand.visible = false
          this.focus.lerpVectors(from, land, t)
          this.frameCamera(false)
        }, () => {
          this.webbo.rotation.x = 0
          pop()
        })
      })
    })
  }

  /** Settle the camera first: if Next came mid-jump, the row must be laid out where it ends up. */
  override finale() {
    this.finishTweens()
    this.frameCamera(true)
    return super.finale()
  }

  // ---- city --------------------------------------------------------------------------------------

  /** Pastel sky, a long way of ground, a hazy skyline on the horizon and slow clouds. */
  protected override buildScenery() {
    this.scene.background = canvasTexture(4, 256, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, '#a9d6ff')
      g.addColorStop(0.6, '#e2f1ff')
      g.addColorStop(1, '#fff1e2')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 4, 256)
    })
    this.scene.fog = new THREE.Fog(0xe9f2fd, 45, 160)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfee, 2.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(8, 14, 6)
    this.scene.add(sun)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshLambertMaterial({ color: COLORS.ground }))
    ground.rotation.x = -Math.PI / 2
    this.backdrop.add(ground)

    // The far skyline: tall, simple, pale shapes. Fog does the rest.
    const skyline = [0xd8e6fa, 0xe6dcfb, 0xf6dfe8, 0xdcefe6]
    for (let i = 0; i < 34; i++) {
      const w = random(5, 9)
      const h = random(8, 22)
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: pick(skyline, i) }))
      tower.position.set(-120 + i * 7.3 + random(-1.5, 1.5), h / 2, -105 - random(0, 30))
      this.backdrop.add(tower)
    }
    const hill = new THREE.MeshLambertMaterial({ color: 0xbfe8d0 })
    for (let i = -4; i <= 4; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(16 + (i % 2) * 5, 16, 8), hill)
      mesh.position.set(i * 26, -6, -140)
      this.backdrop.add(mesh)
    }
    this.scene.add(this.backdrop)

    const puff = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35 })
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Group()
      for (let j = 0; j < 3; j++) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(2 + (j % 2) * 0.8, 10, 8), puff)
        ball.position.set(j * 2.2 - 2.2, (j % 2) * 0.8, 0)
        cloud.add(ball)
      }
      cloud.position.set(-70 + i * 15, 20 + (i % 3) * 3, -50 - (i % 4) * 10)
      this.clouds.add(cloud)
    }
    this.scene.add(this.clouds)
  }

  /** Ground, skyline and clouds travel with the camera, so the city goes on for ever. */
  protected override moveScenery(t: number, still: boolean) {
    this.backdrop.position.set(this.camera.position.x, 0, this.camera.position.z)
    this.clouds.position.set(this.camera.position.x + (still ? 0 : (t * 0.4) % 15), 0, this.camera.position.z)
  }

  protected makeRoof(x: number, z: number, height: number, colour: number, rise: boolean, delay = 0): Roof {
    const color = pick(COLORS.buildings, colour)
    const walls = new THREE.MeshLambertMaterial({ map: windowTexture(color, height) })
    const top = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35) })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(5, height, 5), [walls, walls, top, walls, walls, walls])
    mesh.position.set(x, height / 2, z)
    this.scene.add(mesh)
    const roof = { mesh, x, z, height }
    this.roofs.push(roof)
    if (rise && !this.opts.reducedMotion) {
      mesh.scale.y = 0.01
      mesh.position.y = 0
      this.tween(0.6, (p) => {
        const s = Math.max(0.01, ease.out(p))
        mesh.scale.y = s
        mesh.position.y = (height * s) / 2
      }, undefined, delay)
    }
    return roof
  }

  /** Low buildings and trees around a cluster of target buildings, so the city feels full. */
  protected fillAround(cx: number, cz: number, keepClear: THREE.Vector2[]) {
    for (let i = 0; i < 12; i++) {
      const x = cx + random(-24, 24)
      const z = cz + random(-34, 4)
      if (keepClear.some(p => Math.hypot(p.x - x, p.y - z) < 6.5)) continue
      if (Math.abs(x - cx) < 4 && z > cz - 26) continue // keep the view ahead open
      this.makeRoof(x, z, random(2.5, 6), this.clusters * 3 + i, true, random(0, 0.4))
    }
    const leaves = new THREE.MeshLambertMaterial({ color: 0x9ad9b8 })
    for (let i = 0; i < 6; i++) {
      const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(random(0.9, 1.5), 0), leaves)
      tree.position.set(cx + random(-14, 14), 1.2, cz + random(-28, -4))
      if (keepClear.some(p => Math.hypot(p.x - tree.position.x, p.y - tree.position.z) < 4)) continue
      this.scene.add(tree)
      this.roofs.push({ mesh: tree as unknown as THREE.Mesh, x: tree.position.x, z: tree.position.z, height: 0 })
    }
  }

  /** Drop buildings and pictures well behind the camera. */
  protected clearBehind() {
    const limit = this.webbo.position.z + 16
    this.roofs = this.roofs.filter((roof) => {
      if (roof.z < limit || roof === this.current) return true
      this.disposeObject(roof.mesh)
      return false
    })
    for (const card of [...this.pictures]) {
      if (card.position.z < limit) continue
      this.disposeObject(card)
      this.pictures.splice(this.pictures.indexOf(card), 1)
    }
  }

  protected standPoint(roof: Roof) {
    return new THREE.Vector3(roof.x, roof.height + 0.72, roof.z + STAND_Z)
  }

  /** Put Webbo on a roof, looking out over the city (back to the camera, turned a little). */
  protected stand(roof: Roof) {
    this.webbo.position.copy(this.standPoint(roof))
    this.restTurn = Math.PI - 0.5
    this.webbo.rotation.set(0, this.restTurn, 0)
    this.focus.copy(this.webbo.position)
  }

  /** Last round's picture settles on the roof beside Webbo, out of the way of the view. */
  protected tuckPictures() {
    for (const card of this.pictures) {
      if (card.userData.pinned) continue
      card.userData.pinned = true
      const from = card.position.clone()
      const to = this.webbo.position.clone().add(new THREE.Vector3(2.1, 0.3, -0.6))
      const fromScale = card.scale.x
      this.tween(this.opts.reducedMotion ? 0 : 0.6, (p) => {
        card.position.lerpVectors(from, to, ease.inOut(p))
        card.scale.setScalar(fromScale + (0.5 - fromScale) * p)
      })
    }
  }

  // ---- letter signs ------------------------------------------------------------------------

  protected spawnTargets(choices: WorldLetter[], delay: number) {
    const base = this.webbo.position
    const spots = this.portrait ? SPOTS.portrait : SPOTS.landscape
    const roofHeight = this.current?.height ?? 7
    this.clusters++
    const clear: THREE.Vector2[] = [new THREE.Vector2(base.x, base.z - STAND_Z)]

    // Where the camera will be once it has settled, so signs face it and are sized for it.
    this.frameCamera(false)
    const eye = this.cameraGoal.clone()

    choices.forEach((letter, i) => {
      const [dx, dz] = spots[i]!
      const x = base.x + dx
      const z = base.z - STAND_Z + dz
      clear.push(new THREE.Vector2(x, z))
      const height = Math.min(10, Math.max(4, roofHeight + TARGET_HEIGHTS[this.portrait ? 'portrait' : 'landscape'][i]!))
      const roof = this.makeRoof(x, z, height, this.clusters * 3 + i + 1, true, delay + i * 0.12)
      this.targets.set(letter.id, roof)

      // The sign: a coloured board on a post, letter on the front, glow behind for the hint.
      const group = new THREE.Group()
      const color = pick(COLORS.balloons, this.clusters * 2 + i)
      const skin = new THREE.Mesh(
        new THREE.BoxGeometry(SIGN, SIGN, 0.24),
        new THREE.MeshLambertMaterial({ color, transparent: true, emissive: color, emissiveIntensity: 0.22 }),
      )
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 8), new THREE.MeshLambertMaterial({ color: COLORS.webboDark }))
      post.position.y = -SIGN / 2 - 0.6
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(SIGN * 0.92, SIGN * 0.92),
        new THREE.MeshBasicMaterial({ map: letterTexture(letter.label), transparent: true, depthWrite: false }),
      )
      label.position.z = 0.13
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(SIGN * 2.4, SIGN * 2.4),
        new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false }),
      )
      halo.position.z = -0.3
      halo.visible = false
      group.add(halo, post, skin, label)

      const home = new THREE.Vector3(x, height + 1.25 + SIGN / 2, z - 0.6)
      group.position.copy(home)
      group.rotation.y = Math.atan2(eye.x - home.x, eye.z - home.z)
      // Far signs are drawn bigger, so every letter looks about the same size on screen.
      const size = Math.min(this.portrait ? 1.6 : 1.9, Math.max(1, eye.distanceTo(home) / (this.portrait ? 18 : 17)))
      group.scale.setScalar(0.01)
      this.scene.add(group)

      const sign: Balloon = { letter, group, skin, label, halo, home, phase: i * 2.1, wiggleStart: -10, leaving: true, button: this.createHitButton(letter), size }
      this.balloons.push(sign)
      this.tween(this.opts.reducedMotion ? 0 : 0.45, p => group.scale.setScalar(Math.max(0.01, size * ease.back(p))), () => { sign.leaving = false }, delay + 0.45 + i * 0.12)
    })
    this.fillAround(base.x, base.z - STAND_Z, clear)
  }

  /** The signs are always ahead and above Webbo, so a sideways drag can't be meant as a throw. */
  protected override canTurnByDrag() {
    return true
  }

  /** Turning the phone mid-round keeps the same buildings; the next round uses the new layout. */
  protected override relayout() {}

  protected override targetPlaneZ() {
    const live = this.balloons.filter(b => !b.leaving)
    if (!live.length) return this.webbo.position.z - 14
    return live.reduce((sum, b) => sum + b.home.z, 0) / live.length
  }

  protected override paradePlaneZ() {
    return this.camera.position.z - 9
  }

  // ---- camera -------------------------------------------------------------------------------------

  /**
   * Just behind and above Webbo, looking out and a little down over the roofs ahead.
   * A narrow portrait screen gets a wider lens from further up, so the three buildings still fit.
   */
  protected override frameCamera(snap: boolean) {
    const fov = this.portrait ? 62 : 45
    if (this.camera.fov !== fov) {
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }
    const behind = this.portrait ? new THREE.Vector3(0, 9.5, 15) : new THREE.Vector3(0, 4.6, 11.5)
    const ahead = this.portrait ? new THREE.Vector3(0, -2.5, -16) : new THREE.Vector3(0, 0.6, -14)
    this.cameraGoal.copy(this.focus).add(behind)
    this.lookGoal.copy(this.focus).add(ahead)
    if (snap || this.opts.reducedMotion) {
      this.camera.position.copy(this.cameraGoal)
      this.look.copy(this.lookGoal)
      this.camera.lookAt(this.look)
    }
  }
}
