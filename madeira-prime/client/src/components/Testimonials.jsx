import React, { useEffect, useRef } from 'react'
import styles from '../styles/Testimonials.module.css'
import { useLang } from '../contexts/LanguageContext'

const NAMES   = ['Carolina Mendes', 'James Whitmore', 'Sofia Câmara', 'Rui Vasconcelos', 'Margarida Pinto', 'André Braga']
const INITIALS = ['CM', 'JW', 'SC', 'RV', 'MP', 'AB']
const BADGES  = ['+€38.4K / 6M', '47% ROI', '3.2× Revenue', '3 Deals', 'Convertida', 'Multi-país']
const COLORS  = ['#C9A84C', '#7C6B3A', '#8A6B2A', '#A08C4C', '#B89A3C', '#6B5A2A']

function Stars() {
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(i => <span key={i} className={styles.star}>★</span>)}
    </div>
  )
}

export default function Testimonials() {
  const { t } = useLang()
  const tm = t.testimonials
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal').forEach((el, i) => {
          setTimeout(() => el.classList.add('reveal-visible'), i * 80)
        })
      }
    }, { threshold: 0.05 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="testemunhos" ref={ref}>
      <div className={styles.container}>
        <div className={`${styles.header} reveal`}>
          <p className="section-label">{tm.label}</p>
          <h2 className={styles.title}>
            {tm.title}<br /><em className={styles.gold}>{tm.titleItalic}</em>
          </h2>
          <p className={styles.subtitle}>{tm.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {tm.items.map((item, i) => (
            <div key={i} className={`${styles.card} reveal reveal-delay-${(i % 3) + 1}`}>
              <div className={styles.quoteIcon}>"</div>
              <p className={styles.text}>{item.text}</p>
              <Stars />
              <div className={styles.footer}>
                <div className={styles.avatar} style={{ background: COLORS[i] + '22', borderColor: COLORS[i] + '44' }}>
                  <span style={{ color: COLORS[i] }}>{INITIALS[i]}</span>
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{NAMES[i]}</span>
                  <span className={styles.role}>{item.role}</span>
                </div>
                <div className={styles.badge}>{BADGES[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
