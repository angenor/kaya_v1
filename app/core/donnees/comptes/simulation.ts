import type { ResultatDomaine } from '~/core/donnees/contrat'
import type { DonneesComptes } from '~/core/donnees/comptes/interface'
import type { Compte } from '~/core/donnees/comptes/types'
import * as deloria from '~/core/donnees/jeux/deloria'
import { lireSimule, lireUnSimule } from '~/core/donnees/simulationCommune'

/** ⚠️ Ce fichier disparaît au branchement de la phase 3. */
export const simulationComptes: DonneesComptes = {
  listerComptes(): Promise<ResultatDomaine<readonly Compte[]>> {
    return lireSimule(() => deloria.comptes, [])
  },

  lireCompte(id: string): Promise<ResultatDomaine<Compte>> {
    return lireUnSimule(() => deloria.comptes.find((c) => c.id === id))
  },

  resoudrePermissions(
    compteId: string,
    etablissementId: string,
  ): Promise<ResultatDomaine<readonly string[]>> {
    return lireSimule(() => {
      // ⚠️ L'UNION, et sur CET établissement seulement. Un rôle porté ailleurs
      // ne donne rien ici : c'est ce que la colonne `etablissement_id` de la
      // table de liaison existe pour dire.
      const codesDeRole = deloria.compteRoles
        .filter(
          (liaison) =>
            liaison.compteId === compteId && liaison.etablissementId === etablissementId,
        )
        .map((liaison) => deloria.roles.find((r) => r.id === liaison.roleId)?.code)
        .filter((code): code is string => Boolean(code))

      const union = new Set<string>()
      for (const code of codesDeRole) {
        for (const permission of deloria.permissionsParRole[code] ?? []) union.add(permission)
      }
      return [...union].sort()
    }, [])
  },
}
