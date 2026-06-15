import React, { useState, useEffect, useRef } from 'react'
import styles from '../styles/ProjetosInvestimento.module.css'
import { useLang } from '../contexts/LanguageContext'
import { PROJECTS } from '../data/projectsData'

export default function ProjetosInvestimento() {
  const { t } = useLang()
  const pi = t.projetosInvestimento
  const ref = useRef(null)
  const [activeProject, setActiveProject] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) =>
          setTimeout(() => el.classList.add('reveal-visible'), i * 80))
    }, { threshold: 0.06 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleProjectChange = (idx) => {
    setActiveProject(idx)
    setCurrentSlide(0)
  }

  const project = PROJECTS[activeProject]
  const comparisons = project.comparisons ?? []
  const total = comparisons.length

  const prev = () => setCurrentSlide(s => (s - 1 + total) % total)
  const next = () => setCurrentSlide(s => (s + 1) % total)

  return (
    <section className={styles.section} id="projetos" ref={ref}>
      <div className={styles.container}>

        <div className={`${styles.header} reveal`}>
          <p className="section-label">{pi.label}</p>
          <h2 className={styles.title}>{pi.title} <em className={styles.gold}>{pi.titleItalic}</em></h2>
          <p className={styles.subtitle}>{pi.subtitle}</p>
        </div>

        {PROJECTS.length > 1 && (
          <div className={`${styles.projectTabs} reveal reveal-delay-1`}>
            {PROJECTS.map((proj, i) => (
              <button
                key={proj.id}
                className={`${styles.projectTab} ${i === activeProject ? styles.projectTabActive : ''}`}
                onClick={() => handleProjectChange(i)}
              >
                <span className={styles.projectTabName}>{proj.name}</span>
                <span className={styles.projectTabLoc}>{proj.location}</span>
                <span className={styles.projectTabVal}>{proj.appreciation}</span>
              </button>
            ))}
          </div>
        )}

        {comparisons.length === 0 ? (
          <p className={`${styles.empty} reveal reveal-delay-2`}>{pi.empty}</p>
        ) : (
          <div className={`${styles.carousel} reveal reveal-delay-2`}>
            <div className={styles.carouselTrack}>
              <button
                className={`${styles.carouselBtn} ${styles.carouselBtnPrev}`}
                onClick={prev}
                aria-label="Anterior"
              >
                ‹
              </button>

              <div className={styles.comparisonPair}>
                <div className={styles.comparisonSide}>
                  <span className={styles.comparisonLabel}>{pi.tabs.before}</span>
                  <div className={styles.imageWrapper}>
                    <img
                      src={comparisons[currentSlide].before}
                      alt={`${project.name} — ${pi.tabs.before} — ${comparisons[currentSlide].title}`}
                      className={styles.image}
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className={styles.comparisonDivider} />

                <div className={styles.comparisonSide}>
                  <span className={`${styles.comparisonLabel} ${styles.comparisonLabelAfter}`}>{pi.tabs.after}</span>
                  <div className={styles.imageWrapper}>
                    <img
                      src={comparisons[currentSlide].after}
                      alt={`${project.name} — ${pi.tabs.after} — ${comparisons[currentSlide].title}`}
                      className={styles.image}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              <button
                className={`${styles.carouselBtn} ${styles.carouselBtnNext}`}
                onClick={next}
                aria-label="Próximo"
              >
                ›
              </button>
            </div>

            {comparisons[currentSlide].title && (
              <p className={styles.slideTitle}>{comparisons[currentSlide].title}</p>
            )}

            <div className={styles.carouselDots}>
              {comparisons.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === currentSlide ? styles.dotActive : ''}`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
