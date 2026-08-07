import { describe, expect, it } from 'vitest'

import { SURFACES_ACCUEIL } from '../../app/core/accueil/surfaces'
import { simulationAccueil } from '../../app/core/donnees/accueil/simulation'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as tantieAdjo from '../../app/core/donnees/jeux/tantie-adjo'

/**
 * SUR LE MAQUIS, AUCUN MOT D'UN SERVICE ABSENT — SC-003, SC-004, SC-014.
 *
 * ⚠️ **LE CONTRÔLE PORTE SUR CE QUI PEUT ATTEINDRE LE DOCUMENT**, pas sur un
 * attribut. « Absent, jamais grisé » ne se vérifie pas en cherchant `disabled` :
 * il se vérifie en cherchant le MOT. Un intitulé « Hébergement » sous un
 * compteur à zéro, un emplacement réservé, un libellé masqué en CSS — chacun
 * ferait de l'accueil d'un maquis un hôtel amputé, et aucun ne porte `disabled`.
 *
 * ⚠️ ET IL S'EXERCE SUR LA SOURCE ET SUR LA DÉCLARATION, pas sur un rendu monté.
 * Ce qui atteint le document vient de deux endroits, et de deux seulement : les
 * données de la rubrique, et le titre déclaré par la surface. Le rendu lui-même
 * est vérifié dans un navigateur réel — `accueil-variantes.spec.ts` —, où le
 * document existe pour de bon.
 */

const MAQUIS = tantieAdjo.ETABLISSEMENT_TANTIE_ADJO
const DELORIA = deloria.ETABLISSEMENT_DELORIA

/**
 * Les quatre services que le maquis n'a PAS, sous les mots que l'utilisateur
 * lirait — ceux du référentiel `module_activite.libelle`, jamais des codes.
 */
const SERVICES_ABSENTS = ['Hébergement', 'Bar', 'Pressing', 'Salle de réunion']

/** Tout ce qu'une rubrique peut faire entrer au document, pour un site donné. */
async function texteDuMaquis(etablissementId: string): Promise<string> {
  const [tetes, suite, aRegler, activites, chiffres] = await Promise.all([
    simulationAccueil.listerTetes({ etablissementId }),
    simulationAccueil.listerSuite({ etablissementId }),
    simulationAccueil.listerARegler({ etablissementId }),
    simulationAccueil.listerActivites({ etablissementId }),
    simulationAccueil.listerChiffres({ etablissementId }),
  ])
  const morceaux: string[] = []
  if (tetes.ok) for (const t of tetes.valeur) morceaux.push(t.libelle, t.detail)
  if (suite.ok) for (const l of suite.valeur) morceaux.push(l.libelle, l.detail)
  if (aRegler.ok) for (const c of aRegler.valeur) morceaux.push(c.libelle, c.detail)
  if (activites.ok) for (const a of activites.valeur) morceaux.push(a.libelle, a.detail)
  if (chiffres.ok) for (const c of chiffres.valeur) morceaux.push(c.valeur ?? '', c.comparaison)
  return morceaux.join(' | ')
}

describe('le maquis ne porte aucun mot d’un service qu’il n’a pas', () => {
  it('⚠️ NI « HÉBERGEMENT », NI « PRESSING », NI « SALLE DE RÉUNION » (SC-003)', async () => {
    const texte = await texteDuMaquis(MAQUIS)
    for (const service of SERVICES_ABSENTS) {
      expect(
        texte.toLowerCase().includes(service.toLowerCase()),
        `« ${service} » peut atteindre l'accueil du maquis — l'écran serait un hôtel amputé`,
      ).toBe(false)
    }
  })

  it('le contrôle NE SERAIT PAS VIDE : les mêmes mots existent bien à Deloria', async () => {
    // ⚠️ SANS CE CONTRE-CONTRÔLE, LE TEST CI-DESSUS RESTERAIT VERT SUR UNE
    // SOURCE CASSÉE. Une simulation qui rendrait des listes vides pour tout le
    // monde passerait — et on aurait vérifié que rien ne contient rien.
    const texte = await texteDuMaquis(DELORIA)
    expect(texte).toContain('Hébergement')
    expect(texte).toContain('Pressing')
    expect(texte).toContain('Salle de réunion')
  })

  it('aucune surface d’un module absent n’est déclarée pour le maquis', async () => {
    // Le pendant déclaratif : les titres aussi atteignent le document. Une
    // rubrique dont le titre survivrait à ses surfaces serait un intitulé
    // orphelin — le troisième cas que le quickstart nomme.
    const modules = new Set(['RESTAURATION'])
    const retenues = SURFACES_ACCUEIL.filter(
      (s) => s.moduleCode !== null && !modules.has(s.moduleCode),
    )
    for (const surface of retenues) {
      expect(
        surface.moduleCode,
        `${surface.cle} suppose un module que le maquis n'a pas — elle ne doit jamais être rendue ici`,
      ).not.toBe('RESTAURATION')
    }
  })

  it('aucun compteur à zéro, aucun emplacement réservé', async () => {
    // « Ni intitulé, ni compteur à zéro, ni emplacement réservé » (FR-018). Un
    // « 0 » permanent apprend à ne plus regarder le compteur — et un « 0 sacs en
    // cours » sur un maquis dit qu'il y a un pressing.
    const chiffres = await simulationAccueil.listerChiffres({ etablissementId: MAQUIS })
    expect(chiffres.ok).toBe(true)
    if (!chiffres.ok) return
    for (const chiffre of chiffres.valeur) {
      expect(chiffre.valeur, `${chiffre.id} est un compteur à zéro`).not.toBe('0')
      expect(chiffre.montant?.montantMineur, `${chiffre.id} est un montant à zéro`).not.toBe(0)
    }
    const activites = await simulationAccueil.listerActivites({ etablissementId: MAQUIS })
    expect(
      activites.ok && activites.valeur,
      'le maquis porterait une activité — la rubrique ne disparaîtrait pas',
    ).toHaveLength(0)
  })
})
