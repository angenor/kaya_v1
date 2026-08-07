/**
 * LE JOURNAL DE REPRISE — la trace observable de l'intergiciel global.
 *
 * ⚠️ POURQUOI IL ÉCRIT DANS LE DOCUMENT ET NON DANS LA CONSOLE. « Un journal
 * prouve que l'intergiciel s'exécute à la première navigation comme aux
 * suivantes » : une ligne de console n'est ni lisible par un test de navigateur
 * sans instrumentation, ni consultable par quelqu'un qui ouvre l'inspecteur au
 * milieu d'une démonstration. Deux attributs de données sur la racine le sont,
 * et ils ne coûtent rien.
 *
 * Ce n'est pas de la mise en page : `data-*` ne porte aucun style, et aucun
 * sélecteur du produit ne le lit. C'est un instrument, au même titre que le
 * panneau Scénarios.
 */

export const MARQUE_DECOMPTE = 'repriseSession'
export const MARQUE_DERNIER_CHEMIN = 'repriseChemin'

/** Consigne une reprise de session, et rend le décompte atteint. */
export function consignerReprise(chemin: string): number {
  const racine = document.documentElement
  const decompte = Number.parseInt(racine.dataset[MARQUE_DECOMPTE] ?? '0', 10) + 1
  racine.dataset[MARQUE_DECOMPTE] = String(decompte)
  racine.dataset[MARQUE_DERNIER_CHEMIN] = chemin
  return decompte
}

/** Le nombre de reprises consignées depuis le chargement du document. */
export function repriseDecompte(): number {
  return Number.parseInt(document.documentElement.dataset[MARQUE_DECOMPTE] ?? '0', 10)
}

/** Le chemin de la dernière reprise consignée. */
export function repriseDernierChemin(): string | null {
  return document.documentElement.dataset[MARQUE_DERNIER_CHEMIN] ?? null
}
