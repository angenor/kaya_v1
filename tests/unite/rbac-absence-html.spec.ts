// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { ACTIONS_DE_LA_COQUILLE, type ActionDeLaCoquille } from '../../app/core/session/actions'
import type { ModuleActivite } from '../../app/core/donnees/etablissements/types'

/**
 * FR-050 · **UNE ACTION NON PERMISE EST ABSENTE DU HTML RENDU.**
 *
 * ⚠️ LE TEST PORTE SUR LE HTML, PAS SUR UN ATTRIBUT DE DÉSACTIVATION, et c'est
 * toute la différence. Griser dit à l'utilisateur que l'action existe et qu'il
 * n'y a pas droit — c'est une leçon d'organigramme sur un écran de travail — et
 * laisse dans le document une cible que rien n'empêche d'actionner autrement.
 * Un test qui vérifierait `disabled` déclarerait conforme exactement ce que la
 * règle refuse.
 *
 * ⚠️ ET LE SECOND SENS COMPTE AUTANT : une surface de service INACTIF est
 * absente aussi. Sur « Résidence Test », qui n'a que l'hébergement, les actions
 * de restauration disparaissent **même pour qui en a le droit**.
 */

/**
 * La logique d'autorisation, isolée de Nuxt.
 *
 * ⚠️ `useAutorisation` s'appuie sur `useState` de Nuxt, qui n'existe pas sous
 * Vitest. On rejoue donc **la même règle**, et un troisième test confronte cette
 * copie au fichier source : deux règles qui divergent, c'est un test qui déclare
 * conforme un produit qui ne l'est plus.
 */
function retenir(
  actions: readonly ActionDeLaCoquille[],
  permissions: readonly string[],
  modulesActifs: readonly ModuleActivite[],
): ActionDeLaCoquille[] {
  return actions.filter(
    (action) =>
      permissions.includes(action.permission) &&
      (action.moduleCode === null ||
        modulesActifs.some((module) => module.code === action.moduleCode)),
  )
}

function moduleDe(code: string): ModuleActivite {
  return { id: `module-${code}`, tenantId: 't', code, libelle: code, implementeAuMvp: true }
}

/** La surface, réduite à ce qu'on teste : elle rend les actions retenues. */
const Surface = defineComponent({
  props: {
    permissions: { type: Array as () => readonly string[], required: true },
    modules: { type: Array as () => readonly ModuleActivite[], required: true },
  },
  setup(props) {
    const actions = ref(retenir(ACTIONS_DE_LA_COQUILLE, props.permissions, props.modules))
    return () =>
      h(
        'div',
        actions.value.map((action) =>
          h('button', { type: 'button', 'data-action': action.permission }, action.libelleCle),
        ),
      )
  },
})

/** Les rôles du jeu, tels que `deloria.ts` les projette. */
const ADJOUA = [
  'hebergement.passage.ouvrir',
  'hebergement.sejour.arrivee',
  'hebergement.sejour.depart',
  'ventes.commande.remise',
  'pilotage.lire',
  'etablissement.gerer',
  'caisse.encaisser',
  'caisse.cloture',
]
const AMINATA = ['ventes.commande.prendre']

const DELORIA = ['HEBERGEMENT', 'RESTAURATION', 'BAR', 'PRESSING', 'SALLE_REUNION'].map(moduleDe)
const RESIDENCE_TEST = [moduleDe('HEBERGEMENT')]

describe("une action non permise est ABSENTE du HTML rendu", () => {
  it("l'écran diffère entre Adjoua et Aminata", () => {
    const chezAdjoua = mount(Surface, { props: { permissions: ADJOUA, modules: DELORIA } })
    const chezAminata = mount(Surface, { props: { permissions: AMINATA, modules: DELORIA } })

    expect(chezAdjoua.html()).not.toBe(chezAminata.html())
    expect(chezAdjoua.findAll('[data-action]').length).toBe(ADJOUA.length)
    expect(chezAminata.findAll('[data-action]').length).toBe(AMINATA.length)
  })

  it("l'action non permise apparaît ZÉRO fois dans le HTML", () => {
    const rendu = mount(Surface, { props: { permissions: AMINATA, modules: DELORIA } }).html()

    for (const permission of ADJOUA) {
      expect(
        rendu.includes(permission),
        `« ${permission} » est dans le HTML alors qu'Aminata n'y a pas droit`,
      ).toBe(false)
    }
    // Et ce à quoi elle a droit y est bien : un rendu vide passerait le test
    // précédent sans rien prouver.
    expect(rendu).toContain('ventes.commande.prendre')
  })

  it('AUCUN attribut de désactivation ne remplace le retrait', () => {
    // ⚠️ C'EST LE TEST QUI ATTRAPE LA MAUVAISE CORRECTION. La façon naturelle de
    // « faire passer » le test précédent est de griser au lieu de retirer : le
    // libellé disparaît des yeux, l'élément reste dans le document. Celui-ci
    // refuse les trois formes du grisé.
    const rendu = mount(Surface, { props: { permissions: AMINATA, modules: DELORIA } }).html()

    for (const forme of ['disabled', 'aria-disabled', 'data-desactive']) {
      expect(
        rendu.includes(forme),
        `« ${forme} » est employé à la place d'un retrait : une action interdite est ABSENTE, jamais grisée`,
      ).toBe(false)
    }
    expect(rendu.includes('hidden'), 'un masquage CSS laisse la cible dans le document').toBe(false)
  })

  it("une action de service INACTIF disparaît, même pour qui en a le droit", () => {
    // Adjoua a « ventes.commande.remise ». Résidence Test n'a pas de
    // restauration : l'action n'est pas rendue. C'est le pendant en phase 2 du
    // test d'agnosticité ETB-02c.
    const chezDeloria = mount(Surface, { props: { permissions: ADJOUA, modules: DELORIA } })
    const chezTest = mount(Surface, { props: { permissions: ADJOUA, modules: RESIDENCE_TEST } })

    expect(chezDeloria.html()).toContain('ventes.commande.remise')
    expect(chezTest.html()).not.toContain('ventes.commande.remise')
    // Les actions transverses, elles, restent : un service absent ne retire pas
    // le droit d'encaisser.
    expect(chezTest.html()).toContain('caisse.encaisser')
  })

  it("la règle du test et celle du produit sont la MÊME règle", () => {
    // ⚠️ SANS CE CONTRÔLE, LA COPIE CI-DESSUS DÉRIVERAIT EN SILENCE. On ne peut
    // pas monter `useAutorisation` hors de Nuxt ; on peut en revanche exiger que
    // le fichier source porte encore les deux conditions, cumulées.
    // ⚠️ `process.cwd()` ET NON `fileURLToPath(new URL(…))`, ET C'EST LE PIÈGE
    // QUE `vitest.config.ts` DOCUMENTE : ce fichier tourne sous happy-dom, qui
    // REMPLACE le `URL` global par le sien — `fileURLToPath` refuse alors
    // l'objet qu'il reçoit, « The URL must be of scheme file ». Constaté ici.
    const source = readFileSync(
      join(process.cwd(), 'app/core/session/useAutorisation.ts'),
      'utf8',
    )
    expect(source).toContain('aLaPermission(action.permission) && serviceEstActif(action.moduleCode)')
    expect(source).toContain('session.value.permissions.includes(code)')
    // ⚠️ LES MODULES ACTIFS SONT LUS **SUR LA SESSION** DEPUIS LE CYCLE F2, et
    // la règle n'a pas changé d'un mot : c'est sa SOURCE qui a bougé. Ils
    // vivaient dans un état d'écran que chaque page devait remplir ; quand la
    // lecture échouait, `serviceEstActif` répondait « non » à tout et les
    // surfaces d'un service disparaissaient comme si l'établissement ne
    // l'offrait pas. Une panne ne doit pas ressembler à une configuration.
    expect(source).toContain('session.value.modulesActifs.includes(moduleCode)')
  })

  it("les mots « rôle » et « permission » n'atteignent aucun libellé", () => {
    // Le lexique les proscrit du visible : on montre ce qui est possible, pas la
    // mécanique qui l'autorise. Les CODES les portent — ce sont des identifiants
    // de contrat —, les CLÉS DE LIBELLÉ non.
    for (const action of ACTIONS_DE_LA_COQUILLE) {
      expect(action.libelleCle).not.toMatch(/r[oô]le|permission/i)
    }
  })
})
