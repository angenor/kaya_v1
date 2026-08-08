import { describe, expect, it } from 'vitest'

import * as deloria from '../../app/core/donnees/jeux/deloria'
import type { BaremePalier } from '../../app/core/donnees/hebergement/types'
import {
  dureesProposees,
  palierAtteint,
  prixDeLaDuree,
  rebasculeDePalier,
} from '../../app/core/reception/bareme'

/**
 * LE TEST DORÉ DU BARÈME — jeu de cas **figés**, calcul **pur**.
 *
 * ⚠️ **LES CAS SONT FIGÉS, LES TARIFS NE LE SONT PAS.** Les six durées et leurs
 * six montants sont écrits ici une fois pour toutes ; les paliers, eux, sont
 * **lus au référentiel de Deloria**. C'est ce qui rend le dernier test de ce
 * fichier possible — changer un palier du jeu change le résultat **sans toucher
 * au code** — et c'est la propriété que la constitution demande au principe 5.
 *
 * ⚠️ **ET C'EST UN TEST D'ARGENT.** Un barème faux ne se voit pas à l'écran :
 * il se voit au comptage de caisse, trois semaines plus tard, sans qu'on sache
 * à quel passage rattacher l'écart.
 */

/**
 * ⚠️ **LE BARÈME EST FILTRÉ SUR LA FORMULE, ET C'EST NÉCESSAIRE.** Deloria porte
 * désormais le même barème relevé sur ses **cinq catégories** — sans quoi
 * quatorze chambres sur dix-sept seraient invendables au passage. Un test qui
 * lirait `baremePaliers` entier verrait vingt-cinq lignes et cinq paliers « 1 h ».
 */
const BAREME = deloria.baremePaliers.filter(
  (palier) => palier.formuleId === 'deloria-formule-standard-passage',
)
const FORMULE_PASSAGE = deloria.formules.find(
  (formule) => formule.id === 'deloria-formule-standard-passage',
)!
const FORMULE_NUITEE = deloria.formules.find(
  (formule) => formule.id === 'deloria-formule-standard-nuitee',
)!

/** Le prix d'une durée, ou l'échec du test si le barème a rendu une bascule. */
function montantDe(dureeMinutes: number): number {
  const issue = prixDeLaDuree(BAREME, FORMULE_PASSAGE, dureeMinutes)
  if (issue === null || issue.bascule) {
    throw new Error(`aucun prix pour ${dureeMinutes} min — le cas doré est mal posé`)
  }
  return issue.prix.montant
}

describe('les six cas dorés du barème dégressif', () => {
  it('1 h — le premier palier', () => {
    expect(montantDe(60)).toBe(1500)
  })

  it('2 h — dégressif : moins que deux fois une heure', () => {
    expect(montantDe(120)).toBe(2800)
    // ⚠️ LE DÉGRESSIF EST LA PROPRIÉTÉ, pas le montant : deux heures coûtent
    // moins que deux fois une heure. Un barème qui perdrait cette propriété
    // aurait cessé d'être dégressif sans que le nom change.
    expect(montantDe(120)).toBeLessThan(2 * montantDe(60))
  })

  it('3 h', () => {
    expect(montantDe(180)).toBe(4000)
  })

  it('4 h — le dernier palier', () => {
    expect(montantDe(240)).toBe(5000)
  })

  it('4 h 30 — une heure supplémentaire ENTIÈRE et COMMENCÉE', () => {
    // Une demi-heure entamée immobilise la chambre autant qu'une heure pleine.
    // La proratiser demanderait de compter les minutes au comptoir.
    expect(montantDe(270)).toBe(5000 + 1200)
    const issue = prixDeLaDuree(BAREME, FORMULE_PASSAGE, 270)
    expect(issue?.bascule).toBe(false)
    if (issue && !issue.bascule) {
      expect(issue.prix.paliersMinutes).toBe(240)
      expect(issue.prix.heuresSupplementaires).toBe(1)
    }
  })

  it("8 h 01 — au-delà du seuil, ce n'est plus un passage : une ANNONCE, pas un prix", () => {
    const prixNuitee = FORMULE_NUITEE.prixBase!
    const issue = prixDeLaDuree(BAREME, FORMULE_PASSAGE, 481, prixNuitee)
    expect(issue?.bascule).toBe(true)
    if (issue?.bascule) {
      // 480 min = le seuil_bascule_nuitee_minutes du Récapitulatif, LU à la
      // formule et jamais écrit dans le code.
      expect(issue.seuilMinutes).toBe(FORMULE_PASSAGE.dureeMaxMinutes)
      expect(issue.montantNuitee).toBe(prixNuitee)
    }
  })
})

describe('ce que le barème refuse de décider', () => {
  it("sous le premier palier, il n'invente pas de prix", () => {
    // Inventer un tarif pour 30 minutes serait décider d'un prix — ce qui
    // n'appartient pas au code.
    expect(prixDeLaDuree(BAREME, FORMULE_PASSAGE, 30)).toBeNull()
    expect(palierAtteint(BAREME, 30)).toBeNull()
  })

  it('sans prix de nuitée, il bascule QUAND MÊME — et le dit sans montant', () => {
    // ⚠️ TROUVÉ PAR CE TEST, ET LE DÉFAUT ÉTAIT RÉEL : la bascule était
    // conditionnée par la connaissance du tarif de nuitée. Une durée de 10 h
    // sans tarif connu produisait donc un prix de barème horaire — soit plus
    // cher qu'une nuitée, facturé sans que personne ait rien annoncé.
    const issue = prixDeLaDuree(BAREME, FORMULE_PASSAGE, 481)
    expect(issue?.bascule).toBe(true)
    if (issue?.bascule) expect(issue.montantNuitee).toBeNull()
  })
})

describe('les durées proposées viennent du barème, jamais du composant', () => {
  it('quatre paliers à Deloria, dans l’ordre', () => {
    expect(dureesProposees(BAREME)).toEqual([60, 120, 180, 240])
  })

  it("l'heure supplémentaire n'est PAS une durée proposée", () => {
    // Elle porte `dureeMinutes: 60`, comme le premier palier. La confondre
    // afficherait deux boutons « 1 h » dont le second facturerait 1 200 F.
    expect(dureesProposees(BAREME).filter((duree) => duree === 60)).toHaveLength(1)
  })
})

describe('la rebascule de palier — la ligne d’origine reste visible', () => {
  it('2 h payées, 3 h 20 occupées : le complément, et les deux paliers nommés', () => {
    const rebascule = rebasculeDePalier(BAREME, FORMULE_PASSAGE, 120, 200)
    expect(rebascule).not.toBeNull()
    // 3 h 20 → palier 180 (4 000) + 1 heure supplémentaire entamée (1 200).
    expect(rebascule?.complement).toBe(4000 + 1200 - 2800)
    expect(rebascule?.palierOrigineMinutes).toBe(120)
    expect(rebascule?.palierAtteintMinutes).toBe(180)
    expect(rebascule?.heuresSupplementaires).toBe(1)
  })

  it('rien n’est dû quand la durée réelle tient dans le palier payé', () => {
    expect(rebasculeDePalier(BAREME, FORMULE_PASSAGE, 120, 110)).toBeNull()
    expect(rebasculeDePalier(BAREME, FORMULE_PASSAGE, 120, 120)).toBeNull()
  })

  it('une bascule en nuitée n’est PAS une rebascule', () => {
    // Elle s'annonce et se confirme ; l'ajouter d'autorité à la note ferait
    // payer une nuitée à quelqu'un qui n'a rien confirmé.
    expect(rebasculeDePalier(BAREME, FORMULE_PASSAGE, 120, 600)).toBeNull()
  })
})

describe('changer un palier du jeu change le résultat SANS toucher au code', () => {
  it('un palier de 2 h à 3 000 F rend 3 000 F', () => {
    // ⚠️ C'EST LA PROPRIÉTÉ QUE LE CYCLE DOIT TENIR, et elle se prouve en
    // changeant la donnée, pas en relisant le code. Un tarif écrit en dur
    // passerait tous les tests ci-dessus et échouerait celui-ci.
    const modifie: readonly BaremePalier[] = BAREME.map((palier) =>
      palier.dureeMinutes === 120 && !palier.estHeureSupplementaire
        ? { ...palier, prix: 3000 }
        : palier,
    )
    const issue = prixDeLaDuree(modifie, FORMULE_PASSAGE, 120)
    expect(issue?.bascule).toBe(false)
    if (issue && !issue.bascule) expect(issue.prix.montant).toBe(3000)
  })

  it('un cinquième palier de 5 h apparaît dans les durées proposées', () => {
    const avecCinq: readonly BaremePalier[] = [
      ...BAREME,
      {
        id: 'palier-essai-300',
        tenantId: deloria.TENANT_DELORIA,
        formuleId: FORMULE_PASSAGE.id,
        dureeMinutes: 300,
        prix: 5800,
        codeDevise: 'XOF',
        estHeureSupplementaire: false,
      },
    ]
    expect(dureesProposees(avecCinq)).toEqual([60, 120, 180, 240, 300])
  })
})
