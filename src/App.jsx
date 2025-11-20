import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import Clouds2D from './components/Clouds2D'
import Airplane from './components/Airplane'
import './App.css'
import ThunderEffect from './components/ThunderEffect'


function Rain({ count = 2000 }) {
  const rainRef = useRef()
  const rainGeometry = new THREE.BufferGeometry()
  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true
  })

  // Create rain positions
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50
    positions[i + 1] = Math.random() * 50
    positions[i + 2] = (Math.random() - 0.5) * 50
  }

  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  // Animate rain
  useFrame(() => {
    if (!rainRef.current) return
    
    const positions = rainGeometry.attributes.position.array
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= 0.5
      if (positions[i] < -10) {
        positions[i] = 50
        positions[i - 1] = (Math.random() - 0.5) * 50
        positions[i + 1] = (Math.random() - 0.5) * 50
      }
    }
    rainGeometry.attributes.position.needsUpdate = true
  })

  return <points ref={rainRef} geometry={rainGeometry} material={rainMaterial} />
}

function BackgroundSound() {
  const planeSound = useRef(null)
  const thunderSound = useRef(null)

  useEffect(() => {
    console.log('Initializing sounds...')
    
    // Initialize plane sound
    planeSound.current = new Audio('/sounds/plane.mp3')
    planeSound.current.volume = 0.2
    planeSound.current.loop = true

    // Initialize thunder sound (lower volume)
    thunderSound.current = new Audio('/sounds/thunder.mp3')
    thunderSound.current.volume = 0.6
    thunderSound.current.loop = true

    const handleFirstInteraction = () => {
      console.log('First interaction detected, starting sounds...')
      
      // Play plane sound
      planeSound.current.play()
        .then(() => console.log('Plane sound started'))
        .catch(e => console.error('Plane sound failed:', e.message))
      
      // Start thunder sound after a delay
      setTimeout(() => {
        thunderSound.current.play()
          .then(() => console.log('Thunder sound started'))
          .catch(e => console.error('Thunder sound failed:', e.message))
      }, 2000) // 2 second delay for thunder

      // Remove event listeners
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }

    // Add event listeners
    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })

    // Cleanup
    return () => {
      console.log('Cleaning up sounds...')
      if (planeSound.current) {
        planeSound.current.pause()
        planeSound.current = null
      }
      if (thunderSound.current) {
        thunderSound.current.pause()
        thunderSound.current = null
      }
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  return null
}

function App() {
  const [activeProject] = useState(0)

  return (
    <div className="app">
      <ThunderEffect />
      <BackgroundSound />
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Welcome to</p>
          <h1>My Portfolio</h1>
          <p className="subtitle">An interactive flight through my work.</p>
        </div>
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 18], fov: 65 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.9} />
            <pointLight position={[-10, -10, -10]} intensity={0.4} />
            <Airplane activeProject={activeProject} />
            <OrbitControls enableZoom={false} />
            <Stars radius={80} depth={40} count={4000} factor={3} />
            <Clouds2D count={10} />
            <Rain count={2000} />
          </Canvas>
        </div>
      </section>
    </div>
  )
}

export default App