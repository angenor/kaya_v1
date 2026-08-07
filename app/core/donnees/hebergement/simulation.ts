import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type { DonneesHebergement } from '~/core/donnees/hebergement/interface'
import type {
  BaremePalier,
  Categorie,
  Formule,
  PlageDemiJournee,
  Unite,
} from '~/core/donnees/hebergement/types'
import * as deloria from '~/core/donnees/jeux/deloria'
import * as test from '~/core/donnees/jeux/residence-test'
import { lireSimule } from '~/core/donnees/simulationCommune'

/** ⚠️ Ce fichier disparaît au branchement de la phase 3. */
const TOUTES_CATEGORIES = [...deloria.categories, ...test.categories]
const TOUTES_UNITES = [...deloria.unites, ...test.unites]

export const simulationHebergement: DonneesHebergement = {
  listerCategories(portee: PorteeLecture): Promise<ResultatDomaine<readonly Categorie[]>> {
    return lireSimule(
      () => TOUTES_CATEGORIES.filter((c) => c.etablissementId === portee.etablissementId),
      [],
    )
  },

  listerUnites(portee: PorteeLecture): Promise<ResultatDomaine<readonly Unite[]>> {
    return lireSimule(() => {
      const categories = TOUTES_CATEGORIES.filter(
        (c) => c.etablissementId === portee.etablissementId,
      ).map((c) => c.id)
      return TOUTES_UNITES.filter((u) => categories.includes(u.categorieId))
    }, [])
  },

  listerFormules(categorieId: string): Promise<ResultatDomaine<readonly Formule[]>> {
    // ⚠️ Résidence Test n'en a AUCUNE, et c'est délibéré : un écran de
    // tarification doit gérer l'absence au lieu de la supposer.
    return lireSimule(
      () => deloria.formules.filter((f) => f.categorieId === categorieId),
      [],
    )
  },

  lireBareme(formuleId: string): Promise<ResultatDomaine<readonly BaremePalier[]>> {
    return lireSimule(
      () => deloria.baremePaliers.filter((p) => p.formuleId === formuleId),
      [],
    )
  },

  listerPlagesDemiJournee(
    formuleId: string,
  ): Promise<ResultatDomaine<readonly PlageDemiJournee[]>> {
    return lireSimule(
      () => deloria.plagesDemiJournee.filter((p) => p.formuleId === formuleId),
      [],
    )
  },
}
