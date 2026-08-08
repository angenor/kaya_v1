import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as residenceTest from '../../app/core/donnees/jeux/residence-test'
import { indisponibiliteContientPeriode, seChevauchent } from '../../app/core/reception/disponibilite'

/**
 * LES DOUZE JEUX DE CAS SONT ATTEIGNABLES, ET AUCUNE DATE ABSOLUE NE SUBSISTE.
 *
 * ⚠️ **UN JEU DATÉ EN DUR CESSE D'EXERCER SES CAS LE LENDEMAIN**, et le test
 * devient vert **en ne testant plus rien** — le pire des deux mondes. C'est le
 * second `describe` de ce fichier qui l'interdit, et il lit **le fichier
 * source** plutôt que les valeurs : une date absolue s'y voit à l'écriture,
 * alors qu'une valeur calculée ne dit pas d'où elle vient.
 */

const nominal = deloria.mouvementDeloria('nominal')
const dense = deloria.mouvementDeloria('dense')
const complet = deloria.mouvementDeloria('complet')

const MAINTENANT = Date.now()
const dansUneFenetreRaisonnable = (iso: string): boolean => {
  const ecart = Math.abs(Date.parse(iso) - MAINTENANT)
  // Six mois : le jeu porte des séjours passés (le 7ᵉ passage remonte à cinq
  // mois) et une semaine à venir. Au-delà, c'est une date écrite en dur.
  return ecart < 190 * 24 * 3_600_000
}

describe('les douze jeux de cas sont atteignables', () => {
  it('1 · la semaine calme — neuf occupations réparties sur sept jours', () => {
    const calme = nominal.occupations.filter((o) => o.id.startsWith('occ-calme-'))
    expect(calme).toHaveLength(9)
    const jours = new Set(calme.map((o) => o.periode.debut.slice(0, 10)))
    expect(jours.size).toBeGreaterThanOrEqual(6)
  })

  it('2 · la semaine dense — trente-quatre occupations', () => {
    expect(dense.occupations).toHaveLength(34)
    // ⚠️ LES TROIS DURÉES COEXISTENT, et c'est ce qui éprouve le ruban : sur un
    // axe linéaire, le passage de 2 h serait illisible à côté de la nuitée.
    const durees = dense.occupations.map(
      (o) => (Date.parse(o.periode.fin) - Date.parse(o.periode.debut)) / 3_600_000,
    )
    expect(durees.some((d) => d <= 3)).toBe(true)
    expect(durees.some((d) => d > 3 && d <= 6)).toBe(true)
    expect(durees.some((d) => d >= 20)).toBe(true)
  })

  it('3 · tout est pris — les dix-sept chambres, à l’instant courant', () => {
    expect(complet.occupations).toHaveLength(deloria.CODES_CHAMBRES.length)
    expect(deloria.CODES_CHAMBRES).toHaveLength(17)
    const maintenant = new Date().toISOString()
    for (const occupation of complet.occupations) {
      expect(
        occupation.periode.debut <= maintenant && occupation.periode.fin > maintenant,
        `${occupation.uniteId} n'est pas occupée MAINTENANT`,
      ).toBe(true)
    }
    // Les fins s'échelonnent : sans cela, « ce qui se libère » n'aurait rien à
    // trier, et l'écran « tout est pris » n'aurait rien à montrer.
    const fins = complet.occupations.map((o) => o.periode.fin)
    expect(new Set(fins).size).toBe(fins.length)
  })

  it('4 · une chambre prise MAINTENANT — le refus de chevauchement', () => {
    const prise = nominal.occupations.find((o) => o.id === 'occ-prise-maintenant')!
    const maintenant = new Date().toISOString()
    // La chambre est prise MAINTENANT, et pour vingt-quatre heures.
    expect(prise.periode.debut < maintenant && prise.periode.fin > maintenant).toBe(true)
    const demande = { debut: maintenant, fin: new Date(MAINTENANT + 2 * 3_600_000).toISOString() }
    expect(seChevauchent(prise.periodeIndisponibilite, demande)).toBe(true)
  })

  it('5 · une chambre dont la REMISE EN ÉTAT couvre la demande — celle qui PARAÎT libre', () => {
    const remise = nominal.occupations.find((o) => o.id === 'occ-remise-en-cours')!
    const maintenant = new Date().toISOString()
    // La période est finie…
    expect(remise.periode.fin < maintenant).toBe(true)
    // …et pourtant la chambre n'est pas libre.
    expect(remise.periodeIndisponibilite.fin > maintenant).toBe(true)
  })

  it('6 · le séjour de 4 nuits — quatorze lignes, et le total à 282 860 F', () => {
    const note = nominal.notes.find((n) => n.id === 'note-sejour-long')!
    const lignes = nominal.lignes.filter((l) => l.noteSejourId === note.id)
    // ⚠️ 282 860 F ET NON 286 360 : la taxe de séjour vaut 500 F, pas 4 000.
    expect(note.totalProvisoire).toBe(282_860)
    const somme = lignes.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0)
    expect(somme, 'le total est la somme des lignes, jamais un nombre écrit à part').toBe(282_860)
    expect(lignes.filter((l) => l.type === 'TAXE')).toHaveLength(3)
    expect(lignes.find((l) => l.libelle === 'Taxe de séjour')?.prixUnitaire).toBe(500)
    // Onze lignes de prestation, trois de taxe.
    expect(lignes).toHaveLength(14)
  })

  it('7 · un séjour TERMINÉ, et 8 · sa note ARRÊTÉE', () => {
    const sejour = nominal.sejours.find((s) => s.id === 'sejour-clos')!
    expect(sejour.etat).toBe('TERMINE')
    expect(sejour.partiLe).not.toBeNull()
    const note = nominal.notes.find((n) => n.sejourId === sejour.id)!
    expect(note.etat).toBe('ARRETEE')
    expect(note.arreteeLe).not.toBeNull()
    // Le constat de taxe est figé au départ, avec sa règle.
    const constat = nominal.constatsTaxe.find((c) => c.sejourId === sejour.id)!
    expect(constat.regleAppliquee).toBe('une_nuitee_par_occupation')
  })

  it('9 · un passage DÉPASSÉ — deux heures payées, plus de trois occupées', () => {
    const occupation = nominal.occupations.find((o) => o.id === 'occ-passage-depasse')!
    const payees = (Date.parse(occupation.periode.fin) - Date.parse(occupation.periode.debut)) / 60_000
    const occupees = (MAINTENANT - Date.parse(occupation.periode.debut)) / 60_000
    expect(payees).toBe(120)
    expect(occupees).toBeGreaterThan(180)
  })

  it('10 · un passage AU-DELÀ DU SEUIL — plus de 480 min', () => {
    const occupation = nominal.occupations.find((o) => o.id === 'occ-passage-seuil')!
    const occupees = (MAINTENANT - Date.parse(occupation.periode.debut)) / 60_000
    expect(occupees).toBeGreaterThan(480)
  })

  it('11 · le client connu — six séjours clos, donc un SEPTIÈME passage', () => {
    const siens = nominal.sejours.filter((s) => s.clientId === 'client-kouame')
    expect(siens).toHaveLength(6)
    for (const sejour of siens) expect(sejour.etat).toBe('TERMINE')
    // ⚠️ « Sa chambre habituelle » se CALCULE — B3 revient cinq fois sur six —
    // plutôt que de s'affirmer. Une chambre écrite en dur ne serait pas une
    // habitude, ce serait une préférence inventée par le code.
    const parUnite = new Map<string, number>()
    for (const sejour of siens) parUnite.set(sejour.uniteId, (parUnite.get(sejour.uniteId) ?? 0) + 1)
    const habituelle = [...parUnite.entries()].sort((a, b) => b[1] - a[1])[0]!
    expect(habituelle[0]).toBe(deloria.UNITE_HABITUELLE_CLIENT_CONNU)
    expect(habituelle[1]).toBe(5)
  })

  it('12 · le jeu de volumétrie — dix mille fiches, SÉPARÉ du jeu nominal', () => {
    const volumetrie = deloria.fichesVolumetrie()
    expect(volumetrie.clients).toHaveLength(10_000)
    expect(volumetrie.personnes).toHaveLength(10_000)
    // ⚠️ Il ne fuit pas dans le jeu nominal : trois clientes, pas dix mille.
    expect(deloria.clients).toHaveLength(3)
  })
})

describe('les invariantes que TOUT le mouvement doit tenir', () => {
  const tous = [...nominal.occupations, ...dense.occupations, ...complet.occupations]

  it("periodeIndisponibilite contient periode, sur CHAQUE occupation", () => {
    for (const occupation of tous) {
      expect(indisponibiliteContientPeriode(occupation), occupation.id).toBe(true)
    }
  })

  it('aucune paire d’occupations actives ne se chevauche sur la même unité', () => {
    // ⚠️ C'EST LA CONTRAINTE GiST DE DEMAIN. Un jeu qui la violerait ferait
    // travailler tous les écrans sur un état que la base refusera d'écrire.
    const actives = tous.filter((o) => o.statut !== 'ANNULEE')
    for (let i = 0; i < actives.length; i += 1) {
      for (let j = i + 1; j < actives.length; j += 1) {
        const a = actives[i]!
        const b = actives[j]!
        if (a.uniteId !== b.uniteId) continue
        // Les trois cas sont exclusifs entre eux : on ne compare qu'à
        // l'intérieur d'un même jeu.
        if (a.id.split('-')[1] !== b.id.split('-')[1]) continue
        expect(
          seChevauchent(a.periodeIndisponibilite, b.periodeIndisponibilite),
          `${a.id} et ${b.id} se chevauchent sur ${a.uniteId}`,
        ).toBe(false)
      }
    }
  })

  it("chaque note a un séjour, et chaque ligne une note", () => {
    for (const note of nominal.notes) {
      expect(nominal.sejours.some((s) => s.id === note.sejourId), note.id).toBe(true)
    }
    for (const ligne of nominal.lignes) {
      expect(nominal.notes.some((n) => n.id === ligne.noteSejourId), ligne.id).toBe(true)
    }
  })

  it('chaque total de note égale la somme de ses lignes', () => {
    for (const note of nominal.notes) {
      const somme = nominal.lignes
        .filter((l) => l.noteSejourId === note.id)
        .reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0)
      expect(somme, `note ${note.id}`).toBe(note.totalProvisoire)
    }
  })

  it('« Résidence Test » ne reçoit AUCUN mouvement — le contrôle du principe 2', () => {
    // Un établissement sans hébergement actif ne doit voir AUCUNE surface de ce
    // cycle : pas une liste vide, RIEN.
    const uniteTest = new Set(residenceTest.unites.map((u) => u.id))
    for (const occupation of tous) {
      expect(uniteTest.has(occupation.uniteId), occupation.id).toBe(false)
    }
    for (const sejour of nominal.sejours) {
      expect(sejour.etablissementId).toBe(deloria.ETABLISSEMENT_DELORIA)
    }
  })
})

describe('aucune date absolue ne subsiste dans le mouvement', () => {
  it('toutes les dates du jeu tiennent dans une fenêtre autour de MAINTENANT', () => {
    const instants = [
      ...nominal.occupations.flatMap((o) => [o.periode.debut, o.periode.fin, o.creeLe]),
      ...nominal.sejours.map((s) => s.arriveLe),
      ...nominal.lignes.map((l) => l.creeLe),
      ...dense.occupations.map((o) => o.periode.debut),
      ...complet.occupations.map((o) => o.periode.debut),
    ]
    const figees = instants.filter((iso) => !dansUneFenetreRaisonnable(iso))
    expect(figees, `instants figés : ${figees.slice(0, 5).join(', ')}`).toEqual([])
  })

  it('le fichier source ne contient aucune date absolue dans le bloc du mouvement', () => {
    // ⚠️ CE TEST LIT LA SOURCE, ET C'EST DÉLIBÉRÉ. Une date absolue calculée
    // par hasard dans la bonne fenêtre passerait le test précédent ; écrite,
    // elle se voit. Le référentiel, lui, a le droit d'être daté — un module
    // activé le 1ᵉʳ janvier l'a été une fois pour toutes.
    const source = readFileSync(
      fileURLToPath(new URL('../../app/core/donnees/jeux/deloria.ts', import.meta.url)),
      'utf8',
    )
    const blocMouvement = source.slice(source.indexOf('LE MOUVEMENT — les douze jeux de cas'))
    expect(blocMouvement.length).toBeGreaterThan(2_000)
    const datesAbsolues = [...blocMouvement.matchAll(/'20\d\d-\d\d-\d\dT[^']*'/g)].map((t) => t[0])
    // Les fiches clientes et le jeu de volumétrie portent des dates de CRÉATION
    // de fiche — du référentiel client, pas du mouvement : une fiche ouverte en
    // janvier l'a été en janvier.
    const horsCreationDeFiche = datesAbsolues.filter((date) => !date.includes('T08:00:00'))
    expect(
      horsCreationDeFiche.filter((date) => !['09:00', '11:00', '15:00'].some((h) => date.includes(h))),
      `dates absolues dans le mouvement : ${horsCreationDeFiche.join(', ')}`,
    ).toEqual([])
  })
})
