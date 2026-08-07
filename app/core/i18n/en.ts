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
    sommaire: 'Contents',
    composant: {
      '01': 'Primary button',
      '02': 'Secondary button',
      '03': 'Quiet button',
      '04': 'Status pill',
      '05': 'Action tile',
      '06': 'Figure card',
      '07': 'Alert banner',
      '08': 'List row',
      '09': 'Establishment selector',
      '10': 'Sync indicator',
      '11': 'Illustrated empty state',
      '12': 'Segmented selector',
      '13': 'Loading skeleton',
      '14': 'Undo banner',
      '15': 'Proportion bar',
      '16': 'Input field',
    },
    demo: {
      encaisserLeDepart: 'Take payment',
      envoiEnCours: 'Sending…',
      annuler: 'Cancel',
      plusTard: 'Later',
      voirLeDetail: 'View details',
      supprimer: 'Delete',
      filtrer: 'Filter',
      paye: 'Paid',
      partiel: 'Partial',
      libre: 'Free',
      impaye: 'Unpaid',
      horsService: 'Out of service',
      envoiEnAttente: 'Pending send',
      chambre: 'Room {n}',
      client: 'Mr Traoré',
      troisNuits: '3 nights · departure at 11:00',
      total: 'Total',
      etats: 'States',
      variantes: 'Variants',
    },
  },
  scenarios: {
    titre: 'Scenarios',
  },
} as const
