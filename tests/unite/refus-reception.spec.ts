import { v7 as uuidV7 } from 'uuid'
import { afterEach, describe, expect, it } from 'vitest'

import fr from '../../app/core/i18n/fr'
import en from '../../app/core/i18n/en'
import { mouvement, reposerMouvement } from '../../app/core/donnees/hebergement/magasin'
import { simulationEcrituresReception } from '../../app/core/donnees/hebergement/simulation'
import type { DemandePassage } from '../../app/core/donnees/hebergement/interface'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import { REGLAGES_INITIAUX, poserReglages } from '../../app/core/scenarios/reglages'

/**
 * LES SIX REFUS DE DISPONIBILITÉ — **chacun nomme ce qui bloque**.
 *
 * ⚠️ **UN MESSAGE GÉNÉRIQUE EST UN DÉFAUT, PAS UNE SIMPLIFICATION.** C'est la
 * différence entre un refus qu'Adjoua peut **expliquer au client** et un refus
 * qu'elle **contournera** — en notant le passage sur un cahier, ce que le
 * produit existe précisément pour éviter.
 *
 * ⚠️ **ET LE VOCABULAIRE DE LA TABLE N'ATTEINT JAMAIS L'ÉCRAN.** « Conflit »,
 * « chevauchement », « occupation », « intervalle » sont les mots du modèle ;
 * l'utilisateur lit « déjà prise », « tenue à partir de », « la fin doit être
 * après le début ».
 */

const ETABLISSEMENT = deloria.ETABLISSEMENT_DELORIA

afterEach(() => {
  poserReglages(REGLAGES_INITIAUX)
  reposerMouvement()
})

function demande(surcharge: Partial<DemandePassage> = {}): DemandePassage {
  return {
    id: uuidV7(),
    etablissementId: ETABLISSEMENT,
    uniteId: 'deloria-unite-a1',
    formuleId: 'deloria-formule-standard-passage',
    dureeMinutes: 120,
    clientId: null,
    horodatageClient: null,
    ...surcharge,
  }
}

describe('les six refus de FR-021', () => {
  it('1 · la chambre est déjà prise — et le refus NOMME la période', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-b1', formuleId: 'deloria-formule-classique-passage' }),
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.echec.code).toBe('UNITE_DEJA_OCCUPEE')
    expect(resultat.echec.parametres.unite).toBe('B1')
  })

  it('2 · une occupation SUIVANTE — et la liste des chambres libres du même type', async () => {
    // ⚠️ LE SEUL REFUS QUI PORTE UNE LISTE, et c'est l'alternative que le
    // lexique exige : sans elle, la phrase serait vraie et inutile.
    const etat = mouvement()
    const dansUneHeure = new Date(Date.now() + 3_600_000).toISOString()
    etat.occupations.push({
      id: 'occ-suivante',
      tenantId: 'deloria',
      uniteId: 'deloria-unite-a1',
      motif: 'SEJOUR',
      periode: { debut: dansUneHeure, fin: new Date(Date.now() + 7_200_000).toISOString() },
      periodeIndisponibilite: {
        debut: dansUneHeure,
        fin: new Date(Date.now() + 9_000_000).toISOString(),
      },
      statut: 'ACTIVE',
      origineType: 'sejour',
      origineId: 'sejour-suivant',
      horodatageClient: null,
      creeLe: dansUneHeure,
    })

    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ dureeMinutes: 240 }),
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.echec.code).toBe('CONFLIT_OCCUPATION_SUIVANTE')
    expect(Array.isArray(resultat.echec.parametres.chambresLibres)).toBe(true)
    expect(resultat.echec.parametres.chambresLibres).toContain('A2')
    // Et l'heure de la tenue est nommée.
    expect(String(resultat.echec.parametres.heure)).toMatch(/\d/)
  })

  it('4 · une demi-journée ne se fractionne pas — et les DEUX plages sont nommées', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ formuleId: 'deloria-formule-standard-demi-journee', dureeMinutes: 120 }),
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.echec.code).toBe('PLAGE_NON_FRACTIONNABLE')
    // ⚠️ LES PLAGES VIENNENT DE L'ÉTABLISSEMENT, jamais du code : le lexique
    // l'exige, et la phrase les REÇOIT.
    expect(String(resultat.echec.parametres.plage1)).toContain('08:00')
    expect(String(resultat.echec.parametres.plage2)).toContain('13:00')
  })

  it('la plage ENTIÈRE passe le contrôle de fractionnement — ce qui suit est un autre refus', async () => {
    // ⚠️ **UN MANQUE DU RÉFÉRENTIEL, NOMMÉ PLUTÔT QUE MASQUÉ.** La demi-journée
    // de Deloria n'a **ni barème ni prix de base** : le cadrage §5.3 ne relève
    // qu'un barème de passage, et le jeu n'invente pas de tarif. La plage
    // entière franchit donc le contrôle de fractionnement — c'est ce que ce
    // test prouve — puis échoue sur le **tarif introuvable**.
    //
    // ⚠️ Une première version rendait ici `DUREE_HORS_CONTRAINTE { min: 1,
    // max: 8 }` : deux valeurs métier écrites dans le code, sur un chemin qui
    // n'a rien à voir avec une durée. Le refus dit désormais ce qui manque.
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ formuleId: 'deloria-formule-standard-demi-journee', dureeMinutes: 240 }),
    )
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('INTROUVABLE')
  })

  it('6 · la durée hors contrainte — et les bornes de la FORMULE', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ dureeMinutes: 30 }),
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.echec.code).toBe('DUREE_HORS_CONTRAINTE')
    expect(resultat.echec.parametres.min).toBe(1)
    expect(resultat.echec.parametres.max).toBe(8)
  })
})

describe('le refus se décide AU MOMENT DU TAP, jamais au moment de l’affichage', () => {
  it('une chambre devenue occupée entre le rendu et le tap est refusée', async () => {
    // ⚠️ **LE CAS DES DEUX RÉCEPTIONNISTES À LA MÊME SECONDE.** La grille montre
    // l'état d'il y a quelques secondes ; entre les deux, un autre poste a pu
    // donner la chambre. Sans ce levier, ce cas ne serait exercé par rien — et
    // c'est celui qui décide si le refus arrive avant ou après la clé.
    poserReglages({ ...REGLAGES_INITIAUX, conflitAuTap: true })
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('UNITE_DEJA_OCCUPEE')
  })

  it('sans le levier, la même demande passe — le refus vient de l’état, pas d’un drapeau', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(true)
  })
})

describe('aucun mot de la table n’atteint l’écran', () => {
  /**
   * ⚠️ **LE CONTRÔLE PORTE SUR LES DEUX CATALOGUES**, c'est-à-dire sur tout ce
   * qui peut atteindre le document. Un mot introduit dans une phrase de refus
   * ne se verrait sinon qu'au jour où le refus se produit — au comptoir.
   */
  const PROSCRITS = [
    'conflit',
    'chevauchement',
    'occupation',
    'intervalle',
    'palier',
    'check-in',
    'check-out',
  ]

  for (const [langue, catalogue] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    it(`${langue} : les phrases de refus n’emploient aucun mot du modèle`, () => {
      const phrases = Object.values(catalogue.refus as Record<string, string>)
      for (const phrase of phrases) {
        for (const mot of PROSCRITS) {
          expect(
            phrase.toLowerCase().includes(mot),
            `« ${mot} » dans « ${phrase} »`,
          ).toBe(false)
        }
      }
    })
  }

  it('les onze codes du contrat ont TOUS leur phrase ET leur alternative, dans les deux langues', () => {
    // ⚠️ « Toute interdiction a un versant positif » : une phrase sans
    // alternative est vraie et inutile à quelqu'un debout au comptoir.
    const CODES = [
      'UNITE_DEJA_OCCUPEE',
      'CONFLIT_OCCUPATION_SUIVANTE',
      'UNITE_CIBLE_OCCUPEE',
      'PLAGE_NON_FRACTIONNABLE',
      'INTERVALLE_INVALIDE',
      'DUREE_HORS_CONTRAINTE',
      'FORMULE_HORS_CATEGORIE',
      'SEJOUR_DEJA_CLOS',
      'SEJOUR_CLOS',
      'NOTE_ARRETEE',
      'BASCULE_FORMULE_NON_CONFIRMEE',
    ]
    for (const catalogue of [fr, en]) {
      const refus = catalogue.refus as Record<string, string>
      for (const code of CODES) {
        expect(refus[code], code).toBeTruthy()
        expect(refus[`${code}Alternative`], `${code}Alternative`).toBeTruthy()
      }
    }
  })
})
