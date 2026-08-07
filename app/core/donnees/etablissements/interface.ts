import type { PorteeLecture, ResultatDomaine } from '~/core/donnees/contrat'
import type {
  Etablissement,
  ModuleActivite,
  PointDeVente,
} from '~/core/donnees/etablissements/types'

/**
 * ⚠️ SEULES LES OPÉRATIONS QUE CE CYCLE EXERCE RÉELLEMENT SONT DÉCLARÉES. Une
 * opération sans appelant serait un « dû » de plus au registre de P-06 — on
 * n'en écrit pas par anticipation (principe 10).
 */
export interface DonneesEtablissements {
  listerEtablissements(): Promise<ResultatDomaine<readonly Etablissement[]>>
  lireEtablissement(id: string): Promise<ResultatDomaine<Etablissement>>
  /**
   * ⚠️ LES MODULES **ACTIFS**. Un module inactif n'est pas rendu avec un
   * drapeau : IL N'EST PAS RENDU. C'est le principe 7 appliqué à la source —
   * « l'interface ne montre jamais un module d'activité inactif : pas de grisé,
   * absent ». Rendre la liste complète avec un booléen inviterait chaque écran à
   * décider lui-même, et l'un d'eux griserait.
   */
  listerModulesActifs(portee: PorteeLecture): Promise<ResultatDomaine<readonly ModuleActivite[]>>
  listerPointsDeVente(portee: PorteeLecture): Promise<ResultatDomaine<readonly PointDeVente[]>>
}
