import { describe, expect, it } from 'vitest'

import { RUBRIQUES_NAVIGATION, actionDe } from '../../app/core/coquille/rubriques'
import { toutesLesEntrees } from '../../app/core/ecrans/index'
import fr from '../../app/core/i18n/fr'
import * as deloria from '../../app/core/donnees/jeux/deloria'

/**
 * LA NAVIGATION LATÉRALE, VUE COMME UNE DÉCLARATION — **et confrontée aux
 * quatre sources qu'elle suppose vraies**.
 *
 * ⚠️ **CE FICHIER EXISTE PARCE QUE LA BARRE NE PLANTE JAMAIS.** Une entrée qui
 * vise un code d'écran inexistant, une permission jamais accordée, un module
 * absent du modèle : chacun de ces trois cas rend une barre qui **s'affiche
 * normalement** avec une entrée en moins, ou une entrée qui ne mène nulle part.
 * Rien ne rougit, rien ne se voit — et la sortie de secours de tous les écrans
 * se réduit d'un cran à chaque renommage.
 */

const CODES_ECRANS = new Set(
  toutesLesEntrees()
    .map((ecran) => ecran.code)
    .filter((code) => code !== null),
)
const CODES_PERMISSIONS = new Set(deloria.permissions.map((p) => p.code))
const CODES_MODULES = new Set(deloria.modulesActivite.map((m) => m.code))

const TOUTES_ENTREES = RUBRIQUES_NAVIGATION.flatMap((rubrique) =>
  rubrique.entrees.map((entree) => ({ rubrique, entree })),
)

/** La valeur d'une clé i18n pointée, ou `undefined` si le chemin n'existe pas. */
function valeurI18n(chemin: string): unknown {
  return chemin
    .split('.')
    .reduce<unknown>(
      (courant, cle) =>
        courant !== null && typeof courant === 'object'
          ? (courant as Record<string, unknown>)[cle]
          : undefined,
      fr,
    )
}

describe('le plancher — ce test ne vaut que s’il inspecte quelque chose', () => {
  it('la barre porte assez d’entrées pour que son vert ait un sens', () => {
    // Un jour, un `filter` mal placé rendrait un tableau vide : toutes les
    // assertions ci-dessous passeraient sans rien vérifier.
    expect(TOUTES_ENTREES.length).toBeGreaterThanOrEqual(10)
    expect(RUBRIQUES_NAVIGATION.length).toBeGreaterThanOrEqual(5)
  })
})

describe('chaque entrée vise quelque chose qui existe', () => {
  it('un code d’écran inscrit à l’index', () => {
    const inconnus = TOUTES_ENTREES.filter(({ entree }) => !CODES_ECRANS.has(entree.ecranCible))
    expect(inconnus.map(({ entree }) => `${entree.cle} → ${entree.ecranCible}`)).toEqual([])
  })

  it('une permission qui existe au modèle — ou aucune, pour l’accueil seul', () => {
    const inconnues = TOUTES_ENTREES.filter(
      ({ entree }) => entree.permission !== '' && !CODES_PERMISSIONS.has(entree.permission),
    )
    expect(inconnues.map(({ entree }) => `${entree.cle} → ${entree.permission}`)).toEqual([])
  })

  it('une seule entrée se dispense de permission, et c’est la sortie de secours', () => {
    // ⚠️ Le jour où une deuxième s'en dispense, une action devient accessible à
    // qui n'y a pas droit — sans qu'aucun écran ne le signale.
    const sansPermission = TOUTES_ENTREES.filter(({ entree }) => entree.permission === '')
    expect(sansPermission.map(({ entree }) => entree.cle)).toEqual(['nav.accueil'])
  })

  it('les deux libellés — celui de l’entrée et celui de sa rubrique — sont des clés i18n servies', () => {
    const manquantes = TOUTES_ENTREES.filter(
      ({ entree }) => typeof valeurI18n(entree.libelleCle) !== 'string',
    ).map(({ entree }) => entree.libelleCle)
    const titresManquants = RUBRIQUES_NAVIGATION.filter(
      (rubrique) => rubrique.titreCle !== null && typeof valeurI18n(rubrique.titreCle) !== 'string',
    ).map((rubrique) => rubrique.titreCle)
    expect([...manquantes, ...titresManquants]).toEqual([])
  })
})

describe('la verticale porte le module, et une seule fois', () => {
  it('chaque rubrique nomme un module du modèle, ou aucun', () => {
    const inconnus = RUBRIQUES_NAVIGATION.filter(
      (rubrique) => rubrique.moduleCode !== null && !CODES_MODULES.has(rubrique.moduleCode),
    )
    expect(inconnus.map((rubrique) => `${rubrique.cle} → ${rubrique.moduleCode}`)).toEqual([])
  })

  it('`actionDe` recompose les DEUX conditions — la permission de l’entrée, le module de la rubrique', () => {
    // C'est la seule jonction des deux, et c'est ce qui garantit qu'une entrée
    // d'hébergement ne peut pas se retrouver marquée « restauration ».
    for (const { rubrique, entree } of TOUTES_ENTREES) {
      const action = actionDe(rubrique, entree)
      expect(action.permission).toBe(entree.permission)
      expect(action.moduleCode).toBe(rubrique.moduleCode)
    }
  })

  it('la permission d’une entrée appartient au module de sa rubrique', () => {
    // ⚠️ LE CAS QUI SE VOIT LE MOINS : une entrée exigeant `ventes.commande.*`
    // rangée sous « Hébergement » disparaîtrait chez un hôtel sans restaurant,
    // alors que l'écran, lui, n'a rien à voir avec le restaurant.
    const discordantes = TOUTES_ENTREES.filter(({ rubrique, entree }) => {
      if (entree.permission === '' || rubrique.moduleCode === null) return false
      const permission = deloria.permissions.find((p) => p.code === entree.permission)
      return permission !== undefined && permission.moduleActiviteCode !== rubrique.moduleCode
    })
    expect(
      discordantes.map(({ rubrique, entree }) => `${entree.cle} sous ${rubrique.cle}`),
    ).toEqual([])
  })
})

describe('aucun doublon, aucune ambiguïté', () => {
  it('les clés d’entrée sont uniques', () => {
    const cles = TOUTES_ENTREES.map(({ entree }) => entree.cle)
    expect(new Set(cles).size).toBe(cles.length)
  })

  it('les clés de rubrique sont uniques', () => {
    const cles = RUBRIQUES_NAVIGATION.map((rubrique) => rubrique.cle)
    expect(new Set(cles).size).toBe(cles.length)
  })

  it('aucune rubrique n’est vide à la déclaration', () => {
    // Une rubrique se vide À L'AFFICHAGE quand rien n'y est autorisé — c'est le
    // comportement voulu. Vide à la DÉCLARATION, c'est un reste de renommage.
    expect(RUBRIQUES_NAVIGATION.filter((r) => r.entrees.length === 0)).toEqual([])
  })
})

describe('ce que le classement par verticale garantit', () => {
  it('les deux groupes sans intitulé sont transverses, et eux seuls', () => {
    // ⚠️ Un groupe sans titre qui porterait un module serait une verticale
    // anonyme : elle disparaîtrait chez un exploitant sans jamais avoir été
    // nommée, donc sans que personne puisse comprendre ce qui manque.
    for (const rubrique of RUBRIQUES_NAVIGATION) {
      if (rubrique.titreCle === null) expect(rubrique.moduleCode, rubrique.cle).toBeNull()
    }
  })

  it('l’accueil est la PREMIÈRE entrée de la barre', () => {
    // La sortie de secours ne se cherche pas : elle est en tête, toujours.
    expect(TOUTES_ENTREES[0]!.entree.cle).toBe('nav.accueil')
  })

  it('toute entrée d’une verticale est sous la rubrique de cette verticale', () => {
    const parModule = new Map<string, string[]>()
    for (const rubrique of RUBRIQUES_NAVIGATION) {
      if (rubrique.moduleCode === null) continue
      const deja = parModule.get(rubrique.moduleCode) ?? []
      parModule.set(rubrique.moduleCode, [...deja, rubrique.cle])
    }
    // Un module réparti sur deux rubriques, c'est l'ancien classement qui
    // revient : « la réception » et « les services » servaient tous deux
    // l'hébergement.
    for (const [module, rubriques] of parModule) {
      expect(rubriques, `${module} est réparti sur plusieurs rubriques`).toHaveLength(1)
    }
  })
})
