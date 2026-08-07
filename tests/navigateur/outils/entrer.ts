import { expect, type Page } from '@playwright/test'

/**
 * ENTRER DANS L'APPLICATION, DEPUIS `R0` — l'outil que toute suite qui vise un
 * écran du produit emploie d'abord.
 *
 * ⚠️ IL PASSE PAR L'ÉCRAN, PAS PAR LE STOCKAGE. Poser une session directement en
 * IndexedDB serait plus court et prouverait moins : ce qu'on veut vérifier, à
 * chaque suite, c'est que le chemin d'entrée réel fonctionne sur les deux
 * moteurs. Un test qui contourne l'écran laisserait `R0` cassé sans que rien ne
 * rougisse.
 *
 * ⚠️ ET L'IDENTIFIANT EST SAISI **SANS INDICATIF**, comme l'exploitant le tape.
 * C'est la normalisation qui le complète (FR-002) — un `+225` écrit ici ferait
 * passer le test par une porte que personne n'emprunte.
 */

/** Les comptes du jeu, sous la forme nationale — celle qu'on tape. */
export const COMPTES = {
  adjoua: '0700000001',
  yao: '0700000002',
  aminata: '0700000003',
  koffi: '0700000004',
  /** Le compte de Mariam — au jeu, et SUSPENDU. Il ne doit jamais entrer. */
  suspendu: '0700000005',
} as const

/**
 * Saisit un identifiant et un mot de passe, et soumet.
 * N'attend AUCUN résultat : c'est à l'appelant de dire ce qu'il espère.
 */
export async function soumettreConnexion(
  page: Page,
  identifiant: string,
  motDePasse = 'peu-importe',
): Promise<void> {
  await page.locator('[data-champ="identifiant"] input').fill(identifiant)
  await page.locator('[data-champ="mot-de-passe"] input').fill(motDePasse)
  await page.locator('[data-action="entrer"]').click()
}

/** Entre avec un compte du jeu, et exige d'être arrivé quelque part. */
export async function entrer(
  page: Page,
  identifiant: string = COMPTES.adjoua,
  vers = '/',
): Promise<void> {
  await page.goto(`/connexion?vers=${encodeURIComponent(vers)}`, { waitUntil: 'networkidle' })
  await soumettreConnexion(page, identifiant)
  await expect(page, "l'entrée n'a pas abouti — on est resté sur R0").not.toHaveURL(/\/connexion/)
}
