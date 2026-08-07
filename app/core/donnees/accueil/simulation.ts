import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type { DonneesAccueil } from '~/core/donnees/accueil/interface'
import type {
  ActiviteAccueil,
  CarteAReglerAccueil,
  ChiffreAccueil,
  LigneSuiteAccueil,
  TeteAccueil,
} from '~/core/donnees/accueil/types'
import { ETABLISSEMENT_DELORIA } from '~/core/donnees/jeux/deloria'
import { ETABLISSEMENT_TANTIE_ADJO } from '~/core/donnees/jeux/tantie-adjo'
import { lireSimule } from '~/core/donnees/simulationCommune'

/**
 * ⚠️ CE FICHIER DISPARAÎT AU BRANCHEMENT DE LA PHASE 3, et c'est tout son
 * intérêt : cinq méthodes, cinq endpoints, cinq suppressions indépendantes.
 *
 * ⚠️ LES VALEURS VIENNENT DES QUATRE MAQUETTES `R1-accueil*.html`, relevées
 * telles quelles. Aucune n'est inventée : ce jeu sera regardé par l'atelier
 * terrain, et un chiffre inventé ici deviendrait un chiffre de référence
 * ailleurs.
 *
 * ⚠️ TOUS LES MONTANTS SONT DES **ENTIERS EN UNITÉ MINEURE**. XOF a zéro
 * décimale : `47500` s'écrit « 47 500 F », et c'est `format/montant.ts` qui
 * l'écrit — jamais ce fichier, qui ne met rien en forme.
 *
 * ⚠️ ET LES INSTANTS SONT DES ISO AU FUSEAU DE L'ÉTABLISSEMENT (`Africa/Abidjan`,
 * UTC+0). C'est `format/instant.ts` qui les rend lisibles, au fuseau lu de
 * l'établissement — jamais une chaîne « 11 h 00 » écrite ici, qui serait fausse
 * pour le second pays.
 */

const XOF = 'XOF'

/** Le jour de référence des maquettes — mardi 14 juillet. */
const JOUR = '2026-07-14'
function instant(heure: string): string {
  return `${JOUR}T${heure}:00.000Z`
}

// ── Chez Tantie Adjo · le maquis ───────────────────────────────────────────

const TETES_MAQUIS: readonly TeteAccueil[] = [
  {
    surfaceCle: 'tete.service',
    libelle: '6 tables occupées sur 9',
    detail: 'Service commencé à 18 h 30',
    montant: { montantMineur: 62000, codeDevise: XOF },
    actionCle: 'accueil.action.ouvrirTable',
    actionSecondaireCle: 'accueil.action.voirArdoises',
  },
]

const SUITE_MAQUIS: readonly LigneSuiteAccueil[] = [
  { surfaceCle: 'suite.tables', id: 'table-1', instant: instant('20:50'), libelle: 'Table 1', detail: '4 personnes · 1 h 20', montant: { montantMineur: 18500, codeDevise: XOF }, etat: 'enCours' },
  { surfaceCle: 'suite.tables', id: 'table-2', instant: instant('22:10'), libelle: 'Table 2', detail: '', montant: null, etat: 'libre' },
  { surfaceCle: 'suite.tables', id: 'table-3', instant: instant('21:45'), libelle: 'Table 3', detail: '2 personnes · 25 min', montant: { montantMineur: 6000, codeDevise: XOF }, etat: 'enCours' },
  { surfaceCle: 'suite.tables', id: 'table-4', instant: instant('22:10'), libelle: 'Table 4', detail: '', montant: null, etat: 'libre' },
  { surfaceCle: 'suite.tables', id: 'table-5', instant: instant('21:20'), libelle: 'Table 5', detail: 'Poisson en cuisine', montant: { montantMineur: 9500, codeDevise: XOF }, etat: 'attente' },
  { surfaceCle: 'suite.tables', id: 'table-6', instant: instant('19:30'), libelle: 'Table 6', detail: 'Ardoise — M. Sylla', montant: { montantMineur: 12000, codeDevise: XOF }, etat: 'casse' },
  { surfaceCle: 'suite.tables', id: 'table-7', instant: instant('22:10'), libelle: 'Table 7', detail: '', montant: null, etat: 'libre' },
  { surfaceCle: 'suite.tables', id: 'table-8', instant: instant('22:10'), libelle: 'Table 8', detail: '', montant: null, etat: 'libre' },
  { surfaceCle: 'suite.tables', id: 'table-comptoir', instant: instant('21:05'), libelle: 'Comptoir', detail: '5 personnes debout', montant: { montantMineur: 16000, codeDevise: XOF }, etat: 'enCours' },
]

const A_REGLER_MAQUIS: readonly CarteAReglerAccueil[] = [
  { surfaceCle: 'aRegler.caisse', id: 'ardoises', niveau: 'alerte', libelle: '3 ardoises à encaisser', detail: 'M. Sylla, Tante Awa, table 6 · les plus anciennes de 4 jours', actionCle: 'accueil.action.voir' },
  { surfaceCle: 'aRegler.stock', id: 'biere', niveau: 'info', libelle: '4 casiers de bière', detail: 'Au rythme de ce soir, vous tenez jusqu’à jeudi. Le livreur passe mercredi matin.', actionCle: 'accueil.action.noterCommande' },
]

const CHIFFRES_MAQUIS: readonly ChiffreAccueil[] = [
  { surfaceCle: 'chiffre.recette', id: 'encaisse-ce-soir', etiquetteCle: 'accueil.chiffre.encaisseCeSoir', montant: { montantMineur: 62000, codeDevise: XOF }, valeur: null, comparaison: '− 9 % par rapport à hier même heure' },
  { surfaceCle: 'chiffre.recette', id: 'ardoises', etiquetteCle: 'accueil.chiffre.ardoisesEnCours', montant: { montantMineur: 18000, codeDevise: XOF }, valeur: null, comparaison: '3 clients · la plus vieille de 4 jours' },
  { surfaceCle: 'chiffre.recette', id: 'plat', etiquetteCle: 'accueil.chiffre.platLePlusVendu', montant: null, valeur: '14', comparaison: 'Poisson braisé · 2 portions restantes' },
]

// ── Résidence Hôtel Deloria ────────────────────────────────────────────────

/**
 * ⚠️ TROIS CANDIDATES, ET UNE SEULE SERA RENDUE. Ce qui attend Adjoua n'est pas
 * ce qui attend Aminata, ni ce qui attend M. Koffi — et **aucune branche de code
 * ne les distingue** : c'est le filtrage par permission et par module qui
 * tranche, comme pour tout le reste de l'écran.
 */
const TETES_DELORIA: readonly TeteAccueil[] = [
  {
    surfaceCle: 'tete.depart',
    libelle: 'Chambre 204 — M. Traoré',
    detail: 'Départ prévu à 11 h 00 · 3 nuits',
    montant: { montantMineur: 47500, codeDevise: XOF },
    actionCle: 'accueil.action.encaisserDepart',
    actionSecondaireCle: 'accueil.action.voirDeparts',
  },
  {
    surfaceCle: 'tete.service',
    libelle: 'Table 6 — 4 couverts',
    detail: 'Ouverte depuis 40 minutes · plats servis',
    montant: { montantMineur: 12500, codeDevise: XOF },
    actionCle: 'accueil.action.ajouterCommande',
    actionSecondaireCle: 'accueil.action.ouvrirTable',
  },
  {
    surfaceCle: 'tete.pilotage',
    libelle: 'Caisse d’hier soir : 6 500 F de moins',
    detail: 'Clôturée à 22 h 15 · l’écart porte sur le bar',
    montant: null,
    actionCle: 'accueil.action.demanderExplication',
    actionSecondaireCle: 'accueil.action.voirCaisse',
  },
]

const SUITE_DELORIA: readonly LigneSuiteAccueil[] = [
  { surfaceCle: 'suite.arrivees', id: 'arrivees', instant: instant('14:00'), libelle: '3 arrivées attendues', detail: 'La première à 14 h 00 · 2 chambres déjà prêtes', montant: null, etat: 'attente' },
  { surfaceCle: 'suite.arrivees', id: 'menage', instant: instant('12:30'), libelle: '5 chambres à nettoyer', detail: 'Dont 2 attendues pour 14 h', montant: null, etat: 'enCours' },
  { surfaceCle: 'suite.tables', id: 'tables-bar', instant: instant('10:00'), libelle: '4 tables ouvertes au bar', detail: 'Ouvertes depuis hier soir · Aminata en salle', montant: { montantMineur: 23000, codeDevise: XOF }, etat: 'enCours' },
]

const A_REGLER_DELORIA: readonly CarteAReglerAccueil[] = [
  { surfaceCle: 'aRegler.fiscal', id: 'factures', niveau: 'danger', libelle: '6 factures pas encore transmises', detail: 'Elles datent de samedi. Au-delà de 72 heures, la DGI peut les refuser.', actionCle: 'accueil.action.transmettre' },
  { surfaceCle: 'aRegler.caisse', id: 'ecart-caisse', niveau: 'alerte', libelle: 'Caisse d’hier : 6 500 F de moins', detail: 'Comptée à 22 h 15. L’écart porte sur le bar.', actionCle: 'accueil.action.verifier' },
  { surfaceCle: 'aRegler.stock', id: 'biere', niveau: 'info', libelle: 'Bière Flag : 8 casiers', detail: 'Au rythme des trois derniers jours, il en reste pour deux jours.', actionCle: 'accueil.action.commander' },
]

const ACTIVITES_DELORIA: readonly ActiviteAccueil[] = [
  { surfaceCle: 'activite.hebergement', moduleCode: 'HEBERGEMENT', libelle: 'Hébergement', detail: '12 chambres occupées', icone: 'ph-bed' },
  { surfaceCle: 'activite.restauration', moduleCode: 'RESTAURATION', libelle: 'Restaurant', detail: 'Service à 12 h', icone: 'ph-fork-knife' },
  { surfaceCle: 'activite.bar', moduleCode: 'BAR', libelle: 'Bar', detail: '4 tables ouvertes', icone: 'ph-beer-bottle' },
  { surfaceCle: 'activite.pressing', moduleCode: 'PRESSING', libelle: 'Pressing', detail: '3 sacs en cours', icone: 'ph-t-shirt' },
  { surfaceCle: 'activite.salleReunion', moduleCode: 'SALLE_REUNION', libelle: 'Salle de réunion', detail: 'Libre aujourd’hui', icone: 'ph-projector-screen' },
]

const CHIFFRES_DELORIA: readonly ChiffreAccueil[] = [
  { surfaceCle: 'chiffre.recette', id: 'recette', etiquetteCle: 'accueil.chiffre.recetteDepuisOuverture', montant: { montantMineur: 184000, codeDevise: XOF }, valeur: null, comparaison: '+ 18 % par rapport à hier même heure' },
  { surfaceCle: 'chiffre.recette', id: 'occupation', etiquetteCle: 'accueil.chiffre.chambresOccupees', montant: null, valeur: '12 / 20', comparaison: '3 arrivées attendues cet après-midi' },
  { surfaceCle: 'chiffre.recette', id: 'reste', etiquetteCle: 'accueil.chiffre.resteAEncaisser', montant: { montantMineur: 71500, codeDevise: XOF }, valeur: null, comparaison: '2 départs et 4 tables ouvertes' },
  // ⚠️ CES DEUX-LÀ SONT CEUX D'AMINATA, et ils vivent sous la surface du
  // service : une serveuse voit le total de SES tables, jamais la recette de
  // l'hôtel. Le filtrage s'en charge — il n'y a pas deux jeux de données.
  { surfaceCle: 'chiffre.service', id: 'mes-tables', etiquetteCle: 'accueil.chiffre.vosTablesOuvertes', montant: null, valeur: '4', comparaison: 'La plus ancienne depuis 1 h 05' },
  { surfaceCle: 'chiffre.service', id: 'total-tables', etiquetteCle: 'accueil.chiffre.totalDeVosTables', montant: { montantMineur: 38500, codeDevise: XOF }, valeur: null, comparaison: 'Encaissement à la caisse' },
  { surfaceCle: 'chiffre.service', id: 'commandes-servies', etiquetteCle: 'accueil.chiffre.commandesServies', montant: null, valeur: '11', comparaison: 'Depuis le début du service' },
]

// ── Ce que chaque établissement porte ──────────────────────────────────────

interface JeuAccueil {
  readonly tetes: readonly TeteAccueil[]
  readonly suite: readonly LigneSuiteAccueil[]
  readonly aRegler: readonly CarteAReglerAccueil[]
  readonly activites: readonly ActiviteAccueil[]
  readonly chiffres: readonly ChiffreAccueil[]
}

const VIDE: JeuAccueil = { tetes: [], suite: [], aRegler: [], activites: [], chiffres: [] }

/**
 * ⚠️ « RÉSIDENCE TEST » NE PORTE **RIEN**, ET C'EST LE POINT. Un établissement
 * neuf, sans mouvement, doit rendre un accueil qui le dit — pas un accueil
 * cassé. Toute rubrique qui supposerait un contenu se découvre ici, au moment
 * le moins cher.
 */
const PAR_ETABLISSEMENT: Readonly<Record<string, JeuAccueil>> = {
  [ETABLISSEMENT_DELORIA]: {
    tetes: TETES_DELORIA,
    suite: SUITE_DELORIA,
    aRegler: A_REGLER_DELORIA,
    activites: ACTIVITES_DELORIA,
    chiffres: CHIFFRES_DELORIA,
  },
  [ETABLISSEMENT_TANTIE_ADJO]: {
    tetes: TETES_MAQUIS,
    suite: SUITE_MAQUIS,
    aRegler: A_REGLER_MAQUIS,
    // ⚠️ AUCUNE ACTIVITÉ, ET CE N'EST PAS UN OUBLI. Le maquis n'a qu'un service :
    // « Vos activités » disparaît **avec son titre**. Une liste à un élément qui
    // ne mène nulle part est un reste de mise en page.
    activites: [],
    chiffres: CHIFFRES_MAQUIS,
  },
}

function jeuDe(portee: PorteeLecture): JeuAccueil {
  return PAR_ETABLISSEMENT[portee.etablissementId] ?? VIDE
}

export const simulationAccueil: DonneesAccueil = {
  listerTetes(portee: PorteeLecture): Promise<ResultatDomaine<readonly TeteAccueil[]>> {
    // ⚠️ `lireSimule`, PAS `lireUnSimule` : une tête absente est un cas
    // NORMAL — rien n'attend —, pas un `INTROUVABLE`. Les confondre ferait
    // afficher une erreur à un établissement dont la journée est calme.
    return lireSimule(() => jeuDe(portee).tetes, [])
  },

  listerSuite(portee: PorteeLecture): Promise<ResultatDomaine<readonly LigneSuiteAccueil[]>> {
    return lireSimule(() => jeuDe(portee).suite, [])
  },

  listerARegler(portee: PorteeLecture): Promise<ResultatDomaine<readonly CarteAReglerAccueil[]>> {
    return lireSimule(() => jeuDe(portee).aRegler, [])
  },

  listerActivites(portee: PorteeLecture): Promise<ResultatDomaine<readonly ActiviteAccueil[]>> {
    return lireSimule(() => jeuDe(portee).activites, [])
  },

  listerChiffres(portee: PorteeLecture): Promise<ResultatDomaine<readonly ChiffreAccueil[]>> {
    return lireSimule(() => jeuDe(portee).chiffres, [])
  },

  sitesAvecAlerte(): Promise<ResultatDomaine<readonly string[]>> {
    // ⚠️ « DANGER » ET « ALERTE » SEULEMENT, JAMAIS « INFO ». Une pastille qui
    // s'allume pour un casier de bière à commander s'allume tout le temps — et
    // une pastille permanente cesse d'être une pastille.
    return lireSimule(
      () =>
        Object.entries(PAR_ETABLISSEMENT)
          .filter(([, jeu]) => jeu.aRegler.some((c) => c.niveau !== 'info'))
          .map(([id]) => id),
      [],
    )
  },
}
