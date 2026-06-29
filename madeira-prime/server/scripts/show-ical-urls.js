// Prints the iCal EXPORT URL for every property — copy these into the
// Booking.com Extranet / Airbnb "Import calendar" fields.
// Run: node scripts/show-ical-urls.js
//
// Set PUBLIC_API_URL to your deployed backend origin (defaults to localhost).

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { ensureIcalTokens } = require('../src/ical')

const prisma = new PrismaClient()
const BASE = process.env.PUBLIC_API_URL || 'http://localhost:3001'

;(async () => {
  await ensureIcalTokens(prisma)
  const props = await prisma.properties.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, title: true, ical_token: true },
  })

  console.log('\niCal export URLs (paste into Booking.com / Airbnb):\n')
  for (const p of props) {
    console.log(`  #${p.id}  ${p.title}`)
    console.log(`      ${BASE}/ical/export/${p.id}.ics?token=${p.ical_token}\n`)
  }
})()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
