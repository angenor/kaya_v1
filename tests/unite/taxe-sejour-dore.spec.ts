import { describe, expect, it } from 'vitest'

import * as deloria from '../../app/core/donnees/jeux/deloria'
import type { Formule } from '../../app/core/donnees/hebergement/types'
import { constaterTaxeSejour } from '../../app/core/reception/taxe-sejour'

/**
 * LE TEST DORÉ DE LA TAXE DE SÉJOUR — **celui qui refuse la valeur de la
 * maquette**.
 *
 * ⚠️ **4 NUITS × 2 PERSONNES = 500 F, PAS 4 000 F.** `R7-note-depart.html`
 * affiche « 4 000 F » et « par personne et par nuit ». Elle est **antérieure à
 * la clôture de la décision B-10** (cadrage §9.6) : la taxe se compte **par
 * nuitée et par séjour**, jamais par personne. La maquette reste la référence
 * pour le **dessin** de la ligne ; ce test est la référence pour le **montant**.
 *
 * ⚠️ **ET LE MÊME SÉJOUR À UNE PERSONNE DOIT DONNER LE MÊME MONTANT.** C'est la
 * seule assertion qui prouve que le nombre de personnes n'entre dans aucun
 * calcul : un code qui multiplierait par les personnes passerait le premier
 * test si on l'écrivait avec une seule.
 */

const TAXE_UNITAIRE = deloria.TAXE_NUITEE_MINEUR
const DEVISE = 'XOF'

const FORMULE_NUITEE = deloria.formules.find(
  (formule) => formule.id === 'deloria-formule-standard-nuitee',
)!
const FORMULE_PASSAGE = deloria.formules.find(
  (formule) => formule.id === 'deloria-formule-standard-passage',
)!
const FORMULE_DEMI = deloria.formules.find(
  (formule) => formule.id === 'deloria-formule-standard-demi-journee',
)!
const FORMULE_MENSUEL = deloria.formules.find(
  (formule) => formule.id === 'deloria-formule-standard-mensuel',
)!

/** Un séjour de `nuits` nuits, en instants absolus. */
function sejourDe(nuits: number) {
  return {
    debut: '2026-08-08T14:00:00.000Z',
    fin: new Date(Date.parse('2026-08-08T14:00:00.000Z') + nuits * 86_400_000).toISOString(),
  }
}

describe('le cas doré central — 4 nuits, 2 personnes', () => {
  const constat = constaterTaxeSejour(FORMULE_NUITEE, sejourDe(4), TAXE_UNITAIRE, DEVISE, 2)

  it('500 F, et NON 4 000 F comme la maquette', () => {
    expect(constat.montantTotal).toBe(500)
    expect(constat.montantTotal).not.toBe(4000)
  })

  it('une seule nuitée assujettie — « une nuitée par occupation »', () => {
    expect(constat.nuiteesAssujetties).toBe(1)
    expect(constat.regleAppliquee).toBe('une_nuitee_par_occupation')
  })

  it('LE MÊME SÉJOUR À UNE PERSONNE DONNE LE MÊME MONTANT', () => {
    // ⚠️ C'est l'assertion qui interdit la multiplication par les personnes.
    const seul = constaterTaxeSejour(FORMULE_NUITEE, sejourDe(4), TAXE_UNITAIRE, DEVISE, 1)
    expect(seul.montantTotal).toBe(constat.montantTotal)
    const nombreux = constaterTaxeSejour(FORMULE_NUITEE, sejourDe(4), TAXE_UNITAIRE, DEVISE, 6)
    expect(nombreux.montantTotal).toBe(constat.montantTotal)
  })
})

describe('le second cas doré — au prorata', () => {
  it('500 F × 4 nuits = 2 000 F', () => {
    const constat = constaterTaxeSejour(FORMULE_MENSUEL, sejourDe(4), TAXE_UNITAIRE, DEVISE, 2)
    expect(constat.nuiteesAssujetties).toBe(4)
    expect(constat.montantTotal).toBe(2000)
    expect(constat.regleAppliquee).toBe('au_prorata')
  })

  it('les personnes ne comptent pas davantage au prorata', () => {
    const deux = constaterTaxeSejour(FORMULE_MENSUEL, sejourDe(4), TAXE_UNITAIRE, DEVISE, 2)
    const cinq = constaterTaxeSejour(FORMULE_MENSUEL, sejourDe(4), TAXE_UNITAIRE, DEVISE, 5)
    expect(cinq.montantTotal).toBe(deux.montantTotal)
  })
})

describe('le troisième cas doré — passage et demi-journée', () => {
  it("aucune ligne n'est due, ET L'APPEL A TOUT DE MÊME LIEU", () => {
    // ⚠️ Sauter l'appel ferait disparaître le cas de la couverture, et la
    // première formule de passage assujettie — une autre commune, un autre
    // pays — arriverait sur du code que rien n'a jamais exercé.
    const passage = constaterTaxeSejour(
      FORMULE_PASSAGE,
      { debut: '2026-08-08T14:00:00.000Z', fin: '2026-08-08T16:00:00.000Z' },
      TAXE_UNITAIRE,
      DEVISE,
      1,
    )
    expect(passage.nuiteesAssujetties).toBe(0)
    expect(passage.montantTotal).toBe(0)
    // ⚠️ ZÉRO EST UNE RÉPONSE, PAS UN VIDE : la règle appliquée est nommée.
    expect(passage.regleAppliquee).toBe('non_assujettie')

    const demi = constaterTaxeSejour(
      FORMULE_DEMI,
      { debut: '2026-08-08T08:00:00.000Z', fin: '2026-08-08T12:00:00.000Z' },
      TAXE_UNITAIRE,
      DEVISE,
      1,
    )
    expect(demi.nuiteesAssujetties).toBe(0)
    expect(demi.regleAppliquee).toBe('non_assujettie')
  })
})

describe('aucune valeur fiscale n’est écrite dans le code', () => {
  it('changer le montant unitaire change le résultat', () => {
    const constat = constaterTaxeSejour(FORMULE_NUITEE, sejourDe(4), 750, DEVISE, 2)
    expect(constat.montantTotal).toBe(750)
  })

  it("changer la règle de la FORMULE change la conversion", () => {
    // La règle est une colonne — `regle_conversion_taxe` —, et elle peut
    // différer par commune (cadrage §5.5, B-02). Deux branches inventées dans
    // le code auraient rendu ce test impossible.
    const auProrata: Formule = { ...FORMULE_NUITEE, regleConversionTaxe: 'au_prorata' }
    expect(constaterTaxeSejour(auProrata, sejourDe(3), TAXE_UNITAIRE, DEVISE, 1).nuiteesAssujetties)
      .toBe(3)
  })

  it("une formule assujettie SANS règle ne devine pas — elle rend zéro et le dit", () => {
    const sansRegle: Formule = { ...FORMULE_NUITEE, regleConversionTaxe: null }
    const constat = constaterTaxeSejour(sansRegle, sejourDe(4), TAXE_UNITAIRE, DEVISE, 2)
    expect(constat.montantTotal).toBe(0)
    expect(constat.regleAppliquee).toBe('non_assujettie')
  })
})
