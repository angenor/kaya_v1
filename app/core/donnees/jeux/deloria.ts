import type {
  Compte,
  CompteRole,
  Permission,
  Personne,
  Role,
} from '~/core/donnees/comptes/types'
import type {
  Etablissement,
  EtablissementModule,
  ModuleActivite,
  PointDeVente,
  Tenant,
} from '~/core/donnees/etablissements/types'
import type {
  BaremePalier,
  Categorie,
  Formule,
  PlageDemiJournee,
  TempsRemiseEnEtat,
  Unite,
} from '~/core/donnees/hebergement/types'
import type { Article, CategorieArticle } from '~/core/donnees/ventes/types'
import { ETABLISSEMENT_TANTIE_ADJO } from '~/core/donnees/jeux/tantie-adjo'

/**
 * LE JEU DE DONNÉES DE LA RÉSIDENCE HÔTEL DELORIA — Abengourou, Côte d'Ivoire.
 *
 * ⚠️ TOUTES LES VALEURS VIENNENT DE `docs/cadrage-v1.md` §2.1 ET DU
 * RÉCAPITULATIF DES PARAMÈTRES D'ÉTABLISSEMENT. Aucune n'est inventée : ce jeu
 * sera recopié par les six cycles suivants, et une valeur inventée ici devient
 * une valeur de référence ailleurs.
 *
 * ⚠️ AUCUN SECRET. Ni empreinte de mot de passe, ni jeton, ni identifiant réel.
 * Les numéros de téléphone sont des numéros de démonstration.
 *
 * ⚠️ LES IDENTIFIANTS SONT LISIBLES, PAS DES UUID. Un UUID v7 est ce que le
 * PRODUIT génère à l'écriture ; un jeu de démonstration se relit, se corrige et
 * se cite dans un test. « `deloria-unite-a1` » dit ce qu'il est ;
 * « 01912f3e-… » ne dit rien et se recopie mal.
 */

export const TENANT_DELORIA = 'deloria'
export const ETABLISSEMENT_DELORIA = 'deloria-etablissement'

export const tenants: readonly Tenant[] = [
  {
    id: TENANT_DELORIA,
    tenantId: TENANT_DELORIA,
    code: 'DELORIA',
    raisonSociale: 'Résidence Hôtel Deloria',
    statut: 'ACTIF',
    estEditeur: false,
  },
]

export const etablissements: readonly Etablissement[] = [
  {
    id: ETABLISSEMENT_DELORIA,
    tenantId: TENANT_DELORIA,
    code: 'DELORIA_ABENGOUROU',
    nom: 'Résidence Hôtel Deloria',
    juridictionCode: 'CI',
    classement: 'NON_CLASSE',
    commune: 'Abengourou',
    fuseauHoraire: 'Africa/Abidjan',
    devise: 'XOF',
    adresse: 'Abengourou, Côte d’Ivoire',
    ncc: null,
  },
]

/**
 * LES CINQ MODULES D'ACTIVITÉ — référentiel EN TABLE, jamais une énumération
 * figée dans le code (ETB-02).
 */
export const modulesActivite: readonly ModuleActivite[] = [
  { id: 'module-hebergement', tenantId: TENANT_DELORIA, code: 'HEBERGEMENT', libelle: 'Hébergement', implementeAuMvp: true },
  { id: 'module-restauration', tenantId: TENANT_DELORIA, code: 'RESTAURATION', libelle: 'Restauration', implementeAuMvp: true },
  { id: 'module-bar', tenantId: TENANT_DELORIA, code: 'BAR', libelle: 'Bar', implementeAuMvp: true },
  { id: 'module-pressing', tenantId: TENANT_DELORIA, code: 'PRESSING', libelle: 'Pressing', implementeAuMvp: true },
  { id: 'module-salle-reunion', tenantId: TENANT_DELORIA, code: 'SALLE_REUNION', libelle: 'Salle de réunion', implementeAuMvp: true },
]

export const etablissementModules: readonly EtablissementModule[] = modulesActivite.map(
  (module) => ({
    id: `deloria-actif-${module.code.toLowerCase()}`,
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_DELORIA,
    moduleActiviteId: module.id,
    actif: true,
    activeLe: '2026-01-01T08:00:00.000Z',
    desactiveLe: null,
  }),
)

/** ⚠️ Le pressing est un COMPTOIR : `avecTables: false` EST le comptoir. */
export const pointsDeVente: readonly PointDeVente[] = [
  { id: 'deloria-pdv-restaurant', tenantId: TENANT_DELORIA, etablissementId: ETABLISSEMENT_DELORIA, moduleActiviteId: 'module-restauration', nom: 'Restaurant', avecTables: true, caisseId: null },
  { id: 'deloria-pdv-bar', tenantId: TENANT_DELORIA, etablissementId: ETABLISSEMENT_DELORIA, moduleActiviteId: 'module-bar', nom: 'Bar', avecTables: true, caisseId: null },
  { id: 'deloria-pdv-pressing', tenantId: TENANT_DELORIA, etablissementId: ETABLISSEMENT_DELORIA, moduleActiviteId: 'module-pressing', nom: 'Pressing', avecTables: false, caisseId: null },
]

// ── Les comptes ────────────────────────────────────────────────────────────
export const personnes: readonly Personne[] = [
  { id: 'personne-adjoua', tenantId: TENANT_DELORIA, nom: 'Kouassi', prenoms: 'Adjoua', nomNormalise: 'kouassi adjoua', email: null, typePiece: null, numeroPiece: null },
  { id: 'personne-yao', tenantId: TENANT_DELORIA, nom: 'N’Guessan', prenoms: 'Yao', nomNormalise: 'nguessan yao', email: null, typePiece: null, numeroPiece: null },
  { id: 'personne-aminata', tenantId: TENANT_DELORIA, nom: 'Traoré', prenoms: 'Aminata', nomNormalise: 'traore aminata', email: null, typePiece: null, numeroPiece: null },
  { id: 'personne-koffi', tenantId: TENANT_DELORIA, nom: 'Koffi', prenoms: null, nomNormalise: 'koffi', email: null, typePiece: null, numeroPiece: null },
  { id: 'personne-editeur', tenantId: TENANT_DELORIA, nom: 'Kaya', prenoms: 'Éditeur', nomNormalise: 'kaya editeur', email: 'admin@kaya.ci', typePiece: null, numeroPiece: null },
]

export const comptes: readonly Compte[] = [
  { id: 'compte-adjoua', tenantId: TENANT_DELORIA, personneId: 'personne-adjoua', identifiant: '+2250700000001', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-yao', tenantId: TENANT_DELORIA, personneId: 'personne-yao', identifiant: '+2250700000002', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-aminata', tenantId: TENANT_DELORIA, personneId: 'personne-aminata', identifiant: '+2250700000003', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-koffi', tenantId: TENANT_DELORIA, personneId: 'personne-koffi', identifiant: '+2250700000004', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-editeur', tenantId: TENANT_DELORIA, personneId: 'personne-editeur', identifiant: 'admin@kaya.ci', typeIdentifiant: 'EMAIL', etat: 'ACTIF', derniereConnexionLe: null },
]

export const roles: readonly Role[] = [
  { id: 'role-gerant', tenantId: TENANT_DELORIA, code: 'gerant', libelle: 'Gérant' },
  { id: 'role-caissier', tenantId: TENANT_DELORIA, code: 'caissier', libelle: 'Caissier' },
  { id: 'role-receptionniste', tenantId: TENANT_DELORIA, code: 'receptionniste', libelle: 'Réceptionniste' },
  { id: 'role-serveur', tenantId: TENANT_DELORIA, code: 'serveur', libelle: 'Serveur' },
  { id: 'role-proprietaire', tenantId: TENANT_DELORIA, code: 'proprietaire', libelle: 'Propriétaire' },
  { id: 'role-admin-editeur', tenantId: TENANT_DELORIA, code: 'admin_editeur', libelle: 'Administrateur éditeur' },
]

/**
 * ⚠️ LES RÔLES CUMULÉS SONT LA NORME, PAS L'EXCEPTION (CPT-02). Adjoua en porte
 * TROIS ; ses permissions sont leur UNION.
 */
export const compteRoles: readonly CompteRole[] = [
  { id: 'cr-adjoua-gerant', tenantId: TENANT_DELORIA, compteId: 'compte-adjoua', roleId: 'role-gerant', etablissementId: ETABLISSEMENT_DELORIA },
  { id: 'cr-adjoua-caissier', tenantId: TENANT_DELORIA, compteId: 'compte-adjoua', roleId: 'role-caissier', etablissementId: ETABLISSEMENT_DELORIA },
  { id: 'cr-adjoua-reception', tenantId: TENANT_DELORIA, compteId: 'compte-adjoua', roleId: 'role-receptionniste', etablissementId: ETABLISSEMENT_DELORIA },
  { id: 'cr-yao-reception', tenantId: TENANT_DELORIA, compteId: 'compte-yao', roleId: 'role-receptionniste', etablissementId: ETABLISSEMENT_DELORIA },
  // ── Chez Tantie Adjo — LA MÊME PERSONNE, DES RÔLES DIFFÉRENTS SELON LE SITE ─
  //
  // ⚠️ YAO RESTE RÉCEPTIONNISTE À DELORIA, ci-dessus, et il est gérant ET
  // caissier au maquis. Ce n'est pas une redondance du jeu : c'est ce que
  // FR-027 exige de prouver — **un droit détenu ailleurs ne suit pas la
  // personne**. Basculer d'un site à l'autre recalcule l'union, et un accueil
  // qui garderait les droits du site précédent ferait encaisser là où on n'y a
  // pas droit.
  //
  // ⚠️ ET LE MAQUIS EST LE SECOND ÉTABLISSEMENT DU **MÊME TENANT**. Aucune
  // exception n'est introduite ici : `cr-koffi-test` reste la seule liaison qui
  // traverse un tenant, et elle porte son motif.
  { id: 'cr-yao-tantie-adjo-gerant', tenantId: TENANT_DELORIA, compteId: 'compte-yao', roleId: 'role-gerant', etablissementId: ETABLISSEMENT_TANTIE_ADJO },
  { id: 'cr-yao-tantie-adjo-caissier', tenantId: TENANT_DELORIA, compteId: 'compte-yao', roleId: 'role-caissier', etablissementId: ETABLISSEMENT_TANTIE_ADJO },
  // M. Koffi, propriétaire de sa DEUXIÈME maison — lecture seule, comme ailleurs.
  { id: 'cr-koffi-tantie-adjo', tenantId: TENANT_DELORIA, compteId: 'compte-koffi', roleId: 'role-proprietaire', etablissementId: ETABLISSEMENT_TANTIE_ADJO },
  { id: 'cr-aminata-serveur', tenantId: TENANT_DELORIA, compteId: 'compte-aminata', roleId: 'role-serveur', etablissementId: ETABLISSEMENT_DELORIA },
  { id: 'cr-koffi-deloria', tenantId: TENANT_DELORIA, compteId: 'compte-koffi', roleId: 'role-proprietaire', etablissementId: ETABLISSEMENT_DELORIA },
  // Le multi-établissement : la MÊME personne, propriétaire sur DEUX sites.
  { id: 'cr-koffi-test', tenantId: TENANT_DELORIA, compteId: 'compte-koffi', roleId: 'role-proprietaire', etablissementId: 'residence-test-etablissement' },
  // La portée éditeur n'est celle d'AUCUN établissement : `null`.
  { id: 'cr-editeur', tenantId: TENANT_DELORIA, compteId: 'compte-editeur', roleId: 'role-admin-editeur', etablissementId: null },
]

export const permissions: readonly Permission[] = [
  { id: 'perm-passage-ouvrir', tenantId: TENANT_DELORIA, code: 'hebergement.passage.ouvrir', moduleActiviteCode: 'HEBERGEMENT', libelle: 'Ouvrir un passage' },
  { id: 'perm-sejour-arrivee', tenantId: TENANT_DELORIA, code: 'hebergement.sejour.arrivee', moduleActiviteCode: 'HEBERGEMENT', libelle: 'Enregistrer une arrivée' },
  { id: 'perm-sejour-depart', tenantId: TENANT_DELORIA, code: 'hebergement.sejour.depart', moduleActiviteCode: 'HEBERGEMENT', libelle: 'Arrêter la note et enregistrer le départ' },
  { id: 'perm-caisse-encaisser', tenantId: TENANT_DELORIA, code: 'caisse.encaisser', moduleActiviteCode: null, libelle: 'Encaisser' },
  { id: 'perm-caisse-cloture', tenantId: TENANT_DELORIA, code: 'caisse.cloture', moduleActiviteCode: null, libelle: 'Clôturer la caisse' },
  { id: 'perm-commande-prendre', tenantId: TENANT_DELORIA, code: 'ventes.commande.prendre', moduleActiviteCode: 'RESTAURATION', libelle: 'Prendre une commande' },
  { id: 'perm-commande-remise', tenantId: TENANT_DELORIA, code: 'ventes.commande.remise', moduleActiviteCode: 'RESTAURATION', libelle: 'Appliquer une remise' },
  { id: 'perm-pilotage-lire', tenantId: TENANT_DELORIA, code: 'pilotage.lire', moduleActiviteCode: null, libelle: 'Consulter les chiffres' },
  { id: 'perm-etablissement-gerer', tenantId: TENANT_DELORIA, code: 'etablissement.gerer', moduleActiviteCode: null, libelle: 'Régler l’établissement' },
]

/**
 * Ce que chaque rôle peut faire. En base c'est `role_permission` ; ce cycle ne
 * peuple pas la table, il en porte la projection nécessaire au calcul d'union.
 */
export const permissionsParRole: Readonly<Record<string, readonly string[]>> = {
  gerant: ['hebergement.passage.ouvrir', 'hebergement.sejour.arrivee', 'hebergement.sejour.depart', 'ventes.commande.remise', 'pilotage.lire', 'etablissement.gerer'],
  caissier: ['caisse.encaisser', 'caisse.cloture'],
  receptionniste: ['hebergement.passage.ouvrir', 'hebergement.sejour.arrivee', 'hebergement.sejour.depart'],
  serveur: ['ventes.commande.prendre'],
  proprietaire: ['pilotage.lire', 'etablissement.gerer'],
  admin_editeur: [],
}

// ── L'hébergement ──────────────────────────────────────────────────────────

/**
 * ⚠️ `prixBase` EST LE TARIF **HORS TAXE DE SÉJOUR**. Les tarifs affichés à
 * Deloria — 12 500, 15 500, 17 500, 20 500, 25 500 — incluent 500 F de taxe
 * communale de nuitée, ce qui place l'établissement en infraction (cadrage
 * §2.1). Le jeu encode la forme CONFORME : 12 000, 15 000, 17 000, 20 000,
 * 25 000, et les 500 F sont une LIGNE DISTINCTE.
 */
const CATEGORIES_DELORIA = [
  { cle: 'standard', nom: 'Standard', prixAffiche: 12500, codes: ['A1', 'A2', 'A3'] },
  { cle: 'classique', nom: 'Classique', prixAffiche: 15500, codes: ['B1', 'B2', 'B3', 'B4', 'B5'] },
  { cle: 'classique-sup', nom: 'Classique supérieure', prixAffiche: 17500, codes: ['C1', 'C2', 'C3', 'C4'] },
  { cle: 'superieure-a', nom: 'Supérieure A', prixAffiche: 20500, codes: ['D1', 'D2'] },
  { cle: 'superieure-b', nom: 'Supérieure B', prixAffiche: 25500, codes: ['E1', 'E2', 'E3'] },
] as const

/** La taxe communale de nuitée, retirée du prix de base. */
export const TAXE_NUITEE_MINEUR = 500

export const categories: readonly Categorie[] = [
  ...CATEGORIES_DELORIA.map((c, index) => ({
    id: `deloria-categorie-${c.cle}`,
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_DELORIA,
    nom: c.nom,
    capaciteAccueil: 2,
    ordre: index + 1,
    actif: true,
  })),
  {
    id: 'deloria-categorie-salle',
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_DELORIA,
    nom: 'Salle de réunion',
    capaciteAccueil: 30,
    ordre: 6,
    actif: true,
  },
]

export const unites: readonly Unite[] = [
  ...CATEGORIES_DELORIA.flatMap((c) =>
    c.codes.map((code, rang) => ({
      id: `deloria-unite-${code.toLowerCase()}`,
      tenantId: TENANT_DELORIA,
      categorieId: `deloria-categorie-${c.cle}`,
      code,
      etage: String(Math.floor(rang / 3) + 1),
      statutMenage: 'PROPRE' as const,
      actif: true,
    })),
  ),
  {
    id: 'deloria-unite-sr1',
    tenantId: TENANT_DELORIA,
    categorieId: 'deloria-categorie-salle',
    code: 'SR1',
    etage: '0',
    statutMenage: 'PROPRE',
    actif: true,
  },
]

const FORMULE_PASSAGE_STANDARD = 'deloria-formule-standard-passage'

export const formules: readonly Formule[] = CATEGORIES_DELORIA.flatMap((c) => [
  {
    id: `deloria-formule-${c.cle}-nuitee`,
    tenantId: TENANT_DELORIA,
    categorieId: `deloria-categorie-${c.cle}`,
    type: 'NUITEE' as const,
    prixBase: c.prixAffiche - TAXE_NUITEE_MINEUR,
    codeDevise: 'XOF',
    dureeMinMinutes: null,
    dureeMaxMinutes: null,
    heureArriveeStandard: '14:00',
    heureDepartStandard: '12:00',
    joursAutorises: null,
    assujettieTaxeNuitee: true,
    regleConversionTaxe: 'une_nuitee_par_occupation' as const,
    actif: true,
  },
  {
    id: `deloria-formule-${c.cle}-passage`,
    tenantId: TENANT_DELORIA,
    categorieId: `deloria-categorie-${c.cle}`,
    type: 'PASSAGE' as const,
    // Le prix vient du BARÈME, pas d'un prix de base.
    prixBase: null,
    codeDevise: 'XOF',
    dureeMinMinutes: 60,
    // 480 min = le `seuil_bascule_nuitee_minutes` du Récapitulatif, 8 h.
    dureeMaxMinutes: 480,
    heureArriveeStandard: null,
    heureDepartStandard: null,
    joursAutorises: null,
    // ⚠️ TRANCHÉ AU TERRAIN LE 2026-08-02 : le passage n'est PAS assujetti.
    assujettieTaxeNuitee: false,
    regleConversionTaxe: null,
    actif: true,
  },
  {
    id: `deloria-formule-${c.cle}-demi-journee`,
    tenantId: TENANT_DELORIA,
    categorieId: `deloria-categorie-${c.cle}`,
    type: 'DEMI_JOURNEE' as const,
    prixBase: null,
    codeDevise: 'XOF',
    dureeMinMinutes: null,
    dureeMaxMinutes: null,
    heureArriveeStandard: null,
    heureDepartStandard: null,
    joursAutorises: null,
    assujettieTaxeNuitee: false,
    regleConversionTaxe: null,
    actif: true,
  },
  {
    id: `deloria-formule-${c.cle}-mensuel`,
    tenantId: TENANT_DELORIA,
    categorieId: `deloria-categorie-${c.cle}`,
    type: 'MENSUEL' as const,
    prixBase: null,
    codeDevise: 'XOF',
    dureeMinMinutes: null,
    dureeMaxMinutes: null,
    heureArriveeStandard: null,
    heureDepartStandard: null,
    joursAutorises: null,
    assujettieTaxeNuitee: true,
    regleConversionTaxe: 'au_prorata' as const,
    actif: true,
  },
])

/**
 * LE BARÈME DE PASSAGE, À PALIERS DÉGRESSIFS (HEB-04).
 * ⚠️ Aucun de ces prix ne porte les 500 F : le passage n'est pas assujetti.
 */
export const baremePaliers: readonly BaremePalier[] = [
  { id: 'deloria-palier-60', tenantId: TENANT_DELORIA, formuleId: FORMULE_PASSAGE_STANDARD, dureeMinutes: 60, prix: 1500, codeDevise: 'XOF', estHeureSupplementaire: false },
  { id: 'deloria-palier-120', tenantId: TENANT_DELORIA, formuleId: FORMULE_PASSAGE_STANDARD, dureeMinutes: 120, prix: 2800, codeDevise: 'XOF', estHeureSupplementaire: false },
  { id: 'deloria-palier-180', tenantId: TENANT_DELORIA, formuleId: FORMULE_PASSAGE_STANDARD, dureeMinutes: 180, prix: 4000, codeDevise: 'XOF', estHeureSupplementaire: false },
  { id: 'deloria-palier-240', tenantId: TENANT_DELORIA, formuleId: FORMULE_PASSAGE_STANDARD, dureeMinutes: 240, prix: 5000, codeDevise: 'XOF', estHeureSupplementaire: false },
  { id: 'deloria-palier-sup', tenantId: TENANT_DELORIA, formuleId: FORMULE_PASSAGE_STANDARD, dureeMinutes: 60, prix: 1200, codeDevise: 'XOF', estHeureSupplementaire: true },
]

export const plagesDemiJournee: readonly PlageDemiJournee[] = [
  { id: 'deloria-plage-matinee', tenantId: TENANT_DELORIA, formuleId: 'deloria-formule-standard-demi-journee', libelle: 'Matinée', heureDebut: '08:00', heureFin: '12:00' },
  { id: 'deloria-plage-apres-midi', tenantId: TENANT_DELORIA, formuleId: 'deloria-formule-standard-demi-journee', libelle: 'Après-midi', heureDebut: '13:00', heureFin: '16:00' },
]

/** Le temps de remise en état — intégré à l'intervalle d'indisponibilité. */
export const tempsRemiseEnEtat: readonly TempsRemiseEnEtat[] = [
  { id: 'deloria-remise-passage', tenantId: TENANT_DELORIA, categorieId: null, formuleId: FORMULE_PASSAGE_STANDARD, dureeMinutes: 30 },
  { id: 'deloria-remise-nuitee', tenantId: TENANT_DELORIA, categorieId: null, formuleId: 'deloria-formule-standard-nuitee', dureeMinutes: 120 },
  { id: 'deloria-remise-demi', tenantId: TENANT_DELORIA, categorieId: null, formuleId: 'deloria-formule-standard-demi-journee', dureeMinutes: 60 },
]

// ── Les ventes ─────────────────────────────────────────────────────────────

export const categoriesArticle: readonly CategorieArticle[] = [
  { id: 'cat-bieres', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-bar', nom: 'Bières', ordre: 1 },
  { id: 'cat-sans-alcool', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-bar', nom: 'Boissons sans alcool', ordre: 2 },
  { id: 'cat-spiritueux', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-bar', nom: 'Spiritueux', ordre: 3 },
  { id: 'cat-grillades', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-restaurant', nom: 'Grillades', ordre: 1 },
  { id: 'cat-plats', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-restaurant', nom: 'Plats', ordre: 2 },
  { id: 'cat-accompagnements', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-restaurant', nom: 'Accompagnements', ordre: 3 },
  { id: 'cat-petits-dejeuners', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-restaurant', nom: 'Petits déjeuners', ordre: 4 },
  { id: 'cat-prestations', tenantId: TENANT_DELORIA, pointDeVenteId: 'deloria-pdv-pressing', nom: 'Prestations', ordre: 1 },
]

/** ⚠️ `tauxTva` en CHAÎNE décimale — jamais un flottant (principe 5). */
function article(
  id: string,
  pdv: string,
  categorie: string,
  nom: string,
  prix: number,
  tauxTva = '18',
): Article {
  return {
    id,
    tenantId: TENANT_DELORIA,
    pointDeVenteId: pdv,
    categorieArticleId: categorie,
    destinationPreparationId: null,
    nom,
    prix,
    codeDevise: 'XOF',
    tauxTva,
    disponible: true,
    suiviStock: false,
    uniteMesure: null,
    codeBarre: null,
    articleParentId: null,
  }
}

export const articles: readonly Article[] = [
  // Bar — bières
  article('art-flag', 'deloria-pdv-bar', 'cat-bieres', 'Flag 65 cl', 1000),
  article('art-solibra', 'deloria-pdv-bar', 'cat-bieres', 'Solibra 65 cl', 1000),
  article('art-bock', 'deloria-pdv-bar', 'cat-bieres', 'Bock 33 cl', 700),
  article('art-guinness', 'deloria-pdv-bar', 'cat-bieres', 'Guinness 33 cl', 1200),
  article('art-castel', 'deloria-pdv-bar', 'cat-bieres', 'Castel 65 cl', 1000),
  article('art-despe', 'deloria-pdv-bar', 'cat-bieres', 'Desperados 33 cl', 1500),
  // Bar — sans alcool
  article('art-coca', 'deloria-pdv-bar', 'cat-sans-alcool', 'Coca-Cola 33 cl', 700),
  article('art-fanta', 'deloria-pdv-bar', 'cat-sans-alcool', 'Fanta 33 cl', 700),
  article('art-sprite', 'deloria-pdv-bar', 'cat-sans-alcool', 'Sprite 33 cl', 700),
  article('art-eau-50', 'deloria-pdv-bar', 'cat-sans-alcool', 'Eau minérale 50 cl', 300),
  article('art-eau-150', 'deloria-pdv-bar', 'cat-sans-alcool', 'Eau minérale 1,5 l', 700),
  article('art-jus-bissap', 'deloria-pdv-bar', 'cat-sans-alcool', 'Jus de bissap', 800),
  // Bar — spiritueux
  article('art-whisky', 'deloria-pdv-bar', 'cat-spiritueux', 'Whisky, la dose', 2500),
  article('art-gin', 'deloria-pdv-bar', 'cat-spiritueux', 'Gin tonic', 3000),
  // Restaurant — grillades
  article('art-poulet-braise', 'deloria-pdv-restaurant', 'cat-grillades', 'Poulet braisé', 4000),
  article('art-poisson-braise', 'deloria-pdv-restaurant', 'cat-grillades', 'Poisson braisé', 4500),
  article('art-brochettes', 'deloria-pdv-restaurant', 'cat-grillades', 'Brochettes de bœuf', 2500),
  // Restaurant — plats
  article('art-garba', 'deloria-pdv-restaurant', 'cat-plats', 'Garba', 1500),
  article('art-kedjenou', 'deloria-pdv-restaurant', 'cat-plats', 'Kedjenou de poulet', 3500),
  article('art-sauce-graine', 'deloria-pdv-restaurant', 'cat-plats', 'Sauce graine', 3000),
  article('art-riz-gras', 'deloria-pdv-restaurant', 'cat-plats', 'Riz gras', 2500),
  // Restaurant — accompagnements
  article('art-attieke', 'deloria-pdv-restaurant', 'cat-accompagnements', 'Attiéké', 500),
  article('art-alloco', 'deloria-pdv-restaurant', 'cat-accompagnements', 'Alloco', 1000),
  article('art-foutou', 'deloria-pdv-restaurant', 'cat-accompagnements', 'Foutou banane', 1000),
  article('art-frites', 'deloria-pdv-restaurant', 'cat-accompagnements', 'Frites', 1000),
  // Restaurant — petits déjeuners
  article('art-omelette', 'deloria-pdv-restaurant', 'cat-petits-dejeuners', 'Omelette', 1500),
  article('art-pain-beurre', 'deloria-pdv-restaurant', 'cat-petits-dejeuners', 'Pain beurre', 500),
  article('art-cafe', 'deloria-pdv-restaurant', 'cat-petits-dejeuners', 'Café', 500),
  // Pressing — prestations
  article('art-chemise', 'deloria-pdv-pressing', 'cat-prestations', 'Chemise', 1000),
  article('art-pantalon', 'deloria-pdv-pressing', 'cat-prestations', 'Pantalon', 1200),
  article('art-boubou', 'deloria-pdv-pressing', 'cat-prestations', 'Boubou', 2500),
  article('art-costume', 'deloria-pdv-pressing', 'cat-prestations', 'Costume deux pièces', 3500),
  article('art-drap', 'deloria-pdv-pressing', 'cat-prestations', 'Drap', 1500),
]
