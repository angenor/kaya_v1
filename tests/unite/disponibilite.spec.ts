import { describe, expect, it } from 'vitest'

import type { Intervalle, Occupation, Unite } from '../../app/core/donnees/hebergement/types'
import {
  avecRemiseEnEtat,
  dureeMinutes,
  indisponibiliteContientPeriode,
  intervalleValide,
  occupationEnConflit,
  occupationsBloquantes,
  prochaineOccupation,
  prochainesLiberations,
  remiseEnEtatMinutes,
  seChevauchent,
  unitesDisponibles,
} from '../../app/core/reception/disponibilite'

/**
 * LES TROIS INVARIANTES DE LA DISPONIBILITÉ.
 *
 * ⚠️ **CE TEST GARDE LA CONTRAINTE GiST DE DEMAIN.** Un écran qui accepterait
 * aujourd'hui ce que la base refusera en phase 3 est un écran à refaire — et le
 * mensonge ne se découvrirait qu'au branchement, avec un client au comptoir.
 */

const JOUR = '2026-08-08'
const h = (heure: string): string => `${JOUR}T${heure}:00.000Z`

function intervalle(debut: string, fin: string): Intervalle {
  return { debut: h(debut), fin: h(fin) }
}

function occupation(
  id: string,
  uniteId: string,
  periode: Intervalle,
  remiseMinutes = 0,
  statut: Occupation['statut'] = 'ACTIVE',
): Occupation {
  return {
    id,
    tenantId: 'deloria',
    uniteId,
    motif: 'SEJOUR',
    periode,
    periodeIndisponibilite: avecRemiseEnEtat(periode, remiseMinutes),
    statut,
    origineType: 'sejour',
    origineId: `sejour-${id}`,
    horodatageClient: null,
    creeLe: periode.debut,
  }
}

function unite(id: string, code: string, actif = true): Unite {
  return {
    id,
    tenantId: 'deloria',
    categorieId: 'deloria-categorie-standard',
    code,
    etage: '1',
    statutMenage: 'PROPRE',
    actif,
  }
}

describe("(a) periodeIndisponibilite contient periode, égalité comprise", () => {
  it('avec remise en état : elle déborde par la fin', () => {
    const occupee = occupation('o1', 'u1', intervalle('14:00', '16:00'), 30)
    expect(indisponibiliteContientPeriode(occupee)).toBe(true)
    expect(occupee.periodeIndisponibilite.fin).toBe(h('16:30'))
  })

  it("sans remise en état : l'ÉGALITÉ est licite", () => {
    // Une occupation sans ménage existe — un blocage saisonnier, par exemple.
    // Exiger un débordement strict l'aurait rendue impossible à écrire.
    const occupee = occupation('o2', 'u1', intervalle('14:00', '16:00'), 0)
    expect(indisponibiliteContientPeriode(occupee)).toBe(true)
    expect(occupee.periodeIndisponibilite).toEqual(occupee.periode)
  })

  it("une indisponibilité PLUS COURTE que la période est refusée", () => {
    const bancale: Occupation = {
      ...occupation('o3', 'u1', intervalle('14:00', '16:00')),
      periodeIndisponibilite: intervalle('14:00', '15:00'),
    }
    expect(indisponibiliteContientPeriode(bancale)).toBe(false)
  })
})

describe("(b) une occupation ANNULEE ne bloque plus", () => {
  it("elle disparaît des bloquantes — c'est ce qui rend l'annulation de 8 s réversible", () => {
    const occupations = [
      occupation('o1', 'u1', intervalle('14:00', '16:00'), 30, 'ANNULEE'),
      occupation('o2', 'u1', intervalle('18:00', '20:00'), 30, 'ACTIVE'),
    ]
    expect(occupationsBloquantes(occupations, 'u1').map((o) => o.id)).toEqual(['o2'])
  })

  it('la chambre annulée redevient donnable sur la MÊME période', () => {
    const occupations = [occupation('o1', 'u1', intervalle('14:00', '16:00'), 30, 'ANNULEE')]
    expect(occupationEnConflit(occupations, 'u1', intervalle('14:00', '16:00'))).toBeNull()
  })

  it('TERMINEE bloque encore — un séjour passé occupe son passé', () => {
    // Sinon deux occupations se superposeraient dans l'historique, et le
    // planning montrerait deux clients dans la même chambre la même nuit.
    const occupations = [occupation('o1', 'u1', intervalle('14:00', '16:00'), 0, 'TERMINEE')]
    expect(occupationEnConflit(occupations, 'u1', intervalle('15:00', '17:00'))?.id).toBe('o1')
  })
})

describe("(c) la borne haute est EXCLUE — deux passages consécutifs sont possibles", () => {
  it('[15 h, 18 h) et [18 h, 20 h) ne se chevauchent pas', () => {
    expect(seChevauchent(intervalle('15:00', '18:00'), intervalle('18:00', '20:00'))).toBe(false)
  })

  it('une seule minute de recouvrement suffit à chevaucher', () => {
    expect(seChevauchent(intervalle('15:00', '18:01'), intervalle('18:00', '20:00'))).toBe(true)
  })

  it("mais la remise en état, elle, mord — et c'est le refus qu'on oublie", () => {
    // La chambre PARAÎT libre à 18 h ; le ménage court jusqu'à 18 h 30.
    const occupations = [occupation('o1', 'u1', intervalle('15:00', '18:00'), 30)]
    expect(occupationEnConflit(occupations, 'u1', intervalle('18:00', '20:00'))?.id).toBe('o1')
    expect(occupationEnConflit(occupations, 'u1', intervalle('18:30', '20:00'))).toBeNull()
  })
})

describe("l'intervalle bien formé", () => {
  it('la fin doit être APRÈS le début — égalité refusée', () => {
    expect(intervalleValide(intervalle('14:00', '16:00'))).toBe(true)
    expect(intervalleValide(intervalle('16:00', '16:00'))).toBe(false)
    expect(intervalleValide(intervalle('16:00', '14:00'))).toBe(false)
  })

  it('la durée se lit en minutes', () => {
    expect(dureeMinutes(intervalle('14:00', '16:00'))).toBe(120)
  })
})

describe('les unités disponibles, et ce qui les rend proposables', () => {
  const unites = [unite('u1', 'A1'), unite('u2', 'A2'), unite('u3', 'A3', false)]

  it('une unité INACTIVE ne se propose jamais — elle n’est pas au parc', () => {
    expect(unitesDisponibles(unites, [], intervalle('14:00', '16:00')).map((d) => d.unite.code))
      .toEqual(['A1', 'A2'])
  })

  it('elle annonce jusqu’à quand elle est libre', () => {
    // Une chambre libre maintenant mais prise dans une heure ne convient pas à
    // un passage de trois : c'est ce que `libreJusqua` permet de dire AVANT.
    const occupations = [occupation('o1', 'u2', intervalle('18:00', '20:00'), 30)]
    const libres = unitesDisponibles(unites, occupations, intervalle('14:00', '16:00'))
    expect(libres.find((d) => d.unite.code === 'A2')?.libreJusqua).toBe(h('18:00'))
    expect(libres.find((d) => d.unite.code === 'A1')?.libreJusqua).toBeNull()
  })

  it('la prochaine occupation se lit sur l’INDISPONIBILITÉ', () => {
    const occupations = [occupation('o1', 'u1', intervalle('18:00', '20:00'), 30)]
    expect(prochaineOccupation(occupations, 'u1', h('14:00'))).toBe(h('18:00'))
  })
})

describe('les prochaines libérations — ce qui se libère, et quand', () => {
  it('elles sont dans l’ordre du temps, et bornées', () => {
    const occupations = [
      occupation('o1', 'u1', intervalle('08:00', '12:00'), 60),
      occupation('o2', 'u2', intervalle('08:00', '10:00'), 30),
      occupation('o3', 'u3', intervalle('08:00', '11:00'), 0),
    ]
    const liberations = prochainesLiberations(occupations, h('08:00'), 2)
    expect(liberations.map((l) => l.uniteId)).toEqual(['u2', 'u3'])
    // ⚠️ 10 h 30, pas 10 h : le ménage compte. Annoncer 10 h produirait un refus
    // à l'instant même où l'on aurait promis la chambre.
    expect(liberations[0]?.libreA).toBe(h('10:30'))
  })

  it('une occupation ANNULEE ne libère rien : elle ne bloquait déjà plus', () => {
    const occupations = [occupation('o1', 'u1', intervalle('08:00', '12:00'), 0, 'ANNULEE')]
    expect(prochainesLiberations(occupations, h('08:00'), 5)).toEqual([])
  })
})

describe('le temps de remise en état — par formule, puis par catégorie', () => {
  const temps = [
    { id: 't1', tenantId: 'deloria', categorieId: null, formuleId: 'f-passage', dureeMinutes: 30 },
    { id: 't2', tenantId: 'deloria', categorieId: 'c-standard', formuleId: null, dureeMinutes: 90 },
    { id: 't3', tenantId: 'deloria', categorieId: 'c-standard', formuleId: 'f-nuitee', dureeMinutes: 120 },
  ]

  it('le couple exact prime sur la formule seule, qui prime sur la catégorie seule', () => {
    // ⚠️ Prendre la première ligne trouvée ferait dépendre le résultat de
    // l'ordre d'insertion en base.
    expect(remiseEnEtatMinutes(temps, 'f-nuitee', 'c-standard')).toBe(120)
    expect(remiseEnEtatMinutes(temps, 'f-passage', 'c-autre')).toBe(30)
    expect(remiseEnEtatMinutes(temps, 'f-inconnue', 'c-standard')).toBe(90)
  })

  it('aucune ligne : aucune remise en état — ce qui se dit en n’ayant pas de ligne', () => {
    expect(remiseEnEtatMinutes(temps, 'f-inconnue', 'c-inconnue')).toBe(0)
  })
})
