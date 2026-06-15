import React, { useState, useEffect, useRef } from 'react'
import styles from '../styles/Proprietarios.module.css'
import { useLang } from '../contexts/LanguageContext'
import { API_URL } from '../config'

const ICONS = ['🏠','📸','🔑','🧹','⭐','📊','💡','🌍']

function calc(quartos, diaria, ocupacao) {
  const bruta = diaria * (ocupacao / 100) * 365 * (0.85 + quartos * 0.03)
  const comissao = bruta * 0.20
  const custos = bruta * 0.12
  return { bruta: Math.round(bruta), comissao: Math.round(comissao), custos: Math.round(custos), lucro: Math.round(bruta - comissao - custos) }
}

const fmt = n => n.toLocaleString('pt-PT') + '€'

export default function Proprietarios() {
  const { t } = useLang()
  const p = t.proprietarios
  const ref = useRef(null)

  const [quartos, setQuartos] = useState(2)
  const [diaria, setDiaria] = useState(150)
  const [ocupacao, setOcupacao] = useState(70)
  const r = calc(quartos, diaria, ocupacao)

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', localizacao: '', tipo_imovel: '', num_quartos: '', notas: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('reveal-visible'), i * 60))
    }, { threshold: 0.06 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.telefone || !form.localizacao || !form.tipo_imovel) {
      setError(p.form.errRequired); return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/leads/proprietario`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, num_quartos: parseInt(form.num_quartos) || quartos, quartos_calc: quartos, diaria_media: diaria, ocupacao_estimada: ocupacao, receita_bruta_estimada: r.bruta, lucro_liquido_estimado: r.lucro })
      })
      const data = await res.json()
      if (data.success) setSuccess(true)
      else setError(data.error || p.form.errRequired)
    } catch { setError(p.form.errConn) }
    finally { setSubmitting(false) }
  }

  return (
    <section className={styles.section} id="proprietarios" ref={ref}>
      <div className={styles.container}>

        {/* Left */}
        <div className={styles.left}>
          <p className="section-label reveal">{p.label}</p>
          <h2 className={`${styles.title} reveal reveal-delay-1`}>
            {p.title}<br /><em className={styles.gold}>{p.titleItalic}</em><br />{p.title3}
          </h2>
          <p className={`${styles.desc} reveal reveal-delay-2`}>{p.desc}</p>

          <ul className={`${styles.features} reveal reveal-delay-3`}>
            {p.features.map((f, i) => (
              <li key={i} className={styles.feature}>
                <span className={styles.check}>✓</span><span>{f}</span>
              </li>
            ))}
          </ul>

          {/* Calculator */}
          <div className={`${styles.calculator} reveal reveal-delay-4`}>
            <div className={styles.calcHeader}><span>⚡</span><span>{p.calcHeader}</span></div>

            {[
              { label: p.sliders.quartos, val: quartos, min: 1, max: 5, step: 1, set: setQuartos, display: quartos },
              { label: p.sliders.diaria, val: diaria, min: 50, max: 400, step: 10, set: setDiaria, display: diaria + '€' },
              { label: p.sliders.ocupacao, val: ocupacao, min: 40, max: 95, step: 5, set: setOcupacao, display: ocupacao + '%' },
            ].map(({ label, val, min, max, step, set, display }) => (
              <div key={label} className={styles.sliderGroup}>
                <div className={styles.sliderRow}>
                  <span className={styles.sliderLabel}>{label}</span>
                  <span className={styles.sliderVal}>{display}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={e => set(+e.target.value)} className={styles.slider} />
                <div className={styles.sliderRange}><span>{min}{label === p.sliders.diaria ? '€' : label === p.sliders.ocupacao ? '%' : ''}</span><span>{max}{label === p.sliders.diaria ? '€' : label === p.sliders.ocupacao ? '%' : ''}</span></div>
              </div>
            ))}

            <div className={styles.calcResults}>
              <div className={styles.calcRow}><span>{p.results.receita}</span><span className={styles.calcBruta}>{fmt(r.bruta)}</span></div>
              <div className={styles.calcRow}><span>{p.results.comissao}</span><span className={styles.calcNeg}>−{fmt(r.comissao)}</span></div>
              <div className={styles.calcRow}><span>{p.results.custos}</span><span className={styles.calcNeg}>−{fmt(r.custos)}</span></div>
              <div className={`${styles.calcRow} ${styles.calcTotal}`}><span>{p.results.lucro}</span><span className={styles.calcGold}>{fmt(r.lucro)}</span></div>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className={styles.right}>
          <div className={`${styles.formCard} reveal`}>
            <h3 className={styles.formTitle}>{p.form.title}</h3>
            <p className={styles.formDesc}>{p.form.desc}</p>

            {success ? (
              <div className={styles.successMsg}>
                <div className={styles.successIcon}>✓</div>
                <h4>{p.form.successTitle}</h4>
                <p>{p.form.successMsg}</p>
              </div>
            ) : (
              <div className={styles.formFields}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{p.form.fields.nome} *</label>
                    <input name="nome" value={form.nome} onChange={handleChange} placeholder={p.form.ph.nome} className={styles.input} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{p.form.fields.email} *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={p.form.ph.email} className={styles.input} />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{p.form.fields.tel} *</label>
                    <input name="telefone" value={form.telefone} onChange={handleChange} placeholder={p.form.ph.tel} className={styles.input} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{p.form.fields.loc} *</label>
                    <input name="localizacao" value={form.localizacao} onChange={handleChange} placeholder={p.form.ph.loc} className={styles.input} />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{p.form.fields.tipo} *</label>
                    <select name="tipo_imovel" value={form.tipo_imovel} onChange={handleChange} className={styles.input}>
                      {p.form.tipos.map(o => <option key={o} value={o === p.form.tipos[0] ? '' : o}>{o}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{p.form.fields.nq}</label>
                    <input name="num_quartos" type="number" min="0" max="20" value={form.num_quartos} onChange={handleChange} placeholder={String(quartos)} className={styles.input} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{p.form.fields.notas}</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} placeholder={p.form.ph.notas} rows={3} className={`${styles.input} ${styles.textarea}`} />
                </div>
                <div className={styles.calcSummary}>
                  <span>{p.form.calcLabel}</span>
                  <strong>{fmt(r.lucro)}/ano</strong>
                </div>
                {error && <p className={styles.errorMsg}>{error}</p>}
                <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? p.form.submitting : p.form.submit}
                </button>
                <p className={styles.formNote}>{p.form.note}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
