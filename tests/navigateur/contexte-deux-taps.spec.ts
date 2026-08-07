import { expect, test } from '@playwright/test'

import { COMPTES, entrer } from './outils/entrer'
import { nomDuTheme } from './outils/mesures'

/**
 * `ETB-06` — **DEUX GESTES, SANS RECONNEXION**, et le contexte ne change jamais
 * tout seul. FR-026, FR-027, FR-028, FR-030c, FR-032, SC-013.
 *
 * ⚠️ CE QUI SE COMPTE ICI EST UN NOMBRE DE GESTES, PAS UN COMPORTEMENT. « Deux
 * taps » est une exigence mesurable : le test la mesure, il ne la constate pas à
 * l'œil. Trois gestes passeraient inaperçus à la relecture et coûteraient une
 * demi-seconde vingt fois par jour à quelqu'un qui gère deux maisons.
 *
 * ⚠️ ET LA PERSONNE NE CHANGE PAS. Une bascule qui repasserait par `R0` ferait
 * ressaisir un identifiant à quelqu'un qui n'a rien perdu.
 */

for (const schema of ['light', 'dark'] as const) {
  const theme = nomDuTheme(schema)

  test.describe(`le contexte · thème ${theme}`, () => {
    test.use({ colorScheme: schema })

    test('⚠️ DEUX GESTES, SANS RECONNEXION, ET LES DROITS SUIVENT LE SITE', async ({ page }) => {
      // M. Koffi a trois sites — c'est le compte qui rend la bascule observable.
      await entrer(page, COMPTES.koffi, '/')
      await expect(page.locator('[data-ecran="R1"]')).toBeVisible()

      const selecteur = page.locator('header [data-composant-09]')
      const avant = await page.locator('header [data-composant-09] .truncate').first().innerText()

      // ── Geste 1 · ouvrir ────────────────────────────────────────────────
      await selecteur.click()
      // ── Geste 2 · choisir ───────────────────────────────────────────────
      const autre = page.locator('header [data-composant-09] ~ div button', {
        hasText: 'Chez Tantie Adjo',
      })
      await autre.click()

      // ⚠️ DEUX GESTES ONT SUFFI : on n'est pas passé par `R0`.
      await expect(page, 'la bascule a exigé une reconnexion').not.toHaveURL(/\/connexion/)
      await expect(page.locator('header [data-composant-09] .truncate').first()).not.toHaveText(
        avant,
      )
      await expect(page.locator('header [data-composant-09]')).toContainText('Chez Tantie Adjo')

      // ── L'accueil s'est ENTIÈREMENT refait ──────────────────────────────
      await expect(page.locator('[data-rubrique][data-etat="chargement"]')).toHaveCount(0)
      const html = (await page.locator('[data-ecran="R1"]').innerHTML()).toLowerCase()
      expect(
        html.includes('hébergement'),
        'le maquis affiche un service qu’il n’a pas — les droits n’ont pas suivi le site',
      ).toBe(false)
    })

    test('⚠️ ROUVRIR RAMÈNE AU DERNIER SITE CHOISI, pas au premier (FR-032)', async ({ page }) => {
      await entrer(page, COMPTES.koffi, '/')
      await page.locator('header [data-composant-09]').click()
      await page
        .locator('header [data-composant-09] ~ div button', { hasText: 'Chez Tantie Adjo' })
        .click()
      await expect(page.locator('header [data-composant-09]')).toContainText('Chez Tantie Adjo')

      // Recharger : la session est reprise du stockage, portée comprise.
      await page.reload({ waitUntil: 'networkidle' })
      await expect(
        page.locator('header [data-composant-09]'),
        'rouvrir a ramené au premier site de la liste — M. Koffi rouvrirait chaque matin sur la maison qu’il ne visite pas',
      ).toContainText('Chez Tantie Adjo')
    })

    test('⚠️ AVEC UN SEUL SITE, LE SÉLECTEUR N’EST PAS UN BOUTON (FR-028)', async ({ page }) => {
      // Aminata n'a qu'un établissement. *Un bouton qui n'ouvre rien apprend à
      // ne plus cliquer.*
      await entrer(page, COMPTES.aminata, '/')
      const selecteur = page.locator('header [data-composant-09]')
      await expect(selecteur).toBeVisible()
      expect(
        await selecteur.evaluate((element) => element.tagName.toLowerCase()),
        'le sélecteur est un bouton alors qu’il n’ouvre rien',
      ).not.toBe('button')
      await expect(selecteur.locator('.ph-caret-down')).toHaveCount(0)
    })

    test('⚠️ LES DEUX FORMES DU SECOND SEGMENT (FR-030c, SC-013)', async ({ page }) => {
      // ── Forme LONGUE · un seul poste dérivable ──────────────────────────
      await entrer(page, COMPTES.yao, '/')
      await page.locator('header [data-composant-09]').click()
      await page
        .locator('header [data-composant-09] ~ div button', { hasText: 'Chez Tantie Adjo' })
        .click()
      await expect(
        page.locator('header [data-composant-09] [data-detail]'),
        'Yao n’a qu’un poste au maquis : l’en-tête doit le dire',
      ).toHaveText('Abobo · La salle')

      // ── Forme COURTE · plusieurs postes, et le système NE CHOISIT PAS ────
      // ⚠️ C'EST LA MOITIÉ QUI COMPTE. Ne tester que la forme longue laisserait
      // passer un poste inventé par défaut — le mensonge exact que la règle
      // interdit. **Ne rien afficher rend le manque visible.**
      await entrer(page, COMPTES.adjoua, '/')
      await expect(page.locator('header [data-composant-09] [data-detail]')).toHaveText(
        'Abengourou',
      )
    })

    test('la portée « tous » existe, et AUCUNE CAISSE NE S’Y TOUCHE (FR-019)', async ({ page }) => {
      await entrer(page, COMPTES.koffi, '/')
      await page.locator('header [data-composant-09]').click()
      await page
        .locator('header [data-composant-09] ~ div button', { hasText: 'Mes 3 établissements' })
        .click()

      await expect(page.locator('header [data-composant-09] [data-detail]')).toHaveText(
        "Vue d'ensemble",
      )
      await expect(page.locator('[data-rubrique][data-etat="chargement"]')).toHaveCount(0)

      // Sous la vue d'ensemble, aucune permission n'est portée : c'est l'absence
      // de droits qui produit l'absence de surfaces, par le même filtrage que
      // partout ailleurs — jamais une restriction ajoutée à l'écran.
      const html = (await page.locator('[data-ecran="R1"]').innerHTML()).toLowerCase()
      for (const geste of ['encaisser', 'clôturer', 'ouvrir une table']) {
        expect(html.includes(geste), `« ${geste} » est atteignable sous la vue d'ensemble`).toBe(
          false,
        )
      }
    })

    test('une alerte d’un AUTRE site se voit, et ne bascule RIEN (FR-029)', async ({ page }) => {
      await entrer(page, COMPTES.koffi, '/')
      const avant = await page.locator('header [data-composant-09]').innerText()

      // La pastille est sur le sélecteur FERMÉ : on la voit sans aller y voir.
      await expect(
        page.locator('header [data-composant-09] .bg-alerte'),
        'aucune alerte ne remonte des autres sites',
      ).toHaveCount(1)

      // ⚠️ ET RIEN N'A BASCULÉ. *Un changement de contexte non demandé fait
      // saisir une consommation sur le mauvais site.*
      //
      // ⚠️ LA COMPARAISON PASSE PAR `innerText` DES DEUX CÔTÉS. `toHaveText`
      // normalise les espaces et recolle les lignes ; comparer l'un à l'autre
      // faisait rougir le test sur une différence de MISE EN FORME, alors que
      // le contexte n'avait précisément pas bougé.
      expect(await page.locator('header [data-composant-09]').innerText()).toBe(avant)
    })
  })
}
