import type { ResultatDomaine } from '~/core/donnees/contrat'
import type { Compte } from '~/core/donnees/comptes/types'
import type { Etablissement } from '~/core/donnees/etablissements/types'

/**
 * CE QUE `R0` OBTIENT QUAND L'IDENTIFICATION RÉUSSIT.
 *
 * ⚠️ CE N'EST PAS UNE `Session`, ET LA NUANCE COMPTE. Une session porte aussi
 * une **portée**, et la portée est un CHOIX — le dernier site retenu, ou celui
 * qu'on désigne. Le domaine, lui, rend ce qu'il sait : qui est entré, et où il
 * a des droits. C'est l'écran qui compose la session à partir de là, et c'est
 * pourquoi rouvrir l'application ramène au dernier site choisi plutôt qu'au
 * premier de la liste (FR-032).
 *
 * ⚠️ ET IL N'Y A NI JETON, NI EMPREINTE, NI DATE D'EXPIRATION. Aucun secret
 * n'est servi au navigateur (constitution, principe 9). En phase 3, le serveur
 * fera foi ; ce type ne changera pas.
 */
export interface Identification {
  readonly compteId: string
  /** Les établissements où CE compte a des droits. Rien d'autre n'est proposé. */
  readonly etablissements: readonly Etablissement[]
}

export interface DonneesComptes {
  listerComptes(): Promise<ResultatDomaine<readonly Compte[]>>
  lireCompte(id: string): Promise<ResultatDomaine<Compte>>
  /**
   * CE QUE `R0` APPELLE.
   *
   * ⚠️ `motDePasse` EST **REÇU ET IGNORÉ**, ET C'EST DÉLIBÉRÉ. Aucun secret
   * n'est servi au navigateur, et il n'y a pas de serveur en phase 2 : **il n'y
   * a rien à comparer**. Le retirer de la signature ferait de la phase 3 une
   * **rupture d'interface** — `R0` devrait changer le jour où
   * l'authentification arrive, c'est-à-dire au moment où l'on a le moins envie
   * d'y toucher. Le garder rend le branchement mécanique : on remplace
   * `simulation.ts` par un appel à `POST /api/v1/session`, et l'écran ne bouge
   * pas. Il n'est ni stocké, ni journalisé, ni comparé.
   *
   * ⚠️ QUATRE CAS D'ÉCHEC, **DEUX CODES**. Compte inconnu, mot de passe faux,
   * compte `SUSPENDU` et compte `REVOQUE` rendent tous
   * `IDENTIFIANTS_INVALIDES` : les distinguer publierait la liste des comptes
   * existants. Le champ vide, lui, a son propre code — ce n'est pas un échec de
   * connexion, et la personne doit savoir quoi corriger.
   */
  identifier(
    identifiantSaisi: string,
    motDePasse: string,
  ): Promise<ResultatDomaine<Identification>>
  /** Les établissements où CE compte a des droits. Rien d'autre n'est proposé. */
  etablissementsDe(compteId: string): Promise<ResultatDomaine<readonly Etablissement[]>>
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
