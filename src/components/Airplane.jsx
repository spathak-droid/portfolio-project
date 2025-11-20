import { useMemo, useRef, useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

const CONTROL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const SMOKE_COUNT = 32
const FIRE_RATE_MS = 100

export default function Airplane({ activeProject }) {
  const { viewport } = useThree()
  const controlRef = useRef()
  const gunSoundRef = useRef(null);
  const floatRef = useRef()
  const planeRef = useRef()
  const keyStateRef = useRef({})
  const movementRef = useRef({ x: -3, y: 2, z: 0, vx: 0, vy: 0, vz: 0 })
  const smokeParticlesRef = useRef([])
  const propellerRefs = useRef([])
  const noseGunRefs = useRef([])
  const lasersRef = useRef([])
  const firingRef = useRef(false)
  const lastShotRef = useRef(0)
  const laserIdRef = useRef(0)
  const aimRef = useRef(new THREE.Vector3(1, 0, 0))
  const viewportRef = useRef(viewport)
  const [hovered, setHovered] = useState(false)
  const [lasers, setLasers] = useState([])

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  useEffect(() => {
  gunSoundRef.current = new Audio('/sounds/gun.mp3');
  gunSoundRef.current.volume = 0.9; // Adjust volume as needed
  return () => {
    if (gunSoundRef.current) {
      gunSoundRef.current.pause();
      gunSoundRef.current = null;
    }
  };
}, []);

// Add this inside the Airplane component, with other effects
useEffect(() => {
  const handleKeyUp = (e) => {
    if (e.code === 'Space') {
      if (gunSoundRef.current) {
        gunSoundRef.current.pause();
      }
      firingRef.current = false;
    }
  };

  window.addEventListener('keyup', handleKeyUp);
  return () => {
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);

// Also update the keydown handler to ensure sound plays when space is pressed
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!firingRef.current) {
        firingRef.current = true;
        fireLasers(performance.now());
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, []);

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
        const inputX = (keyState.ArrowRight ? 1 : 0) - (keyState.ArrowLeft ? 1 : 0)
        const inputY = (keyState.ArrowUp ? 1 : 0) - (keyState.ArrowDown ? 1 : 0)

        movement.vx += inputX * 0.012
        movement.vy += inputY * 0.012
        movement.vz += (Math.abs(inputX) + Math.abs(inputY)) * -0.003

        movement.vx *= 0.85
        movement.vy *= 0.85
        movement.vz *= 0.92

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

        const rollTarget = THREE.MathUtils.clamp(-inputX * 0.6, -0.8, 0.8)
        const pitchTarget = THREE.MathUtils.clamp(-inputY * 0.5, -0.55, 0.55)
        const yawTarget = THREE.MathUtils.clamp(inputX * 0.25, -0.35, 0.35)

        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pitchTarget, 0.2)
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, yawTarget, 0.2)
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, rollTarget, 0.2)

        const plane = planeRef.current
        if (plane) {
          plane.updateMatrixWorld(true)
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

      if (lasersRef.current.length) {
        let updated = false
        const updatedLasers = lasersRef.current.map(laser => {
          const ttl = laser.ttl !== undefined ? laser.ttl - 1 : 90
          const next = {
            ...laser,
            x: laser.x + laser.vx,
            y: laser.y + laser.vy,
            z: laser.z + laser.vz,
            ttl
          }
          return next
        }).filter(l => l.ttl > 0 && Math.abs(l.x) < 50 && Math.abs(l.y) < 50 && Math.abs(l.z) < 50)

        if (updatedLasers.length !== lasersRef.current.length) {
          updated = true
        }

        lasersRef.current = updatedLasers
        if (updated) {
          setLasers(updatedLasers)
        } else if (lasersRef.current.length) {
          // even if counts same, still need to update positions each frame
          setLasers([...updatedLasers])
        }
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

  const fireLasers = now => {

    if (gunSoundRef.current) {
      gunSoundRef.current.currentTime = 0
      gunSoundRef.current.play().catch(e => console.error('Gun sound error:', e))
    }

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
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        if (!firingRef.current) {
          firingRef.current = true
          fireLasers(performance.now())
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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
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
