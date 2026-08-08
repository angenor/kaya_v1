import { expect, type Page } from '@playwright/test'

/**
 * LE PANNEAU SCÉNARIOS, VU DEPUIS UNE SUITE DE NAVIGATEUR — **le seul chemin
 * par lequel une suite met l'application dans un état donné**.
 *
 * ⚠️ CES FONCTIONS VIVENT ICI PARCE QUE **DEUX SUITES LES EMPLOIENT** :
 * `accueil-variantes.spec.ts` choisit un contexte, `etats-degrades.spec.ts`
 * choisit un contexte **et** actionne des leviers. Une seconde copie
 * divergerait, et c'est toujours la plus faible qu'on croirait.
 *
 * ⚠️ ET LE CONTEXTE SE CHOISIT COMME UN RELECTEUR LE FERAIT — en désignant un
 * compte et un site au panneau. Poser une session dans le stockage irait plus
 * vite et prouverait moins : ce qui doit fonctionner, c'est l'instrument que le
 * cycle livre, pas une porte dérobée qu'aucune démonstration n'emprunte.
 */

export const DELORIA = 'deloria-etablissement'
export const MAQUIS = 'tantie-adjo-etablissement'

/** Les quatre leviers booléens du panneau, tels que leur attribut les nomme. */
export type Levier = 'jeu-vide' | 'echec-reseau' | 'hors-ligne' | 'version-nouvelle'

/** Ouvre le panneau et attend qu'il ait résolu son contexte. */
export async function ouvrirLePanneau(page: Page): Promise<void> {
  await page.goto('/_scenarios', { waitUntil: 'networkidle' })
  await expect(page.locator('[data-ecran="scenarios"]')).toBeVisible()
}

/**
 * Choisit compte et établissement au panneau — comme un relecteur.
 *
 * ⚠️ ON ATTEND QUE LE CONTEXTE SOIT RÉSOLU AVANT DE NAVIGUER, ET CE N'EST PAS
 * UNE PRÉCAUTION D'ÉCRITURE. Le panneau résout les permissions et persiste en
 * IndexedDB — deux opérations asynchrones. Naviguer pendant qu'un module se
 * charge fait échouer l'import sur **WebKit** (« Importing a module script
 * failed »), et le test rougissait alors sur un artefact de course, jamais sur
 * un défaut du produit. Le panneau affiche le compte résolu : on attend qu'il
 * le dise.
 */
export async function poserLeContexte(
  page: Page,
  compteId: string,
  etablissementId: string,
): Promise<void> {
  await ouvrirLePanneau(page)
  await page.locator('[data-levier="compte"] select').selectOption(compteId)
  await page.locator('[data-levier="etablissement"] select').selectOption(etablissementId)
  await expect(page.locator('[data-ecran="scenarios"]')).toContainText(compteId)
}

/**
 * Actionne un levier booléen. Le panneau doit être ouvert.
 *
 * ⚠️ ON ATTEND QUE LE SEGMENT SE MARQUE COCHÉ. Le réglage est posé en mémoire
 * **avant** d'être persisté ; l'attribut est donc le premier fait observable, et
 * l'attendre suffit à ce que la navigation suivante parte sur le bon état.
 */
export async function poserLevier(page: Page, levier: Levier, actif: boolean): Promise<void> {
  const bouton = page.locator(`[data-levier="${levier}"] [role="radio"]`).nth(actif ? 1 : 0)
  await bouton.click()
  await expect(bouton).toHaveAttribute('aria-checked', 'true')
}

/** Pose la latence, en millisecondes. Le panneau doit être ouvert. */
export async function poserLatence(page: Page, millisecondes: number): Promise<void> {
  const champ = page.locator('[data-levier="latence"] input')
  await champ.fill(String(millisecondes))
  await champ.blur()
  await expect(champ).toHaveValue(String(millisecondes))
}

/**
 * Ouvre `R1` et attend qu'**aucune rubrique ne soit plus en chargement**.
 *
 * ⚠️ JAMAIS UN DÉLAI FIXE : la composition est asynchrone, et un délai rougirait
 * selon la machine. L'état de chargement est porté par la rubrique elle-même —
 * on lit ce que l'écran dit de lui-même.
 */
export async function ouvrirLAccueil(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('[data-ecran="R1"]')).toBeVisible()
  await expect(page.locator('[data-rubrique][data-etat="chargement"]')).toHaveCount(0)
}
