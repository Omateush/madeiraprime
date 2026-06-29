// Seed 5 real Madeira Prime properties into the `properties` table.
// Always resets: deletes all existing rows then inserts fresh data.
// Re-run safely at any time: node prisma/seed.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const PROPERTIES = [
  // ── 1. Apartamento Funchal ────────────────────────────────────────────────
  {
    title:           'Apartamento Funchal',
    description:     'Modern apartment in the heart of Funchal, Madeira\'s vibrant capital. A private terrace frames city and sea views, two comfortable bedrooms sleep up to four guests, and the fully equipped kitchen means you can live like a local. Walking distance to the covered market, the waterfront promenade, and the best restaurants in the city.',
    location:        'Funchal',
    type:            'apartment',
    price_per_night: 120,
    guests_max:      4,
    bedrooms:        2,
    bathrooms:       1,
    images: [
      '/apartamento_funchal/outside.png',
      '/apartamento_funchal/livingroom.png',
      '/apartamento_funchal/terraço.png',
      '/apartamento_funchal/dinner.png',
      '/apartamento_funchal/kitchen.png',
      '/apartamento_funchal/quarto.png',
      '/apartamento_funchal/quarto2.png',
      '/apartamento_funchal/bathroom.png',
    ],
    amenities: ['WiFi', 'Private terrace', 'City views', 'Kitchen', 'Air conditioning', 'Smart TV'],
    status: 'available',
  },

  // ── 2. Azinhaga ───────────────────────────────────────────────────────────
  {
    title:           'Azinhaga',
    description:     'A secluded villa with a private swimming pool, nestled in the lush hillsides of Câmara de Lobos — the charming fishing village that once captivated Winston Churchill. Three spacious bedrooms, tropical gardens, and total privacy make this the perfect escape for families or groups seeking the real Madeira.',
    location:        'Câmara de Lobos',
    type:            'villa',
    price_per_night: 200,
    guests_max:      6,
    bedrooms:        3,
    bathrooms:       2,
    images: [
      '/azinhaga/house.jpeg',
      '/azinhaga/pool.jpeg',
      '/azinhaga/mainbedroom.jpeg',
      '/azinhaga/bed.jpeg',
      '/azinhaga/twin_bed.jpeg',
    ],
    amenities: ['WiFi', 'Private pool', 'Garden', 'BBQ', 'Kitchen', 'Parking'],
    status: 'available',
  },

  // ── 3. Cabouco ────────────────────────────────────────────────────────────
  {
    title:           'Cabouco',
    description:     'A spacious traditional Madeiran house sleeping up to eight guests, surrounded by terraced gardens and banana groves in Caniço. Three generous bedrooms, a fully equipped kitchen, and generous outdoor spaces on multiple levels make it ideal for family holidays. The famous Caniço de Baixo diving centre is minutes away.',
    location:        'Caniço',
    type:            'house',
    price_per_night: 150,
    guests_max:      8,
    bedrooms:        3,
    bathrooms:       2,
    images: [
      '/cabouco/mainhouse.jpeg',
      '/cabouco/outside.jpeg',
      '/cabouco/bedroom1.jpeg',
      '/cabouco/bedroom2.jpeg',
      '/cabouco/bedroom3.jpeg',
      '/cabouco/kitchen.jpeg',
      '/cabouco/bathroom.jpeg',
    ],
    amenities: ['WiFi', 'Garden', 'Kitchen', 'Parking', 'Air conditioning', 'Washer'],
    status: 'available',
  },

  // ── 4. Casa Alegria ───────────────────────────────────────────────────────
  {
    title:           'Casa Alegria',
    description:     'Joy is the right word for this beautiful hillside home near Santana\'s famous thatched palheiro houses. Two en-suite bedrooms, an outdoor jacuzzi with sweeping mountain and valley views, and a sun-drenched garden. Wake up to birdsong and cool mountain air — a world apart from the busy south coast.',
    location:        'Santana',
    type:            'house',
    price_per_night: 175,
    guests_max:      6,
    bedrooms:        2,
    bathrooms:       2,
    images: [
      '/casa_alegria/mainhouse.jpg',
      '/casa_alegria/viewOutside.jpg',
      '/casa_alegria/jacuzzi.jpg',
      '/casa_alegria/bedroom.jpg',
      '/casa_alegria/bedroom1.jpg',
      '/casa_alegria/kitchen.jpg',
      '/casa_alegria/bathroom.jpg',
    ],
    amenities: ['WiFi', 'Outdoor jacuzzi', 'Mountain views', 'Garden', 'Kitchen', 'Parking'],
    status: 'available',
  },

  // ── 5. Varino ─────────────────────────────────────────────────────────────
  {
    title:           'Varino',
    description:     'Named after the traditional Madeiran fishermen, this bright one-bedroom apartment sits above the harbour of Ribeira Brava with sweeping Atlantic views from every window. Perfect for a couple — tastefully decorated, a fully equipped kitchen, and the best fresh seafood restaurants on the south coast are a short stroll away.',
    location:        'Ribeira Brava',
    type:            'apartment',
    price_per_night: 90,
    guests_max:      3,
    bedrooms:        1,
    bathrooms:       1,
    images: [
      '/varino/outside.jpeg',
      '/varino/view.jpeg',
      '/varino/livingroom.jpeg',
      '/varino/kitchen.jpeg',
      '/varino/bedroom.jpeg',
    ],
    amenities: ['WiFi', 'Sea views', 'Kitchen', 'Terrace', 'Air conditioning'],
    status: 'available',
  },
]

async function main() {
  const deleted = await prisma.properties.deleteMany({})
  console.log(`Cleared ${deleted.count} existing properties.`)

  for (const data of PROPERTIES) {
    const p = await prisma.properties.create({ data })
    console.log(`  ✓ ${p.id}  ${p.title}  (${p.location})`)
  }

  console.log(`\nSeeded ${PROPERTIES.length} properties.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
