import type { EtatPastille } from '~/core/design-system/etatsPastille'

/**
 * CE QUE LES RUBRIQUES DE `R1` AFFICHENT.
 *
 * ⚠️ AUCUN DE CES TYPES NE CORRESPOND À UNE TABLE, et c'est assumé : ce sont
 * des **vues de composition**, propres à l'interface. `docs/modele-donnees/`
 * porte les 118 tables ; un accueil en agrège plusieurs par rubrique, et
 * inventer une table « accueil » pour lui donner une forme de modèle serait
 * construire une table pour un écran.
 *
 * ⚠️ MAIS LES RÈGLES DU MODÈLE S'APPLIQUENT QUAND MÊME, ET SANS EXCEPTION : un
 * **montant est un entier en unité mineure**, accompagné de sa devise
 * (constitution, principe 5) ; une heure est un instant, écrit par
 * `format/instant.ts` au fuseau de l'établissement ; aucune valeur
 * d'énumération n'est inventée — les états viennent du vocabulaire de formes du
 * composant 04.
 *
 * ⚠️ ET CHAQUE ÉLÉMENT PORTE SA `surfaceCle`. C'est par elle que le filtrage
 * s'applique au contenu : une source ne sait pas qui a le droit de la voir, et
 * `composerAccueil` retire le contenu dont la surface est tombée. Sans ce
 * rattachement, il faudrait redire les permissions à côté des données — donc
 * deux fois, donc une fois de travers.
 */

/** Un montant, tel que le produit l'écrit partout : entier mineur + devise. */
export interface Montant {
  /** ⚠️ ENTIER, en unité mineure. Un flottant ici est un défaut de conception. */
  readonly montantMineur: number
  readonly codeDevise: string
}

/**
 * LE BLOC DE TÊTE — ce qui attend maintenant.
 *
 * ⚠️ **UNE SEULE ACTION PRINCIPALE PAR ÉCRAN** (FR-016). Trois actions faute
 * d'avoir tranché laquelle compte violent la règle : l'écran cesse alors de
 * dire ce qui attend, et se contente de tout proposer.
 */
export interface TeteAccueil {
  readonly surfaceCle: string
  /** Le fait, dans les mots de l'exploitant. Une donnée, pas une clé. */
  readonly libelle: string
  readonly detail: string
  readonly montant: Montant | null
  /** Clé i18n de l'action principale — jamais une chaîne. */
  readonly actionCle: string
  /** Clé i18n de l'action discrète, quand il y en a une. */
  readonly actionSecondaireCle: string | null
}

/**
 * UNE LIGNE DE « LA SUITE » — composant 08.
 *
 * ⚠️ ORDONNÉE PAR **L'HEURE**, jamais par importance supposée. Ce qui vient
 * ensuite est ce qui vient ensuite ; classer par gravité ferait remonter en tête
 * ce qui peut attendre, et l'exploitant apprendrait à ne plus lire l'ordre.
 */
export interface LigneSuiteAccueil {
  readonly surfaceCle: string
  readonly id: string
  /** Instant ISO — c'est LUI qui ordonne, jamais la position au tableau. */
  readonly instant: string
  readonly libelle: string
  readonly detail: string
  readonly montant: Montant | null
  readonly etat: EtatPastille
  /**
   * ⚠️ L'ICÔNE VIENT DE LA **DONNÉE**, PAS DE LA MISE EN PAGE. Une arrivée n'a
   * pas la même icône qu'un ménage ou qu'une table ouverte, et c'est ce qui
   * permet de reconnaître la nature du fait sans lire son libellé. La déduire
   * d'un ton donnerait trois fois le même pictogramme.
   */
  readonly icone: string
  /** La teinte du carré d'icône — elle suit la nature du fait, pas sa gravité. */
  readonly teinte: 'prim' | 'alerte' | 'ocre' | 'info'
  /** Clé i18n de l'action de bord. Jamais une chaîne. */
  readonly actionCle: string
}

/**
 * UNE CARTE « À RÉGLER » — composant 07, trois niveaux.
 *
 * ⚠️ **JAMAIS PLUS DE TROIS.** Au-delà, on n'en lit aucune — c'est la règle du
 * composant 07 portée jusqu'ici, là où le nombre se décide.
 */
export interface CarteAReglerAccueil {
  readonly surfaceCle: string
  readonly id: string
  readonly niveau: 'danger' | 'alerte' | 'info'
  readonly libelle: string
  readonly detail: string
  readonly actionCle: string
  /**
   * ⚠️ L'ICÔNE VIENT DU FAIT, JAMAIS DU NIVEAU. Une facture non transmise porte
   * `ph-file-x`, un écart de caisse `ph-scales`, un réapprovisionnement
   * `ph-package`. Déduire l'icône du ton donnerait trois avertissements
   * identiques — et l'icône cesserait d'informer.
   */
  readonly icone: string
  /** Le montant en jeu, quand il y en a un — « 3 ardoises · 18 000 F ». */
  readonly montant: Montant | null
}

/** Une tuile de « Vos activités » — composant 05, variante pleine. */
export interface ActiviteAccueil {
  readonly surfaceCle: string
  readonly moduleCode: string
  readonly libelle: string
  readonly detail: string
  readonly icone: string
}

/** Une carte de chiffre — composant 06. */
export interface ChiffreAccueil {
  readonly surfaceCle: string
  readonly id: string
  readonly etiquetteCle: string
  /** ⚠️ L'UN OU L'AUTRE : un montant s'écrit par `montant.ts`, un décompte non. */
  readonly montant: Montant | null
  readonly valeur: string | null
  readonly comparaison: string
  /**
   * ⚠️ LE TON DE LA COMPARAISON VIENT DU **FAIT**, pas de la mise en page.
   * « + 18 % » est un succès, « 2 départs et 4 tables ouvertes » une alerte,
   * « 3 arrivées attendues » un simple constat. Les rendre toutes grises ferait
   * perdre la moitié de ce que la maquette dit d'un coup d'œil.
   */
  readonly tonComparaison: 'neutre' | 'succes' | 'alerte'
}
