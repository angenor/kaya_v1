import { existsSync, readFileSync } from 'node:fs'

import js from '@eslint/js'
import intlify from '@intlify/eslint-plugin-vue-i18n'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

import kaya from './scripts/eslint/regles-kaya.mjs'

/**
 * LES AUTO-IMPORTS DE NUXT, LUS DEPUIS CE QUE LA PRÉPARATION ENGENDRE.
 *
 * ⚠️ CE N'EST PAS UNE LISTE TENUE À LA MAIN, et c'est le point : `useState`,
 * `computed`, `navigateTo`… n'ont pas d'instruction `import`, donc `no-undef`
 * les signale toutes. Une liste écrite à la main serait fausse au premier module
 * ajouté, et on désactiverait `no-undef` — c'est-à-dire la règle qui attrape les
 * vraies fautes de frappe.
 *
 * La source est `.nuxt/imports.d.ts`, engendré par `nuxt prepare` à
 * l'installation. Elle grandit toute seule avec les modules.
 */
function autoImportsDeNuxt(): Record<string, 'readonly'> {
  const chemin = new URL('./.nuxt/imports.d.ts', import.meta.url)
  const noms = new Set<string>()
  if (existsSync(chemin)) {
    const contenu = readFileSync(chemin, 'utf8')
    for (const bloc of contenu.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const brut of bloc[1]!.split(',')) {
        const nom = brut.trim().split(/\s+as\s+/).pop()?.trim()
        if (nom && /^[A-Za-z_$][\w$]*$/.test(nom)) noms.add(nom)
      }
    }
  }
  // Les macros et les composables que la préparation ne déclare PAS dans ce
  // fichier : `definePageMeta` est une macro du compilateur de pages, et les
  // quatre suivantes viennent de vue-i18n. Constaté en cherchant dans `.nuxt/`,
  // jamais supposé.
  for (const nom of [
    'definePageMeta',
    'defineI18nConfig',
    'defineI18nLocale',
    'useI18n',
    'useLocalePath',
    'useSwitchLocalePath',
    'useLocaleHead',
  ]) {
    noms.add(nom)
  }
  return Object.fromEntries([...noms].map((nom) => [nom, 'readonly' as const]))
}

/**
 * Le lint porte QUATRE RÈGLES OPPOSABLES, et aucune n'est décorative : chacune
 * refuse une faute que le reste de la vérification ne verrait pas.
 *
 *   (a) aucune API de plateforme hors de app/core/plateforme/ et app/core/file/
 *   (b) aucun composant n'importe une simulation ni un jeu de données
 *   (c) aucune valeur littérale de couleur, espacement, rayon, durée ou courbe
 *   (d) une page a UNE SEULE RACINE, et c'est un élément
 *
 * ⚠️ L'identifiant de (d) a été VÉRIFIÉ CONTRE LE GREFFON INSTALLÉ, jamais cité
 * de mémoire : `vue/no-root-v-if` existe bien dans eslint-plugin-vue 10.10.0, et
 * sa description amont est « disallow v-if directives on root element ». Il est
 * accompagné de `vue/no-multiple-template-root`, que le préréglage Vue 3 laisse
 * éteint parce que Vue 3 admet les fragments — nous le rallumons pour les pages
 * et les gabarits, où une seconde racine casse la transition d'écran.
 */
export default tseslint.config(
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'node_modules/**',
      '.rapports/**',
      'app/assets/polices/**',
      'dist/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],

  {
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2024,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        // Le navigateur et Nuxt. `document` n'est pas une capacité de
        // plateforme au sens du principe 7 — c'est le rendu lui-même.
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        URL: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        HTMLElement: 'readonly',
        process: 'readonly',
        ...autoImportsDeNuxt(),
      },
    },
    plugins: { kaya },
    rules: {
      // (c) — appliquée partout dans app/, y compris aux gabarits.
      'kaya/aucune-valeur-hors-jetons': 'error',

      // Le reste du régime.
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // (a) — l'adaptateur de plateforme et la file sont les DEUX seuls endroits
  //       où une API de plateforme s'appelle.
  {
    files: ['app/**/*.{ts,vue}'],
    ignores: ['app/core/plateforme/**', 'app/core/file/**'],
    rules: { 'kaya/aucune-api-de-plateforme': 'error' },
  },

  // (e) — AUCUNE HORLOGE LUE DANS UN COMPOSANT.
  //
  // ⚠️ RÈGLE D'ARGENT, PAS D'HYGIÈNE. Un passage se facture à la durée, et le
  // cadrage §11.4 est formel : « les horloges des terminaux ne sont pas
  // fiables — un téléphone d'entrée de gamme dérive, et le personnel change
  // l'heure ». Une horloge lue dans une page ferait changer un MONTANT en
  // changeant un réglage d'appareil, sans que rien ne le signale.
  //
  // DEUX EXEMPTIONS, ET ELLES SONT NOMMÉES ICI :
  //   — `core/donnees/horloge.ts` EST la couture de l'instant. C'est le fichier
  //     qu'on remplacera en phase 3 par l'en-tête `Date` de la réponse serveur ;
  //   — `core/format/instant.ts` MET EN FORME un instant qu'on lui donne, et ne
  //     dit jamais lequel il est. Elle relève de l'exemption « rendu de
  //     l'instant perçu » du principe 4.
  //
  // ⚠️ ET LA COUTURE SIMULÉE EN FAIT PARTIE : `core/donnees/` et
  // `core/scenarios/` disparaissent au branchement. Une garde qui les
  // couvrirait ferait interdire à la simulation de simuler le temps.
  {
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue', 'app/core/**/*.{ts,vue}'],
    ignores: ['app/core/donnees/**', 'app/core/scenarios/**', 'app/core/format/instant.ts'],
    rules: { 'kaya/aucune-horloge-dans-un-composant': 'error' },
  },

  // (b) — un composant ne connaît JAMAIS la provenance de ses données.
  //       « Un composant qui saurait qu'un scénario existe serait un composant à
  //       réécrire en phase 3. »
  {
    files: [
      'app/pages/**/*.vue',
      'app/layouts/**/*.vue',
      'app/components/**/*.vue',
      'app/core/design-system/**/*.vue',
      // ⚠️ ÉTENDU AU CYCLE F2 : les composants de RUBRIQUE de l'accueil. `R1`
      // est un motif dont onze écrans hériteront — si le premier importait une
      // simulation, les onze le recopieraient.
      'app/core/accueil/**/*.vue',
      'app/core/coquille/**/*.vue',
    ],
    // ⚠️ `app/pages/scenarios.vue` EST EXEMPTÉ, ET C'EST LE SEUL. L'instrument
    // ÉCRIT les réglages ; il ne les applique pas. La règle ci-dessous porte sur
    // la lecture, et c'est elle qui compte : un composant qui LIRAIT
    // `reglagesCourants()` saurait qu'un scénario existe, donc serait à réécrire
    // en phase 3 — l'instrument, lui, disparaît avec eux.
    ignores: ['app/pages/scenarios.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/simulation', '**/simulation.ts', '**/donnees/jeux/**'],
              message:
                "Un composant ne connaît jamais la provenance de ses données : il passe par l'interface de domaine. La simulation DISPARAÎT au branchement de la phase 3 — un import direct serait un composant à réécrire.",
            },
            {
              // FR-048 — ⚠️ LE PENDANT DU PRÉCÉDENT, ET IL MANQUAIT. « Aucun
              // composant ne sait qu'un scénario existe » : les leviers
              // s'appliquent DANS la couche de simulation, et nulle part
              // ailleurs. Un composant qui lirait les réglages produirait un
              // rendu conditionné par un instrument — c'est-à-dire un rendu
              // qu'on ne saurait pas reproduire en phase 3.
              group: ['**/scenarios/reglages', '**/scenarios/reglages.ts'],
              message:
                "Aucun composant ne sait qu'un scénario existe. Les leviers s'appliquent dans la couche de simulation, qui DISPARAÎT au branchement — un composant qui les lirait serait à réécrire.",
            },
          ],
        },
      ],
    },
  },

  // (d) — une page et un gabarit ont UNE SEULE RACINE, et c'est un élément.
  //       Un `v-if`/`v-else` de premier niveau démonte la racine à chaque
  //       changement d'état : le témoin et le sélecteur d'établissement
  //       clignotent, et la transition d'écran n'a plus d'ancrage.
  {
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue'],
    rules: {
      // ⚠️ CELLE-CI EST LA RÈGLE (d). Les deux suivantes ne la remplacent pas :
      // vérifié en les exécutant, `vue/no-root-v-if` ne signale que le `v-if`
      // de racine SANS `v-else`, et `vue/no-multiple-template-root` compte une
      // chaîne `v-if`/`v-else` comme une seule racine. Le cas exact de FR-036
      // les traverse toutes les deux sans un mot.
      'kaya/racine-de-page-stable': 'error',
      'vue/no-root-v-if': 'error',
      'vue/no-multiple-template-root': ['error', { disallowComments: true }],
      'vue/valid-template-root': 'error',
    },
  },

  // AUCUNE CHAÎNE VISIBLE EN DUR.
  //
  // ⚠️ `eslint-plugin-vue` n'a AUCUNE règle de texte brut : c'est le greffon
  // @intlify qui la porte, et elle échoue EN NOMMANT le fichier et la ligne.
  // Sans elle, une chaîne écrite en dur ne se découvre qu'au jour où quelqu'un
  // bascule la langue — c'est-à-dire jamais, en développement.
  {
    files: ['app/**/*.vue'],
    plugins: { '@intlify/vue-i18n': intlify },
    // ⚠️ AUCUN `settings['vue-i18n']` ICI, ET C'EST UN CONSTAT. Déclarer
    // `localeDir` faisait lever le greffon — « Cannot convert undefined or null
    // to object » — dès qu'ESLint analysait un texte plutôt qu'un fichier du
    // disque, c'est-à-dire dans les tests qui ÉPROUVENT les règles. La règle
    // `no-raw-text` n'a pas besoin de connaître les catalogues : elle cherche du
    // texte hors d'un appel de traduction, pas une clé manquante. C'est le test
    // de parité qui tient l'autre propriété.
    rules: {
      '@intlify/vue-i18n/no-raw-text': [
        'error',
        {
          // Ce que la règle laisse passer, et pourquoi chaque exception est là.
          ignorePattern: '^[\\d\\s·—–\\-+%:/.,()]+$', // chiffres, séparateurs, ponctuation
          ignoreText: [
            'K', // l'initiale de repli du sélecteur d'établissement — un glyphe, pas une phrase
            'Kaya', // le nom du produit ne se traduit pas
          ],
          // Les attributs qui portent du texte visible sont inspectés aussi :
          // un `aria-label` en dur est aussi invisible qu'une chaîne en dur.
          attributes: {
            '/.+/': ['title', 'aria-label', 'aria-placeholder', 'aria-valuetext', 'alt'],
          },
        },
      ],
    },
  },

  // L'outillage tourne sous node : il n'est ni une page ni un composant.
  {
    files: ['scripts/**/*.mjs', '*.config.ts', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      'kaya/aucune-valeur-hors-jetons': 'off',
    },
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly' },
    },
  },
)
