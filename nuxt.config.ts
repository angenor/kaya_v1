import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
 * L'INVENTAIRE DES ROUTES, ÉCRIT PAR LA CONSTRUCTION — c'est ce que la porte
 * P-04 lit, et **jamais une liste tenue à la main**.
 *
 * ⚠️ UNE LISTE ÉCRITE À LA MAIN PEUT ÊTRE VIDÉE PAR ACCIDENT, et la porte
 * inspecterait alors zéro route en restant verte. Celle-ci vient du routeur
 * résolu : elle grandit toute seule avec l'application, et le seul cas qu'elle
 * ne couvre pas — un routeur vide — est exactement ce que le plancher attrape.
 *
 * ⚠️ ET ELLE EST ÉCRITE AU CROCHET `pages:resolved`, JAMAIS À `pages:extend`.
 * `pages:extend` est appelé une fois par contributeur — nuxt lui-même, puis
 * chaque module —, donc l'écrire là rendrait un inventaire partiel dont on ne
 * saurait pas qu'il l'est. `pages:resolved` est appelé UNE FOIS, après tout le
 * monde.
 */
const INVENTAIRE_ROUTES = fileURLToPath(new URL('./.rapports/routes-du-build.json', import.meta.url))

interface PageDuRouteur {
  path: string
  children?: PageDuRouteur[]
}

/** Aplatit l'arbre du routeur en chemins absolus. */
function cheminsResolus(pages: readonly PageDuRouteur[], prefixe = ''): string[] {
  const chemins: string[] = []
  for (const page of pages) {
    const chemin = page.path.startsWith('/')
      ? page.path
      : `${prefixe.replace(/\/$/, '')}/${page.path}`
    chemins.push(chemin)
    if (page.children?.length) chemins.push(...cheminsResolus(page.children, chemin))
  }
  return chemins
}

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
   *
   * ⚠️ ET LE MOMENT DU TRANSPORT COMPTE AUTANT QUE LE TRANSPORT LUI-MÊME.
   * Constaté en servant le build : posés APRÈS la compilation de nitro, les
   * trois fichiers existaient sur le disque et le serveur répondait quand même
   * `text/html` — parce que l'inventaire des actifs publics est figé pendant la
   * compilation. Le navigateur refusait alors le service worker en disant
   * « unsupported MIME type », et l'application ne s'ouvrait pas hors ligne.
   * `nitro:build:public-assets` s'exécute AVANT cet inventaire : les fichiers y
   * entrent, et sont servis avec leur type.
   */
  hooks: {
    /**
     * LA PAGE TÉMOIN DU CYCLE DE VIE — déclarée ici, jamais dans le produit.
     *
     * ⚠️ ELLE N'ENTRE AU ROUTEUR QUE SOUS `KAYA_PAGE_TEMOIN=1`. Une construction
     * ordinaire ne la connaît pas : son fichier vit sous `tests/`, et rien de
     * `app/` ne le référence. C'est ce qui permet à US3 de prouver qu'une page
     * NOUVELLE hérite du gabarit, de l'intergiciel et du thème sans rien écrire
     * — une page du produit aurait pu, elle, avoir opté pour tout cela.
     *
     * ⚠️ ET LE DRAPEAU EST LU UNE SEULE FOIS, PAR UNE SEULE CONSTRUCTION.
     * `app/core/ecrans/index.ts` lit le MÊME drapeau pour déclarer l'entrée
     * correspondante : les deux côtés de la porte P-04 ne peuvent donc pas
     * diverger, quel que soit l'état du drapeau.
     */
    'pages:extend'(pages) {
      if (process.env.KAYA_PAGE_TEMOIN !== '1') return
      pages.push(
        {
          name: 'temoin-cycle-de-vie',
          path: '/_temoin-cycle-de-vie',
          file: fileURLToPath(new URL('./tests/navigateur/temoin/PageTemoin.vue', import.meta.url)),
        },
        {
          // Le point de départ d'une navigation INTERNE : `page.goto` recharge
          // toujours le document, donc il ne prouverait que la reconstruction
          // du gabarit à l'identique — pas sa survie.
          name: 'temoin-navigation',
          path: '/_temoin-navigation',
          file: fileURLToPath(
            new URL('./tests/navigateur/temoin/PageNavigation.vue', import.meta.url),
          ),
        },
      )
    },

    /**
     * L'INVENTAIRE DES ROUTES — écrit une fois, quand plus personne n'ajoute
     * de page. C'est le PÉRIMÈTRE de la porte P-04 (contrat §1).
     */
    'pages:resolved'(pages) {
      const routes = [...new Set(cheminsResolus(pages as PageDuRouteur[]))].sort()
      mkdirSync(dirname(INVENTAIRE_ROUTES), { recursive: true })
      writeFileSync(
        INVENTAIRE_ROUTES,
        `${JSON.stringify({ pageTemoin: process.env.KAYA_PAGE_TEMOIN === '1', routes }, null, 2)}\n`,
        'utf8',
      )
      console.info(`[inventaire des routes] ${routes.length} route(s) → ${INVENTAIRE_ROUTES}`)
    },

    'nitro:build:public-assets'(nitro) {
      const source = join(nitro.options.buildDir, 'dist/client')
      const cible = nitro.options.output.publicDir
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
    // ⚠️ AUCUNE DÉTECTION DE LA LANGUE DU NAVIGATEUR, et c'est une décision.
    // Constaté en ouvrant l'application dans un navigateur réglé en anglais :
    // elle démarrait en anglais, alors que « fr par défaut » est une exigence du
    // principe 8. La détection rendait aussi la porte P-04 non déterministe —
    // deux moteurs, deux langues système, deux rendus.
    // La langue choisie est persistée comme le thème, dans les préférences de
    // L'APPAREIL, et appliquée par un greffon avant le premier rendu.
    detectBrowserLanguage: false,
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
  css: ['~/assets/css/theme.css', '~/assets/css/polices.css', '~/assets/css/mouvement.css'],

  vite: {
    /**
     * ⚠️ `KAYA_` ENTRE DANS `import.meta.env`, ET C'EST CE QUI EMPÊCHE LES DEUX
     * CÔTÉS DE P-04 DE DIVERGER. Sans ce préfixe, Vite n'expose que `VITE_*` :
     * `app/core/ecrans/index.ts` lirait donc TOUJOURS `undefined` et
     * n'inscrirait jamais les pages témoin, pendant que le routeur, lui, les
     * servirait. La porte rougirait sur deux routes non déclarées — et elle
     * aurait raison, ce qui est le pire cas : un vrai défaut, à la mauvaise
     * adresse.
     */
    envPrefix: ['VITE_', 'KAYA_'],
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
