import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

function ProjectsShowcase({ projects, personalProjects, activeProjectTitle, onBack }) {
  const activeCardRef = useRef(null)

  useEffect(() => {
    if (!activeProjectTitle || !activeCardRef.current) return
    const card = activeCardRef.current
    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    card.focus({ preventScroll: true })
  }, [activeProjectTitle])

  const renderProjectCard = (project, { highlightActive, variant } = {}) => {
    const isActive = highlightActive && activeProjectTitle === project.title
    const variantClass = variant ? ` ${variant}` : ''
    return (
      <article
        key={project.title}
        className={`project-showcase-card${variantClass}${isActive ? ' active' : ''}`}
        ref={isActive ? activeCardRef : null}
        tabIndex={isActive ? -1 : undefined}
      >
        <header className="project-showcase-header">
          <div>
            <h2>{project.title}</h2>
            <p className="project-role">{project.role}</p>
          </div>
          {project.links?.length ? (
            <div className="project-links">
              {project.links.map(link => (
                <button
                  key={link.label}
                  type="button"
                  className={`project-link-button${link.variant ? ` ${link.variant}` : ''}`}
                  aria-label={`Open ${link.label} in a new tab`}
                  title={`Open ${link.label} in a new tab`}
                  onClick={() => window.open(link.href, '_blank', 'noopener,noreferrer')}
                >
                  <span>{link.label}</span>
                  <span className="project-link-icon" aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </header>
        <p className="project-summary">{project.summary}</p>
        {project.highlights?.length ? (
          <ul className="project-highlight-list">
            {project.highlights.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {project.techStacks?.length ? (
          <div className="project-tech-groups">
            {project.techStacks.map(group => (
              <div key={group.title} className="project-tech-group">
                <p className="project-tech-title">{group.title}</p>
                <div className="about-tech-tags">
                  {group.items.map(item => (
                    <span key={item.label} className="about-tech-tag">
                      <img src={item.icon} alt="" aria-hidden />
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <section className="projects-wrapper">
      <div className="projects-card">
        <div className="projects-card-header">
          <button type="button" className="projects-back-button" onClick={onBack}>
            <span aria-hidden>←</span>
            Back to flight deck
          </button>
          <span className="projects-chip">Projects</span>
        </div>
        <div className="projects-lede">
          <p className="projects-eyebrow">Selected Work</p>
          <h1>Product builds I personally architected and am proud to ship.</h1>
          <p>
            A curated set of launches where I owned the strategy, engineering, and delivery. These projects highlight the
            systems thinking, reliability, and polish I bring to every engagement.
          </p>
        </div>
        <div className="projects-grid">
          {projects.map(project => renderProjectCard(project, { highlightActive: true }))}
        </div>
        {personalProjects?.length ? (
          <div className="projects-personal-section">
            <div className="projects-lede">
              <p className="projects-eyebrow">Personal Projects</p>
              <h2>Hands-on builds I tackle for fun.</h2>
              <p>Product experiments where I own everything from UX to infrastructure.</p>
            </div>
            <div className="projects-grid">
              {personalProjects.map(project => renderProjectCard(project, { variant: 'personal' }))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

ProjectsShowcase.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      role: PropTypes.string,
      summary: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      links: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string,
          href: PropTypes.string,
          variant: PropTypes.string
        })
      ),
      techStacks: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              label: PropTypes.string,
              icon: PropTypes.string
            })
          )
        })
      )
    })
  ).isRequired,
  personalProjects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      role: PropTypes.string,
      summary: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      links: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string,
          href: PropTypes.string,
          variant: PropTypes.string
        })
      ),
      techStacks: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              label: PropTypes.string,
              icon: PropTypes.string
            })
          )
        })
      )
    })
  ),
  activeProjectTitle: PropTypes.string,
  onBack: PropTypes.func.isRequired
}

ProjectsShowcase.defaultProps = {
  personalProjects: [],
  activeProjectTitle: null
}

export default ProjectsShowcase
