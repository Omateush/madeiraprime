import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/Stats.module.css'
import { useLang } from '../contexts/LanguageContext'

const VALUES = [120, 21, 98, 9]
const SUFFIXES = ['+', '%', '%', '']

function useCounter(target, duration = 1800, started) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(e * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])
  return count
}

function StatItem({ value, suffix, label, started, delay }) {
  const count = useCounter(value, 1800, started)
  return (
    <div className={`${styles.stat} reveal reveal-delay-${delay}`}>
      <div className={styles.value}>{count}{suffix}</div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}

export default function Stats() {
  const { t } = useLang()
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true)
        entry.target.querySelectorAll('.reveal').forEach(el => el.classList.add('reveal-visible'))
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.stats} ref={ref}>
      <div className={styles.inner}>
        {t.stats.map((s, i) => (
          <StatItem key={i} value={VALUES[i]} suffix={SUFFIXES[i]} label={s.label} started={started} delay={i + 1} />
        ))}
      </div>
    </section>
  )
}
