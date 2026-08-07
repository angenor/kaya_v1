import { fileURLToPath } from 'node:url'

import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * US3 · LA RÈGLE (d) REFUSE VRAIMENT, ET ELLE NOMME LA PAGE.
 *
 * ⚠️ UNE RÈGLE CONFIGURÉE ET JAMAIS ÉPROUVÉE EST UNE RÈGLE QU'ON CROIT ACTIVE.
 * C'est le raisonnement d'un test négatif de porte, appliqué au lint : une règle
 * qui ne signale jamais rien est indistinguable d'une règle qui n'a rien à
 * signaler. Un `files:` mal écrit, un identifiant changé par une montée de
 * version, et le lint reste vert pour toujours.
 *
 * ⚠️ ET LE COUPLE COMPTE AUTANT QUE L'ÉCHEC. La MÊME page, corrigée, doit
 * passer : sans ce second cas, on aurait prouvé que la règle refuse quelque
 * chose — pas qu'elle refuse au bon endroit.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))
const CHEMIN_PAGE = 'app/pages/registre-des-passages.vue'

/** La même page, dans ses deux versions. Le seul écart est la place du `v-if`. */
const PAGE_FAUTIVE = `<script setup lang="ts">
const chargee = false
</script>

<template>
  <div v-if="chargee">
    <p>Le registre</p>
  </div>
  <div v-else>
    <p>Chargement</p>
  </div>
</template>
`

const PAGE_CORRIGEE = `<script setup lang="ts">
const chargee = false
</script>

<template>
  <div>
    <div v-if="chargee">
      <p>Le registre</p>
    </div>
    <div v-else>
      <p>Chargement</p>
    </div>
  </div>
</template>
`

let lint: ESLint

beforeAll(() => {
  lint = new ESLint({ cwd: racine })
})

async function analyser(code: string) {
  const [resultat] = await lint.lintText(code, {
    filePath: `${racine}${CHEMIN_PAGE}`,
    warnIgnored: false,
  })
  return resultat!
}

describe('une page a une seule racine, et elle ne se démonte pas', () => {
  it('REFUSE une page dont le premier niveau est un v-if/v-else', async () => {
    const resultat = await analyser(PAGE_FAUTIVE)
    const messages = resultat.messages.filter((m) => m.ruleId === 'kaya/racine-de-page-stable')

    expect(messages.length, 'la règle (d) ne signale rien sur la page fautive').toBeGreaterThan(0)
    expect(resultat.errorCount).toBeGreaterThan(0)
  })

  it('NOMME la page fautive — un échec anonyme envoie chercher', async () => {
    const resultat = await analyser(PAGE_FAUTIVE)
    expect(resultat.filePath).toContain(CHEMIN_PAGE)
    // Et il dit à quelle ligne : la racine, pas le fichier entier.
    const message = resultat.messages.find((m) => m.ruleId === 'kaya/racine-de-page-stable')
    expect(message?.line).toBeGreaterThan(0)
  })

  it('dit CE QUE ÇA COÛTE, pas seulement que c’est interdit', async () => {
    // Un message qui dit « interdit » se contourne ; un message qui dit
    // pourquoi se comprend. Ici : la racine se démonte, donc le témoin et le
    // sélecteur d'établissement clignotent.
    const resultat = await analyser(PAGE_FAUTIVE)
    const message = resultat.messages.find((m) => m.ruleId === 'kaya/racine-de-page-stable')
    expect(message?.message).toMatch(/démonte/i)
  })

  it('LAISSE PASSER la même page, corrigée', async () => {
    const resultat = await analyser(PAGE_CORRIGEE)
    const messages = resultat.messages.filter((m) => m.ruleId === 'kaya/racine-de-page-stable')
    expect(messages, `la règle refuse une page pourtant conforme`).toEqual([])
  })

  it("ne s'applique pas à un composant, qui a droit aux fragments", async () => {
    // Vue 3 admet plusieurs racines, et un composant de la bibliothèque en
    // emploie légitimement. La contrainte porte sur ce qui ANCRE la navigation.
    const [resultat] = await lint.lintText(PAGE_FAUTIVE, {
      filePath: `${racine}app/core/design-system/Exemple.vue`,
      warnIgnored: false,
    })
    expect(
      resultat!.messages.filter((m) => m.ruleId === 'kaya/racine-de-page-stable'),
    ).toEqual([])
  })
})
