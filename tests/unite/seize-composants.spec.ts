import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * LE DÉCOMPTE DES COMPOSANTS N'EST ÉCRIT NULLE PART, ET C'EST VOULU.
 *
 * « Le décompte est celui des sections numérotées de ce fichier, jamais un nombre
 * écrit ailleurs : il a déjà été faux deux fois » (`docs/design/composants.md`).
 * Ce test confronte donc TROIS choses qui doivent coïncider sans qu'aucune ne
 * porte la vérité : les sections du document, les fichiers de composants, et les
 * sections du guide de style.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))
const COMPOSANTS_MD = join(racine, 'docs/design/composants.md')
const DESIGN_SYSTEM = join(racine, 'app/core/design-system')
const GUIDE = join(racine, 'app/pages/guide-de-style.vue')

/** Les sections numérotées du document de référence : `## 01 · …`. */
function sectionsDuDocument(): string[] {
  const contenu = readFileSync(COMPOSANTS_MD, 'utf8')
  return [...contenu.matchAll(/^##\s+(\d{2})\s/gm)].map((m) => m[1]!)
}

/** Les sections rendues par le guide de style : `data-composant="01"`. */
function sectionsDuGuide(): string[] {
  const contenu = readFileSync(GUIDE, 'utf8')
  return [...contenu.matchAll(/data-composant="(\d{2})"/g)].map((m) => m[1]!)
}

/** Les composants monofichiers de la bibliothèque. */
function fichiersDeComposant(): string[] {
  return readdirSync(DESIGN_SYSTEM).filter((n) => n.endsWith('.vue'))
}

describe('les seize composants canoniques', () => {
  const document_ = sectionsDuDocument()
  const guide = sectionsDuGuide()

  it('le document en déclare seize, numérotés sans trou', () => {
    expect(document_.length, `sections trouvées : ${document_.join(', ')}`).toBe(16)
    expect(document_).toEqual(
      Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0')),
    )
  })

  it('le guide de style les rend TOUS, et rien de plus', () => {
    // Les deux sens. Une section du guide sans entrée au document serait un
    // composant inventé ; une entrée sans section serait un composant que
    // personne ne peut regarder — et que P-06 déclarerait « dû » à tort.
    expect([...guide].sort()).toEqual([...document_].sort())
  })

  it('la bibliothèque porte un fichier par composant', () => {
    const fichiers = fichiersDeComposant()
    expect(
      fichiers.length,
      `fichiers : ${fichiers.join(', ')}`,
    ).toBe(16)
  })

  it('le guide IMPORTE chaque composant explicitement — c’est ce qui les branche', () => {
    // ⚠️ LA PORTE P-06 REPOSE ENTIÈREMENT LÀ-DESSUS. L'auto-import de Nuxt
    // supprime les instructions `import` : sans ces lignes, toute analyse
    // statique déclarerait morts des composants employés, la porte croulerait
    // sous les faux positifs, et on la désactiverait en trois semaines.
    const contenu = readFileSync(GUIDE, 'utf8')
    const manquants = fichiersDeComposant().filter(
      (fichier) => !contenu.includes(`~/core/design-system/${fichier}`),
    )
    expect(
      manquants,
      `composants non importés explicitement par le guide : ${manquants.join(', ')}`,
    ).toEqual([])
  })
})
