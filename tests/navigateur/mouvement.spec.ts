import { expect, test, type Page } from '@playwright/test'

/**
 * US2 · LE MOUVEMENT — durées, courbes, zones, et la préférence de réduction.
 *
 * ⚠️ LE POINT QUI COMPTE LE PLUS EST « RÉDUIRE LES ANIMATIONS ». Tout devient
 * instantané, **rien ne casse, rien ne manque** — « aucun état n'est porté par
 * une animation » —, et **seul le retour tactile du bouton garde ses 90 ms**,
 * parce qu'il ne raconte rien : il confirme que le doigt a été vu.
 */

/**
 * Les quatre durées et les quatre courbes de `docs/design/tokens.md` §6.
 *
 * ⚠️ LES VALEURS SONT COMPARÉES APRÈS NORMALISATION, ET IL A FALLU LE
 * CONSTATER : les moteurs rendent « .16s » là où le jeton dit « 160ms », et
 * « cubic-bezier(.34, …) » là où il dit « cubic-bezier(0.34, …) ». Comparer les
 * chaînes brutes ferait échouer le test sur une convention d'écriture, ce qui
 * est le meilleur moyen de le voir désactiver.
 */
const DUREES_MS = { instantane: 90, rapide: 160, standard: 240, ample: 400 } as const

const COURBES = {
  entree: 'cubic-bezier(0,0,0.2,1)',
  sortie: 'cubic-bezier(0.4,0,1,1)',
  deplace: 'cubic-bezier(0.4,0,0.2,1)',
  elastique: 'cubic-bezier(0.34,1.56,0.64,1)',
} as const

/** « .34 » → « 0.34 », et les espaces retirés. */
function normaliserCourbe(valeur: string): string {
  return valeur.replace(/\s+/g, '').replace(/(^|[(,])\./g, '$10.')
}

/** « .45 » → « 0.45 ». Les moteurs élaguent le zéro de tête. */
function normaliserNombre(valeur: string): string {
  return String(Number.parseFloat(valeur))
}

/** « .16s » et « 160ms » → 160. */
function enMillisecondes(valeur: string): number {
  const nombre = Number.parseFloat(valeur)
  return valeur.trim().endsWith('ms') ? nombre : nombre * 1000
}

/** Lit une variable CSS résolue sur un élément. */
async function variable(page: Page, selecteur: string, nom: string): Promise<string> {
  return page
    .locator(selecteur)
    .first()
    .evaluate(
      (element, cle) => getComputedStyle(element).getPropertyValue(cle).trim(),
      nom,
    )
}

test.describe('le mouvement suit les jetons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/_guide-de-style', { waitUntil: 'networkidle' })
  })

  test('les quatre durées et les quatre courbes viennent des jetons', async ({ page }) => {
    for (const [nom, attendue] of Object.entries(DUREES_MS)) {
      const brute = await variable(page, ':root', `--duree-${nom}`)
      expect(enMillisecondes(brute), `--duree-${nom} = ${brute}`).toBe(attendue)
    }
    for (const [nom, valeur] of Object.entries(COURBES)) {
      const brute = await variable(page, ':root', `--ease-${nom}`)
      expect(normaliserCourbe(brute), `--ease-${nom} = ${brute}`).toBe(valeur)
    }
  })

  test('le retour tactile du bouton dure exactement 90 ms', async ({ page }) => {
    const bouton = page.locator('[data-composant="01"] button[data-mouvement="tactile"]').first()
    const duree = await bouton.evaluate((e) => getComputedStyle(e).transitionDuration)
    expect(enMillisecondes(duree.split(',')[0]!)).toBe(DUREES_MS.instantane)
  })

  test("n'anime aucune propriété de MISE EN PAGE — sauf la barre, dont la largeur EST la donnée", async ({
    page,
  }) => {
    // ⚠️ ANIMER `height`, `top` ou `margin` force un recalcul de mise en page à
    // chaque image : le budget est de 60 images/s sur 2 Go de RAM. La liste est
    // celle des propriétés qui déclenchent une remise en page, pas une liste
    // blanche de ce qui est permis — une liste blanche refuserait `fill` et
    // `outline-color`, que la transition de couleur de Tailwind emporte avec
    // elle et qui ne coûtent rien.
    const MISE_EN_PAGE = [
      'height',
      'top',
      'bottom',
      'left',
      'right',
      'margin',
      'padding',
      'font-size',
      'line-height',
      'flex-basis',
    ]
    const trouvees = await page.evaluate(() => {
      const proprietes = new Set<string>()
      for (const element of document.querySelectorAll('[data-composant] *')) {
        const style = getComputedStyle(element)
        if (style.transitionDuration === '0s') continue
        for (const p of style.transitionProperty.split(',').map((s) => s.trim())) {
          if (p && p !== 'none') proprietes.add(p)
        }
      }
      return [...proprietes]
    })
    const interdites = trouvees.filter((p) => MISE_EN_PAGE.some((m) => p.startsWith(m)))
    expect(interdites, `propriétés de mise en page animées : ${interdites.join(', ')}`).toEqual([])
    expect(
      trouvees.length,
      "aucune transition trouvée : le contrôle n'inspecterait rien",
    ).toBeGreaterThan(0)

    // ⚠️ TOUTE LARGEUR ANIMÉE DOIT ÊTRE DÉCLARÉE. Il y en a deux dans le
    // produit — la barre de proportion et le rebours du bandeau d'annulation —
    // et dans les deux cas la largeur EST la donnée. Ce qu'on refuse, c'est
    // qu'une troisième arrive sans que personne l'ait décidé.
    const nonDeclarees = await page.evaluate(() =>
      [...document.querySelectorAll('[data-composant] *')]
        .filter((element) => {
          const style = getComputedStyle(element)
          return style.transitionDuration !== '0s' && style.transitionProperty.includes('width')
        })
        .filter((element) => !element.hasAttribute('data-mouvement'))
        .map((element) => element.className),
    )
    expect(
      nonDeclarees,
      `largeurs animées sans déclaration de mouvement : ${nonDeclarees.join(' · ')}`,
    ).toEqual([])
  })

  test('six éléments animés SIMULTANÉMENT au maximum, DANS LA FENÊTRE', async ({ page }) => {
    // ⚠️ « SIMULTANÉMENT » SE COMPTE DANS LA FENÊTRE, ET LE GUIDE L'A IMPOSÉ.
    // Le document entier en porte vingt — mais c'est un CATALOGUE : il montre
    // les seize composants dans tous leurs états, ce qu'aucun écran du produit
    // ne fait. Ce que la règle protège, c'est le budget d'images par seconde,
    // qui ne dépend que de ce que le compositeur dessine — donc de ce qui est
    // visible. Compter le document entier aurait rendu la règle inapplicable au
    // guide, et on l'aurait désactivée.
    const animesVisibles = await page.evaluate(() => {
      const hauteurFenetre = window.innerHeight
      return [...document.querySelectorAll('*')].filter((element) => {
        const style = getComputedStyle(element)
        if (style.animationName === 'none' || style.animationPlayState !== 'running') return false
        const boite = element.getBoundingClientRect()
        return boite.bottom > 0 && boite.top < hauteurFenetre && boite.width > 0
      }).length
    })
    expect(animesVisibles, `${animesVisibles} éléments animés visibles en même temps`).toBeLessThanOrEqual(6)
  })

  test('la ZONE se pose sur le conteneur d’écran, jamais sur un composant', async ({ page }) => {
    const porteurs = await page.evaluate(() =>
      [...document.querySelectorAll('[data-zone]')].map((e) => e.getAttribute('data-ecran') ?? '?'),
    )
    // Un seul porteur, et c'est l'écran.
    expect(porteurs).toEqual(['guide-de-style'])
  })

  test('en zone de VITESSE, l’intensité tombe à 0,45 et l’élastique devient un déplacement', async ({
    page,
  }) => {
    const ecran = '[data-ecran="guide-de-style"]'
    expect(await variable(page, ecran, '--intensite')).toBe('1')
    expect(normaliserCourbe(await variable(page, ecran, '--ease-elastique'))).toBe(COURBES.elastique)
    expect(enMillisecondes(await variable(page, ecran, '--decalage-liste'))).toBe(28)

    await page.locator('[data-reglage="zone"] button').nth(1).click()

    expect(normaliserNombre(await variable(page, ecran, '--intensite'))).toBe('0.45')
    // L'élastique DEVIENT un déplacement : aucun dépassement au comptoir.
    expect(normaliserCourbe(await variable(page, ecran, '--ease-elastique'))).toBe(COURBES.deplace)
    // Et le décalage de liste disparaît : tout arrive ensemble.
    expect(enMillisecondes(await variable(page, ecran, '--decalage-liste'))).toBe(0)
  })
})

test.describe('avec « réduire les animations »', () => {
  test('tout devient instantané, RIEN NE MANQUE, et le retour tactile garde ses 90 ms', async ({
    page,
  }) => {
    // ⚠️ LA PRÉFÉRENCE EST POSÉE PAR page.emulateMedia, ET NON PAR test.use.
    // Constaté en l'éprouvant : sous `test.use({ reducedMotion })` au niveau du
    // describe, le navigateur ne signalait PAS la préférence — le test aurait
    // passé au vert sur un régime qu'il n'éprouvait pas. C'est exactement le
    // mode de défaillance qu'un plancher de porte existe pour refuser, et la
    // ligne 0 ci-dessous en tient lieu.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/_guide-de-style', { waitUntil: 'networkidle' })

    // 0 · La préférence est bien appliquée par le navigateur. Sans ce constat,
    //     un échec plus bas accuserait le produit d'un défaut qui serait celui
    //     du harnais.
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      "le navigateur ne signale pas la préférence : le test n'éprouve rien",
    ).toBe(true)

    // 1 · L'intensité tombe à zéro.
    expect(normaliserNombre(await variable(page, ':root', '--intensite'))).toBe('0')
    expect(enMillisecondes(await variable(page, ':root', '--decalage-liste'))).toBe(0)

    // 2 · RIEN NE MANQUE. Les seize sections sont là, et tout ce qui portait un
    //     état le porte encore : « aucun état n'est porté par une animation ».
    await expect(page.locator('[data-composant]')).toHaveCount(16)
    await expect(page.locator('[data-composant="04"] [data-forme]')).toHaveCount(8)
    await expect(page.locator('[data-composant="13"] [data-squelette]')).toHaveCount(3)

    // 3 · SEUL le retour tactile garde ses 90 ms.
    const bouton = page.locator('[data-composant="01"] button[data-mouvement="tactile"]').first()
    expect(
      enMillisecondes(
        (await bouton.evaluate((e) => getComputedStyle(e).transitionDuration)).split(',')[0]!,
      ),
      'le retour tactile a été réduit : il ne raconte rien, il confirme que le doigt a été vu',
    ).toBe(DUREES_MS.instantane)

    // 4 · Et tout le reste EST réduit. On prend un élément qui n'a pas déclaré
    //     de mouvement tactile : sa transition est coupée.
    const ligne = page.locator('[data-composant="08"] [data-etat]').first()
    const duree = await ligne.evaluate((e) => getComputedStyle(e).transitionDuration)
    expect(Number.parseFloat(duree)).toBeLessThan(0.02)
  })
})
