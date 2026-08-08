import { v7 as uuidV7 } from 'uuid'
import { afterEach, describe, expect, it } from 'vitest'

import { mouvement, reposerMouvement } from '../../app/core/donnees/hebergement/magasin'
import { simulationEcrituresReception } from '../../app/core/donnees/hebergement/simulation'
import type { DemandePassage } from '../../app/core/donnees/hebergement/interface'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import { REGLAGES_INITIAUX, poserReglages } from '../../app/core/scenarios/reglages'
import { indisponibiliteContientPeriode } from '../../app/core/reception/disponibilite'

/**
 * `enregistrerPassage` — **les cinq effets, la déduplication, et le compteur
 * sans trou**.
 *
 * ⚠️ **CE QUE CE TEST GARDE N'EST PAS LE CODE D'AUJOURD'HUI, C'EST LA BASE DE
 * DEMAIN.** Chevauchement refusé, numérotation continue, total recalculé,
 * déduplication : ce sont les comportements que PostgreSQL imposera en phase 3.
 * *Un écran qui accepte aujourd'hui ce que la base refusera est un écran à
 * refaire, et le mensonge ne se découvre qu'au branchement.*
 */

const ETABLISSEMENT = deloria.ETABLISSEMENT_DELORIA
const FORMULE = 'deloria-formule-standard-passage'

afterEach(() => {
  poserReglages(REGLAGES_INITIAUX)
  reposerMouvement()
})

function demande(surcharge: Partial<DemandePassage> = {}): DemandePassage {
  return {
    id: uuidV7(),
    etablissementId: ETABLISSEMENT,
    uniteId: 'deloria-unite-a1',
    formuleId: FORMULE,
    dureeMinutes: 120,
    clientId: null,
    horodatageClient: null,
    ...surcharge,
  }
}

describe('les cinq effets d’un seul geste', () => {
  it('occupation, séjour, note ARRÊTÉE, ligne, fiche de police', async () => {
    // A1 est libre au jeu nominal : c'est la chambre proposée par défaut.
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok, JSON.stringify(resultat)).toBe(true)
    if (!resultat.ok) return

    const etat = mouvement()
    const passage = resultat.valeur
    expect(etat.occupations.find((o) => o.id === passage.occupation.id)?.statut).toBe('ACTIVE')

    const sejour = etat.sejours.find((s) => s.id === passage.sejourId)!
    expect(sejour.etat).toBe('EN_COURS')
    // ⚠️ UN PASSAGE N'OUVRE AUCUNE FICHE CLIENT : la fiche est de classe C, et
    // en créer une pour un client de deux heures ferait entrer au fichier une
    // personne qui n'a rien demandé.
    expect(sejour.clientId).toBeNull()

    const note = etat.notes.find((n) => n.id === passage.noteSejourId)!
    // ⚠️ LA NOTE EST DÉJÀ ARRÊTÉE : le passage traverse OUVERTE → ARRETEE en un
    // seul tap, avec l'encaissement entre les deux.
    expect(note.etat).toBe('ARRETEE')
    expect(note.arreteeLe).not.toBeNull()

    const lignes = etat.lignes.filter((l) => l.noteSejourId === note.id)
    expect(lignes).toHaveLength(1)
    expect(lignes[0]!.type).toBe('HEBERGEMENT')
    // 2 h au barème dégressif de Deloria.
    expect(lignes[0]!.prixUnitaire).toBe(2800)
    // ⚠️ LE TOTAL EST RECALCULÉ DEPUIS LES LIGNES, jamais incrémenté.
    expect(note.totalProvisoire).toBe(2800)

    const fiche = etat.fichesPolice.find((f) => f.sejourId === sejour.id)!
    // ⚠️ `complete: false` N'EST PAS UN DÉFAUT DE SAISIE : la pièce vient APRÈS
    // la clé, et c'est le parcours normal du passage.
    expect(fiche.complete).toBe(false)
  })

  it('l’occupation porte ses DEUX périodes, et la seconde contient la première', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    const occupation = resultat.valeur.occupation
    expect(indisponibiliteContientPeriode(occupation)).toBe(true)
    // 30 min de remise en état après un passage à Deloria.
    const menage =
      (Date.parse(occupation.periodeIndisponibilite.fin) - Date.parse(occupation.periode.fin)) /
      60_000
    expect(menage).toBe(30)
  })

  it('l’écran reçoit ce qu’il annonce : la chambre, l’heure de fin, le montant, 8 s', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(resultat.valeur.codeUnite).toBe('A1')
    expect(resultat.valeur.montant).toBe(2800)
    // ⚠️ LES HUIT SECONDES VIENNENT DU DOMAINE. Le composant 14 les affiche ; un
    // délai décidé dans un composant serait devenu une constante que personne
    // ne rouvre.
    expect(resultat.valeur.fenetreAnnulationSecondes).toBe(8)
  })
})

describe('la déduplication par UUID v7', () => {
  it('trois envois de la MÊME demande n’en produisent qu’un', async () => {
    // ⚠️ SANS ELLE, un double tap sur un réseau lent créerait deux occupations,
    // donc deux encaissements, sur une chambre donnée une seule fois. Et le
    // premier rejeu réel découvrirait un comportement que rien n'a exercé.
    const meme = demande()
    const un = await simulationEcrituresReception.enregistrerPassage(meme)
    const deux = await simulationEcrituresReception.enregistrerPassage(meme)
    const trois = await simulationEcrituresReception.enregistrerPassage(meme)

    expect(un.ok && deux.ok && trois.ok).toBe(true)
    expect(mouvement().occupations.filter((o) => o.id.startsWith('occupation-'))).toHaveLength(1)
    if (un.ok && trois.ok) {
      // Le rejeu rend le MÊME résultat, pas une seconde validation.
      expect(trois.valeur.sejourId).toBe(un.valeur.sejourId)
    }
  })

  it('deux demandes DISTINCTES sur des chambres distinctes passent toutes deux', async () => {
    const un = await simulationEcrituresReception.enregistrerPassage(demande())
    const deux = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-a2' }),
    )
    expect(un.ok).toBe(true)
    expect(deux.ok).toBe(true)
  })
})

describe('le refus de chevauchement, AVANT toute écriture', () => {
  it('la chambre prise maintenant est refusée, et RIEN n’a été écrit', async () => {
    const avant = mouvement().occupations.length
    // B1 porte l'occupation « prise maintenant » du jeu nominal.
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-b1', formuleId: 'deloria-formule-classique-passage' }),
    )
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('UNITE_DEJA_OCCUPEE')
    // ⚠️ L'ÉTAPE 3 PRÉCÈDE TOUTE ÉCRITURE : vérifier après aurait donné la
    // chambre, et le refus se découvrirait avec le client dans le couloir.
    expect(mouvement().occupations).toHaveLength(avant)
    expect(mouvement().sejours.filter((s) => s.id.startsWith('sejour-0'))).toHaveLength(0)
  })

  it('le refus NOMME la période qui bloque', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-b1', formuleId: 'deloria-formule-classique-passage' }),
    )
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.echec.parametres.unite).toBe('B1')
    expect(String(resultat.echec.parametres.debut)).toMatch(/\d/)
    expect(String(resultat.echec.parametres.fin)).toMatch(/\d/)
  })

  it('une chambre en REMISE EN ÉTAT est refusée, alors qu’elle PARAÎT libre', async () => {
    // C1 : son occupation est finie depuis une heure, son ménage court encore.
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-c1', formuleId: 'deloria-formule-classique-sup-passage' }),
    )
    expect(resultat.ok).toBe(false)
  })

  it('la formule hors catégorie est refusée AVANT le chevauchement', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-a1', formuleId: 'deloria-formule-classique-passage' }),
    )
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('FORMULE_HORS_CATEGORIE')
  })
})

describe('le compteur de fiche de police — N fiches, les numéros 1..N SANS TROU', () => {
  it('dix passages produisent les numéros 1 à 10', async () => {
    // ⚠️ *Un trou dans une numérotation opposable est une fiche dont personne
    // ne sait si elle a existé.* Une séquence PostgreSQL consomme son numéro
    // même quand la transaction échoue ; un compteur verrouillé ne le fait pas.
    reposerMouvement()
    // Le jeu « complet » n'a aucune fiche préexistante — le compteur part de 0.
    poserReglages({ ...REGLAGES_INITIAUX, casDuJeu: 'complet' })
    reposerMouvement()

    const codes = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2']
    const numeros: string[] = []
    for (const code of codes) {
      // Toutes les chambres sont prises au jeu « complet » : on annule d'abord
      // l'occupation, ce qui la rend donnable — c'est le geste réel.
      const etat = mouvement()
      const prise = etat.occupations.find((o) => o.uniteId === `deloria-unite-${code.toLowerCase()}`)
      if (prise) await simulationEcrituresReception.annulerPassage(prise.id)
      const cle = code.startsWith('A') ? 'standard' : code.startsWith('B') ? 'classique' : 'classique-sup'
      const resultat = await simulationEcrituresReception.enregistrerPassage(
        demande({
          uniteId: `deloria-unite-${code.toLowerCase()}`,
          formuleId: `deloria-formule-${cle}-passage`,
        }),
      )
      expect(resultat.ok, `${code} : ${JSON.stringify(resultat)}`).toBe(true)
      if (resultat.ok) numeros.push(resultat.valeur.numeroFichePolice)
    }

    expect(numeros).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
    // Et le compteur porte le dernier émis — jamais un numéro d'avance.
    expect(mouvement().numerotations[0]?.dernierNumero).toBe(10)
  })

  it('un passage REFUSÉ ne consomme aucun numéro', async () => {
    // C'est toute la différence entre un compteur et une séquence.
    const premier = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(premier.ok).toBe(true)
    await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-b1', formuleId: 'deloria-formule-classique-passage' }),
    )
    const suivant = await simulationEcrituresReception.enregistrerPassage(
      demande({ uniteId: 'deloria-unite-a2' }),
    )
    expect(suivant.ok).toBe(true)
    if (premier.ok && suivant.ok) {
      expect(Number(suivant.valeur.numeroFichePolice)).toBe(
        Number(premier.valeur.numeroFichePolice) + 1,
      )
    }
  })
})

describe('l’annulation défait LES CINQ EFFETS, jamais un seul', () => {
  it('la chambre redevient libre, la note et la fiche disparaissent', async () => {
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return

    const annulation = await simulationEcrituresReception.annulerPassage(
      resultat.valeur.occupation.id,
    )
    expect(annulation.ok).toBe(true)

    const etat = mouvement()
    // ⚠️ `ANNULEE`, ET NON SUPPRIMÉE : une ligne supprimée ne laisse aucune
    // trace de ce qui a été tenté, et c'est ce qu'un audit cherche.
    expect(etat.occupations.find((o) => o.id === resultat.valeur.occupation.id)?.statut).toBe(
      'ANNULEE',
    )
    expect(etat.sejours.find((s) => s.id === resultat.valeur.sejourId)?.etat).toBe('ANNULE')
    expect(etat.notes.find((n) => n.id === resultat.valeur.noteSejourId)).toBeUndefined()
    expect(etat.lignes.filter((l) => l.noteSejourId === resultat.valeur.noteSejourId)).toEqual([])
    expect(etat.fichesPolice.filter((f) => f.sejourId === resultat.valeur.sejourId)).toEqual([])
  })

  it('la même chambre est redonnable immédiatement après l’annulation', async () => {
    const premier = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(premier.ok).toBe(true)
    if (!premier.ok) return
    await simulationEcrituresReception.annulerPassage(premier.valeur.occupation.id)
    const second = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(second.ok, 'une occupation ANNULEE ne bloque plus').toBe(true)
  })
})

describe('la garde hors-ligne vit dans la fonction d’appel', () => {
  it('le passage est refusé hors ligne, SANS avoir rien tenté', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, horsLigne: true })
    const avant = mouvement().occupations.length
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('HORS_LIGNE')
    // ⚠️ AUCUNE DONNÉE DE CLASSE B N'ENTRE EN CACHE D'ÉCRITURE. Le refus précède
    // l'écriture ; il ne la rattrape pas, et il n'y a pas de « mise en file au
    // cas où ».
    expect(mouvement().occupations).toHaveLength(avant)
  })

  it('l’échec réseau n’écrit rien non plus', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, echecReseau: true })
    const avant = mouvement().occupations.length
    const resultat = await simulationEcrituresReception.enregistrerPassage(demande())
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('ECHEC_RESEAU')
    expect(mouvement().occupations).toHaveLength(avant)
  })
})
