# Sandesh Pathak – Flight Simulator Portfolio

An interactive portfolio that flies an airplane through wormholes to reveal my case studies, personal builds, and about section. It mixes Three.js visuals, spatial audio, and playful gameplay to make browsing work feel like piloting a mini flight simulator.

![Preview](public/preview.png)

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [How the Experience Works](#how-the-experience-works)
   - [Three.js Flight Simulator](#threejs-flight-simulator)
   - [Audio Layer](#audio-layer)
   - [Project Showcase](#project-showcase)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Deployment](#deployment)
7. [Roadmap](#roadmap)
8. [Contact](#contact)

## Features

- **3D Flight Simulator** – Built with React Three Fiber. Fly, shoot, and enter wormholes mapped to projects.
- **Dynamic routing** – Clicking targets or hamburger links transitions to Projects, About, and back to Home with smooth focus states.
- **Curated project showcase** – Detailed cards for shipped engagements and personal experiments with tech stacks, links, and contextual copy.
- **Spatial audio + weather** – Ambient airplane engine, thunder, rain particles, and cloud layers controlled via hooks.
- **Mobile-aware controls** – Detects mobile screens, warns users, and exposes touch-based steering zones.
- **SPA fallback built-in** – Direct visiting `/projects-showcase` or `/about` on GitHub Pages serves the app (via 404 fallback).

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | React 19 + Vite 7 |
| 3D / Graphics | React Three Fiber, Drei helpers, Three.js core |
| Animation | GSAP timeline for airplane float & Material transitions |
| Audio | HTML5 Audio API managed by custom hooks for plane/thunder/rocket sounds |
| Deployment | GitHub Pages (`gh-pages`), SPA fallback using `dist/404.html` |
| Linting | ESLint 9 + React hooks plugin |

## How the Experience Works

### Three.js Flight Simulator

- `src/App.jsx` renders a `<Canvas>` with ambient, directional, and point lights.
- The `<Airplane />` component (in `src/components/Airplane.jsx`) builds a custom mesh: fuselage, wings, propellers, contrails.
- State is driven via refs and `useFrame` to animate velocity, input, smoke particles, rockets, and target detection.
- Wormholes/targets are mapped to project metadata; hitting Enter jumps to the Projects Showcase with focus on that title.

### Audio Layer

- `BackgroundSound` hook loads `/public/sounds/plane.mp3` and `/public/sounds/thunder.mp3`, respecting `import.meta.env.BASE_URL`.
- Audio playback is deferred until the user interacts (to satisfy browser autoplay policies).
- Rocket fire and engine ticks use lightweight Web Audio API oscillators for snappy feedback.

### Project Showcase

- `ProjectsShowcase.jsx` receives curated data from `App.jsx` (`projectShowcase` and `personalProjects`).
- Active project auto-focuses for accessibility when navigated from the simulator.
- Link buttons have consistent glow, arrow motion, and open external resources with `noopener/noreferrer`.
- Personal projects get a variant style to visually separate them from client engagements.

## Getting Started

```bash
git clone https://github.com/spathak-droid/portfolio-project.git
cd portfolio-project
npm install
npm run dev
```

Open `http://localhost:5173/portfolio-project/` (Vite prints the exact URL). Use WASD/arrow keys + Space + Enter on desktop; mobile shows touch regions.

### Environment

- Assets (sounds, images, tech logos) live under `public/` and `src/assets/`.
- `import.meta.env.BASE_URL` is used to support GitHub Pages subdirectory hosting.

## Project Structure

```
src/
  App.jsx            # Main orchestrator, state machine, routes
  App.css            # Global + showcase styles
  components/
    Airplane.jsx     # Three.js airplane logic
    Clouds2D.jsx
    ThunderEffect.jsx
    ProjectsShowcase.jsx
    AboutMe.jsx
  assets/            # Imagery
public/
  sounds/
  resume/
  techstack-logos/
```

## Deployment

The site deploys to GitHub Pages via `npm run deploy`:

1. `npm run build && cp dist/index.html dist/404.html` ensures the SPA fallback exists.
2. `gh-pages -d dist` pushes the bundle to the `gh-pages` branch.

Because `dist/404.html` mirrors `index.html`, visiting `https://spathak-droid.github.io/portfolio-project/projects-showcase` works for direct links.

## Roadmap

- Add lazy-loaded scenes for About/Projects to reduce initial bundle size.
- Experiment with WebGL post-processing (bloom, depth of field) once performance budget allows.
- Offer an accessibility toggle to skip the simulator and jump straight to content.

## Contact

- Portfolio: [spathak-droid.github.io/portfolio-project](https://spathak-droid.github.io/portfolio-project/)
- Email: [pathaksandesh025@gmail.com](mailto:pathaksandesh025@gmail.com)
- LinkedIn: [linkedin.com/in/sandeshpathak](https://www.linkedin.com/in/sandeshpathak)
- GitHub: [@spathak-droid](https://github.com/spathak-droid)

If you build something cool with this project or want to collaborate, feel free to reach out!
