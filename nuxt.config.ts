import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * LA COQUILLE PWA — mince, et remplaçable.
 *
 * ⚠️ RIEN DE MÉTIER DANS LE SERVICE WORKER, AUCUNE LOGIQUE DANS LE MANIFESTE
 * (FR-016). La PWA est la coquille de la PHASE 2 et de la démonstration ; ce
 * n'est PAS la cible de production, qui est Capacitor (constitution, principe 7).
 * Tout ce qui y entrerait serait à réécrire, et l'y mettre donnerait en plus
 * l'illusion que la coquille est le produit.
 *
 * ⚠️ `base: '/'` ET NON LA BASE DE VITE. Nuxt sert ses actifs sous `/_nuxt/`,
 * donc `viteConfig.base` vaut `/_nuxt/` — et le manifeste de précache serait
 * alors préfixé deux fois (`/_nuxt/_nuxt/…`). Le service worker, lui, est écrit
 * à la RACINE de la sortie, donc sa portée est `/` : c'est ce qui lui permet de
 * contrôler la navigation, ce qu'un service worker sous `/_nuxt/` ne pourrait
 * pas faire.
 *
 * ⚠️ L'ENTRÉE `/` EST AJOUTÉE À LA MAIN AU PRÉCACHE, et c'est ce qui rend
 * l'ouverture hors ligne possible DÈS LE PREMIER ÉCRAN. La coquille HTML n'est
 * pas un fichier de la construction Vite — elle est rendue par nitro —, donc
 * aucun ratissage de fichiers ne la trouverait. Sans cette ligne, le service
 * worker précacherait le JavaScript et le CSS d'une page qu'il ne saurait pas
 * servir.
 */
const REVISION_COQUILLE = process.env.KAYA_REVISION ?? 'f1'

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

  modules: ['@nuxtjs/i18n'],

  /**
   * ⚠️ LE SERVICE WORKER DOIT ATTERRIR À LA RACINE DE LA SORTIE, ET NUXT NE L'Y
   * MET PAS. Constaté en construisant : nitro ne recopie que le sous-répertoire
   * d'actifs (`dist/client/_nuxt` → `.output/public/_nuxt`). Les trois fichiers
   * que le greffon écrit à la racine de la sortie Vite — `sw.js`, son morceau
   * Workbox et `manifest.webmanifest` — y resteraient.
   *
   * Et la portée d'un service worker EST son emplacement : servi depuis
   * `/_nuxt/sw.js`, il ne contrôlerait que `/_nuxt/`, donc aucune navigation. Ce
   * transport de trois fichiers est ce qui sépare une application qui s'ouvre
   * hors ligne d'une application qui affiche la page d'erreur du navigateur.
   */
  hooks: {
    'nitro:init'(nitro) {
      nitro.hooks.hook('compiled', () => {
        const source = join(nitro.options.buildDir, 'dist/client')
        const cible = join(nitro.options.output.publicDir)
        if (!existsSync(source)) return
        const transportes: string[] = []
        for (const nom of readdirSync(source)) {
          if (!/^(sw\.js|workbox-[\w-]+\.js|manifest\.webmanifest)$/.test(nom)) continue
          copyFileSync(join(source, nom), join(cible, nom))
          transportes.push(nom)
        }
        if (transportes.length > 0) {
          console.info(`[coquille pwa] ${transportes.join(' · ')} → ${cible}`)
        }
      })
    },
  },

  // ⚠️ FRANÇAIS PAR DÉFAUT, ANGLAIS EN SECOND (constitution, principe 8).
  // `no_prefix` : la langue n'entre PAS dans l'URL. Une route est visible, et
  // `/fr/_ecrans` ferait entrer un détail d'implémentation dans la barre
  // d'adresse — la même raison qui a fait nommer `S1` « /mes-envois » et non
  // « /synchronisation ».
  i18n: {
    defaultLocale: 'fr',
    strategy: 'no_prefix',
    locales: [
      { code: 'fr', language: 'fr-CI', name: 'Français' },
      { code: 'en', language: 'en', name: 'English' },
    ],
    // La langue choisie survit au rechargement. Le nom du cookie est préfixé
    // pour ne jamais entrer en collision sur la même origine.
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'kaya.langue',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'fr',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        // La couleur de la barre système suit le thème. Deux balises, une par
        // schéma : le navigateur choisit celle qui correspond, sans JavaScript.
        {
          name: 'theme-color',
          content: '#faf4e9',
          media: '(prefers-color-scheme: light)',
        },
        {
          name: 'theme-color',
          content: '#17120f',
          media: '(prefers-color-scheme: dark)',
        },
        // ⚠️ WebKit N'AFFICHE AUCUNE BANNIÈRE D'INSTALLATION. Ces deux balises
        // sont ce qui fait qu'une application ajoutée depuis le menu de partage
        // s'ouvre en plein écran plutôt que dans Safari (PWA-01, écran T046).
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Kaya' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: '/favicon-64.png' },
        { rel: 'apple-touch-icon', href: '/icone-192.png' },
      ],
      script: [{ innerHTML: SCRIPT_THEME, tagPosition: 'head', tagPriority: 'critical' }],
    },
  },

  // theme.css est la COPIE CONFORME de docs/design/theme.css — jamais éditée
  // ici. Il porte `@import "tailwindcss"`, donc il est le point d'entrée du
  // noyau Tailwind autant que celui des jetons.
  css: ['~/assets/css/theme.css', '~/assets/css/polices.css'],

  vite: {
    plugins: [
      tailwindcss(),
      // Nuxt lance DEUX constructions Vite — le client et le serveur nitro. Le
      // greffon n'a de sens que pour la première : appliqué à la seconde, il
      // écrirait un second service worker dans une sortie que personne ne sert.
      ...VitePWA({
        base: '/',
        scope: '/',
        // « prompt » : l'interface PROPOSE de recharger, elle ne le fait pas
        // d'office et ne se tait pas non plus (FR-017, livré à T047).
        registerType: 'prompt',
        // L'enregistrement est écrit dans app/core/coquille/, jamais injecté :
        // c'est là qu'on peut le raconter et le tester.
        injectRegister: null,
        manifest: {
          id: '/',
          name: 'Kaya',
          short_name: 'Kaya',
          description:
            "Gestion d'établissement — hébergement, restauration, bar, pressing.",
          lang: 'fr',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          // Les deux couleurs viennent des jetons : --color-ocre pour la marque,
          // --color-bg pour le fond de démarrage en clair.
          theme_color: '#a86f38',
          background_color: '#faf4e9',
          icons: [
            { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: '/icone-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,woff2,png,svg,ico,webmanifest}'],
          additionalManifestEntries: [
            // La coquille HTML : elle n'est pas un fichier de la construction
            // Vite, donc aucun ratissage ne la trouverait.
            { url: '/', revision: REVISION_COQUILLE },
            // Les icônes : elles vivent dans `public/`, que nitro recopie APRÈS
            // la construction Vite. Sans ces lignes, l'écran d'installation
            // hors ligne afficherait un carré vide.
            { url: '/icone-192.png', revision: REVISION_COQUILLE },
            { url: '/icone-512.png', revision: REVISION_COQUILLE },
            { url: '/icone-maskable-512.png', revision: REVISION_COQUILLE },
            { url: '/favicon-64.png', revision: REVISION_COQUILLE },
          ],
          navigateFallback: '/',
          cleanupOutdatedCaches: true,
          // Le service worker n'attend pas : c'est l'interface qui décide, et
          // elle le fait explicitement (T047).
          skipWaiting: false,
          clientsClaim: false,
        },
        devOptions: { enabled: false },
      }).map((greffon) => ({
        ...greffon,
        apply: (_config: unknown, environnement: { isSsrBuild?: boolean }) =>
          !environnement.isSsrBuild,
      })),
    ],
  },
})
