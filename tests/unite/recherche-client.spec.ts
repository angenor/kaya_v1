import { afterEach, describe, expect, it } from 'vitest'

import {
  CLE_SEUIL_RECHERCHE_NOM,
  surchargerParametre,
} from '../../app/core/configuration/configuration'
import { reposerMouvement } from '../../app/core/donnees/hebergement/magasin'
import { simulationReception } from '../../app/core/donnees/hebergement/simulation'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import { REGLAGES_INITIAUX, poserReglages } from '../../app/core/scenarios/reglages'

/**
 * LA RECHERCHE CLIENT — **trois critères, deux domaines, une exclusion**.
 *
 * ⚠️ **L'EXCLUSION EST LA PROPRIÉTÉ LA PLUS IMPORTANTE DU LOT.** Chercher
 * « Kouamé » à la réception ne doit **pas** montrer la femme de ménage : le
 * personnel n'est pas la clientèle, et confondre les deux ferait apparaître des
 * employés dans un écran que consultent des clients debout au comptoir.
 */

const PORTEE = { etablissementId: deloria.ETABLISSEMENT_DELORIA }

afterEach(() => {
  poserReglages(REGLAGES_INITIAUX)
  reposerMouvement()
})

async function chercher(critere: string) {
  const resultat = await simulationReception.rechercherClients(PORTEE, critere)
  expect(resultat.ok).toBe(true)
  return resultat.ok ? resultat.valeur : []
}

describe('les trois critères', () => {
  it('par NOM — accents et casse indifférents', async () => {
    // Une réceptionniste qui tape vite ne pose pas d'accent : sans
    // normalisation, la recherche échouerait sur les noms qu'elle sert.
    expect((await chercher('Kouamé')).map((t) => t.personne.nom)).toEqual(['Kouamé'])
    expect((await chercher('kouame')).map((t) => t.personne.nom)).toEqual(['Kouamé'])
    expect((await chercher('KOUAME')).map((t) => t.personne.nom)).toEqual(['Kouamé'])
  })

  it('par TÉLÉPHONE — et le numéro du client connu le trouve', async () => {
    const trouves = await chercher(deloria.TELEPHONE_CLIENT_CONNU)
    expect(trouves).toHaveLength(1)
    expect(trouves[0]!.client.id).toBe('client-kouame')
  })

  it('par NUMÉRO DE PIÈCE', async () => {
    const trouves = await chercher('CI2210447')
    expect(trouves.map((t) => t.personne.prenoms)).toEqual(['Adama'])
  })
})

describe('les deux seuils, lus au catalogue', () => {
  it('un nom de deux lettres ne déclenche rien — trois oui', async () => {
    expect(await chercher('Ko')).toEqual([])
    expect((await chercher('Kou')).length).toBeGreaterThan(0)
  })

  it('un numéro de trois chiffres ne déclenche rien — quatre oui', async () => {
    // ⚠️ Trois chiffres ne distinguent rien dans un fichier de numéros, et
    // rendraient une liste que personne ne lit.
    expect(await chercher('070')).toEqual([])
    expect((await chercher('0708')).length).toBeGreaterThan(0)
  })

  it('le seuil vient de la CONFIGURATION, et le changer change le comportement', async () => {
    // Un seuil écrit dans le code passerait les deux tests ci-dessus et
    // échouerait celui-ci.
    surchargerParametre(CLE_SEUIL_RECHERCHE_NOM, '2')
    expect((await chercher('Ko')).length).toBeGreaterThan(0)
    surchargerParametre(CLE_SEUIL_RECHERCHE_NOM, '3')
  })
})

describe("une personne non qualifiée cliente ne remonte JAMAIS", () => {
  it('la femme de ménage ne sort pas sur son propre nom', async () => {
    // « Kouassi Adjoua » est au jeu comme PERSONNE — elle a un compte, pas une
    // fiche client. La jointure part de `client`, jamais de `personne`.
    const trouves = await chercher('Kouassi')
    expect(trouves).toEqual([])
    // Et elle existe bien : ce n'est pas une absence de donnée.
    expect(deloria.personnes.some((p) => p.nom === 'Kouassi')).toBe(true)
  })

  it('aucune personne du personnel ne figure parmi les clientes', async () => {
    const identifiantsPersonnel = new Set(deloria.personnes.map((p) => p.id))
    for (const client of deloria.clients) {
      expect(identifiantsPersonnel.has(client.personneId), client.id).toBe(false)
    }
  })
})

describe("ce que la recherche rend en plus du nom", () => {
  it('le compte des séjours passés — le 7ᵉ passage se COMPTE', async () => {
    const trouves = await chercher('Kouamé')
    expect(trouves[0]!.sejoursPasses).toBe(6)
  })

  it('la chambre habituelle est CALCULÉE, et null quand il n’y a pas d’habitude', async () => {
    const connu = await chercher('Kouamé')
    expect(connu[0]!.uniteHabituelleId).toBe(deloria.UNITE_HABITUELLE_CLIENT_CONNU)
    // Un client d'un seul séjour n'a pas d'habitude — et l'inventer serait
    // proposer une chambre au hasard en prétendant qu'elle est la sienne.
    const occasionnel = await chercher('Diomandé')
    expect(occasionnel[0]!.uniteHabituelleId).toBeNull()
  })
})

describe('les leviers, honorés sans code propre', () => {
  it('hors ligne, la recherche refuse', async () => {
    poserReglages({ ...REGLAGES_INITIAUX, horsLigne: true })
    const resultat = await simulationReception.rechercherClients(PORTEE, 'Kouamé')
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.echec.code).toBe('HORS_LIGNE')
  })
})
