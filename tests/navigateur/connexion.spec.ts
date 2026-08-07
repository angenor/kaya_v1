import { expect, test } from '@playwright/test'

import { COMPTES, soumettreConnexion } from './outils/entrer'
import { nomDuTheme } from './outils/mesures'

/**
 * `R0` — LES SEPT GESTES DE `quickstart.md` §2.1, DANS UN NAVIGATEUR RÉEL.
 *
 * ⚠️ CE QUE CETTE SUITE PROUVE, AUCUN TEST DE COMPOSANT NE LE PROUVE. Un
 * composant monté contourne le routeur, l'intergiciel global, le gabarit et les
 * greffons — c'est-à-dire tout ce qui décide si l'on arrive à `R0` sans session
 * et si l'on en repart avec. La DoD §0.4 point 8 le dit en une ligne : « un test
 * qui monte un composant ne prouve pas qu'une page s'atteint ».
 *
 * ⚠️ ET LE PAS 5 EST CELUI QUI COMPTE. Un message différent entre « compte
 * inconnu » et « mot de passe faux » publierait la liste des comptes existants.
 * On compare donc les DEUX phrases, mot pour mot, sur le document rendu.
 *
 * Les quatre passages — Chromium × WebKit, clair × sombre — sont produits par
 * les projets de `playwright.config.ts` et la boucle de thème ci-dessous.
 */

/** Les phrases du lexique. Elles font foi, et le test les cite mot pour mot. */
const LEXIQUE = {
  identifiantsInvalides: 'Identifiant ou mot de passe incorrect',
  identifiantAbsent: 'Indiquez un numéro de téléphone ou une adresse e-mail.',
  resteraConnecte: 'Vous resterez connectée sur cet appareil.',
  peutRedemander: 'Cet appareil peut vous redemander votre identifiant.',
} as const

for (const schema of ['light', 'dark'] as const) {
  const theme = nomDuTheme(schema)

  test.describe(`R0 · thème ${theme}`, () => {
    test.use({ colorScheme: schema })

    test('les sept gestes du quickstart, du début à la fin', async ({ page }) => {
      // ── 1 · une route du produit sans session mène à la connexion, et
      //      l'adresse demandée est retenue ────────────────────────────────
      //
      // ⚠️ LA ROUTE VISÉE EST `/mes-envois`, PAS `/`, TANT QUE LA RACINE
      // REDIRIGE. `app/pages/index.vue` porte encore la redirection de F1 vers
      // l'index des écrans, et une redirection de route se résout avant que
      // l'intergiciel n'ait à trancher : le test constaterait `/_ecrans` et
      // conclurait à tort que la garde ne tient pas. **Le pas 1 du quickstart
      // sur `/` est repris par `accueil-variantes.spec.ts`**, quand la racine
      // sert `R1`.
      await page.goto('/mes-envois', { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/\/connexion\?vers=/)
      await expect(page.locator('[data-ecran="R0"]')).toBeVisible()

      // ⚠️ PAS D'EN-TÊTE DE CONTEXTE (FR-009). Avant l'entrée il n'y a ni
      // établissement, ni poste, ni personne : un sélecteur vide serait un
      // mensonge. Et le dépôt n'a qu'un `<header>` — celui-ci n'en est pas un
      // second, il est absent.
      await expect(page.locator('header')).toHaveCount(0)
      await expect(page.locator('main')).toHaveCount(1)

      // ── 2 · LIRE AVANT DE TAPER : l'annonce précède le formulaire ────────
      const annonce = page.locator('[data-annonce="persistance"]')
      await expect(annonce).toBeVisible()
      const texteAnnonce = await annonce.innerText()
      expect(
        [LEXIQUE.resteraConnecte, LEXIQUE.peutRedemander].some((phrase) =>
          texteAnnonce.includes(phrase),
        ),
        `l'annonce ne porte aucune des deux phrases : « ${texteAnnonce} »`,
      ).toBe(true)

      // Elle est AU-DESSUS du formulaire — sous lui, elle se lirait après la
      // saisie, et l'exigence tomberait sans qu'un mot change.
      const yAnnonce = (await annonce.boundingBox())?.y ?? 0
      const yFormulaire = (await page.locator('[data-bloc="formulaire"]').boundingBox())?.y ?? 0
      expect(yAnnonce, "l'annonce est sous le formulaire").toBeLessThan(yFormulaire)

      // ── 4 · un identifiant inconnu : LA phrase ──────────────────────────
      // (Le pas 3 vient après : on veut d'abord constater les refus.)
      await soumettreConnexion(page, '0799999999')
      await expect(page.locator('[data-echec]')).toContainText(LEXIQUE.identifiantsInvalides)
      const phraseInconnu = (await page.locator('[data-echec]').innerText()).trim()

      // ── 5 · LE PAS QUI COMPTE · mot de passe faux sur un compte qui existe,
      //      et LA MÊME PHRASE, mot pour mot ─────────────────────────────────
      await soumettreConnexion(page, COMPTES.adjoua, '')
      await expect(page.locator('[data-echec]')).toBeVisible()
      const phraseMotDePasseFaux = (await page.locator('[data-echec]').innerText()).trim()
      expect(
        phraseMotDePasseFaux,
        'compte inconnu et mot de passe faux ne disent pas la même chose — la liste des comptes est publiée',
      ).toBe(phraseInconnu)

      // Un compte SUSPENDU rend cette même phrase : le distinguer confirmerait
      // qu'il existe.
      await soumettreConnexion(page, COMPTES.suspendu)
      await expect(page.locator('[data-echec]')).toHaveText(phraseInconnu)

      // ── 6 · le champ vide a SA phrase — un défaut de saisie n'emprunte
      //      jamais la phrase d'échec de connexion ─────────────────────────
      await soumettreConnexion(page, '   ')
      await expect(page.locator('[data-echec]')).toContainText(LEXIQUE.identifiantAbsent)

      // ── 3 · le numéro national entre, complété par l'indicatif ───────────
      // Le test tape `0700000001` : c'est la normalisation qui pose `+225`, et
      // c'est bien `+2250700000001` que porte le compte du jeu (FR-002).
      await soumettreConnexion(page, COMPTES.adjoua)
      await expect(page).not.toHaveURL(/\/connexion/)

      // ── 7 · recharger : on reste entré, on ne repasse pas par R0 ─────────
      //
      // ⚠️ LE REBOND SE FAIT SUR `/`, QUI EXIGE UNE SESSION. Sur une route
      // publique, « on n'a pas été renvoyé à R0 » ne prouverait rien : la garde
      // ne s'y applique pas. Ici, une session perdue au rechargement ramènerait
      // à la connexion, et c'est exactement ce qu'on veut voir échouer.
      await page.goto('/', { waitUntil: 'networkidle' })
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page).not.toHaveURL(/\/connexion/)
      // Et l'en-tête est là, cette fois : il y a une session.
      await expect(page.locator('header [data-emplacement="etablissement"]')).toBeVisible()
    })

    test("l'adresse demandée est reprise après l'entrée (FR-010)", async ({ page }) => {
      // Quelqu'un ouvre un lien vers un écran précis. Le renvoyer à la racine
      // lui ferait refaire le chemin — et il ne saurait pas lequel.
      await page.goto('/mes-envois', { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/\/connexion\?vers=\/mes-envois/)
    })

    test("hors ligne, l'action DISPARAÎT et le bandeau dit pourquoi AVANT la saisie", async ({
      page,
    }) => {
      // ⚠️ NI GRISÉE, NI MISE EN FILE « AU CAS OÙ ». `compte` est de classe C au
      // registre : une entrée mise en file donnerait une session que le serveur
      // n'a jamais accordée. Le levier vit dans la couche de simulation, et
      // c'est le panneau Scénarios qui l'actionne — aucun composant ne sait
      // qu'un scénario existe.
      await page.goto('/_scenarios', { waitUntil: 'networkidle' })
      const levier = page.locator('[data-levier="hors-ligne"] [role="radio"]').nth(1)
      await levier.click()
      await expect(levier).toHaveAttribute('aria-checked', 'true')

      await page.goto('/connexion', { waitUntil: 'networkidle' })
      await expect(page.locator('[data-refus="hors-ligne"]')).toBeVisible()
      // L'ACTION EST ABSENTE — pas `disabled`, pas atténuée : absente du HTML.
      await expect(page.locator('[data-action="entrer"]')).toHaveCount(0)
      // Et le refus porte son versant positif : une interdiction sans issue est
      // vraie et inutile.
      await expect(page.locator('[data-refus="hors-ligne"]')).toContainText('réseau revient')
    })

    test('aucun mot proscrit ne franchit le document (FR-011)', async ({ page }) => {
      await page.goto('/connexion', { waitUntil: 'networkidle' })
      const document_ = (await page.locator('body').innerText()).toLowerCase()
      for (const proscrit of ['session', 'jeton', 'jwt', 'rafraîchissement', 'token']) {
        expect(
          document_.includes(proscrit),
          `« ${proscrit} » est visible sur R0 — c'est de la mécanique interne`,
        ).toBe(false)
      }
    })
  })
}
