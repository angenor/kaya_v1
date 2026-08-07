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
      passage: "Short stay",
      arrivee: "Arrival",
      encaissement: "Payment",
      recetteDuJour: "Today's takings",
      chambresLibres: "Free rooms",
      deuxArrivees: "2 arrivals expected",
      roleServeuse: "Server role",
      noteArretee: "The bill is closed: nothing more can be added to it",
      consommationSupprimee: "Item deleted",
      envoiReussi: "The tax office validated this invoice",
      connexionPerdue: "This entry was refused",
      reessayer: "Try again",
      retablir: "Undo",
      saisirAuComptoir: "Take the order at the counter — you can move it to the table when the connection is back.",
      deloria: "Deloria Hotel Residence",
      deloriaDetail: "Abengourou · 17 rooms",
      residenceTest: "Test Residence",
      residenceTestDetail: "Abengourou · 4 units",
      aucunSejour: "No stay in progress. Today's arrivals will appear here.",
      commencerUnPassage: "Start a short stay",
      aucunResultat: "No result for this search. Try across the whole year.",
      toutes: "All",
      impayees: "Unpaid",
      tauxOccupation: "Occupancy rate",
      nomDuClient: "Guest name",
      nomDuClientAide: "As shown on the ID",
      identifiantRefuse: "This ID cannot be used.",
      typeDeChambre: "Room type",
      standard: "Standard",
      classique: "Classic",
      superieure: "Superior",
      numeroDeChambre: "Room number",
      zone: "Motion zone",
      charme: "Charm",
      vitesse: "Speed",
    },
  },
  scenarios: {
    titre: 'Scenarios',
  },
} as const
