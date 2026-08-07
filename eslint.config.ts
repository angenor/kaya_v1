import js from '@eslint/js'
import intlify from '@intlify/eslint-plugin-vue-i18n'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

import kaya from './scripts/eslint/regles-kaya.mjs'

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

  // (b) — un composant ne connaît JAMAIS la provenance de ses données.
  //       « Un composant qui saurait qu'un scénario existe serait un composant à
  //       réécrire en phase 3. »
  {
    files: [
      'app/pages/**/*.vue',
      'app/layouts/**/*.vue',
      'app/components/**/*.vue',
      'app/core/design-system/**/*.vue',
    ],
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

  // Aucune chaîne visible en dur — activée à T025, avec les catalogues.
  {
    files: ['app/**/*.vue'],
    plugins: { '@intlify/vue-i18n': intlify },
    rules: {},
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
