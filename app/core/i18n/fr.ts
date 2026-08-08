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

  // ── R0 · la connexion ──────────────────────────────────────────────────────
  // ⚠️ LES PHRASES SONT CELLES DU LEXIQUE, MOT POUR MOT. Deux entrées y portent
  // la mention « une seule phrase » : `identifiants_invalides` et
  // `identifiant_absent`. La première ne se scinde pas sans rouvrir FR-003 — la
  // préciser (« ce compte n'existe pas », « compte désactivé ») rendrait la
  // liste des comptes lisible par qui essaie des numéros.
  //
  // ⚠️ ET LE MOT « SESSION » N'APPARAÎT NULLE PART ICI (FR-011). Ce que
  // l'utilisateur lit dit ce qui se passera sur SON appareil, pas ce qu'un jeton
  // devient.
  connexion: {
    titre: 'Entrer',
    intro: "Entrez l'identifiant que votre gérant vous a donné.",
    identifiant: 'Identifiant',
    identifiantAide: 'Votre numéro de téléphone ou votre adresse e-mail.',
    motDePasse: 'Mot de passe',
    entrer: 'Entrer',
    entrerEnCours: 'Vérification…',
    identifiantsInvalides: 'Identifiant ou mot de passe incorrect',
    identifiantAbsent: 'Indiquez un numéro de téléphone ou une adresse e-mail.',
    // ⚠️ RÉEMPLOI EXACT DE LA FORMULATION DU LEXIQUE pour un refus de classe C.
    // Inventer une variante propre à cet écran ferait deux phrases pour un même
    // fait, et l'exploitant apprendrait deux fois la même chose. Le versant
    // positif, lui, est propre à R0 : on ne « met pas en file » une entrée.
    horsLigne: 'Cette action nécessite internet.',
    horsLigneAlternative:
      "Vous entrerez dès que le réseau revient. Ce qui est déjà enregistré sur cet appareil n'est pas perdu.",
    echecReseau: "Ça n'est pas parti. Recommencez quand le réseau revient.",
    // FR-006 et FR-007 : les deux annonces, avant toute saisie.
    resteraConnecte: 'Vous resterez connectée sur cet appareil.',
    peutRedemander: 'Cet appareil peut vous redemander votre identifiant.',
    peutRedemanderAlternative:
      'Vous pourrez toujours entrer à nouveau : rien de ce que vous avez enregistré ne se perd.',
  },

  // ── L'en-tête de contexte ──────────────────────────────────────────────────
  // ⚠️ « PASSER LA MAIN », JAMAIS « SE DÉCONNECTER » — sur un terminal partagé,
  // l'appareil ne bouge pas, c'est la personne qui change (lexique 1.3.0).
  contexte: {
    tousLesSites: 'Mes {n} établissements',
    vueDEnsemble: "Vue d'ensemble",
    passerLaMain: 'Passer la main',
    passerLaMainEffet: 'La personne suivante devra entrer son identifiant.',
    passerLaMainRefus:
      "Des enregistrements ne sont pas encore partis. Attendez le retour du réseau avant de passer la main.",
  },

  // ── R1 · l'accueil ─────────────────────────────────────────────────────────
  // ⚠️ LES TITRES DE RUBRIQUE SONT CEUX DES QUATRE MAQUETTES. Ils ne se
  // choisissent pas par variante : c'est la SURFACE retenue qui décide lequel
  // s'affiche, et il n'y a donc qu'un catalogue.
  accueil: {
    titre: "L'accueil",
    tete: {
      aFaireMaintenant: 'À faire maintenant',
      votreService: 'Votre service',
      laSeuleChose: 'La seule chose qui vous attend',
    },
    suite: {
      titre: "Ensuite, dans l'ordre de l'heure",
      vosTables: 'Vos tables',
      vosEtablissements: 'Vos établissements, aujourd’hui',
    },
    aRegler: { titre: 'À régler' },
    activites: { titre: 'Vos activités' },
    // ⚠️ LES DEUX SENS SE DISENT, ET LE BOUTON NOMME CE QU'IL VA FAIRE — jamais
    // ce qu'il montre. « Vos activités » replié, le bouton dit « Afficher ».
    // ⚠️ CE QUE LA BULLE COMPTE, DIT À VOIX HAUTE. Le nombre seul ne se lit
    // pas : « 3 » sur un lecteur d'écran n'apprend rien.
    activitesASignaler: '{n} à régler dans vos activités',
    activitesReduire: 'Réduire',
    activitesAfficher: 'Afficher',
    chiffres: { titre: "Aujourd'hui", votreService: 'Votre service' },
    // Les six états de la pastille, dits dans les mots de l'exploitant — jamais
    // le nom interne de l'état (SC-022).
    etat: {
      aJour: 'À jour',
      enCours: 'En cours',
      libre: 'Libre',
      aRegler: 'À régler',
      sansReseau: 'Sans réseau',
      enAttente: 'En attente',
    },
    action: {
      encaisserDepart: 'Encaisser le départ',
      voirDeparts: 'Voir les départs du jour',
      ajouterCommande: 'Ajouter une commande',
      ouvrirTable: 'Ouvrir une table',
      voirArdoises: 'Voir les ardoises',
      demanderExplication: "Demander l'explication",
      voirCaisse: "Voir la caisse d'hier",
      transmettre: 'Transmettre',
      verifier: 'Vérifier',
      commander: 'Commander',
      noterCommande: 'Noter la commande',
      voir: 'Voir',
      preparer: 'Préparer',
    },
    chiffre: {
      recetteDepuisOuverture: "Recette depuis l'ouverture",
      chambresOccupees: 'Chambres occupées',
      resteAEncaisser: 'Reste à encaisser',
      encaisseCeSoir: 'Encaissé ce soir',
      ardoisesEnCours: 'Ardoises en cours',
      platLePlusVendu: 'Plat le plus vendu',
      vosTablesOuvertes: 'Vos tables ouvertes',
      totalDeVosTables: 'Total de vos tables',
      commandesServies: 'Commandes servies',
    },
    // ⚠️ CE QUI MANQUE EST DE NOTRE CÔTÉ, ET LE DIRE EST HONNÊTE. La surface
    // garde l'apparence exacte d'une surface aboutie ; c'est l'appui qui parle.
    // ⚠️ LES TROIS NOTES DE PIED DISENT LA **PORTÉE** DE CE QU'ON VIENT DE LIRE.
    // Elles expliquent une ABSENCE que l'écran ne peut pas montrer : sans elles,
    // une serveuse croirait l'application incomplète plutôt que restreinte.
    note: {
      uneSeuleActivite: 'Une seule activité : tout ce qui s’affiche ici concerne la salle.',
      chiffresAJour: 'Les chiffres se remettent à jour tout seuls, sans recharger la page.',
      vosTablesSeulement:
        'Vous ne voyez que vos tables. La caisse et les chiffres de l’hôtel ne vous sont pas demandés.',
      lectureSeule:
        'Vous ne pouvez rien saisir depuis cet écran : aucune de vos actions ne modifie une caisse.',
    },
    aVenir: '« {ecran} » n’est pas encore construit.',
    aVenirCycle: 'Cet écran arrive au cycle {cycle}.',
    horsLigne: "Cet appareil n'a pas de réseau.",
    horsLigneAlternative:
      "Ce qui est déjà à l'écran reste utilisable, et vos saisies partiront au retour du réseau.",
    erreur: "Cette partie de l'écran n'a pas pu être chargée.",
    erreurAlternative: "Le reste de l'écran est à jour. Rien n'est perdu.",
    reessayer: 'Réessayer',
    // ⚠️ CE QUI MANQUE EST UN **RATTACHEMENT**, ET LA PHRASE LE DIT (FR-024).
    // « Aucune donnée » ferait croire à une panne ; « Erreur » à un défaut. Le
    // compte de l'administrateur éditeur n'est rattaché à aucun établissement,
    // et c'est un cas prévu du modèle, pas un accident.
    sansEtablissement:
      'Aucun établissement ne vous est rattaché. Demandez à votre gérant de vous en donner un : vous verrez alors ici ce qui vous attend.',
    teteVide: 'Rien ne vous attend pour le moment. Ce qui arrive s’affichera ici.',
    suiteVide: 'Rien de prévu pour la suite. Les arrivées et les tables ouvertes apparaîtront ici.',
    aReglerVide: 'Rien à régler. Tout est transmis et la caisse est juste.',
    chiffresVide: "Aucun chiffre pour l'instant. Ils se rempliront dès la première vente.",
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
    lesActions: "Les actions",
    actionsHorsLigne: "Cet appareil n'a pas de réseau.",
    actionsHorsLigneAlternative: "Ce qui est déjà à l'écran reste utilisable, et vos saisies partiront au retour du réseau.",
    actionsErreur: "La liste des actions n'a pas pu être chargée.",
    actionsErreurAlternative: "Rien n'est perdu : l'écran se remplira au prochain essai.",
    reessayer: "Réessayer",
    actionsVide: "Aucune action ici pour ce compte. Choisissez un autre compte ou un autre établissement.",
    actionsVideAction: "Ouvrir les scénarios",
    capaciteAbsente: "Une action de cet écran demande quelque chose que cet appareil ne sait pas faire.",
  },
  // ── Les gestes, dans les mots de l'exploitant ──────────────────────────────
  // ⚠️ JAMAIS LE LIBELLÉ DE LA TABLE. « Arrêter la note et enregistrer le
  // départ » est la définition du droit ; « Encaisser le départ » est le geste.
  actions: {
    passageOuvrir: "Commencer un passage",
    arrivee: "Enregistrer une arrivée",
    depart: "Encaisser le départ",
    encaisser: "Encaisser",
    cloture: "Clôturer la caisse",
    commandePrendre: "Prendre une commande",
    commandeRemise: "Appliquer une remise",
    pilotage: "Consulter les chiffres",
    etablissement: "Régler l'établissement",
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
    // ⚠️ ABSENT, JAMAIS UNE LISTE VIDE : ce compte n'a aucun site à proposer, et
    // le panneau le dit plutôt que d'ouvrir un choix sur rien.
    aucunEtablissement: "Ce compte n'est rattaché à aucun établissement.",
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
    coquille: "La coquille",
    coquilleAide: "Une version nouvelle n'arrive qu'après un déploiement, et la voie d'installation vient du moteur. Le premier se simule ; la seconde se LIT — la simuler laisserait croire qu'on a vérifié WebKit depuis Chromium.",
    versionNouvelle: "Une version nouvelle attend",
    voieInstallation: "Voie d'installation de cet appareil",
    voieInvite: "Le moteur propose son invitation.",
    voieMenuDePartage: "Aucune invitation ne se déclenchera : l'installation passe par le menu de partage.",
    voieDejaInstallee: "Déjà installée sur cet appareil.",
    voieImpossible: "Ce moteur n'installe pas d'application web.",
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
  // ── La coquille : version nouvelle et installation ─────────────────────────
  // ⚠️ UNE PHRASE AU PASSÉ qui dit ce qui s'est produit, puis ce qui reste à
  // faire. C'est la structure du composant 07, et elle n'est pas décorative.
  coquille: {
    versionNouvelle: "Une version nouvelle est prête.",
    versionNouvelleAide:
      "Rechargez quand vous voulez : rien de ce que vous avez saisi n’est perdu.",
    recharger: "Recharger",
    installable: "Cette application peut être installée sur cet appareil.",
    installableAide:
      "Installée, elle s’ouvre même sans réseau, sans barre d’adresse — et elle reçoit les alertes.",
    installer: "Installer l’application",
    installationManuelle: "Cet appareil n’affichera aucune invitation d’installation.",
    installationManuelleAide:
      "Ouvrez le menu de partage, puis « Sur l’écran d’accueil ». Sans installation, cet appareil ne recevra pas les alertes.",
    compris: "J’ai compris",
  },
  essai: {
    noteInterne: "Note interne",
    encaissement: "Encaissement",
    reglage: "Réglage d'établissement",
    impots: "Envoi aux impôts",
  },
} as const
