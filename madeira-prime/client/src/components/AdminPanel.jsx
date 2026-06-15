import React, { useState, useEffect, useCallback } from 'react'
import styles from '../styles/AdminPanel.module.css'
import { API_URL } from '../config'

const ADMIN_PASSWORD = 'madeira2026'

// ─── Colour Maps ──────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pendente:            { bg: 'rgba(201,168,76,0.15)',  border: 'rgba(201,168,76,0.4)',  text: '#C9A84C' },
  confirmado:          { bg: 'rgba(72,199,142,0.15)',  border: 'rgba(72,199,142,0.4)',  text: '#48C78E' },
  confirmada:          { bg: 'rgba(72,199,142,0.15)',  border: 'rgba(72,199,142,0.4)',  text: '#48C78E' },
  cancelado:           { bg: 'rgba(224,82,82,0.15)',   border: 'rgba(224,82,82,0.4)',   text: '#E05252' },
  cancelada:           { bg: 'rgba(224,82,82,0.15)',   border: 'rgba(224,82,82,0.4)',   text: '#E05252' },
  aguardar_pagamento:  { bg: 'rgba(90,106,126,0.15)',  border: 'rgba(90,106,126,0.4)',  text: '#8A9AAE' },
}

const PAGAMENTO_COLORS = {
  aguardar_pagamento: { bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.3)', text: '#C9A84C', label: 'A pagar'  },
  pago:               { bg: 'rgba(72,199,142,0.12)', border: 'rgba(72,199,142,0.3)', text: '#48C78E', label: 'Pago'     },
  expirado:           { bg: 'rgba(90,106,126,0.12)', border: 'rgba(90,106,126,0.3)', text: '#5A6A7E', label: 'Expirado' },
  reembolsado:        { bg: 'rgba(224,82,82,0.12)',  border: 'rgba(224,82,82,0.3)',  text: '#E05252', label: 'Reemb.'  },
}

const IMOVEL_STATUS = {
  disponivel: { bg: 'rgba(72,199,142,0.15)', border: 'rgba(72,199,142,0.4)', text: '#48C78E', label: 'Disponível' },
  bloqueado:  { bg: 'rgba(201,168,76,0.15)', border: 'rgba(201,168,76,0.4)', text: '#C9A84C', label: 'Bloqueado'  },
  ocupado:    { bg: 'rgba(224,82,82,0.15)',  border: 'rgba(224,82,82,0.4)',  text: '#E05252', label: 'Ocupado'    },
}

// ─── Shared Badge Components ──────────────────────────────────────────────────

function Badge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.aguardar_pagamento
  const label = status === 'aguardar_pagamento' ? 'A aguardar' : status
  return (
    <span className={styles.badge} style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {label}
    </span>
  )
}

function PagamentoBadge({ status }) {
  const c = PAGAMENTO_COLORS[status] || PAGAMENTO_COLORS.aguardar_pagamento
  return (
    <span className={styles.badge} style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {c.label}
    </span>
  )
}

function ImovelStatusBadge({ status }) {
  const c = IMOVEL_STATUS[status] || IMOVEL_STATUS.disponivel
  return (
    <span className={styles.badge} style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {c.label}
    </span>
  )
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function exportCSV(data, filename) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(d) {
  if (!d) return '—'
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toLocaleDateString('pt-PT')
}

function fmtEur(v) {
  return Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const submit = () => {
    if (pw === ADMIN_PASSWORD) onLogin()
    else { setErr('Password incorreta.'); setPw('') }
  }
  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>MADEIRA <span>PRIME</span></div>
        <p className={styles.loginSub}>Painel Administrativo</p>
        <div className={styles.loginField}>
          <label>Password</label>
          <input type="password" value={pw} placeholder="••••••••"
            onChange={e => { setPw(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className={styles.loginInput} autoFocus />
        </div>
        {err && <p className={styles.loginErr}>{err}</p>}
        <button className={styles.loginBtn} onClick={submit}>ENTRAR →</button>
        <p className={styles.loginNote}>Acesso restrito · Madeira Prime © 2026</p>
      </div>
    </div>
  )
}

// ─── Marcações Tab ────────────────────────────────────────────────────────────

function MarcacoesTab() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('todos')
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch(`${API_URL}/api/marcacoes`); setData((await r.json()).data || []) }
    catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try { await fetch(`${API_URL}/api/marcacoes/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); await load() }
    finally { setUpdating(null) }
  }

  const counts = {
    todos: data.length,
    aguardar_pagamento: data.filter(m => m.pagamento_status === 'aguardar_pagamento').length,
    pendente:  data.filter(m => m.status === 'pendente').length,
    confirmado: data.filter(m => m.status === 'confirmado').length,
    cancelado:  data.filter(m => m.status === 'cancelado').length,
  }

  const filtered = filter === 'todos' ? data
    : filter === 'aguardar_pagamento' ? data.filter(m => m.pagamento_status === 'aguardar_pagamento')
    : data.filter(m => m.status === filter)

  return (
    <div>
      <div className={styles.statsRow}>
        {[
          { label: 'Total',      value: counts.todos,              color: '#8A9AAE' },
          { label: 'A pagar',    value: counts.aguardar_pagamento, color: '#C9A84C' },
          { label: 'Pendentes',  value: counts.pendente,           color: '#C9A84C' },
          { label: 'Confirmadas',value: counts.confirmado,         color: '#48C78E' },
          { label: 'Canceladas', value: counts.cancelado,          color: '#E05252' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterBtns}>
          {[
            { key: 'todos', label: 'Todos' }, { key: 'aguardar_pagamento', label: 'A pagar' },
            { key: 'pendente', label: 'Pendentes' }, { key: 'confirmado', label: 'Confirmadas' }, { key: 'cancelado', label: 'Canceladas' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}>
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.refreshBtn} onClick={load}>↻ Atualizar</button>
          <button className={styles.exportBtn} onClick={() => exportCSV(filtered, 'marcacoes.csv')}>⬇ CSV</button>
        </div>
      </div>

      {loading ? <div className={styles.loading}>A carregar...</div>
        : filtered.length === 0 ? <div className={styles.empty}>Nenhuma marcação encontrada.</div>
        : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>
                <th>#</th><th>Nome</th><th>Email</th><th>Telefone</th>
                <th>Data</th><th>Hora</th><th>Tipo</th><th>Pagamento</th><th>Status</th><th>Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className={styles.tr}>
                    <td className={styles.tdId}>{m.id}</td>
                    <td className={styles.tdName}>{m.nome}</td>
                    <td><a href={`mailto:${m.email}`} className={styles.emailLink}>{m.email}</a></td>
                    <td>{m.telefone}</td>
                    <td>{fmtDate(m.data_preferida)}</td>
                    <td>{m.hora_preferida}</td>
                    <td><span className={`${styles.tipoBadge} ${m.tipo_cliente === 'proprietario' ? styles.tipoProprietario : styles.tipoInvestidor}`}>{m.tipo_cliente}</span></td>
                    <td><PagamentoBadge status={m.pagamento_status} /></td>
                    <td><Badge status={m.status} /></td>
                    <td>
                      <div className={styles.actions}>
                        {m.status !== 'confirmado' && <button className={`${styles.actionBtn} ${styles.confirmBtn}`} disabled={updating === m.id} onClick={() => updateStatus(m.id, 'confirmado')}>✓</button>}
                        {m.status !== 'cancelado'  && <button className={`${styles.actionBtn} ${styles.cancelBtn}`}  disabled={updating === m.id} onClick={() => updateStatus(m.id, 'cancelado')}>✗</button>}
                        {m.status !== 'pendente'   && <button className={`${styles.actionBtn} ${styles.pendingBtn}`} disabled={updating === m.id} onClick={() => updateStatus(m.id, 'pendente')}>⟳</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {filtered.some(m => m.notas) && (
        <div className={styles.notasSection}>
          <h4 className={styles.notasTitle}>Notas</h4>
          {filtered.filter(m => m.notas).map(m => (
            <div key={m.id} className={styles.notaCard}>
              <span className={styles.notaName}>{m.nome} (#{m.id})</span>
              <p className={styles.notaText}>{m.notas}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Generic Leads Tab ────────────────────────────────────────────────────────

function LeadsTab({ endpoint, columns, filename }) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      try { const r = await fetch(endpoint); setData((await r.json()).data || []) }
      catch { setData([]) } finally { setLoading(false) }
    })()
  }, [endpoint])

  const filtered = search
    ? data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
    : data

  return (
    <div>
      <div className={styles.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className={styles.searchInput} />
        <div className={styles.toolbarRight}>
          <span className={styles.countLabel}>{filtered.length} registos</span>
          <button className={styles.exportBtn} onClick={() => exportCSV(filtered, filename)}>⬇ CSV</button>
        </div>
      </div>
      {loading ? <div className={styles.loading}>A carregar...</div>
        : filtered.length === 0 ? <div className={styles.empty}>Nenhum registo encontrado.</div>
        : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id || i} className={styles.tr}>
                    {columns.map(c => (
                      <td key={c.key}>
                        {c.key === 'email' ? <a href={`mailto:${row[c.key]}`} className={styles.emailLink}>{row[c.key]}</a>
                          : c.key === 'created_at' ? fmtDate(row[c.key])
                          : c.key === 'lucro_liquido_estimado' || c.key === 'receita_bruta_estimada' ? fmtEur(row[c.key])
                          : String(row[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

// ─── Imóveis Tab ──────────────────────────────────────────────────────────────

const IMOVEL_FORM_BLANK = { titulo: '', descricao: '', localizacao: '', tipo: 'Apartamento', num_quartos: 1, preco_por_noite: '', imagem_url: '' }
const TIPOS = ['Apartamento', 'Moradia', 'Studio', 'Vivenda', 'Outro']

function ImoveisTab() {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)   // null = add new, object = edit
  const [form, setForm]           = useState(IMOVEL_FORM_BLANK)
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState('')
  const [deleting, setDeleting]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch(`${API_URL}/api/imoveis`); setData((await r.json()).data || []) }
    catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm(IMOVEL_FORM_BLANK)
    setFormErr('')
    setShowForm(true)
  }

  const openEdit = (imovel) => {
    setEditing(imovel)
    setForm({
      titulo: imovel.titulo || '',
      descricao: imovel.descricao || '',
      localizacao: imovel.localizacao || '',
      tipo: imovel.tipo || 'Apartamento',
      num_quartos: imovel.num_quartos ?? 1,
      preco_por_noite: imovel.preco_por_noite ?? '',
      imagem_url: imovel.imagem_url || '',
      status: imovel.status || 'disponivel',
    })
    setFormErr('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setFormErr('') }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    if (!form.titulo || !form.localizacao || !form.tipo || !form.preco_por_noite) {
      setFormErr('Preencha os campos obrigatórios: título, localização, tipo e preço.'); return
    }
    setSaving(true); setFormErr('')
    try {
      const url    = editing ? `${API_URL}/api/imoveis/${editing.id}` : `${API_URL}/api/imoveis`
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (json.success) { closeForm(); await load() }
      else setFormErr(json.error || 'Erro ao guardar imóvel.')
    } catch { setFormErr('Erro de ligação.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este imóvel? As reservas associadas também serão removidas.')) return
    setDeleting(id)
    try {
      await fetch(`${API_URL}/api/imoveis/${id}`, { method: 'DELETE' })
      await load()
    } finally { setDeleting(null) }
  }

  const counts = {
    total: data.length,
    disponivel: data.filter(p => p.status === 'disponivel').length,
    bloqueado:  data.filter(p => p.status === 'bloqueado').length,
    ocupado:    data.filter(p => p.status === 'ocupado').length,
  }

  return (
    <div>
      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total',       value: counts.total,      color: '#8A9AAE' },
          { label: 'Disponíveis', value: counts.disponivel, color: '#48C78E' },
          { label: 'Bloqueados',  value: counts.bloqueado,  color: '#C9A84C' },
          { label: 'Ocupados',    value: counts.ocupado,    color: '#E05252' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.addBtn} onClick={openAdd}>+ Adicionar Imóvel</button>
        <div className={styles.toolbarRight}>
          <button className={styles.refreshBtn} onClick={load}>↻ Atualizar</button>
          <button className={styles.exportBtn} onClick={() => exportCSV(data, 'imoveis.csv')}>⬇ CSV</button>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className={styles.inlineForm}>
          <div className={styles.inlineFormHeader}>
            <h3 className={styles.inlineFormTitle}>{editing ? `Editar: ${editing.titulo}` : 'Novo Imóvel'}</h3>
            <button className={styles.inlineFormClose} onClick={closeForm}>✕</button>
          </div>
          <div className={styles.inlineFormGrid}>
            <div className={styles.inlineFormField}>
              <label>Título *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ex: Apartamento Vista Mar" className={styles.inlineInput} />
            </div>
            <div className={styles.inlineFormField}>
              <label>Localização *</label>
              <input name="localizacao" value={form.localizacao} onChange={handleChange} placeholder="Ex: Funchal, Madeira" className={styles.inlineInput} />
            </div>
            <div className={styles.inlineFormField}>
              <label>Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className={styles.inlineInput}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.inlineFormField}>
              <label>Quartos *</label>
              <input name="num_quartos" type="number" min="0" max="30" value={form.num_quartos} onChange={handleChange} className={styles.inlineInput} />
            </div>
            <div className={styles.inlineFormField}>
              <label>Preço / Noite (€) *</label>
              <input name="preco_por_noite" type="number" min="0" step="0.01" value={form.preco_por_noite} onChange={handleChange} placeholder="120.00" className={styles.inlineInput} />
            </div>
            {editing && (
              <div className={styles.inlineFormField}>
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={styles.inlineInput}>
                  <option value="disponivel">Disponível</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="ocupado">Ocupado</option>
                </select>
              </div>
            )}
            <div className={`${styles.inlineFormField} ${styles.inlineFormFieldFull}`}>
              <label>URL da Imagem</label>
              <input name="imagem_url" value={form.imagem_url} onChange={handleChange} placeholder="https://..." className={styles.inlineInput} />
            </div>
            <div className={`${styles.inlineFormField} ${styles.inlineFormFieldFull}`}>
              <label>Descrição</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={3} placeholder="Descrição opcional..." className={`${styles.inlineInput} ${styles.inlineTextarea}`} />
            </div>
          </div>
          {formErr && <p className={styles.inlineFormErr}>{formErr}</p>}
          <div className={styles.inlineFormActions}>
            <button className={styles.inlineCancelBtn} onClick={closeForm}>Cancelar</button>
            <button className={styles.inlineSaveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'A guardar...' : (editing ? 'Guardar Alterações' : 'Criar Imóvel')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <div className={styles.loading}>A carregar...</div>
        : data.length === 0 ? <div className={styles.empty}>Nenhum imóvel encontrado. Clique em "+ Adicionar Imóvel".</div>
        : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>
                <th>#</th><th>Título</th><th>Localização</th><th>Tipo</th>
                <th>Quartos</th><th>Preço/Noite</th><th>Status</th><th>Ocupado até</th><th>Ações</th>
              </tr></thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.id} className={styles.tr}>
                    <td className={styles.tdId}>{p.id}</td>
                    <td className={styles.tdName}>{p.titulo}</td>
                    <td>{p.localizacao}</td>
                    <td>{p.tipo}</td>
                    <td style={{ textAlign: 'center' }}>{p.num_quartos}</td>
                    <td style={{ color: '#C9A84C', fontWeight: 600 }}>{fmtEur(p.preco_por_noite)}</td>
                    <td><ImovelStatusBadge status={p.status} /></td>
                    <td>{p.ocupado_ate ? fmtDate(p.ocupado_ate) : <span style={{ color: '#3A4A5E' }}>—</span>}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(p)} title="Editar">✎</button>
                        <button className={`${styles.actionBtn} ${styles.cancelBtn}`} disabled={deleting === p.id} onClick={() => handleDelete(p.id)} title="Eliminar">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

// ─── Reservas Tab ─────────────────────────────────────────────────────────────

function ReservasTab() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch(`${API_URL}/api/reservas`); setData((await r.json()).data || []) }
    catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
    : data

  const counts = {
    total:     data.length,
    aguardar:  data.filter(r => r.pagamento_status === 'aguardar_pagamento').length,
    pagas:     data.filter(r => r.pagamento_status === 'pago').length,
    canceladas:data.filter(r => r.status === 'cancelada').length,
  }

  const totalRevenue = data.filter(r => r.pagamento_status === 'pago').reduce((s, r) => s + Number(r.total_amount), 0)

  return (
    <div>
      <div className={styles.statsRow}>
        {[
          { label: 'Total',     value: counts.total,      color: '#8A9AAE' },
          { label: 'A pagar',   value: counts.aguardar,   color: '#C9A84C' },
          { label: 'Pagas',     value: counts.pagas,      color: '#48C78E' },
          { label: 'Canceladas',value: counts.canceladas, color: '#E05252' },
          { label: 'Receita',   value: fmtEur(totalRevenue), color: '#C9A84C', isText: true },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color, fontSize: s.isText ? '1.3rem' : undefined }}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className={styles.searchInput} />
        <div className={styles.toolbarRight}>
          <span className={styles.countLabel}>{filtered.length} reservas</span>
          <button className={styles.refreshBtn} onClick={load}>↻ Atualizar</button>
          <button className={styles.exportBtn} onClick={() => exportCSV(filtered, 'reservas.csv')}>⬇ CSV</button>
        </div>
      </div>

      {loading ? <div className={styles.loading}>A carregar...</div>
        : filtered.length === 0 ? <div className={styles.empty}>Nenhuma reserva encontrada.</div>
        : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>
                <th>#</th><th>Imóvel</th><th>Hóspede</th><th>Email</th>
                <th>Check-in</th><th>Check-out</th><th>Noites</th>
                <th>Total</th><th>Pagamento</th><th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={styles.tr}>
                    <td className={styles.tdId}>{r.id}</td>
                    <td className={styles.tdName}>{r.imovel_titulo}</td>
                    <td>{r.nome_hospede}</td>
                    <td><a href={`mailto:${r.email_hospede}`} className={styles.emailLink}>{r.email_hospede}</a></td>
                    <td>{fmtDate(r.check_in)}</td>
                    <td>{fmtDate(r.check_out)}</td>
                    <td style={{ textAlign: 'center' }}>{r.total_noites}</td>
                    <td style={{ color: '#C9A84C', fontWeight: 600 }}>{fmtEur(r.total_amount)}</td>
                    <td><PagamentoBadge status={r.pagamento_status} /></td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

const TABS = ['Marcações', 'Leads Proprietários', 'Leads Investidores', 'Imóveis', 'Reservas']

const PROP_COLS = [
  { key: 'id', label: '#' }, { key: 'nome', label: 'Nome' }, { key: 'email', label: 'Email' },
  { key: 'telefone', label: 'Tel.' }, { key: 'localizacao', label: 'Localização' },
  { key: 'tipo_imovel', label: 'Tipo' }, { key: 'num_quartos', label: 'Quartos' },
  { key: 'lucro_liquido_estimado', label: 'Lucro Est.' }, { key: 'created_at', label: 'Data' },
]

const INV_COLS = [
  { key: 'id', label: '#' }, { key: 'nome', label: 'Nome' }, { key: 'email', label: 'Email' },
  { key: 'telefone', label: 'Tel.' }, { key: 'capital_disponivel', label: 'Capital' },
  { key: 'horizonte_investimento', label: 'Horizonte' }, { key: 'mercado_interesse', label: 'Mercado' },
  { key: 'created_at', label: 'Data' },
]

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab]       = useState(0)

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          MADEIRA <span>PRIME</span>
          <span className={styles.headerBadge}>Admin</span>
        </div>
        <div className={styles.headerRight}>
          <a href="/" className={styles.siteLink}>← Ver site</a>
          <button className={styles.logoutBtn} onClick={() => setAuthed(false)}>Sair</button>
        </div>
      </header>

      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}>{t}</button>
        ))}
      </div>

      <div className={styles.content}>
        {tab === 0 && <MarcacoesTab />}
        {tab === 1 && <LeadsTab endpoint={`${API_URL}/api/leads/proprietario`} columns={PROP_COLS} filename="leads_proprietarios.csv" />}
        {tab === 2 && <LeadsTab endpoint={`${API_URL}/api/leads/investidor`}   columns={INV_COLS}  filename="leads_investidores.csv"  />}
        {tab === 3 && <ImoveisTab />}
        {tab === 4 && <ReservasTab />}
      </div>
    </div>
  )
}
