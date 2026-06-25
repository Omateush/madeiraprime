// Seed 6 Madeira Island properties into the `properties` table.
// Safe to re-run — skips insert if the table already has rows.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const PROPERTIES = [
  {
    title:           'Ocean Vista Suite',
    description:     'A bright, modern apartment perched above Funchal Bay, with floor-to-ceiling windows framing panoramic Atlantic views. Fully equipped kitchen, air conditioning in every room, and a private terrace perfect for sundowners.',
    location:        'Funchal',
    type:            'apartment',
    price_per_night: 150,
    guests_max:      4,
    bedrooms:        2,
    bathrooms:       1,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['WiFi', 'Sea views', 'Air conditioning', 'Kitchen', 'Smart TV', 'Private terrace'],
  },
  {
    title:           'Levada Garden House',
    description:     'A charming stone cottage nestled beside the famous Levada do Caniço trail. Wake up to birdsong, explore the island on foot from your doorstep, and unwind in a lush private garden shaded by banana and bougainvillea.',
    location:        'Caniço',
    type:            'house',
    price_per_night: 120,
    guests_max:      6,
    bedrooms:        3,
    bathrooms:       2,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['WiFi', 'Private garden', 'Kitchen', 'BBQ', 'Parking', 'Washer'],
  },
  {
    title:           'Monte Palace Villa',
    description:     'Elegant five-star living in the historic Monte district, minutes from the famous Monte Palace Tropical Garden. This villa features a heated private pool, a grand terrace overlooking Funchal, and a fully staffed option available on request.',
    location:        'Monte',
    type:            'villa',
    price_per_night: 280,
    guests_max:      8,
    bedrooms:        4,
    bathrooms:       3,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['WiFi', 'Private pool', 'Sea views', 'Garden', 'Air conditioning', 'BBQ', 'Kitchen', 'Parking'],
  },
  {
    title:           'Atlantic Studio',
    description:     'A sleek, minimalist studio carved into the clifftop of Câmara de Lobos — the very village that inspired Winston Churchill to paint. Just steps from the harbour and the freshest espada restaurants in Madeira.',
    location:        'Câmara de Lobos',
    type:            'studio',
    price_per_night: 85,
    guests_max:      2,
    bedrooms:        1,
    bathrooms:       1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['WiFi', 'Sea views', 'Air conditioning', 'Kitchen', 'Smart TV'],
  },
  {
    title:           'Ribeira Brava Townhouse',
    description:     'A lovingly restored 19th-century townhouse in the lively centre of Ribeira Brava, a 20-minute drive along the southern coast from Funchal. Original azulejo tiles throughout, a rooftop sun terrace, and local fish market at your doorstep.',
    location:        'Ribeira Brava',
    type:            'house',
    price_per_night: 110,
    guests_max:      5,
    bedrooms:        3,
    bathrooms:       2,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['WiFi', 'Rooftop terrace', 'Kitchen', 'Air conditioning', 'Washer', 'Smart TV'],
  },
  {
    title:           'Santana Thatched Chalet',
    description:     "Madeira's most iconic architecture — a traditional A-frame palheiro with a thick thatched roof, set among apple orchards in the lush north of the island. Ideal for couples and families seeking peace, cool mountain air, and unspoilt countryside.",
    location:        'Santana',
    type:            'house',
    price_per_night: 135,
    guests_max:      4,
    bedrooms:        2,
    bathrooms:       1,
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['WiFi', 'Mountain views', 'Garden', 'Kitchen', 'Fireplace', 'Parking'],
  },
]

async function main() {
  const count = await prisma.properties.count()
  if (count > 0) {
    console.log(`Seed skipped — ${count} properties already in the database.`)
    return
  }

  for (const data of PROPERTIES) {
    const p = await prisma.properties.create({ data })
    console.log(`  ✓ Created: ${p.title} (id ${p.id})`)
  }

  console.log(`\nSeeded ${PROPERTIES.length} properties successfully.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
