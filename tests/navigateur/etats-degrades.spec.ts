import { expect, test, type Locator, type Page } from '@playwright/test'

import { nomDuTheme } from './outils/mesures'
import {
  DELORIA,
  ouvrirLAccueil,
  ouvrirLePanneau,
  poserLatence,
  poserLeContexte,
  poserLevier,
} from './outils/panneau'

/**
 * **US6 · L'ACCUEIL QUAND RIEN NE VA** — ni page blanche, ni tourniquet
 * éternel, ni message d'ingénieur.
 *
 * ⚠️ CE QUE CETTE SUITE EST, DIT HONNÊTEMENT. Les quatre états sont
 * **implémentés** aux phases 3 et 4 du cycle (T021, T024, T036) et vérifiés en
 * unité ; ce fichier les prouve **en navigateur réel**, ce qu'aucun test de
 * composant ne remplace (DoD §0.4 point 8). Il ne livre donc aucun comportement
 * neuf, et l'appeler « fonctionnalité » tromperait sur ce qui reste à faire.
 *
 * ⚠️ ET IL PORTE SUR `R0` ET `R1`, PAS SUR LES INSTRUMENTS.
 * `parcours.spec.ts` exerce déjà les mêmes leviers sur `/_ecrans` — l'écran
 * d'inventaire — et sur l'essai d'écriture du panneau. Ce qui manquait, c'est la
 * preuve sur les **deux écrans du produit** : ce sont eux que l'exploitant
 * regarde quand le réseau tombe.
 *
 * ⚠️ LES QUATRE ÉTATS SE POSENT PAR LE PANNEAU SCÉNARIOS, jamais par une porte
 * dérobée. Un test qui poserait un état interne prouverait que le composant sait
 * le rendre, pas que l'application sait s'y mettre.
 *
 * Quatre passages : Chromium × WebKit, clair × sombre.
 */

/** Ce qu'un état vide illustré doit porter — composant 11, variante de départ. */
const ETAT_VIDE = '[data-composant-11][data-variante="depart"]'

/** Collecte les erreurs de la console : une page dégradée reste une page saine. */
function ecouterLaConsole(page: Page): string[] {
  const erreurs: string[] = []
  page.on('pageerror', (e) => erreurs.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text())
  })
  return erreurs
}

/** Les codes de rubrique rendus, dans l'ordre du document. */
async function rubriquesRendues(page: Page): Promise<string[]> {
  return page.locator('[data-ecran="R1"] [data-rubrique]').evaluateAll((sections) =>
    sections.map((section) => section.getAttribute('data-rubrique') ?? ''),
  )
}

interface Boite {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** La boîte d'un élément, exigée présente — mesurer un absent ne dit rien. */
async function boite(cible: Locator): Promise<Boite> {
  const mesure = await cible.boundingBox()
  expect(mesure, "l'élément mesuré n'est pas dans la page").not.toBeNull()
  return { x: mesure!.x, y: mesure!.y, w: mesure!.width, h: mesure!.height }
}

/**
 * Relève **en un seul instant** le code et la boîte de chaque rubrique.
 *
 * ⚠️ LA MESURE SE FAIT DANS LA PAGE, PAS EN CINQ ALLERS-RETOURS. Sous latence,
 * le contenu peut arriver au milieu d'une série d'appels : on comparerait alors
 * un squelette à un contenu en croyant comparer deux squelettes.
 */
async function releverLesRubriques(page: Page): Promise<Map<string, Boite>> {
  const releve = await page
    .locator('[data-ecran="R1"] [data-rubrique]')
    .evaluateAll((sections) =>
      sections.map((section) => {
        const rect = section.getBoundingClientRect()
        return {
          code: section.getAttribute('data-rubrique') ?? '',
          x: rect.x,
          y: rect.y,
          w: rect.width,
          h: rect.height,
        }
      }),
    )
  return new Map(releve.map(({ code, x, y, w, h }) => [code, { x, y, w, h }]))
}

for (const schema of ['light', 'dark'] as const) {
  const theme = nomDuTheme(schema)

  test.describe(`les états dégradés · thème ${theme}`, () => {
    test.use({ colorScheme: schema })

    // ── T062 · JEU VIDE ───────────────────────────────────────────────────
    test('jeu vide · chaque rubrique DIT ce qui viendra s’y loger', async ({ page }) => {
      const erreurs = ecouterLaConsole(page)

      // ⚠️ LE CONTEXTE SE POSE **AVANT** LE LEVIER. Sous jeu vide, la résolution
      // des permissions rendrait une liste vide, et l'on mesurerait alors
      // l'accueil d'un compte sans droits — pas un accueil sans données.
      await poserLeContexte(page, 'compte-adjoua', DELORIA)
      await poserLevier(page, 'jeu-vide', true)
      await ouvrirLAccueil(page)

      const rubriques = await rubriquesRendues(page)
      // Le plancher : la cible n'est pas vide. Sans lui, une page blanche
      // passerait cette suite au vert — c'est exactement ce qu'elle refuse.
      expect(
        rubriques.length,
        "l'accueil n'a rendu AUCUNE rubrique : le jeu vide a produit une page blanche",
      ).toBeGreaterThan(0)

      const phrases: string[] = []
      for (const code of rubriques) {
        const rubrique = page.locator(`[data-rubrique="${code}"]`)
        await expect(
          rubrique,
          `« ${code} » n'est pas dans l'état vide alors qu'aucune donnée n'existe`,
        ).toHaveAttribute('data-etat', 'vide')

        // ⚠️ **ILLUSTRÉ, ET NON UN CADRE NU.** Le composant 11 porte le motif
        // des contreforts et une phrase qui dit ce qui apparaîtra ici. Un cadre
        // vide se lirait comme une panne de chargement.
        const vide = rubrique.locator(ETAT_VIDE)
        await expect(vide, `« ${code} » rend un cadre nu, sans état vide illustré`).toBeVisible()
        const phrase = (await vide.innerText()).trim()
        expect(phrase, `l'état vide de « ${code} » ne dit rien`).not.toBe('')
        phrases.push(phrase)
      }

      // ⚠️ **UNE PHRASE PAR RUBRIQUE, ET C'EST LA PROPRIÉTÉ QUI COMPTE.** Un
      // message générique répété trois fois serait un cadre nu écrit en toutes
      // lettres : il ne dirait pas ce qui viendra **ici**.
      expect(
        new Set(phrases).size,
        'deux rubriques rendent la même phrase — l’état vide ne dit pas ce qui viendra s’y loger',
      ).toBe(phrases.length)

      // Et rien n'est éteint : l'absence est totale ou elle n'est pas.
      await expect(page.locator('[data-ecran="R1"] [disabled]')).toHaveCount(0)
      expect(erreurs, `la console a parlé — ${erreurs.join(' · ')}`).toEqual([])
    })

    // ── T063 · ÉCHEC RÉSEAU ───────────────────────────────────────────────
    test('échec réseau · chaque rubrique porte SON erreur, et l’écran tient', async ({ page }) => {
      const erreurs = ecouterLaConsole(page)

      await poserLeContexte(page, 'compte-adjoua', DELORIA)
      const nominal = await ouvrirEtReleverLesRubriques(page)

      await ouvrirLePanneau(page)
      await poserLevier(page, 'echec-reseau', true)
      await ouvrirLAccueil(page)

      const enPanne = await rubriquesRendues(page)

      // ⚠️ **C'EST LE POINT DUR DE LA PHASE.** Si l'échec faisait tomber
      // l'écran, l'indépendance des sources ne serait pas tenue : l'accueil est
      // composé de **cinq lectures distinctes**, et une panne ne doit pas en
      // emporter cinq. La mesure est donc une COMPARAISON — les mêmes rubriques
      // qu'en nominal, aucune évaporée.
      expect(
        enPanne,
        'des rubriques ont disparu sous l’échec réseau — une source en a emporté d’autres',
      ).toEqual(nominal)

      for (const code of enPanne) {
        const rubrique = page.locator(`[data-rubrique="${code}"]`)
        await expect(
          rubrique,
          `« ${code} » n'est pas en erreur alors que sa source a échoué`,
        ).toHaveAttribute('data-etat', 'erreur')
        // L'erreur est LOCALE : elle vit dans la rubrique, avec sa porte de
        // sortie. Un bandeau unique en tête d'écran dirait « tout est tombé ».
        await expect(
          rubrique.getByRole('button', { name: /Réessayer|Try again/i }),
          `« ${code} » ne propose pas de réessayer`,
        ).toBeVisible()
      }

      // ⚠️ ET L'ÉCRAN GARDE SON OSSATURE. La coquille, l'en-tête et les deux
      // colonnes tiennent : ce qui a échoué, c'est le contenu, pas la page.
      await expect(page.locator('header')).toHaveCount(1)
      await expect(page.locator('[data-ecran="R1"] [data-colonne="laterale"]')).toBeVisible()
      expect(erreurs, `la console a parlé — ${erreurs.join(' · ')}`).toEqual([])
    })

    // ── T064 · HORS LIGNE ─────────────────────────────────────────────────
    test('hors ligne · R0 le dit AVANT la saisie, et l’action DISPARAÎT', async ({ page }) => {
      // ⚠️ AUCUNE SESSION N'EST POSÉE : Playwright ouvre un contexte neuf par
      // test, et c'est l'état d'un appareil qu'on déballe. Le panneau
      // s'atteint sans session — son trait bas le range hors du produit.
      await ouvrirLePanneau(page)
      await poserLevier(page, 'hors-ligne', true)

      await page.goto('/connexion', { waitUntil: 'networkidle' })
      const refus = page.locator('[data-refus="hors-ligne"]')
      await expect(refus, 'la connexion ne dit pas qu’elle ne peut pas aboutir').toBeVisible()

      // ⚠️ **AVANT LA SAISIE, ET L'ORDRE PORTE L'EXIGENCE** (FR-012). Sous le
      // formulaire, la phrase se lirait après avoir tapé son identifiant —
      // c'est-à-dire trop tard.
      const boiteRefus = await boite(refus)
      const boiteChamp = await boite(page.locator('[data-champ="identifiant"]'))
      expect(
        boiteRefus.y,
        'le refus est sous le formulaire : il se lirait après la saisie',
      ).toBeLessThan(boiteChamp.y)

      // ⚠️ **ABSENTE, JAMAIS GRISÉE.** `compte` est de classe C au registre :
      // hors ligne, l'entrée n'est ni mise en file « au cas où », ni éteinte —
      // elle n'existe pas, et le bandeau dit pourquoi.
      await expect(
        page.locator('[data-action="entrer"]'),
        'l’action d’entrée est encore dans le document',
      ).toHaveCount(0)
      await expect(page.locator('[data-ecran="R0"] [disabled]')).toHaveCount(0)
    })

    test('hors ligne · R1 le dit par rubrique, et jamais comme une panne', async ({ page }) => {
      const erreurs = ecouterLaConsole(page)

      await poserLeContexte(page, 'compte-adjoua', DELORIA)
      const nominal = await ouvrirEtReleverLesRubriques(page)

      await ouvrirLePanneau(page)
      await poserLevier(page, 'hors-ligne', true)
      await ouvrirLAccueil(page)

      expect(
        await rubriquesRendues(page),
        'des rubriques ont disparu hors ligne — l’écran s’est effondré au lieu de dire',
      ).toEqual(nominal)

      for (const code of nominal) {
        const rubrique = page.locator(`[data-rubrique="${code}"]`)
        await expect(rubrique).toHaveAttribute('data-etat', 'horsLigne')
        // ⚠️ **HORS LIGNE ET ÉCHEC RÉSEAU NE SE DISENT PAS PAREIL.** Le premier
        // est un fait sur lequel on peut agir — attendre, se déplacer ; le
        // second est une panne qu'on réessaie. Proposer « Réessayer » à
        // quelqu'un qui n'a pas de réseau, c'est lui promettre l'échec.
        await expect(
          rubrique.getByRole('button', { name: /Réessayer|Try again/i }),
          `« ${code} » propose de réessayer alors qu'il n'y a pas de réseau`,
        ).toHaveCount(0)
      }

      // Et le témoin de l'en-tête dit l'état dans les mots du lexique — jamais
      // le nom interne « hors ligne ».
      await expect(page.locator('[data-emplacement="temoin"]')).toContainText(
        /Hors connexion|No connection/i,
      )
      expect(erreurs, `la console a parlé — ${erreurs.join(' · ')}`).toEqual([])
    })

    // ── T065 · LATENCE ────────────────────────────────────────────────────
    test('latence · le squelette occupe la place de ce qui viendra', async ({ page }) => {
      const erreurs = ecouterLaConsole(page)

      // ⚠️ ADJOUA À DELORIA REND **LES CINQ RUBRIQUES**, et c'est ce qui rend la
      // mesure possible : le squelette et le contenu portent alors le même
      // ensemble, et l'on compare bien la même chose avant et après.
      await poserLeContexte(page, 'compte-adjoua', DELORIA)
      await ouvrirLePanneau(page)
      // ⚠️ LA LATENCE EN DERNIER : posée avant, elle ralentirait la résolution
      // du contexte au panneau, pour ne rien prouver de plus. Et elle est LARGE
      // — quatre secondes —, parce que la fenêtre de mesure doit rester ouverte
      // pendant que huit passages s'exécutent en parallèle sur la même machine.
      await poserLatence(page, 4000)

      await page.goto('/', { waitUntil: 'commit' })
      await expect(page.locator('[data-ecran="R1"]')).toBeVisible()

      const enChargement = page.locator('[data-rubrique][data-etat="chargement"]')
      await expect(
        enChargement.first(),
        'aucune rubrique ne porte de squelette : l’attente est un vide',
      ).toBeVisible()

      // ⚠️ **UNE SEULE CAPTURE, CÔTÉ PAGE.** Mesurer rubrique par rubrique
      // demandait cinq allers-retours, et le contenu pouvait arriver au milieu :
      // on aurait alors comparé un squelette à un autre squelette, sans le
      // savoir. Ici, l'instant de la mesure est le même pour les cinq.
      const avant = await releverLesRubriques(page)
      expect(
        avant.size,
        'aucune rubrique pendant le chargement : l’attente est une page blanche',
      ).toBeGreaterThan(0)
      for (const code of avant.keys()) {
        await expect(
          page.locator(`[data-rubrique="${code}"] [data-squelette]`),
          `« ${code} » attend sans rien montrer — un tourniquet, ou rien du tout`,
        ).toBeVisible()
      }

      // Le contenu arrive.
      await expect(enChargement).toHaveCount(0, { timeout: 30_000 })
      const apresTout = await releverLesRubriques(page)

      for (const [code, attendu] of avant) {
        const apres = apresTout.get(code)
        expect(apres, `« ${code} » a disparu à l'arrivée des données`).toBeDefined()
        // ⚠️ **À LA PLACE EXACTE.** La rubrique ne se déplace pas d'un pixel en
        // largeur : c'est ce qui fait qu'on ne reclique pas au mauvais endroit.
        expect(
          Math.abs(apres!.x - attendu.x),
          `« ${code} » a changé de colonne`,
        ).toBeLessThanOrEqual(1)
        expect(
          Math.abs(apres!.w - attendu.w),
          `« ${code} » a changé de largeur à l'arrivée des données`,
        ).toBeLessThanOrEqual(1)
        // ⚠️ **ET LE SQUELETTE OCCUPE.** Une hauteur nulle pendant l'attente est
        // exactement le vide qui fait sauter la mise en page.
        expect(attendu.h, `le squelette de « ${code} » n'occupe aucune hauteur`).toBeGreaterThan(0)
      }

      // ⚠️ **LE HAUT DE L'ÉCRAN NE BOUGE PAS.** La première rubrique reste où
      // elle était : ce qui varie, c'est la hauteur du contenu qui arrive — un
      // squelette porte trois lignes, une liste en porte ce qu'elle a —, jamais
      // le point de départ de la lecture.
      const premier = [...avant.keys()][0]!
      expect(
        Math.abs(apresTout.get(premier)!.y - avant.get(premier)!.y),
        'la première rubrique a sauté à l’arrivée des données',
      ).toBeLessThanOrEqual(1)

      expect(erreurs, `la console a parlé — ${erreurs.join(' · ')}`).toEqual([])
    })

    // ── T066 · UN COMPTE SANS AUCUN ÉTABLISSEMENT ─────────────────────────
    test('sans aucun établissement · l’accueil le DIT, et le panneau ne ment plus', async ({
      page,
    }) => {
      const erreurs = ecouterLaConsole(page)

      // L'administrateur éditeur : son rattachement est `null` au modèle
      // (`compte_role.etablissement_id`), et c'est un cas prévu, pas un accident.
      await ouvrirLePanneau(page)
      await page.locator('[data-levier="compte"] select').selectOption('compte-editeur')
      await expect(page.locator('[data-ecran="scenarios"]')).toContainText('compte-editeur')

      // ⚠️ **ABSENT, JAMAIS UNE LISTE VIDE.** Le panneau ne propose que les sites
      // où le compte a des droits ; il n'y en a aucun, donc il n'y a pas de
      // choix — et il le dit à la place du sélecteur.
      await expect(page.locator('[data-levier="etablissement"]')).toHaveCount(0)
      await expect(page.locator('[data-sans-etablissement]')).toBeVisible()

      await ouvrirLAccueil(page)

      // ⚠️ **UN ACCUEIL QUI LE DIT** (FR-024) — jamais vide, jamais une erreur.
      const ecran = page.locator('[data-ecran="R1"]')
      await expect(ecran).toHaveAttribute('data-repli', 'sansEtablissement')
      const dit = page.locator('[data-bloc="sansEtablissement"] ' + ETAT_VIDE)
      await expect(dit, "l'accueil ne dit pas ce qui manque").toBeVisible()
      await expect(dit).toContainText(/rattaché|linked/i)

      // Ni rubrique orpheline, ni colonne à surveiller : il n'y a rien à
      // composer, et une colonne latérale vide serait un reste de mise en page.
      await expect(page.locator('[data-ecran="R1"] [data-rubrique]')).toHaveCount(0)
      await expect(page.locator('[data-colonne="laterale"]')).toHaveCount(0)

      // ⚠️ ET AUCUNE ERREUR N'EST AFFICHÉE : rien n'a échoué. Un bandeau rouge
      // ferait chercher une panne là où il manque un rattachement.
      await expect(page.locator('[data-ecran="R1"] [data-ton]')).toHaveCount(0)

      // ⚠️ L'EN-TÊTE NE MONTRE PAS DE SITE — un sélecteur sans nom serait un
      // repère qui ne repère rien —, et ce qui a un sens sans site demeure :
      // l'identité, et « Passer la main ».
      await expect(page.locator('header [data-emplacement="etablissement"]')).toHaveCount(0)
      await expect(page.locator('header [data-emplacement="identite"]')).toBeVisible()

      expect(erreurs, `la console a parlé — ${erreurs.join(' · ')}`).toEqual([])
    })
  })
}

/** Ouvre l'accueil en nominal et relève les rubriques — la mesure de référence. */
async function ouvrirEtReleverLesRubriques(page: Page): Promise<string[]> {
  await ouvrirLAccueil(page)
  const rubriques = await rubriquesRendues(page)
  expect(
    rubriques.length,
    "l'accueil nominal ne rend aucune rubrique : la comparaison ne dirait rien",
  ).toBeGreaterThan(0)
  return rubriques
}
