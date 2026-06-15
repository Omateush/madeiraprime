const BASE = '/assets/projects'

export function getImageUrl(projectId, phase, filename) {
  return `${BASE}/${projectId}/${phase}/${encodeURIComponent(filename)}`
}

export const PROJECTS = [
  {
    id: 'project_funchal',
    name: 'Apt. Funchal Centro',
    location: 'Funchal, Madeira',
    appreciation: '+68%',
    comparisons: [
      {
        title: 'Sala de Estar',
        before: `${BASE}/project_funchal/Sala_before.jpeg`,
        after: `${BASE}/project_funchal/Sala_after.jpeg`,
      },
      {
        title: 'Cozinha',
        before: `${BASE}/project_funchal/Cozinha_before.jpeg`,
        after: `${BASE}/project_funchal/Cozinha_after.jpeg`,
      },
      {
        title: 'Casa de Banho',
        before: `${BASE}/project_funchal/Banheiro_before.jpeg`,
        after: `${BASE}/project_funchal/Banheiro_after.jpeg`,
      },
      {
        title: 'Quarto Principal',
        before: `${BASE}/project_funchal/Quarto_before.jpeg`,
        after: `${BASE}/project_funchal/Quarto_after.jpeg`,
      },
      {
        title: 'Quarto 2',
        before: `${BASE}/project_funchal/Quarto2_before.jpeg`,
        after: `${BASE}/project_funchal/Quarto2_after.jpeg`,
      },
    ],
    images: {
      before: [
        'WhatsApp Image 2026-05-30 at 16.32.46.jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.47 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.47 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.47.jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.48 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.48 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.48 (3).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.48.jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.49 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.49.jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.50 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.50 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.50.jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.51 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.51 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.51 (3).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.51 (4).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.51 (5).jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.51.jpeg',
        'WhatsApp Image 2026-05-30 at 16.32.52.jpeg',
      ],
      after: [
        'WhatsApp Image 2026-05-30 at 16.34.12.jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.13 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.13.jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.14 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.14 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.14.jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.15 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.15 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.15.jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.16 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.16.jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17 (3).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17 (4).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17 (5).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17 (6).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.17.jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.18 (1).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.18 (2).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.18 (3).jpeg',
        'WhatsApp Image 2026-05-30 at 16.34.18.jpeg',
      ],
    },
  },
  // Add more projects here as their images are ready:
  // {
  //   id: 'project_canico',
  //   name: 'Vivenda Caniço',
  //   location: 'Caniço, Madeira',
  //   appreciation: '+XX%',
  //   images: { before: [], after: [] },
  // },
]
