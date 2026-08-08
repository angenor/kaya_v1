import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type {
  DonneesHebergement,
  DonneesReception,
  Liberation,
  UniteDisponible,
} from '~/core/donnees/hebergement/interface'
import { mouvement } from '~/core/donnees/hebergement/magasin'
import type {
  BaremePalier,
  Categorie,
  Formule,
  Intervalle,
  Occupation,
  PlageDemiJournee,
  Unite,
} from '~/core/donnees/hebergement/types'
import * as deloria from '~/core/donnees/jeux/deloria'
import * as test from '~/core/donnees/jeux/residence-test'
import {
  avecRemiseEnEtat,
  prochainesLiberations,
  remiseEnEtatMinutes,
  seChevauchent,
  unitesDisponibles,
} from '~/core/reception/disponibilite'
import { lireSimule } from '~/core/donnees/simulationCommune'

/** ⚠️ Ce fichier disparaît au branchement de la phase 3. */
const TOUTES_CATEGORIES = [...deloria.categories, ...test.categories]
const TOUTES_UNITES = [...deloria.unites, ...test.unites]

/**
 * Les unités d'un établissement.
 *
 * ⚠️ **C'EST CE QUI FAIT QUE « RÉSIDENCE TEST » NE VOIT RIEN.** Elle a des
 * unités mais aucun mouvement : ses lectures rendent des listes vides parce que
 * le jeu est vide, jamais parce qu'un `if` les aurait exclues.
 */
function unitesDe(etablissementId: string): readonly Unite[] {
  const categories = TOUTES_CATEGORIES.filter((c) => c.etablissementId === etablissementId).map(
    (c) => c.id,
  )
  return TOUTES_UNITES.filter((u) => categories.includes(u.categorieId))
}

/** Le code d'une unité, pour les libérations que l'écran affiche. */
function codeDe(uniteId: string): string {
  return TOUTES_UNITES.find((u) => u.id === uniteId)?.code ?? uniteId
}

export const simulationHebergement: DonneesHebergement = {
  listerCategories(portee: PorteeLecture): Promise<ResultatDomaine<readonly Categorie[]>> {
    return lireSimule(
      () => TOUTES_CATEGORIES.filter((c) => c.etablissementId === portee.etablissementId),
      [],
    )
  },

  listerUnites(portee: PorteeLecture): Promise<ResultatDomaine<readonly Unite[]>> {
    return lireSimule(() => unitesDe(portee.etablissementId), [])
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

/**
 * LES LECTURES DE LA RÉCEPTION — cycle F3.
 *
 * ⚠️ **ELLES HONORENT LES LEVIERS SANS UNE LIGNE DE CODE PROPRE.** Latence,
 * échec réseau, hors ligne et jeu vide passent tous par `lireSimule`, posé au
 * cycle F1. Une lecture qui les réimplémenterait serait une lecture qui les
 * oublierait à moitié.
 */
export const simulationReception: DonneesReception = {
  listerOccupations(
    portee: PorteeLecture,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly Occupation[]>> {
    return lireSimule(() => {
      const miennes = new Set(unitesDe(portee.etablissementId).map((u) => u.id))
      return mouvement().occupations.filter(
        (occupation) =>
          miennes.has(occupation.uniteId) &&
          seChevauchent(occupation.periodeIndisponibilite, periode),
      )
    }, [])
  },

  listerUnitesDisponibles(
    portee: PorteeLecture,
    formuleId: string,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly UniteDisponible[]>> {
    return lireSimule(() => {
      // ⚠️ **LA FORMULE DÉCIDE DE LA CATÉGORIE, ET LA CATÉGORIE DES UNITÉS.**
      // C'est le pendant du refus `FORMULE_HORS_CATEGORIE` : proposer une
      // chambre à laquelle la formule ne s'applique pas ferait découvrir le
      // refus au tap, avec le client au comptoir.
      const formule = deloria.formules.find((f) => f.id === formuleId)
      if (!formule) return []
      const occupations = mouvement().occupations
      // ⚠️ LA REMISE EN ÉTAT DE LA DEMANDE COMPTE AUSSI : une chambre dont le
      // ménage suivant mordrait sur l'occupation d'après n'est pas libre, même
      // si l'occupation elle-même y tiendrait.
      const menage = remiseEnEtatMinutes(
        deloria.tempsRemiseEnEtat,
        formuleId,
        formule.categorieId,
      )
      const unites = unitesDe(portee.etablissementId).filter(
        (unite) => unite.categorieId === formule.categorieId,
      )
      return unitesDisponibles(unites, occupations, avecRemiseEnEtat(periode, menage)).map(
        (disponible) => ({
          unite: disponible.unite,
          libreJusqua: disponible.libreJusqua,
          motifCle: null,
        }),
      )
    }, [])
  },

  listerProchainesLiberations(
    portee: PorteeLecture,
    depuis: string,
    limite: number,
  ): Promise<ResultatDomaine<readonly Liberation[]>> {
    return lireSimule(() => {
      const miennes = new Set(unitesDe(portee.etablissementId).map((u) => u.id))
      const occupations = mouvement().occupations.filter((o) => miennes.has(o.uniteId))
      return prochainesLiberations(occupations, depuis, limite).map((liberation) => ({
        ...liberation,
        codeUnite: codeDe(liberation.uniteId),
      }))
    }, [])
  },
}
