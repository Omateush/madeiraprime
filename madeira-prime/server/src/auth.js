// ─── Admin authentication (single admin, JWT) ────────────────────────────────
// One admin identity lives in env (ADMIN_EMAIL + ADMIN_PASSWORD_HASH bcrypt hash).
// POST /api/auth/login verifies the password and issues a short-lived JWT;
// requireAdmin guards the protected routes by validating `Authorization: Bearer`.

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ''
const TOKEN_TTL = process.env.JWT_TTL || '12h'

// Auth only works once all three secrets are configured. Missing config → routes
// return 503 instead of silently allowing access.
function authConfigured() {
  return Boolean(JWT_SECRET && ADMIN_EMAIL && ADMIN_PASSWORD_HASH)
}

async function verifyCredentials(email, password) {
  if (!authConfigured()) return false
  if (String(email).trim().toLowerCase() !== ADMIN_EMAIL) return false
  return bcrypt.compare(String(password), ADMIN_PASSWORD_HASH)
}

function signToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, {
    subject: ADMIN_EMAIL,
    expiresIn: TOKEN_TTL,
  })
}

function requireAdmin(req, res, next) {
  if (!authConfigured()) {
    return res.status(503).json({ success: false, error: 'Autenticação não configurada no servidor.' })
  }
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) {
    return res.status(401).json({ success: false, error: 'Não autenticado.' })
  }
  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' })
  }
}

module.exports = { authConfigured, verifyCredentials, signToken, requireAdmin }
