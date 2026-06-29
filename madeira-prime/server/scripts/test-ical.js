// iCal acceptance tests. Run: node scripts/test-ical.js
//
//  Part A (no DB)  — feed generation + RFC parse round-trip:
//                    0 events, several bookings + manual block, DTEND exclusive,
//                    no guest PII, stable UIDs, valid VCALENDAR (parses cleanly).
//  Part B (needs DB)— import idempotency + cancellation via a local feed:
//                    re-import does not duplicate; a vanished event is removed.
//                    Requires a regenerated Prisma client (run `npx prisma generate`).

const assert = require('assert')
const http = require('http')
const ical = require('node-ical')
const { buildIcsFeed, runIcalImport } = require('../src/ical')

const parse = (ics) => ical.sync.parseICS(ics)
const events = (parsed) => Object.values(parsed).filter((e) => e.type === 'VEVENT')

let passed = 0
function ok(msg) {
  passed++
  console.log(`  ✓ ${msg}`)
}

// ─── Part A — generation ──────────────────────────────────────────────────────

function partA() {
  console.log('\nPart A — feed generation (no DB)\n')

  // 1) Empty feed
  const empty = buildIcsFeed({ property: { title: 'Casa Vazia' }, bookings: [], blocks: [] })
  assert(empty.includes('BEGIN:VCALENDAR') && empty.includes('END:VCALENDAR'), 'has VCALENDAR')
  assert(empty.includes('VERSION:2.0'), 'has VERSION:2.0')
  assert(empty.includes('PRODID:'), 'has PRODID')
  assert(empty.includes('\r\n'), 'uses CRLF line endings')
  assert.strictEqual(events(parse(empty)).length, 0, 'empty feed has 0 VEVENT')
  ok('empty feed: valid VCALENDAR, 0 events')

  // 2) Several bookings + a manual block, with PII that must NOT leak
  const property = { title: 'Casa Teste' }
  const bookings = [
    {
      id: 101,
      check_in: new Date(Date.UTC(2026, 6, 10)), // 2026-07-10
      check_out: new Date(Date.UTC(2026, 6, 15)), // 2026-07-15 (exclusive)
      guest_name: 'João Silva',
      guest_email: 'joao@example.com',
    },
    {
      id: 102,
      check_in: new Date(Date.UTC(2026, 7, 1)),
      check_out: new Date(Date.UTC(2026, 7, 3)),
      guest_name: 'Mary Jones',
    },
  ]
  const blocks = [
    {
      id: 5,
      start_date: new Date(Date.UTC(2026, 8, 1)),
      end_date: new Date(Date.UTC(2026, 8, 4)),
      reason: 'owner',
      summary: null,
    },
  ]

  const ics = buildIcsFeed({ property, bookings, blocks })
  const evs = events(parse(ics))
  assert.strictEqual(evs.length, 3, '2 bookings + 1 block = 3 events')
  ok('mixed feed parses to 3 events')

  // DTEND exclusive: checkout day stays free (DTEND == checkout date directly)
  assert(ics.includes('DTSTART;VALUE=DATE:20260710'), 'DTSTART = check-in')
  assert(ics.includes('DTEND;VALUE=DATE:20260715'), 'DTEND = check-out (exclusive)')
  ok('DTEND is exclusive (turnover day bookable)')

  // No guest PII anywhere in the feed
  assert(!ics.includes('João'), 'guest name absent')
  assert(!ics.includes('Mary Jones'), 'guest name absent')
  assert(!ics.includes('joao@example.com'), 'guest email absent')
  assert(ics.includes('SUMMARY:Reservado'), 'generic booking summary')
  assert(ics.includes('SUMMARY:Indisponível (proprietário)'), 'generic block summary')
  ok('no guest PII exposed; summaries are generic')

  // Stable + unique UIDs across regeneration
  const ics2 = buildIcsFeed({ property, bookings, blocks })
  assert(ics.includes('UID:booking-101@madeiraprime.pt'), 'stable booking UID')
  assert(ics.includes('UID:block-5@madeiraprime.pt'), 'stable block UID')
  // Identical except for the DTSTAMP (generation time) → UIDs/dates are deterministic
  const strip = (s) => s.replace(/DTSTAMP:[^\r\n]+/g, 'DTSTAMP:X')
  assert.strictEqual(strip(ics), strip(ics2), 'feed is deterministic apart from DTSTAMP')
  const uids = (ics.match(/UID:/g) || []).length
  assert.strictEqual(uids, 3, 'one UID per event')
  ok('UIDs stable and unique (updates/cancellations recognised by importers)')

  // Cancelled bookings are simply omitted (only confirmed passed in) — documented behaviour
  const confirmedOnly = buildIcsFeed({ property, bookings: [bookings[0]], blocks: [] })
  assert.strictEqual(events(parse(confirmedOnly)).length, 1, 'cancelled omitted → fewer events')
  ok('cancelled bookings omitted from feed (absence = free)')
}

// ─── Part B — import idempotency + cancellation ────────────────────────────────

async function partB() {
  console.log('\nPart B — import idempotency (DB)\n')

  let PrismaClient
  try {
    ;({ PrismaClient } = require('@prisma/client'))
  } catch {
    console.log('  ⏭  @prisma/client not available — skipped')
    return
  }
  const prisma = new PrismaClient()

  if (!prisma.property_blocks || !prisma.property_ical_feeds) {
    console.log('  ⏭  skipped — stop the server, run `npx prisma generate`, then re-run this test')
    await prisma.$disconnect()
    return
  }

  const SOURCE = '__test__'
  let server, feed, propertyId

  // Mutable body so we can simulate a cancellation between imports.
  let feedBody = buildIcsFeed({
    property: { title: 'ext' },
    bookings: [],
    blocks: [
      { id: 1, start_date: new Date(Date.UTC(2026, 9, 1)), end_date: new Date(Date.UTC(2026, 9, 5)), reason: 'external', summary: 'Ext A' },
      { id: 2, start_date: new Date(Date.UTC(2026, 9, 10)), end_date: new Date(Date.UTC(2026, 9, 12)), reason: 'external', summary: 'Ext B' },
    ],
  })

  try {
    const prop = await prisma.properties.findFirst({ orderBy: { id: 'asc' }, select: { id: true } })
    if (!prop) {
      console.log('  ⏭  no properties in DB — skipped')
      return
    }
    propertyId = prop.id

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8' })
      res.end(feedBody)
    })
    await new Promise((r) => server.listen(0, '127.0.0.1', r))
    const port = server.address().port

    feed = await prisma.property_ical_feeds.create({
      data: { property_id: propertyId, source: SOURCE, url: `http://127.0.0.1:${port}/cal.ics`, active: true },
    })

    const countExternal = () =>
      prisma.property_blocks.count({ where: { property_id: propertyId, source: SOURCE } })

    // First import → 2 blocks
    await runIcalImport(prisma)
    assert.strictEqual(await countExternal(), 2, 'first import creates 2 blocks')
    ok('first import created 2 external blocks')

    // Re-import same feed → still 2 (idempotent, no duplicates)
    await runIcalImport(prisma)
    assert.strictEqual(await countExternal(), 2, 're-import does not duplicate')
    ok('re-import is idempotent (no duplicates)')

    // Simulate cancellation: feed now has only event #1
    feedBody = buildIcsFeed({
      property: { title: 'ext' },
      bookings: [],
      blocks: [
        { id: 1, start_date: new Date(Date.UTC(2026, 9, 1)), end_date: new Date(Date.UTC(2026, 9, 5)), reason: 'external', summary: 'Ext A' },
      ],
    })
    await runIcalImport(prisma)
    assert.strictEqual(await countExternal(), 1, 'vanished event removed')
    ok('cancellation removes the corresponding block')
  } finally {
    // Cleanup temp rows + server
    if (propertyId) {
      await prisma.property_blocks.deleteMany({ where: { property_id: propertyId, source: SOURCE } })
    }
    if (feed) await prisma.property_ical_feeds.delete({ where: { id: feed.id } }).catch(() => {})
    if (server) server.close()
    await prisma.$disconnect()
  }
}

;(async () => {
  partA()
  await partB()
  console.log(`\n✅ ${passed} checks passed\n`)
})().catch((e) => {
  console.error('\n❌ TEST FAILED:', e.message)
  process.exit(1)
})
