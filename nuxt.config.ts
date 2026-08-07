import tailwindcss from '@tailwindcss/vite'

/**
 * LE THÈME, POSÉ AVANT LE PREMIER PIXEL.
 *
 * ⚠️ CE SCRIPT EST EN LIGNE DANS LE `<head>`, ET IL DOIT L'ÊTRE. Un greffon Nuxt
 * s'exécute après l'hydratation, donc APRÈS le premier rendu : au démarrage en
 * thème sombre, l'écran afficherait un éclair de fond clair. Ce défaut ne se
 * voit pas au développement — on ouvre déjà l'application — et il se voit à la
 * démonstration, à Abengourou, sur le premier appareil qu'on tend à quelqu'un.
 *
 * Il est écrit à la main, sans dépendance, et il ne LÈVE JAMAIS : sur WebKit en
 * navigation privée, l'accès à `localStorage` lève au lieu de rendre `null`. Un
 * script de tête qui lève laisse la page sans thème du tout.
 *
 * Il vit ici et non dans `app/` parce qu'il n'est pas du code d'application :
 * c'est une ligne du document, au même titre que la balise `<meta>`.
 */
const SCRIPT_THEME = `
(function () {
  try {
    var choix = null;
    try { choix = localStorage.getItem('kaya.theme'); } catch (e) { choix = null; }
    var sombre =
      choix === 'sombre' ||
      (choix !== 'clair' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    var racine = document.documentElement;
    racine.classList.toggle('dark', !!sombre);
    racine.style.colorScheme = sombre ? 'dark' : 'light';
    racine.dataset.theme = sombre ? 'sombre' : 'clair';
  } catch (e) {}
})();
`.trim()

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

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      script: [{ innerHTML: SCRIPT_THEME, tagPosition: 'head', tagPriority: 'critical' }],
    },
  },

  // theme.css est la COPIE CONFORME de docs/design/theme.css — jamais éditée
  // ici. Il porte `@import "tailwindcss"`, donc il est le point d'entrée du
  // noyau Tailwind autant que celui des jetons.
  css: ['~/assets/css/theme.css', '~/assets/css/polices.css'],

  vite: {
    plugins: [tailwindcss()],
  },
})
