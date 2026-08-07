import { expect, test, type Page } from '@playwright/test'

import { ECRANS_PRODUIT, INSTRUMENTS } from '../../app/core/ecrans/index'

import { entrer } from './outils/entrer'
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

/**
 * Les deux établissements que `quickstart.md` nomme, dans son ordre.
 *
 * ⚠️ `actionsAttendues` EST LE CŒUR DU PAS 10. « Résidence Test » n'a que
 * l'hébergement : Adjoua — gérante, caissière, réceptionniste **à Deloria** —
 * n'y a **aucun rôle**, donc aucune action. C'est ce qu'on veut voir : la
 * surface ne se casse pas, elle montre son état vide et propose une sortie.
 */
const ETABLISSEMENTS = [
  // ⚠️ NEUF DEPUIS LE CYCLE F2, ET LE CHANGEMENT EST VOULU. Le rôle `gerant`
  // portait « appliquer une remise » sans porter « prendre une commande » —
  // c'est-à-dire le droit de corriger une commande sans celui d'en ouvrir une.
  // Le manque ne se voyait pas tant qu'aucun écran ne composait par permission ;
  // il rendait l'accueil du maquis vide pour Yao, qui en est le gérant. Adjoua
  // cumule désormais les neuf droits du catalogue, donc les neuf actions.
  { libelle: 'Résidence Hôtel Deloria', court: 'Deloria', actionsAdjoua: 9 },
  { libelle: 'Résidence Test', court: 'Résidence Test', actionsAdjoua: 0 },
] as const

/** Le compte de chaque parcours, choisi au panneau. */
const COMPTES = { adjoua: '+2250700000001', aminata: '+2250700000003' } as const

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
    // ── Pas 1 · la racine SERT L'ACCUEIL, et l'exige d'être entré ──────────
    //
    // ⚠️ CE PAS A CHANGÉ AU CYCLE F2, ET LE CHANGEMENT EST LE LIVRABLE. `/`
    // redirigeait vers l'index des écrans avec la mention « F2 y posera R1 » :
    // c'est fait. La racine est désormais une route du produit, donc protégée —
    // sans session, elle conduit à `R0`, en retenant l'adresse demandée.
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/connexion\?vers=/)
    await entrer(page, undefined, '/_ecrans')
    await expect(page.locator('[data-ecran="ecrans"]')).toBeVisible()

    // ── Pas 2 · l'index porte deux sections, 46 et 3 ────────────────────────
    // ⚠️ LES DEUX DÉCOMPTES VIENNENT DE L'INDEX, jamais d'un nombre écrit ici :
    // le jour où un écran entre au produit, ce test suit sans être touché.
    await expect(page.locator('[data-bloc="index"] > *')).toHaveCount(ECRANS_PRODUIT.length)
    await page.locator('[data-reglage="section"] [role="radio"]').nth(1).click()
    await expect(page.locator('[data-bloc="index"] > *')).toHaveCount(INSTRUMENTS.length)

    // ── Pas 4 · l'anglais, sans une seule clé brute ─────────────────────────
    // ⚠️ CE PAS N'ÉTAIT COUVERT PAR AUCUN TEST, et c'est le genre de défaut qui
    // ne se découvre qu'au jour où quelqu'un bascule la langue — c'est-à-dire
    // jamais, en développement. Une clé brute a une forme reconnaissable :
    // `groupe.sousGroupe`, en minuscules, sans espace ni accent.
    await page.locator('[data-reglage="langue"] [role="radio"]').nth(1).click()
    await expect(page.locator('[data-ecran="ecrans"] h1')).toHaveText('Screens')
    const clesBrutes = await page.evaluate(() => {
      const texte = document.body.innerText
      return [...texte.matchAll(/\b[a-z][a-zA-Z]*\.[a-z][a-zA-Z.]{3,}\b/g)]
        .map((m) => m[0])
        // Les routes et les chemins de fichier ne sont pas des clés : ils
        // portent une barre, et l'index en rend quarante-six.
        .filter((c) => !c.includes('/') && !/\.(html|ts|vue|css|md)$/.test(c))
    })
    expect(clesBrutes, `clés i18n brutes à l'écran : ${clesBrutes.join(' · ')}`).toEqual([])

    // Et le français revient — c'est la langue par défaut (principe 8).
    await page.locator('[data-reglage="langue"] [role="radio"]').nth(0).click()
    await expect(page.locator('[data-ecran="ecrans"] h1')).toHaveText('Écrans')

    // ── Le contexte : l'établissement du parcours ───────────────────────────
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page
      .locator('[data-levier="etablissement"] select')
      .selectOption({ label: etablissement.libelle })
    await expect(page.locator('[data-levier="etablissement"] select')).toHaveValue(/.+/)

    // ⚠️ ET LA BARRE LE DIT, SUR CHAQUE ÉCRAN. Le sélecteur d'établissement est
    // le repère d'orientation du produit — « savoir où on est avant de faire
    // quoi que ce soit ». Il a affiché « K », son initiale de repli, sur TOUS
    // les écrans jusqu'à ce qu'une capture le montre : rien ne le regardait,
    // parce qu'aucun test ne demandait au composant ce qu'il rend AVEC des
    // données.
    await expect(page.locator('header [data-composant-09]')).toContainText(etablissement.libelle)

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

    // ── Pas 12 (suite) · la latence produit un SQUELETTE, jamais une roue ────
    // ⚠️ LE SQUELETTE EST À LA FORME DU CONTENU À VENIR. La roue est réservée à
    // une attente réseau INDÉTERMINÉE, et une lecture qui répond n'en est pas
    // une : elle sait ce qu'elle va rendre, donc elle peut le dessiner.
    await page.goto('/_ecrans', { waitUntil: 'domcontentloaded' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()
    await expect(page.locator('[data-bloc="actions"][data-etat="chargement"]')).toBeVisible()
    await expect(page.locator('[data-bloc="actions"] [data-squelette]')).toBeVisible()
    await expect(page.locator('[data-bloc="actions"] [data-squelette="roue"]')).toHaveCount(0)
    // ⚠️ L'ÉTAT D'ARRIVÉE N'EST PAS LE MÊME SUR LES DEUX ÉTABLISSEMENTS, ET
    // C'EST LE PAS 10 QUI SE LIT ICI. Adjoua est gérante, caissière et
    // réceptionniste **à Deloria** ; elle n'a **aucun rôle** à Résidence Test,
    // donc aucune action — et la surface montre son état vide au lieu de se
    // casser. C'est le pendant en phase 2 du test d'agnosticité ETB-02c.
    const etatAttendu = etablissement.actionsAdjoua > 0 ? 'pret' : 'vide'
    await expect(
      page.locator(`[data-bloc="actions"][data-etat="${etatAttendu}"]`),
      `${etablissement.court} : la surface des actions n'est pas arrivée à « ${etatAttendu} »`,
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-action]')).toHaveCount(etablissement.actionsAdjoua)

    // Et la latence redescend, pour que la suite du parcours ne l'attende plus.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="latence"] input').fill('0')
    await page.locator('[data-levier="latence"] input').blur()
  })
}

/**
 * LES PAS 9, 10, 11 ET 13 — **la surface qui diffère selon qui regarde**.
 *
 * ⚠️ CE SONT LES PAS QUE `rapport-de-cycle.md` DÉCLARAIT NON LIVRÉS, et ils sont
 * groupés ici parce qu'ils portent tous sur la MÊME surface : la troisième
 * section de `/_ecrans`, la seule de ce cycle qui lise des données de domaine.
 */
test.describe('la surface des actions', () => {
  test('pas 9 · une action interdite est ABSENTE du HTML — ni grisée, ni disabled', async ({
    page,
  }) => {
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="etablissement"] select').selectOption({ label: 'Résidence Hôtel Deloria' })
    await page.locator('[data-levier="compte"] select').selectOption({ label: COMPTES.adjoua })

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()
    await expect(page.locator('[data-bloc="actions"][data-etat="pret"]')).toBeVisible()
    const chezAdjoua = await page.locator('[data-action]').count()
    expect(chezAdjoua, 'Adjoua ne voit aucune action : la surface est vide').toBeGreaterThan(1)
    await expect(page.locator('[data-action="caisse.cloture"]')).toBeVisible()

    // On passe à Aminata — serveuse, et rien d'autre.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="compte"] select').selectOption({ label: COMPTES.aminata })
    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()
    await expect(page.locator('[data-bloc="actions"][data-etat="pret"]')).toBeVisible()

    const chezAminata = await page.locator('[data-action]').count()
    expect(chezAminata, "l'écran ne diffère pas entre Adjoua et Aminata").toBeLessThan(chezAdjoua)

    // ⚠️ LE CONTRÔLE QUI COMPTE PORTE SUR LE HTML, PAS SUR UN ATTRIBUT.
    const html = await page.content()
    expect(
      html.includes('caisse.cloture'),
      "« Clôturer la caisse » est dans le HTML alors qu'Aminata n'y a pas droit",
    ).toBe(false)
    // Et rien n'a été grisé à la place d'un retrait.
    const grises = await page.locator('[data-bloc="actions"] [disabled], [data-bloc="actions"] [aria-disabled]').count()
    expect(grises, 'une action est grisée au lieu d’être absente').toBe(0)
  })

  test('pas 10 · un service absent est absent — le pendant d’ETB-02c', async ({ page }) => {
    // ⚠️ C'EST LE PAS LE PLUS RÉVÉLATEUR DU PARCOURS. Toute surface qui
    // supposerait une chambre, un article, un tarif ou une table se casse ici.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="compte"] select').selectOption({ label: COMPTES.aminata })
    await page.locator('[data-levier="etablissement"] select').selectOption({ label: 'Résidence Hôtel Deloria' })

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()
    await expect(page.locator('[data-action="ventes.commande.prendre"]')).toBeVisible()

    // Résidence Test n'a pas de restauration : l'action disparaît.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="etablissement"] select').selectOption({ label: 'Résidence Test' })
    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()

    await expect(page.locator('[data-bloc="actions"]')).toBeVisible()
    expect(
      (await page.content()).includes('ventes.commande.prendre'),
      "l'action d'un service inactif est dans le HTML",
    ).toBe(false)
  })

  test('pas 11 · le vide propose une porte de sortie, jamais une page blanche', async ({
    page,
  }) => {
    // Adjoua n'a aucun rôle sur Résidence Test : zéro action, donc l'état vide.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="compte"] select').selectOption({ label: COMPTES.adjoua })
    await page.locator('[data-levier="etablissement"] select').selectOption({ label: 'Résidence Test' })

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()

    const vide = page.locator('[data-bloc="actions"][data-etat="vide"] [data-composant-11]')
    await expect(vide).toBeVisible()
    // ⚠️ UN ÉCRAN VIDE SANS ACTION EST UNE IMPASSE. La phrase dit ce qui
    // apparaîtra, et l'action démarre quelque chose.
    await expect(vide.getByRole('button')).toBeVisible()
  })

  test("l'échec réseau et le hors-ligne ne se disent pas de la même façon", async ({ page }) => {
    // ⚠️ LES CONFONDRE FERAIT PROPOSER « RÉESSAYER » À QUELQU'UN QUI N'A PAS DE
    // RÉSEAU. Le premier est une panne qu'on réessaie ; le second est un fait
    // sur lequel l'utilisateur peut agir — attendre, se déplacer.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="compte"] select').selectOption({ label: COMPTES.adjoua })
    await page.locator('[data-levier="etablissement"] select').selectOption({ label: 'Résidence Hôtel Deloria' })
    await basculer(page, 'echec-reseau', true)

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()
    const erreur = page.locator('[data-bloc="actions"][data-etat="erreur"]')
    await expect(erreur).toBeVisible()
    await expect(erreur.getByRole('button')).toBeVisible()

    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await basculer(page, 'echec-reseau', false)
    await basculer(page, 'hors-ligne', true)
    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()

    const horsLigne = page.locator('[data-bloc="actions"][data-etat="horsLigne"]')
    await expect(horsLigne).toBeVisible()
    // Le hors-ligne ne propose PAS de réessayer, et il porte son versant positif.
    await expect(horsLigne.getByRole('button')).toHaveCount(0)
    await exigerAucunNomDetatInterne(page, '/_ecrans hors ligne')
  })

  test('pas 13 · une capacité absente le dit AVANT, et propose l’alternative', async ({ page }) => {
    // ⚠️ SUR WEBKIT LA PHRASE S'AFFICHE, SUR CHROMIUM NON — et c'est un FAIT à
    // afficher, pas un bogue à corriger. WebUSB et Web Bluetooth sont absents de
    // Safari ; Capacitor les fera disparaître.
    await page.goto('/_scenarios', { waitUntil: 'networkidle' })
    await page.locator('[data-levier="compte"] select').selectOption({ label: COMPTES.adjoua })
    await page.locator('[data-levier="etablissement"] select').selectOption({ label: 'Résidence Hôtel Deloria' })

    await page.goto('/_ecrans', { waitUntil: 'networkidle' })
    await page.locator('[data-reglage="section"] [role="radio"]').nth(2).click()
    await expect(page.locator('[data-bloc="actions"][data-etat="pret"]')).toBeVisible()

    const annonce = page.locator('[data-capacite-absente]')
    if (test.info().project.name === 'webkit') {
      await expect(annonce).toBeVisible()
      await expect(annonce).toContainText("l'imprimante de la réception")
      // ⚠️ L'ACTION N'EST PAS RETIRÉE : encaisser reste possible sans
      // imprimante, c'est le TICKET qui part ailleurs.
      await expect(page.locator('[data-action="caisse.encaisser"]')).toBeVisible()
      // Et une seule annonce : jamais deux bandeaux empilés.
      await expect(annonce).toHaveCount(1)
    } else {
      await expect(annonce).toHaveCount(0)
      await expect(page.locator('[data-action="caisse.encaisser"]')).toBeVisible()
    }
  })
})
