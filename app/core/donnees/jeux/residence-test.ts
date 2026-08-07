import type {
  Etablissement,
  EtablissementModule,
  Tenant,
} from '~/core/donnees/etablissements/types'
import type { Categorie, Unite } from '~/core/donnees/hebergement/types'

/**
 * RÉSIDENCE TEST — LE PENDANT EN PHASE 2 DU TEST D'AGNOSTICITÉ DU SOCLE
 * (ETB-02c).
 *
 * ⚠️ UN SEUL MODULE ACTIF, AUCUN POINT DE VENTE, AUCUN ARTICLE, AUCUNE FORMULE.
 * C'est tout l'intérêt : **toute surface de la coquille qui supposerait une
 * chambre, un article, un tarif ou une table le découvre ICI** — et c'est le
 * moment le moins cher pour le découvrir. En phase 3, la même découverte
 * coûterait un écran à refaire.
 *
 * ⚠️ ET LE VIDE EST DÉLIBÉRÉ, PAS UN OUBLI. Ne pas lui donner de formules est
 * ce qui fait qu'un écran de tarification doit gérer l'absence au lieu de la
 * supposer.
 */

export const TENANT_TEST = 'residence-test'
export const ETABLISSEMENT_TEST = 'residence-test-etablissement'

export const tenants: readonly Tenant[] = [
  {
    id: TENANT_TEST,
    tenantId: TENANT_TEST,
    code: 'RESIDENCE_TEST',
    raisonSociale: 'Résidence Test',
    statut: 'ACTIF',
    estEditeur: false,
  },
]

export const etablissements: readonly Etablissement[] = [
  {
    id: ETABLISSEMENT_TEST,
    tenantId: TENANT_TEST,
    code: 'RESIDENCE_TEST',
    nom: 'Résidence Test',
    juridictionCode: 'CI',
    // ⚠️ Un classement DIFFÉRENT de Deloria : « résidence meublée » n'a pas le
    // même barème de taxe communale qu'un non-classé.
    classement: 'RESIDENCE_MEUBLEE',
    commune: 'Abengourou',
    fuseauHoraire: 'Africa/Abidjan',
    devise: 'XOF',
    adresse: null,
    ncc: null,
  },
]

/** UN SEUL module actif : l'hébergement. */
export const etablissementModules: readonly EtablissementModule[] = [
  {
    id: 'test-actif-hebergement',
    tenantId: TENANT_TEST,
    etablissementId: ETABLISSEMENT_TEST,
    moduleActiviteId: 'module-hebergement',
    actif: true,
    activeLe: '2026-01-01T08:00:00.000Z',
    desactiveLe: null,
  },
]

export const categories: readonly Categorie[] = [
  {
    id: 'test-categorie-logement',
    tenantId: TENANT_TEST,
    etablissementId: ETABLISSEMENT_TEST,
    // « Logement », pas « chambre » : le mot suit le contexte (lexique).
    nom: 'Logement',
    capaciteAccueil: 4,
    ordre: 1,
    actif: true,
  },
]

export const unites: readonly Unite[] = ['L1', 'L2', 'L3', 'L4'].map((code, rang) => ({
  id: `test-unite-${code.toLowerCase()}`,
  tenantId: TENANT_TEST,
  categorieId: 'test-categorie-logement',
  code,
  etage: String(rang + 1),
  statutMenage: 'PROPRE' as const,
  actif: true,
}))
