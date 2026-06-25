require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const { body, validationResult } = require('express-validator')
const Stripe = require('stripe')

const app = express()
const prisma = new PrismaClient()
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

const PORT = process.env.PORT || 3001
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ─── Security Headers ─────────────────────────────────────────────────────────

app.use(helmet())

// ─── CORS ─────────────────────────────────────────────────────────────────────
// ALLOWED_ORIGINS: comma-separated list of permitted origins (set on Render).
// Falls back to CLIENT_URL for single-origin setups, or localhost in dev.

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'https://madeiraprime.pt',
      'https://www.madeiraprime.pt',
      'https://madeiraprime.vercel.app',
      'http://localhost:3000', // Next.js frontend dev server
      CLIENT_URL,              // configurable per-environment via .env
    ]

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// General limiter: 100 req / 15 min per IP across all API routes.
// Stripe webhook is skipped — Stripe IPs must never be throttled.

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/webhook/stripe',
  message: { success: false, error: 'Demasiados pedidos. Tente novamente em 15 minutos.' },
})

// Write limiter: stricter cap on form-submission endpoints to prevent spam.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados pedidos. Tente novamente em 15 minutos.' },
})

app.use(generalLimiter)
app.use('/api/leads', writeLimiter)
app.use('/api/checkout', writeLimiter)

// ─── Stripe Webhook ────────────────────────────────────────────────────────────
// MUST be registered BEFORE express.json() — Stripe requires the raw Buffer body.

app.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET não configurado')
      return res.status(500).json({ error: 'Webhook secret não configurado no servidor' })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error('[Webhook] Assinatura inválida:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    console.log(`[Webhook] ${event.type}`)

    try {
      // ── checkout.session.completed ─────────────────────────────────────────
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const type = session.metadata?.type  // 'marcacao' | 'reserva'

        if (type === 'reserva') {
          const reservaId = parseInt(session.metadata.reserva_id, 10)
          const reserva = await prisma.reservas.update({
            where: { id: reservaId },
            data: { pagamento_status: 'pago', status: 'confirmada' }
          })
          await prisma.imoveis.update({
            where: { id: reserva.imovel_id },
            data: {
              status: 'ocupado',
              ocupado_ate: new Date(session.metadata.check_out)
            }
          })
          console.log(`[Webhook] Reserva #${reservaId} confirmada, imóvel ocupado até ${session.metadata.check_out}`)
        } else {
          // marcacao (default / legacy)
          await prisma.marcacoes.updateMany({
            where: { stripe_session_id: session.id },
            data: { pagamento_status: 'pago', status: 'pendente' }
          })
          console.log(`[Webhook] Marcação paga — session: ${session.id}`)
        }
      }

      // ── checkout.session.expired ───────────────────────────────────────────
      if (event.type === 'checkout.session.expired') {
        const session = event.data.object
        const type = session.metadata?.type

        if (type === 'reserva') {
          const reservaId = parseInt(session.metadata.reserva_id, 10)
          await prisma.reservas.update({
            where: { id: reservaId },
            data: { pagamento_status: 'expirado', status: 'cancelada' }
          })
          await prisma.imoveis.update({
            where: { id: parseInt(session.metadata.imovel_id, 10) },
            data: { status: 'disponivel', ocupado_ate: null }
          })
          console.log(`[Webhook] Reserva #${reservaId} expirada — imóvel desbloqueado`)
        } else {
          await prisma.marcacoes.updateMany({
            where: { stripe_session_id: session.id },
            data: { pagamento_status: 'expirado' }
          })
          console.log(`[Webhook] Sessão marcação expirada — session: ${session.id}`)
        }
      }

      if (event.type === 'charge.refunded') {
        console.log(`[Webhook] Reembolso detectado — PI: ${event.data.object.payment_intent}`)
      }

    } catch (dbErr) {
      console.error('[Webhook] Erro ao actualizar DB:', dbErr)
      return res.status(500).json({ error: 'Erro interno ao processar evento' })
    }

    res.json({ received: true })
  }
)

// ─── JSON Middleware (after webhook route) ────────────────────────────────────

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function handleValidationErrors(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({ campo: e.path, mensagem: e.msg }))
    })
  }
  return null
}

function stripeReady() {
  return process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('SUBSTITUA')
}

// Returns the current date and wall-clock time in Madeira's timezone.
// Render servers run UTC; without this conversion a booking for 09:00 on a
// summer day (WEST = UTC+1) would pass a naive UTC check at 08:01 UTC.
function nowInMadeira() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Atlantic/Madeira',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now)
  const get = type => parts.find(p => p.type === type).value
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  const keyOk   = !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('SUBSTITUA'))
  const priceOk = !!(process.env.STRIPE_PRICE_ID   && !process.env.STRIPE_PRICE_ID.includes('XXXX'))
  res.json({
    success: true,
    mensagem: 'API Madeira Prime a funcionar',
    timestamp: new Date(),
    stripe: { key: keyOk, price: priceOk, ready: keyOk && priceOk }
  })
})

// ─── LEADS PROPRIETÁRIOS ──────────────────────────────────────────────────────

app.post('/api/leads/proprietario', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('telefone').trim().notEmpty().withMessage('Telefone é obrigatório').isLength({ max: 50 }),
  body('localizacao').trim().notEmpty().withMessage('Localização é obrigatória').isLength({ max: 255 }),
  body('tipo_imovel')
    .trim().notEmpty().withMessage('Tipo de imóvel é obrigatório')
    .isIn(['Apartamento', 'Moradia', 'Studio', 'Vivenda', 'Outro']),
  body('num_quartos').isInt({ min: 0, max: 20 }).withMessage('Número de quartos inválido'),
  body('quartos_calc').optional().isInt({ min: 1, max: 10 }),
  body('diaria_media').optional().isDecimal(),
  body('ocupacao_estimada').optional().isDecimal(),
  body('receita_bruta_estimada').optional().isDecimal(),
  body('lucro_liquido_estimado').optional().isDecimal(),
  body('notas').optional().trim().isLength({ max: 1000 }).withMessage('Notas demasiado longas'),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return
  try {
    const lead = await prisma.leads_proprietarios.create({
      data: {
        nome: req.body.nome, email: req.body.email, telefone: req.body.telefone,
        localizacao: req.body.localizacao, tipo_imovel: req.body.tipo_imovel,
        num_quartos: parseInt(req.body.num_quartos, 10),
        notas: req.body.notas?.trim() || null,
        quartos_calc: parseInt(req.body.quartos_calc, 10) || 2,
        diaria_media: parseFloat(req.body.diaria_media) || 0,
        ocupacao_estimada: parseFloat(req.body.ocupacao_estimada) || 0,
        receita_bruta_estimada: parseFloat(req.body.receita_bruta_estimada) || 0,
        lucro_liquido_estimado: parseFloat(req.body.lucro_liquido_estimado) || 0,
      }
    })
    res.status(201).json({ success: true, data: lead, mensagem: 'Lead registado com sucesso' })
  } catch (error) {
    console.error('[POST /api/leads/proprietario]', error)
    res.status(500).json({ success: false, error: 'Erro ao guardar lead. Tente novamente.' })
  }
})

app.get('/api/leads/proprietario', async (req, res) => {
  try {
    const leads = await prisma.leads_proprietarios.findMany({ orderBy: { created_at: 'desc' } })
    res.json({ success: true, total: leads.length, data: leads })
  } catch (error) {
    console.error('[GET /api/leads/proprietario]', error)
    res.status(500).json({ success: false, error: 'Erro ao buscar leads' })
  }
})

// ─── LEADS INVESTIDORES ───────────────────────────────────────────────────────

app.post('/api/leads/investidor', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('telefone').trim().notEmpty().withMessage('Telefone é obrigatório').isLength({ max: 50 }),
  body('capital_disponivel').trim().notEmpty().withMessage('Capital disponível é obrigatório').isLength({ max: 100 }),
  body('horizonte_investimento').trim().notEmpty().withMessage('Horizonte de investimento é obrigatório').isLength({ max: 100 }),
  body('mercado_interesse')
    .trim().notEmpty().withMessage('Mercado de interesse é obrigatório')
    .isIn(['Madeira', 'Lisboa', 'Ambos', 'A definir']),
  body('notas').optional().trim().isLength({ max: 1000 }).withMessage('Notas demasiado longas'),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return
  try {
    const lead = await prisma.leads_investidores.create({
      data: {
        nome: req.body.nome, email: req.body.email, telefone: req.body.telefone,
        capital_disponivel: req.body.capital_disponivel,
        horizonte_investimento: req.body.horizonte_investimento,
        mercado_interesse: req.body.mercado_interesse,
        notas: req.body.notas?.trim() || null,
      }
    })
    res.status(201).json({ success: true, data: lead, mensagem: 'Pedido de dossier registado com sucesso' })
  } catch (error) {
    console.error('[POST /api/leads/investidor]', error)
    res.status(500).json({ success: false, error: 'Erro ao guardar lead. Tente novamente.' })
  }
})

app.get('/api/leads/investidor', async (req, res) => {
  try {
    const leads = await prisma.leads_investidores.findMany({ orderBy: { created_at: 'desc' } })
    res.json({ success: true, total: leads.length, data: leads })
  } catch (error) {
    console.error('[GET /api/leads/investidor]', error)
    res.status(500).json({ success: false, error: 'Erro ao buscar leads' })
  }
})

// ─── IMÓVEIS ──────────────────────────────────────────────────────────────────

// GET /api/imoveis  — ?status=disponivel|bloqueado|ocupado (optional filter)
app.get('/api/imoveis', async (req, res) => {
  try {
    const where = req.query.status ? { status: req.query.status } : {}
    const imoveis = await prisma.imoveis.findMany({ where, orderBy: { created_at: 'desc' } })
    res.json({ success: true, total: imoveis.length, data: imoveis })
  } catch (error) {
    console.error('[GET /api/imoveis]', error)
    res.status(500).json({ success: false, error: 'Erro ao buscar imóveis' })
  }
})

// POST /api/imoveis
app.post('/api/imoveis', [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório').isLength({ max: 255 }),
  body('localizacao').trim().notEmpty().withMessage('Localização é obrigatória'),
  body('tipo').trim().notEmpty().withMessage('Tipo é obrigatório')
    .isIn(['Apartamento', 'Moradia', 'Studio', 'Vivenda', 'Outro']),
  body('num_quartos').isInt({ min: 0, max: 30 }).withMessage('Número de quartos inválido'),
  body('preco_por_noite').isFloat({ min: 0 }).withMessage('Preço por noite inválido'),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return
  try {
    const imovel = await prisma.imoveis.create({
      data: {
        titulo: req.body.titulo,
        descricao: req.body.descricao?.trim() || null,
        localizacao: req.body.localizacao,
        tipo: req.body.tipo,
        num_quartos: parseInt(req.body.num_quartos, 10),
        preco_por_noite: parseFloat(req.body.preco_por_noite),
        imagem_url: req.body.imagem_url?.trim() || null,
        status: 'disponivel',
      }
    })
    res.status(201).json({ success: true, data: imovel })
  } catch (error) {
    console.error('[POST /api/imoveis]', error)
    res.status(500).json({ success: false, error: 'Erro ao criar imóvel' })
  }
})

// PATCH /api/imoveis/:id
app.patch('/api/imoveis/:id', [
  body('titulo').optional().trim().notEmpty().isLength({ max: 255 }),
  body('localizacao').optional().trim().notEmpty(),
  body('tipo').optional().isIn(['Apartamento', 'Moradia', 'Studio', 'Vivenda', 'Outro']),
  body('num_quartos').optional().isInt({ min: 0, max: 30 }),
  body('preco_por_noite').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['disponivel', 'bloqueado', 'ocupado']),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return
  try {
    const data = {}
    const fields = ['titulo', 'descricao', 'localizacao', 'tipo', 'num_quartos', 'preco_por_noite', 'status', 'ocupado_ate', 'imagem_url']
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === 'num_quartos') data[f] = parseInt(req.body[f], 10)
        else if (f === 'preco_por_noite') data[f] = parseFloat(req.body[f])
        else if (f === 'ocupado_ate') data[f] = req.body[f] ? new Date(req.body[f]) : null
        else data[f] = req.body[f] || null
      }
    }
    // Keep string fields from being set to null unintentionally
    if (data.titulo === null) delete data.titulo
    if (data.localizacao === null) delete data.localizacao
    if (data.tipo === null) delete data.tipo
    if (data.status === null) delete data.status

    const imovel = await prisma.imoveis.update({
      where: { id: parseInt(req.params.id, 10) },
      data
    })
    res.json({ success: true, data: imovel })
  } catch (error) {
    console.error('[PATCH /api/imoveis/:id]', error)
    res.status(500).json({ success: false, error: 'Erro ao actualizar imóvel' })
  }
})

// DELETE /api/imoveis/:id
app.delete('/api/imoveis/:id', async (req, res) => {
  try {
    await prisma.imoveis.delete({ where: { id: parseInt(req.params.id, 10) } })
    res.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/imoveis/:id]', error)
    res.status(500).json({ success: false, error: 'Erro ao eliminar imóvel' })
  }
})

// ─── PROPERTIES — PUBLIC API (Next.js frontend) ──────────────────────────────
// Queries the `properties` table directly — no field translation needed.
// The `imoveis` table remains the operational store used by the booking system.

function mapProperty(p) {
  return {
    id:            String(p.id),
    name:          p.title,
    type:          p.type,
    location:      p.location,
    description:   p.description ?? '',
    pricePerNight: parseFloat(p.price_per_night),
    maxGuests:     p.guests_max,
    bedrooms:      p.bedrooms,
    bathrooms:     p.bathrooms,
    images:        p.images,
    amenities:     p.amenities,
  }
}

// GET /api/properties — supports ?location= ?type= ?guests=
app.get('/api/properties', async (req, res) => {
  try {
    const { location, type, guests } = req.query

    const where = { status: 'available' }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (type && ['apartment', 'villa', 'house', 'studio'].includes(type)) {
      where.type = type
    }

    if (guests) {
      const n = parseInt(guests, 10)
      if (!isNaN(n) && n > 0) where.guests_max = { gte: n }
    }

    const rows = await prisma.properties.findMany({ where, orderBy: { created_at: 'desc' } })
    res.json(rows.map(mapProperty))
  } catch (error) {
    console.error('[GET /api/properties]', error)
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// GET /api/properties/:id
app.get('/api/properties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid property ID' })

    const row = await prisma.properties.findUnique({ where: { id } })
    if (!row) return res.status(404).json({ error: 'Property not found' })

    res.json(mapProperty(row))
  } catch (error) {
    console.error('[GET /api/properties/:id]', error)
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

// ─── RESERVAS — ADMIN ─────────────────────────────────────────────────────────

// GET /api/reservas
app.get('/api/reservas', async (req, res) => {
  try {
    const reservas = await prisma.reservas.findMany({
      orderBy: { created_at: 'desc' },
      include: { imovel: { select: { titulo: true, localizacao: true } } }
    })
    const data = reservas.map(r => ({
      ...r,
      imovel_titulo: r.imovel.titulo,
      imovel_localizacao: r.imovel.localizacao,
      imovel: undefined
    }))
    res.json({ success: true, total: data.length, data })
  } catch (error) {
    console.error('[GET /api/reservas]', error)
    res.status(500).json({ success: false, error: 'Erro ao buscar reservas' })
  }
})

// ─── CHECKOUT — RESERVA ───────────────────────────────────────────────────────

// POST /api/checkout/reserva
// 1. Validates property is disponivel
// 2. Creates reserva record (status: aguardar_pagamento)
// 3. Blocks property (status: bloqueado)
// 4. Creates Stripe Checkout session (price_data inline — each booking has unique total)
// 5. Saves stripe_session_id on reserva
// Returns { url } for client-side redirect
app.post('/api/checkout/reserva', [
  body('imovel_id').isInt({ min: 1 }).withMessage('Imóvel inválido'),
  body('nome_hospede').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 255 }),
  body('email_hospede').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('telefone_hospede').trim().notEmpty().withMessage('Telefone é obrigatório').isLength({ max: 50 }),
  body('check_in').notEmpty().isISO8601().withMessage('Data de entrada inválida (YYYY-MM-DD)'),
  body('check_out').notEmpty().isISO8601().withMessage('Data de saída inválida (YYYY-MM-DD)'),
  body('notas').optional().trim().isLength({ max: 1000 }).withMessage('Notas demasiado longas'),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return

  if (!stripeReady()) {
    return res.status(503).json({ success: false, error: 'Pagamentos não configurados. Contacte o administrador.' })
  }

  const imovelId  = parseInt(req.body.imovel_id, 10)
  const checkIn   = new Date(req.body.check_in)
  const checkOut  = new Date(req.body.check_out)
  const msPerDay  = 1000 * 60 * 60 * 24
  const totalNoites = Math.round((checkOut - checkIn) / msPerDay)

  if (totalNoites < 1) {
    return res.status(400).json({ success: false, error: 'A data de saída deve ser posterior à de entrada.' })
  }

  try {
    // 1. Verify property exists and is available
    const imovel = await prisma.imoveis.findUnique({ where: { id: imovelId } })
    if (!imovel) return res.status(404).json({ success: false, error: 'Imóvel não encontrado.' })
    if (imovel.status !== 'disponivel') {
      return res.status(409).json({ success: false, error: 'Este imóvel já não está disponível.' })
    }

    const precoPorNoite = parseFloat(imovel.preco_por_noite)
    const totalAmount   = precoPorNoite * totalNoites
    const totalCents    = Math.round(totalAmount * 100)

    // 2. Create reservation record
    const reserva = await prisma.reservas.create({
      data: {
        imovel_id: imovelId,
        nome_hospede: req.body.nome_hospede,
        email_hospede: req.body.email_hospede,
        telefone_hospede: req.body.telefone_hospede,
        check_in: checkIn,
        check_out: checkOut,
        total_noites: totalNoites,
        preco_por_noite: precoPorNoite,
        total_amount: totalAmount,
        notas: req.body.notas?.trim() || null,
        status: 'aguardar_pagamento',
        pagamento_status: 'aguardar_pagamento',
      }
    })

    // 3. Temporarily block the property
    await prisma.imoveis.update({
      where: { id: imovelId },
      data: { status: 'bloqueado' }
    })

    // 4. Create Stripe Checkout session (price_data inline — unique amount per booking)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.body.email_hospede,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: totalCents,
            product_data: {
              name: `Reserva — ${imovel.titulo}`,
              description: `${req.body.check_in} → ${req.body.check_out} · ${totalNoites} noite${totalNoites !== 1 ? 's' : ''} · ${req.body.nome_hospede}`,
            },
          },
          quantity: 1,
        }
      ],
      metadata: {
        type: 'reserva',
        reserva_id: String(reserva.id),
        imovel_id: String(imovelId),
        check_in: req.body.check_in,
        check_out: req.body.check_out,
        nome: req.body.nome_hospede,
      },
      allow_promotion_codes: true,
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&type=reserva`,
      cancel_url:  `${CLIENT_URL}/cancel`,
    })

    // 5. Save session ID on reservation
    await prisma.reservas.update({
      where: { id: reserva.id },
      data: { stripe_session_id: session.id }
    })

    console.log(`[Checkout/Reserva] Imóvel #${imovelId} bloqueado — reserva #${reserva.id} — session: ${session.id}`)

    res.status(201).json({ success: true, url: session.url })

  } catch (error) {
    console.error('[POST /api/checkout/reserva]', error)
    res.status(500).json({ success: false, error: 'Erro ao iniciar pagamento. Tente novamente.' })
  }
})

// ─── MARCAÇÕES — CHECKOUT STRIPE ─────────────────────────────────────────────

app.post('/api/checkout/marcacao', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('telefone').trim().notEmpty().withMessage('Telefone é obrigatório').isLength({ max: 50 }),
  body('data_preferida').notEmpty().isISO8601().withMessage('Formato de data inválido'),
  body('hora_preferida').trim().notEmpty().matches(/^\d{2}:\d{2}$/).withMessage('Formato de hora inválido'),
  body('tipo_cliente').trim().isIn(['proprietario', 'investidor']).withMessage('Tipo de cliente inválido'),
  body('notas').optional().trim().isLength({ max: 1000 }).withMessage('Notas demasiado longas'),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return

  // ── Madeira-aware past-booking guard ─────────────────────────────────────
  const madeiraTime = nowInMadeira()

  if (req.body.data_preferida < madeiraTime.dateStr) {
    return res.status(400).json({ success: false, error: 'Não é possível marcar para uma data passada.' })
  }

  if (req.body.data_preferida === madeiraTime.dateStr) {
    const [bookHour, bookMinute] = req.body.hora_preferida.split(':').map(Number)
    const bookMinutes = bookHour * 60 + bookMinute
    const nowMinutes  = madeiraTime.hour * 60 + madeiraTime.minute + 30 // 30-min buffer
    if (bookMinutes <= nowMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Este horário já não está disponível. Por favor escolha um horário com pelo menos 30 minutos de antecedência.',
      })
    }
  }

  const keyOk   = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('SUBSTITUA')
  const priceOk = process.env.STRIPE_PRICE_ID   && !process.env.STRIPE_PRICE_ID.includes('XXXX')
  if (!keyOk || !priceOk) {
    return res.status(503).json({
      success: false,
      error: priceOk ? 'Pagamentos não configurados.' : 'Corre: node scripts/create-stripe-product.js'
    })
  }

  try {
    const marcacao = await prisma.marcacoes.create({
      data: {
        nome: req.body.nome, email: req.body.email, telefone: req.body.telefone,
        data_preferida: new Date(req.body.data_preferida),
        hora_preferida: req.body.hora_preferida,
        tipo_cliente: req.body.tipo_cliente,
        notas: req.body.notas?.trim() || null,
        status: 'aguardar_pagamento',
        pagamento_status: 'aguardar_pagamento',
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.body.email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      metadata: {
        type: 'marcacao',
        marcacao_id: String(marcacao.id),
        nome: req.body.nome,
        data: req.body.data_preferida,
        hora: req.body.hora_preferida,
        tipo: req.body.tipo_cliente,
      },
      allow_promotion_codes: true,
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${CLIENT_URL}/cancel`,
    })

    await prisma.marcacoes.update({ where: { id: marcacao.id }, data: { stripe_session_id: session.id } })
    console.log(`[Checkout/Marcacao] #${marcacao.id} — session: ${session.id}`)

    res.status(201).json({ success: true, url: session.url })
  } catch (error) {
    console.error('[POST /api/checkout/marcacao]', error)
    res.status(500).json({ success: false, error: 'Erro ao iniciar pagamento. Tente novamente.' })
  }
})

// ─── MARCAÇÕES — ADMIN ────────────────────────────────────────────────────────

app.get('/api/marcacoes', async (req, res) => {
  try {
    const marcacoes = await prisma.marcacoes.findMany({ orderBy: { created_at: 'desc' } })
    res.json({ success: true, total: marcacoes.length, data: marcacoes })
  } catch (error) {
    console.error('[GET /api/marcacoes]', error)
    res.status(500).json({ success: false, error: 'Erro ao buscar marcações' })
  }
})

app.patch('/api/marcacoes/:id/status', [
  body('status').isIn(['pendente', 'confirmado', 'cancelado', 'aguardar_pagamento']).withMessage('Status inválido')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res)
  if (validationError !== null) return
  try {
    const marcacao = await prisma.marcacoes.update({
      where: { id: parseInt(req.params.id, 10) },
      data: { status: req.body.status }
    })
    res.json({ success: true, data: marcacao })
  } catch (error) {
    console.error('[PATCH /api/marcacoes/:id/status]', error)
    res.status(500).json({ success: false, error: 'Erro ao atualizar marcação' })
  }
})

// ─── 404 & Error Handler ──────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Rota ${req.method} ${req.path} não encontrada` })
})

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err)
  res.status(500).json({ success: false, error: 'Erro interno do servidor' })
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const keyOk   = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('SUBSTITUA')
  const priceOk = process.env.STRIPE_PRICE_ID   && !process.env.STRIPE_PRICE_ID.includes('XXXX')
  console.log(`\n🏠 Madeira Prime API`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Servidor a correr na porta ${PORT}`)
  console.log(`🌐 http://localhost:${PORT}/api/health`)
  console.log(`💳 Stripe key   : ${keyOk   ? '✅ Configurada' : '⚠️  Em falta'}`)
  console.log(`🏷️  Stripe price : ${priceOk ? `✅ ${process.env.STRIPE_PRICE_ID}` : '⚠️  Corre: node scripts/create-stripe-product.js'}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
})

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0) })
