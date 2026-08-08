/**
 * ⚠️ MÊME FORME QUE `docs/modele-donnees/20-comptes.sql`.
 *
 * ⚠️ TROIS ENTITÉS DISTINCTES, JAMAIS CONFONDUES (CPT-00) : `personne`
 * (identité civile), `compte` (identité d'authentification, porteuse des rôles),
 * `employe` (**provision vide — non peuplée**, principe 10).
 */

/** ← `comptes.personne` — l'identité civile. Jamais « utilisateur ». */
export interface Personne {
  readonly id: string
  readonly tenantId: string
  readonly nom: string
  readonly prenoms: string | null
  readonly nomNormalise: string
  readonly email: string | null
  readonly typePiece: string | null
  readonly numeroPiece: string | null
  /**
   * QUAND LA PIÈCE A ÉTÉ RELEVÉE. `null` tant qu'elle ne l'a pas été.
   *
   * ⚠️ **AJOUTÉE AU CYCLE F3, ET C'EST SON CYCLE.** Elle était exemptée au
   * cycle F1 avec le motif « donnée de MOUVEMENT : la pièce se capture à
   * l'arrivée, et c'est le cycle SEJ qui la peuple » — nous y sommes. Sans
   * elle, `R4` ne pourrait pas dire **ce qui est déjà connu et ne sera pas
   * redemandé**, qui est précisément ce qui fait tenir le parcours du client
   * reconnu en 5 taps.
   *
   * ⚠️ **ET ELLE PORTE LA RÉTENTION.** TRX-06 exige une purge à 90 jours ; sans
   * date de capture, il n'y a rien à purger — on ne saurait pas ce qui est vieux.
   */
  readonly pieceCaptureeLe: string | null
}

export const TYPES_IDENTIFIANT = ['TELEPHONE', 'EMAIL', 'CODE'] as const
export type TypeIdentifiant = (typeof TYPES_IDENTIFIANT)[number]

export const ETATS_COMPTE = ['ACTIF', 'SUSPENDU', 'REVOQUE'] as const
export type EtatCompte = (typeof ETATS_COMPTE)[number]

/**
 * ← `comptes.compte`
 *
 * ⚠️ `empreinte_mot_de_passe` N'EST PAS REPRIS. La colonne existe en base ; ce
 * type ne la porte pas. **Aucun secret dans le paquet servi au navigateur**
 * (cadrage §12.1, FR-094) — et il n'y a pas d'authentification dans ce cycle.
 * La colonne réapparaîtra côté serveur, en phase 3, et JAMAIS dans une réponse.
 */
export interface Compte {
  readonly id: string
  readonly tenantId: string
  readonly personneId: string
  readonly identifiant: string
  readonly typeIdentifiant: TypeIdentifiant
  readonly etat: EtatCompte
  readonly derniereConnexionLe: string | null
}

/** ← `comptes.role` */
export interface Role {
  readonly id: string
  readonly tenantId: string
  readonly code: string
  readonly libelle: string
}

/**
 * ← `comptes.compte_role`
 * ⚠️ `etablissementId` EST DANS LA TABLE DE LIAISON, et c'est ce qui permet des
 * rôles différents par site. M. Koffi est propriétaire sur DEUX établissements.
 */
export interface CompteRole {
  readonly id: string
  readonly tenantId: string
  readonly compteId: string
  readonly roleId: string
  readonly etablissementId: string | null
}

/** ← `comptes.permission` — `moduleActiviteCode` est nullable : transverse. */
export interface Permission {
  readonly id: string
  readonly tenantId: string
  readonly code: string
  readonly moduleActiviteCode: string | null
  readonly libelle: string
}
