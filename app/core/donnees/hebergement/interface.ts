import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type {
  BaremePalier,
  Categorie,
  Formule,
  PlageDemiJournee,
  Unite,
} from '~/core/donnees/hebergement/types'

/**
 * ⚠️ AUCUNE OPÉRATION D'OCCUPATION, DE SÉJOUR OU DE RÉSERVATION. Ce sont des
 * données de MOUVEMENT, et elles appartiennent aux cycles F3 et F7. Ce cycle
 * porte le référentiel : ce qui existe, pas ce qui se passe.
 */
export interface DonneesHebergement {
  listerCategories(portee: PorteeLecture): Promise<ResultatDomaine<readonly Categorie[]>>
  listerUnites(portee: PorteeLecture): Promise<ResultatDomaine<readonly Unite[]>>
  listerFormules(categorieId: string): Promise<ResultatDomaine<readonly Formule[]>>
  lireBareme(formuleId: string): Promise<ResultatDomaine<readonly BaremePalier[]>>
  listerPlagesDemiJournee(
    formuleId: string,
  ): Promise<ResultatDomaine<readonly PlageDemiJournee[]>>
}
