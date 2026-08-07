import type { ResultatDomaine } from '~/core/donnees/contrat'
import type { Compte } from '~/core/donnees/comptes/types'

export interface DonneesComptes {
  listerComptes(): Promise<ResultatDomaine<readonly Compte[]>>
  lireCompte(id: string): Promise<ResultatDomaine<Compte>>
  /**
   * ⚠️ L'**UNION** DES PERMISSIONS DES RÔLES DU COMPTE **SUR CET
   * ÉTABLISSEMENT**. Les rôles sont cumulables, et c'est la norme, pas
   * l'exception (CPT-02) : Adjoua en porte trois.
   */
  resoudrePermissions(
    compteId: string,
    etablissementId: string,
  ): Promise<ResultatDomaine<readonly string[]>>
}
