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
    // Initialize plane sound from local public/sounds folder
    planeSound.current = new Audio('/sounds/plane.mp3')
    planeSound.current.volume = 0.2
    planeSound.current.loop = true

    // Initialize thunder sound (lower volume)
    thunderSound.current = new Audio('/sounds/thunder.mp3')
    thunderSound.current.volume = 0.6
    thunderSound.current.loop = true

    const handleFirstInteraction = () => {
      // Play plane sound
      planeSound.current
        .play()
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('Plane sound started')
        })
        .catch(e => {
          // eslint-disable-next-line no-console
          console.error('Plane sound failed', e)
        })
      
      // Start thunder sound after a delay
      setTimeout(() => {
        thunderSound.current
          .play()
          .then(() => {
            // eslint-disable-next-line no-console
            console.log('Thunder sound started')
          })
          .catch(e => {
            // eslint-disable-next-line no-console
            console.error('Thunder sound failed', e)
          })
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
      // eslint-disable-next-line no-console
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
  const [hintProject, setHintProject] = useState(null)
  const [hits, setHits] = useState(0)
  const [selectedProject, setSelectedProject] = useState(null)
  const [view, setView] = useState('home') // 'home' | 'projects'
  const [transitioning, setTransitioning] = useState(false)

  const handleSelectProject = project => {
    if (!project) return
    setSelectedProject(project)
    setTransitioning(true)

    setTimeout(() => {
      setView('projects')
      setTransitioning(false)
      if (typeof window !== 'undefined' && window.history && window.location.pathname !== '/projects') {
        window.history.pushState({}, '', '/projects')
      }
    }, 600)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname === '/projects') {
      setView('projects')
    }
  }, [])

  return (
    <div className="app">
      <ThunderEffect />
      <BackgroundSound />
      <section className="hero">
        {view === 'home' && (
          <div className="hero-content">
            <p className="eyebrow">Welcome to</p>
            <h1>My Portfolio</h1>
            <p className="subtitle">An interactive flight through my work.</p>
          </div>
        )}
        {view === 'projects' && selectedProject && (
          <div className="hero-content hero-project">
            <p className="eyebrow">Project</p>
            <div className="hero-project-header">
              <h1>{selectedProject.title}</h1>
              {selectedProject.title === 'Lead Generation CRM Plugin' && (
                <button
                  type="button"
                  className="hero-project-link-button"
                  onClick={() =>
                    window.open('https://stella.serviceservice.com/crm', '_blank', 'noopener,noreferrer')
                  }
                >
                  <span className="sr-only">Open project</span>
                  <span className="arrow">→</span>
                </button>
              )}
              {selectedProject.title === 'Project Management Mono Repo' && (
                <button
                  type="button"
                  className="hero-project-link-button github"
                  onClick={() =>
                    window.open(
                      'https://github.com/spathak-droid/spathak-0a19fc14-d0eb-42ed-850d-63023568a3e3',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  <span className="sr-only">Open Project Management mono repo on GitHub</span>
                  <span className="github-mark">
                    <img src="/pngegg.png" alt="GitHub" />
                  </span>
                </button>
              )}
              {selectedProject.title === 'Agent CRM' && (
                <button
                  type="button"
                  className="hero-project-link-button"
                  onClick={() =>
                    window.open('https://crm.serviceservice.com', '_blank', 'noopener,noreferrer')
                  }
                >
                  <span className="sr-only">Open Agent CRM</span>
                  <span className="arrow">→</span>
                </button>
              )}
              {selectedProject.title === 'Hear Helper' && (
                <>
                  <button
                    type="button"
                    className="hero-project-link-button"
                    onClick={() =>
                      window.open('https://localhost:4200/', '_blank', 'noopener,noreferrer')
                    }
                  >
                    <span className="sr-only">Open Hear Helper app</span>
                    <span className="arrow">→</span>
                  </button>
                  <button
                    type="button"
                    className="hero-project-link-button github"
                    onClick={() =>
                      window.open('https://github.com/spathak-droid/HearHelper', '_blank', 'noopener,noreferrer')
                    }
                  >
                    <span className="sr-only">Open Hear Helper frontend on GitHub</span>
                    <span className="github-mark">
                      <img src="/pngegg.png" alt="GitHub" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="hero-project-link-button github"
                    onClick={() =>
                      window.open('https://github.com/spathak-droid/HearHelper-BE', '_blank', 'noopener,noreferrer')
                    }
                  >
                    <span className="sr-only">Open Hear Helper backend on GitHub</span>
                    <span className="github-mark">
                      <img src="/pngegg.png" alt="GitHub" />
                    </span>
                  </button>
                </>
              )}
            </div>
            {selectedProject.title !== 'About Me' && (
              <p className="hero-project-button-hint">Click the buttons above to see the project or its code.</p>
            )}
            {selectedProject.title === 'Hear Helper' && (
              <p className="hero-project-legend">Frontend and Backend</p>
            )}
            {selectedProject.title === 'Project Management Mono Repo' && (
              <div className="hero-project-body">
                <p className="hero-project-link">
                  Monorepo built with <span className="tech-highlight">NestJS</span> and
                  <span className="tech-highlight"> Angular</span> for a Jira-like project
                  management experience.
                </p>
                <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    className="hero-project-link-button github"
                    onClick={() =>
                      window.open(
                        'https://github.com/spathak-droid/spathak-0a19fc14-d0eb-42ed-850d-63023568a3e3',
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <span className="sr-only">Open Project Management mono repo on GitHub</span>
                    <span className="github-mark">
                      <img src="/pngegg.png" alt="GitHub" />
                    </span>
                  </button>
                </div>
                <ul className="hero-project-points">
                  <li>
                    Supports admin, owner, and viewer roles with
                    <span className="tech-highlight"> JWT</span>-based authentication and
                    role-aware dashboards.
                  </li>
                  <li>
                    Owner-level hierarchy for organizing companies and sister
                    orgs so owners can manage tasks across related teams.
                  </li>
                  <li>
                    Fine-grained permissions to create projects, manage
                    boards, add users, assign tasks, and update or delete
                    work items.
                  </li>
                  <li>
                    Kanban-style boards with drag-and-drop columns and
                    cards, mirroring Jira-like task workflows.
                  </li>
                  <li>
                    Designed as a mono repo so shared types, APIs, and UI
                    components are reused between the NestJS backend and the
                    Angular frontend.
                  </li>
                </ul>
              </div>
            )}
            {selectedProject.title === 'Lead Generation CRM Plugin' && (
              <div className="hero-project-body">
                <p className="hero-project-link">
                  Lives inside All My Sons CRM at
                  <span> stella.serviceservice.com/crm</span>
                </p>
                <ul className="hero-project-points">
                  <li>
                    Designed and built an iframe-based sales plugin integrated into
                    All My Sons’ internal CRM to capture and process customer leads
                    in real time.
                  </li>
                  <li>
                    Implemented <span className="tech-highlight">TypeScript</span>,
                    <span className="tech-highlight"> React</span> (frontend), and
                    <span className="tech-highlight"> Node.js</span> (backend) with
                    <span className="tech-highlight"> NLP.js</span> and LLM-based service
                    classification to extract customer intents from free-form
                    speech.
                  </li>
                  <li>
                    Integrated a lightweight
                    <span className="tech-highlight"> retrieval-augmented generation</span>
                    (RAG) pipeline over the LLM service table to dynamically match
                    vendors such as SafeHaven, Penske, Junk.com, and National Van
                    Lines.
                  </li>
                  <li>
                    Used <span className="tech-highlight">WebSockets</span> for
                    bi-directional communication between the CRM and the LLM
                    service, enabling real-time question–response loops for sales
                    agents.
                  </li>
                  <li>
                    Simplified cross-team collaboration by embedding the plugin
                    directly into the All My Sons CRM — allowing customer
                    advocates to route or text customers instantly without
                    switching apps.
                  </li>
                </ul>
              </div>
            )}
            {selectedProject.title === 'Agent CRM' && (
              <div className="hero-project-body">
                <p className="hero-project-link">
                  Agent-facing CRM for managing internal moving ops and external
                  vendor referrals at
                  <span> crm.serviceservice.com</span>.
                </p>
                <ul className="hero-project-points">
                  <li>
                    Developed a full-stack CRM platform to manage internal
                    moving operations and outbound vendor referrals.
                  </li>
                  <li>
                    Built tools to onboard partner companies, register
                    services, assign management roles, and automate 10% referral
                    fee billing via integrated service APIs.
                  </li>
                  <li>
                    Implemented an agentic-flow system with a visual Journey
                    Builder (React Flow) so non-technical users can design
                    conversational and conditional logic flows across chat,
                    SMS, and voice.
                  </li>
                  <li>
                    Enabled cross-company collaboration: e.g. SafeHaven agents
                    can transfer moving calls to All My Sons, while All My Sons
                    can route pest-control or rental leads back to partners.
                  </li>
                  <li>
                    Architected with <span className="tech-highlight">Node.js</span>,
                    <span className="tech-highlight"> GraphQL</span>,
                    <span className="tech-highlight"> MongoDB</span>, and
                    <span className="tech-highlight"> WebSockets</span> for real-time
                    messaging, live departmental updates, and multi-team
                    coordination.
                  </li>
                  <li>
                    Delivered measurable revenue by automating lead exchange,
                    strengthening partner relationships, and generating
                    referral-based income streams.
                  </li>
                </ul>
              </div>
            )}
            {selectedProject.title === 'Hear Helper' && (
              <div className="hero-project-body">
                <p className="hero-project-link">
                  Hear Helper lets you listen to public-domain books using AI
                  voices you choose, running as a focused one-page assistant.
                </p>
                <ul className="hero-project-points">
                  <li>
                    Built with an <span className="tech-highlight">Angular</span> SPA
                    frontend and <span className="tech-highlight">Django</span> backend to
                    manage user libraries, playback sessions, and audio jobs.
                  </li>
                  <li>
                    Uses <span className="tech-highlight">Cloudflare R2</span> for
                    storing generated audio so you can stream long-form book audio
                    efficiently and cheaply.
                  </li>
                  <li>
                    Integrates multiple TTS models so you can pick the voice
                    and style you want, then generate full-book audio on demand.
                  </li>
                  <li>
                    One-page assistant UI where you can see your available
                    books, play/pause, jump chapters, change voice models, and
                    resume where you left off.
                  </li>
                  <li>
                    Designed around public-domain content so you can safely
                    explore classic literature as high-quality generated audio.
                  </li>
                </ul>
              </div>
            )}
            {selectedProject.title === 'About Me' && (
              <div className="hero-project-body">
                <p className="hero-project-link">
                  I build end-to-end systems that connect real businesses to
                  practical AI and modern web tooling.
                </p>
                <p className="hero-project-link">
                  Contact me:
                  <span>
                    {' '}
                    <a href="mailto:pathaksandesh025@gmail.com">pathaksandesh025@gmail.com</a>
                  </span>
                </p>
                <ul className="hero-project-points">
                  <li>
                    Comfortable across the stack: frontend (React/Angular),
                    backend (Node.js/NestJS/Django), databases, and DevOps.
                  </li>
                  <li>
                    Enjoy taking fuzzy business ideas and turning them into
                    shippable products with clear user flows and guardrails.
                  </li>
                  <li>
                    Strong focus on developer experience: clean APIs, typed
                    contracts, good logging, and maintainable mono-repos.
                  </li>
                  <li>
                    Like to work close to users and stakeholders, iterating on
                    feedback and instrumentation instead of guessing.
                  </li>
                  <li>
                    Excited about agentic systems, R2-style storage,
                    event-driven backends, and using AI where it actually makes
                    teams faster—not just as a buzzword.
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 18], fov: 65 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.9} />
            <pointLight position={[-10, -10, -10]} intensity={0.4} />
            <Airplane
              activeProject={activeProject}
              onHintProjectChange={setHintProject}
              onSelectProject={handleSelectProject}
              onHitChange={setHits}
            />
            <OrbitControls enableZoom={false} />
            <Stars radius={80} depth={40} count={4000} factor={3} />
            <Clouds2D count={10} />
            <Rain count={2000} />
          </Canvas>
          {hintProject && view === 'home' && (
            <div className="project-hint-overlay">
              <span>Press Enter to open {hintProject.title}</span>
            </div>
          )}
        </div>
      </section>

      <div className="hit-counter-overlay">
        {hits < 3 ? (
          <>Hits: {hits} / 3</>
        ) : (
          <> Press Space to restart</>
        )}
      </div>
      <div className="controls-overlay">
        <div className="controls-arrows">
          <div className="row top-row">
            <span className="keycap">↑</span>
          </div>
          <div className="row bottom-row">
            <span className="keycap">←</span>
            <span className="keycap">↓</span>
            <span className="keycap">→</span>
          </div>
        </div>
        <span className="controls-text">to fly</span>
        <span className="keycap wide">Space</span>
        <span className="controls-text">to shoot</span>
        <span className="keycap">Enter</span>
        <span className="controls-text">to open project</span>
      </div>

      {view === 'home' ? null : null}
      {transitioning && <div className="page-fade" />}
    </div>
  )
}

export default App