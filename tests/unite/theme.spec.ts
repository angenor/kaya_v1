// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import {
  CLE_THEME,
  ecrirePreference,
  lirePreference,
  oublierPreference,
} from '../../app/core/plateforme/web/preferenceAppareil'
import {
  CHOIX_THEME,
  appliquerTheme,
  choixPersiste,
  estChoixTheme,
  resoudreTheme,
} from '../../app/core/theme/useTheme'

/**
 * Ce que ce fichier prouve — et ce qu'il ne prouve pas.
 *
 * Il éprouve les fonctions PURES du thème et la pose de la classe sur un DOM.
 * Il ne prouve PAS l'absence d'éclair clair au démarrage : cela demande un
 * navigateur réel, un vrai premier rendu et une capture avant interaction —
 * c'est `tests/navigateur/cycle-de-vie.spec.ts` qui le fait, sur les deux
 * moteurs. « Un test qui monte un composant ne prouve pas qu'une page
 * s'atteint », et il ne prouve pas davantage ce qui se passe avant le premier
 * pixel.
 */

beforeEach(() => {
  oublierPreference(CLE_THEME)
  document.documentElement.classList.remove('dark')
  delete document.documentElement.dataset.theme
})

describe('le choix de thème', () => {
  it('connaît exactement trois valeurs — clair, sombre, comme l’appareil', () => {
    expect([...CHOIX_THEME]).toEqual(['clair', 'sombre', 'systeme'])
  })

  it('refuse une valeur qui n’est pas un choix', () => {
    expect(estChoixTheme('clair')).toBe(true)
    expect(estChoixTheme('sombre')).toBe(true)
    expect(estChoixTheme('systeme')).toBe(true)
    expect(estChoixTheme('nuit')).toBe(false)
    expect(estChoixTheme(null)).toBe(false)
  })

  it('rend « systeme » quand rien n’a été choisi — jamais « clair » par défaut', () => {
    // La nuance compte : « clair » serait un CHOIX, et il empêcherait l'écran de
    // suivre l'appareil au coucher du soleil.
    expect(choixPersiste()).toBe('systeme')
  })

  it('reprend un choix explicite, et l’oublie quand on revient à l’appareil', () => {
    ecrirePreference(CLE_THEME, 'sombre')
    expect(choixPersiste()).toBe('sombre')
    oublierPreference(CLE_THEME)
    expect(lirePreference(CLE_THEME)).toBeNull()
    expect(choixPersiste()).toBe('systeme')
  })

  it('ignore une valeur persistée qui n’a plus de sens', () => {
    // Une version future pourrait renommer un choix : une valeur inconnue
    // retombe sur l'appareil au lieu de laisser l'écran sans thème.
    ecrirePreference(CLE_THEME, 'crepuscule')
    expect(choixPersiste()).toBe('systeme')
  })

  it('résout un choix explicite sans consulter l’appareil', () => {
    expect(resoudreTheme('clair')).toBe('clair')
    expect(resoudreTheme('sombre')).toBe('sombre')
  })
})

describe('la pose du thème sur le document', () => {
  it('pose la classe .dark, le schéma de couleur et la marque de données', () => {
    appliquerTheme('sombre')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('sombre')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('les retire en clair — jamais une seconde palette, seulement l’absence de classe', () => {
    appliquerTheme('sombre')
    appliquerTheme('clair')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('clair')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
