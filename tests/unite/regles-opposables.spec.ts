import { fileURLToPath } from 'node:url'

import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Les CINQ règles opposables du lint, PROUVÉES PAR UN FICHIER FAUTIF.
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

  /**
   * ⚠️ ÉTENDU AU CYCLE F2 · **LA PHASE 2 N'ÉMET AUCUN APPEL RÉSEAU** (FR-051),
   * et rien ne l'empêchait. Toute donnée vient de la couche de simulation ; un
   * `fetch` écrit « juste pour essayer » aurait marché en développement, passé
   * le lint, et fait de la phase 3 une chasse au lieu d'un branchement.
   *
   * ⚠️ **DANS LA MÊME RÈGLE, JAMAIS UN SECOND MÉCANISME.** Un appel réseau est
   * une API de plateforme comme le stockage : hors ligne il se comporte
   * autrement sur chaque moteur, et sous Capacitor il ne passe pas par la même
   * pile. Deux contrôles pour une règle divergent.
   */
  const FAUTIF_RESEAU = `<script setup lang="ts">
const reponse = await fetch('/api/chambres')
const autre = new XMLHttpRequest()
const flux = new WebSocket('wss://exemple')
</script>

<template>
  <div>{{ reponse }}{{ autre }}{{ flux }}</div>
</template>
`

  it('échoue sur fetch, XMLHttpRequest et WebSocket dans une page', async () => {
    const regles = await reglesDeclenchees(FAUTIF_RESEAU, 'app/pages/fautif-reseau.vue')
    const signalees = regles.filter((r) => r === 'kaya/aucune-api-de-plateforme')
    expect(signalees.length, 'les trois appels ne sont pas tous signalés').toBe(3)
  })

  it('échoue aussi sur `$fetch`, la forme de Nuxt — la frontière de mot ne suffit pas', async () => {
    const code = `<script setup lang="ts">
const donnees = await $fetch('/api/chambres')
</script>

<template>
  <div>{{ donnees }}</div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/core/accueil/FautifReseau.vue')).toContain(
      'kaya/aucune-api-de-plateforme',
    )
  })

  it("ne dit rien dans app/core/plateforme/, où le réseau a le droit d'exister", async () => {
    const regles = await reglesDeclenchees(FAUTIF_RESEAU, 'app/core/plateforme/web/reseau.ts')
    expect(regles).not.toContain('kaya/aucune-api-de-plateforme')
  })

  it("ne dit rien sur un identifiant qui CONTIENT le mot — « prefetch », « refetch »", async () => {
    // Une règle qui signale trop se désactive : c'est ainsi qu'une porte meurt.
    const code = `<script setup lang="ts">
const prefetchDesactive = true
function refetchPlusTard() { return prefetchDesactive }
</script>

<template>
  <div>{{ refetchPlusTard() }}</div>
</template>
`
    expect(await reglesDeclenchees(code, 'app/pages/conforme-reseau.vue')).not.toContain(
      'kaya/aucune-api-de-plateforme',
    )
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

  /**
   * ⚠️ ÉTENDU AU CYCLE F2 — **le pendant qui manquait** (FR-048).
   *
   * La règle interdisait à un composant d'importer une SIMULATION ou un JEU.
   * Elle laissait passer `app/core/scenarios/reglages.ts`, qui est pourtant la
   * même faute vue autrement : un composant qui lit les leviers sait qu'un
   * scénario existe, et son rendu devient conditionné par un instrument — donc
   * irreproductible le jour où l'instrument disparaît.
   *
   * ⚠️ ET C'EST LA MÊME RÈGLE QU'ON ÉTEND, JAMAIS UN SECOND MÉCANISME. Deux
   * contrôles pour une règle divergent, et c'est le plus faible qu'on croira.
   */
  const FAUTIF_SCENARIO = `<script setup lang="ts">
import { reglagesCourants } from '~/core/scenarios/reglages'
const horsLigne = reglagesCourants().horsLigne
</script>

<template>
  <div>{{ horsLigne }}</div>
</template>
`

  it('échoue quand une PAGE lit les réglages de scénario', async () => {
    const regles = await reglesDeclenchees(FAUTIF_SCENARIO, 'app/pages/fautif-scenario.vue')
    expect(regles).toContain('no-restricted-imports')
  })

  it('échoue aussi dans une rubrique de l’accueil — le motif que onze écrans héritent', async () => {
    const regles = await reglesDeclenchees(FAUTIF_SCENARIO, 'app/core/accueil/FautifSurface.vue')
    expect(regles).toContain('no-restricted-imports')
  })

  it("ne dit rien dans le PANNEAU, qui écrit les réglages sans les appliquer", async () => {
    // L'instrument est le seul écran qui a le droit de les connaître : il les
    // ÉCRIT. C'est la couche de simulation qui les lit et les applique.
    const regles = await reglesDeclenchees(FAUTIF_SCENARIO, 'app/pages/scenarios.vue')
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

  /**
   * ⚠️ **LE PÉRIMÈTRE SE PROUVE PAR CHEMIN, PAS PAR LECTURE DE LA
   * CONFIGURATION** (SC-011, cycle F2). La règle est déclarée sur `app/**` ;
   * un `ignores:` ajouté un jour pour débloquer un fichier la retirerait
   * silencieusement de tout un répertoire, et le lint resterait vert. Les trois
   * chemins nommés ici sont ceux que le cycle a créés — les rubriques de
   * l'accueil, la coquille, et les pages.
   */
  for (const chemin of [
    'app/core/accueil/FautifJeton.vue',
    'app/core/coquille/FautifJeton.vue',
    'app/pages/fautif-jeton.vue',
  ]) {
    it(`couvre ${chemin}`, async () => {
      const code = `<template>
  <div class="bg-[#21458c]">x</div>
</template>
`
      expect(await reglesDeclenchees(code, chemin)).toContain('kaya/aucune-valeur-hors-jetons')
    })
  }

  it('le mode sombre passe par la variante `dark:`, jamais par une seconde palette', async () => {
    // ⚠️ UNE COULEUR « POUR LE SOMBRE » ÉCRITE À LA MAIN EST LE DÉBUT D'UNE
    // SECONDE PALETTE : les deux dérivent, et c'est celle qu'on regarde le
    // moins qui devient fausse. La variante, elle, réemploie le même jeton.
    const fautif = `<template>
  <div class="bg-surf dark:bg-[#241c16]">x</div>
</template>
`
    expect(await reglesDeclenchees(fautif, 'app/core/accueil/FautifSombre.vue')).toContain(
      'kaya/aucune-valeur-hors-jetons',
    )

    const conforme = `<template>
  <div class="bg-surf text-ink dark:bg-tile dark:text-ink-2">x</div>
</template>
`
    expect(await reglesDeclenchees(conforme, 'app/core/accueil/ConformeSombre.vue')).not.toContain(
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

describe("(e) aucune horloge lue dans un composant", () => {
  const FAUTIF = `<script setup lang="ts">
const debut = Date.now()
const maintenant = new Date()
const marque = performance.now()
</script>

<template>
  <div>{{ debut }}{{ maintenant }}{{ marque }}</div>
</template>
`

  it('échoue dans une page — un montant dépendrait du réglage de l’appareil', async () => {
    // ⚠️ RÈGLE D'ARGENT, PAS D'HYGIÈNE. Un passage se facture à la durée ;
    // l'horloge d'un terminal partagé se règle à la main (cadrage §11.4).
    const regles = await reglesDeclenchees(FAUTIF, 'app/pages/fautif-horloge.vue')
    expect(regles).toContain('kaya/aucune-horloge-dans-un-composant')
  })

  it("échoue aussi dans un composant de core/ — la garde ne s'arrête pas aux pages", async () => {
    const regles = await reglesDeclenchees(FAUTIF, 'app/core/reception/FautifHorloge.vue')
    expect(regles).toContain('kaya/aucune-horloge-dans-un-composant')
  })

  it("ne dit rien dans core/donnees/, qui EST la couture de l'instant", async () => {
    const code = `export function maintenant(): Date {
  return new Date()
}
`
    const regles = await reglesDeclenchees(code, 'app/core/donnees/horloge.ts')
    expect(regles).not.toContain('kaya/aucune-horloge-dans-un-composant')
  })

  it("ne dit rien dans core/format/instant.ts, qui MET EN FORME sans dire l'heure", async () => {
    const code = `export function ecrire(instant: Date): string {
  const secours = new Date()
  return instant.toISOString() + secours.toISOString()
}
`
    const regles = await reglesDeclenchees(code, 'app/core/format/instant.ts')
    expect(regles).not.toContain('kaya/aucune-horloge-dans-un-composant')
  })

  it("ne dit rien sur `new Date(valeur)`, qui LIT un instant au lieu de le prendre", async () => {
    // ⚠️ La distinction est tout le sujet : `new Date(iso)` interprète une
    // valeur reçue du domaine ; `new Date()` interroge l'appareil.
    const code = `const debut = new Date('2026-08-08T14:00:00.000Z')
export const heure = debut.getUTCHours()
`
    const regles = await reglesDeclenchees(code, 'app/core/reception/lecture.ts')
    expect(regles).not.toContain('kaya/aucune-horloge-dans-un-composant')
  })
})
