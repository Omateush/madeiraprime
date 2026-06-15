import React, { useState, useEffect, useRef } from 'react'
import styles from '../styles/Investidores.module.css'
import { useLang } from '../contexts/LanguageContext'
import { API_URL } from '../config'

const ICONS = ['🏗','🔨','📈','💰','⚖️','📊']

export default function Investidores() {
  const { t } = useLang()
  const iv = t.investidores
  const ref = useRef(null)

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', capital_disponivel: '', horizonte_investimento: '', mercado_interesse: '', notas: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('reveal-visible'), i * 80))
    }, { threshold: 0.06 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.telefone || !form.capital_disponivel || !form.horizonte_investimento || !form.mercado_interesse) {
      setError(iv.form.errRequired); return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/leads/investidor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) setSuccess(true)
      else setError(data.error || iv.form.errRequired)
    } catch { setError(iv.form.errConn) }
    finally { setSubmitting(false) }
  }

  return (
    <section className={styles.section} id="investidores" ref={ref}>
      <div className={styles.container}>

        <div className={styles.left}>
          <p className="section-label reveal">{iv.label}</p>
          <h2 className={`${styles.title} reveal reveal-delay-1`}>
            {iv.title}<br /><em className={styles.gold}>{iv.titleItalic}</em>
          </h2>
          <p className={`${styles.desc} reveal reveal-delay-2`}>{iv.desc}</p>

          <div className={`${styles.featuresGrid} reveal reveal-delay-3`}>
            {iv.features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <span className={styles.featureIcon}>{ICONS[i]}</span>
                <div>
                  <span className={styles.featureTitle}>{f.title}</span>
                  <span className={styles.featureDesc}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.statsRow} reveal reveal-delay-4`}>
            {[['50/50', iv.statsLabels[0]], ['9–14m', iv.statsLabels[1]], ['32%', iv.statsLabels[2]]].map(([val, lbl], i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className={styles.statDivider} />}
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{val}</span>
                  <span className={styles.statLabel}>{lbl}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={`${styles.formCard} reveal`}>
            <div className={styles.formBadge}>{iv.form.badge}</div>
            <h3 className={styles.formTitle}>{iv.form.title}</h3>
            <p className={styles.formDesc}>{iv.form.desc}</p>

            {success ? (
              <div className={styles.successMsg}>
                <div className={styles.successIcon}>✓</div>
                <h4>{iv.form.successTitle}</h4>
                <p>{iv.form.successMsg}</p>
              </div>
            ) : (
              <div className={styles.formFields}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{iv.form.fields.nome} *</label>
                    <input name="nome" value={form.nome} onChange={handleChange} placeholder={iv.form.ph.nome} className={styles.input} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{iv.form.fields.email} *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={iv.form.ph.email} className={styles.input} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{iv.form.fields.tel} *</label>
                  <input name="telefone" value={form.telefone} onChange={handleChange} placeholder={iv.form.ph.tel} className={styles.input} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{iv.form.fields.capital} *</label>
                  <select name="capital_disponivel" value={form.capital_disponivel} onChange={handleChange} className={styles.input}>
                    {iv.form.capitalOpts.map((o, i) => <option key={o} value={i === 0 ? '' : o}>{o}</option>)}
                  </select>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{iv.form.fields.horizonte} *</label>
                    <select name="horizonte_investimento" value={form.horizonte_investimento} onChange={handleChange} className={styles.input}>
                      {iv.form.horizonteOpts.map((o, i) => <option key={o} value={i === 0 ? '' : o}>{o}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{iv.form.fields.mercado} *</label>
                    <select name="mercado_interesse" value={form.mercado_interesse} onChange={handleChange} className={styles.input}>
                      {iv.form.mercadoOpts.map((o, i) => <option key={o} value={i === 0 ? '' : o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{iv.form.fields.notas}</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} placeholder={iv.form.ph.notas} rows={3} className={`${styles.input} ${styles.textarea}`} />
                </div>
                {error && <p className={styles.errorMsg}>{error}</p>}
                <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? iv.form.submitting : iv.form.submit}
                </button>
                <p className={styles.formNote}>{iv.form.note}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
