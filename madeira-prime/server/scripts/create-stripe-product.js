/**
 * Madeira Prime — Stripe Product Setup
 * ─────────────────────────────────────
 * Executa este script UMA VEZ para criar o produto e preço no Stripe.
 * O ID do preço gerado é guardado em STRIPE_PRICE_ID no teu .env.
 *
 * Pré-requisitos:
 *   1. Adiciona STRIPE_SECRET_KEY ao server/.env com a tua chave real
 *   2. Corre: node scripts/create-stripe-product.js
 *   3. Copia o STRIPE_PRICE_ID para o teu .env
 */

require('dotenv').config()
const Stripe = require('stripe')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

const CURRENCY   = process.env.STRIPE_BOOKING_CURRENCY || 'eur'
const FEE_CENTS  = parseInt(process.env.STRIPE_BOOKING_FEE_CENTS || '5000', 10)

async function createProduct() {
  // Guard: chave real obrigatória
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('SUBSTITUA')) {
    console.error('\n❌  STRIPE_SECRET_KEY não está configurado em server/.env\n')
    console.error('    Abre o ficheiro server/.env e substitui sk_test_SUBSTITUA... pela tua chave real.')
    console.error('    Obtém a chave em: https://dashboard.stripe.com/apikeys\n')
    process.exit(1)
  }

  console.log('\n🏠  Madeira Prime — Stripe Product Setup')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`💶  Preço da consulta : ${(FEE_CENTS / 100).toFixed(2)} ${CURRENCY.toUpperCase()}`)
  console.log('📡  A criar produto no Stripe...\n')

  // POST /v1/products  (blueprint: setup-chapter → create-product)
  const product = await stripe.products.create({
    name: 'Consulta Madeira Prime',
    description: 'Sessão de consultoria imobiliária personalizada de 30 minutos.',
    default_price_data: {
      currency: CURRENCY,
      unit_amount: FEE_CENTS,
    },
  })

  const priceId = product.default_price  // string ID gerado pelo Stripe

  console.log('✅  Produto criado com sucesso!\n')
  console.log(`   Produto ID : ${product.id}`)
  console.log(`   Preço  ID  : ${priceId}`)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋  Copia esta linha para o teu server/.env:\n')
  console.log(`   STRIPE_PRICE_ID=${priceId}`)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔗  Ver produto no dashboard:')
  console.log(`   https://dashboard.stripe.com/products/${product.id}\n`)
}

createProduct().catch(err => {
  console.error('\n❌  Erro ao criar produto:', err.message)
  if (err.type === 'StripeAuthenticationError') {
    console.error('    A chave STRIPE_SECRET_KEY é inválida. Verifica em: https://dashboard.stripe.com/apikeys')
  }
  process.exit(1)
})
