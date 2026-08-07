import { openDB, type IDBPDatabase } from 'idb'

/**
 * LA BASE LOCALE — un seul magasin IndexedDB pour toute la coquille.
 *
 * ⚠️ POURQUOI IndexedDB ET NON `localStorage`. `localStorage` est SYNCHRONE et
 * bloque le fil principal à chaque lecture comme à chaque écriture. La persona
 * Aminata travaille sur un Android d'entrée de gamme à 2 Go, et le budget est de
 * 60 images/s : une file de cinquante écritures relue au démarrage bloquerait le
 * premier rendu. Seul le THÈME reste en `localStorage`, parce qu'il doit être lu
 * AVANT le premier pixel — voir `app/core/plateforme/web/preferenceAppareil.ts`.
 *
 * ⚠️ UNE SEULE BASE, TROIS MAGASINS. Trois bases porteraient trois versions à
 * faire évoluer ensemble, et la première migration oubliée serait silencieuse.
 *
 * ⚠️ ET RIEN DE CLASSE B, C OU D N'Y ENTRE EN CACHE D'ÉCRITURE (cadrage §11.5
 * point 4). Le magasin `file` ne reçoit que des opérations de classe A ; le
 * refus des trois autres classes est prononcé AVANT, par `app/core/file/`.
 */

export const NOM_BASE = 'kaya'
export const VERSION_BASE = 1

/** Les trois magasins, et ce que chacun porte. */
export const MAGASIN_SESSION = 'session'
export const MAGASIN_FILE = 'file'
export const MAGASIN_SCENARIOS = 'scenarios'

export const MAGASINS = [MAGASIN_SESSION, MAGASIN_FILE, MAGASIN_SCENARIOS] as const
export type Magasin = (typeof MAGASINS)[number]

let promesse: Promise<IDBPDatabase> | null = null

/**
 * Ouvre la base — une seule fois par document, quel que soit le nombre
 * d'appelants. Deux ouvertures concurrentes déclencheraient deux migrations.
 */
export function ouvrirBase(): Promise<IDBPDatabase> {
  promesse ??= openDB(NOM_BASE, VERSION_BASE, {
    upgrade(base) {
      for (const magasin of MAGASINS) {
        if (!base.objectStoreNames.contains(magasin)) base.createObjectStore(magasin)
      }
    },
  })
  return promesse
}

/**
 * Lit une valeur, ou rend le repli.
 *
 * ⚠️ TOUTE LECTURE EST TOLÉRANTE À L'ÉCHEC. Sur WebKit en navigation privée, et
 * après une purge de stockage — que le navigateur PEUT décider seul —,
 * l'ouverture échoue. Ce n'est pas une panne du produit : c'est un appareil qui
 * repart de zéro, et le ré-enrôlement doit rester simple.
 */
export async function lire<T>(magasin: Magasin, cle: string, repli: T): Promise<T> {
  try {
    const base = await ouvrirBase()
    const valeur = await base.get(magasin, cle)
    return (valeur as T | undefined) ?? repli
  } catch {
    return repli
  }
}

export async function ecrire<T>(magasin: Magasin, cle: string, valeur: T): Promise<void> {
  try {
    const base = await ouvrirBase()
    await base.put(magasin, valeur, cle)
  } catch {
    // Une préférence qui ne se persiste pas est un désagrément ; une exception
    // non rattrapée au milieu d'une navigation est un écran blanc.
  }
}

export async function supprimer(magasin: Magasin, cle: string): Promise<void> {
  try {
    const base = await ouvrirBase()
    await base.delete(magasin, cle)
  } catch {
    // idem
  }
}

/** Toutes les valeurs d'un magasin, dans l'ordre des clés. */
export async function lireTout<T>(magasin: Magasin): Promise<T[]> {
  try {
    const base = await ouvrirBase()
    return (await base.getAll(magasin)) as T[]
  } catch {
    return []
  }
}

/** N'est employé que par les tests et par le levier « repartir de zéro ». */
export async function viderMagasin(magasin: Magasin): Promise<void> {
  try {
    const base = await ouvrirBase()
    await base.clear(magasin)
  } catch {
    // idem
  }
}
