import React, { useEffect, useRef } from 'react'
import styles from '../styles/Galeria.module.css'
import { useLang } from '../contexts/LanguageContext'

const IMGS = [
  { antes: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=70', depois: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&q=80' },
  { antes: 'https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?w=800&q=70', depois: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
]

export default function Galeria() {
  const { t } = useLang()
  const g = t.galeria
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('reveal-visible'), i * 120))
    }, { threshold: 0.08 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="galeria" ref={ref}>
      <div className={styles.container}>
        <div className={`${styles.header} reveal`}>
          <p className="section-label">{g.label}</p>
          <h2 className={styles.title}>{g.title} <em className={styles.gold}>{g.titleItalic}</em></h2>
          <p className={styles.subtitle}>{g.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {g.projects.map((proj, i) => (
            <div key={i} className={`${styles.pair} reveal reveal-delay-${i + 1}`}>
              <div className={styles.imgWrapper}>
                <img src={IMGS[i].antes} alt={`${g.before} — ${proj.name}`} className={`${styles.img} ${styles.imgBefore}`} loading="lazy" />
                <span className={`${styles.imgLabel} ${styles.labelBefore}`}>{g.before}</span>
              </div>
              <div className={styles.arrow}>→</div>
              <div className={styles.imgWrapper}>
                <img src={IMGS[i].depois} alt={`${g.after} — ${proj.name}`} className={styles.img} loading="lazy" />
                <span className={`${styles.imgLabel} ${styles.labelAfter}`}>{g.after}</span>
                <div className={styles.valorizacao}>{proj.val}</div>
              </div>
              <div className={styles.caption}>
                <span className={styles.captionName}>{proj.name}</span>
                <span className={styles.captionVal}>{g.valLabel} <strong>{proj.val}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
