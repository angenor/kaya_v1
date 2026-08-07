import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * Tests d'unité et de composants.
 *
 * ⚠️ `tests/navigateur/` EST EXCLU, et ce n'est pas un détail d'organisation :
 * ces suites-là sont pilotées par Playwright, dans un navigateur RÉEL. Monter un
 * composant contourne le routeur, la suspension, les gabarits et les greffons —
 * « un test qui monte un composant ne prouve pas qu'une page s'atteint »
 * (constitution, principe 8).
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    // ⚠️ `node` PAR DÉFAUT, happy-dom PAR DOCBLOC. Ce n'est pas une préférence :
    // happy-dom remplace le `URL` global par le sien, et `fileURLToPath` refuse
    // alors l'objet qu'il reçoit — « The URL must be of scheme file ». Or la
    // moitié des tests de ce cycle LISENT DES FICHIERS : la conformité au modèle
    // SQL, la copie conforme du thème, la parité des catalogues. Les tests qui
    // ont besoin d'un DOM le déclarent en tête de fichier :
    //     // @vitest-environment happy-dom
    environment: 'node',
    include: ['tests/unite/**/*.spec.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      // ⚠️ LE RAPPORT JSON EST CE QUE LA PORTE P-06 LIT, et c'est le seul
      // format qui porte la couverture PAR FONCTION. « Ce fichier est testé »
      // et « cette méthode est appelée par un test » ne sont pas la même
      // affirmation : un fichier de vingt méthodes dont une seule est exercée
      // passerait un seuil par fichier.
      reporter: ['text-summary', 'json'],
      reportsDirectory: '.rapports/couverture',
      include: ['app/**/*.{ts,vue}'],
      exclude: ['app/core/donnees/jeux/**', 'app/assets/**'],
      // `all` fait entrer au rapport les fichiers qu'aucun test ne touche :
      // sans lui, un point d'entrée jamais exercé serait ABSENT du rapport, et
      // P-06 le lirait comme « pas de donnée » au lieu de « zéro passage ».
      all: true,
    },
  },
})
