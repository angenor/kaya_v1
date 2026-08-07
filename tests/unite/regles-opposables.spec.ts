import { fileURLToPath } from 'node:url'

import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Les quatre règles opposables du lint, PROUVÉES PAR UN FICHIER FAUTIF.
 *
 * ⚠️ UNE RÈGLE CONFIGURÉE ET JAMAIS ÉPROUVÉE EST UNE RÈGLE QU'ON CROIT ACTIVE.
 * C'est le même raisonnement qu'un test négatif de porte : une règle qui ne
 * signale jamais rien est indistinguable d'une règle qui n'a rien à signaler —
 * un `files:` mal écrit, un identifiant changé par une montée de version, et le
 * lint reste vert pour toujours.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))

let lint: ESLint

beforeAll(() => {
  lint = new ESLint({ cwd: racine })
})

/** Les identifiants de règle signalés sur un texte donné, à un chemin donné. */
async function reglesDeclenchees(code: string, chemin: string): Promise<string[]> {
  const resultats = await lint.lintText(code, { filePath: `${racine}${chemin}`, warnIgnored: false })
  return resultats.flatMap((r) => r.messages.map((m) => m.ruleId ?? '(erreur de syntaxe)'))
}

describe('(a) aucune API de plateforme hors de PlatformAdapter', () => {
  const FAUTIF = `<script setup lang="ts">
const etat = navigator.onLine
const memo = localStorage.getItem('x')
</script>

<template>
  <div>{{ etat }}{{ memo }}</div>
</template>
`

  it("échoue dans un composant, en nommant l'API", async () => {
    const regles = await reglesDeclenchees(FAUTIF, 'app/pages/fautif-plateforme.vue')
    expect(regles).toContain('kaya/aucune-api-de-plateforme')
  })

  it("ne dit rien dans app/core/plateforme/, qui est l'endroit prévu", async () => {
    const regles = await reglesDeclenchees(FAUTIF, 'app/core/plateforme/web/fautif.vue')
    expect(regles).not.toContain('kaya/aucune-api-de-plateforme')
  })

  it("ne dit rien dans app/core/file/, l'autre endroit prévu", async () => {
    const regles = await reglesDeclenchees(FAUTIF, 'app/core/file/fautif.vue')
    expect(regles).not.toContain('kaya/aucune-api-de-plateforme')
  })
})

describe('aucune chaîne visible en dur', () => {
  // ⚠️ SANS CETTE RÈGLE, UNE CHAÎNE EN DUR NE SE DÉCOUVRE QU'AU JOUR OÙ
  // QUELQU'UN BASCULE LA LANGUE — c'est-à-dire jamais, en développement.
  it('échoue sur une phrase écrite dans un gabarit', async () => {
    const code = `<template>
  <p>Chambre libre depuis ce matin</p>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/fautif-chaine.vue')).toContain(
      '@intlify/vue-i18n/no-raw-text',
    )
  })

  it('échoue sur un aria-label écrit en dur — aussi invisible qu’une chaîne', async () => {
    const code = `<template>
  <button aria-label="Fermer le panneau" />
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/fautif-aria.vue')).toContain(
      '@intlify/vue-i18n/no-raw-text',
    )
  })

  it('ne dit rien sur un appel de traduction, ni sur un nombre, ni sur le nom du produit', async () => {
    const code = `<template>
  <div>
    <span>{{ $t('temoin.enregistre') }}</span>
    <span>204</span>
    <span>Kaya</span>
  </div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/conforme-chaine.vue')).not.toContain(
      '@intlify/vue-i18n/no-raw-text',
    )
  })
})

describe("(b) aucun composant n'importe une simulation ni un jeu de données", () => {
  const FAUTIF = `<script setup lang="ts">
import { simulationHebergement } from '~/core/donnees/hebergement/simulation'
import { deloria } from '~/core/donnees/jeux/deloria'
</script>

<template>
  <div>{{ simulationHebergement }}{{ deloria }}</div>
</template>
`

  it('échoue dans une page', async () => {
    const regles = await reglesDeclenchees(FAUTIF, 'app/pages/fautif-import.vue')
    expect(regles).toContain('no-restricted-imports')
  })

  it("ne dit rien dans app/core/donnees/, où la liaison est LE rôle du fichier", async () => {
    const regles = await reglesDeclenchees(FAUTIF, 'app/core/donnees/fournisseur.vue')
    expect(regles).not.toContain('no-restricted-imports')
  })
})

describe('(c) aucune valeur littérale hors des jetons', () => {
  it('échoue sur une couleur écrite en clair', async () => {
    const code = `<template>
  <div class="p-4" data-teinte="#21458c">x</div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/fautif-couleur.vue')).toContain(
      'kaya/aucune-valeur-hors-jetons',
    )
  })

  it('échoue sur une valeur arbitraire de Tailwind', async () => {
    const code = `<template>
  <div class="bg-[#21458c] rounded-[7px]">x</div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/fautif-arbitraire.vue')).toContain(
      'kaya/aucune-valeur-hors-jetons',
    )
  })

  it('échoue sur une durée écrite en clair', async () => {
    const code = `<script setup lang="ts">
const transition = 'opacity 250ms ease-out'
</script>

<template>
  <div>{{ transition }}</div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/fautif-duree.vue')).toContain(
      'kaya/aucune-valeur-hors-jetons',
    )
  })

  it("ne dit rien sur les TROIS exemptions écrites dans tokens.md §7", async () => {
    // Largeur de gabarit, épaisseur de bordure de 1,5 px, et clip-path du
    // triangle du composant 04 — chacune motivée dans un document.
    const code = `<template>
  <div class="max-w-[460px] border-[1.5px] border-prim">
    <span class="size-2 bg-danger [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
  </div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/exempte.vue')).not.toContain(
      'kaya/aucune-valeur-hors-jetons',
    )
  })

  it("ne dit rien sur un utilitaire de jeton, ni sur un type TypeScript à crochets", async () => {
    const code = `<script setup lang="ts">
const table: Record<string, string[]> = { a: ['b'] }
</script>

<template>
  <button class="h-11 px-5 rounded-lg bg-prim text-prim-ink duration-90 ease-entree">
    {{ table.a[0] }}
  </button>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/conforme.vue')).not.toContain(
      'kaya/aucune-valeur-hors-jetons',
    )
  })
})

describe('(d) une page a une seule racine, et c\'est un élément', () => {
  it('échoue sur un v-if/v-else de PREMIER NIVEAU dans une page', async () => {
    const code = `<template>
  <div v-if="pret">prêt</div>
  <div v-else>chargement</div>
</template>

<script setup lang="ts">
const pret = true
</script>
`
    const regles = await reglesDeclenchees(code, 'app/pages/fautif-racine.vue')
    expect(regles).toContain('kaya/racine-de-page-stable')
  })

  it("prouve que les DEUX règles amont laissent passer ce cas — d'où la règle locale", async () => {
    // ⚠️ C'est le constat qui justifie d'avoir écrit (d) à la main plutôt que
    // de citer un identifiant de mémoire. `vue/no-root-v-if` ne signale que le
    // `v-if` de racine SANS `v-else` ; `vue/no-multiple-template-root` compte
    // une chaîne v-if/v-else comme UNE racine. Si une montée de version leur
    // faisait couvrir le cas, ce test le dirait — et la règle locale pourrait
    // partir.
    const code = `<template>
  <div v-if="pret">prêt</div>
  <div v-else>chargement</div>
</template>

<script setup lang="ts">
const pret = true
</script>
`
    const regles = await reglesDeclenchees(code, 'app/pages/fautif-racine.vue')
    expect(regles).not.toContain('vue/no-root-v-if')
    expect(regles).not.toContain('vue/no-multiple-template-root')
  })

  it('échoue sur DEUX racines dans une page', async () => {
    const code = `<template>
  <header>en-tête</header>
  <main>corps</main>
</template>
`
    const regles = await reglesDeclenchees(code, 'app/pages/fautif-deux-racines.vue')
    expect(regles).toContain('vue/no-multiple-template-root')
    expect(regles).toContain('kaya/racine-de-page-stable')
  })

  it("échoue quand la racine n'est pas un élément", async () => {
    const code = `<template>
  {{ message }}
</template>

<script setup lang="ts">
const message = 'x'
</script>
`
    expect(await reglesDeclenchees(code, 'app/pages/fautif-racine-texte.vue')).toContain(
      'kaya/racine-de-page-stable',
    )
  })

  it('ne dit rien quand la racine est unique et que le v-if est DEDANS', async () => {
    const code = `<template>
  <div>
    <p v-if="pret">prêt</p>
    <p v-else>chargement</p>
  </div>
</template>

<script setup lang="ts">
const pret = true
</script>
`
    const regles = await reglesDeclenchees(code, 'app/pages/conforme-racine.vue')
    expect(regles).not.toContain('kaya/racine-de-page-stable')
    expect(regles).not.toContain('vue/no-root-v-if')
    expect(regles).not.toContain('vue/no-multiple-template-root')
  })

  it("ne dit rien sur un COMPOSANT à plusieurs racines — la règle vise les pages et les gabarits", async () => {
    // Vue 3 admet les fragments, et un composant de la bibliothèque en emploie
    // légitimement. La contrainte porte sur ce qui ANCRE la navigation.
    const code = `<template>
  <span>a</span>
  <span>b</span>
</template>
`
    expect(
      await reglesDeclenchees(code, 'app/core/design-system/Fragment.vue'),
    ).not.toContain('kaya/racine-de-page-stable')
  })
})
