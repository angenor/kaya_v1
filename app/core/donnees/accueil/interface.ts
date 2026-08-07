import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type {
  ActiviteAccueil,
  CarteAReglerAccueil,
  ChiffreAccueil,
  LigneSuiteAccueil,
  TeteAccueil,
} from '~/core/donnees/accueil/types'

/**
 * LES CINQ SOURCES DE `R1` — **UNE PAR RUBRIQUE**, et c'est ce qui rend FR-022
 * tenable.
 *
 * ⚠️ CINQ MÉTHODES PLUTÔT QU'UN SEUL `lireAccueil()`, ET LE MOTIF EST LE MÊME
 * QUE POUR LES CINQ RUBRIQUES : **l'échec de l'une n'emporte pas les autres.**
 * Une méthode unique rendrait un objet complet ou un échec — donc, à la première
 * panne d'un chiffre, un accueil entièrement vide. En phase 3, ce sont cinq
 * endpoints, et l'écran continue de tenir quand l'un d'eux met du temps.
 *
 * ⚠️ ET CHAQUE LECTURE EST PARAMÉTRÉE PAR L'ÉTABLISSEMENT (règle 3 du contrat de
 * domaine). Aucune ne suppose qu'un établissement a de l'hébergement ou un point
 * de vente — c'est ce que « Résidence Test » vérifie, et le maquis aussi : sur
 * un site à une seule activité, quatre de ces sources rendent une liste vide, et
 * l'écran doit rester juste.
 */
export interface DonneesAccueil {
  /**
   * Ce qui peut attendre maintenant — **plusieurs candidates, une seule
   * retenue**.
   *
   * ⚠️ ELLE REND UNE LISTE, ET CE N'EST PAS UNE COMMODITÉ. Ce qui attend
   * Adjoua — un départ à encaisser — n'est pas ce qui attend Aminata — une
   * table à servir — ni M. Koffi — un écart de caisse à comprendre. Rendre UNE
   * tête obligerait la source à savoir qui regarde, c'est-à-dire à refaire le
   * filtrage ailleurs, et une seconde fois de travers. Elle rend les candidates ;
   * `composerAccueil` en retient **une seule** (FR-016).
   */
  listerTetes(portee: PorteeLecture): Promise<ResultatDomaine<readonly TeteAccueil[]>>
  listerSuite(portee: PorteeLecture): Promise<ResultatDomaine<readonly LigneSuiteAccueil[]>>
  listerARegler(portee: PorteeLecture): Promise<ResultatDomaine<readonly CarteAReglerAccueil[]>>
  listerActivites(portee: PorteeLecture): Promise<ResultatDomaine<readonly ActiviteAccueil[]>>
  listerChiffres(portee: PorteeLecture): Promise<ResultatDomaine<readonly ChiffreAccueil[]>>
  /**
   * LES SITES QUI ONT QUELQUE CHOSE À SIGNALER — FR-029.
   *
   * ⚠️ ELLE N'EST PAS PARAMÉTRÉE PAR UN ÉTABLISSEMENT, ET C'EST TOUT SON OBJET :
   * une alerte d'un **autre** site doit être visible sans qu'on aille y voir.
   * C'est la seule lecture du cycle qui traverse les établissements, et elle ne
   * rend que des identifiants — jamais le contenu, qui appartient au site.
   *
   * ⚠️ ET ELLE NE FAIT **RIEN BASCULER**. Le sélecteur porte une pastille ; le
   * contexte ne change jamais tout seul. *Un changement de contexte non demandé
   * fait saisir une consommation sur le mauvais site.*
   */
  sitesAvecAlerte(compteId: string): Promise<ResultatDomaine<readonly string[]>>
}
