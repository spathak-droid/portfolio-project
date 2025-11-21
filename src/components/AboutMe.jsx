import PropTypes from 'prop-types'

function AboutMe({ profileImage, resumeUrl, techStacks, contactItems, onBack, onViewResume }) {
  const hasProfileImage = Boolean(profileImage)
  const hasResume = Boolean(resumeUrl)

  return (
    <section className="about-page">
      <div className="about-card">
        <div className="about-card-header">
          <button type="button" className="about-back-button" onClick={onBack}>
            <span aria-hidden>←</span>
            Back to flight deck
          </button>
          <span className="about-chip">About Me</span>
        </div>

        <div className="about-hero">
          <div className="about-profile-frame">
            {hasProfileImage ? (
              <img src={profileImage} alt="Sandesh Pathak profile" loading="lazy" />
            ) : (
              <div className="about-profile-placeholder">
                <span>Add your profile photo</span>
              </div>
            )}
          </div>
          <div className="about-summary">
            <p className="about-eyebrow">Full-Stack Engineer · Product-minded · Systems thinker</p>
            <h1>Sandesh Pathak</h1>
            <p>
              I craft immersive web experiences, complex CRM ecosystems, and AI-assisted workflows for moving-industry
              teams. I love translating fuzzy problem statements into thoughtful product journeys that feel magical yet
              reliable.
            </p>
            <div className="about-actions">
              <button
                type="button"
                onClick={hasResume ? onViewResume : undefined}
                className={`about-button${hasResume ? '' : ' disabled'}`}
                aria-disabled={!hasResume}
              >
                View Resume
              </button>
              <a href="mailto:pathaksandesh025@gmail.com" className="about-button ghost">
                Contact Me
              </a>
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-header">
            <h2>Tech Stack</h2>
            <p>Curated tools I use to ship fast, resilient experiences.</p>
          </div>
          <div className="about-tech-grid">
            {techStacks.map(stack => (
              <div key={stack.title} className="about-tech-card">
                <h3>{stack.title}</h3>
                <div className="about-tech-tags">
                  {stack.items.map(item => (
                    <span key={item.label || item} className="about-tech-tag">
                      {item.icon && <img src={item.icon} alt="" aria-hidden />}
                      <span>{item.label || item}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-header">
            <h2>Connect</h2>
            <p>Say hi, book a call, or send an opportunity my way.</p>
          </div>
          <div className="about-contact-grid">
            {contactItems.map(item => (
              <div key={item.label} className="about-contact-card">
                <p className="about-contact-label">{item.label}</p>
                {item.href ? (
                  <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer noopener">
                    {item.value}
                  </a>
                ) : (
                  <span>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

AboutMe.propTypes = {
  profileImage: PropTypes.string,
  resumeUrl: PropTypes.string,
  techStacks: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            label: PropTypes.string,
            icon: PropTypes.string
          })
        ])
      )
    })
  ).isRequired,
  contactItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
      href: PropTypes.string
    })
  ).isRequired,
  onBack: PropTypes.func.isRequired,
  onViewResume: PropTypes.func
}

AboutMe.defaultProps = {
  profileImage: null,
  resumeUrl: null,
  onViewResume: () => {}
}

export default AboutMe
