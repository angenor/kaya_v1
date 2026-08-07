/**
 * ⚠️ MÊME FORME QUE `docs/modele-donnees/97-hebergement.sql`.
 *
 * ⚠️ CE CYCLE PORTE LE **RÉFÉRENTIEL**, PAS LE MOUVEMENT. Aucune occupation,
 * aucun séjour, aucune réservation, aucune note, aucune fiche de police, aucun
 * client : ce sont des données de mouvement, et elles appartiennent aux cycles
 * F3 et F7. Conséquence directe : la contrainte d'exclusion GiST du principe 4
 * n'a rien à garantir ici.
 */

/** ← `hebergement.categorie` — « Type de chambre » à l'écran, jamais ce mot. */
export interface Categorie {
  readonly id: string
  readonly tenantId: string
  readonly etablissementId: string
  readonly nom: string
  readonly capaciteAccueil: number
  readonly ordre: number
  readonly actif: boolean
}

export const STATUTS_MENAGE = ['PROPRE', 'A_NETTOYER', 'EN_NETTOYAGE', 'HORS_SERVICE'] as const
export type StatutMenage = (typeof STATUTS_MENAGE)[number]

/** ← `hebergement.unite` — « chambre », « logement » ou « salle » à l'écran. */
export interface Unite {
  readonly id: string
  readonly tenantId: string
  readonly categorieId: string
  readonly code: string
  readonly etage: string | null
  readonly statutMenage: StatutMenage
  readonly actif: boolean
}

export const TYPES_FORMULE = ['NUITEE', 'PASSAGE', 'DEMI_JOURNEE', 'MENSUEL'] as const
export type TypeFormule = (typeof TYPES_FORMULE)[number]

export const REGLES_CONVERSION_TAXE = ['une_nuitee_par_occupation', 'au_prorata'] as const
export type RegleConversionTaxe = (typeof REGLES_CONVERSION_TAXE)[number]

/**
 * ← `hebergement.formule` — « Formule » à l'écran, jamais « tarif ».
 *
 * ⚠️ `prixBase` PORTE LE TARIF **HORS TAXE DE SÉJOUR**, ET C'EST LE POINT
 * FISCAL DU JEU. Le cadrage §2.1 porte un point de conformité explicite : les
 * tarifs affichés « incluent une augmentation de 500 FCFA par catégorie », ce
 * qui correspond à la taxe communale de nuitée — intégrée au prix au lieu
 * d'être une ligne distincte, elle place l'établissement EN INFRACTION.
 *
 * Le jeu simulé encode donc la forme CONFORME. Y écrire 12 500 avec
 * `assujettieTaxeNuitee = true` ferait COMPTER LA TAXE DEUX FOIS au premier
 * cycle qui calcule — et le défaut passerait pour un défaut de calcul.
 *
 * ⚠️ ET CE CYCLE NE CALCULE RIEN : il porte le référentiel, il ne le lit pas.
 * La décomposition HT/TVA appartient au cycle fiscal.
 */
export interface Formule {
  readonly id: string
  readonly tenantId: string
  readonly categorieId: string
  readonly type: TypeFormule
  /** Entier en unité mineure (principe 5). `null` quand un barème le remplace. */
  readonly prixBase: number | null
  readonly codeDevise: string
  readonly dureeMinMinutes: number | null
  readonly dureeMaxMinutes: number | null
  /** `HH:MM` — la forme d'un `TIME`. */
  readonly heureArriveeStandard: string | null
  readonly heureDepartStandard: string | null
  readonly joursAutorises: readonly number[] | null
  readonly assujettieTaxeNuitee: boolean
  readonly regleConversionTaxe: RegleConversionTaxe | null
  readonly actif: boolean
}

/** ← `hebergement.bareme_palier` — le barème de passage, à paliers dégressifs. */
export interface BaremePalier {
  readonly id: string
  readonly tenantId: string
  readonly formuleId: string
  readonly dureeMinutes: number
  readonly prix: number
  readonly codeDevise: string
  readonly estHeureSupplementaire: boolean
}

/**
 * ← `hebergement.plage_demi_journee`
 * ⚠️ LES PLAGES SONT CELLES DE L'ÉTABLISSEMENT, jamais écrites en dur : le
 * lexique l'exige pour le refus `plage_non_fractionnable`, dont la phrase les
 * REÇOIT.
 */
export interface PlageDemiJournee {
  readonly id: string
  readonly tenantId: string
  readonly formuleId: string
  readonly libelle: string
  readonly heureDebut: string
  readonly heureFin: string
}

/** ← `hebergement.temps_remise_en_etat` — intégré à l'indisponibilité. */
export interface TempsRemiseEnEtat {
  readonly id: string
  readonly tenantId: string
  readonly categorieId: string | null
  readonly formuleId: string | null
  readonly dureeMinutes: number
}
