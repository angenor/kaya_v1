import type { ResultatDomaine } from '~/core/donnees/contrat'
import * as deloria from '~/core/donnees/jeux/deloria'
import { lireSimule } from '~/core/donnees/simulationCommune'
import type { DonneesVentes } from '~/core/donnees/ventes/interface'
import type { Article, CategorieArticle } from '~/core/donnees/ventes/types'

/** ⚠️ Ce fichier disparaît au branchement de la phase 3. */
export const simulationVentes: DonneesVentes = {
  listerCategoriesArticle(
    pointDeVenteId: string,
  ): Promise<ResultatDomaine<readonly CategorieArticle[]>> {
    return lireSimule(
      () => deloria.categoriesArticle.filter((c) => c.pointDeVenteId === pointDeVenteId),
      [],
    )
  },

  listerArticles(pointDeVenteId: string): Promise<ResultatDomaine<readonly Article[]>> {
    return lireSimule(
      () => deloria.articles.filter((a) => a.pointDeVenteId === pointDeVenteId),
      [],
    )
  },
}
