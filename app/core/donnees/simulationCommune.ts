import { echec, reussite, type ResultatDomaine } from '~/core/donnees/contrat'
import { accepteHorsLigne, classeOuDefautStrict } from '~/core/file/classes'
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

/**
 * LA GARDE D'UNE ÉCRITURE — **prononcée AVANT toute tentative**.
 *
 * ⚠️ **ELLE VIT ICI, DANS LA FONCTION D'APPEL, ET JAMAIS DANS UN COMPOSANT**
 * (module doré, point 6). *Un second appelant oublierait de la reposer, et la
 * faute ne se verrait qu'en clientèle.* L'écran, lui, **fait disparaître
 * l'action** hors ligne ; les deux gardes ne se remplacent pas — l'une protège
 * la donnée, l'autre évite de promettre ce qu'on ne peut pas tenir.
 *
 * ⚠️ **LA CLASSE EST LUE AU REGISTRE, JAMAIS RECOPIÉE.** `operation` nomme
 * **l'entité pivot du geste** — celle que `docs/registre-classes-offline.md`
 * classe. Le passage écrit cinq lignes en un tap ; sa classe est celle de
 * l'occupation, qui est la plus stricte des cinq.
 *
 * ⚠️ **ET LE REFUS PRÉCÈDE L'ÉCRITURE, il ne la rattrape pas** : aucune donnée
 * de classe B, C ou D n'entre en cache d'écriture (cadrage §11.5, point 4).
 * Jamais « mise en file au cas où ».
 */
export async function ecrireSimule<T>(
  operation: string,
  produire: () => ResultatDomaine<T>,
): Promise<ResultatDomaine<T>> {
  const reglages = reglagesCourants()
  const classe = classeOuDefautStrict(operation)

  if (reglages.horsLigne && !accepteHorsLigne(classe)) return echec<T>('HORS_LIGNE')
  if (reglages.echecReseau) return echec<T>('ECHEC_RESEAU')

  await attendreLatence()

  return produire()
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
