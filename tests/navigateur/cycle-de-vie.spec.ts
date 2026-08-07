import { expect, test, type Page } from '@playwright/test'

/**
 * US3 · UNE PAGE NOUVELLE NE PEUT PAS OUBLIER LE CYCLE DE VIE.
 *
 * ⚠️ CE TEST PASSE PAR LE ROUTEUR, JAMAIS PAR UN MONTAGE DE COMPOSANT. C'est
 * l'exigence, et elle a un motif : monter un composant contourne le routeur, la
 * suspension, les gabarits et les greffons — c'est-à-dire exactement les quatre
 * mécanismes que cette phase doit prouver. « Un test qui monte un composant ne
 * prouve pas qu'une page s'atteint » (constitution, principe 8).
 *
 * ⚠️ ET IL VISE UNE PAGE **VIDE**. Une page du produit aurait pu déclarer son
 * gabarit, importer un composable ou poser son thème : elle prouverait alors
 * qu'un développeur attentif obtient le résultat, pas qu'une page NOUVELLE
 * l'obtient sans y penser. La page témoin ne déclare RIEN, et elle n'existe que
 * sous `KAYA_PAGE_TEMOIN=1`.
 *
 * ⚠️ ET SI ELLE MANQUE, LES CAS ÉCHOUENT — ILS NE SE SAUTENT PAS. Un test
 * silencieusement absent est un test qu'on croit vert : c'est exactement le mode
 * de défaillance qu'un plancher de porte existe pour refuser.
 */

const CHEMIN_TEMOIN = '/_temoin-cycle-de-vie'
const CHEMIN_NAVIGATION = '/_temoin-navigation'

const FONDS = {
  light: 'rgb(250, 244, 233)', // --color-bg, bloc clair de theme.css
  dark: 'rgb(23, 18, 15)', // --color-bg, bloc .dark
} as const

/** Ouvre la page témoin et EXIGE qu'elle soit là. */
async function ouvrirLeTemoin(page: Page, chemin: string): Promise<void> {
  await page.goto(chemin, { waitUntil: 'networkidle' })
  await expect(
    page.locator(`[data-ecran="${chemin.slice(2)}"]`),
    `la page témoin ${chemin} est absente de cette construction — relancez le build avec KAYA_PAGE_TEMOIN=1`,
  ).toHaveCount(1)
}

for (const schema of ['light', 'dark'] as const) {
  const nom = schema === 'dark' ? 'sombre' : 'clair'

  test.describe(`thème ${nom}`, () => {
    test.use({ colorScheme: schema })

    test('une page VIDE hérite du gabarit, de la session et du thème', async ({ page }) => {
      await ouvrirLeTemoin(page, CHEMIN_TEMOIN)

      // 1 · Elle est rendue DANS le gabarit par défaut, qu'elle n'a pas demandé.
      await expect(page.locator('header [data-emplacement="etablissement"]')).toBeVisible()
      await expect(page.locator('header [data-emplacement="temoin"]')).toBeAttached()
      await expect(page.locator('header [data-emplacement="reglages"]')).toBeVisible()

      // 2 · UN SEUL <main> dans le document (FR-032).
      await expect(page.locator('main')).toHaveCount(1)

      // 3 · L'intergiciel a repris la session AVANT le rendu, dès la première
      //     navigation — et il l'a consigné.
      const decompte = Number(
        await page.evaluate(() => document.documentElement.dataset.repriseSession ?? '0'),
      )
      expect(decompte, "la session n'a pas été reprise à la première navigation").toBeGreaterThanOrEqual(1)
      await expect(page.locator('html')).toHaveAttribute('data-reprise-chemin', CHEMIN_TEMOIN)

      // 4 · La classe de thème est DÉJÀ posée, et le fond calculé est celui du
      //     jeton — pas une valeur par défaut du navigateur.
      await expect(page.locator('html')).toHaveAttribute('data-theme', nom)
      if (schema === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)

      const fond = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      expect(fond, 'le fond ne vaut pas le jeton --color-bg du thème demandé').toBe(FONDS[schema])
    })

    test('aucun éclair clair : le thème est posé AVANT le premier pixel', async ({ page }) => {
      // ⚠️ LE CONTRÔLE QUI COMPTE EST **STRUCTUREL**, ET IL A FALLU LE CONSTATER.
      // Une première version se contentait d'attendre que la classe apparaisse
      // et de vérifier que l'application n'était pas encore montée : déplacé en
      // fin de corps, le script passait ce test SANS BRONCHER. Il prouvait
      // seulement que le script s'exécute avant Vue — ce qui est vrai partout, y
      // compris trop tard.
      //
      // Ce qui décide de l'éclair, c'est la POSITION du script dans le document
      // servi : il doit précéder la première feuille de style, donc être exécuté
      // avant que le navigateur n'ait de quoi peindre le fond.
      const document_ = await (await page.request.get('/')).text()
      const iScript = document_.indexOf('kaya.theme')
      const iFinTete = document_.indexOf('</head>')
      const iPremiereFeuille = document_.search(/<link[^>]+rel="stylesheet"/)
      const iDemarrage = document_.search(/<script[^>]+type="module"/)

      expect(iScript, 'le script de thème est absent du document servi').toBeGreaterThan(-1)
      expect(
        iScript < iFinTete,
        'le script de thème est hors du <head> : le fond serait peint avant lui',
      ).toBe(true)
      expect(
        iPremiereFeuille === -1 || iScript < iPremiereFeuille,
        'le script de thème vient APRÈS la première feuille de style : un éclair clair est possible',
      ).toBe(true)
      expect(
        iDemarrage === -1 || iScript < iDemarrage,
        "le script de thème vient APRÈS le démarrage de l'application : un greffon aurait suffi, et il serait arrivé trop tard",
      ).toBe(true)

      // ⚠️ ET RIEN DE PLUS À L'EXÉCUTION. Une version antérieure vérifiait ici
      // que `<main>` n'existait pas encore, pour prouver qu'on observait bien le
      // premier instant : Chromium monte l'application plus vite que l'aller-
      // retour du test, donc l'assertion échouait AU HASARD. Une porte qui rougit
      // au hasard est désactivée sous trois semaines — et ce n'était pas elle qui
      // prouvait quoi que ce soit, c'est la position du script.
      await page.goto('/_ecrans', { waitUntil: 'commit' })
      await page.waitForFunction(
        () => document.documentElement.dataset.theme !== undefined,
        undefined,
        { timeout: 5000 },
      )
      const auPremierInstant = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        sombre: document.documentElement.classList.contains('dark'),
      }))
      expect(auPremierInstant.theme).toBe(nom)
      expect(auPremierInstant.sombre).toBe(schema === 'dark')
    })
  })
}

test("la racine du gabarit ne se démonte pas d'une page à l'autre", async ({ page }) => {
  // ⚠️ C'EST LA PROPRIÉTÉ LA PLUS COÛTEUSE À PERDRE. Le témoin de
  // synchronisation et le sélecteur d'établissement sont « présents partout » :
  // une racine démontée les ferait clignoter à chaque navigation, et un témoin
  // qui clignote cesse d'être lu.
  //
  // On MARQUE le nœud de la barre avant la navigation. S'il porte encore sa
  // marque après, c'est qu'il n'a pas été recréé — un décompte de rendus ne
  // dirait pas cela, puisqu'un nœud peut être re-rendu sans être remplacé.
  await ouvrirLeTemoin(page, CHEMIN_NAVIGATION)

  await page.evaluate(() =>
    document.querySelector('header')?.setAttribute('data-marque-de-survie', 'posee'),
  )
  const avant = Number(
    await page.evaluate(() => document.documentElement.dataset.repriseSession ?? '0'),
  )

  // Navigation INTERNE : un clic sur un lien, pas un `goto` qui rechargerait.
  await page.locator('[data-lien="temoin"]').click()
  await expect(page.locator('[data-ecran="temoin-cycle-de-vie"]')).toHaveCount(1)

  await expect(
    page.locator('header[data-marque-de-survie="posee"]'),
    'la barre a été recréée : le témoin et le sélecteur clignoteraient à chaque navigation',
  ).toHaveCount(1)

  // Et la session est reprise à CHAQUE navigation, pas seulement à la première.
  const apres = Number(
    await page.evaluate(() => document.documentElement.dataset.repriseSession ?? '0'),
  )
  expect(apres, "l'intergiciel ne s'est pas exécuté à la seconde navigation").toBeGreaterThan(avant)
  await expect(page.locator('html')).toHaveAttribute('data-reprise-chemin', CHEMIN_TEMOIN)
})
