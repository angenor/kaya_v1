import { echec, reussite, type ResultatDomaine } from '~/core/donnees/contrat'
import { attendreLatence, reglagesCourants } from '~/core/scenarios/reglages'

/**
 * L'ENDROIT — ET LE SEUL — OÙ LES LEVIERS DE SCÉNARIO S'APPLIQUENT.
 *
 * ⚠️ JAMAIS DANS UN COMPOSANT. Un composant qui saurait qu'un scénario existe
 * serait un composant à réécrire en phase 3. La simulation, elle, DISPARAÎT au
 * branchement — et les leviers avec elle. « Les scénarios sont une propriété de
 * la source de données, pas de l'écran qui l'affiche. »
 *
 * ⚠️ L'ORDRE DES LEVIERS N'EST PAS INDIFFÉRENT. Hors ligne d'abord — c'est le
 * plus grave et il se prononce AVANT la tentative ; puis l'échec réseau, qui
 * suppose qu'on ait essayé ; puis la latence, qui n'a de sens que si l'on
 * répond ; puis le jeu vide, qui porte sur ce qu'on rend.
 */
export async function lireSimule<T>(
  produire: () => T,
  vide: T,
): Promise<ResultatDomaine<T>> {
  const reglages = reglagesCourants()

  if (reglages.horsLigne) return echec<T>('HORS_LIGNE')
  if (reglages.echecReseau) return echec<T>('ECHEC_RESEAU')

  await attendreLatence()

  return reussite(reglages.jeuVide ? vide : produire())
}

/** Le cas d'une lecture unitaire : l'absence est `INTROUVABLE`, pas un vide. */
export async function lireUnSimule<T>(
  produire: () => T | undefined,
): Promise<ResultatDomaine<T>> {
  const reglages = reglagesCourants()

  if (reglages.horsLigne) return echec<T>('HORS_LIGNE')
  if (reglages.echecReseau) return echec<T>('ECHEC_RESEAU')

  await attendreLatence()

  if (reglages.jeuVide) return echec<T>('INTROUVABLE')
  const valeur = produire()
  return valeur === undefined ? echec<T>('INTROUVABLE') : reussite(valeur)
}
