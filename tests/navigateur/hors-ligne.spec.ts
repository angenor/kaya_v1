import { expect, test, type BrowserContext, type Page } from '@playwright/test'

import { entrer } from './outils/entrer'

/**
 * US1 · **L'APPLICATION S'OUVRE HORS LIGNE, DÈS LE PREMIER ÉCRAN** — et les deux
 * autres propriétés de la coquille : l'installation et la version nouvelle.
 *
 * ⚠️ C'EST LA PROPRIÉTÉ LA PLUS DIFFICILE À RÉTROFITTER, et celle dont l'absence
 * ne se voit qu'au pire moment : sur le terrain, réseau coupé, devant un client.
 * Aucun test d'unité ne l'aurait vue — le service worker était servi en
 * `text/html` pendant une demi-journée de ce cycle, avec ses trois fichiers bien
 * présents sur le disque.
 *
 * ⚠️ ET LA COUPURE EST RÉELLE, PAS UN LEVIER. Le levier « hors ligne » du
 * panneau Scénarios met la couche de simulation en refus ; il ne coupe rien. Ici,
 * c'est le contexte du navigateur qui passe hors ligne : si le précache manque,
 * la page d'erreur du navigateur s'affiche, et c'est exactement ce qu'on refuse.
 */

/** Attend que le service worker CONTRÔLE la page, pas seulement qu'il existe. */
async function attendreLaCoquille(page: Page): Promise<void> {
  // ⚠️ `ready` NE SUFFIT PAS, ET LA NUANCE EST CELLE QUI COMPTE. Le service
  // worker est en `clientsClaim: false` : il n'adopte pas la page qui l'a
  // enregistré. Tant qu'aucun contrôleur n'est en place, RIEN n'est servi depuis
  // le cache — un test qui s'arrêterait à `ready` passerait au vert sur une
  // application qui ne s'ouvre pas hors ligne.
  await page.waitForFunction(
    async () => {
      if (!('serviceWorker' in navigator)) return false
      const enregistrement = await navigator.serviceWorker.ready
      return Boolean(enregistrement.active)
    },
    undefined,
    { timeout: 30_000 },
  )
  // Un rechargement, et le contrôleur prend la page.
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), undefined, {
    timeout: 30_000,
  })
}

/**
 * COUPE LE RÉSEAU **EN REFUSANT CHAQUE REQUÊTE**, et non par l'émulation du
 * navigateur.
 *
 * ⚠️ `context.setOffline()` NE MARCHE PAS SUR WEBKIT, ET LE CONSTAT EST NET :
 * le rechargement lève « WebKit encountered an internal error » avant même
 * d'atteindre le service worker. Ce n'est pas un défaut du produit — c'est une
 * limite de l'émulation, et la contourner n'affaiblit rien : **refuser chaque
 * requête est plus proche de la coupure réelle que de dire au navigateur qu'il
 * est hors ligne.** Ce qui atteint le réseau échoue ; ce que le service worker
 * sert depuis son cache ne passe pas par là, et c'est exactement la propriété
 * qu'on veut prouver.
 */
async function couperLeReseau(context: BrowserContext): Promise<void> {
  await context.route('**/*', (route) => route.abort('internetdisconnected'))
}

async function retablirLeReseau(context: BrowserContext): Promise<void> {
  await context.unroute('**/*')
}

/**
 * ⚠️ **CE QUE PLAYWRIGHT NE SAIT PAS FAIRE SUR WEBKIT, ET QUI EST ÉCRIT ICI
 * PLUTÔT QUE CONTOURNÉ EN SILENCE.** Ni `context.setOffline()` ni l'interception
 * de requêtes ne laissent une NAVIGATION atteindre le service worker : le
 * premier lève « WebKit encountered an internal error », la seconde répond
 * « Blocked by Web Inspector » — dans les deux cas **avant** que le service
 * worker ne voie la requête. Ce n'est pas le produit qui échoue, c'est
 * l'outillage qui n'observe pas.
 *
 * Ce qui est donc prouvé, et par quel moyen :
 *   — **sur Chromium** : la coupure est réelle, la navigation aussi, et
 *     l'application s'ouvre. Preuve de bout en bout.
 *   — **sur les DEUX moteurs** : le service worker s'enregistre en portée `/`,
 *     contrôle la page, et **son précache porte le document et les icônes**.
 *
 * Ce qui reste NON PROUVÉ sur WebKit : que le moteur remette bien la navigation
 * à son service worker quand le réseau tombe. C'est le contrat de WebKit, pas le
 * nôtre — mais l'écrire vaut mieux que le supposer, et le rapport de cycle le
 * reprend.
 */
const COUPURE_OBSERVABLE = 'chromium'

test.describe('la coquille hors ligne', () => {
  test("réseau coupé, l'application s'ouvre — jamais la page d'erreur du navigateur", async ({
    page,
    context,
  }) => {
    test.skip(
      test.info().project.name !== COUPURE_OBSERVABLE,
      'Playwright ne laisse pas une navigation hors ligne atteindre le service worker sur WebKit',
    )
    // ⚠️ DEPUIS F2, LA RACINE EST `R1` ET EXIGE UNE SESSION : sans elle, on
    // atterrirait sur `R0`, ce qui ne dit rien de la coquille. La suite de la
    // coquille inspecte le SERVICE WORKER, pas l'écran — et l'un comme l'autre
    // s'installent sur n'importe quelle route servie.
    await entrer(page, undefined, '/')
    await attendreLaCoquille(page)

    await couperLeReseau(context)
    try {
      await page.reload({ waitUntil: 'domcontentloaded' })

      // La première page rend, avec son gabarit — pas une coquille vide.
      await expect(
        page.locator('[data-ecran]'),
        "hors ligne, l'application n'a pas rendu son premier écran",
      ).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('header [data-emplacement="etablissement"]')).toBeVisible()

      // ⚠️ ET LE THÈME EST POSÉ, HORS LIGNE AUSSI. Le script du `<head>` fait
      // partie du document précaché : s'il manquait, le démarrage hors ligne
      // présenterait le fond clair avant tout le reste (FR-009, SC-003).
      await expect(page.locator('html')).toHaveAttribute('data-theme', /clair|sombre/)
    } finally {
      await retablirLeReseau(context)
    }
  })

  test('une route interne s’ouvre hors ligne, par le repli de navigation', async ({
    page,
    context,
  }) => {
    // ⚠️ CELUI-CI EST LE CAS RÉEL : on ne rouvre pas l'application sur `/`, on la
    // rouvre là où on l'avait laissée. Sans `navigateFallback`, le service worker
    // ne saurait pas quoi servir pour une route qu'aucun fichier ne porte — la
    // SPA n'a qu'un document.
    test.skip(
      test.info().project.name !== COUPURE_OBSERVABLE,
      'même limite d’outillage : la navigation n’atteint pas le service worker sur WebKit',
    )
    // ⚠️ DEPUIS F2, LA RACINE EST `R1` ET EXIGE UNE SESSION : sans elle, on
    // atterrirait sur `R0`, ce qui ne dit rien de la coquille. La suite de la
    // coquille inspecte le SERVICE WORKER, pas l'écran — et l'un comme l'autre
    // s'installent sur n'importe quelle route servie.
    await entrer(page, undefined, '/')
    await attendreLaCoquille(page)

    await couperLeReseau(context)
    try {
      await page.goto('/_guide-de-style', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[data-ecran="guide-de-style"]')).toBeVisible()
    } finally {
      await retablirLeReseau(context)
    }
  })

  test('SUR LES DEUX MOTEURS · le précache porte le document et les icônes', async ({ page }) => {
    // ⚠️ C'EST CE QUI RESTE OBSERVABLE PARTOUT, ET CE N'EST PAS UN LOT DE
    // CONSOLATION. La coquille HTML n'est pas un fichier de la construction
    // Vite — elle est rendue par nitro —, donc **aucun ratissage de fichiers ne
    // la trouverait** : c'est une entrée ajoutée à la main au manifeste de
    // précache. Si cette ligne disparaissait, le service worker précacherait le
    // JavaScript et le CSS d'une page qu'il ne saurait pas servir, et rien
    // d'autre ne le dirait.
    // ⚠️ DEPUIS F2, LA RACINE EST `R1` ET EXIGE UNE SESSION : sans elle, on
    // atterrirait sur `R0`, ce qui ne dit rien de la coquille. La suite de la
    // coquille inspecte le SERVICE WORKER, pas l'écran — et l'un comme l'autre
    // s'installent sur n'importe quelle route servie.
    await entrer(page, undefined, '/')
    await attendreLaCoquille(page)

    const precache = await page.evaluate(async () => {
      const chemins: string[] = []
      for (const nom of await caches.keys()) {
        const cache = await caches.open(nom)
        for (const requete of await cache.keys()) chemins.push(new URL(requete.url).pathname)
      }
      return chemins
    })

    expect(precache.length, 'le précache est VIDE : rien ne serait servi hors ligne').toBeGreaterThan(0)
    for (const attendu of ['/', '/icone-192.png', '/icone-512.png', '/favicon-64.png']) {
      expect(precache, `« ${attendu} » n'est pas au précache`).toContain(attendu)
    }

    // Et ce qui est précaché sous `/` est bien LE DOCUMENT, avec son script de
    // thème — pas une réponse vide qu'on aurait mise là pour faire nombre.
    // ⚠️ `ignoreSearch` EST OBLIGATOIRE ICI, et c'est un constat. Workbox range
    // ses entrées sous une clé versionnée — `/?__WB_REVISION__=f1` —, donc une
    // recherche exacte sur `/` ne trouve RIEN et l'on conclurait à un précache
    // vide sur un précache parfaitement rempli.
    const document_ = await page.evaluate(async () => {
      const reponse = await caches.match('/', { ignoreSearch: true })
      return reponse ? await reponse.text() : ''
    })
    expect(document_, 'le document précaché est vide').not.toBe('')
    expect(
      document_.includes('kaya.theme'),
      "le document précaché ne porte pas le script de thème : l'ouverture hors ligne présenterait un éclair clair",
    ).toBe(true)

    // La portée est `/`, sans quoi le service worker ne contrôle aucune
    // navigation — c'est ce qui a failli être perdu quand les trois fichiers
    // restaient sous `/_nuxt/`.
    const portee = await page.evaluate(async () => {
      const enregistrement = await navigator.serviceWorker.getRegistration('/')
      return enregistrement ? new URL(enregistrement.scope).pathname : null
    })
    expect(portee, 'le service worker ne contrôle pas la racine').toBe('/')
  })
})

test.describe('le parcours d’installation', () => {
  test('quand le moteur propose son invitation, le bandeau la relaie', async ({ page }) => {
    // ⚠️ L'ÉVÉNEMENT EST FABRIQUÉ **DEPUIS LA PAGE**, et le produit ne porte
    // aucune porte dérobée pour cela. `beforeinstallprompt` n'est émis par
    // Chromium que sur un manifeste et une origine qu'il juge installables, et
    // JAMAIS deux fois : l'attendre rendrait le test non déterministe. Ce qu'on
    // vérifie ici, c'est la RÉPONSE du produit à l'événement — pas que Chromium
    // l'émette, ce qui n'est pas notre affaire.
    test.skip(test.info().project.name !== 'chromium', 'WebKit n’émet jamais cet événement')

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      const evenement = new Event('beforeinstallprompt') as Event & {
        prompt?: () => Promise<void>
        userChoice?: Promise<{ outcome: string }>
      }
      evenement.prompt = async () => {}
      Object.defineProperty(evenement, 'userChoice', {
        value: Promise.resolve({ outcome: 'accepted' }),
      })
      window.dispatchEvent(evenement)
    })

    const bandeau = page.locator('[data-bandeau-coquille="INVITE"]')
    await expect(bandeau).toBeVisible()
    await expect(bandeau).toContainText('installée')
    // L'action existe, et elle est une CIBLE : le parcours est guidé, pas subi.
    await expect(bandeau.getByRole('button')).toBeVisible()
  })

  test('sur WebKit, l’écran EXPLIQUE le menu de partage et dit ce qu’on perd', async ({
    page,
  }) => {
    // ⚠️ SUR WEBKIT, AUCUNE BANNIÈRE NE SE DÉCLENCHERA JAMAIS. Ce n'est pas
    // « pas encore » : `beforeinstallprompt` n'existe sur aucun navigateur d'iOS,
    // parce qu'iOS impose WebKit à tous. Attendre l'événement reviendrait à ne
    // rien proposer du tout — c'est-à-dire à laisser l'appareil sans alertes sans
    // que personne sache pourquoi (PWA-01, FR-015).
    test.skip(test.info().project.name !== 'webkit', 'ce cas est celui de WebKit')

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    const bandeau = page.locator('[data-bandeau-coquille="MENU_DE_PARTAGE"]')
    await expect(bandeau).toBeVisible()
    await expect(bandeau).toContainText('partage')
    await expect(bandeau).toContainText('alertes')

    // Elle se range pour de bon : un bandeau permanent cesse d'être lu.
    await bandeau.getByRole('button').click()
    await expect(bandeau).toBeHidden()
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('[data-bandeau-coquille="MENU_DE_PARTAGE"]')).toHaveCount(0)
  })
})

test.describe('l’invite de nouvelle version', () => {
  test('elle PROPOSE de recharger — ni rechargement d’office, ni silence', async ({ page }) => {
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await expect(page.locator('[data-bandeau-coquille="version"]')).toHaveCount(0)

    // Le septième levier du panneau : sans lui, FR-017 ne s'exercerait sur aucun
    // moteur — une version nouvelle n'arrive qu'après un déploiement.
    await page.locator('[data-levier="version-nouvelle"] [role="radio"]').nth(1).click()

    const bandeau = page.locator('[data-bandeau-coquille="version"]')
    await expect(bandeau).toBeVisible()
    await expect(bandeau).toContainText(/version nouvelle|new version/i)
    // L'action est explicite : l'interface propose, elle ne décide pas.
    await expect(bandeau.getByRole('button')).toBeVisible()

    // ⚠️ ET ELLE PRIME SUR L'INVITATION À INSTALLER — jamais deux bandeaux
    // empilés. Le plus grave gagne : un correctif qui ne part pas coûte plus
    // cher qu'une installation remise à demain.
    await expect(page.locator('[data-bandeau-coquille]')).toHaveCount(1)
  })
})
