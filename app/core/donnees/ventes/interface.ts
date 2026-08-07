import type { ResultatDomaine } from '~/core/donnees/contrat'
import type { Article, CategorieArticle } from '~/core/donnees/ventes/types'

/** ⚠️ Référentiel seulement : aucune commande, aucune ligne, aucune addition. */
export interface DonneesVentes {
  listerCategoriesArticle(
    pointDeVenteId: string,
  ): Promise<ResultatDomaine<readonly CategorieArticle[]>>
  listerArticles(pointDeVenteId: string): Promise<ResultatDomaine<readonly Article[]>>
}
