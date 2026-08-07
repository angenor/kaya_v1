// Configuration Nuxt — application à page unique, sans rendu serveur.
//
// « Une seule application Nuxt 4 en SPA pour tous les rôles métier »
// (constitution, principe 7). Le cycle F1 pose la coquille ; les six cycles
// suivants n'y reviennent que pour ajouter des pages.

export default defineNuxtConfig({
  // Phase 2 : aucun backend. `ssr: false` rend une SPA servie par un shell
  // statique — c'est ce que Capacitor embarquera tel quel en production.
  ssr: false,

  compatibilityDate: '2026-08-07',

  devtools: { enabled: false },

  future: { compatibilityVersion: 4 },
})
