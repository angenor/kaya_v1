import { reglagesCourants } from '~/core/scenarios/reglages'

/**
 * L'HORLOGE DE LA COUTURE — **la seule lecture d'horloge du produit**.
 *
 * ⚠️ **DEUX HORLOGES, ET LES CONFONDRE COÛTE DE L'ARGENT RÉEL.** L'**horloge
 * d'autorité** est celle du serveur : `cree_le` en base, et c'est elle qui
 * décide des durées, des montants et des disponibilités (constitution,
 * principe 4). L'**horloge de l'appareil** est celle du terminal, *qui se règle
 * à la main* — un poste de comptoir partagé dérive de plusieurs minutes en
 * quelques semaines. Une durée de passage calculée sur la seconde change un
 * montant.
 *
 * ⚠️ **AUCUN COMPOSANT NE LIT D'HORLOGE.** `Date.now()`, `new Date()` et
 * `performance.now()` sont interdits sous `app/pages/` et sur tout composant de
 * `app/core/` par une règle ESLint (T006a). L'instant vient d'ici, et d'ici
 * seul — ce qui permettra, en phase 3, de le prendre à l'en-tête `Date` de la
 * réponse serveur sans retoucher un seul écran.
 *
 * ⚠️ **CE FICHIER EST DE LA COUTURE, PAS DU PRODUIT.** Il vit sous
 * `core/donnees/` avec la simulation, et non sous `core/format/` : `instant.ts`
 * **met en forme** un instant qu'on lui donne, celui-ci **dit lequel il est**.
 * Les deux resteront séparés en phase 3 — l'un devient un appel réseau, l'autre
 * non.
 */

/**
 * L'instant qui fait foi. En phase 2, l'horloge de la machine ; en phase 3,
 * celle du serveur.
 */
export function maintenantAutorite(): Date {
  return new Date()
}

/** Le même, en ISO — la forme que portent tous les champs du modèle. */
export function instantAutorite(): string {
  return maintenantAutorite().toISOString()
}

/**
 * L'instant **perçu par l'appareil**, dérive comprise.
 *
 * ⚠️ **IL NE SERT QU'À CONSTATER L'ÉCART, JAMAIS À CALCULER.** C'est l'exemption
 * « détection de dérive » du principe 4 — l'une des trois, et la seule qui
 * s'applique ici.
 */
export function maintenantAppareil(): Date {
  return new Date(maintenantAutorite().getTime() + reglagesCourants().deriveHorlogeSecondes * 1000)
}

/**
 * L'écart entre l'appareil et l'autorité, en secondes. **Signé** : négatif quand
 * l'appareil retarde, positif quand il avance.
 *
 * ⚠️ **LE SENS COMPTE À L'ÉCRAN.** « Votre horloge retarde » et « votre horloge
 * avance » n'appellent pas le même geste, et une valeur absolue les
 * confondrait — l'exploitant chercherait à avancer une horloge déjà en avance.
 */
export function deriveHorlogeSecondes(): number {
  return reglagesCourants().deriveHorlogeSecondes
}

/** Décale un instant de `minutes` — l'arithmétique du jeu et de la couture. */
export function decale(instant: Date | string, minutes: number): string {
  const base = typeof instant === 'string' ? Date.parse(instant) : instant.getTime()
  return new Date(base + minutes * 60_000).toISOString()
}

/**
 * L'instant du jour à `heure` heures (fuseau UTC), relatif à l'autorité.
 *
 * ⚠️ **`decalageJours` EST CE QUI REND LE JEU DURABLE.** *Un jeu daté en dur
 * cesse d'exercer ses cas le lendemain, et le test devient vert en ne testant
 * plus rien* — le pire des deux mondes.
 */
export function jourA(heure: number, decalageJours = 0, minutes = 0): string {
  const base = maintenantAutorite()
  const jour = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + decalageJours, heure, minutes),
  )
  return jour.toISOString()
}
