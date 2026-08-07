import { expect, test } from '@playwright/test'

import {
  contrasteDe,
  hauteur,
  JETONS,
  PLANCHER_TACTILE,
  seuilAA,
  seuilAAA,
  styleCalcule,
} from './outils/mesures'

/**
 * US2 · LE GUIDE DE STYLE REND LES VALEURS DE `docs/design/tokens.md`.
 *
 * ⚠️ C'EST LE CONTRÔLE QUI ATTRAPE L'UTILITAIRE VENU DU CDN. La maquette charge
 * Tailwind par CDN, qui engendre les utilitaires à la volée ; le build ne
 * compile que ce qu'il trouve dans les sources. **Un utilitaire manquant ne lève
 * aucune erreur — il ne s'affiche pas.** Le seul moyen de le voir est de lire le
 * style CALCULÉ dans un navigateur réel : un utilitaire absent rend une valeur
 * par défaut du navigateur, qui ne coïncide avec aucun jeton.
 *
 * ⚠️ LES MESURES VIENNENT DE `outils/mesures.ts`, PARTAGÉES AVEC LA MATRICE DE
 * P-04. Cette suite mesure les seize composants sur UN écran ; la matrice mesure
 * les mêmes propriétés sur CHAQUE écran construit. Une seconde copie des jetons
 * divergerait au premier changement de palette.
 */

/**
 * ⚠️ LE SEGMENT EST LA SEULE EXEMPTION, ET ELLE EST ÉCRITE DANS LE MÊME TABLEAU
 * QUE LA RÈGLE. `tokens.md` §3 porte les deux lignes : « Touche · h-11 · 44 px ·
 * plancher tactile, jamais moins » ET « Segment · h-8 · 32 px · dans une piste
 * h-10 ». On vérifie donc que le segment fait bien 32 px — l'exemption est
 * CONTRÔLÉE, pas tolérée.
 */
const SELECTEUR_SEGMENT = '[role="radiogroup"] button'

for (const schema of ['light', 'dark'] as const) {
  const nom = schema === 'dark' ? 'sombre' : 'clair'

  test.describe(`guide de style · thème ${nom}`, () => {
    test.use({ colorScheme: schema })

    test.beforeEach(async ({ page }) => {
      await page.goto('/_guide-de-style', { waitUntil: 'networkidle' })
      await expect(page.locator('[data-ecran="guide-de-style"]')).toBeVisible()
    })

    test('les SEIZE sections sont là, et le décompte vient du document', async ({ page }) => {
      await expect(page.locator('[data-composant]')).toHaveCount(16)
      await expect(page.locator('[data-bloc="sommaire"] a')).toHaveCount(16)
    })

    test('les couleurs calculées sont celles des jetons', async ({ page }) => {
      // Le fond de page — celui qu'un utilitaire absent rendrait blanc.
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
        JETONS.couleur.bg[schema],
      )

      const boutonPrincipal = page.locator('[data-composant="01"] button').first()
      expect(await styleCalcule(boutonPrincipal, 'background-color')).toBe(
        JETONS.couleur.prim[schema],
      )

      const carte = page.locator('[data-composant="06"] > div > div').first()
      expect(await styleCalcule(carte, 'background-color')).toBe(JETONS.couleur.surf[schema])
    })

    test('les rayons et les corps calculés sont ceux des jetons', async ({ page }) => {
      const boutonPrincipal = page.locator('[data-composant="01"] button').first()
      expect(await styleCalcule(boutonPrincipal, 'border-radius')).toBe(JETONS.rayon.lg)
      expect(await styleCalcule(boutonPrincipal, 'font-size')).toBe(JETONS.corps.action)

      const boutonDiscret = page.locator('[data-composant="03"] button').first()
      expect(await styleCalcule(boutonDiscret, 'border-radius')).toBe(JETONS.rayon.md)
      expect(await styleCalcule(boutonDiscret, 'font-size')).toBe(JETONS.corps.mini)

      const pastille = page.locator('[data-composant="04"] [data-forme]').first()
      expect(await styleCalcule(pastille, 'border-radius')).toBe(JETONS.rayon.pleine)

      const chiffre = page.locator('[data-composant="06"] [data-valeur]').first()
      expect(await styleCalcule(chiffre, 'font-size')).toBe(JETONS.corps.chiffreL)
      // Un montant ne se coupe jamais.
      expect(await styleCalcule(chiffre, 'white-space')).toBe('nowrap')
    })

    test('les hauteurs calculées sont celles des jetons', async ({ page }) => {
      expect(await hauteur(page.locator('[data-composant="01"] button').first())).toBe(
        JETONS.hauteur.touche,
      )
      expect(await hauteur(page.locator('[data-composant="03"] button').first())).toBe(
        JETONS.hauteur.discret,
      )
      expect(await hauteur(page.locator('[data-composant="04"] [data-forme]').first())).toBe(
        JETONS.hauteur.pastille,
      )
      expect(await hauteur(page.locator('[data-composant="08"] > div > *').first())).toBe(
        JETONS.hauteur.ligne,
      )
      expect(await hauteur(page.locator('[data-composant="16"] input').first())).toBe(
        JETONS.hauteur.touche,
      )
    })

    test('44 px de zone de touche, partout sauf le segment — qui fait bien 32', async ({
      page,
    }) => {
      const cliquables = page.locator('[data-composant] button, [data-composant] input')
      const total = await cliquables.count()
      expect(total, "aucune cible cliquable : le contrôle n'inspecterait rien").toBeGreaterThan(20)

      const trop_petites: string[] = []
      const exemptes: number[] = []
      for (let i = 0; i < total; i += 1) {
        const cible = cliquables.nth(i)
        const exempte = await cible.evaluate(
          (element) =>
            Boolean(element.closest('[role="radiogroup"]')) ||
            element.hasAttribute('data-composant-03'),
        )
        const h = await hauteur(cible)
        if (exempte) {
          if (h > 0) exemptes.push(h)
          continue
        }
        if (h > 0 && h < PLANCHER_TACTILE) {
          trop_petites.push(`${await cible.innerText()} → ${h}px`)
        }
      }
      expect(
        trop_petites,
        `cibles sous le plancher tactile de 44 px : ${trop_petites.join(' · ')}`,
      ).toEqual([])

      // ⚠️ LES DEUX EXEMPTIONS SONT CONTRÔLÉES, PAS TOLÉRÉES. `tokens.md` §3
      // porte les deux lignes dans le MÊME tableau que le plancher : « Segment ·
      // h-8 · 32 px » et « Bouton discret · h-9 · 36 px · hors chemin critique
      // uniquement ». Une hauteur exemptée qui ne serait ni 32, ni 36, ni 44,
      // ni 48 serait une troisième valeur inventée.
      expect(exemptes.length, "aucune cible exemptée : le contrôle n'inspecterait rien").toBeGreaterThan(0)
      const inattendues = exemptes.filter(
        (h) => ![JETONS.hauteur.segment, JETONS.hauteur.discret, 44, JETONS.hauteur.comptoir].includes(h),
      )
      expect(
        inattendues,
        `hauteurs exemptées hors du tableau des jetons : ${inattendues.join(', ')}`,
      ).toEqual([])

      const segments = page.locator(SELECTEUR_SEGMENT)
      expect(await segments.count()).toBeGreaterThan(0)
      expect(await hauteur(segments.first())).toBe(JETONS.hauteur.segment)
    })

    test('le contraste est AA partout, et AAA sur les montants', async ({ page }) => {
      const echecsAA: string[] = []
      const textes = page.locator(
        '[data-composant] button, [data-composant] h2, [data-composant] [data-forme], [data-composant] .font-mono',
      )
      const total = await textes.count()
      expect(total, "aucun texte inspecté : le contrôle serait vide").toBeGreaterThan(20)

      for (let i = 0; i < total; i += 1) {
        const cible = textes.nth(i)
        if (!(await cible.isVisible())) continue
        // Les éléments désactivés portent 0,45 d'opacité par le thème : le
        // contraste s'y juge sur l'état actif, pas sur l'atténuation voulue.
        const attenue = await cible.evaluate((element) =>
          Boolean(element.closest('[disabled]')) || element.hasAttribute('disabled'),
        )
        if (attenue) continue

        const rapport = await contrasteDe(page, cible)
        const corps = Number.parseFloat(await styleCalcule(cible, 'font-size'))
        const gras = Number(await styleCalcule(cible, 'font-weight')) >= 700
        const seuil = seuilAA(corps, gras)
        if (rapport < seuil) {
          echecsAA.push(`${(await cible.innerText()).slice(0, 24)} → ${rapport.toFixed(2)}:1`)
        }
      }
      expect(echecsAA, `contraste sous AA : ${echecsAA.join(' · ')}`).toEqual([])

      // ⚠️ AAA SUR LES MONTANTS ET LES STATUTS (FR-095). Ce sont les deux
      // choses qu'on lit à bout de bras, en plein soleil ou dans un bar.
      const montants = page.locator('[data-composant="06"] [data-valeur]')
      const nbMontants = await montants.count()
      expect(nbMontants).toBeGreaterThan(0)
      for (let i = 0; i < nbMontants; i += 1) {
        const cible = montants.nth(i)
        if (!(await cible.isVisible())) continue
        const rapport = await contrasteDe(page, cible)
        const corps = Number.parseFloat(await styleCalcule(cible, 'font-size'))
        const seuil = seuilAAA(corps)
        expect(rapport, `montant « ${await cible.innerText()} » : ${rapport.toFixed(2)}:1`).toBeGreaterThanOrEqual(seuil)
      }
    })

    test('EN NIVEAUX DE GRIS, chaque état reste lisible — la forme le porte', async ({ page }) => {
      // ⚠️ C'EST LE CONTRÔLE QUI COMPTE LE PLUS DE CETTE SUITE. Sur un
      // 1366 × 768 en plein soleil, une bordure rouge seule ne se voit pas — et
      // pas du tout pour un daltonien. « Un état n'est jamais porté par la
      // couleur seule : il porte aussi une forme. »
      await page.addStyleTag({ content: 'html { filter: grayscale(1) !important; }' })

      const pastilles = page.locator('[data-composant="04"] [data-forme]')
      const total = await pastilles.count()
      expect(total, 'aucune pastille inspectée').toBeGreaterThanOrEqual(6)

      const formes = new Set<string>()
      for (let i = 0; i < total; i += 1) {
        const forme = await pastilles.nth(i).getAttribute('data-forme')
        if (forme) formes.add(forme)
      }
      // Six états, six formes distinctes : le vocabulaire de composants.md §04.
      expect([...formes].sort()).toEqual([
        'carre',
        'cercle-vide',
        'losange',
        'rond',
        'roue',
        'triangle',
      ])

      // Et la forme est portée par la GÉOMÉTRIE, pas par la couleur : chaque
      // marque doit différer d'au moins une propriété non chromatique.
      const geometries = new Set<string>()
      for (let i = 0; i < total; i += 1) {
        const marque = pastilles.nth(i).locator('span').first()
        geometries.add(
          [
            await styleCalcule(marque, 'border-radius'),
            await styleCalcule(marque, 'transform'),
            await styleCalcule(marque, 'clip-path'),
            await styleCalcule(marque, 'border-width'),
          ].join('|'),
        )
      }
      expect(
        geometries.size,
        'plusieurs états partagent la même géométrie : en niveaux de gris ils seraient indistinguables',
      ).toBeGreaterThanOrEqual(5)
    })
  })
}
