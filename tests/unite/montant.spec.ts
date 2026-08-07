import { describe, expect, it } from 'vitest'

import {
  FINE_INSECABLE,
  formaterEcart,
  formaterMontant,
} from '../../app/core/format/montant'

/**
 * ⚠️ LE TEST PORTE SUR LE POINT DE CODE, PAS SUR L'APPARENCE. Une espace fine
 * insécable et une espace ordinaire se ressemblent à l'écran et ne se
 * comportent pas pareil : l'une coupe le montant en fin de ligne, l'autre non.
 * Vérifier « il y a une espace » laisserait passer exactement la faute.
 */
describe('le formatage des montants', () => {
  it('emploie U+202F entre les milliers ET avant le symbole', () => {
    const ecrit = formaterMontant(12500, 'XOF')
    expect(ecrit).toBe(`12${FINE_INSECABLE}500${FINE_INSECABLE}F`)
    expect(FINE_INSECABLE.codePointAt(0)).toBe(0x202f)
    // Aucune espace ordinaire, aucune espace insécable large.
    expect(ecrit).not.toContain(' ')
    expect(ecrit).not.toContain(' ')
    expect([...ecrit].filter((c) => c.codePointAt(0) === 0x202f)).toHaveLength(2)
  })

  it('groupe par trois, quel que soit le nombre de groupes', () => {
    expect(formaterMontant(0, 'XOF')).toBe(`0${FINE_INSECABLE}F`)
    expect(formaterMontant(500, 'XOF')).toBe(`500${FINE_INSECABLE}F`)
    expect(formaterMontant(1000, 'XOF')).toBe(`1${FINE_INSECABLE}000${FINE_INSECABLE}F`)
    expect(formaterMontant(4480000, 'XOF')).toBe(
      `4${FINE_INSECABLE}480${FINE_INSECABLE}000${FINE_INSECABLE}F`,
    )
  })

  it('emploie le VRAI signe moins, jamais le trait d’union', () => {
    // Le trait d'union se coupe en fin de ligne et se lit comme un tiret.
    expect(formaterMontant(-12500, 'XOF').startsWith('−')).toBe(true)
    expect(formaterMontant(-12500, 'XOF')).not.toContain('-')
  })

  it('prend ses décimales de la DEVISE — XOF en a zéro', () => {
    // Un produit qui supposerait deux décimales partout écrirait
    // « 12 500,00 F » à Abengourou.
    expect(formaterMontant(12500, 'XOF')).not.toContain(',')
  })

  it('REFUSE un montant non entier au lieu de l’arrondir', () => {
    // L'arrondi est une décision fiscale ; il n'appartient pas à une fonction
    // d'affichage. Arrondir en silence cacherait une erreur en amont.
    expect(() => formaterMontant(12500.5, 'XOF')).toThrow(/entier/)
  })

  it('REFUSE une devise dont la convention d’écriture est inconnue', () => {
    expect(() => formaterMontant(12500, 'EUR')).toThrow(/devise inconnue/)
  })

  it('écrit un écart avec son signe explicite', () => {
    // Sans le « + », un écart positif se lit comme un total.
    expect(formaterEcart(12500, 'XOF')).toBe(
      `+${FINE_INSECABLE}12${FINE_INSECABLE}500${FINE_INSECABLE}F`,
    )
    expect(formaterEcart(-8000, 'XOF')).toBe(
      `−${FINE_INSECABLE}8${FINE_INSECABLE}000${FINE_INSECABLE}F`,
    )
  })
})
