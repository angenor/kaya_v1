/**
 * ENGLISH CATALOGUE — second language, at strict parity with `fr.ts`.
 *
 * ⚠️ THE LEXICON PREVAILS. `docs/design/lexique.md` carries the English wording
 * of every user-visible term; a divergence is fixed HERE, never there.
 *
 * ⚠️ THE THREE INTERNAL STATE NAMES — « connected », « degraded », « offline » —
 * APPEAR IN NO CATALOGUE. What the user reads says whether THEIR WORK is safe:
 * « Saved », « Pending send (n) », « Weak connection », « No connection ».
 */
export default {
  application: {
    nom: 'Kaya',
  },

  theme: {
    etiquette: 'Theme',
    clair: 'Light',
    sombre: 'Dark',
    systeme: 'Match device',
  },
  langue: {
    etiquette: 'Language',
    fr: 'Français',
    en: 'English',
  },

  temoin: {
    enregistre: 'Saved',
    enAttenteEnvoi: 'Pending send ({n})',
    connexionFaible: 'Weak connection',
    horsConnexion: 'No connection',
  },

  ecrans: {
    titre: 'Screens',
  },
  guideDeStyle: {
    titre: 'Style guide',
  },
  scenarios: {
    titre: 'Scenarios',
  },
} as const
