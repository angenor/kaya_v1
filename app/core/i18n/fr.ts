/**
 * CATALOGUE FRANÇAIS — la langue par défaut.
 *
 * ⚠️ LE LEXIQUE PRIME SUR CE FICHIER. `docs/design/lexique.md` fait foi sur tout
 * mot visible par l'utilisateur ; un écart se corrige ICI, jamais là-bas. Le
 * lexique documente d'ailleurs que ce fichier avait déjà dérivé une fois, sur
 * les trois libellés du témoin de synchronisation.
 *
 * ⚠️ LES TROIS NOMS D'ÉTAT INTERNES — « connecté », « dégradé », « hors ligne » —
 * N'APPARAISSENT DANS AUCUN CATALOGUE. Ce sont des noms de mécanique. Ce que
 * l'utilisateur lit dit si SON TRAVAIL est en sécurité : « Enregistré »,
 * « En attente d'envoi (n) », « Connexion faible », « Hors connexion ».
 * SC-022 le vérifie par un test.
 *
 * ⚠️ PARITÉ STRICTE AVEC `en.ts`, DANS LES DEUX SENS, DÈS LA PREMIÈRE CLÉ.
 */
export default {
  application: {
    nom: 'Kaya',
  },

  // ── Les réglages de la coquille ────────────────────────────────────────────
  // Ils appartiennent à l'APPAREIL, pas à l'établissement : c'est pourquoi ils
  // vivent dans la barre d'en-tête et non dans la configuration.
  theme: {
    etiquette: 'Thème',
    clair: 'Clair',
    sombre: 'Sombre',
    systeme: "Comme l'appareil",
  },
  langue: {
    etiquette: 'Langue',
    fr: 'Français',
    en: 'English',
  },

  // ── Le témoin de synchronisation · composant 10 ────────────────────────────
  // Libellés repris MOT POUR MOT du lexique, qui fait foi.
  temoin: {
    enregistre: 'Enregistré',
    enAttenteEnvoi: "En attente d'envoi ({n})",
    connexionFaible: 'Connexion faible',
    horsConnexion: 'Hors connexion',
  },

  // ── Les instruments de développement ───────────────────────────────────────
  // Ce ne sont pas des écrans du produit : ils ne portent pas de code de
  // préfixe et n'entrent pas au décompte des 46.
  ecrans: {
    titre: 'Écrans',
  },
  guideDeStyle: {
    titre: 'Guide de style',
    sommaire: 'Sommaire',
    // Les seize sections. Le décompte fait foi : c'est celui des sections
    // numérotées de docs/design/composants.md, jamais un nombre écrit ailleurs.
    composant: {
      '01': 'Bouton principal',
      '02': 'Bouton secondaire',
      '03': 'Bouton discret',
      '04': "Pastille d'état",
      '05': "Tuile d'action",
      '06': 'Carte chiffre',
      '07': "Bandeau d'alerte",
      '08': 'Ligne de liste',
      '09': "Sélecteur d'établissement",
      '10': 'Témoin de synchronisation',
      '11': 'État vide illustré',
      '12': 'Sélecteur segmenté',
      '13': 'Squelette de chargement',
      '14': "Bandeau d'annulation",
      '15': 'Barre de proportion',
      '16': 'Champ de saisie',
    },
    // Les libellés de démonstration. Ils ne décrivent aucune donnée réelle :
    // ce sont des exemples, et ils le disent.
    demo: {
      encaisserLeDepart: 'Encaisser le départ',
      envoiEnCours: 'Envoi…',
      annuler: 'Annuler',
      plusTard: 'Plus tard',
      voirLeDetail: 'Voir le détail',
      supprimer: 'Supprimer',
      filtrer: 'Filtrer',
      paye: 'Payé',
      partiel: 'Partiel',
      libre: 'Libre',
      impaye: 'Impayé',
      horsService: 'Hors service',
      envoiEnAttente: "En attente d'envoi",
      chambre: 'Chambre {n}',
      client: 'M. Traoré',
      troisNuits: '3 nuits · départ à 11 h 00',
      total: 'Total',
      etats: 'États',
      variantes: 'Variantes',
      passage: "Le passage",
      arrivee: "Arrivée",
      encaissement: "Encaissement",
      recetteDuJour: "Recette du jour",
      chambresLibres: "Chambres libres",
      deuxArrivees: "2 arrivées attendues",
      roleServeuse: "Rôle serveuse",
      noteArretee: "La note est arrêtée : plus rien ne peut s'y ajouter",
      consommationSupprimee: "Consommation supprimée",
      envoiReussi: "Les impôts ont validé cette facture",
      connexionPerdue: "Cette saisie a été refusée",
      reessayer: "Réessayer",
      retablir: "Rétablir",
      saisirAuComptoir: "Saisissez au comptoir : vous rattacherez à la table quand le réseau revient.",
    },
  },
  scenarios: {
    titre: 'Scénarios',
  },
} as const
