import { expect, test, type Page } from '@playwright/test'

import { ECRANS_PRODUIT, INSTRUMENTS } from '../../app/core/ecrans/index'

import { exigerAucunNomDetatInterne } from './outils/mesures'

/**
 * **LES DEUX PARCOURS COMPLETS DE LA PORTE P-04** — `quickstart.md`, rejoué sur
 * les deux moteurs et sur les **deux établissements**.
 *
 * ⚠️ LE SECOND PARCOURS EST LE PENDANT EN PHASE 2 DU TEST D'AGNOSTICITÉ
 * **ETB-02c**, et c'est le pas le plus révélateur du lot. « Résidence Test »
 * n'a **qu'un service** — l'hébergement — et **aucun point de vente** : toute
 * surface de la coquille qui supposerait une chambre, un article, un tarif ou
 * une table **se casse ici**. C'est le moment le moins cher pour le découvrir ;
 * en phase 3 il coûterait un écran à refaire.
 *
 * ⚠️ ET LES DEUX ÉTABLISSEMENTS SONT NOMMÉS PAR LEUR LIBELLÉ, PAS PAR LEUR
 * IDENTIFIANT. Le test choisit dans la liste que l'écran propose, comme le fera
 * l'exploitant : un identifiant lu dans le jeu de données ferait passer le test
 * par une porte que personne n'emprunte.
 */

/** Les deux établissements que `quickstart.md` nomme, dans son ordre. */
const ETABLISSEMENTS = [
  { libelle: 'Résidence Hôtel Deloria', court: 'Deloria' },
  { libelle: 'Résidence Test', court: 'Résidence Test' },
] as const

/** Les libellés du lexique — ils font foi, et le test les cite mot pour mot. */
const LEXIQUE = {
  horsConnexion: 'Hors connexion',
  connexionFaible: 'Connexion faible',
  enAttente: (n: number) => `En attente d'envoi (${n})`,
  refus: 'Cette action nécessite internet.',
} as const

const SEUIL_DEGRADE_MS = 3000

function temoin(page: Page) {
  return page.locator('header [data-emplacement="temoin"] [role="status"]')
}

/** Actionne un levier à deux options du panneau Scénarios. */
async function basculer(page: Page, levier: string, actif: boolean): Promise<void> {
  const bouton = page.locator(`[data-levier="${levier}"] [role="radio"]`).nth(actif ? 1 : 0)
  await bouton.click()
  await expect(bouton).toHaveAttribute('aria-checked', 'true')
}

for (const etablissement of ETABLISSEMENTS) {
  test(`parcours de bout en bout · ${etablissement.court}`, async ({ page }) => {
    // ── Pas 1 · la racine mène à l'index ────────────────────────────────────
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/_ecrans$/)
    await expect(page.locator('[data-ecran="ecrans"]')).toBeVisible()

    // ── Pas 2 · l'index porte deux sections, 46 et 3 ────────────────────────
    // ⚠️ LES DEUX DÉCOMPTES VIENNENT DE L'INDEX, jamais d'un nombre écrit ici :
    // le jour où un écran entre au produit, ce test suit sans être touché.
    await expect(page.locator('[data-bloc="index"] > *')).toHaveCount(ECRANS_PRODUIT.length)
    await page.locator('[data-reglage="section"] [role="radio"]').nth(1).click()
    await expect(page.locator('[data-bloc="index"] > *')).toHaveCount(INSTRUMENTS.length)

    // ── Le contexte : l'établissement du parcours ───────────────────────────
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page
      .locator('[data-levier="etablissement"] select')
      .selectOption({ label: etablissement.libelle })
    await expect(page.locator('[data-levier="etablissement"] select')).toHaveValue(/.+/)

    // ── Pas 5 · hors ligne, instantanément ──────────────────────────────────
    await basculer(page, 'hors-ligne', true)
    await expect(temoin(page).first()).toContainText(LEXIQUE.horsConnexion)
    // ⚠️ LES TROIS NOMS D'ÉTAT INTERNES NE FRANCHISSENT PAS LE HTML (SC-022).
    await exigerAucunNomDetatInterne(page, `/_scenarios · ${etablissement.court}`)

    // ── Pas 6 · une écriture de classe A entre dans la file ─────────────────
    // Le levier nomme l'OPÉRATION — « une note interne » —, jamais la classe.
    await page.locator('[data-levier="classe"] [role="radio"]').first().click()
    await page.getByRole('button', { name: /Lancer/i }).click()
    await expect(page.locator('[data-acceptation]')).toBeVisible()
    await expect(temoin(page).first()).toContainText(LEXIQUE.enAttente(1))

    // ── Pas 7 · une écriture de classe C est REFUSÉE — la propriété testée ──
    // ⚠️ C'EST LE PAS QUI COMPTE. Un écran qui accepterait ici ce que le serveur
    // refusera en phase 3 est un écran à refaire, et le mensonge ne se
    // découvrirait qu'au branchement.
    await page.locator('[data-levier="classe"] [role="radio"]').nth(2).click()
    await page.getByRole('button', { name: /Lancer/i }).click()
    const refus = page.locator('[data-refus]')
    await expect(refus).toBeVisible()
    await expect(refus).toContainText(LEXIQUE.refus)
    // Toute interdiction a son versant positif : le bandeau porte les DEUX.
    const texteRefus = (await refus.innerText()).trim()
    expect(
      texteRefus.length,
      'le refus ne porte que son interdiction — il manque ce qui reste possible',
    ).toBeGreaterThan(LEXIQUE.refus.length + 20)
    // ⚠️ ET LA LETTRE DE LA CLASSE N'APPARAÎT NULLE PART (D-04).
    expect(
      /\bclasse\s+[ABCD]\b/i.test(await page.content()),
      'la lettre de la classe hors-ligne est dans le HTML — c’est une mécanique interne',
    ).toBe(false)
    // Le refus n'a rien mis en file : la file « au cas où » est proscrite.
    await expect(temoin(page).first()).toContainText(LEXIQUE.enAttente(1))

    // ── Pas 8 · la file survit au rechargement ──────────────────────────────
    // ⚠️ ET ELLE Y SURVIT **HORS LIGNE** : c'est le seul moment où la propriété
    // vaut quelque chose. Une file qui ne survivrait qu'en ligne ne servirait à
    // rien — c'est justement en coupure que le travail doit tenir.
    await page.reload({ waitUntil: 'networkidle' })
    await expect(temoin(page).first()).toContainText(LEXIQUE.enAttente(1))
    // La barre, elle, est reconstruite intacte : le sélecteur ne disparaît pas.
    await expect(
      page.locator('header [data-emplacement="etablissement"]'),
      "le sélecteur d'établissement a disparu de la barre",
    ).toBeVisible()

    // ── Le réseau revient, et la liste des établissements avec lui ──────────
    // ⚠️ CONSTAT DU PARCOURS, ET IL VAUT D'ÊTRE ÉCRIT : rechargé HORS LIGNE, le
    // panneau ne peut plus lister les établissements — la lecture passe par la
    // même couture que l'écriture, et la couture refuse. Le sélecteur revient
    // dès le retour du réseau. **Ce que ce test n'exige pas encore, c'est que
    // l'absence soit ANNONCÉE plutôt que silencieuse** : c'est l'état « hors
    // ligne » de T034, et c'est là qu'il se vérifiera.
    await basculer(page, 'hors-ligne', false)
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('[data-levier="etablissement"] select')).toHaveValue(/.+/)

    // ── Pas 12 · la latence produit « Connexion faible » ────────────────────
    // ⚠️ LA FILE PRIME SUR L'ÉTAT DU RÉSEAU (data-model.md §6.4) : tant qu'elle
    // n'est pas vide, le témoin dit « En attente d'envoi (n) » quoi qu'il
    // arrive. On la vide donc AVANT de régler la latence — sans quoi le test
    // attendrait un libellé que le produit a raison de ne pas afficher.
    await page.locator('[data-bloc="file"] button').last().click()
    await expect(page.locator('[data-bloc="file"] [data-composant-11]')).toBeVisible()

    const latence = page.locator('[data-levier="latence"] input')
    await latence.fill(String(SEUIL_DEGRADE_MS + 1000))
    await latence.blur()
    await expect(temoin(page).first()).toContainText(LEXIQUE.connexionFaible)
  })
}
