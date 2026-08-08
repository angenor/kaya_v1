import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * LIRE LES COLONNES D'UNE TABLE **DANS LE FICHIER `.sql`** — l'extracteur, en
 * un seul endroit.
 *
 * ⚠️ **UN SEUL EXTRACTEUR, PARCE QUE DEUX AURAIENT DIVERGÉ.** Le cycle F1 avait
 * cet analyseur dans `conformite-modele.spec.ts` ; le cycle F3 en a besoin pour
 * les neuf types de mouvement. Le recopier aurait donné deux expressions
 * régulières à corriger le jour où le SQL change de forme — et la seconde ne
 * l'aurait pas été. *C'est le même raisonnement qui interdit de recopier une
 * classe hors-ligne dans un composant.*
 *
 * ⚠️ **ET IL N'Y A TOUJOURS PAS DE SECONDE LISTE À TENIR.** Ce module ne
 * déclare aucune colonne : il les lit. Une liste recopiée serait juste le jour
 * où on l'écrit, et fausse au premier `ALTER TABLE`.
 */

const racine = fileURLToPath(new URL('../../..', import.meta.url))
const MODELE = join(racine, 'docs/modele-donnees')

/** `snake_case` → `camelCase`. LE SEUL écart autorisé, et il est mécanique. */
export function enCamel(nom: string): string {
  return nom.replace(/_([a-z0-9])/g, (_, lettre: string) => lettre.toUpperCase())
}

/** Les colonnes déclarées par une table du modèle, dans l'ordre du fichier. */
export function colonnesDeLaTable(fichier: string, table: string): string[] {
  const contenu = readFileSync(join(MODELE, fichier), 'utf8')
  const bloc = contenu.match(
    new RegExp(`CREATE TABLE [a-z_]+\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, 'm'),
  )
  if (!bloc) throw new Error(`table introuvable dans ${fichier} : ${table}`)
  return [
    ...new Set(
      bloc[1]!
        .split('\n')
        .map((ligne) => ligne.trim())
        .filter((ligne) => /^[a-z_]+\s+[A-Za-z]/.test(ligne))
        .filter((ligne) => !/^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|EXCLUDE)\b/.test(ligne))
        .map((ligne) => ligne.split(/\s+/)[0]!),
    ),
  ]
}

/**
 * Les valeurs admises par une contrainte `CHECK (colonne IN (…))`.
 *
 * ⚠️ **C'EST CE QUI REND « MÊMES VALEURS D'ÉNUMÉRATION » VÉRIFIABLE.** Le point
 * 12 de la Definition of Done exige la même forme *et* les mêmes valeurs ; sans
 * cette lecture, un `'TERMINEE'` écrit `'TERMINÉE'` côté front passerait le
 * test de forme et casserait au branchement.
 */
export function valeursDuCheck(fichier: string, contrainte: string): string[] {
  const contenu = readFileSync(join(MODELE, fichier), 'utf8')
  const bloc = contenu.match(new RegExp(`CONSTRAINT ${contrainte} CHECK \\(([\\s\\S]*?)\\)\\)`, 'm'))
  if (!bloc) throw new Error(`contrainte introuvable dans ${fichier} : ${contrainte}`)
  return [...bloc[1]!.matchAll(/'([A-Za-z0-9_]+)'/g)].map((trouve) => trouve[1]!)
}
