import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type {
  BaremePalier,
  Categorie,
  Formule,
  Intervalle,
  Occupation,
  PlageDemiJournee,
  StatutMenage,
  Unite,
} from '~/core/donnees/hebergement/types'

/**
 * LE RÉFÉRENTIEL — ce qui existe, posé au cycle F1.
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

// ###########################################################################
// LE MOUVEMENT — la couture de la réception, cycle F3
//
// ⚠️ LA COUTURE EST L'INTERFACE DE DOMAINE, JAMAIS LA REQUÊTE HTTP. En phase 3,
// le client généré prend la place de la simulation OPÉRATION PAR OPÉRATION, et
// aucun écran ne s'en aperçoit.
// ###########################################################################

/**
 * Une unité libre, et **ce qui la rend proposable**.
 *
 * ⚠️ `libreJusqua` N'EST PAS DÉCORATIF : une chambre libre maintenant mais
 * prise dans une heure ne convient pas à un passage de trois. Sans lui, l'écran
 * proposerait une chambre que la création refuserait — **le pire refus, celui
 * qu'on n'a pas vu venir**.
 */
export interface UniteDisponible {
  readonly unite: Unite
  readonly libreJusqua: string | null
  /**
   * ⚠️ **POURQUOI CETTE CHAMBRE EST PROPOSÉE**, quand elle l'est. Clé i18n, ou
   * `null`. « Sa chambre habituelle » vaut mieux que la même chambre sans
   * motif : *l'une se vérifie d'un coup d'œil, l'autre se subit.*
   */
  readonly motifCle: string | null
}

/** Ce qui se libère, et quand — l'état « tout est pris » en dépend. */
export interface Liberation {
  readonly uniteId: string
  readonly codeUnite: string
  /** ⚠️ **Remise en état comprise** — annoncer la fin de l'occupation seule
   *  produirait un refus à l'instant même où l'on aurait promis la chambre. */
  readonly libreA: string
}

/**
 * LES LECTURES DE LA RÉCEPTION.
 *
 * ⚠️ **AUCUNE SIGNATURE NE SUPPOSE QUE L'ÉTABLISSEMENT A DE L'HÉBERGEMENT.**
 * `PorteeLecture` partout, et « Résidence Test » le prouve : elle ne voit rien
 * de ce cycle — pas une liste vide, **rien**.
 */
export interface DonneesReception {
  /** Les occupations d'une période — la source du planning ET de la grille. */
  listerOccupations(
    portee: PorteeLecture,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly Occupation[]>>

  /**
   * Ce qui est libre, à un instant, **pour une formule donnée**.
   *
   * ⚠️ **LA FORMULE, PAS SEULEMENT LA PÉRIODE.** Sans elle, la lecture ne peut
   * appliquer ni la remise en état — qui varie **par catégorie et par
   * formule** — ni les contraintes de durée. Une signature sans formule
   * rendrait des chambres « libres » que la création refuserait ensuite.
   */
  listerUnitesDisponibles(
    portee: PorteeLecture,
    formuleId: string,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly UniteDisponible[]>>

  /** Ce qui se libère, et quand — l'état « tout est pris » en dépend. */
  listerProchainesLiberations(
    portee: PorteeLecture,
    depuis: string,
    limite: number,
  ): Promise<ResultatDomaine<readonly Liberation[]>>
}

/** L'état de ménage d'une unité, tel que la grille le rend. */
export interface UniteAvecEtat {
  readonly unite: Unite
  readonly statutMenage: StatutMenage
  /** L'occupation en cours, s'il y en a une. */
  readonly occupation: Occupation | null
  /** ⚠️ **Dérivé, jamais posé à la main** : les confondre produit des doubles
   *  attributions (HEB-06). */
  readonly libre: boolean
}
