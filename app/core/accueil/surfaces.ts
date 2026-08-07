import type { ActionAutorisable } from '~/core/session/useAutorisation'

/**
 * CE QU'UNE SURFACE DE `R1` DÉCLARE — ET CE QU'ELLE NE DÉCIDE PAS.
 *
 * ⚠️ **UNE SURFACE DÉCLARE CE QU'ELLE SUPPOSE. ELLE NE DÉCIDE DE RIEN.** Elle
 * ne sait pas si elle sera rendue, ni où elle mène, ni ce qu'il faut dire quand
 * l'écran cible n'existe pas. Trois fonctions le savent à sa place :
 * `useAutorisation.retenir()` — posée par F1 et **inchangée** —,
 * `composerAccueil()` et `useEcranCible()`.
 *
 * ⚠️ C'EST CE QUI REND `R1` HÉRITABLE. `R2`, `M1`, et par transitivité `P1` et
 * `M3`, reprendront ce motif. Un écran qui décide lui-même n'est pas un motif :
 * c'est un cas particulier que le suivant recopiera de travers.
 *
 * ⚠️ ET IL N'EXISTE **AUCUN** `if (variante === 'maquis')`. Les quatre accueils
 * maquettés sont **le même code** rendant des ensembles de surfaces différents.
 * Si une variante exigeait une branche, l'accueil d'un maquis serait un hôtel
 * amputé — et les onze écrans qui héritent du motif hériteraient de la branche.
 */

/**
 * Les cinq formes qu'une surface prend. Chacune est une **rubrique** de
 * l'écran, avec son composant et sa règle propre.
 */
export type FamilleSurface = 'tete' | 'suite' | 'aRegler' | 'activite' | 'chiffre'

export interface SurfaceAccueil extends ActionAutorisable {
  /**
   * L'identifiant stable de la surface. C'est par lui que les sources de
   * données rattachent leur contenu — jamais par un indice de tableau, qui
   * changerait au premier ajout.
   */
  readonly cle: string
  /** Le code de permission exigé — `ActionAutorisable` de F1, réemployé tel quel. */
  readonly permission: string
  /** `null` = transverse : encaisser, consulter, régler. */
  readonly moduleCode: string | null
  /**
   * ⚠️ **LE CODE D'ÉCRAN, JAMAIS UNE ROUTE.** La route vient de l'index des
   * écrans ; deux sources se contrediraient au troisième cycle. `null` quand
   * la surface ne mène nulle part — un chiffre ne mène nulle part.
   */
  readonly ecranCible: string | null
  readonly famille: FamilleSurface
  /** Clé i18n — jamais une chaîne visible. */
  readonly titreCle: string
  /**
   * COMMENT LA RUBRIQUE SE REND — **une déclaration, pas une condition.**
   *
   * ⚠️ CE N'EST PAS UNE VARIANTE DÉGUISÉE. Les maquettes serveuse et maquis
   * rendent leurs tables en **grille**, la générique rend ses arrivées en
   * **liste** : ce sont deux formes de contenu, pas deux publics. Une table se
   * touche pour ajouter ou encaisser — c'est une cible, et une cible se pose en
   * grille ; une arrivée se lit dans l'ordre de l'heure — c'est une ligne. Le
   * jour où un écran rendra des tables à quelqu'un d'autre, il les rendra en
   * grille sans qu'on ait à le lui dire.
   *
   * ⚠️ ET LA GRILLE N'EST **PAS** UN DIX-SEPTIÈME COMPOSANT : c'est la **tuile
   * d'action 05 en variante compacte**, portant une **pastille 04** au lieu
   * d'une icône. Vérifié composant par composant contre `composants.md`.
   */
  readonly presentation?: 'liste' | 'grille'
}

/**
 * LES SURFACES DE L'ACCUEIL.
 *
 * ⚠️ AUCUNE NE PORTE DE CONDITION D'AFFICHAGE. C'est `composerAccueil` qui
 * filtre : une surface qui se juge elle-même n'est plus filtrable, et le
 * filtrage se retrouverait à deux endroits dont l'un serait faux.
 *
 * ⚠️ LES PERMISSIONS ET LES CODES DE MODULE SONT CEUX DU MODÈLE —
 * `comptes.permission.code` et `etablissements.module_activite.code`. Ce ne sont
 * pas des paramètres métier : ce sont des identifiants de contrat, partagés
 * entre le client et le serveur.
 */
export const SURFACES_ACCUEIL: readonly SurfaceAccueil[] = [
  // ── Le bloc de tête · UNE SEULE action principale par écran ───────────────
  { cle: 'tete.depart', permission: 'hebergement.sejour.depart', moduleCode: 'HEBERGEMENT', ecranCible: 'R7', famille: 'tete', titreCle: 'accueil.tete.aFaireMaintenant' },
  { cle: 'tete.service', permission: 'ventes.commande.prendre', moduleCode: 'RESTAURATION', ecranCible: 'P2', famille: 'tete', titreCle: 'accueil.tete.votreService' },
  { cle: 'tete.pilotage', permission: 'pilotage.lire', moduleCode: null, ecranCible: 'M4', famille: 'tete', titreCle: 'accueil.tete.laSeuleChose' },

  // ── La suite · ordonnée PAR L'HEURE, jamais par importance supposée ───────
  { cle: 'suite.arrivees', permission: 'hebergement.sejour.arrivee', moduleCode: 'HEBERGEMENT', ecranCible: 'R3', famille: 'suite', titreCle: 'accueil.suite.titre' },
  { cle: 'suite.tables', permission: 'ventes.commande.prendre', moduleCode: 'RESTAURATION', ecranCible: 'P1', famille: 'suite', titreCle: 'accueil.suite.vosTables', presentation: 'grille' },

  // ── À régler · trois niveaux, JAMAIS plus de trois cartes ─────────────────
  { cle: 'aRegler.fiscal', permission: 'etablissement.gerer', moduleCode: null, ecranCible: 'F2', famille: 'aRegler', titreCle: 'accueil.aRegler.titre' },
  { cle: 'aRegler.caisse', permission: 'caisse.cloture', moduleCode: null, ecranCible: 'C4', famille: 'aRegler', titreCle: 'accueil.aRegler.titre' },
  { cle: 'aRegler.stock', permission: 'ventes.commande.remise', moduleCode: 'RESTAURATION', ecranCible: null, famille: 'aRegler', titreCle: 'accueil.aRegler.titre' },

  // ── Vos activités · DISPARAÎT AVEC SON TITRE si l'établissement n'a qu'une
  //    activité — une liste à un élément qui ne mène nulle part est un reste
  //    de mise en page ────────────────────────────────────────────────────────
  { cle: 'activite.hebergement', permission: 'hebergement.passage.ouvrir', moduleCode: 'HEBERGEMENT', ecranCible: 'R2', famille: 'activite', titreCle: 'accueil.activites.titre' },
  { cle: 'activite.restauration', permission: 'ventes.commande.prendre', moduleCode: 'RESTAURATION', ecranCible: 'P1', famille: 'activite', titreCle: 'accueil.activites.titre' },
  { cle: 'activite.bar', permission: 'ventes.commande.prendre.bar', moduleCode: 'BAR', ecranCible: 'P1', famille: 'activite', titreCle: 'accueil.activites.titre' },
  { cle: 'activite.pressing', permission: 'ventes.commande.prendre', moduleCode: 'PRESSING', ecranCible: 'P4', famille: 'activite', titreCle: 'accueil.activites.titre' },
  { cle: 'activite.salleReunion', permission: 'hebergement.passage.ouvrir', moduleCode: 'SALLE_REUNION', ecranCible: 'V1', famille: 'activite', titreCle: 'accueil.activites.titre' },

  // ── Les chiffres · montants par `format/montant.ts`, chiffres tabulaires ──
  { cle: 'chiffre.recette', permission: 'pilotage.lire', moduleCode: null, ecranCible: null, famille: 'chiffre', titreCle: 'accueil.chiffres.titre' },
  { cle: 'chiffre.service', permission: 'ventes.commande.prendre', moduleCode: 'RESTAURATION', ecranCible: null, famille: 'chiffre', titreCle: 'accueil.chiffres.votreService' },
]
