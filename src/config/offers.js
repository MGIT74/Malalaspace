/**
 * Catalogue des offres. Le prix est affiché à titre indicatif pour l'instant
 * (aucune facturation réelle tant que Stripe n'est pas branché — Phase 3).
 */
const OFFERS = [
  {
    id: 'STANDARD',
    name: 'Offre Standard',
    price: 420000,
    currency: 'MGA', // Ariary
    deliveryEstimate: '10 - 15 jours',
    features: [
      'Analyse du produit SaaS',
      'Compréhension de la cible',
      'Direction artistique (définition du style visuel)',
      'Adaptation / rédaction du script',
      'Structure de la vidéo : Hook → Problème → Solution → CTA',
      'Accroche travaillée',
      'Animation 2D professionnelle (mouvement fluide & caméra 3D)',
      "Design et animation UI/UX (reproduction des interfaces SaaS)",
      'Motion design (animation 2D fluide)',
      'Voix-off (FR — synchronisation voix-off)',
      'Sound design (synchronisation audio/motion & effets sonores UI)',
      'Livrable : vidéo 16:9 — 1920×1080',
      'Durée finale : 60 sec',
      '3 séries de corrections',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Offre Premium',
    price: 920000,
    currency: 'MGA',
    deliveryEstimate: '12 - 18 jours',
    features: [
      'Conception stratégique (analyse approfondie du produit SaaS)',
      'Direction artistique complète (définition du style visuel)',
      'Script & storytelling (rédaction du script & storyboard détaillé)',
      'Structure de la vidéo : Hook → Problème → Solution → Fonctionnalités → CTA',
      'Reconstruction complète des interfaces SaaS',
      'Animation 2D avancée (caméra 3D & transitions complexes)',
      'UI/UX motion avancée (navigation simulée — animation des données)',
      'Voix-off pro (FR réaliste — synchronisation voix-off — mixage avancé)',
      "Intégration d'une musique adaptée",
      'Sound design avancé (effets UI & synchronisation aux mouvements)',
      'Compositing & post-production',
      'Livrable : vidéo 16:9 — 1920×1080 & 4K',
      'Format 9:16 — Reels / TikTok / Shorts (15 - 30 sec)',
      '5 séries de corrections',
      'Fichiers sources After Effects',
      'Durée finale : 60 sec ou +',
    ],
  },
];

function getOffer(id) {
  return OFFERS.find((o) => o.id === id) || null;
}

module.exports = { OFFERS, getOffer };
