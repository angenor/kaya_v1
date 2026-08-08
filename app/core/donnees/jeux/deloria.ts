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
  Accompagnant,
  BaremePalier,
  Categorie,
  Client,
  FichePolice,
  Formule,
  LigneSejour,
  MotifOccupation,
  NoteSejour,
  NumerotationFichePolice,
  Occupation,
  PlageDemiJournee,
  Sejour,
  StatutOccupation,
  TaxeSejourConstat,
  TempsRemiseEnEtat,
  TypeLigneSejour,
  Unite,
} from '~/core/donnees/hebergement/types'
import type { Article, CategorieArticle } from '~/core/donnees/ventes/types'
import { decale, instantAutorite, jourA } from '~/core/donnees/horloge'
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
  { id: 'personne-adjoua', tenantId: TENANT_DELORIA, nom: 'Kouassi', prenoms: 'Adjoua', nomNormalise: 'kouassi adjoua', email: null, typePiece: null, numeroPiece: null, pieceCaptureeLe: null },
  { id: 'personne-yao', tenantId: TENANT_DELORIA, nom: 'N’Guessan', prenoms: 'Yao', nomNormalise: 'nguessan yao', email: null, typePiece: null, numeroPiece: null, pieceCaptureeLe: null },
  { id: 'personne-aminata', tenantId: TENANT_DELORIA, nom: 'Traoré', prenoms: 'Aminata', nomNormalise: 'traore aminata', email: null, typePiece: null, numeroPiece: null, pieceCaptureeLe: null },
  { id: 'personne-koffi', tenantId: TENANT_DELORIA, nom: 'Koffi', prenoms: null, nomNormalise: 'koffi', email: null, typePiece: null, numeroPiece: null, pieceCaptureeLe: null },
  { id: 'personne-editeur', tenantId: TENANT_DELORIA, nom: 'Kaya', prenoms: 'Éditeur', nomNormalise: 'kaya editeur', email: 'admin@kaya.ci', typePiece: null, numeroPiece: null, pieceCaptureeLe: null },
  // ⚠️ AJOUTÉE AU CYCLE F2, ET LE MOTIF EST NOMMÉ. Un compte `SUSPENDU` doit
  // rendre EXACTEMENT la même phrase qu'un compte inconnu (FR-003) — et sans
  // compte suspendu au jeu, cette branche n'était exercée par rien. Une règle
  // que rien n'exerce est une règle qu'on croit tenue.
  { id: 'personne-mariam', tenantId: TENANT_DELORIA, nom: 'Bamba', prenoms: 'Mariam', nomNormalise: 'bamba mariam', email: null, typePiece: null, numeroPiece: null, pieceCaptureeLe: null },
]

export const comptes: readonly Compte[] = [
  { id: 'compte-adjoua', tenantId: TENANT_DELORIA, personneId: 'personne-adjoua', identifiant: '+2250700000001', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-yao', tenantId: TENANT_DELORIA, personneId: 'personne-yao', identifiant: '+2250700000002', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-aminata', tenantId: TENANT_DELORIA, personneId: 'personne-aminata', identifiant: '+2250700000003', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-koffi', tenantId: TENANT_DELORIA, personneId: 'personne-koffi', identifiant: '+2250700000004', typeIdentifiant: 'TELEPHONE', etat: 'ACTIF', derniereConnexionLe: null },
  { id: 'compte-editeur', tenantId: TENANT_DELORIA, personneId: 'personne-editeur', identifiant: 'admin@kaya.ci', typeIdentifiant: 'EMAIL', etat: 'ACTIF', derniereConnexionLe: null },
  /**
   * ⚠️ LE SEUL COMPTE NON `ACTIF` DU JEU, ET IL EXISTE POUR ÊTRE REFUSÉ.
   *
   * Mariam a quitté l'établissement ; son compte est suspendu, pas supprimé —
   * c'est le cas ordinaire, et le journal des actions le suppose. À la
   * connexion, il rend **la même phrase** qu'un identifiant inconnu : dire
   * « ce compte est suspendu » confirmerait qu'il existe, et publierait la
   * liste par la porte de derrière. Il ne porte **aucun rôle** : rien à
   * résoudre, rien à afficher.
   */
  { id: 'compte-mariam', tenantId: TENANT_DELORIA, personneId: 'personne-mariam', identifiant: '+2250700000005', typeIdentifiant: 'TELEPHONE', etat: 'SUSPENDU', derniereConnexionLe: null },
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
  /**
   * ⚠️ AJOUTÉE AU CYCLE F2, ET LE MANQUE ÉTAIT RÉEL. Le catalogue ne portait
   * **aucune permission de bar** : une serveuse pouvait prendre une commande au
   * restaurant et pas au comptoir du bar, alors que Deloria en a un et
   * qu'Aminata y sert. Le défaut ne se voyait pas tant que rien ne dérivait le
   * poste ; il rendait le calcul FAUX — un seul point de vente atteignable pour
   * tout le monde, donc **jamais** la forme courte de l'en-tête, donc FR-030c
   * intenable et invérifiable.
   *
   * ⚠️ ET C'EST UNE PERMISSION DISTINCTE, PAS UNE PERMISSION TRANSVERSE. Le bar
   * est un `module_activite` à part entière, avec ses points de vente ; rendre
   * « prendre une commande » transverse l'aurait fait valoir sur un module que
   * l'établissement n'a pas.
   */
  { id: 'perm-commande-prendre-bar', tenantId: TENANT_DELORIA, code: 'ventes.commande.prendre.bar', moduleActiviteCode: 'BAR', libelle: 'Prendre une commande au bar' },
  /**
   * ⚠️ **LE MÊME MANQUE QUE POUR LE BAR, RESTÉ UN CYCLE DE PLUS.** Le pressing
   * est un `module_activite` à part entière, et le catalogue ne portait aucune
   * permission pour lui : l'accueil comme la navigation exigeaient
   * `ventes.commande.prendre` — qui appartient à **RESTAURATION**. Conséquence
   * exacte : chez un hôtel qui a un pressing et **pas** de restaurant, le
   * pressing disparaissait de l'écran, et il disparaissait *silencieusement*,
   * exactement comme si l'établissement ne l'offrait pas.
   *
   * ⚠️ **ET IL A FALLU UN TEST POUR LE VOIR.** Rien ne rougissait : sur Deloria,
   * qui a les deux modules, la permission de restauration était accordée, donc
   * l'entrée s'affichait. Le défaut ne serait apparu que chez le premier client
   * mono-service — c'est-à-dire en production.
   */
  { id: 'perm-commande-prendre-pressing', tenantId: TENANT_DELORIA, code: 'ventes.commande.prendre.pressing', moduleActiviteCode: 'PRESSING', libelle: 'Enregistrer un dépôt de pressing' },
  { id: 'perm-commande-remise', tenantId: TENANT_DELORIA, code: 'ventes.commande.remise', moduleActiviteCode: 'RESTAURATION', libelle: 'Appliquer une remise' },
  { id: 'perm-pilotage-lire', tenantId: TENANT_DELORIA, code: 'pilotage.lire', moduleActiviteCode: null, libelle: 'Consulter les chiffres' },
  { id: 'perm-etablissement-gerer', tenantId: TENANT_DELORIA, code: 'etablissement.gerer', moduleActiviteCode: null, libelle: 'Régler l’établissement' },
]

/**
 * Ce que chaque rôle peut faire. En base c'est `role_permission` ; ce cycle ne
 * peuple pas la table, il en porte la projection nécessaire au calcul d'union.
 */
export const permissionsParRole: Readonly<Record<string, readonly string[]>> = {
  // ⚠️ `ventes.commande.prendre` AJOUTÉ AU CYCLE F2, SUR CONSTAT. Le rôle
  // portait « appliquer une remise » sans porter « prendre une commande » —
  // c'est-à-dire le droit de corriger une commande sans celui d'en ouvrir une.
  // Le manque ne se voyait pas tant qu'aucun écran ne composait par permission ;
  // il rendait l'accueil du maquis vide pour Yao, qui en est le GÉRANT.
  // ⚠️ `ventes.commande.prendre.pressing` AJOUTÉE AU CYCLE F3, MÊME MOTIF QUE LE
  // BAR. Elle va au gérant et au serveur, exactement comme celle du bar : le
  // pressing est un comptoir de vente, et qui prend une commande prend un dépôt.
  //
  // ⚠️ ELLE A D'ABORD ÉTÉ DONNÉE À LA RÉCEPTIONNISTE, sur l'idée que « le linge
  // se dépose au comptoir ». C'était une supposition, pas une observation — et
  // `poste-derive.spec.ts` l'a immédiatement rougie : Yao, réceptionniste à
  // Deloria, se voyait attribuer le poste **« Pressing »**, seul point de vente
  // qu'il atteignait. Un fait inventé dans le jeu ressort en fait affirmé à
  // l'écran. La question « qui enregistre un dépôt ? » se tranche à l'atelier
  // terrain, pas ici.
  gerant: ['hebergement.passage.ouvrir', 'hebergement.sejour.arrivee', 'hebergement.sejour.depart', 'ventes.commande.prendre', 'ventes.commande.prendre.bar', 'ventes.commande.prendre.pressing', 'ventes.commande.remise', 'pilotage.lire', 'etablissement.gerer'],
  caissier: ['caisse.encaisser', 'caisse.cloture'],
  receptionniste: ['hebergement.passage.ouvrir', 'hebergement.sejour.arrivee', 'hebergement.sejour.depart'],
  serveur: ['ventes.commande.prendre', 'ventes.commande.prendre.bar', 'ventes.commande.prendre.pressing'],
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
 *
 * ⚠️ **LE MÊME BARÈME SUR LES CINQ CATÉGORIES, ET LE MOTIF EST ÉCRIT.** Le
 * cadrage §5.3 relève **un** barème à Deloria — 1 h = 1 500, 4 h = 5 000, heure
 * supplémentaire 1 200 — et précise qu'il est « éditable **par catégorie** ».
 * L'appliquer aux cinq est la seule lecture qui **n'invente aucun chiffre** :
 * inventer un tarif par catégorie ferait entrer au jeu des valeurs de référence
 * que personne n'a relevées, et le laisser sur la seule catégorie standard
 * rendrait **quatorze chambres sur dix-sept invendables au passage** — un état
 * « tout est pris » qui ne porterait jamais que trois chambres, et un écran
 * `R4` dont la grille serait décorative. *Le relevé du terrain (jalon J0) le
 * tranchera ; d'ici là, le jeu ne devine pas.*
 */
export const baremePaliers: readonly BaremePalier[] = CATEGORIES_DELORIA.flatMap((c) => {
  const formuleId = `deloria-formule-${c.cle}-passage`
  return [
    { id: `deloria-palier-${c.cle}-60`, tenantId: TENANT_DELORIA, formuleId, dureeMinutes: 60, prix: 1500, codeDevise: 'XOF', estHeureSupplementaire: false },
    { id: `deloria-palier-${c.cle}-120`, tenantId: TENANT_DELORIA, formuleId, dureeMinutes: 120, prix: 2800, codeDevise: 'XOF', estHeureSupplementaire: false },
    { id: `deloria-palier-${c.cle}-180`, tenantId: TENANT_DELORIA, formuleId, dureeMinutes: 180, prix: 4000, codeDevise: 'XOF', estHeureSupplementaire: false },
    { id: `deloria-palier-${c.cle}-240`, tenantId: TENANT_DELORIA, formuleId, dureeMinutes: 240, prix: 5000, codeDevise: 'XOF', estHeureSupplementaire: false },
    { id: `deloria-palier-${c.cle}-sup`, tenantId: TENANT_DELORIA, formuleId, dureeMinutes: 60, prix: 1200, codeDevise: 'XOF', estHeureSupplementaire: true },
  ]
})

/** ⚠️ Les deux plages valent pour les cinq catégories — même motif que le barème. */
export const plagesDemiJournee: readonly PlageDemiJournee[] = CATEGORIES_DELORIA.flatMap((c) => [
  { id: `deloria-plage-${c.cle}-matinee`, tenantId: TENANT_DELORIA, formuleId: `deloria-formule-${c.cle}-demi-journee`, libelle: 'Matinée', heureDebut: '08:00', heureFin: '12:00' },
  { id: `deloria-plage-${c.cle}-apres-midi`, tenantId: TENANT_DELORIA, formuleId: `deloria-formule-${c.cle}-demi-journee`, libelle: 'Après-midi', heureDebut: '13:00', heureFin: '16:00' },
])

/**
 * Le temps de remise en état — intégré à l'intervalle d'indisponibilité.
 *
 * ⚠️ **LES DEUX RATTACHEMENTS SONT RENSEIGNÉS, ET C'ÉTAIT UN ÉCART.** Le jeu du
 * cycle F1 posait `categorieId: null`, alors que `97-hebergement.sql` déclare
 * `categorie_id UUID **NOT NULL**` **et** `formule_id UUID **NOT NULL**` —
 * l'unicité porte d'ailleurs sur le **couple**, et c'est ce qui fait de cette
 * table autre chose qu'une colonne mal placée. Le test de conformité ne
 * comparait que les **noms** de colonnes, pas leur nullité : l'écart est passé.
 * *Corrigé ici, au premier cycle qui LIT cette table pour refuser une chambre.*
 */
export const tempsRemiseEnEtat: readonly TempsRemiseEnEtat[] = CATEGORIES_DELORIA.flatMap((c) => [
  { id: `deloria-remise-${c.cle}-passage`, tenantId: TENANT_DELORIA, categorieId: `deloria-categorie-${c.cle}`, formuleId: `deloria-formule-${c.cle}-passage`, dureeMinutes: 30 },
  { id: `deloria-remise-${c.cle}-nuitee`, tenantId: TENANT_DELORIA, categorieId: `deloria-categorie-${c.cle}`, formuleId: `deloria-formule-${c.cle}-nuitee`, dureeMinutes: 120 },
  { id: `deloria-remise-${c.cle}-demi`, tenantId: TENANT_DELORIA, categorieId: `deloria-categorie-${c.cle}`, formuleId: `deloria-formule-${c.cle}-demi-journee`, dureeMinutes: 60 },
])

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

// ###########################################################################
// LE MOUVEMENT — les douze jeux de cas du cycle F3
//
// ⚠️ TOUTES LES DATES SONT RELATIVES À L'HORLOGE DE LA COUTURE, JAMAIS
// ABSOLUES. *Un jeu daté en dur cesse d'exercer ses cas le lendemain, et le
// test devient vert en ne testant plus rien* — le pire des deux mondes. C'est
// pourquoi le mouvement est produit par des FONCTIONS et non par des
// constantes : une constante fige l'instant du chargement du module, et une
// application ouverte à 8 h montrerait encore « aujourd'hui » à 23 h.
//
// ⚠️ ET « RÉSIDENCE TEST » NE REÇOIT AUCUN MOUVEMENT. C'est le contrôle du
// principe 2 : un établissement sans hébergement actif ne doit voir AUCUNE
// surface de ce cycle — pas une liste vide, RIEN.
// ###########################################################################

/** Le téléphone du client connu — celui que `R4` reconnaît sans validation. */
export const TELEPHONE_CLIENT_CONNU = '0708441290'

/** L'unité que le client connu reprend — sa « chambre habituelle ». */
export const UNITE_HABITUELLE_CLIENT_CONNU = 'deloria-unite-b3'

/**
 * LES PERSONNES CLIENTES — **distinctes des employés**, et dans la même table.
 *
 * ⚠️ AUCUNE DONNÉE D'IDENTITÉ N'EST DUPLIQUÉE DANS `hebergement.client` : le
 * nom, les prénoms et la pièce vivent ici, et **nulle part ailleurs**. La purge
 * de rétention (TRX-06) n'a ainsi qu'une cible.
 */
export const personnesClientes: readonly Personne[] = [
  { id: 'personne-cliente-kouame', tenantId: TENANT_DELORIA, nom: 'Kouamé', prenoms: 'Yao Bernard', nomNormalise: 'kouame yao bernard', email: null, typePiece: 'CNI', numeroPiece: 'CI0034215', pieceCaptureeLe: null },
  { id: 'personne-cliente-traore', tenantId: TENANT_DELORIA, nom: 'Traoré', prenoms: 'Adama', nomNormalise: 'traore adama', email: null, typePiece: 'PASSEPORT', numeroPiece: 'CI2210447', pieceCaptureeLe: null },
  { id: 'personne-cliente-diomande', tenantId: TENANT_DELORIA, nom: 'Diomandé', prenoms: 'Fatoumata', nomNormalise: 'diomande fatoumata', email: null, typePiece: 'CNI', numeroPiece: 'CI0091883', pieceCaptureeLe: null },
]

/**
 * ⚠️ TROIS FICHES CLIENTES, ET LA FEMME DE MÉNAGE N'EN EST PAS UNE. Chercher
 * « Kouamé » à la réception ne doit pas remonter le personnel : c'est la table
 * `client` qui QUALIFIE une personne de cliente, et la recherche joint les deux.
 */
export const clients: readonly Client[] = [
  { id: 'client-kouame', tenantId: TENANT_DELORIA, personneId: 'personne-cliente-kouame', nationalite: 'Ivoirienne', adresse: 'Abengourou', categorieCommerciale: null, noteInterne: 'Préfère le premier étage.', creeLe: '2026-01-12T09:00:00.000Z', modifieLe: '2026-01-12T09:00:00.000Z' },
  { id: 'client-traore', tenantId: TENANT_DELORIA, personneId: 'personne-cliente-traore', nationalite: 'Ivoirienne', adresse: 'Abidjan, Cocody', categorieCommerciale: 'entreprise', noteInterne: null, creeLe: '2026-02-03T11:00:00.000Z', modifieLe: '2026-02-03T11:00:00.000Z' },
  { id: 'client-diomande', tenantId: TENANT_DELORIA, personneId: 'personne-cliente-diomande', nationalite: 'Ivoirienne', adresse: 'Bouaké', categorieCommerciale: null, noteInterne: null, creeLe: '2026-03-21T15:00:00.000Z', modifieLe: '2026-03-21T15:00:00.000Z' },
]

/** Le téléphone de chaque cliente — `comptes.compte` ne les porte pas : ce ne sont pas des comptes. */
export const telephonesClients: Readonly<Record<string, string>> = {
  'client-kouame': TELEPHONE_CLIENT_CONNU,
  'client-traore': '0709112233',
  'client-diomande': '0575884411',
}

/** Tout ce que la couture de la réception lit et écrit. */
export interface MouvementSimule {
  readonly occupations: readonly Occupation[]
  readonly sejours: readonly Sejour[]
  readonly notes: readonly NoteSejour[]
  readonly lignes: readonly LigneSejour[]
  readonly accompagnants: readonly Accompagnant[]
  readonly fichesPolice: readonly FichePolice[]
  readonly numerotations: readonly NumerotationFichePolice[]
  readonly constatsTaxe: readonly TaxeSejourConstat[]
}

/** Les codes des chambres, dans l'ordre de la grille. Jamais la salle de réunion. */
export const CODES_CHAMBRES: readonly string[] = CATEGORIES_DELORIA.flatMap((c) => c.codes)

/** L'identifiant d'unité d'un code de chambre. */
export function uniteDuCode(code: string): string {
  return `deloria-unite-${code.toLowerCase()}`
}

/** La catégorie d'une unité, lue au jeu plutôt que devinée du code. */
export function categorieDeLUnite(uniteId: string): string {
  return unites.find((u) => u.id === uniteId)?.categorieId ?? 'deloria-categorie-standard'
}

/** La clé de catégorie — « standard », « classique »… — d'une unité. */
function cleDeLUnite(uniteId: string): string {
  return categorieDeLUnite(uniteId).replace('deloria-categorie-', '')
}

/** La formule d'une unité pour un type donné. */
export function formuleDeLUnite(uniteId: string, type: 'passage' | 'nuitee' | 'demi-journee'): string {
  return `deloria-formule-${cleDeLUnite(uniteId)}-${type}`
}

interface OptionsOccupation {
  readonly motif?: MotifOccupation
  readonly statut?: StatutOccupation
  readonly remiseMinutes?: number
  readonly origineType?: string | null
  readonly origineId?: string | null
}

function occupationDuJeu(
  id: string,
  uniteId: string,
  debut: string,
  fin: string,
  options: OptionsOccupation = {},
): Occupation {
  const remise = options.remiseMinutes ?? 30
  return {
    id,
    tenantId: TENANT_DELORIA,
    uniteId,
    motif: options.motif ?? 'SEJOUR',
    periode: { debut, fin },
    periodeIndisponibilite: { debut, fin: decale(fin, remise) },
    statut: options.statut ?? 'ACTIVE',
    origineType: options.origineType ?? 'sejour',
    origineId: options.origineId ?? `sejour-${id}`,
    horodatageClient: null,
    creeLe: debut,
  }
}

function sejourDuJeu(
  id: string,
  occupation: Occupation,
  formuleId: string,
  options: { clientId?: string | null; etat?: Sejour['etat']; partiLe?: string | null } = {},
): Sejour {
  return {
    id,
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_DELORIA,
    clientId: options.clientId ?? null,
    uniteId: occupation.uniteId,
    formuleId,
    occupationId: occupation.id,
    reservationId: null,
    etat: options.etat ?? 'EN_COURS',
    arriveLe: occupation.periode.debut,
    partiLe: options.partiLe ?? null,
    horodatageClient: null,
    creeLe: occupation.periode.debut,
  }
}

function noteDuJeu(id: string, sejour: Sejour, etat: NoteSejour['etat'], total: number): NoteSejour {
  return {
    id,
    tenantId: TENANT_DELORIA,
    sejourId: sejour.id,
    etat,
    arreteeLe: etat === 'ARRETEE' ? sejour.partiLe ?? sejour.arriveLe : null,
    totalProvisoire: total,
    codeDevise: 'XOF',
    horodatageClient: null,
    creeLe: sejour.arriveLe,
  }
}

function ligneDuJeu(
  id: string,
  noteId: string,
  type: TypeLigneSejour,
  libelle: string,
  prixUnitaire: number,
  quantite = 1,
  tauxTva = '18',
  creeLe = '',
): LigneSejour {
  return {
    id,
    tenantId: TENANT_DELORIA,
    noteSejourId: noteId,
    type,
    libelle,
    quantite,
    prixUnitaire,
    codeDevise: 'XOF',
    tauxTva,
    ligneCommandeId: null,
    sejourOrigineId: null,
    bonDepotId: null,
    horodatageClient: null,
    creeLe: creeLe || jourA(12),
  }
}

/**
 * CAS 1 · LA SEMAINE CALME — neuf occupations, et les huit cas ponctuels.
 *
 * ⚠️ LES CAS PONCTUELS VIVENT DANS LE JEU NOMINAL, PAS DERRIÈRE UN LEVIER. Une
 * réception ordinaire porte en même temps un séjour en cours, un séjour
 * terminé, un passage dépassé et une chambre en remise en état : les séparer en
 * autant de scénarios aurait rendu chacun vrai seul et faux ensemble.
 */
function jeuNominal(): MouvementSimule {
  const occupations: Occupation[] = []
  const sejours: Sejour[] = []
  const notes: NoteSejour[] = []
  const lignes: LigneSejour[] = []
  const accompagnants: Accompagnant[] = []
  const fichesPolice: FichePolice[] = []
  const constatsTaxe: TaxeSejourConstat[] = []

  // ── La semaine calme · neuf occupations réparties sur sept jours ──────────
  const calme: readonly [string, string, number, number, number][] = [
    // [code, id, jour, heure de début, durée en heures]
    ['A1', 1, -2, 14, 24],
    ['B2', 2, -1, 15, 3],
    ['B4', 3, -1, 20, 36],
    ['C2', 4, 0, 9, 4],
    ['C4', 5, 1, 14, 24],
    ['D2', 6, 2, 14, 48],
    ['E2', 7, 3, 10, 2],
    ['E3', 8, 4, 14, 24],
    ['A3', 9, 5, 16, 3],
  ].map(([code, rang, jour, heure, duree]) => [
    code as string,
    `occ-calme-${rang}`,
    jour as number,
    heure as number,
    duree as number,
  ])

  for (const [code, id, jour, heure, duree] of calme) {
    const uniteId = uniteDuCode(code)
    const debut = jourA(heure, jour)
    occupations.push(
      occupationDuJeu(id, uniteId, debut, decale(debut, duree * 60), {
        remiseMinutes: duree >= 12 ? 120 : 30,
      }),
    )
  }

  // ── CAS 4 · la chambre prise MAINTENANT — le refus `UNITE_DEJA_OCCUPEE` ───
  // ⚠️ C'est la paire chevauchante « à la seconde près » : toute demande sur
  // cette chambre, à cet instant, mord sur elle.
  const priseMaintenant = occupationDuJeu(
    'occ-prise-maintenant',
    uniteDuCode('B1'),
    decale(instantAutorite(), -60),
    decale(instantAutorite(), 24 * 60),
  )
  occupations.push(priseMaintenant)

  // ── CAS 5 · la chambre dont la REMISE EN ÉTAT couvre la demande ───────────
  // ⚠️ CELUI QU'ON OUBLIE, parce que la chambre PARAÎT libre : son occupation
  // est finie, son ménage court encore. Deux heures de remise en état après une
  // nuitée qui s'est achevée il y a une heure.
  occupations.push(
    occupationDuJeu(
      'occ-remise-en-cours',
      uniteDuCode('C1'),
      decale(instantAutorite(), -12 * 60),
      decale(instantAutorite(), -60),
      { remiseMinutes: 120, statut: 'TERMINEE' },
    ),
  )

  // ── CAS 6 · LE SÉJOUR DE 4 NUITS, 2 PERSONNES — la note de `R7` ───────────
  //
  // ⚠️ LES MONTANTS SONT CEUX DE LA MAQUETTE `R7-note-depart.html`, À UNE
  // EXCEPTION QUI EST TOUT LE POINT : la taxe de séjour vaut **500 F**, pas
  // 4 000 F. La maquette est antérieure à la clôture de la décision B-10 — la
  // taxe se compte par nuitée et par séjour, jamais par personne. Total :
  // 237 000 + 42 660 + 500 + 2 700 = **282 860 F**, et non 286 360 F.
  //
  // ⚠️ ET LA NUIT EST À 45 000 F alors que la Supérieure B est à 25 000 : c'est
  // le **tarif entreprise** que la maquette annonce, et le client porte
  // `categorieCommerciale: 'entreprise'`. Le prix d'une ligne est ce qui a été
  // facturé, jamais le prix de base recopié.
  const arriveeLongue = decale(jourA(14), -4 * 24 * 60)
  const occupationLongue = occupationDuJeu(
    'occ-sejour-long',
    uniteDuCode('E1'),
    arriveeLongue,
    jourA(12),
    { remiseMinutes: 120 },
  )
  occupations.push(occupationLongue)
  const sejourLong = sejourDuJeu(
    'sejour-long',
    occupationLongue,
    formuleDeLUnite(uniteDuCode('E1'), 'nuitee'),
    { clientId: 'client-traore' },
  )
  sejours.push(sejourLong)
  notes.push(noteDuJeu('note-sejour-long', sejourLong, 'OUVERTE', 282_860))

  const NUIT = 45_000
  for (let nuit = 0; nuit < 4; nuit += 1) {
    lignes.push(
      ligneDuJeu(
        `ligne-long-nuit-${nuit + 1}`,
        'note-sejour-long',
        'HEBERGEMENT',
        `Nuit ${nuit + 1} sur 4`,
        NUIT,
        1,
        '18',
        decale(arriveeLongue, nuit * 24 * 60),
      ),
    )
  }
  const consommations: readonly [string, TypeLigneSejour, string, number, number][] = [
    ['ligne-long-diner', 'CONSOMMATION', 'Dîner — deux couverts', 12_500, -4],
    ['ligne-long-petit-dejeuner', 'CONSOMMATION', 'Petit déjeuner — deux personnes', 8_000, -3],
    ['ligne-long-dejeuner', 'CONSOMMATION', 'Déjeuner — un couvert', 8_000, -2],
    ['ligne-long-flag', 'CONSOMMATION', 'Flag 65 cl — six bouteilles', 6_000, -3],
    ['ligne-long-eau', 'CONSOMMATION', 'Eau minérale 1,5 l — cinq bouteilles', 3_500, -2],
    ['ligne-long-pressing', 'PRESSING', 'Blanchisserie — six pièces', 4_000, -3],
    ['ligne-long-navette', 'DIVERS', 'Navette aéroport — aller', 15_000, -4],
  ]
  for (const [id, type, libelle, prix, jour] of consommations) {
    lignes.push(ligneDuJeu(id, 'note-sejour-long', type, libelle, prix, 1, '18', jourA(19, jour)))
  }
  // ── Les trois taxes, chacune UNE LIGNE DISTINCTE avec son assiette ────────
  lignes.push(
    ligneDuJeu('ligne-long-tva', 'note-sejour-long', 'TAXE', 'TVA 18 %', 42_660, 1, '0'),
    // ⚠️ 500 F, ET NON 4 000 : par nuitée et par séjour, jamais par personne.
    ligneDuJeu('ligne-long-taxe-sejour', 'note-sejour-long', 'TAXE', 'Taxe de séjour', 500, 1, '0'),
    ligneDuJeu('ligne-long-tdt', 'note-sejour-long', 'TAXE', 'Taxe de développement touristique', 2_700, 1, '0'),
  )
  accompagnants.push({
    id: 'accompagnant-long',
    tenantId: TENANT_DELORIA,
    sejourId: 'sejour-long',
    nom: 'Traoré',
    prenoms: 'Salimata',
    typePiece: 'CNI',
    numeroPiece: 'CI0077412',
    estMineur: false,
    horodatageClient: null,
    creeLe: arriveeLongue,
  })
  fichesPolice.push({
    id: 'fiche-sejour-long',
    tenantId: TENANT_DELORIA,
    sejourId: 'sejour-long',
    etablissementId: ETABLISSEMENT_DELORIA,
    numero: '1',
    annee: new Date(arriveeLongue).getUTCFullYear(),
    complete: true,
    emiseLe: arriveeLongue,
    contenu: { nom: 'Traoré', prenoms: 'Adama', piece: 'PASSEPORT CI2210447', accompagnants: 1 },
    horodatageClient: null,
    creeLe: arriveeLongue,
  })

  // ── CAS 7 et 8 · le séjour TERMINÉ, dont la note est ARRÊTÉE ──────────────
  // ⚠️ Les deux vont ensemble : c'est sur cette note qu'une consommation
  // tardive se présentera, et sera REFUSÉE — l'ancêtre du cas orphelin.
  const departPasse = decale(jourA(12), -24 * 60)
  const occupationClose = occupationDuJeu(
    'occ-sejour-clos',
    uniteDuCode('D1'),
    decale(departPasse, -22 * 60),
    departPasse,
    { remiseMinutes: 120, statut: 'TERMINEE' },
  )
  occupations.push(occupationClose)
  const sejourClos = sejourDuJeu(
    'sejour-clos',
    occupationClose,
    formuleDeLUnite(uniteDuCode('D1'), 'nuitee'),
    { clientId: 'client-diomande', etat: 'TERMINE', partiLe: departPasse },
  )
  sejours.push(sejourClos)
  notes.push(noteDuJeu('note-sejour-clos', sejourClos, 'ARRETEE', 20_500))
  lignes.push(
    ligneDuJeu('ligne-clos-nuit', 'note-sejour-clos', 'HEBERGEMENT', 'Nuit 1 sur 1', 20_000, 1, '18', occupationClose.periode.debut),
    ligneDuJeu('ligne-clos-taxe', 'note-sejour-clos', 'TAXE', 'Taxe de séjour', 500, 1, '0', departPasse),
  )
  constatsTaxe.push({
    id: 'constat-sejour-clos',
    tenantId: TENANT_DELORIA,
    sejourId: 'sejour-clos',
    nuiteesAssujetties: 1,
    nombrePersonnes: 1,
    montantUnitaire: TAXE_NUITEE_MINEUR,
    montantTotal: TAXE_NUITEE_MINEUR,
    codeDevise: 'XOF',
    regleAppliquee: 'une_nuitee_par_occupation',
    constateLe: departPasse,
    horodatageClient: null,
    creeLe: departPasse,
  })

  // ── CAS 9 · LE PASSAGE DÉPASSÉ — deux heures payées, plus de trois occupées
  const debutDepasse = decale(instantAutorite(), -3 * 60 - 20)
  const occupationDepassee = occupationDuJeu(
    'occ-passage-depasse',
    uniteDuCode('A2'),
    debutDepasse,
    decale(debutDepasse, 120),
  )
  occupations.push(occupationDepassee)
  const sejourDepasse = sejourDuJeu(
    'sejour-passage-depasse',
    occupationDepassee,
    formuleDeLUnite(uniteDuCode('A2'), 'passage'),
  )
  sejours.push(sejourDepasse)
  notes.push(noteDuJeu('note-passage-depasse', sejourDepasse, 'OUVERTE', 2_800))
  lignes.push(
    ligneDuJeu('ligne-depasse-hebergement', 'note-passage-depasse', 'HEBERGEMENT', 'Passage 2 h', 2_800, 1, '18', debutDepasse),
  )

  // ── CAS 10 · LE PASSAGE AU-DELÀ DU SEUIL — plus de 480 min ────────────────
  const debutLongPassage = decale(instantAutorite(), -8 * 60 - 30)
  const occupationSeuil = occupationDuJeu(
    'occ-passage-seuil',
    uniteDuCode('B5'),
    debutLongPassage,
    decale(debutLongPassage, 240),
  )
  occupations.push(occupationSeuil)
  const sejourSeuil = sejourDuJeu(
    'sejour-passage-seuil',
    occupationSeuil,
    formuleDeLUnite(uniteDuCode('B5'), 'passage'),
  )
  sejours.push(sejourSeuil)
  notes.push(noteDuJeu('note-passage-seuil', sejourSeuil, 'OUVERTE', 5_000))
  lignes.push(
    ligneDuJeu('ligne-seuil-hebergement', 'note-passage-seuil', 'HEBERGEMENT', 'Passage 4 h', 5_000, 1, '18', debutLongPassage),
  )

  // ── CAS 11 · LE CLIENT CONNU, SEPTIÈME PASSAGE ───────────────────────────
  // ⚠️ SIX SÉJOURS CLOS, et c'est ce qui rend « sa chambre habituelle »
  // calculable plutôt qu'affirmée : B3 revient cinq fois sur six.
  const habituelles = ['B3', 'B3', 'B3', 'C3', 'B3', 'B3']
  habituelles.forEach((code, rang) => {
    const debut = decale(jourA(15), -(rang + 1) * 21 * 24 * 60)
    const occupation = occupationDuJeu(`occ-kouame-${rang + 1}`, uniteDuCode(code), debut, decale(debut, 180), {
      statut: 'TERMINEE',
    })
    occupations.push(occupation)
    const sejour = sejourDuJeu(
      `sejour-kouame-${rang + 1}`,
      occupation,
      formuleDeLUnite(uniteDuCode(code), 'passage'),
      { clientId: 'client-kouame', etat: 'TERMINE', partiLe: occupation.periode.fin },
    )
    sejours.push(sejour)
    notes.push(noteDuJeu(`note-kouame-${rang + 1}`, sejour, 'ARRETEE', 4_000))
    lignes.push(
      ligneDuJeu(`ligne-kouame-${rang + 1}`, `note-kouame-${rang + 1}`, 'HEBERGEMENT', 'Passage 3 h', 4_000, 1, '18', debut),
    )
  })

  return {
    occupations,
    sejours,
    notes,
    lignes,
    accompagnants,
    fichesPolice,
    numerotations: [numerotationCourante(fichesPolice.length)],
    constatsTaxe,
  }
}

/**
 * CAS 2 · LA SEMAINE DENSE — trente-quatre occupations, passages, demi-journées
 * et nuits mêlés.
 *
 * ⚠️ C'EST LE CAS QUI ÉPROUVE LE RUBAN. Sur un axe linéaire, un passage de 3 h
 * occuperait 1,8 % de la largeur d'une semaine — 19 px sur 1 040, illisible.
 * Le jeu doit donc porter les trois durées **le même jour**, sur des chambres
 * voisines : c'est là que l'échelle élastique se prouve ou se dément.
 */
function jeuDense(): MouvementSimule {
  const occupations: Occupation[] = []
  let rang = 0

  for (let jour = -1; jour <= 5; jour += 1) {
    // Trois nuitées par jour, sur des chambres tournantes.
    for (let n = 0; n < 2; n += 1) {
      const code = CODES_CHAMBRES[(jour + 1 + n * 5) % CODES_CHAMBRES.length]!
      const debut = jourA(14, jour)
      rang += 1
      occupations.push(
        occupationDuJeu(`occ-dense-${rang}`, uniteDuCode(code), debut, decale(debut, 22 * 60), {
          remiseMinutes: 120,
        }),
      )
    }
    // Deux passages courts, aux heures creuses et pleines.
    for (const [heure, duree, decalage] of [
      [10, 120, 2],
      [16, 180, 7],
    ] as const) {
      const code = CODES_CHAMBRES[(jour + 1 + decalage) % CODES_CHAMBRES.length]!
      const debut = jourA(heure, jour)
      rang += 1
      occupations.push(occupationDuJeu(`occ-dense-${rang}`, uniteDuCode(code), debut, decale(debut, duree)))
    }
    // Une demi-journée, plage « Matinée » de l'établissement.
    // ⚠️ SAUF LE DERNIER JOUR, et ce n'est pas un décompte arbitraire : une
    // semaine dense n'est pas une semaine RÉGULIÈRE. Sept jours identiques
    // produiraient un ruban à motif, où l'œil suit la répétition au lieu de
    // lire les durées — exactement ce que l'écran doit permettre de faire.
    if (jour === 5) continue
    const codeDemi = CODES_CHAMBRES[(jour + 1 + 12) % CODES_CHAMBRES.length]!
    const debutDemi = jourA(8, jour)
    rang += 1
    occupations.push(
      occupationDuJeu(`occ-dense-${rang}`, uniteDuCode(codeDemi), debutDemi, decale(debutDemi, 240), {
        remiseMinutes: 60,
      }),
    )
  }

  return {
    occupations,
    sejours: [],
    notes: [],
    lignes: [],
    accompagnants: [],
    fichesPolice: [],
    numerotations: [numerotationCourante(0)],
    constatsTaxe: [],
  }
}

/**
 * CAS 3 · TOUT EST PRIS — les dix-sept chambres occupées à l'instant courant.
 *
 * ⚠️ CE N'EST PAS UN ÉTAT VIDE : la maison est pleine, ce n'est pas une panne.
 * L'écran montre **ce qui se libère et quand**, et propose de **garder la
 * chambre** — d'où l'échelonnement des fins, sans lequel « ce qui se libère »
 * n'aurait rien à trier.
 */
function jeuComplet(): MouvementSimule {
  const occupations = CODES_CHAMBRES.map((code, rang) => {
    const debut = decale(instantAutorite(), -(120 + rang * 15))
    // Les fins s'échelonnent : la première chambre se libère dans une heure.
    return occupationDuJeu(`occ-complet-${rang + 1}`, uniteDuCode(code), debut, decale(debut, 180 + rang * 45))
  })

  return {
    occupations,
    sejours: [],
    notes: [],
    lignes: [],
    accompagnants: [],
    fichesPolice: [],
    numerotations: [numerotationCourante(0)],
    constatsTaxe: [],
  }
}

/** Le compteur de fiches de police de l'année courante. */
function numerotationCourante(dernierNumero: number): NumerotationFichePolice {
  const annee = new Date(instantAutorite()).getUTCFullYear()
  return {
    id: `deloria-numerotation-${annee}`,
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_DELORIA,
    annee,
    dernierNumero,
    horodatageClient: null,
    creeLe: instantAutorite(),
  }
}

/** Le mouvement du cas demandé. */
export function mouvementDeloria(cas: 'nominal' | 'dense' | 'complet'): MouvementSimule {
  if (cas === 'dense') return jeuDense()
  if (cas === 'complet') return jeuComplet()
  return jeuNominal()
}

/**
 * LE JEU DE VOLUMÉTRIE — dix mille fiches clientes, **séparé du jeu nominal**.
 *
 * ⚠️ IL NE SERT QU'À MESURER (SEJ-01, SC-019 : moins de 300 ms). Le mêler au
 * jeu nominal rendrait chaque écran de démonstration illisible, et la mesure
 * elle-même moins nette — on ne saurait plus ce qu'on chronomètre.
 *
 * ⚠️ ET IL EST ENGENDRÉ, PAS ÉCRIT. Dix mille lignes écrites à la main
 * pèseraient un mégaoctet dans le paquet servi au navigateur, pour une mesure
 * qui n'a lieu que dans un test.
 */
export function fichesVolumetrie(nombre = 10_000): {
  readonly personnes: readonly Personne[]
  readonly clients: readonly Client[]
} {
  const NOMS = ['Kouassi', 'Kouamé', 'Traoré', 'Diomandé', 'Bamba', 'Yao', 'Koné', 'Ouattara', 'Coulibaly', 'N’Guessan']
  const PRENOMS = ['Adjoua', 'Yao', 'Aminata', 'Bernard', 'Fatoumata', 'Salif', 'Mariam', 'Adama', 'Awa', 'Ibrahim']
  const personnesEngendrees: Personne[] = []
  const clientsEngendres: Client[] = []

  for (let rang = 0; rang < nombre; rang += 1) {
    const nom = NOMS[rang % NOMS.length]!
    const prenoms = PRENOMS[(rang * 7) % PRENOMS.length]!
    const id = `personne-volumetrie-${rang}`
    personnesEngendrees.push({
      id,
      tenantId: TENANT_DELORIA,
      nom,
      prenoms,
      nomNormalise: `${nom} ${prenoms}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, ''),
      email: null,
      typePiece: 'CNI',
      numeroPiece: `CI${String(1_000_000 + rang).slice(0, 7)}`,
      pieceCaptureeLe: null,
    })
    clientsEngendres.push({
      id: `client-volumetrie-${rang}`,
      tenantId: TENANT_DELORIA,
      personneId: id,
      nationalite: 'Ivoirienne',
      adresse: null,
      categorieCommerciale: null,
      noteInterne: null,
      creeLe: '2026-01-01T08:00:00.000Z',
      modifieLe: '2026-01-01T08:00:00.000Z',
    })
  }

  return { personnes: personnesEngendrees, clients: clientsEngendres }
}
