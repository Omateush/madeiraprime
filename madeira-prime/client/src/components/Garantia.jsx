import React, { useEffect, useRef } from 'react'
import styles from '../styles/Garantia.module.css'
import { useLang } from '../contexts/LanguageContext'

export default function Garantia() {
  const { t } = useLang()
  const g = t.garantia
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('reveal-visible'), i * 100))
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <div className={`${styles.badge} reveal`}>{g.badge}</div>
        <h2 className={`${styles.title} reveal reveal-delay-1`}>
          {g.title}<br /><em className={styles.gold}>{g.titleItalic}</em>
        </h2>
        <p className={`${styles.subtitle} reveal reveal-delay-2`}>{g.subtitle}</p>

        <div className={`${styles.steps} reveal reveal-delay-3`}>
          {g.steps.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepLine} />
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className={`${styles.ctaBtns} reveal reveal-delay-4`}>
          <button className={styles.btnPrimary} onClick={() => scrollTo('proprietarios')}>{g.btn1}</button>
          <button className={styles.btnOutline} onClick={() => scrollTo('marcacao')}>{g.btn2}</button>
        </div>
        <p className={`${styles.note} reveal reveal-delay-5`}>{g.note}</p>
      </div>
    </section>
  )
}
