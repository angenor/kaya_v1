import type { ClasseHorsLigne } from '~/core/donnees/contrat'

/**
 * LES RÉGLAGES DE SCÉNARIO — l'état, hors de tout composant.
 *
 * ⚠️ CE MODULE N'EST PAS UN COMPOSABLE, ET C'EST VOULU. La COUCHE DE SIMULATION
 * doit le lire, et elle n'est pas un composant Vue : elle n'a ni `useState`, ni
 * cycle de vie. Le composable `useScenarios` l'enveloppe pour l'interface ; la
 * simulation, elle, lit directement.
 *
 * ⚠️ ET AUCUN COMPOSANT NE LE LIT JAMAIS. « Un composant qui saurait qu'un
 * scénario existe serait un composant à réécrire en phase 3 » : les leviers
 * s'appliquent DANS la simulation, qui disparaît au branchement — et les leviers
 * avec elle.
 */

export interface ReglagesScenario {
  /** Attente avant réponse, en millisecondes. */
  readonly latenceMs: number
  readonly echecReseau: boolean
  readonly horsLigne: boolean
  /** Les collections rendues vides — pour voir les états vides. */
  readonly jeuVide: boolean
  readonly compteActif: string
  readonly etablissementActif: string
  /**
   * LE CAS DU JEU DE MOUVEMENT — cycle F3.
   *
   * ⚠️ **CE N'EST PAS UN LEVIER DE PLUS, C'EST LE JEU LUI-MÊME.** Les trois
   * valeurs ne changent pas le comportement de la simulation : elles changent
   * ce qu'elle a à montrer. `complet` et `dense` sont **exclusifs** du nominal
   * parce qu'une maison pleine et une maison calme ne peuvent pas être vraies
   * en même temps.
   */
  readonly casDuJeu: CasDuJeu
  /**
   * L'ÉCART DE L'HORLOGE DE L'APPAREIL, EN SECONDES, **signé**.
   *
   * ⚠️ **IL NE SERT QU'À CONSTATER, JAMAIS À CALCULER** : les durées et les
   * montants restent sur l'horloge d'autorité, et l'écran le dit.
   */
  readonly deriveHorlogeSecondes: number
  /**
   * L'ISSUE QUE L'ENVOI FISCAL RENDRA — cycle F3, US5.
   *
   * ⚠️ **AUCUNE MÉTHODE « RÉESSAYER » N'EXISTE, ET L'ABSENCE EST LE CONTRAT.**
   * Ce levier choisit ce qui arrive ; il ne rejoue rien.
   */
  readonly issueEnvoiFiscal: IssueEnvoiSimulee
  /**
   * ⚠️ **LE LEVIER DU CAS LIMITE DES DEUX RÉCEPTIONNISTES** (FR-069). Il fait
   * apparaître une occupation concurrente **entre le rendu et le tap** : la
   * grille montre l'état d'il y a quelques secondes, et un autre poste a pu
   * donner la chambre entre les deux. Sans lui, ce cas ne serait exercé par
   * rien — et c'est celui qui décide si le refus arrive avant ou après la clé.
   */
  readonly conflitAuTap: boolean
}

/** Les trois cas du jeu de mouvement, plus le jeu de volumétrie. */
export const CAS_DU_JEU = ['nominal', 'dense', 'complet'] as const
export type CasDuJeu = (typeof CAS_DU_JEU)[number]

/** Les trois issues de l'envoi fiscal — jamais une quatrième. */
export const ISSUES_ENVOI = ['CERTIFIEE', 'ECHEC', 'INDETERMINEE'] as const
export type IssueEnvoiSimulee = (typeof ISSUES_ENVOI)[number]

export const REGLAGES_INITIAUX: ReglagesScenario = {
  latenceMs: 0,
  echecReseau: false,
  horsLigne: false,
  jeuVide: false,
  compteActif: 'compte-adjoua',
  etablissementActif: 'deloria-etablissement',
  casDuJeu: 'nominal',
  deriveHorlogeSecondes: 0,
  issueEnvoiFiscal: 'CERTIFIEE',
  conflitAuTap: false,
}

/** Les quatre classes, pour le levier d'essai d'écriture. */
export const CLASSES_ESSAI: readonly ClasseHorsLigne[] = ['A', 'B', 'C', 'D']

let courants: ReglagesScenario = REGLAGES_INITIAUX

export function reglagesCourants(): ReglagesScenario {
  return courants
}

export function poserReglages(reglages: ReglagesScenario): void {
  courants = reglages
}

/** L'attente que la simulation observe avant de rendre. */
export function attendreLatence(): Promise<void> {
  const { latenceMs } = courants
  if (latenceMs <= 0) return Promise.resolve()
  return new Promise((resoudre) => setTimeout(resoudre, latenceMs))
}
