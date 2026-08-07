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
}

export const REGLAGES_INITIAUX: ReglagesScenario = {
  latenceMs: 0,
  echecReseau: false,
  horsLigne: false,
  jeuVide: false,
  compteActif: 'compte-adjoua',
  etablissementActif: 'deloria-etablissement',
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
