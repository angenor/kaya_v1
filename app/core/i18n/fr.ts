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
    leProduit: "Le produit",
    lesInstruments: "Les instruments",
    construit: "Construit",
    pasCommence: "Pas commencé",
    decompte: "{construits} écran(s) construit(s) sur {total}. Les instruments de développement ne comptent pas.",
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
      deloria: "Résidence Hôtel Deloria",
      deloriaDetail: "Abengourou · 17 chambres",
      residenceTest: "Résidence Test",
      residenceTestDetail: "Abengourou · 4 logements",
      aucunSejour: "Aucun séjour en cours. Les arrivées du jour apparaîtront ici.",
      commencerUnPassage: "Commencer un passage",
      aucunResultat: "Aucun résultat pour cette recherche. Essayez sur toute l'année.",
      toutes: "Toutes",
      impayees: "Impayées",
      tauxOccupation: "Taux d'occupation",
      nomDuClient: "Nom du client",
      nomDuClientAide: "Tel qu'il figure sur la pièce",
      identifiantRefuse: "Cet identifiant ne peut pas être utilisé.",
      typeDeChambre: "Type de chambre",
      standard: "Standard",
      classique: "Classique",
      superieure: "Supérieure",
      numeroDeChambre: "Numéro de chambre",
      zone: "Zone de mouvement",
      charme: "Charme",
      vitesse: "Vitesse",
    },
  },
  scenarios: {
    titre: "Scénarios",
    accroche: "Scénarios",
    intro: "Placer l'application dans les conditions difficiles — réseau lent, réseau absent, données vides — sans recompiler. Ces réglages vivent sur cet appareil et survivent au rechargement.",
    latence: "Latence du réseau",
    latenceAide: "En millisecondes. Au-delà du seuil, le témoin passe à « Connexion faible ».",
    echecReseau: "Échec réseau",
    horsLigne: "Hors connexion",
    jeuVide: "Jeu vide",
    compteActif: "Compte actif",
    etablissementActif: "Établissement actif",
    actif: "Actif",
    inactif: "Inactif",
    essaiEcriture: "Essai d'écriture",
    essaiEcritureAide: "Produit une écriture et la donne à la file. Sans lui, rien dans ce cycle n'exercerait le refus.",
    classe: "Type d'opération",
    lancer: "Lancer l'essai",
    remettre: "Tout remettre",
    fileTitre: "En attente d'envoi",
    fileVide: "Aucune écriture en attente. Les écritures produites ici apparaîtront dans cette liste.",
    capacites: "Ce que cet appareil ne sait pas faire",
    capacitesAucune: "Cet appareil sait tout faire de ce que le produit demande.",
  },
  file: {
    refusHorsLigne: "Cette action nécessite internet.",
    refusHorsLigneAlternative: "Enregistrez-la au retour du réseau : rien de ce que vous avez saisi n’est perdu.",
    acceptee: "Enregistré sur cet appareil.",
  },
  capacites: {
    impression: {
      motif: "Impression thermique",
      alternative: "cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception",
    },
    tiroir: {
      motif: "Ouverture du tiroir-caisse",
      alternative: "Le tiroir s'ouvre depuis l'imprimante de la réception.",
    },
    scan: {
      motif: "Lecture de code",
      alternative: "Saisissez le code à la main.",
    },
    camera: {
      motif: "Appareil photo",
      alternative: "Prenez la photo avec le téléphone et transférez-la.",
    },
    ocr: {
      motif: "Lecture automatique d'une pièce",
      alternative: "Saisissez les informations à la main.",
    },
    stockageSecurise: {
      motif: "Stockage protégé",
      alternative: "Cet appareil devra se reconnecter plus souvent.",
    },
    stockageDurable: {
      motif: "Stockage durable",
      alternative: "Cet appareil peut être amené à se reconnecter.",
    },
    notifications: {
      motif: "Alertes",
      alternative: "Sans installation, cet appareil ne recevra pas les alertes. Installez l'application depuis le menu de partage.",
    },
    geolocalisation: {
      motif: "Position",
      alternative: "Le gérant sera prévenu autrement.",
    },
    etatReseau: {
      motif: "Mesure de la connexion",
      alternative: "Cet appareil sait dire s'il a du réseau, pas à quelle vitesse il répond.",
    },
    fichiers: {
      motif: "Enregistrement de fichier",
      alternative: "Le document part par courriel.",
    },
    attestation: {
      motif: "Vérification de l'appareil",
      alternative: "Il n'y a pas d'alternative sur le web, et c'est assumé : la sécurité repose sur le serveur, jamais sur une promesse de cet appareil.",
    },
  },
  essai: {
    noteInterne: "Note interne",
    encaissement: "Encaissement",
    reglage: "Réglage d'établissement",
    impots: "Envoi aux impôts",
  },
} as const
