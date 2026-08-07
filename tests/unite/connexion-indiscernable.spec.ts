import { afterEach, describe, expect, it } from 'vitest'

import { simulationComptes } from '../../app/core/donnees/comptes/simulation'
import {
  REGLAGES_INITIAUX,
  poserReglages,
} from '../../app/core/scenarios/reglages'

/**
 * LE DÉLAI EST INDISCERNABLE — FR-004, SC-005.
 *
 * ⚠️ « UN REFUS EN 2 ms SUR COMPTE INEXISTANT CONTRE 90 ms SUR MOT DE PASSE FAUX
 * PUBLIE LA LISTE DES COMPTES » (CPT-01). Le message identique ne suffit pas :
 * qui essaie des numéros au hasard lit la différence au chronomètre, et le
 * produit lui dit lesquels existent sans écrire un mot.
 *
 * ⚠️ TEST D'**UNITÉ**, JAMAIS DE NAVIGATEUR, et ce n'est pas un raccourci. Le
 * bruit d'un moteur réel — mise en page, ramasse-miettes, ordonnancement —
 * dépasse largement l'écart cherché : la mesure y serait dominée par ce qu'elle
 * ne mesure pas, et le test rougirait selon la charge de la machine. Ce qu'on
 * vérifie ici est une propriété du CODE : les deux chemins traversent la même
 * attente, et le verdict se calcule après.
 *
 * ⚠️ ET L'ATTENTE EST **DÉTERMINISTE** : c'est le levier de latence du panneau
 * Scénarios, pas une horloge réseau.
 */

/** Un compte du jeu, et un identifiant qui n'existe pas. */
const IDENTIFIANT_CONNU = '0700000001'
const IDENTIFIANT_INCONNU = '0799999999'
/** Le compte de Mariam — au jeu, et `SUSPENDU`. */
const IDENTIFIANT_SUSPENDU = '0700000005'

/** Assez de mesures pour qu'une médiane veuille dire quelque chose. */
const TENTATIVES = 20

/** La latence sous laquelle on mesure — assez pour dominer le bruit de la VM. */
const LATENCE_MS = 15

function mediane(valeurs: readonly number[]): number {
  const triees = [...valeurs].sort((a, b) => a - b)
  const milieu = Math.floor(triees.length / 2)
  return triees.length % 2 === 0
    ? ((triees[milieu - 1] ?? 0) + (triees[milieu] ?? 0)) / 2
    : (triees[milieu] ?? 0)
}

async function mesurer(identifiant: string, motDePasse: string): Promise<number[]> {
  const durees: number[] = []
  for (let essai = 0; essai < TENTATIVES; essai += 1) {
    const debut = performance.now()
    await simulationComptes.identifier(identifiant, motDePasse)
    durees.push(performance.now() - debut)
  }
  return durees
}

afterEach(() => {
  poserReglages(REGLAGES_INITIAUX)
})

describe("le refus ne dit pas quels comptes existent", () => {
  it('compte inconnu et mot de passe faux répondent le MÊME code', async () => {
    const inconnu = await simulationComptes.identifier(IDENTIFIANT_INCONNU, 'peu-importe')
    const faux = await simulationComptes.identifier(IDENTIFIANT_CONNU, '')
    expect(inconnu.ok).toBe(false)
    expect(faux.ok).toBe(false)
    if (inconnu.ok || faux.ok) return
    expect(inconnu.echec.code).toBe('IDENTIFIANTS_INVALIDES')
    expect(faux.echec.code).toBe(inconnu.echec.code)
  })

  it('⚠️ UN COMPTE SUSPENDU REND LA MÊME PHRASE QU’UN COMPTE INCONNU', () => {
    // Le compte de Mariam existe au jeu et n'est pas `ACTIF`. Dire « ce compte
    // est suspendu » confirmerait qu'il existe, et publierait la liste par la
    // porte de derrière. **Sans ce compte au jeu, la branche n'était exercée
    // par rien** — et une règle que rien n'exerce est une règle qu'on croit
    // tenue.
    return Promise.all([
      simulationComptes.identifier(IDENTIFIANT_SUSPENDU, 'peu-importe'),
      simulationComptes.identifier(IDENTIFIANT_INCONNU, 'peu-importe'),
    ]).then(([suspendu, inconnu]) => {
      expect(suspendu.ok).toBe(false)
      expect(inconnu.ok).toBe(false)
      if (suspendu.ok || inconnu.ok) return
      expect(suspendu.echec.code).toBe('IDENTIFIANTS_INVALIDES')
      expect(suspendu.echec).toEqual(inconnu.echec)
    })
  })

  it('⚠️ LES MÉDIANES NE SE DISTINGUENT PAS — écart < 10 % (SC-005)', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, latenceMs: LATENCE_MS })

    // Un tour à blanc : la première invocation paie la compilation JIT et le
    // chargement des métadonnées de numéros. La compter fausserait le premier
    // des deux chemins mesurés, quel qu'il soit.
    await mesurer(IDENTIFIANT_CONNU, 'chauffe')

    const medianeInconnu = mediane(await mesurer(IDENTIFIANT_INCONNU, 'peu-importe'))
    const medianeMotDePasseFaux = mediane(await mesurer(IDENTIFIANT_CONNU, ''))

    const ecart =
      Math.abs(medianeInconnu - medianeMotDePasseFaux) /
      Math.max(medianeInconnu, medianeMotDePasseFaux)

    expect(
      ecart,
      `médiane compte inconnu ${medianeInconnu.toFixed(2)} ms · mot de passe faux ${medianeMotDePasseFaux.toFixed(2)} ms — l'écart publie la liste des comptes`,
    ).toBeLessThan(0.1)
  })

  it("l'attente est traversée par les DEUX chemins, pas seulement par le succès", async () => {
    // La propriété structurelle, mesurée plutôt que relue : sous une latence
    // franche, un refus met AU MOINS cette latence. Un refus instantané
    // signifierait que le verdict se décide avant l'attente.
    poserReglages({ ...REGLAGES_INITIAUX, latenceMs: 40 })
    const debut = performance.now()
    await simulationComptes.identifier(IDENTIFIANT_INCONNU, 'peu-importe')
    expect(performance.now() - debut).toBeGreaterThanOrEqual(35)
  })

  it("le champ vide, lui, ne fait PAS attendre — il n'y a rien à protéger", async () => {
    // Ce n'est pas une tentative : rien n'a été soumis. Faire patienter
    // quelqu'un pour lui dire qu'il n'a rien tapé serait une lenteur sans objet,
    // et le code rendu est distinct — la personne doit savoir quoi corriger.
    poserReglages({ ...REGLAGES_INITIAUX, latenceMs: 60 })
    const debut = performance.now()
    const resultat = await simulationComptes.identifier('   ', 'peu-importe')
    expect(performance.now() - debut).toBeLessThan(40)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('IDENTIFIANT_ABSENT')
  })

  it('hors ligne, le refus est prononcé AVANT toute tentative', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, horsLigne: true, latenceMs: 60 })
    const debut = performance.now()
    const resultat = await simulationComptes.identifier(IDENTIFIANT_CONNU, 'peu-importe')
    expect(performance.now() - debut).toBeLessThan(40)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('HORS_LIGNE')
  })

  it("un compte ACTIF entre avec n'importe quel mot de passe non vide", async () => {
    const resultat = await simulationComptes.identifier(IDENTIFIANT_CONNU, 'n-importe-quoi')
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(resultat.valeur.compteId).toBe('compte-adjoua')
    // Et il reçoit SES établissements, jamais la liste complète.
    expect(resultat.valeur.etablissements.map((e) => e.id)).toEqual(['deloria-etablissement'])
  })

  it('M. Koffi reçoit ses TROIS sites ; Aminata, le sien seulement', async () => {
    const koffi = await simulationComptes.identifier('0700000004', 'x')
    const aminata = await simulationComptes.identifier('0700000003', 'x')
    expect(koffi.ok && koffi.valeur.etablissements).toHaveLength(3)
    expect(aminata.ok && aminata.valeur.etablissements).toHaveLength(1)
  })
})
