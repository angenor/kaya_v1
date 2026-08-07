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

/**
 * Le corps NORMATIF d'une section numérotée : ce que le document prescrit.
 *
 * ⚠️ LES BLOCS DE CITATION SONT RETIRÉS, ET CE N'EST PAS UNE ÉCHAPPATOIRE. Un
 * bloc `>` porte une note de décision — « ce paragraphe disait ceci, voici
 * pourquoi il ne le dit plus » —, et une telle note **doit** citer ce qu'elle
 * retire, sans quoi la correction serait tranchée en silence. Ce qui est
 * opposable est ce que la section prescrit ; ce qui est cité est ce qu'elle a
 * cessé de prescrire. **Constaté en écrivant ce test** : il a d'abord rougi sur
 * sa propre note de correction.
 */
function sectionDuDocument(numero: string): string {
  const lignes = readFileSync(COMPOSANTS_MD, 'utf8').split('\n')
  const debut = lignes.findIndex((l) => new RegExp(`^##\\s+${numero}\\s`).test(l))
  if (debut === -1) throw new Error(`section ${numero} introuvable dans composants.md`)
  const reste = lignes.slice(debut + 1)
  const fin = reste.findIndex((l) => /^##\s+\d{2}\s/.test(l))
  return [lignes[debut], ...(fin === -1 ? reste : reste.slice(0, fin))]
    .filter((ligne) => !/^\s*>/.test(ligne ?? ''))
    .join('\n')
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

  /**
   * ⚠️ LA TUILE D'ACTION N'A PAS D'ÉTAT DÉSACTIVÉ, ET CE TEST EST CE QUI
   * L'EMPÊCHE DE REVENIR.
   *
   * Le §05 en portait un — « désactivé (rôle) », « Désactivée, elle passe sur
   * `bg-tile` et dit pourquoi (« rôle serveuse ») ». **Deux violations en une
   * ligne** : une action non autorisée est **absente, jamais grisée**
   * (constitution, principe 8), et le mot « rôle » n'atteint **jamais** l'écran
   * (lexique). Le cycle F2 les a retirées ; sans ce test, la phrase reviendrait
   * à la première relecture qui la croirait perdue — et elle serait recopiée
   * dans un composant.
   *
   * Le contrôle porte sur le DOCUMENT, pas sur un composant : c'est le document
   * qui fait foi, et c'est de lui que la faute serait repartie.
   */
  it("le §05 ne rétablit ni état désactivé, ni le mot « rôle » sur l'écran", () => {
    const section = sectionDuDocument('05')

    // ⚠️ LE CONTRÔLE PORTE SUR L'ÉNUMÉRATION DES ÉTATS, ET C'EST LÀ QUE L'ÉTAT
    // RETIRÉ VIVAIT. Chercher le mot « désactivé » dans toute la section
    // rougirait sur la phrase qui l'INTERDIT — « il n'existe aucun état
    // désactivé » —, et un test qu'on ne peut satisfaire qu'en cessant
    // d'expliquer sa règle est un test qui finit désactivé.
    const etats = section.match(/^\*\*États\.\*\*(.*)$/m)?.[1] ?? ''
    expect(etats.length, "la ligne « **États.** » du §05 n'a pas été trouvée").toBeGreaterThan(10)
    expect(
      etats,
      "l'état « désactivé » est revenu à l'énumération du §05 — une tuile non autorisée est ABSENTE, jamais grisée (principe 8)",
    ).not.toMatch(/désactiv/i)

    // Le mot du lexique. « **Rôle.** » est l'étiquette structurelle de chaque
    // section — elle nomme le rôle DU COMPOSANT et n'atteint aucun écran. Ce
    // qui est proscrit, c'est le rôle RBAC rendu visible.
    expect(section, '« rôle serveuse » est revenu au §05 — le mot « rôle » n’atteint jamais l’écran').not.toMatch(
      /rôle\s+(serveuse|serveur|caissier|gérant)/i,
    )
    expect(section, '« (rôle) » est revenu au §05').not.toMatch(/\(rôle\)/i)

    // Le sens positif : la règle qui vaut doit y être écrite, sans quoi le
    // retrait aurait laissé un trou au lieu d'une décision.
    expect(section).toContain("n'est pas rendue")
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
