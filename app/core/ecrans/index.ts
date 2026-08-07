/**
 * L'INDEX DES ÉCRANS — **LA SOURCE UNIQUE** que la page rend ET que la porte
 * P-04 lit.
 *
 * ⚠️ UNE SEULE LISTE, POUR QU'IL N'Y EN AIT PAS DEUX. Si la page avait sa liste
 * et la porte la sienne, elles divergeraient au troisième cycle — et c'est la
 * porte qui aurait tort, en silence.
 *
 * ⚠️ LE DÉCOMPTE DES 46 EST REPRIS DE `docs/design/derivation.md` SANS ÊTRE
 * REJUGÉ : onze maquettés, trente-deux dérivés, trois composés. Ce cycle ne
 * décide pas ce qu'est un écran du produit ; il l'affiche.
 *
 * ⚠️ DEUX DES TROIS COMPOSÉS N'ONT PAS DE CODE — « Notes internes » et « Les
 * articles » sont nommés par leur route. La colonne porte donc **le code quand
 * il existe, la route sinon** : une colonne « code » obligatoire pour tous
 * serait fausse dès la première ligne.
 */

/** Où en est un écran. Seul `CONSTRUIT` est exigible par la porte P-04. */
export type Avancement = 'CONSTRUIT' | 'PAS_COMMENCE'

export type CasDeReference = 'maquette' | 'derive' | 'compose' | 'instrument' | 'decouvert'

export interface EntreeEcran {
  /** Le code du préfixe, quand l'écran en a un. `null` sinon. */
  readonly code: string | null
  /** Le titre, en clé i18n pour les instruments, en clair pour le produit. */
  readonly titre: string
  /** La route, quand elle est décidée. `null` tant qu'elle ne l'est pas. */
  readonly route: string | null
  readonly cas: CasDeReference
  readonly avancement: Avancement
  /** D'où l'écran tient sa référence visuelle — maquette, motif, ou rien. */
  readonly reference: string
  /**
   * LE CYCLE QUI CONSTRUIRA CET ÉCRAN. `null` dès qu'il est construit, et sur
   * les instruments — qui ne sont pas du produit.
   *
   * ⚠️ IL VIT ICI, ET NULLE PART AILLEURS. Quand `R1` touche une surface dont
   * l'écran n'existe pas encore, il dit **l'écran et le cycle** — et il les lit
   * à l'index. Écrits dans la surface, ils seraient recopiés onze fois, et la
   * onzième serait fausse. Passer un écran à `CONSTRUIT` ici suffit à faire
   * disparaître la mention : `R1` n'est pas retouché.
   *
   * ⚠️ ET CE N'EST PAS UN CODE D'ÉCRAN, MALGRÉ L'HOMONYMIE. Quatre écrans du
   * produit portent les codes `F1` à `F4` — la file de certification, le
   * registre fiscal, l'avoir, l'état de reversement — pendant que les sept
   * cycles de la phase 2 s'appellent eux aussi `F1` à `F7`. La colonne `code`
   * dit l'écran, celle-ci dit **quand**. Les confondre ferait annoncer « cycle
   * F2 » pour un registre fiscal.
   *
   * L'affectation vient des prompts de cycle de `docs/Kaya_Prompts_SpecKit.md`
   * §3, par domaine : F3 réception · F4 points de vente et mobile · F5 caisse ·
   * F6 fiscalité et moments difficiles · F7 direction, configuration,
   * réservations, console.
   */
  readonly cycle: string | null
}

/**
 * LES 46 ÉCRANS DU PRODUIT.
 * Onze maquettés · trente-deux dérivés · trois composés.
 */
export const ECRANS_PRODUIT: readonly EntreeEcran[] = [
  // ── Les onze maquettés ───────────────────────────────────────────────────
  { code: 'R1', titre: "L'accueil", route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F2', reference: 'docs/design/html/R1-accueil.html' },
  { code: 'R4', titre: 'Le passage', route: '/passage', cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'docs/design/html/R4-passage.html' },
  { code: 'R7', titre: 'La note et le départ', route: '/depart', cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'docs/design/html/R7-note-depart.html' },
  { code: 'C4', titre: 'La clôture de caisse', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F5', reference: 'docs/design/html/C4-cloture.html' },
  { code: 'F2', titre: 'Le registre fiscal', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: 'docs/design/html/F2-registre-grave.html' },
  { code: 'G2', titre: "L'offre d'hébergement", route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'docs/design/html/G2-offre-hebergement.html' },
  { code: 'M4', titre: 'Mes établissements', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'docs/design/html/M4-mes-etablissements.html' },
  { code: 'P2', titre: 'La saisie de commande', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'docs/design/html/P2-saisie-commande.html' },
  { code: 'Q1', titre: 'La page client', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'docs/design/html/Q1-page-client.html' },
  { code: 'S2', titre: 'Le registre des envois', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: 'docs/design/html/S2-registre-grave.html' },
  { code: 'V1', titre: 'Le planning', route: null, cas: 'maquette', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'docs/design/html/V1-planning.html' },

  // ── Les trente-deux dérivés ──────────────────────────────────────────────
  { code: 'R0', titre: 'Connexion', route: '/connexion', cas: 'derive', avancement: 'CONSTRUIT', cycle: null, reference: 'hérite de G2 et S3' },
  { code: 'R2', titre: 'Vue du jour', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'hérite de R1 + composant 14' },
  { code: 'R3', titre: 'Arrivée', route: '/arrivee', cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'hérite de R4' },
  { code: 'R5', titre: 'Fiche client et recherche', route: '/clients', cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'hérite de R7' },
  { code: 'R6', titre: 'Note temps réel', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F3', reference: 'hérite de R7' },
  { code: 'P1', titre: 'Plan de salle', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de R2' },
  { code: 'P3', titre: 'Addition et division', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de R7' },
  { code: 'P4', titre: 'Bon de dépôt pressing', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de R7' },
  { code: 'C1', titre: 'Ouverture de shift', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F5', reference: 'hérite de G2' },
  { code: 'C2', titre: 'Encaissement multi-modes', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F5', reference: 'hérite de R7 + P3' },
  { code: 'C3', titre: 'Comptage et écart', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F5', reference: 'hérite de R7 + F2' },
  { code: 'F1', titre: 'File de certification', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: 'hérite de R5' },
  { code: 'F3', titre: 'Avoir', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: 'hérite de F2' },
  { code: 'F4', titre: 'État de reversement', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: 'hérite de R7' },
  { code: 'G1', titre: 'Établissement et modules', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de G2' },
  { code: 'G3', titre: 'Utilisateurs et rôles', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de G2' },
  { code: 'G4', titre: 'Journal d’audit', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de R5 + F2' },
  { code: 'A1', titre: 'À propos', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de G2' },
  { code: 'S1', titre: 'Mes envois', route: '/mes-envois', cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: 'développement du composant 10' },
  { code: 'S3', titre: 'États vides et erreurs', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F6', reference: "famille d'illustrations" },
  { code: 'M1', titre: 'Accueil mobile', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de R1 + M4' },
  { code: 'M2', titre: 'Commande mobile', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de P2' },
  { code: 'M3', titre: 'Commandes QR à confirmer', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de M4 + P2' },
  { code: 'M5', titre: 'Enregistrement OCR', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de R3' },
  { code: 'V2', titre: 'Création de réservation', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de R3' },
  { code: 'Q2', titre: 'États de la surface QR', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de Q1' },
  { code: 'Q3', titre: 'États de la surface QR (suite)', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F4', reference: 'hérite de Q1' },
  { code: 'E1', titre: 'Parc de tenants', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de R5' },
  { code: 'E2', titre: 'Provisionnement', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de G2' },
  { code: 'E3', titre: 'Abonnement', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de G2 + R7' },
  { code: 'E4', titre: 'Diagnostic à distance', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de F1' },
  { code: 'E5', titre: 'Registre des paramètres', route: null, cas: 'derive', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'hérite de G2' },

  // ── Les trois composés ───────────────────────────────────────────────────
  { code: 'G5', titre: 'Chambres et types de chambre', route: null, cas: 'compose', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'composé — à valider à l’atelier terrain' },
  // ⚠️ Ces deux-là N'ONT PAS DE CODE : ils sont nommés par leur route.
  { code: null, titre: 'Notes internes', route: '/notes', cas: 'compose', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'composé — motif posé par G5' },
  { code: null, titre: 'Les articles', route: '/articles', cas: 'compose', avancement: 'PAS_COMMENCE', cycle: 'F7', reference: 'composé — motif posé par G5' },
]

/**
 * LES INSTRUMENTS DE DÉVELOPPEMENT — **sans code**, et **hors du décompte des
 * 46**.
 *
 * ⚠️ CE N'EST PAS LE PRODUIT. Leurs routes portent un trait bas précisément pour
 * que personne ne les confonde : un exploitant qui verrait `/_ecrans` dans sa
 * barre d'adresse saurait qu'il n'est pas au bon endroit. `docs/design/
 * derivation.md` définit la catégorie.
 */
export const INSTRUMENTS: readonly EntreeEcran[] = [
  { code: null, titre: 'guideDeStyle.titre', route: '/_guide-de-style', cas: 'instrument', avancement: 'CONSTRUIT', reference: 'docs/design/styleguide.html', cycle: null },
  { code: null, titre: 'ecrans.titre', route: '/_ecrans', cas: 'instrument', avancement: 'CONSTRUIT', reference: 'motif de liste posé par G5', cycle: null },
  { code: null, titre: 'scenarios.titre', route: '/_scenarios', cas: 'instrument', avancement: 'CONSTRUIT', reference: 'motif de configuration posé par G2', cycle: null },
]

/**
 * LA RACINE — une redirection, pour ce cycle seulement.
 * Elle est déclarée pour que P-04 la trouve à l'index : une route servie et non
 * déclarée fait rougir la porte, et c'est bien ce qu'on veut.
 */
export const ROUTES_TECHNIQUES: readonly EntreeEcran[] = [
  { code: null, titre: 'ecrans.titre', route: '/', cas: 'instrument', avancement: 'CONSTRUIT', reference: 'redirection vers /_ecrans — F2 y posera R1', cycle: null },
]

/**
 * LE DRAPEAU DE LA PAGE TÉMOIN, LU **DES DEUX CÔTÉS**.
 *
 * ⚠️ CE MODULE EST ÉVALUÉ DANS DEUX MONDES, et c'est tout l'intérêt de la source
 * unique. Sous Vite — l'application, et les suites de navigateur —,
 * `import.meta.env` porte le drapeau : `vite.envPrefix` fait entrer tout
 * `KAYA_*` de l'environnement de construction. Sous Node — c'est ainsi que la
 * porte P-04 lit ce fichier —, `import.meta.env` **n'existe pas du tout**, et
 * c'est `process.env` qui le porte.
 *
 * ⚠️ SANS LE `?.`, LA PORTE NE PEUT PAS LIRE L'INDEX : sous Node, lire une
 * propriété de `import.meta.env` lève « Cannot read properties of undefined »,
 * et la porte échouerait en accusant l'index d'être illisible. Constaté en
 * l'écrivant.
 */
function pageTemoinDemandee(): boolean {
  const depuisVite = import.meta.env?.KAYA_PAGE_TEMOIN
  const depuisNode = globalThis.process?.env?.KAYA_PAGE_TEMOIN
  return (depuisVite ?? depuisNode) === '1'
}

/**
 * ⚠️ LA PAGE TÉMOIN DU CYCLE DE VIE N'ENTRE QUE SOUS `KAYA_PAGE_TEMOIN=1`, ET
 * ELLE LIT LE **MÊME DRAPEAU** QUE `nuxt.config.ts`. Les deux côtés de la porte
 * P-04 ne peuvent donc pas diverger, quel que soit l'état du drapeau.
 */
export const PAGES_TEMOIN: readonly EntreeEcran[] =
  pageTemoinDemandee()
    ? [
        { code: null, titre: 'ecrans.titre', route: '/_temoin-cycle-de-vie', cas: 'instrument', avancement: 'CONSTRUIT', reference: 'page de test, jamais du produit', cycle: null },
        { code: null, titre: 'ecrans.titre', route: '/_temoin-navigation', cas: 'instrument', avancement: 'CONSTRUIT', reference: 'page de test, jamais du produit', cycle: null },
      ]
    : []

/** Toutes les entrées, produit et instruments — ce que la porte P-04 lit. */
export function toutesLesEntrees(): readonly EntreeEcran[] {
  return [...ECRANS_PRODUIT, ...INSTRUMENTS, ...ROUTES_TECHNIQUES, ...PAGES_TEMOIN]
}

/** Les entrées marquées construites — les SEULES exigibles par P-04. */
export function entreesConstruites(): readonly EntreeEcran[] {
  return toutesLesEntrees().filter((e) => e.avancement === 'CONSTRUIT' && e.route !== null)
}
