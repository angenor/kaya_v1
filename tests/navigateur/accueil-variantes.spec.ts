import { expect, test, type Page } from '@playwright/test'

import { nomDuTheme } from './outils/mesures'
import {
  DELORIA,
  MAQUIS,
  ouvrirLAccueil,
  poserLeContexte as poserLeContexteAuPanneau,
} from './outils/panneau'

/**
 * **LES QUATRE ACCUEILS MAQUETTÉS**, obtenus par le contexte et **jamais par une
 * branche de code** — FR-017, SC-003, SC-004, SC-014.
 *
 * ⚠️ C'EST LE TEST DE VÉRITÉ DU CYCLE. Si une variante exigeait un
 * `if (variante === 'maquis')`, l'accueil d'un maquis serait un hôtel amputé —
 * et les onze écrans qui héritent du motif hériteraient de la branche. Ce que la
 * suite vérifie n'est donc pas « l'écran s'affiche » mais « **l'écran est le
 * bon, sans reste** » : aucune section vide, aucun libellé d'un service absent,
 * aucun élément inerte.
 *
 * ⚠️ ET LE CONTEXTE SE CHOISIT COMME UN RELECTEUR LE FERAIT — au panneau
 * Scénarios, en désignant un compte et un site. Poser une session dans le
 * stockage irait plus vite et prouverait moins.
 *
 * Quatre passages : Chromium × WebKit, clair × sombre.
 */

/** Les quatre variantes, telles que `quickstart.md` §2.2 les nomme. */
const VARIANTES = [
  {
    nom: 'générique · Adjoua × Deloria',
    compteId: 'compte-adjoua',
    etablissement: DELORIA,
    titre: 'À faire maintenant',
    doitVoir: ['Chambre 204', 'Vos activités', 'Hébergement', 'Pressing', "Aujourd'hui"],
    neDoitPasVoir: [],
    activites: 5,
  },
  {
    nom: 'serveuse · Aminata × Deloria',
    compteId: 'compte-aminata',
    etablissement: DELORIA,
    titre: 'Votre service',
    doitVoir: ['Vos tables', 'Total de vos tables'],
    // ⚠️ AUCUNE ACTION D'ENCAISSEMENT, AUCUN CHIFFRE D'HÔTEL. Aminata a UNE
    // permission ; tout le reste est absent du document, pas atténué.
    neDoitPasVoir: ['Recette depuis', 'Chambres occupées', 'Clôturer', 'Encaisser le départ'],
    activites: 3,
  },
  {
    nom: 'maquis · Yao × Chez Tantie Adjo',
    compteId: 'compte-yao',
    etablissement: MAQUIS,
    titre: 'Votre service',
    doitVoir: ['6 tables occupées sur 9', 'Comptoir', 'ardoises', 'Encaissé ce soir'],
    // ⚠️ LE CŒUR DE SC-003 : ni en texte, ni en attribut, ni sous un élément
    // masqué. Un seul de ces mots et l'écran est un hôtel amputé.
    neDoitPasVoir: ['Hébergement', 'Pressing', 'Salle de réunion', 'Vos activités'],
    activites: 0,
  },
  {
    nom: 'propriétaire · M. Koffi × Deloria',
    compteId: 'compte-koffi',
    etablissement: DELORIA,
    titre: 'La seule chose qui vous attend',
    doitVoir: ['Caisse d’hier soir', "Aujourd'hui"],
    // ⚠️ FR-019 : AUCUNE SURFACE QUI **MODIFIE** UNE CAISSE. La nuance est
    // celle de l'exigence, pas une indulgence : « Reste à encaisser » est un
    // CHIFFRE qu'un propriétaire a le droit de lire, et l'interdire ici aurait
    // fait rougir le test sur la consultation qu'il vient précisément d'obtenir.
    // Ce qui doit être absent, ce sont les GESTES.
    neDoitPasVoir: ['Clôturer la caisse', 'Vérifier', 'Ouvrir une table', 'Ajouter une commande', 'Encaisser le départ'],
    activites: 0,
  },
] as const

/**
 * Pose le contexte au panneau, puis ouvre l'accueil.
 *
 * ⚠️ LES DEUX GESTES VIENNENT DE `outils/panneau.ts`, PARTAGÉ AVEC LA SUITE DES
 * ÉTATS DÉGRADÉS. Ils étaient écrits ici en toutes lettres ; la seconde suite
 * en aurait fait une copie, et deux copies d'une même manœuvre divergent — c'est
 * toujours la plus faible qu'on croit.
 */
async function poserLeContexte(
  page: Page,
  compteId: string,
  etablissementId: string,
): Promise<void> {
  await poserLeContexteAuPanneau(page, compteId, etablissementId)
  await ouvrirLAccueil(page)
}

for (const schema of ['light', 'dark'] as const) {
  const theme = nomDuTheme(schema)

  test.describe(`R1 · thème ${theme}`, () => {
    test.use({ colorScheme: schema })

    for (const variante of VARIANTES) {
      test(`${variante.nom}`, async ({ page }) => {
        const erreurs: string[] = []
        page.on('pageerror', (e) => erreurs.push(String(e)))
        page.on('console', (m) => {
          if (m.type() === 'error') erreurs.push(m.text())
        })

        await poserLeContexte(page, variante.compteId, variante.etablissement)

        // ── L'action principale nomme ce qui attend MAINTENANT ────────────
        // L'étiquette est DANS le bloc de tête, première ligne — le `<h1>` porte
        // le nom de l'écran, hors flux visuel, pour l'accessibilité.
        await expect(page.locator('[data-rubrique="tete"] [data-etiquette]')).toHaveText(
          variante.titre,
        )

        // ── ⚠️ LA GÉOMÉTRIE — ET C'EST SON ABSENCE QUI A LAISSÉ PASSER
        //      L'ÉCART LE PLUS VISIBLE DU CYCLE. La première version de cet
        //      écran empilait les cinq rubriques dans une colonne unique, là où
        //      les quatre maquettes posent DEUX colonnes. Tous les contrôles
        //      étaient verts : ils vérifiaient la présence, l'absence et les
        //      titres — jamais qu'une rubrique se tienne à droite d'une autre.
        //      **Un écran entièrement aplati passait.**
        await expect(
          page.locator('[data-ecran="R1"] [data-colonne="laterale"]'),
          "la colonne latérale n'existe pas — l'écran est aplati en une seule colonne",
        ).toBeVisible()

        // « À régler » et les chiffres sont DANS la latérale ; « Vos activités »
        // dans la principale. Le partage n'est pas décoratif : à gauche ce qu'on
        // FAIT, à droite ce qu'on SURVEILLE.
        for (const rubrique of ['aRegler', 'chiffre']) {
          const dansLaterale = page.locator(
            `[data-colonne="laterale"] [data-rubrique="${rubrique}"]`,
          )
          const presente = await page.locator(`[data-rubrique="${rubrique}"]`).count()
          if (presente > 0) {
            await expect(
              dansLaterale,
              `« ${rubrique} » n'est pas dans la colonne latérale`,
            ).toHaveCount(1)
          }
        }
        if (variante.activites > 0) {
          await expect(
            page.locator('[data-colonne="laterale"] [data-rubrique="activite"]'),
            '« Vos activités » a glissé dans la colonne latérale',
          ).toHaveCount(0)
        }

        // La latérale est bien À DROITE, et pas simplement présente plus bas.
        const boiteTete = await page.locator('[data-rubrique="tete"]').boundingBox()
        const boiteLaterale = await page.locator('[data-colonne="laterale"]').boundingBox()
        expect(
          boiteLaterale!.x,
          'la colonne latérale est sous le contenu, pas à sa droite',
        ).toBeGreaterThan(boiteTete!.x + boiteTete!.width - 1)

        // ⚠️ ET ELLE TOUCHE LE BORD DROIT. Une première version ne posait pas
        // `w-full` sur la racine : la page, enfant flex du `<main>`, se
        // dimensionnait sur son CONTENU, et la colonne s'arrêtait au milieu de
        // l'écran — à une position **différente selon la variante**, puisque la
        // variante décide de la longueur du contenu. Une barre latérale dont la
        // position dépend du contenu n'est pas une barre latérale.
        const largeurFenetre = page.viewportSize()!.width
        expect(
          boiteLaterale!.x + boiteLaterale!.width,
          'la colonne latérale ne touche pas le bord droit de la fenêtre',
        ).toBeGreaterThan(largeurFenetre - 2)

        // ⚠️ COMPARAISON SANS CASSE : les étiquettes de carte sont rendues en
        // `uppercase` par le jeton de typographie, et `innerText` rend ce que
        // l'œil voit. Comparer à la casse ferait rougir un test sur une règle
        // de style — c'est-à-dire pour rien.
        const document_ = (await page.locator('[data-ecran="R1"]').innerText()).toLowerCase()
        for (const attendu of variante.doitVoir) {
          expect(document_, `« ${attendu} » manque à l'accueil ${variante.nom}`).toContain(
            attendu.toLowerCase(),
          )
        }

        // ── L'ABSENCE, sur le document rendu ──────────────────────────────
        // Le HTML complet, pas seulement le texte : un libellé caché en CSS ou
        // glissé dans un attribut compterait tout autant.
        const html = (await page.locator('[data-ecran="R1"]').innerHTML()).toLowerCase()
        for (const proscrit of variante.neDoitPasVoir) {
          expect(
            html.includes(proscrit.toLowerCase()),
            `« ${proscrit} » atteint l'accueil ${variante.nom} — ni en texte, ni en attribut, ni masqué`,
          ).toBe(false)
        }

        // ── « Vos activités » disparaît AVEC SON TITRE ────────────────────
        const activites = page.locator('[data-surface="activite"] > *')
        await expect(activites).toHaveCount(variante.activites)
        if (variante.activites === 0) {
          await expect(
            page.locator('[data-rubrique="activite"]'),
            'la rubrique vide a laissé son titre — un intitulé orphelin',
          ).toHaveCount(0)
        }

        // ── ABSENT, JAMAIS GRISÉ (SC-004) ────────────────────────────────
        // ⚠️ LE CONTRÔLE PORTE SUR LE DOCUMENT RENDU. Aucun élément de
        // l'accueil ne porte `disabled` : une action non permise n'est pas
        // éteinte, elle n'existe pas.
        await expect(
          page.locator('[data-ecran="R1"] [disabled]'),
          "un élément de l'accueil est désactivé — l'absence doit être totale",
        ).toHaveCount(0)
        await expect(page.locator('[data-ecran="R1"] [aria-disabled="true"]')).toHaveCount(0)

        // ── Aucune section vide ───────────────────────────────────────────
        await expect(
          page.locator('[data-rubrique][data-etat="absente"]'),
          'une rubrique absente est rendue — elle devrait disparaître',
        ).toHaveCount(0)

        expect(erreurs, `la console a parlé — ${erreurs.join(' · ')}`).toEqual([])
      })
    }

    test('la colonne latérale NE DÉFILE PAS avec le contenu', async ({ page }) => {
      // ⚠️ **CE QU'ON SURVEILLE RESTE SOUS LES YEUX PENDANT QU'ON TRAVAILLE.**
      // Tant que le document défilait d'un bloc, descendre dans la salle du
      // maquis faisait sortir de l'écran la caisse du soir et les ardoises —
      // c'est-à-dire précisément ce que la colonne latérale existe pour tenir
      // sous le regard. La barre du haut partait avec, retenue par un seul
      // `sticky`.
      await poserLeContexte(page, 'compte-yao', MAQUIS)

      const principale = page.locator('[data-ecran="R1"] [data-rubrique="tete"]')
      const laterale = page.locator('[data-ecran="R1"] [data-colonne="laterale"]')
      const avant = (await laterale.boundingBox())!
      const enTeteAvant = (await page.locator('header').boundingBox())!

      // On défile DANS la colonne principale, comme la main le ferait.
      await principale.hover()
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(120)

      // ⚠️ LA FENÊTRE, ELLE, N'A PAS BOUGÉ D'UN PIXEL. C'est la propriété
      // demandée : le contenu défile, la page non.
      expect(
        await page.evaluate(() => window.scrollY),
        'le document a défilé — la page entière bouge au lieu de son contenu',
      ).toBe(0)

      const apres = (await laterale.boundingBox())!
      expect(
        Math.abs(apres.y - avant.y),
        'la colonne latérale est partie avec le contenu',
      ).toBeLessThanOrEqual(1)
      expect(
        Math.abs((await page.locator('header').boundingBox())!.y - enTeteAvant.y),
        "l'en-tête a bougé de place",
      ).toBeLessThanOrEqual(1)
    })

    test('le pas 1 du quickstart · `/` sans session mène à la connexion', async ({ page }) => {
      // ⚠️ REPRIS ICI DEPUIS `connexion.spec.ts`, ET C'EST SA PLACE : tant que la
      // racine redirigeait, le pas ne pouvait pas se vérifier sur `/`. Depuis
      // que `R1` la sert, `/` est une route du produit comme une autre.
      //
      // ⚠️ AUCUNE SESSION N'EST POSÉE ICI, ET C'EST CE QUI REND LE TEST JUSTE :
      // Playwright ouvre un contexte NEUF par test — stockage vierge, comme un
      // appareil qu'on déballe. Une version antérieure vidait IndexedDB à la
      // main après avoir ouvert le panneau ; sur WebKit, la suppression restait
      // bloquée par la connexion ouverte, et le test rougissait sur son propre
      // ménage.
      await page.goto('/', { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/\/connexion\?vers=/)
      await expect(page.locator('[data-ecran="R0"]')).toBeVisible()
    })

    test('une porte qui ne mène pas encore · l’appui DIT l’écran et le cycle', async ({ page }) => {
      // ⚠️ LA SURFACE GARDE L'APPARENCE EXACTE D'UNE SURFACE ABOUTIE (SC-014) :
      // ni atténuation, ni badge, ni `disabled`. Ce qui manque est de NOTRE
      // côté, et le dire est honnête ; un badge « bientôt » réintroduirait le
      // grisé par la porte de derrière.
      await poserLeContexte(page, 'compte-adjoua', DELORIA)

      const action = page.locator('[data-rubrique="tete"] [data-action="principale"]')
      await expect(action).toBeVisible()
      await expect(action).not.toHaveAttribute('disabled', /.*/)
      await expect(action).not.toHaveClass(/opacity|attenu/)

      await action.click()
      const mention = page.locator('[data-mention]')
      await expect(mention).toBeVisible()
      // Elle nomme l'écran et le cycle — tous deux LUS À L'INDEX.
      await expect(mention).toContainText('La note et le départ')
      await expect(mention).toContainText('F3')
    })
  })
}
