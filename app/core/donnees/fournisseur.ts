import { simulationAccueil } from '~/core/donnees/accueil/simulation'
import type { DonneesAccueil } from '~/core/donnees/accueil/interface'
import { simulationComptes } from '~/core/donnees/comptes/simulation'
import type { DonneesComptes } from '~/core/donnees/comptes/interface'
import { simulationEtablissements } from '~/core/donnees/etablissements/simulation'
import type { DonneesEtablissements } from '~/core/donnees/etablissements/interface'
import { simulationHebergement, simulationReception } from '~/core/donnees/hebergement/simulation'
import type { DonneesHebergement, DonneesReception } from '~/core/donnees/hebergement/interface'
import { simulationVentes } from '~/core/donnees/ventes/simulation'
import type { DonneesVentes } from '~/core/donnees/ventes/interface'

/**
 * LE SEUL ENDROIT DU DÉPÔT QUI SAIT QU'UNE IMPLÉMENTATION EST SIMULÉE.
 *
 * ⚠️ EN PHASE 3, CHAQUE LIGNE BASCULE **INDÉPENDAMMENT DES AUTRES** — c'est
 * exactement ce que « endpoint par endpoint » veut dire. Concrètement : on
 * remplace une ligne, on supprime le `simulation.ts` du domaine, et
 * `interface.ts` comme `types.ts` restent intacts.
 *
 * ⚠️ ET LA COUVERTURE EST CELLE DES DOMAINES QUE DELORIA PEUPLE — QUATRE, pas
 * quatorze. Écrire dix interfaces vides produirait dix points d'entrée « dû »
 * qui ne prouveraient rien, et P-06 les compterait.
 */
export interface Fournisseur {
  readonly etablissements: DonneesEtablissements
  readonly comptes: DonneesComptes
  readonly hebergement: DonneesHebergement
  /**
   * ★ Ajouté au cycle F3 — **le mouvement**, distinct du référentiel.
   *
   * ⚠️ **DEUX ENTRÉES POUR UN MÊME SCHÉMA, ET C'EST VOULU.** `hebergement` dit
   * ce qui EXISTE — chambres, formules, barèmes ; `reception` dit ce qui se
   * PASSE. En phase 3, ce sont deux familles d'endpoints qui basculeront à des
   * dates différentes : le référentiel est en lecture seule et se cache, le
   * mouvement s'écrit et ne se cache jamais.
   */
  readonly reception: DonneesReception
  readonly ventes: DonneesVentes
  /** ★ Ajouté au cycle F2 — les cinq rubriques de `R1`, une source chacune. */
  readonly accueil: DonneesAccueil
}

const FOURNISSEUR_SIMULE: Fournisseur = {
  etablissements: simulationEtablissements,
  comptes: simulationComptes,
  hebergement: simulationHebergement,
  reception: simulationReception,
  ventes: simulationVentes,
  accueil: simulationAccueil,
}

/**
 * Rend le fournisseur courant.
 *
 * ⚠️ AUCUN COMPOSANT N'APPELLE `simulationXxx` DIRECTEMENT — la règle de lint
 * (b) le refuse. Ils passent tous par ici, donc ils ne connaissent jamais la
 * provenance de leurs données.
 */
export function fournisseur(): Fournisseur {
  return FOURNISSEUR_SIMULE
}
