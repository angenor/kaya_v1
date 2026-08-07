import type { ClasseHorsLigne } from '~/core/donnees/contrat'
import registreBrut from '~/core/file/registre-classes.json'

/**
 * LA CLASSE HORS-LIGNE D'UNE OPÉRATION — LUE DEPUIS LE REGISTRE, JAMAIS
 * RECOPIÉE DANS UN COMPOSANT.
 *
 * ⚠️ `docs/registre-classes-offline.md` FAIT FOI (constitution, principe 6). Le
 * fichier JSON qu'on lit ici en est l'EXTRACTION, engendrée par
 * `scripts/classes/extraire-registre.mjs` et commitée — et un test confronte les
 * deux. Recopier une classe dans un composant produirait une divergence qui ne
 * se verrait qu'à la première coupure réseau en exploitation.
 *
 * ⚠️ ET LA LETTRE DE LA CLASSE N'ATTEINT JAMAIS L'ÉCRAN. Le lexique est
 * formel : « Classe hors-ligne A/B/C/D — N'APPARAÎT JAMAIS. L'utilisateur voit
 * "disponible hors connexion" ou "nécessite internet". »
 */

const REGISTRE = registreBrut as Readonly<Record<string, ClasseHorsLigne>>

/** Rend la classe d'une entité ou d'une opération, ou `null` si inconnue. */
export function classeDe(nom: string): ClasseHorsLigne | null {
  return REGISTRE[nom] ?? null
}

/**
 * ⚠️ EN CAS DE DOUTE, ON CLASSE PLUS STRICTEMENT. Le registre le dit : « une
 * entité indûment classée A produit des écritures qu'on ne peut pas
 * réconcilier ». Une opération inconnue est donc traitée comme un **C** — elle
 * sera refusée hors ligne, ce qui est réparable ; l'inverse ne l'est pas.
 */
export function classeOuDefautStrict(nom: string): ClasseHorsLigne {
  return classeDe(nom) ?? 'C'
}

/** La classe A est la SEULE qui s'écrit hors ligne (cadrage §11.1). */
export function accepteHorsLigne(classe: ClasseHorsLigne): boolean {
  return classe === 'A'
}

/** Le nombre d'entrées extraites — employé par le plancher du test. */
export function tailleDuRegistre(): number {
  return Object.keys(REGISTRE).length
}
