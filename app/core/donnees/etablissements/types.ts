/**
 * ⚠️ MÊMES NOMS DE CHAMPS, MÊMES TYPES, MÊMES VALEURS D'ÉNUMÉRATION QUE
 * `docs/modele-donnees/10-etablissements.sql`. Le seul écart autorisé est
 * `snake_case → camelCase`, et le test de conformité applique la transformation
 * avant de comparer — il LIT le fichier SQL, donc il n'y a pas de seconde liste
 * à tenir, et elle ne peut pas diverger.
 */

/** ← `etablissements.tenant` */
export interface Tenant {
  readonly id: string
  readonly tenantId: string
  readonly code: string
  readonly raisonSociale: string
  readonly statut: string
  readonly estEditeur: boolean
}

/**
 * ← `etablissements.etablissement`
 *
 * ⚠️ `classement` EST UNE CHAÎNE, PAS UNE UNION FERMÉE. Le commentaire de la
 * table dit pourquoi : les valeurs sont propres à la juridiction, et les figer
 * imposerait une migration au second pays. **La simulation ne resserre pas ce
 * que la base laisse ouvert.**
 */
export interface Etablissement {
  readonly id: string
  readonly tenantId: string
  readonly code: string
  readonly nom: string
  readonly juridictionCode: string
  readonly classement: string
  readonly commune: string
  readonly fuseauHoraire: string
  readonly devise: string
  readonly adresse: string | null
  readonly ncc: string | null
}

/** Les classements ivoiriens — des CONSTANTES DOCUMENTÉES, pas un type. */
export const CLASSEMENTS_CI = ['NON_CLASSE', 'RESIDENCE_MEUBLEE'] as const

/** ← `etablissements.module_activite` — référentiel EN TABLE, jamais figé. */
export interface ModuleActivite {
  readonly id: string
  readonly tenantId: string
  readonly code: string
  readonly libelle: string
  readonly implementeAuMvp: boolean
}

/** ← `etablissements.etablissement_module` */
export interface EtablissementModule {
  readonly id: string
  readonly tenantId: string
  readonly etablissementId: string
  readonly moduleActiviteId: string
  readonly actif: boolean
  readonly activeLe: string | null
  readonly desactiveLe: string | null
}

/**
 * ← `etablissements.point_de_vente`
 * ⚠️ `avecTables: false` EST LE COMPTOIR. « L'absence de tables EST le
 * comptoir » (lexique) — jamais « point de vente sans tables ».
 */
export interface PointDeVente {
  readonly id: string
  readonly tenantId: string
  readonly etablissementId: string
  readonly moduleActiviteId: string
  readonly nom: string
  readonly avecTables: boolean
  readonly caisseId: string | null
}
