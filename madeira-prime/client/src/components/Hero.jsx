import React from 'react'
import styles from '../styles/Hero.module.css'
import { useLang } from '../contexts/LanguageContext'

export default function Hero() {
  const { t } = useLang()
  const h = t.hero

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className={styles.hero} id="inicio">
      <div className={styles.bg}>
        <img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1800&q=80" alt="Madeira" className={styles.bgImg} />
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <p className={styles.badge}>{h.badge}</p>

        <h1 className={styles.title}>
          {h.t1} <em className={styles.gold}>{h.i1}</em>
          <br />
          {h.t2} <em className={styles.gold}>{h.i2}</em>
        </h1>

        <p className={styles.subtitle}>{h.subtitle}</p>

        <div className={styles.btns}>
          <button className={styles.btnPrimary} onClick={() => scrollTo('proprietarios')}>{h.btn1}</button>
          <button className={styles.btnOutline} onClick={() => scrollTo('investidores')}>{h.btn2}</button>
        </div>

        <div className={styles.trust}>
          <span className={styles.trustDot}>◎</span>
          <span>{h.trust[0]}</span>
          <span className={styles.trustSep}>·</span>
          <span>{h.trust[1]}</span>
          <span className={styles.trustSep}>·</span>
          <span>{h.trust[2]}</span>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
        <span>{h.scroll}</span>
      </div>
    </section>
  )
}
