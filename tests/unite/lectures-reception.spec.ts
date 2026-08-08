import { afterEach, describe, expect, it } from 'vitest'

import { reposerMouvement } from '../../app/core/donnees/hebergement/magasin'
import { simulationReception } from '../../app/core/donnees/hebergement/simulation'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as residenceTest from '../../app/core/donnees/jeux/residence-test'
import { instantAutorite, decale } from '../../app/core/donnees/horloge'
import { REGLAGES_INITIAUX, poserReglages } from '../../app/core/scenarios/reglages'

/**
 * LES TROIS LECTURES DE LA RÉCEPTION — et les leviers qu'elles honorent **sans
 * une ligne de code propre**.
 *
 * ⚠️ **CE QUI EST ÉPROUVÉ ICI N'EST PAS « ELLES RENDENT DES DONNÉES ».** C'est
 * qu'elles refusent hors ligne, échouent sur panne, se vident sur jeu vide, et
 * qu'un établissement sans hébergement n'y voit **rien** — pas une erreur, pas
 * une liste partielle : rien.
 */

const DELORIA = { etablissementId: deloria.ETABLISSEMENT_DELORIA }
const TEST = { etablissementId: residenceTest.ETABLISSEMENT_TEST }
const FORMULE_PASSAGE = 'deloria-formule-standard-passage'

afterEach(() => {
  poserReglages(REGLAGES_INITIAUX)
  reposerMouvement()
})

function periodeProchaine(heures = 2) {
  const debut = instantAutorite()
  return { debut, fin: decale(debut, heures * 60) }
}

describe('listerOccupations', () => {
  it('rend les occupations qui touchent la période demandée', async () => {
    const resultat = await simulationReception.listerOccupations(DELORIA, {
      debut: decale(instantAutorite(), -24 * 60),
      fin: decale(instantAutorite(), 24 * 60),
    })
    expect(resultat.ok).toBe(true)
    if (resultat.ok) expect(resultat.valeur.length).toBeGreaterThan(0)
  })

  it('« Résidence Test » ne voit RIEN — pas une erreur, une liste vide', async () => {
    // ⚠️ LE CONTRÔLE DU PRINCIPE 2. Un établissement sans hébergement actif ne
    // doit voir aucune surface de ce cycle, et la lecture ne le sait pas :
    // elle rend vide parce que le jeu est vide, jamais parce qu'un `if`
    // l'aurait exclu.
    const resultat = await simulationReception.listerOccupations(TEST, {
      debut: decale(instantAutorite(), -24 * 60),
      fin: decale(instantAutorite(), 24 * 60),
    })
    expect(resultat.ok).toBe(true)
    if (resultat.ok) expect(resultat.valeur).toEqual([])
  })

  it('refuse hors ligne, et échoue sur panne réseau — sans code propre', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, horsLigne: true })
    const horsLigne = await simulationReception.listerOccupations(DELORIA, periodeProchaine())
    expect(horsLigne.ok).toBe(false)
    if (!horsLigne.ok) expect(horsLigne.echec.code).toBe('HORS_LIGNE')

    poserReglages({ ...REGLAGES_INITIAUX, echecReseau: true })
    const panne = await simulationReception.listerOccupations(DELORIA, periodeProchaine())
    expect(panne.ok).toBe(false)
    if (!panne.ok) expect(panne.echec.code).toBe('ECHEC_RESEAU')
  })
})

describe('listerUnitesDisponibles', () => {
  it('ne rend que les unités de la catégorie de la FORMULE', async () => {
    // ⚠️ Le pendant du refus FORMULE_HORS_CATEGORIE : proposer une chambre à
    // laquelle la formule ne s'applique pas ferait découvrir le refus au tap.
    const resultat = await simulationReception.listerUnitesDisponibles(
      DELORIA,
      FORMULE_PASSAGE,
      periodeProchaine(),
    )
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    for (const disponible of resultat.valeur) {
      expect(disponible.unite.categorieId).toBe('deloria-categorie-standard')
    }
  })

  it("écarte la chambre dont la REMISE EN ÉTAT couvre la demande", async () => {
    // C1 est en Classique supérieure ; son occupation est finie, son ménage
    // court encore. C'est le refus qu'on oublie, parce que la chambre PARAÎT
    // libre.
    const resultat = await simulationReception.listerUnitesDisponibles(
      DELORIA,
      'deloria-formule-classique-sup-passage',
      periodeProchaine(),
    )
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(resultat.valeur.map((d) => d.unite.code)).not.toContain('C1')
  })

  it('sur le jeu « complet », plus AUCUNE chambre n’est libre', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, casDuJeu: 'complet' })
    const resultat = await simulationReception.listerUnitesDisponibles(
      DELORIA,
      FORMULE_PASSAGE,
      periodeProchaine(),
    )
    expect(resultat.ok).toBe(true)
    if (resultat.ok) expect(resultat.valeur).toEqual([])
  })

  it('une formule inconnue ne rend rien plutôt que tout', async () => {
    const resultat = await simulationReception.listerUnitesDisponibles(
      DELORIA,
      'formule-qui-nexiste-pas',
      periodeProchaine(),
    )
    expect(resultat.ok).toBe(true)
    if (resultat.ok) expect(resultat.valeur).toEqual([])
  })
})

describe('listerProchainesLiberations', () => {
  it('rend ce qui se libère, dans l’ordre du temps et borné', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, casDuJeu: 'complet' })
    const resultat = await simulationReception.listerProchainesLiberations(
      DELORIA,
      instantAutorite(),
      3,
    )
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(resultat.valeur).toHaveLength(3)
    const instants = resultat.valeur.map((l) => Date.parse(l.libreA))
    expect([...instants].sort((a, b) => a - b)).toEqual(instants)
    // ⚠️ L'écran affiche un CODE de chambre, jamais un identifiant technique.
    for (const liberation of resultat.valeur) {
      expect(liberation.codeUnite).not.toContain('deloria-unite-')
    }
  })

  it('le levier « jeu vide » les fait disparaître', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, jeuVide: true })
    const resultat = await simulationReception.listerProchainesLiberations(
      DELORIA,
      instantAutorite(),
      3,
    )
    expect(resultat.ok).toBe(true)
    if (resultat.ok) expect(resultat.valeur).toEqual([])
  })
})

describe('le magasin de mouvement', () => {
  it('se recharge quand le cas du jeu change, et seulement alors', async () => {
    const avant = await simulationReception.listerOccupations(DELORIA, {
      debut: decale(instantAutorite(), -60),
      fin: decale(instantAutorite(), 60),
    })
    poserReglages({ ...REGLAGES_INITIAUX, casDuJeu: 'complet' })
    const apres = await simulationReception.listerOccupations(DELORIA, {
      debut: decale(instantAutorite(), -60),
      fin: decale(instantAutorite(), 60),
    })
    expect(avant.ok && apres.ok).toBe(true)
    if (!avant.ok || !apres.ok) return
    expect(apres.valeur.length).toBeGreaterThan(avant.valeur.length)
  })
})
