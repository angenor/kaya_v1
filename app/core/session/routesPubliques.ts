/**
 * QUELLES ROUTES S'ATTEIGNENT SANS SESSION — **et, par là même, quels écrans
 * portent l'en-tête**.
 *
 * ⚠️ CE MODULE EST PUR, ET C'EST TOUT SON INTÉRÊT. L'intergiciel global
 * l'emploie pour rediriger ; la suite de navigateur l'emploie pour savoir si un
 * écran doit porter l'en-tête. **Un intergiciel Nuxt ne s'importe pas hors de
 * Nuxt** — il appelle `defineNuxtRouteMiddleware`, qui n'existe qu'à
 * l'exécution —, et le constat est venu du test : la suite refusait de charger.
 * Écrire la règle ici la rend lisible des deux côtés, sans seconde liste.
 *
 * ⚠️ ET C'EST LA RESTRICTION LITTÉRALE DE FR-025 : l'en-tête permanent est dû
 * aux écrans du produit « atteints **avec une session** ». Sans elle, FR-009 —
 * « `R0` ne porte pas l'en-tête » — la contredirait, et c'est la plus faible des
 * deux qui aurait cédé à l'implémentation.
 */

/**
 * ⚠️ LES INSTRUMENTS N'Y FIGURENT PAS NOMMÉMENT : ils sont reconnus au trait bas
 * de leur route. Le panneau Scénarios est **ce par quoi on choisit un compte**
 * en phase 2 — l'enfermer derrière la connexion rendrait les quatre variantes
 * inatteignables —, et le guide de style n'affiche aucune donnée. Un exploitant
 * ne voit jamais ces routes. **Cette exemption disparaît en phase 3 avec les
 * instruments.**
 */
export const ROUTES_SANS_SESSION: readonly string[] = ['/connexion']

export function exigeUneSession(chemin: string): boolean {
  if (ROUTES_SANS_SESSION.includes(chemin)) return false
  return !chemin.startsWith('/_')
}

/**
 * LES ROUTES QUI NE PORTENT PAS L'EN-TÊTE — celles du gabarit `vierge`.
 *
 * ⚠️ CE N'EST **PAS** LA MÊME LISTE QUE CI-DESSUS, MÊME SI ELLES COÏNCIDENT
 * AUJOURD'HUI. Les deux notions se sont confondues une fois, et le test l'a
 * attrapé : les instruments — `/_ecrans`, `/_scenarios`, `/_guide-de-style` —
 * n'exigent **aucune session** et portent pourtant l'en-tête, puisqu'ils
 * emploient le gabarit par défaut. Les fondre en une seule liste faisait exiger
 * zéro `<header>` sur trois écrans qui en ont un.
 *
 * ⚠️ ET LA RAISON DE CHACUNE EST DIFFÉRENTE. « Sans session » dit ce que
 * l'intergiciel laisse passer ; « sans en-tête » dit quel gabarit la page
 * emploie. `R0` est dans les deux pour un seul et même motif — avant l'entrée
 * il n'y a ni établissement, ni poste, ni personne à afficher — mais rien ne
 * garantit que le prochain écran qui rejoindra l'une rejoindra l'autre.
 */
export const ROUTES_SANS_ENTETE: readonly string[] = ['/connexion']

export function porteLEnTete(chemin: string): boolean {
  return !ROUTES_SANS_ENTETE.includes(chemin)
}
