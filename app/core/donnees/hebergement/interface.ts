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

/**
 * LA DEMANDE D'UN PASSAGE — **et son identifiant, généré côté client**.
 *
 * ⚠️ **`id` EST UN UUID v7, JAMAIS UN v4.** `crypto.randomUUID()` rend un
 * identifiant aléatoire, **non ordonnable dans le temps** ; les 48 bits de tête
 * d'un v7 portent l'horodatage, et c'est ce qui rend la file rejouable dans
 * l'ordre et le dédoublonnage serveur inoffensif.
 *
 * ⚠️ **ET C'EST LUI QUI DÉDUPLIQUE.** Trois envois de la même demande n'en
 * produisent qu'un. Sans cela, un double tap sur un réseau lent créerait deux
 * occupations, donc deux encaissements, sur une chambre donnée une seule fois.
 */
export interface DemandePassage {
  readonly id: string
  readonly etablissementId: string
  readonly uniteId: string
  readonly formuleId: string
  readonly dureeMinutes: number
  /** Le client reconnu, quand il l'est. ⚠️ **`null` est le cas nominal.** */
  readonly clientId: string | null
  /** L'horodatage de l'appareil — **indicatif**, aucune règle ne s'y appuie. */
  readonly horodatageClient: string | null
}

/** Ce que l'écran annonce **immédiatement après** le tap. */
export interface PassageEnregistre {
  readonly occupation: Occupation
  readonly sejourId: string
  readonly noteSejourId: string
  /** Le code de la chambre — **le plus grand élément de l'écran suivant**. */
  readonly codeUnite: string
  /** L'heure de fin — **le nombre qu'on dit à voix haute**. */
  readonly finPrevue: string
  readonly montant: number
  readonly codeDevise: string
  /** Le numéro de la fiche de police émise, **sans trou dans la série**. */
  readonly numeroFichePolice: string
  /**
   * ⚠️ **HUIT SECONDES, ET ELLES VIENNENT DU DOMAINE.** Le composant 14 les
   * affiche ; il ne les décide pas. Un délai décidé dans un composant serait
   * devenu une constante que personne ne rouvre.
   */
  readonly fenetreAnnulationSecondes: number
}

/**
 * LES ÉCRITURES DE LA RÉCEPTION, **et leur classe hors-ligne**.
 *
 * ⚠️ **CHAQUE ÉCRITURE COMMENCE PAR LA MÊME GARDE**, posée dans la fonction
 * d'appel et non dans le composant, et rend `HORS_LIGNE` **sans avoir rien
 * tenté** (contrat §3).
 */
export interface EcrituresReception {
  /**
   * ⚠️ **UN SEUL GESTE, CINQ EFFETS** : occupation, séjour, note ouverte puis
   * arrêtée, encaissement espèces, fiche de police à compléter. **Classe B.**
   */
  enregistrerPassage(demande: DemandePassage): Promise<ResultatDomaine<PassageEnregistre>>

  /**
   * Défait **les cinq effets**, jamais un seul. **Classe B**, bornée par la
   * fenêtre d'annulation.
   *
   * ⚠️ **L'OCCUPATION PASSE À `ANNULEE`, ELLE NE DISPARAÎT PAS.** Une ligne
   * supprimée ne laisse aucune trace de ce qui a été tenté — et c'est
   * exactement ce qu'un audit cherche.
   */
  annulerPassage(occupationId: string): Promise<ResultatDomaine<void>>
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
