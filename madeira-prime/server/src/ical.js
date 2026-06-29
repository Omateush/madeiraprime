// ─── iCal availability sync (RFC 5545) ──────────────────────────────────────
// Bidirectional channel-manager sync for Booking.com / Airbnb via iCal feeds:
//   EXPORT  buildIcsFeed()  → one .ics per property (confirmed bookings + blocks)
//   IMPORT  runIcalImport() → pulls external feeds, writes `external` blocks
//
// Booking.com/Airbnb have no public API for individual hosts; iCal is the
// supported path. Their pull happens every ~1–2h, so this is near-real-time,
// not instant — an acceptable overbooking window for low volume.

const crypto = require('crypto')
const ical = require('node-ical')

const PRODID = '-//Madeira Prime//Booking Sync//PT'
const DOMAIN = process.env.ICAL_DOMAIN || 'madeiraprime.pt'

// ─── Helpers ────────────────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, '0')
}

// All-day DATE value: YYYYMMDD. @db.Date fields arrive from Prisma as a JS Date
// at UTC midnight, so UTC parts give the intended calendar date.
function toIcsDate(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`
}

// UTC timestamp: YYYYMMDDTHHMMSSZ
function toIcsStamp(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return (
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`
  )
}

function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// RFC 5545 §3.1 line folding at 75 chars (continuation lines start with a space).
function fold(line) {
  if (line.length <= 75) return line
  let out = line.slice(0, 75)
  let rest = line.slice(75)
  while (rest.length > 74) {
    out += '\r\n ' + rest.slice(0, 74)
    rest = rest.slice(74)
  }
  return out + '\r\n ' + rest
}

// Constant-time token comparison for the export URL (avoids enumeration/timing).
function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex') // 48 hex chars
}

// node-ical returns a JS Date for all-day VALUE=DATE events built from local
// components — normalise to UTC-midnight of that calendar date for @db.Date.
function toDateOnly(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

// Builds the VCALENDAR feed for one property.
//  - bookings: confirmed bookings only (cancelled ones are OMITTED from the feed —
//    absence = free dates, which is exactly how Booking.com/Airbnb interpret it).
//  - blocks: manual + imported-external unavailability.
// DTEND is the check-out / end date directly (EXCLUSIVE) so the turnover day stays
// bookable. SUMMARY is generic — no guest PII is ever exposed.
function buildIcsFeed({ property, bookings = [], blocks = [] }) {
  const stamp = toIcsStamp(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(property.title)} — Madeira Prime`,
  ]

  for (const b of bookings) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:booking-${b.id}@${DOMAIN}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(b.check_in)}`,
      `DTEND;VALUE=DATE:${toIcsDate(b.check_out)}`, // exclusive
      `SUMMARY:${escapeText('Reservado')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    )
  }

  for (const blk of blocks) {
    const label =
      blk.reason === 'owner'
        ? 'Indisponível (proprietário)'
        : blk.reason === 'maintenance'
        ? 'Indisponível (manutenção)'
        : 'Indisponível'
    lines.push(
      'BEGIN:VEVENT',
      `UID:block-${blk.id}@${DOMAIN}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(blk.start_date)}`,
      `DTEND;VALUE=DATE:${toIcsDate(blk.end_date)}`, // exclusive
      `SUMMARY:${escapeText(blk.summary || label)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

// Backfills an unguessable token on every property missing one. Idempotent.
async function ensureIcalTokens(prisma) {
  const missing = await prisma.properties.findMany({
    where: { ical_token: null },
    select: { id: true },
  })
  for (const p of missing) {
    await prisma.properties.update({
      where: { id: p.id },
      data: { ical_token: generateToken() },
    })
  }
  if (missing.length) {
    console.log(`[iCal] generated export tokens for ${missing.length} property(ies)`)
  }
}

// ─── IMPORT ─────────────────────────────────────────────────────────────────

// Pulls every active external feed and reconciles `external` blocks:
//  - upsert by external_uid (idempotent — re-import never duplicates)
//  - events that vanished from a successfully-fetched feed are deleted (cancellations)
//  - a feed that fails to load is logged and SKIPPED — its existing blocks are kept
//    (we never free dates on a transient network error)
// Manual blocks (source='manual') are never touched.
async function runIcalImport(prisma) {
  const feeds = await prisma.property_ical_feeds.findMany({ where: { active: true } })
  if (!feeds.length) {
    console.log('[iCal import] no active feeds configured')
    return { feeds: 0 }
  }

  let ok = 0
  let failed = 0

  for (const feed of feeds) {
    try {
      const data = await ical.async.fromURL(feed.url)
      const seen = []

      for (const ev of Object.values(data)) {
        if (!ev || ev.type !== 'VEVENT' || !ev.start || !ev.end) continue
        if (ev.status === 'CANCELLED') continue

        const uid =
          ev.uid ||
          crypto
            .createHash('sha1')
            .update(`${feed.id}-${ev.start}-${ev.end}`)
            .digest('hex')
        const externalUid = `${feed.source}:${uid}`.slice(0, 255)
        seen.push(externalUid)

        const start = toDateOnly(ev.start)
        const end = toDateOnly(ev.end)
        const summary = ev.summary ? String(ev.summary).slice(0, 255) : null

        await prisma.property_blocks.upsert({
          where: { external_uid: externalUid },
          create: {
            property_id: feed.property_id,
            start_date: start,
            end_date: end,
            reason: 'external',
            source: feed.source,
            external_uid: externalUid,
            summary,
          },
          update: {
            property_id: feed.property_id,
            start_date: start,
            end_date: end,
            summary,
          },
        })
      }

      // Cancellations: drop external blocks for this feed that are no longer present.
      // (Empty feed → seen=[] → every external block for this source is freed.)
      await prisma.property_blocks.deleteMany({
        where: {
          property_id: feed.property_id,
          source: feed.source,
          reason: 'external',
          external_uid: { notIn: seen.length ? seen : ['__none__'] },
        },
      })

      await prisma.property_ical_feeds.update({
        where: { id: feed.id },
        data: { last_synced_at: new Date(), last_error: null },
      })
      ok++
      console.log(
        `[iCal import] feed #${feed.id} (${feed.source}, property ${feed.property_id}): ${seen.length} event(s)`
      )
    } catch (err) {
      failed++
      console.error(`[iCal import] feed #${feed.id} failed: ${err.message}`)
      try {
        await prisma.property_ical_feeds.update({
          where: { id: feed.id },
          data: { last_error: String(err.message).slice(0, 1000) },
        })
      } catch (_) {
        /* best-effort */
      }
    }
  }

  return { feeds: feeds.length, ok, failed }
}

// ─── SCHEDULER ────────────────────────────────────────────────────────────────

let importRunning = false

function startIcalScheduler(prisma) {
  const minutes = parseInt(process.env.ICAL_SYNC_INTERVAL_MIN || '45', 10)
  const intervalMs = Math.max(5, minutes) * 60 * 1000

  const tick = async () => {
    if (importRunning) return // guard against overlapping runs
    importRunning = true
    try {
      await runIcalImport(prisma)
    } catch (e) {
      console.error('[iCal scheduler] unexpected error:', e.message)
    } finally {
      importRunning = false
    }
  }

  setTimeout(tick, 15000) // first run ~15s after boot
  setInterval(tick, intervalMs)
  console.log(`[iCal scheduler] importing external feeds every ${minutes} min`)
}

module.exports = {
  buildIcsFeed,
  safeEqual,
  generateToken,
  ensureIcalTokens,
  runIcalImport,
  startIcalScheduler,
}
