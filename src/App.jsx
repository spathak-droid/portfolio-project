import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import Clouds2D from './components/Clouds2D'
import Airplane from './components/Airplane'
import './App.css'
import ThunderEffect from './components/ThunderEffect'
import AboutMe from './components/AboutMe'
import ProjectsShowcase from './components/ProjectsShowcase'
import profilePhoto from './assets/IMG_5444.jpg'


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
    const base = (import.meta.env && import.meta.env.BASE_URL) || '/'

    // Initialize plane sound from local public/sounds folder, respecting base
    planeSound.current = new Audio(`${base}sounds/plane.mp3`)
    planeSound.current.volume = 0.2
    planeSound.current.loop = true

    // Initialize thunder sound (lower volume)
    thunderSound.current = new Audio(`${base}sounds/thunder.mp3`)
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
  const [selectedProjectTitle, setSelectedProjectTitle] = useState(null)
  const [view, setView] = useState('home') // 'home' | 'about' | 'projectsPage'
  const [transitioning, setTransitioning] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const basePath = ((import.meta.env.BASE_URL ?? '/') === '/' ? '' : (import.meta.env.BASE_URL ?? '/').replace(/\/$/, ''))
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showSteerHint, setShowSteerHint] = useState(true)
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const assetBase = import.meta.env.BASE_URL ?? '/'
  const profileImageUrl = profilePhoto
  const resumeUrl = `${assetBase}resume/resume.pdf`
  const techLogoBase = `${assetBase}techstack-logos/`
  const buildTechItem = (label, iconFile) => ({
    label,
    icon: `${techLogoBase}${iconFile ?? 'code'}.png`
  })
  const projectShowcase = [
    {
      title: 'Lead Generation CRM Plugin',
      role: 'Lead Full-stack Engineer',
      summary:
        'Embedded plugin inside All My Sons’ CRM that classifies leads, routes vendors, and powers real-time agent copilots.',
      highlights: [
        'RAG-powered vendor routing so agents receive next-best action suggestions.',
        'Iframe sandbox with secure messaging bridge for CRM ↔ LLM workflows.',
        'Latency-sensitive TypeScript/Node stack that responds in <400ms.'
      ],
      links: [{ label: 'Live CRM', href: 'https://stella.serviceservice.com/crm' }],
      techStacks: [
        {
          title: 'Frontend',
          items: [buildTechItem('React', 'react'), buildTechItem('Vite', 'Vite'), buildTechItem('Tailwind CSS', 'tailwind')]
        },
        {
          title: 'Backend',
          items: [buildTechItem('Node.js', 'nodejs'), buildTechItem('Express', 'express'), buildTechItem('MongoDB', 'mongodb')]
        },
        {
          title: 'AI + Automation',
          items: [buildTechItem('OpenAI API', 'openai'), buildTechItem('LangChain', 'langchain'), buildTechItem('NLP.js', 'nlpjs')]
        }
      ]
    },
    {
      title: 'Project Management Mono Repo',
      role: 'Architect & Individual Contributor',
      summary:
        'Jira-style experience with NestJS backend + Angular frontend living inside a TypeScript mono repo for faster iteration.',
      highlights: [
        'Role-aware boards for owners, admins, and viewers.',
        'Shared DTOs/types across services to eliminate drift.',
        'Event-driven notifications delivered via WebSockets.'
      ],
      links: [
        {
          label: 'GitHub',
          href: 'https://github.com/spathak-droid/spathak-0a19fc14-d0eb-42ed-850d-63023568a3e3',
          variant: 'ghost'
        }
      ],
      techStacks: [
        {
          title: 'Frontend',
          items: [buildTechItem('Angular', 'angular'), buildTechItem('Tailwind CSS', 'tailwind')]
        },
        {
          title: 'Backend',
          items: [buildTechItem('NestJS', 'nestjs'), buildTechItem('GraphQL', 'graphql'), buildTechItem('MongoDB', 'mongodb')]
        },
        {
          title: 'DevOps',
          items: [buildTechItem('AWS ECS', 'aws'), buildTechItem('CI/CD Pipelines', 'cicd'), buildTechItem('Docker', 'docker')]
        }
      ]
    },
    {
      title: 'Agent CRM',
      role: 'Product Engineer',
      summary: 'Cross-company CRM that synchronizes moving ops, referral partners, and revenue automations in real time.',
      highlights: [
        'Journey Builder with drag-and-drop logic built on React Flow.',
        'GraphQL gateway feeding multi-tenant dashboards.',
        'Data contracts shared with partner APIs for automated billing.'
      ],
      links: [{ label: 'Live App', href: 'https://crm.serviceservice.com' }],
      techStacks: [
        {
          title: 'Frontend',
          items: [buildTechItem('React', 'react'), buildTechItem('Three.js', 'threejs')]
        },
        {
          title: 'Backend',
          items: [buildTechItem('Node.js', 'nodejs'), buildTechItem('GraphQL', 'graphql'), buildTechItem('MongoDB', 'mongodb')]
        },
        {
          title: 'Realtime',
          items: [buildTechItem('WebSockets', 'websocket'), buildTechItem('Cloudflare R2', 'cloudfare')]
        }
      ]
    },
    {
      title: 'Hear Helper',
      role: 'Full-stack Engineer',
      summary: 'One-page assistant that streams AI-narrated public-domain books with custom voice pipelines.',
      highlights: [
        'Angular SPA with offline-friendly audio caching.',
        'Django API orchestrating TTS jobs and chapter syncing.',
        'Cloudflare R2 storage for cost-effective long-form audio.'
      ],
      links: [
        { label: 'Frontend Repo', href: 'https://github.com/spathak-droid/HearHelper', variant: 'ghost' },
        { label: 'Backend Repo', href: 'https://github.com/spathak-droid/HearHelper-BE', variant: 'ghost' }
      ],
      techStacks: [
        {
          title: 'Frontend',
          items: [buildTechItem('Angular', 'angular'), buildTechItem('Tailwind CSS', 'tailwind')]
        },
        {
          title: 'Backend',
          items: [buildTechItem('Django', 'django'), buildTechItem('MongoDB', 'mongodb')]
        },
        {
          title: 'Infra',
          items: [buildTechItem('Cloudflare R2', 'cloudfare'), buildTechItem('AWS ECS', 'aws')]
        }
      ]
    }
  ]

  const personalProjects = [
    {
      title: 'KidsZoid — Android App for Safer Pickups',
      role: 'Android Developer',
      summary: 'Developed a mobile app to enhance school pick-up safety and reduce traffic congestion.',
      highlights: [
        'Implemented real-time GPS tracking for parents and school staff to monitor student pick-ups and drop-offs.',
        'Integrated license plate recognition and live tracking of approaching vehicles for streamlined identification.',
        'Managed authentication and data storage using Firebase for secure, scalable backend operations.'
      ],
      links: [{ label: 'GitHub', href: 'https://github.com/spathak-droid/WeTrack-KidsZoid' }],
      techStacks: [
        {
          title: 'Mobile',
          items: [buildTechItem('Java', 'java'), buildTechItem('Android Studio')]
        },
        {
          title: 'Cloud & APIs',
          items: [buildTechItem('Firebase'), buildTechItem('Google Maps API')]
        }
      ]
    },
    {
      title: 'Inventory Handler — Personal Full-Stack App',
      role: 'Full-stack Engineer',
      summary: 'Developed a full-stack inventory management web application with React frontend and Spring Boot backend.',
      highlights: [
        'Implemented role-based authentication for admin and user access levels.',
        'Integrated Stripe API for secure payment processing and SQL for relational data storage.',
        'Enabled users to browse inventory, add items to cart, and manage orders with real-time updates.'
      ],
      links: [
        { label: 'Frontend', href: 'https://github.com/spathak-droid/amsSandesh-frontend', variant: 'ghost' },
        { label: 'Backend', href: 'https://github.com/spathak-droid/ams-backend', variant: 'ghost' }
      ],
      techStacks: [
        {
          title: 'Frontend',
          items: [buildTechItem('React', 'react'), buildTechItem('JavaScript', 'javascript')]
        },
        {
          title: 'Backend',
          items: [buildTechItem('Spring Boot'), buildTechItem('Java', 'java'), buildTechItem('SQL')]
        },
        {
          title: 'APIs & Payments',
          items: [buildTechItem('Stripe API'), buildTechItem('REST APIs')]
        }
      ]
    }
  ]

  const mapTargetTitleToShowcase = title => {
    const mapping = {
      'Project Management': 'Project Management Mono Repo',
      'Lead Generation': 'Lead Generation CRM Plugin',
      'Agent CRM': 'Agent CRM',
      'Hear Helper': 'Hear Helper'
    }

    return mapping[title] ?? null
  }
  const aboutTechStacks = [
    {
      title: 'Languages',
      items: [
        buildTechItem('JavaScript', 'javascript'),
        buildTechItem('TypeScript', 'typescript'),
        buildTechItem('Python', 'python'),
        buildTechItem('Java', 'java')
      ]
    },
    {
      title: 'Frontend',
      items: [
        buildTechItem('React', 'react'),
        buildTechItem('Angular', 'angular'),
        buildTechItem('Three.js', 'threejs'),
        buildTechItem('Next.js', 'nextjs'),
        buildTechItem('Vite', 'Vite'),
        buildTechItem('Tailwind CSS', 'tailwind')
      ]
    },
    {
      title: 'Backend',
      items: [
        buildTechItem('Node.js', 'nodejs'),
        buildTechItem('NestJS', 'nestjs'),
        buildTechItem('Express', 'express'),
        buildTechItem('GraphQL', 'graphql'),
        buildTechItem('Django', 'django'),
        buildTechItem('MongoDB', 'mongodb')
      ]
    },
    {
      title: 'AI & Automation',
      items: [
        buildTechItem('OpenAI API', 'openai'),
        buildTechItem('LangChain', 'langchain'),
        buildTechItem('NLP.js', 'nlpjs'),
        buildTechItem('LLM Ops'),
        buildTechItem('RAG Pipelines')
      ]
    },
    {
      title: 'Cloud & DevOps',
      items: [
        buildTechItem('AWS ECS', 'aws'),
        buildTechItem('Docker', 'docker'),
        buildTechItem('CI/CD Pipelines', 'cicd'),
        buildTechItem('Cloudflare R2', 'cloudfare'),
        buildTechItem('WebSockets', 'websocket')
      ]
    }
  ]
  const aboutContactItems = [
    {
      label: 'Email',
      value: 'pathaksandesh025@gmail.com',
      href: 'mailto:pathaksandesh025@gmail.com'
    },
    {
      label: 'LinkedIn',
      value: 'linkedin.com/in/sandeshpathak',
      href: 'https://www.linkedin.com/in/sandeshpathak'
    },
    {
      label: 'GitHub',
      value: 'github.com/spathak-droid',
      href: 'https://github.com/spathak-droid'
    },
    {
      label: 'Location',
      value: 'Plano, TX · USA'
    }
  ]

  const handleSelectProject = project => {
    if (!project) return
    if (project.title === 'About Me') {
      handleNavigate('about')
      return
    }
    const mappedTitle = mapTargetTitleToShowcase(project.title)
    if (!mappedTitle) {
      setSelectedProjectTitle(null)
      return
    }
    setSelectedProjectTitle(mappedTitle)
    setTransitioning(true)

    setTimeout(() => {
      setView('projectsPage')
      setTransitioning(false)
      if (
        typeof window !== 'undefined' &&
        window.history &&
        window.location.pathname !== `${basePath}/projects-showcase`
      ) {
        window.history.pushState({}, '', `${basePath}/projects-showcase`)
      }
    }, 400)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const evaluateWarning = () => {
      const isSmallScreen = window.innerWidth <= 900
      const isLikelyMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
      const mobileState = isSmallScreen || isLikelyMobile

      setIsMobileView(mobileState)
      setShowMobileWarning(mobileState)
    }

    evaluateWarning()

    if (
      window.location.pathname === `${basePath}/projects` ||
      window.location.pathname === `${basePath}/projects-showcase`
    ) {
      setView('projectsPage')
    } else if (window.location.pathname === `${basePath}/about`) {
      setView('about')
    }

    window.addEventListener('resize', evaluateWarning)

    return () => {
      window.removeEventListener('resize', evaluateWarning)
    }
  }, [basePath])

  useEffect(() => {
    const startTime = performance.now()
    let rafId

    const tick = now => {
      const elapsed = now - startTime
      const pct = Math.min(100, Math.floor((elapsed / 2000) * 100))
      setLoadingProgress(pct)
      if (pct < 100) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    if (sceneReady) {
      setLoadingProgress(100)
    }
  }, [sceneReady])

  useEffect(() => {
    setShowSteerHint(isMobileView)
  }, [isMobileView])

  const showMobileControls = !showMobileWarning && isMobileView && view === 'home'
  const autoFire = isMobileView && !showMobileWarning && hits < 3

  useEffect(() => {
    if (!sceneReady) return undefined
    if (autoFire) {
      dispatchMobileControl('Space', true)
      return () => dispatchMobileControl('Space', false)
    }
    dispatchMobileControl('Space', false)
    return undefined
  }, [autoFire, sceneReady])

  const dispatchMobileControl = (key, pressed) => {
    if (typeof window === 'undefined') return
    setShowSteerHint(prev => (prev ? false : prev))
    window.dispatchEvent(new CustomEvent('mobile-control', { detail: { key, pressed } }))
  }

  const handleMobileRestart = () => {
    if (hits < 3) return
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const mobileControlHandlers = key => ({
    onPointerDown: () => dispatchMobileControl(key, true),
    onPointerUp: () => dispatchMobileControl(key, false),
    onPointerLeave: () => dispatchMobileControl(key, false),
    onPointerCancel: () => dispatchMobileControl(key, false),
    onMouseDown: () => dispatchMobileControl(key, true),
    onMouseUp: () => dispatchMobileControl(key, false),
    onTouchStart: () => dispatchMobileControl(key, true),
    onTouchEnd: () => dispatchMobileControl(key, false)
  })

  const toggleHamburger = () => {
    setIsHamburgerOpen(prev => !prev)
  }

  const openResumeModal = () => {
    if (isMobileView) {
      if (typeof window !== 'undefined') {
        window.open(resumeUrl, '_blank', 'noopener,noreferrer')
      }
      return
    }
    setShowResumeModal(true)
  }

  const closeResumeModal = () => {
    setShowResumeModal(false)
  }

  const handleNavigate = target => {
    setIsHamburgerOpen(false)
    if (target !== 'projectsPage') {
      setSelectedProjectTitle(null)
      setTransitioning(false)
    }
    setView(target)

    if (typeof window !== 'undefined' && window.history) {
      const path =
        target === 'projects'
          ? `${basePath}/projects`
          : target === 'about'
          ? `${basePath}/about`
          : target === 'projectsPage'
          ? `${basePath}/projects-showcase`
          : basePath || '/'
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path)
      }
    }
  }

  const isHomeView = view === 'home'
  const isAboutView = view === 'about'
  const isProjectsPage = view === 'projectsPage'
  const isStandaloneView = isAboutView || isProjectsPage

  return (
    <div className="app">
      {(!sceneReady || loadingProgress < 100) && !isStandaloneView && (
        <div className="scene-loading-overlay">
          <div className="scene-loading-card">
            <div className="scene-loading-text">
              <span className="scene-loading-label">Igniting engines</span>
              <span className="scene-loading-progress">{loadingProgress}%</span>
            </div>
            <div className="scene-loading-bar">
              <div
                className="scene-loading-bar-fill"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, loadingProgress / 100))})` }}
              />
            </div>
            {loadingProgress >= 100 && !sceneReady && (
              <p className="scene-waiting-text">Waiting for hangar clearance...</p>
            )}
          </div>
        </div>
      )}
      {showMobileWarning && !isStandaloneView && (
        <div className="mobile-warning-overlay">
          <div className="mobile-warning-card">
            <h2>Best experienced on desktop</h2>
            <p>
              Some interactions (keyboard controls, 3D view and sound) are designed primarily for laptops and
              desktop computers.
            </p>
            <p className="mobile-warning-secondary">
              Please view this portfolio on a computer to fly the airplane, explore wormholes, and experience the 3D
              scene fully.
            </p>
          </div>
        </div>
      )}
      {!isStandaloneView && <ThunderEffect />}
      {!isMobileView && !isStandaloneView && <BackgroundSound />}
      <header className="hamburger-header">
        <button
          type="button"
          className={`hamburger-button${isHamburgerOpen ? ' open' : ''}`}
          aria-label="Open navigation menu"
          aria-expanded={isHamburgerOpen}
          onClick={toggleHamburger}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
        <div className={`hamburger-menu${isHamburgerOpen ? ' open' : ''}`} aria-hidden={!isHamburgerOpen}>
          <button
            type="button"
            className={`hamburger-menu-item hamburger-menu-item-with-icon${isHomeView ? ' active' : ''}`}
            onClick={() => handleNavigate('home')}
          >
            <span className="hamburger-menu-icon" aria-hidden>
              ✈️
            </span>
            Home
          </button>
          <button
            type="button"
            className={`hamburger-menu-item${isProjectsPage ? ' active' : ''}`}
            onClick={() => handleNavigate('projectsPage')}
          >
            My Projects
          </button>
          <button
            type="button"
            className={`hamburger-menu-item${isAboutView ? ' active' : ''}`}
            onClick={() => handleNavigate('about')}
          >
            About Me
          </button>
        </div>
      </header>
      {isAboutView ? (
        <section className="about-wrapper">
          <AboutMe
            profileImage={profileImageUrl}
            resumeUrl={resumeUrl}
            techStacks={aboutTechStacks}
            contactItems={aboutContactItems}
            onViewResume={openResumeModal}
            onBack={() => handleNavigate('home')}
          />
        </section>
      ) : isProjectsPage ? (
        <section className="projects-standalone">
          <ProjectsShowcase
            projects={projectShowcase}
            personalProjects={personalProjects}
            activeProjectTitle={selectedProjectTitle}
            onBack={() => handleNavigate('home')}
          />
        </section>
      ) : (
        <section className="hero">
        {sceneReady && view === 'home' && (
          <div className="hero-content hero-home">
            <h1>Welcome to my portfolio</h1>
            <p className="subtitle">An interactive flight through my work.</p>
            <p className="designer-credit">Designed by Sandesh Pathak</p>
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
              onReady={() => setSceneReady(true)}
            />
            <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
            <Stars radius={80} depth={40} count={4000} factor={3} />
            <Clouds2D count={10} />
            <Rain count={2000} />
          </Canvas>
          {sceneReady && hintProject && view === 'home' && (
            <div className="project-hint-overlay">
              <span>Press Enter to open {hintProject.title}</span>
            </div>
          )}
        </div>
      </section>
      )}

      {sceneReady && !isStandaloneView && (
        <>
          <div className="hit-counter-overlay">
            {hits < 3 ? (
              <>Hits: {hits} / 3</>
            ) : isMobileView ? (
              <>Tap restart to fly again</>
            ) : (
              <> Press Space to restart</>
            )}
          </div>
          {showMobileControls ? (
            <>
              <div className="mobile-steer-zone mobile-steer-zone-left" aria-hidden {...mobileControlHandlers('ArrowLeft')} />
              <div className="mobile-steer-zone mobile-steer-zone-right" aria-hidden {...mobileControlHandlers('ArrowRight')} />
              <div className="mobile-steer-zone mobile-steer-zone-top" aria-hidden {...mobileControlHandlers('ArrowUp')} />
              <div className="mobile-steer-zone mobile-steer-zone-bottom" aria-hidden {...mobileControlHandlers('ArrowDown')} />
              <div className="mobile-circle-controls">
                {showSteerHint && <div className="mobile-steer-banner">Tap screen edges to steer</div>}
                <div className="mobile-circle-row">
                  <button
                    type="button"
                    className="mobile-circle-button"
                    aria-label="Restart"
                    onClick={handleMobileRestart}
                    disabled={hits < 3}
                  >
                    <span>↻</span>
                    <small>Restart</small>
                  </button>
                </div>
              </div>
            </>
          ) : (
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
          )}
        </>
      )}

      {view === 'home' ? null : null}
      {transitioning && !isStandaloneView && <div className="page-fade" />}
      {showResumeModal && (
        <div className="resume-modal-overlay" role="dialog" aria-modal="true" aria-label="Sandesh Pathak resume">
          <div className="resume-modal">
            <div className="resume-modal-header">
              <h2>Resume</h2>
              <button type="button" className="resume-modal-close" onClick={closeResumeModal} aria-label="Close resume">
                ×
              </button>
            </div>
            <div className="resume-modal-body">
              <iframe title="Sandesh Pathak resume PDF" src={resumeUrl} loading="lazy" />
              <a href={resumeUrl} target="_blank" rel="noreferrer noopener" className="resume-modal-download">
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App