import { useMemo, useRef, useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

const CONTROL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const SMOKE_COUNT = 32
const FIRE_RATE_MS = 100
const TARGET_COUNT = 5
const TARGET_HIT_RADIUS = 0.8

const SHARD_DIRECTIONS = [
  [1, 0.4, 0.2],
  [-1, 0.3, -0.2],
  [0.6, 0.8, -0.4],
  [-0.7, 0.7, 0.3],
  [0.3, -0.6, 0.8],
  [-0.4, -0.7, -0.6]
]

const PROJECTS = [
  {
    title: 'Project Management Mono Repo',
    accent: '#a855f7',
    badge: '#f9fafb'
  },
  {
    title: 'About Me',
    accent: '#22c55e',
    badge: '#f9fafb'
  },
  {
    title: 'Lead Generation CRM Plugin',
    accent: '#f97316',
    badge: '#0f172a'
  },
  {
    title: 'Agent CRM',
    accent: '#facc15',
    badge: '#0f172a'
  },
  {
    title: 'Hear Helper',
    accent: '#6366f1',
    badge: '#0f172a'
  }
]

function createInitialTargets(viewport) {
  const targets = []
  const width = viewport?.width ?? 16
  const height = viewport?.height ?? 9

  const maxX = width / 2 - 0.6
  const maxY = height / 2 - 0.6

  const layouts = [
    { x: -maxX, y: maxY, z: -3.2 },   // top-left
    { x: maxX, y: maxY, z: -3.2 },    // top-right
    { x: -maxX, y: -maxY, z: -3.2 },  // bottom-left
    { x: maxX, y: -maxY, z: -3.2 },   // bottom-right
    { x: 0, y: 0, z: -3.2 }           // center
  ]

  // Explicitly map projects to positions so "About Me" is centered
  // PROJECTS order: [Mono Repo, About Me, Lead Gen, Agent CRM, Hear Helper]
  const projectOrder = [0, 2, 3, 4, 1] // indices into PROJECTS per target id

  for (let i = 0; i < TARGET_COUNT; i++) {
    const pos = layouts[i] || layouts[layouts.length - 1]
    const projectIndex = projectOrder[i % projectOrder.length] ?? 0

    targets.push({
      id: i,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      alive: true,
      projectIndex
    })
  }

  return targets
}

export default function Airplane({ activeProject, onHintProjectChange, onSelectProject, onHitChange, onReady }) {
  const { viewport } = useThree()
  const controlRef = useRef()
  const gunSoundRef = useRef(null)
  const rocketSoundRef = useRef(null)
  const audioCtxRef = useRef(null)
  const floatRef = useRef()
  const planeRef = useRef()
  const keyStateRef = useRef({})
  const hasInteractedRef = useRef(false)
  const movementRef = useRef({ x: -3, y: 2, z: 0, vx: 0, vy: 0, vz: 0 })
  const smokeParticlesRef = useRef([])
  const propellerRefs = useRef([])
  const noseGunRefs = useRef([])
  const lasersRef = useRef([])
  const targetsRef = useRef([])
  const explosionsRef = useRef([])
  const rocketsRef = useRef([])
  const firingRef = useRef(false)
  const lastShotRef = useRef(0)
  const lastRocketRef = useRef(0)
  const laserIdRef = useRef(0)
  const aimRef = useRef(new THREE.Vector3(1, 0, 0))
  const viewportRef = useRef(viewport)
  const crashedRef = useRef(false)
  const hitsRef = useRef(0)
  const [hovered, setHovered] = useState(false)
  const [lasers, setLasers] = useState([])
  const [targets, setTargets] = useState(() => {
    const initial = createInitialTargets(viewport)
    targetsRef.current = initial
    return initial
  })
  const [explosions, setExplosions] = useState([])
  const [hintTargetId, setHintTargetId] = useState(null)
  const [rockets, setRockets] = useState([])
  const [crashed, setCrashed] = useState(false)

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  useEffect(() => {
    if (typeof onReady !== 'function') return undefined
    let called = false
    const rafId = requestAnimationFrame(() => {
      if (!called) {
        onReady()
        called = true
      }
    })
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [onReady])

  useEffect(() => {
    const base = (import.meta.env && import.meta.env.BASE_URL) || '/'
    rocketSoundRef.current = new Audio(`${base}sounds/rocket.mp3`)
    rocketSoundRef.current.volume = 0.6
    return () => {
      if (rocketSoundRef.current) {
        rocketSoundRef.current.pause()
        rocketSoundRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (typeof onHitChange !== 'function') return
    onHitChange(hitsRef.current)
  }, [onHitChange])

  useEffect(() => {
    if (typeof onHintProjectChange !== 'function') return
    if (hintTargetId == null) {
      onHintProjectChange(null)
      return
    }

    const t = targetsRef.current.find(target => target.id === hintTargetId)
    if (!t) {
      onHintProjectChange(null)
    } else {
      const project = PROJECTS[t.projectIndex]
      onHintProjectChange(project || null)
    }
  }, [hintTargetId, onHintProjectChange])

  useEffect(() => {
    const group = controlRef.current
    if (group) {
      const { x, y, z } = movementRef.current
      group.position.set(x, y, z)
    }
  }, [])

  const fuselageGeometry = useMemo(() => {
    const points = []
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const radius = 0.18 + Math.sin(t * Math.PI) * 0.42 * (1 - t * 0.12)
      const y = t * 6 - 3
      points.push(new THREE.Vector2(radius, y))
    }
    return new THREE.LatheGeometry(points, 64)
  }, [])

  const wingGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-2.6, 0)
    shape.lineTo(2.3, -0.25)
    shape.lineTo(3, -0.95)
    shape.lineTo(-1.8, -0.55)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false })
    geometry.center()
    return geometry
  }, [])

  const tailGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-1.1, 0)
    shape.lineTo(1.1, -0.15)
    shape.lineTo(0.8, -0.65)
    shape.lineTo(-0.9, -0.35)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false })
    geometry.center()
    return geometry
  }, [])

  const finGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.2, 0)
    shape.lineTo(0.6, 0)
    shape.lineTo(0.2, 1.5)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false })
    geometry.center()
    return geometry
  }, [])

  useEffect(() => () => fuselageGeometry.dispose(), [fuselageGeometry])
  useEffect(() => () => wingGeometry.dispose(), [wingGeometry])
  useEffect(() => () => tailGeometry.dispose(), [tailGeometry])
  useEffect(() => () => finGeometry.dispose(), [finGeometry])

  const resetSmokeParticle = mesh => {
    if (!mesh) return
    const lateral = Math.random() > 0.5 ? -0.95 : 0.95
    const xOffset = -1.2 - Math.random() * 1.6
    const yOffset = -0.55 + (Math.random() - 0.5) * 0.8
    mesh.position.set(xOffset, yOffset, lateral + (Math.random() - 0.5) * 0.25)
    const scale = 0.25 + Math.random() * 0.35
    mesh.scale.set(scale, scale, scale)
    if (mesh.material) {
      mesh.material.opacity = 0.65
    }
  }

  useEffect(() => {
    smokeParticlesRef.current.forEach((mesh, idx) => {
      resetSmokeParticle(mesh)
      if (mesh) {
        mesh.position.x -= idx * 0.08
      }
    })
  }, [])

  useEffect(() => {
    const floatGroup = floatRef.current
    if (!floatGroup) return

    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.to(floatGroup.position, { y: '+=0.35', duration: 5, ease: 'sine.inOut' })
    tl.to(floatGroup.rotation, { y: '+=0.25', duration: 7, ease: 'sine.inOut' }, 0)

    return () => {
      tl.kill()
    }
  }, [])

  useEffect(() => {
    let rafId

    const animate = () => {
      const group = controlRef.current
      const movement = movementRef.current
      const now = performance.now()

      if (group) {
        const keyState = keyStateRef.current
        const crashedNow = crashedRef.current

        const inputX = crashedNow
          ? 0
          : (keyState.ArrowRight ? 1 : 0) - (keyState.ArrowLeft ? 1 : 0)
        const inputY = crashedNow
          ? 0
          : (keyState.ArrowUp ? 1 : 0) - (keyState.ArrowDown ? 1 : 0)

        if (!crashedNow) {
          movement.vx += inputX * 0.012
          movement.vy += inputY * 0.012
          movement.vz += (Math.abs(inputX) + Math.abs(inputY)) * -0.003

          movement.vx *= 0.85
          movement.vy *= 0.85
          movement.vz *= 0.92
        } else {
          // simple crash physics: drift forward, fall down, and slowly sink in Z
          movement.vy -= 0.011
          movement.vz -= 0.004
          movement.vx *= 0.96
          movement.vy *= 0.985
          movement.vz *= 0.985
        }

        const { width, height } = viewportRef.current
        const maxX = width / 2 - 0.4
        const maxY = height / 2 - 0.4

        const nextX = THREE.MathUtils.clamp(movement.x + movement.vx * 1.2, -maxX, maxX)
        let nextY = movement.y + movement.vy * 1.2
        let overflow = 0
        if (nextY > maxY) {
          overflow = nextY - maxY
          nextY = maxY
        } else if (nextY < -maxY) {
          overflow = nextY + maxY
          nextY = -maxY
        }

        movement.x = nextX
        movement.y = nextY
        movement.z = THREE.MathUtils.clamp(movement.z + movement.vz * 10, -3, 3)

        group.position.set(movement.x, movement.y, movement.z)

        if (overflow !== 0 && typeof window !== 'undefined') {
          window.scrollBy({ top: -overflow * window.innerHeight * 0.3, behavior: 'auto' })
        }

        let rollTarget
        let pitchTarget
        let yawTarget

        if (!crashedRef.current) {
          rollTarget = THREE.MathUtils.clamp(-inputX * 0.6, -0.8, 0.8)
          pitchTarget = THREE.MathUtils.clamp(-inputY * 0.5, -0.55, 0.55)
          yawTarget = THREE.MathUtils.clamp(inputX * 0.25, -0.35, 0.35)
        } else {
          // tumble the plane when crashed
          rollTarget = group.rotation.z + 0.18
          pitchTarget = -0.9
          yawTarget = group.rotation.y + 0.04
        }

        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pitchTarget, 0.2)
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, yawTarget, 0.2)
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, rollTarget, 0.2)

        const plane = planeRef.current
        if (plane) {
          plane.updateMatrixWorld(true)
        }

        // find nearest alive target for hint popup
        if (targetsRef.current.length) {
          const px = movement.x
          const py = movement.y
          const pz = movement.z
          const hintRadius = 3
          const hintRadiusSq = hintRadius * hintRadius
          let bestId = null
          let bestDistSq = hintRadiusSq

          for (let i = 0; i < targetsRef.current.length; i++) {
            const t = targetsRef.current[i]
            if (!t.alive) continue
            const dx = px - t.x
            const dy = py - t.y
            const dz = pz - t.z
            const distSq = dx * dx + dy * dy + dz * dz
            if (distSq <= bestDistSq) {
              bestDistSq = distSq
              bestId = t.id
            }
          }

          setHintTargetId(prev => (prev === bestId ? prev : bestId))
        } else if (hintTargetId !== null) {
          setHintTargetId(null)
        }

        const aimVector = aimRef.current
        const magnitude = Math.hypot(inputX, inputY)
        if (magnitude > 0.05) {
          aimVector.set(inputX, inputY, -Math.min(1, magnitude)).normalize()
        } else {
          // follow movement velocity if no direct input
          const vx = movement.vx
          const vy = movement.vy
          const speed = Math.hypot(vx, vy)
          if (speed > 0.01) {
            aimVector.set(vx, vy, -0.3).normalize()
          }
        }

        propellerRefs.current.forEach(prop => {
          if (!prop) return
          prop.rotation.x += 0.5 + Math.abs(movement.vx) * 0.05 + Math.abs(movement.vy) * 0.05
        })
      }

      if (firingRef.current && now - lastShotRef.current >= FIRE_RATE_MS) {
        fireLasers(now)
      }

      // spawn rockets from the left side moving toward the plane (less frequent)
      // but only after the player has interacted at least once
      const rocketInterval = 3500
      if (hasInteractedRef.current && !crashedRef.current && now - lastRocketRef.current >= rocketInterval) {
        const { width, height } = viewportRef.current || { width: 16, height: 9 }
        const maxX = width / 2
        const maxY = height / 2

        const spawnX = -maxX - 4
        const spawnY = (Math.random() - 0.5) * (height - 2)
        const spawnZ = (Math.random() - 0.5) * 4

        const targetX = movement.x
        const targetY = movement.y
        const targetZ = movement.z

        const dir = new THREE.Vector3(targetX - spawnX, targetY - spawnY, targetZ - spawnZ).normalize()
        const speed = 0.04
        const vx = dir.x * speed
        const vy = dir.y * speed
        const vz = dir.z * speed

        const rocket = {
          id: `rocket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: spawnX,
          y: spawnY,
          z: spawnZ,
          vx,
          vy,
          vz,
          ttl: 900
        }

        const nextRockets = [...rocketsRef.current, rocket]
        rocketsRef.current = nextRockets
        setRockets(nextRockets)
        if (rocketSoundRef.current) {
          rocketSoundRef.current.currentTime = 0
          rocketSoundRef.current.play().catch(() => {})
        }
        lastRocketRef.current = now
      }

      if (lasersRef.current.length) {
        let updated = false

        // move lasers forward
        let updatedLasers = lasersRef.current
          .map(laser => {
            const ttl = laser.ttl !== undefined ? laser.ttl - 1 : 90
            const next = {
              ...laser,
              x: laser.x + laser.vx,
              y: laser.y + laser.vy,
              z: laser.z + laser.vz,
              ttl
            }
            return next
          })
          .filter(l => l.ttl > 0 && Math.abs(l.x) < 50 && Math.abs(l.y) < 50 && Math.abs(l.z) < 50)

        // If a laser passes near a wormhole, deflect its direction instead of
        // destroying the wormhole. Wormholes always stay alive.
        if (updatedLasers.length && targetsRef.current.length) {
          const deflectRadius = TARGET_HIT_RADIUS * 1.1
          const deflectRadiusSq = deflectRadius * deflectRadius

          const targets = targetsRef.current
          updatedLasers = updatedLasers.map(laser => {
            let deflected = false

            for (let i = 0; i < targets.length; i++) {
              const t = targets[i]
              const dx = laser.x - t.x
              const dy = laser.y - t.y
              const dz = laser.z - t.z
              const distSq = dx * dx + dy * dy + dz * dz
              if (distSq <= deflectRadiusSq) {
                // simple deflection: reflect the laser velocity around the
                // vector from target to laser and dampen slightly so it feels
                // like it "bounces" off the wormhole
                const nx = dx
                const ny = dy
                const nz = dz
                const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
                const ux = nx / nLen
                const uy = ny / nLen
                const uz = nz / nLen

                const dot = laser.vx * ux + laser.vy * uy + laser.vz * uz
                const rvx = laser.vx - 2 * dot * ux
                const rvy = laser.vy - 2 * dot * uy
                const rvz = laser.vz - 2 * dot * uz

                const damp = 0.8
                laser.vx = rvx * damp
                laser.vy = rvy * damp
                laser.vz = rvz * damp

                deflected = true
                break
              }
            }

            if (deflected) {
              updated = true
            }
            return laser
          })
        }

        lasersRef.current = updatedLasers
        if (updated) {
          setLasers(updatedLasers)
        } else if (lasersRef.current.length) {
          setLasers([...updatedLasers])
        }
      }

      if (!crashedRef.current && rocketsRef.current.length) {
        // move rockets
        let updatedRockets = rocketsRef.current
          .map(r => ({
            ...r,
            x: r.x + r.vx,
            y: r.y + r.vy,
            z: r.z + r.vz,
            ttl: r.ttl - 1
          }))
          .filter(r => r.ttl > 0 && r.x < (viewportRef.current?.width || 16))

        const newRocketExplosions = []
        // allow near hits around the back of the missile, not just perfect center hits
        const rocketHitRadius = 1.2
        const rocketHitRadiusSq = rocketHitRadius * rocketHitRadius

        // laser-rocket collisions
        if (lasersRef.current.length && updatedRockets.length) {
          const lasers = [...lasersRef.current]

          for (let i = updatedRockets.length - 1; i >= 0; i--) {
            const r = updatedRockets[i]
            let destroyed = false

            for (let j = lasers.length - 1; j >= 0; j--) {
              const l = lasers[j]
              // bias the hit check slightly toward the tail (behind) of the rocket
              const hitCenterX = r.x - 0.35
              const dx = l.x - hitCenterX
              const dy = l.y - r.y
              const dz = l.z - r.z
              const distSq = dx * dx + dy * dy + dz * dz
              if (distSq <= rocketHitRadiusSq) {
                // remove rocket and laser, spawn explosion
                updatedRockets.splice(i, 1)
                lasers.splice(j, 1)
                newRocketExplosions.push({
                  id: `rocket-laser-${r.id}-${j}`,
                  x: r.x,
                  y: r.y,
                  z: r.z,
                  ttl: 24
                })
                destroyed = true
                break
              }
            }

            if (destroyed && i > updatedRockets.length - 1) {
              // index may have shifted; continue safely
              continue
            }
          }

          lasersRef.current = lasers
          setLasers(lasers)
        }

        // plane-rocket proximity (direct hit) explosions + hit counter + crash on 3
        if (updatedRockets.length) {
          const px = movementRef.current.x
          const py = movementRef.current.y
          const pz = movementRef.current.z
          const planeRadiusSq = 1.2 * 1.2

          for (let i = updatedRockets.length - 1; i >= 0; i--) {
            const r = updatedRockets[i]
            const dx = px - r.x
            const dy = py - r.y
            const dz = pz - r.z
            const distSq = dx * dx + dy * dy + dz * dz
            if (distSq <= planeRadiusSq) {
              updatedRockets.splice(i, 1)
              newRocketExplosions.push({
                id: `rocket-plane-${r.id}`,
                x: r.x,
                y: r.y,
                z: r.z,
                ttl: 26
              })

              // increment hit counter up to 3 and crash on third hit
              if (!crashedRef.current) {
                const currentHits = hitsRef.current
                const nextHits = Math.min(3, currentHits + 1)
                hitsRef.current = nextHits
                if (typeof onHitChange === 'function') {
                  onHitChange(nextHits)
                }

                if (nextHits >= 3) {
                  crashedRef.current = true
                  setCrashed(true)

                  // on crash, clear all remaining rockets so they stop
                  rocketsRef.current = []
                  setRockets([])
                }
              }
            }
          }
        }

        if (newRocketExplosions.length) {
          const combined = [...explosionsRef.current, ...newRocketExplosions]
          explosionsRef.current = combined
          setExplosions(combined)
        }

        rocketsRef.current = updatedRockets
        setRockets(updatedRockets)
      }

      if (explosionsRef.current.length) {
        const updatedExplosions = explosionsRef.current
          .map(ex => ({ ...ex, ttl: ex.ttl - 1 }))
          .filter(ex => ex.ttl > 0)

        explosionsRef.current = updatedExplosions
        setExplosions(updatedExplosions)
      }

      const time = performance.now() * 0.001
      smokeParticlesRef.current.forEach(mesh => {
        if (!mesh) return
        mesh.position.x -= 0.03 + Math.random() * 0.02
        mesh.position.y += Math.sin(time * 0.8 + mesh.position.x) * 0.015
        mesh.position.z += (Math.random() - 0.5) * 0.012
        mesh.scale.multiplyScalar(1.02)
        if (mesh.material) {
          mesh.material.opacity = Math.max(0, mesh.material.opacity - 0.009)
        }

        if (mesh.position.x < -8 || (mesh.material && mesh.material.opacity <= 0.02)) {
          resetSmokeParticle(mesh)
        }
      })

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    const plane = planeRef.current
    if (!plane) return
    plane.updateMatrixWorld(true)

    const variants = [
      {
        fuselage: '#8fe0ff',
        wing: '#c8e1ff',
        accent: '#fefefe',
        canopy: '#8fb8ff',
        glow: '#d0ffff',
        nose: '#ffd166',
        tail: '#5dd3ff',
        windows: '#d9f2ff',
        flap: '#a7c6ff',
        wingSweep: THREE.MathUtils.degToRad(15),
        wingDihedral: THREE.MathUtils.degToRad(7),
        tailTilt: THREE.MathUtils.degToRad(5),
        engineGlow: 1.4,
        contrail: 0.45
      },
      {
        fuselage: '#f486c5',
        wing: '#ffd1f1',
        accent: '#fff7fb',
        canopy: '#ffe1f7',
        glow: '#ffd6f2',
        nose: '#ff9a8b',
        tail: '#ffbad6',
        windows: '#fff5fd',
        flap: '#ffc5e3',
        wingSweep: THREE.MathUtils.degToRad(22),
        wingDihedral: THREE.MathUtils.degToRad(10),
        tailTilt: THREE.MathUtils.degToRad(9),
        engineGlow: 1.75,
        contrail: 0.65
      },
      {
        fuselage: '#ffe26c',
        wing: '#ffe994',
        accent: '#fffdf2',
        canopy: '#fff3c4',
        glow: '#fff6b7',
        nose: '#ffb347',
        tail: '#ffd166',
        windows: '#fff9de',
        flap: '#ffe8b0',
        wingSweep: THREE.MathUtils.degToRad(8),
        wingDihedral: THREE.MathUtils.degToRad(4),
        tailTilt: THREE.MathUtils.degToRad(3),
        engineGlow: 1.2,
        contrail: 0.35
      }
    ]

    const config = variants[activeProject] || variants[0]
    const fuselageColor = new THREE.Color('#ffffff')
    const wingColor = new THREE.Color(config.wing)
    const accentColor = new THREE.Color(config.accent)
    const canopyColor = new THREE.Color(config.canopy)
    const glowColor = new THREE.Color(config.glow)
    const tailColor = new THREE.Color(config.tail)
    const windowColor = new THREE.Color(config.windows)
    const flapColor = new THREE.Color(config.flap)
    const bellyColor = new THREE.Color('#ff3b3b')
    const finColor = new THREE.Color('#ffd54f')
    const fanColor = new THREE.Color('#ffffff')
    const duration = 1.1

    const get = name => plane.getObjectByName(name)
    const fuselage = get('fuselage')
    const canopyPart = get('canopy')
    const wingLeft = get('wingLeft')
    const wingRight = get('wingRight')
    const wingletLeft = get('wingletLeft')
    const wingletRight = get('wingletRight')
    const tailPlane = get('tailPlane')
    const tailFin = get('tailFin')
    const engineLeft = get('engineLeft')
    const engineRight = get('engineRight')
    const glowLeft = get('contrailLeft')
    const glowRight = get('contrailRight')
    const tailCap = get('tailCap')
    const windowStrip = get('windowStrip')
    const flapLeft = get('flapLeft')
    const flapRight = get('flapRight')
    const propLeft = get('propellerLeft')
    const propRight = get('propellerRight')
    const propLeftBlade = propLeft?.getObjectByName('propellerLeftBlades')
    const propRightBlade = propRight?.getObjectByName('propellerRightBlades')
    const bellyStripe = get('bellyStripe')

    const animateMaterial = (mesh, color) => {
      if (mesh && mesh.material) {
        gsap.to(mesh.material.color, {
          r: color.r,
          g: color.g,
          b: color.b,
          duration,
          ease: 'power3.out'
        })
      }
    }

    if (fuselage) animateMaterial(fuselage, fuselageColor)
    if (canopyPart) animateMaterial(canopyPart, canopyColor)
    if (tailCap) animateMaterial(tailCap, tailColor)
    if (windowStrip) animateMaterial(windowStrip, windowColor)
    if (flapLeft) animateMaterial(flapLeft, flapColor)
    if (flapRight) animateMaterial(flapRight, flapColor)
    if (tailFin) animateMaterial(tailFin, finColor)
    if (bellyStripe) animateMaterial(bellyStripe, bellyColor)
    if (propLeftBlade) animateMaterial(propLeftBlade, fanColor)
    if (propRightBlade) animateMaterial(propRightBlade, fanColor)
    if (wingLeft) {
      animateMaterial(wingLeft, wingColor)
      gsap.to(wingLeft.rotation, {
        x: -Math.PI / 2 + config.wingDihedral,
        y: config.wingSweep,
        duration,
        ease: 'power3.out'
      })
    }
    if (wingRight) {
      animateMaterial(wingRight, wingColor)
      gsap.to(wingRight.rotation, {
        x: -Math.PI / 2 + config.wingDihedral,
        y: -config.wingSweep,
        duration,
        ease: 'power3.out'
      })
    }
    if (wingletLeft)
      gsap.to(wingletLeft.rotation, { y: config.wingSweep * 1.4, duration, ease: 'power3.out' })
    if (wingletRight)
      gsap.to(wingletRight.rotation, { y: -config.wingSweep * 1.4, duration, ease: 'power3.out' })
    if (tailPlane) {
      animateMaterial(tailPlane, wingColor)
      gsap.to(tailPlane.rotation, {
        x: -Math.PI / 2 + config.tailTilt,
        duration,
        ease: 'power3.out'
      })
    }
    if (tailFin) animateMaterial(tailFin, fuselageColor)
    if (engineLeft) {
      animateMaterial(engineLeft, fuselageColor)
      gsap.to(engineLeft.material.emissive, {
        r: glowColor.r,
        g: glowColor.g,
        b: glowColor.b,
        duration
      })
      gsap.to(engineLeft.material, { emissiveIntensity: config.engineGlow, duration })
    }
    if (engineRight) {
      animateMaterial(engineRight, fuselageColor)
      gsap.to(engineRight.material.emissive, {
        r: glowColor.r,
        g: glowColor.g,
        b: glowColor.b,
        duration
      })
      gsap.to(engineRight.material, { emissiveIntensity: config.engineGlow, duration })
    }
    if (glowLeft) gsap.to(glowLeft.material, { opacity: config.contrail, duration, ease: 'sine.out' })
    if (glowRight) gsap.to(glowRight.material, { opacity: config.contrail, duration, ease: 'sine.out' })
  }, [activeProject])

  const playTick = () => {
    if (typeof window === 'undefined') return

    let ctx = audioCtxRef.current
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctx = new AC()
      audioCtxRef.current = ctx
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'

    const now = ctx.currentTime

    // start at higher pitch then drop quickly for a gun-like click
    osc.frequency.setValueAtTime(1800, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.09)

    // fast attack, short decay, slightly lower volume
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  }

  const fireLasers = now => {
    // play a short tick for each firing burst
    playTick()
    const controlGroup = controlRef.current
    if (controlGroup) controlGroup.updateMatrixWorld(true)

    const floatGroup = floatRef.current
    if (floatGroup) floatGroup.updateMatrixWorld(true)

    const plane = planeRef.current
    if (!plane) return
    const worldPosition = new THREE.Vector3()
    const forward = new THREE.Vector3(1, 0, 0)
    const quaternion = new THREE.Quaternion()
    plane.getWorldPosition(worldPosition)
    plane.getWorldQuaternion(quaternion)

    const aimDirection = aimRef.current.clone()
    if (aimDirection.lengthSq() === 0) {
      aimDirection.set(1, 0, 0)
    }

    const planeForward = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize()
    const direction = planeForward.clone().lerp(aimDirection, 0.85).normalize()
    const rotationQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    const euler = new THREE.Euler().setFromQuaternion(rotationQuat)

    const speed = 3.2
    const vel = direction.clone().multiplyScalar(speed)

    const guns = noseGunRefs.current.filter(Boolean)
    const newLasersFromGuns = guns.length
      ? guns.map(gun => {
          gun.updateMatrixWorld(true)
          const gunWorld = new THREE.Vector3()
          gun.getWorldPosition(gunWorld)
          return {
            id: laserIdRef.current++,
            x: gunWorld.x + direction.x * 0.15,
            y: gunWorld.y + direction.y * 0.15,
            z: gunWorld.z + direction.z * 0.15,
            vx: vel.x,
            vy: vel.y,
            vz: vel.z,
            rx: euler.x,
            ry: euler.y,
            rz: euler.z,
            ttl: 160
          }
        })
      : [
          {
            id: laserIdRef.current++,
            x: worldPosition.x + direction.x * 3.2,
            y: worldPosition.y + direction.y * 3.2,
            z: worldPosition.z + direction.z * 3.2,
            vx: vel.x,
            vy: vel.y,
            vz: vel.z,
            rx: euler.x,
            ry: euler.y,
            rz: euler.z,
            ttl: 160
          }
        ]

    const next = [...lasersRef.current, ...newLasersFromGuns]
    lasersRef.current = next
    setLasers(next)
    lastShotRef.current = now
  }

  useEffect(() => {
    const handleKeyDown = event => {
      // mark that the player has interacted so missiles can start spawning
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
      }

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        // if fully crashed (3/3 hits), Space reloads the page to continue
        if (crashedRef.current && hitsRef.current >= 3) {
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
          return
        }

        if (!firingRef.current) {
          firingRef.current = true
          fireLasers(performance.now())
        }
        return
      }

      if (
        event.code === 'Enter' ||
        event.code === 'NumpadEnter' ||
        event.key === 'Enter' ||
        event.key === 'Return'
      ) {
        if (typeof onSelectProject === 'function') {
          let target = null

          // Prefer the current hinted target if we have one
          if (hintTargetId != null) {
            target = targetsRef.current.find(t => t.id === hintTargetId && t.alive)
          }

          // If no hinted target, fall back to the nearest alive target to the plane
          if (!target) {
            const { x: px, y: py, z: pz } = movementRef.current
            let best = null
            let bestDistSq = Infinity
            for (const t of targetsRef.current) {
              if (!t.alive) continue
              const dx = t.x - px
              const dy = t.y - py
              const dz = t.z - pz
              const d2 = dx * dx + dy * dy + dz * dz
              if (d2 < bestDistSq) {
                bestDistSq = d2
                best = t
              }
            }
            target = best
          }

          if (target) {
            const project = PROJECTS[target.projectIndex]
            if (project) {
              // small delay so the wormhole enter animation can play before page change
              setTimeout(() => {
                onSelectProject(project)
              }, 600)
            }
          }
        }
        return
      }

      if (!CONTROL_KEYS.includes(event.key)) return
      event.preventDefault()
      keyStateRef.current[event.key] = true
    }

    const handleKeyUp = event => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        firingRef.current = false
        return
      }

      if (!CONTROL_KEYS.includes(event.key)) return
      event.preventDefault()
      keyStateRef.current[event.key] = false
    }

    const handleMobileControl = event => {
      const { key, pressed } = event.detail || {}
      if (!key) return

      const syntheticEvent = {
        key,
        code: key,
        preventDefault: () => {}
      }

      if (key === 'Space') {
        if (pressed) {
          handleKeyDown({ ...syntheticEvent, code: 'Space' })
        } else {
          handleKeyUp({ ...syntheticEvent, code: 'Space' })
        }
        return
      }

      if (key === 'Enter') {
        if (pressed) {
          handleKeyDown({ ...syntheticEvent, code: 'Enter' })
        } else {
          handleKeyUp({ ...syntheticEvent, code: 'Enter' })
        }
        return
      }

      if (pressed) {
        handleKeyDown(syntheticEvent)
      } else {
        handleKeyUp(syntheticEvent)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mobile-control', handleMobileControl)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mobile-control', handleMobileControl)
    }
  }, [])

  const setSmokeRef = index => mesh => {
    smokeParticlesRef.current[index] = mesh
  }

  const setPropellerRef = index => mesh => {
    propellerRefs.current[index] = mesh
  }

  const setNoseGunRef = index => mesh => {
    noseGunRefs.current[index] = mesh
  }

  return (
    <>
      <group ref={controlRef}>
        <group ref={floatRef}>
          <group
            ref={planeRef}
            position={[0, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[0.5, 0.5, 0.5]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <mesh name="fuselage" geometry={fuselageGeometry} rotation={[0, 0, -Math.PI / 2]}>
              <meshPhysicalMaterial
                color={hovered ? '#ffffff' : '#ffffff'}
                metalness={0.85}
                roughness={0.18}
                clearcoat={1}
                clearcoatRoughness={0.08}
              />
            </mesh>

            <group name="noseGuns" position={[2.6, -0.15, 0]} rotation={[0, 0, 0]}>
              {[
                { name: 'noseGunLeft', offset: -0.25 },
                { name: 'noseGunRight', offset: 0.25 }
              ].map((gun, index) => (
                <mesh
                  key={gun.name}
                  name={gun.name}
                  position={[0, 0, gun.offset]}
                  rotation={[0, 0, Math.PI / 2]}
                  ref={setNoseGunRef(index)}
                >
                  <cylinderGeometry args={[0.05, 0.05, 0.9, 12]} />
                  <meshPhysicalMaterial color="#cdd7ff" metalness={0.8} roughness={0.2} />
                  <mesh position={[0.45, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
                    <meshPhysicalMaterial color="#f8f9ff" metalness={0.6} roughness={0.15} />
                  </mesh>
                </mesh>
              ))}
            </group>

          <mesh name="stripe" position={[0, 0.25, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 5.4, 48, 1, true]} />
            <meshPhysicalMaterial
              color="#f7fbff"
              side={THREE.DoubleSide}
              transparent={false}
              metalness={0.25}
              roughness={0.15}
            />
          </mesh>

          <mesh name="canopy" position={[1.4, 0.55, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <capsuleGeometry args={[0.32, 0.8, 12, 20]} />
            <meshPhysicalMaterial
              color="#8fb8ff"
              transparent
              opacity={0.82}
              roughness={0.05}
              metalness={0.25}
              transmission={0.85}
              clearcoat={0.6}
              clearcoatRoughness={0.05}
            />
          </mesh>

          <mesh name="windowStrip" position={[0.9, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <boxGeometry args={[3.4, 0.25, 0.1]} />
            <meshPhysicalMaterial
              color="#dfefff"
              transparent
              opacity={0.8}
              roughness={0.15}
              metalness={0.1}
            />
          </mesh>

          <mesh
            name="wingLeft"
            geometry={wingGeometry}
            position={[0.2, -0.25, -0.05]}
            rotation={[-Math.PI / 2 + THREE.MathUtils.degToRad(6), THREE.MathUtils.degToRad(15), 0]}
            scale={[1, 1, 1]}
          >
            <meshPhysicalMaterial color="#d3e4ff" side={THREE.DoubleSide} metalness={0.6} roughness={0.2} />
          </mesh>

          <mesh
            name="wingRight"
            geometry={wingGeometry}
            position={[0.2, -0.25, 0.05]}
            rotation={[-Math.PI / 2 + THREE.MathUtils.degToRad(6), -THREE.MathUtils.degToRad(15), 0]}
            scale={[1, 1, -1]}
          >
            <meshPhysicalMaterial color="#d3e4ff" side={THREE.DoubleSide} metalness={0.6} roughness={0.2} />
          </mesh>

          <mesh
            name="wingletLeft"
            position={[2.2, 0.1, -1.25]}
            rotation={[0, THREE.MathUtils.degToRad(25), 0]}
          >
            <boxGeometry args={[0.08, 0.9, 0.45]} />
            <meshPhysicalMaterial color="#eef2ff" metalness={0.6} roughness={0.2} />
          </mesh>

          <mesh
            name="wingletRight"
            position={[2.2, 0.1, 1.25]}
            rotation={[0, -THREE.MathUtils.degToRad(25), 0]}
          >
            <boxGeometry args={[0.08, 0.9, 0.45]} />
            <meshPhysicalMaterial color="#eef2ff" metalness={0.6} roughness={0.2} />
          </mesh>

          <mesh
            name="flapLeft"
            position={[0.7, -0.05, -1.3]}
            rotation={[THREE.MathUtils.degToRad(12), 0, -Math.PI / 2]}
          >
            <boxGeometry args={[1.4, 0.08, 0.3]} />
            <meshPhysicalMaterial color="#a7c6ff" metalness={0.35} roughness={0.3} />
          </mesh>

          <mesh
            name="flapRight"
            position={[0.7, -0.05, 1.3]}
            rotation={[THREE.MathUtils.degToRad(-12), 0, -Math.PI / 2]}
          >
            <boxGeometry args={[1.4, 0.08, 0.3]} />
            <meshPhysicalMaterial color="#a7c6ff" metalness={0.35} roughness={0.3} />
          </mesh>

          <mesh
            name="tailPlane"
            geometry={tailGeometry}
            position={[-2.4, 0.2, 0]}
            rotation={[-Math.PI / 2 + THREE.MathUtils.degToRad(5), 0, 0]}
          >
            <meshPhysicalMaterial color="#d9e6ff" side={THREE.DoubleSide} metalness={0.55} roughness={0.25} />
          </mesh>

          <mesh name="bellyStripe" position={[0, -0.65, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[4.6, 0.3, 0.4]} />
            <meshPhysicalMaterial color="#ff3b3b" metalness={0.5} roughness={0.3} />
          </mesh>

          <mesh name="tailFin" geometry={finGeometry} position={[-3, 0.6, 0]} rotation={[0, 0, 0]}>
            <meshPhysicalMaterial color="#ffd54f" metalness={0.6} roughness={0.2} />
          </mesh>

          <mesh name="tailCap" position={[-3.2, 0.3, 0]}>
            <sphereGeometry args={[0.25, 20, 20]} />
            <meshPhysicalMaterial color="#8fe0ff" metalness={0.6} roughness={0.25} />
          </mesh>

          <mesh name="engineLeft" position={[-0.3, -0.55, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 1.3, 32]} />
            <meshPhysicalMaterial
              color="#b7e7ff"
              emissive="#c0f7ff"
              emissiveIntensity={1.3}
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>

          <mesh name="engineRight" position={[-0.3, -0.55, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 1.3, 32]} />
            <meshPhysicalMaterial
              color="#b7e7ff"
              emissive="#c0f7ff"
              emissiveIntensity={1.3}
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>

          <group name="smokeTrail">
            {Array.from({ length: SMOKE_COUNT }).map((_, index) => (
              <mesh
                key={`smoke-${index}`}
                ref={setSmokeRef(index)}
                position={[-1.4 - index * 0.2, -0.55, index % 2 === 0 ? -0.9 : 0.9]}
              >
                <sphereGeometry args={[0.28, 12, 12]} />
                <meshPhysicalMaterial
                  color="#eef7ff"
                  transparent
                  opacity={0.45}
                  roughness={0.9}
                  metalness={0}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>

          <mesh name="contrailLeft" position={[-1.2, -0.55, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 2.4]} />
            <meshBasicMaterial color="#e6f4ff" transparent opacity={0.35} />
          </mesh>

          <mesh name="contrailRight" position={[-1.2, -0.55, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 2.4]} />
            <meshBasicMaterial color="#e6f4ff" transparent opacity={0.35} />
          </mesh>

          <group name="propellerLeft" ref={setPropellerRef(0)} position={[1.85, -0.25, -1.2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.45, 20]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.4} roughness={0.08} emissive="#ffffff" emissiveIntensity={0.2} />
            <mesh name="propellerLeftBlades" rotation={[0, 0, 0]}>
              <boxGeometry args={[1.8, 0.07, 0.15]} />
              <meshPhysicalMaterial color="#ffffff" metalness={0.3} roughness={0.08} emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.8, 0.07, 0.15]} />
              <meshPhysicalMaterial color="#ffffff" metalness={0.3} roughness={0.08} emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
          </group>

          <group name="propellerRight" ref={setPropellerRef(1)} position={[1.85, -0.25, 1.2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.45, 20]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.4} roughness={0.08} emissive="#ffffff" emissiveIntensity={0.2} />
            <mesh name="propellerRightBlades" rotation={[0, 0, 0]}>
              <boxGeometry args={[1.8, 0.07, 0.15]} />
              <meshPhysicalMaterial color="#ffffff" metalness={0.3} roughness={0.08} emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.8, 0.07, 0.15]} />
              <meshPhysicalMaterial color="#ffffff" metalness={0.3} roughness={0.08} emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
          </group>

          <mesh name="bellyLight" position={[0.3, -0.8, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial emissive="#9bf6ff" emissiveIntensity={hovered ? 1.8 : 0.8} color="#ffffff" />
          </mesh>
        </group>
      </group>
    </group>

      <group name="targets">
        {targets.filter(t => t.alive).map(target => {
          const project = PROJECTS[target.projectIndex] || PROJECTS[0]
          const accent = project.accent || '#38bdf8'
          const badgeColor = project.badge || '#f9fafb'

          const { height } = viewportRef.current || { height: 9 }
          const maxY = height / 2 - 0.6
          const floorY = -maxY - 0.5
          const poleLength = Math.max(1.5, target.y - floorY)
          const poleHalf = poleLength / 2
          const poleCenterLocalY = floorY + poleHalf - target.y
          const movement = movementRef.current || { x: 0, y: 0, z: 0 }
          const dx = movement.x - target.x
          const dy = movement.y - target.y
          const dz = movement.z - target.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          const hintRadius = 3
          const proximity = Math.max(0, 1 - dist / hintRadius)
          const scale = 1 + proximity * 0.6

          const handleTargetClick = event => {
            event.stopPropagation()
            if (typeof onSelectProject === 'function') {
              const proj = PROJECTS[target.projectIndex]
              if (proj) onSelectProject(proj)
            }
          }

          return (
            <group
              key={target.id}
              position={[target.x, target.y, target.z]}
              rotation={[0, 0.3, 0]}
              scale={[scale, scale, scale]}
              onClick={handleTargetClick}
            >
              {/* wormhole outer ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.6, 0.15, 24, 64]} />
                <meshStandardMaterial
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={0.7}
                  metalness={0.6}
                  roughness={0.25}
                />
              </mesh>

              {/* inner energy ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.0, 0.07, 20, 48]} />
                <meshStandardMaterial
                  color="#e5e7eb"
                  emissive={accent}
                  emissiveIntensity={1.1}
                  metalness={0.3}
                  roughness={0.1}
                />
              </mesh>

              {/* central glow disk */}
              <mesh position={[0, 0, 0.18]}>
                <circleGeometry args={[0.85, 48]} />
                <meshStandardMaterial
                  color={badgeColor}
                  emissive={accent}
                  emissiveIntensity={1.4}
                  transparent
                  opacity={0.8}
                  roughness={0.15}
                />
              </mesh>

              {/* title hovering above wormhole */}
              <Text
                position={[0, 1.6, 0.45]}
                fontSize={0.46}
                maxWidth={3.6}
                color="#f9fafb"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#020617"
                strokeColor={accent}
                strokeWidth={0.02}
              >
                {project.title}
              </Text>

              {/* bomb hanging below wormhole */}
              <group position={[0, -0.9, 0.05]}>
                <mesh position={[0, -0.1, 0]}>
                  <cylinderGeometry args={[0.16, 0.24, 0.5, 16]} />
                  <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
                </mesh>

                <mesh position={[0, 0.2, 0]}>
                  <coneGeometry args={[0.18, 0.35, 16]} />
                  <meshStandardMaterial color={accent} metalness={0.85} roughness={0.25} />
                </mesh>

                <mesh position={[0, 0.45, 0]}>
                  <sphereGeometry args={[0.07, 12, 12]} />
                  <meshStandardMaterial emissive={accent} emissiveIntensity={1.2} color={badgeColor} />
                </mesh>
              </group>
            </group>
          )
        })}
      </group>

      <group name="explosions">
        {explosions.map(explosion => {
          const life = explosion.ttl / 26
          const t = 1 - life
          const baseScale = 0.4 + t * 0.3
          const opacity = Math.max(0, life)

          return (
            <group key={explosion.id} position={[explosion.x, explosion.y, explosion.z]}>
              {SHARD_DIRECTIONS.map(([dx, dy, dz], index) => {
                const spread = 1.6
                const px = dx * spread * t
                const py = dy * spread * t
                const pz = dz * spread * t
                const rot = t * Math.PI * (index % 2 === 0 ? 1 : -1)

                return (
                  <mesh
                    key={`${explosion.id}-shard-${index}`}
                    position={[px, py, pz]}
                    rotation={[rot * 0.6, rot * 0.9, rot * 0.4]}
                    scale={[baseScale, baseScale * 0.4, baseScale]}
                  >
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial
                      color="#fee2e2"
                      emissive="#f97316"
                      emissiveIntensity={2 * opacity}
                      transparent
                      opacity={0.45 * opacity}
                      roughness={0.45}
                      metalness={0.2}
                    />
                  </mesh>
                )
              })}
            </group>
          )
        })}
      </group>

      <group name="rockets">
        {rockets.map(rocket => (
          <group key={rocket.id} position={[rocket.x, rocket.y, rocket.z]} rotation={[0, 0, 0]}>
            {/* main missile body */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.14, 0.14, 1.5, 20]} />
              <meshStandardMaterial color="#f9fafb" metalness={0.7} roughness={0.25} />
            </mesh>

            {/* mid-body stripe */}
            <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.55, 20]} />
              <meshStandardMaterial color="#f97316" metalness={0.9} roughness={0.25} />
            </mesh>

            {/* rocket nose */}
            <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.2, 0.5, 20]} />
              <meshStandardMaterial color="#991b1b" metalness={0.95} roughness={0.22} />
            </mesh>

            {/* tail fins */}
            <group position={[-0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[0.02, 0.32, 0.18]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.18, 0]}>
                <boxGeometry args={[0.02, 0.32, 0.18]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, 0.18]}>
                <boxGeometry args={[0.02, 0.32, 0.18]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, -0.18]}>
                <boxGeometry args={[0.02, 0.32, 0.18]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>

            {/* exhaust flame + smoke */}
            <group position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              {/* outer flame */}
              <mesh>
                <coneGeometry args={[0.32, 0.95, 16]} />
                <meshStandardMaterial
                  color="#facc15"
                  emissive="#f97316"
                  emissiveIntensity={3.2}
                  transparent
                  opacity={0.8}
                  roughness={0.5}
                  metalness={0.05}
                />
              </mesh>

              {/* inner hot core */}
              <mesh position={[0.05, 0, 0]}>
                <coneGeometry args={[0.16, 0.55, 12]} />
                <meshStandardMaterial
                  color="#fee2e2"
                  emissive="#60a5fa"
                  emissiveIntensity={2.8}
                  transparent
                  opacity={0.9}
                  roughness={0.3}
                  metalness={0.05}
                />
              </mesh>

              {/* smoke puff behind flame */}
              <mesh position={[-0.3, 0, 0]}>
                <sphereGeometry args={[0.18, 12, 12]} />
                <meshStandardMaterial
                  color="#e5e7eb"
                  transparent
                  opacity={0.45}
                  roughness={0.9}
                  metalness={0}
                />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      <group name="lasers">
        {lasers.map(laser => (
          <mesh key={laser.id} position={[laser.x, laser.y, laser.z]} rotation={[laser.rx, laser.ry, laser.rz]} scale={[1, 1.4, 1]}>
            <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
            <meshStandardMaterial
              color="#ffb347"
              emissive="#ffd77a"
              emissiveIntensity={3.4}
              roughness={0.05}
              metalness={0.35}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}
