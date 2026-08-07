/**
 * ⚠️ MÊME FORME QUE `docs/modele-donnees/55-ventes.sql`.
 *
 * ⚠️ RÉFÉRENTIEL SEULEMENT. Aucune commande, aucune ligne, aucune addition,
 * aucun bon de dépôt : ce sont des données de mouvement.
 */

/** ← `ventes.categorie_article` — « Catégorie » à l'écran. */
export interface CategorieArticle {
  readonly id: string
  readonly tenantId: string
  readonly pointDeVenteId: string
  readonly nom: string
  readonly ordre: number
}

/**
 * ← `ventes.article` — « Article » à l'écran, jamais « produit » ni
 * « catalogue », qui est le mot de la table.
 *
 * ⚠️ `tauxTva` EST UN `NUMERIC`, DONC UNE **CHAÎNE DÉCIMALE**, JAMAIS UN
 * FLOTTANT. Le principe 5 est formel : « toute quantité est en NUMERIC, jamais
 * en entier », et un flottant sur une quantité est refusé. Une quincaillerie
 * vendra 2,3 mètres de fer ; 18 % s'écrit `'18'`, pas `0.18`.
 *
 * ⚠️ `prix` EST UN ENTIER en unité mineure — `montant_mineur` (BIGINT).
 */
export interface Article {
  readonly id: string
  readonly tenantId: string
  readonly pointDeVenteId: string
  readonly categorieArticleId: string
  readonly destinationPreparationId: string | null
  readonly nom: string
  readonly prix: number
  readonly codeDevise: string
  /** CHAÎNE décimale — jamais un nombre à virgule flottante. */
  readonly tauxTva: string
  readonly disponible: boolean
  readonly suiviStock: boolean
  readonly uniteMesure: string | null
  readonly codeBarre: string | null
  readonly articleParentId: string | null
}
