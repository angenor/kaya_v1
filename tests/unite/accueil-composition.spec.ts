import { describe, expect, it } from 'vitest'

import { SURFACES_ACCUEIL } from '../../app/core/accueil/surfaces'
import { simulationAccueil } from '../../app/core/donnees/accueil/simulation'
import { ECRANS_PRODUIT, toutesLesEntrees } from '../../app/core/ecrans/index'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as tantieAdjo from '../../app/core/donnees/jeux/tantie-adjo'
import * as residenceTest from '../../app/core/donnees/jeux/residence-test'
import { formaterMontant } from '../../app/core/format/montant'

/**
 * LA COMPOSITION DE `R1` — **les deux conditions cumulées** (FR-013, FR-014).
 *
 * ⚠️ CE TEST NE MONTE AUCUN COMPOSANT, et c'est délibéré : ce qu'il vérifie est
 * une propriété du **filtrage**, pas du rendu. Le rendu, lui, est vérifié dans
 * un navigateur réel — `accueil-variantes.spec.ts` — parce qu'un composant monté
 * ne prouve pas qu'une page s'atteint.
 *
 * ⚠️ ET IL REJOUE LE FILTRAGE PLUTÔT QUE DE L'APPELER. `composerAccueil` est un
 * composable Nuxt : il tient à `useState`, donc à une application montée. La
 * règle qu'il applique — permission ∧ module — tient en deux lignes, et les
 * écrire ici confronte **la déclaration des surfaces au jeu de données**, ce qui
 * est exactement ce qu'on veut protéger. Le chemin réel est couvert par le
 * navigateur.
 */

/** Les permissions d'un compte SUR UN établissement — la règle de F1. */
function permissionsDe(compteId: string, etablissementId: string): readonly string[] {
  const codes = deloria.compteRoles
    .filter((l) => l.compteId === compteId && l.etablissementId === etablissementId)
    .map((l) => deloria.roles.find((r) => r.id === l.roleId)?.code)
    .filter((c): c is string => Boolean(c))
  const union = new Set<string>()
  for (const code of codes) for (const p of deloria.permissionsParRole[code] ?? []) union.add(p)
  return [...union]
}

/** Les codes de module ACTIFS sur un établissement. */
function modulesActifsDe(etablissementId: string): readonly string[] {
  const liaisons = [
    ...deloria.etablissementModules,
    ...tantieAdjo.etablissementModules,
    ...residenceTest.etablissementModules,
  ].filter((l) => l.etablissementId === etablissementId && l.actif)
  return deloria.modulesActivite
    .filter((m) => liaisons.some((l) => l.moduleActiviteId === m.id))
    .map((m) => m.code)
}

/** ⚠️ LES DEUX CONDITIONS, CUMULÉES. C'est `useAutorisation.autorise` de F1. */
function surfacesRetenues(compteId: string, etablissementId: string) {
  const permissions = permissionsDe(compteId, etablissementId)
  const modules = modulesActifsDe(etablissementId)
  return SURFACES_ACCUEIL.filter(
    (s) =>
      permissions.includes(s.permission) && (s.moduleCode === null || modules.includes(s.moduleCode)),
  )
}

const DELORIA = deloria.ETABLISSEMENT_DELORIA
const MAQUIS = tantieAdjo.ETABLISSEMENT_TANTIE_ADJO
const TEST = residenceTest.ETABLISSEMENT_TEST

describe('les deux conditions se cumulent', () => {
  it('⚠️ AVOIR LE DROIT NE SUFFIT PAS SI LE SERVICE N’EXISTE PAS ICI', () => {
    // Adjoua a le droit d'appliquer une remise — et il n'y a pas de restaurant
    // à Résidence Test. C'est le cœur de FR-013, et le cas se lit en une ligne.
    expect(permissionsDe('compte-adjoua', DELORIA)).toContain('ventes.commande.remise')
    expect(modulesActifsDe(TEST)).toEqual(['HEBERGEMENT'])
    expect(
      surfacesRetenues('compte-adjoua', TEST).map((s) => s.cle),
      'une surface de restauration a survécu sur un site sans restauration',
    ).not.toContain('aRegler.stock')
  })

  it('un compte sans aucun rôle ici ne retient RIEN — pas une surface atténuée', () => {
    // Adjoua n'a aucun rôle à Résidence Test : zéro surface. L'écran le dira ;
    // il ne montrera pas des surfaces éteintes.
    expect(surfacesRetenues('compte-adjoua', TEST)).toHaveLength(0)
  })

  it('sur le maquis, quatre modules sur cinq sont ABSENTS des actifs', () => {
    // ⚠️ ABSENTS, pas « inactifs avec un drapeau ». `listerModulesActifs` ne rend
    // que les actifs, précisément pour qu'aucun écran n'ait à décider, et n'en
    // grise un.
    expect(modulesActifsDe(MAQUIS)).toEqual(['RESTAURATION'])
    for (const surface of surfacesRetenues('compte-yao', MAQUIS)) {
      expect(
        surface.moduleCode === null || surface.moduleCode === 'RESTAURATION',
        `${surface.cle} suppose ${surface.moduleCode}, qui n'est pas actif au maquis`,
      ).toBe(true)
    }
  })
})

describe('les quatre variantes sortent du CONTEXTE, jamais d’une branche', () => {
  it('Yao au maquis : « Vos activités » disparaît ENTIÈREMENT', () => {
    // ⚠️ C'EST LA DIFFÉRENCE ENTRE UN ACCUEIL DE MAQUIS ET UN HÔTEL AMPUTÉ. Une
    // rubrique à un élément qui ne mène nulle part est un reste de mise en page.
    const retenues = surfacesRetenues('compte-yao', MAQUIS)
    const activites = retenues.filter((s) => s.famille === 'activite')
    // La surface de restauration est retenue — mais le jeu du maquis ne porte
    // AUCUNE activité, et c'est ce qui fait disparaître la rubrique.
    expect(activites.map((s) => s.cle)).toEqual(['activite.restauration'])
    return simulationAccueil.listerActivites({ etablissementId: MAQUIS }).then((r) => {
      expect(r.ok && r.valeur).toHaveLength(0)
    })
  })

  it('Aminata : une seule permission, et aucune surface de caisse', () => {
    const retenues = surfacesRetenues('compte-aminata', DELORIA)
    expect(permissionsDe('compte-aminata', DELORIA).sort()).toEqual([
      'ventes.commande.prendre',
      'ventes.commande.prendre.bar',
    ])
    for (const surface of retenues) {
      expect(
        surface.permission.startsWith('caisse.'),
        `${surface.cle} touche une caisse et Aminata n'y a pas droit`,
      ).toBe(false)
    }
  })

  it('⚠️ M. KOFFI : AUCUNE SURFACE QUI MODIFIE UNE CAISSE (FR-019)', () => {
    const retenues = surfacesRetenues('compte-koffi', DELORIA)
    expect(permissionsDe('compte-koffi', DELORIA).sort()).toEqual([
      'etablissement.gerer',
      'pilotage.lire',
    ])
    const caisse = retenues.filter((s) => s.permission.startsWith('caisse.'))
    expect(caisse.map((s) => s.cle), 'le propriétaire est en LECTURE SEULE').toEqual([])
  })

  it('Adjoua : les cinq activités, et une seule action principale', () => {
    const retenues = surfacesRetenues('compte-adjoua', DELORIA)
    expect(retenues.filter((s) => s.famille === 'activite')).toHaveLength(5)
    // ⚠️ TROIS SURFACES DE TÊTE SONT RETENUES, ET UNE SEULE SERA RENDUE
    // (FR-016). L'exclusivité vit dans `composerAccueil` ; ce qu'on vérifie ici
    // est que la première déclarée est bien celle de la maquette générique.
    const tetes = retenues.filter((s) => s.famille === 'tete')
    expect(tetes.length).toBeGreaterThan(1)
    expect(tetes[0]?.cle, "l'action principale d'Adjoua est le départ à encaisser").toBe(
      'tete.depart',
    )
  })
})

describe('une surface ne décide de rien', () => {
  it('aucune ne porte de route — le code d’écran, et lui seul', () => {
    for (const surface of SURFACES_ACCUEIL) {
      expect(
        surface.ecranCible === null || !surface.ecranCible.startsWith('/'),
        `${surface.cle} porte une ROUTE : elle viendrait alors de deux sources`,
      ).toBe(true)
    }
  })

  it('tout écran cible existe À L’INDEX — sinon la mention serait muette', () => {
    const codes = new Set(toutesLesEntrees().map((e) => e.code))
    for (const surface of SURFACES_ACCUEIL) {
      if (surface.ecranCible === null) continue
      expect(
        codes.has(surface.ecranCible),
        `${surface.cle} vise « ${surface.ecranCible} », qui n'est pas à l'index`,
      ).toBe(true)
    }
  })

  it('⚠️ PASSER UN ÉCRAN À « CONSTRUIT » SUFFIT — R1 N’EST PAS RETOUCHÉ', () => {
    // La mention lit le titre et le cycle À L'INDEX. Ce test vérifie la
    // propriété qui le rend vrai : chaque écran non construit porte son cycle,
    // et chaque écran construit porte sa route. Sans cela, la mention dirait un
    // écran sans date, ou l'appui ne mènerait nulle part.
    for (const entree of ECRANS_PRODUIT) {
      if (entree.avancement === 'CONSTRUIT') {
        expect(entree.route, `${entree.code} est construit sans route`).not.toBeNull()
        expect(entree.cycle, `${entree.code} est construit et porte encore un cycle`).toBeNull()
      } else {
        expect(entree.cycle, `${entree.code ?? entree.route} n'a pas de cycle attendu`).not.toBeNull()
      }
    }
  })
})

describe('les montants — entiers en unité mineure, écrits par UNE fonction', () => {
  const SITES = [DELORIA, MAQUIS, TEST]

  it('⚠️ AUCUN FLOTTANT DANS LE JEU DE L’ACCUEIL', async () => {
    // Un montant non entier signale une erreur de conception EN AMONT — une
    // division, un pourcentage appliqué trop tôt. `formaterMontant` LÈVE dans ce
    // cas ; on préfère l'apprendre ici.
    for (const etablissementId of SITES) {
      const [tetes, suite, chiffres] = await Promise.all([
        simulationAccueil.listerTetes({ etablissementId }),
        simulationAccueil.listerSuite({ etablissementId }),
        simulationAccueil.listerChiffres({ etablissementId }),
      ])
      const montants = [
        ...(tetes.ok ? tetes.valeur.map((t) => t.montant) : []),
        ...(suite.ok ? suite.valeur.map((l) => l.montant) : []),
        ...(chiffres.ok ? chiffres.valeur.map((c) => c.montant) : []),
      ].filter((m) => m !== null)

      for (const montant of montants) {
        expect(Number.isInteger(montant.montantMineur), `${montant.montantMineur} n'est pas entier`).toBe(true)
        expect(montant.codeDevise, 'un montant sans devise ne se met pas en forme').toBe('XOF')
        // Elle ne lève pas : c'est la preuve que la mise en forme est possible.
        expect(formaterMontant(montant.montantMineur, montant.codeDevise)).toMatch(/F$/)
      }
    }
  })

  it('la seule fonction qui écrit un montant pose l’espace fine insécable', () => {
    // Le contrôle qui attrape un montant écrit à la main : U+202F, entre les
    // milliers ET avant le symbole. Un `${n} F` interpolé ne l'aurait pas.
    expect(formaterMontant(47500, 'XOF')).toBe('47\u202F500\u202FF')
  })

  it('un montant du jeu de l’accueil n’est JAMAIS pré-formaté en chaîne', async () => {
    // ⚠️ CE QUI SE GLISSE SANS BRUIT : une valeur « 47 500 F » écrite en dur
    // dans `valeur`, qui passerait tous les contrôles ci-dessus en évitant
    // `formaterMontant`. Un chiffre en `valeur` est un DÉCOMPTE — « 12 / 20 »,
    // « 14 » — et un décompte ne porte ni devise ni séparateur de milliers.
    for (const etablissementId of SITES) {
      const chiffres = await simulationAccueil.listerChiffres({ etablissementId })
      if (!chiffres.ok) continue
      for (const chiffre of chiffres.valeur) {
        if (chiffre.valeur === null) continue
        expect(chiffre.valeur, `« ${chiffre.valeur} » ressemble à un montant écrit à la main`).not.toMatch(/F$|\u202F/)
      }
    }
  })
})
