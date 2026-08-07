import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type { DonneesEtablissements } from '~/core/donnees/etablissements/interface'
import type {
  Etablissement,
  ModuleActivite,
  PointDeVente,
} from '~/core/donnees/etablissements/types'
import * as deloria from '~/core/donnees/jeux/deloria'
import * as residenceTest from '~/core/donnees/jeux/residence-test'
import * as tantieAdjo from '~/core/donnees/jeux/tantie-adjo'
import { lireSimule, lireUnSimule } from '~/core/donnees/simulationCommune'

/**
 * ⚠️ CE FICHIER DISPARAÎT AU BRANCHEMENT DE LA PHASE 3, ET C'EST TOUT SON
 * INTÉRÊT. « Aucune donnée simulée ne survit à la mise en service de l'endpoint
 * qui la remplace » : supprimer une simulation, c'est supprimer UN FICHIER et
 * changer UNE LIGNE de liaison — pas retirer des gestionnaires un à un dans un
 * fichier partagé.
 */
const TOUS_ETABLISSEMENTS = [
  ...deloria.etablissements,
  ...tantieAdjo.etablissements,
  ...residenceTest.etablissements,
]
const TOUS_MODULES_ACTIFS = [
  ...deloria.etablissementModules,
  ...tantieAdjo.etablissementModules,
  ...residenceTest.etablissementModules,
]
const TOUS_POINTS_DE_VENTE = [...deloria.pointsDeVente, ...tantieAdjo.pointsDeVente]

export const simulationEtablissements: DonneesEtablissements = {
  listerEtablissements(): Promise<ResultatDomaine<readonly Etablissement[]>> {
    return lireSimule(() => TOUS_ETABLISSEMENTS, [])
  },

  lireEtablissement(id: string): Promise<ResultatDomaine<Etablissement>> {
    return lireUnSimule(() => TOUS_ETABLISSEMENTS.find((e) => e.id === id))
  },

  listerModulesActifs(
    portee: PorteeLecture,
  ): Promise<ResultatDomaine<readonly ModuleActivite[]>> {
    return lireSimule(() => {
      const actifs = TOUS_MODULES_ACTIFS.filter(
        (liaison) => liaison.etablissementId === portee.etablissementId && liaison.actif,
      )
      // ⚠️ On ne rend QUE les actifs : pas de drapeau, pas de grisé, absent.
      return deloria.modulesActivite.filter((module) =>
        actifs.some((liaison) => liaison.moduleActiviteId === module.id),
      )
    }, [])
  },

  listerPointsDeVente(portee: PorteeLecture): Promise<ResultatDomaine<readonly PointDeVente[]>> {
    // Résidence Test n'en a AUCUN, et c'est le point du test d'agnosticité.
    return lireSimule(
      () => TOUS_POINTS_DE_VENTE.filter((p) => p.etablissementId === portee.etablissementId),
      [],
    )
  },
}
