import { expect, test, type Page } from '@playwright/test'

import { entreesConstruites } from '../../app/core/ecrans/index'
import { exigeUneSession, porteLEnTete } from '../../app/core/session/routesPubliques'

import { entrer } from './outils/entrer'
import {
  contrasteDe,
  exigerAucunNomDetatInterne,
  JETONS,
  mesurerCibles,
  mesurerTextes,
  nomDuTheme,
  PLANCHER_TACTILE,
  seuilAA,
  styleCalcule,
} from './outils/mesures'

/**
 * **C4 DE LA PORTE P-04** — chaque écran construit rend, dans les deux thèmes,
 * sur les deux moteurs.
 *
 * ⚠️ LA LISTE DES ÉCRANS VIENT DE `app/core/ecrans/index.ts`, LA MÊME SOURCE QUE
 * LA PAGE ET QUE LA PORTE. Une liste écrite ici serait une troisième liste, et
 * c'est la troisième qui aurait tort — en silence, parce qu'un test qui inspecte
 * moins d'écrans qu'il n'en existe reste vert.
 *
 * ⚠️ ET SEUL L'ÉTAT `CONSTRUIT` EST EXIGIBLE. L'index porte 46 écrans du produit
 * dont 43 « pas commencé » : exiger l'atteignabilité de toutes les entrées
 * rendrait cette suite rouge dès son premier jour, et on la désactiverait sous
 * trois semaines. La borne est le point du contrat, pas une commodité.
 *
 * Ce que chaque passage vérifie — contrat §2, C4 :
 *   la page REND (le gabarit, UN SEUL `<main>`) · le THÈME est appliqué et le
 *   fond calculé est celui du jeton · les VALEURS DE JETONS (fond, hauteur,
 *   rayon, corps) · le CONTRASTE AA · la CONSOLE · le TÉMOIN, dont les trois
 *   noms d'état internes ne franchissent pas le HTML.
 */

const CONSTRUITS = entreesConstruites()

/** Les rayons de `tokens.md` §4, plus `0px` pour ce qui n'en porte aucun. */
const RAYONS_JETON = new Set(['0px', '4px', '6px', '8px', '10px', '12px', '14px', '999px'])

/** Les corps de `tokens.md` §2, dans l'ordre du tableau. */
const CORPS_JETON = new Set([
  '11px', '12.5px', '13.5px', '14.5px', '15px', '17px', '20px',
  '24px', '30px', '32px', '34px', '40px', '44px', '46px', '54px', '68px', '88px',
])

/**
 * LES DEUX EXEMPTIONS DU PLANCHER TACTILE — écrites dans le MÊME tableau que la
 * règle (`tokens.md` §3), donc **contrôlées et non tolérées** : une cible
 * exemptée porte soit la hauteur exacte que le tableau lui prête, soit le
 * plancher — jamais une troisième valeur inventée.
 *
 * ⚠️ « SOIT LE PLANCHER » N'EST PAS UNE INDULGENCE, ET LE CONSTAT L'A IMPOSÉ.
 * Le bouton discret **en icône seule** passe à 44 px : `composants.md` §03 le
 * dit, et `tokens.md` §3 aussi — *« plancher tactile, jamais moins, Y COMPRIS
 * POUR UNE ICÔNE SEULE »*. Exiger 36 px sans réserve aurait fait rougir
 * l'accroche du panneau Scénarios, qui est présente sur **chaque** écran, pour
 * un défaut qui n'en est pas un.
 */
const EXEMPTIONS = [
  { selecteur: '[role="radiogroup"]', hauteur: JETONS.hauteur.segment, nom: 'segment' },
  { selecteur: '[data-composant-03]', hauteur: JETONS.hauteur.discret, nom: 'bouton discret' },
] as const

/** Ce que la console a le droit de dire : rien. */
function guetterLaConsole(page: Page): string[] {
  const erreurs: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') erreurs.push(message.text())
  })
  page.on('pageerror', (erreur) => erreurs.push(String(erreur)))
  return erreurs
}

test('PLANCHER · l’index déclare au moins un écran construit', () => {
  // ⚠️ LE PLANCHER EST DÉRIVÉ DE L'INDEX, JAMAIS UNE CONSTANTE. Un index vidé
  // par accident ferait passer une matrice à plancher constant ; celui-ci tombe
  // à zéro EN MÊME TEMPS que sa cible, et c'est exactement ce qu'on veut voir.
  expect(
    CONSTRUITS.length,
    "aucun écran construit à l'index : la matrice n'inspecterait rien et resterait verte",
  ).toBeGreaterThan(0)
})

test('les DEUX mesures de contraste rendent le MÊME nombre', async ({ page }) => {
  // ⚠️ IL Y A DEUX IMPLÉMENTATIONS DU RAPPORT DE CONTRASTE, ET C'EST INÉVITABLE :
  // celle qui s'exécute dans le test et celle qui part dans la page, sérialisée,
  // sans pouvoir capturer quoi que ce soit de la portée du test. **Deux copies
  // qui divergent, c'est un contrôle qui ment sans rien casser.** Ce test les
  // confronte sur un élément réel, dans le navigateur réel.
  await page.goto('/_guide-de-style', { waitUntil: 'networkidle' })

  const cible = page.locator('[data-composant="01"] button').first()
  const parLeTest = await contrasteDe(page, cible)
  const texteCible = (await cible.innerText()).trim().slice(0, 32)

  const enPage = await mesurerTextes(page, '[data-composant="01"] button')
  const correspondant = enPage.find((m) => m.texte === texteCible)

  expect(correspondant, `« ${texteCible} » n'a pas été mesuré en page`).toBeDefined()
  expect(
    correspondant!.rapport,
    'les deux implémentations du contraste ont divergé — le contrôle mentirait sans rien casser',
  ).toBeCloseTo(parLeTest, 6)
  expect(
    correspondant!.corps,
    'le corps lu en page diffère de celui lu par le test',
  ).toBeCloseTo(Number.parseFloat(await styleCalcule(cible, 'font-size')), 6)
})

for (const schema of ['light', 'dark'] as const) {
  const nom = nomDuTheme(schema)

  test.describe(`écrans construits · thème ${nom}`, () => {
    test.use({ colorScheme: schema })

    for (const entree of CONSTRUITS) {
      const route = entree.route!

      /**
       * ⚠️ L'EN-TÊTE N'EST DÛ QU'AUX ÉCRANS ATTEINTS **AVEC UNE SESSION**, et
       * la liste vient de l'intergiciel lui-même — jamais d'une seconde liste
       * tenue ici. C'est l'énoncé littéral de FR-025, et la restriction est ce
       * qui rend FR-009 possible : `R0` est un écran du produit, et avant
       * l'entrée il n'y a ni établissement, ni poste, ni personne à afficher.
       * Un « tous » sans réserve rendrait les deux exigences contradictoires,
       * et c'est la plus faible qui aurait cédé — en silence.
       */
      const avecEnTete = porteLEnTete(route)

      test(`${route} · rend, pose son thème, tient ses jetons et son contraste`, async ({
        page,
      }) => {
        const erreursConsole = guetterLaConsole(page)
        // Entrer d'abord : depuis F2, toute route du produit sans session
        // conduit à `R0`. On y va par l'écran, jamais en posant une session
        // dans le stockage — sinon `R0` pourrait être cassé sans que rien
        // rougisse. Les instruments, eux, n'exigent aucune session : ils sont
        // le moyen de choisir un compte en phase 2.
        if (exigeUneSession(route)) await entrer(page, undefined, route)
        else await page.goto(route, { waitUntil: 'networkidle' })

        // ── La page REND, dans le gabarit qu'elle n'a pas demandé ───────────
        await expect(
          page.locator('[data-ecran]'),
          `${route} ne rend aucun écran — la route est servie et la page est vide`,
        ).toHaveCount(1)
        if (avecEnTete) {
          await expect(page.locator('header [data-emplacement="etablissement"]')).toBeVisible()
          await expect(page.locator('header [data-emplacement="temoin"]')).toBeAttached()
        } else {
          // L'absence est vérifiée aussi fermement que la présence : un en-tête
          // qui reviendrait sur `R0` afficherait un contexte inventé.
          await expect(page.locator('header')).toHaveCount(0)
        }
        // UN SEUL `<main>` dans le document (FR-032).
        await expect(page.locator('main')).toHaveCount(1)

        // ── Le THÈME est posé, et le fond calculé est celui du jeton ────────
        await expect(page.locator('html')).toHaveAttribute('data-theme', nom)
        if (schema === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
        else await expect(page.locator('html')).not.toHaveClass(/dark/)

        // ⚠️ C'EST LE CONTRÔLE QUI ATTRAPE L'UTILITAIRE MANQUANT. Un utilitaire
        // que le build n'a pas compilé ne lève AUCUNE erreur : il ne s'applique
        // pas, et le navigateur rend sa valeur par défaut.
        const fond = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
        expect(fond, `${route} : le fond n'est pas le jeton --color-bg du thème ${nom}`).toBe(
          JETONS.couleur.bg[schema],
        )
        if (avecEnTete) {
          expect(
            await styleCalcule(page.locator('header').first(), 'background-color'),
            `${route} : l'en-tête n'est pas sur le jeton --color-surf`,
          ).toBe(JETONS.couleur.surf[schema])
        }
        expect(
          await page.evaluate(() => getComputedStyle(document.body).fontSize),
          `${route} : le corps du document n'est pas le jeton --text-corps`,
        ).toBe(JETONS.corps.corps)

        // ── HAUTEUR, RAYON, CORPS des cibles cliquables ─────────────────────
        const cibles = await mesurerCibles(
          page,
          'button, input',
          EXEMPTIONS.map((e) => ({ selecteur: e.selecteur, hauteur: e.hauteur, nom: e.nom })),
        )
        expect(
          cibles.length,
          `${route} : aucune cible cliquable — le contrôle serait vide`,
        ).toBeGreaterThan(0)

        const souslePlancher: string[] = []
        const rayonsHorsJetons: string[] = []
        const corpsHorsJetons: string[] = []

        for (const mesure of cibles) {
          if (mesure.hauteurAttendue !== null) {
            // L'exemption est CONTRÔLÉE : la hauteur du tableau, ou le plancher.
            if (mesure.hauteur !== mesure.hauteurAttendue && mesure.hauteur < PLANCHER_TACTILE) {
              souslePlancher.push(
                `${mesure.texte} · ${mesure.exemption} → ${mesure.hauteur}px, attendu ${mesure.hauteurAttendue}px ou ${PLANCHER_TACTILE}px`,
              )
            }
          } else if (mesure.hauteur < PLANCHER_TACTILE) {
            souslePlancher.push(`${mesure.texte} → ${mesure.hauteur}px`)
          }

          if (!RAYONS_JETON.has(mesure.rayon)) {
            rayonsHorsJetons.push(`${mesure.texte} → ${mesure.rayon}`)
          }
          if (!CORPS_JETON.has(mesure.corps)) {
            corpsHorsJetons.push(`${mesure.texte} → ${mesure.corps}`)
          }
        }

        expect(
          souslePlancher,
          `${route} : plancher tactile de 44 px — ${souslePlancher.join(' · ')}`,
        ).toEqual([])
        expect(
          rayonsHorsJetons,
          `${route} : rayon hors de tokens.md §4 — ${rayonsHorsJetons.join(' · ')}`,
        ).toEqual([])
        expect(
          corpsHorsJetons,
          `${route} : corps hors de tokens.md §2 — ${corpsHorsJetons.join(' · ')}`,
        ).toEqual([])

        // ── CONTRASTE AA sur tout ce qui porte du texte visible ─────────────
        // ⚠️ LE BANDEAU DE LA COQUILLE EST DANS LA LISTE, ET IL A FAILLI NE PAS
        // Y ÊTRE. Il vit ENTRE l'en-tête et le `<main>` : un sélecteur en
        // « main … , header … » l'aurait laissé dehors, et sur WebKit il est
        // affiché sur CHAQUE écran. Une surface visible partout et vérifiée
        // nulle part est le meilleur endroit où cacher un défaut de contraste.
        const textes = await mesurerTextes(
          page,
          'main h1, main h2, main p, main button, header button, [data-forme], [data-bandeau-coquille] span, [data-bandeau-coquille] button',
        )
        expect(
          textes.length,
          `${route} : aucun texte inspecté — le contrôle serait vide`,
        ).toBeGreaterThan(0)

        const echecsAA = textes
          .filter((m) => !m.attenue && m.rapport < seuilAA(m.corps, m.gras))
          .map((m) => `${m.texte} → ${m.rapport.toFixed(2)}:1`)
        expect(echecsAA, `${route} : contraste sous AA — ${echecsAA.join(' · ')}`).toEqual([])

        // ── LE TÉMOIN ne laisse échapper aucun nom d'état interne (SC-022) ──
        await exigerAucunNomDetatInterne(page, route)

        // ── LA CONSOLE ─────────────────────────────────────────────────────
        expect(erreursConsole, `${route} : la console a parlé — ${erreursConsole.join(' · ')}`).toEqual([])
      })
    }
  })
}
