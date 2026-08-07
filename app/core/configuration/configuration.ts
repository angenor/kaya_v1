/**
 * LA CONFIGURATION D'ÉTABLISSEMENT — et pourquoi elle existe dès ce cycle.
 *
 * ⚠️ AUCUN PARAMÈTRE MÉTIER N'EST ÉCRIT EN DUR (constitution, principe 1·c).
 * Tout ce qui est qualifié de « paramétrable » vit dans la configuration
 * d'établissement, avec sa chaîne d'héritage
 * **tenant → établissement → module → point de vente** et sa surcharge.
 *
 * ⚠️ CE CYCLE N'EN LIVRE QUE LA LECTURE ET LES VALEURS INITIALES. La chaîne
 * d'héritage complète et son écran de réglage appartiennent à **ETB-04** ; ce
 * qui est acquis ici, c'est qu'AUCUN appelant ne connaît la valeur — il connaît
 * la CLÉ. Le jour où l'héritage arrive, aucun appelant ne bouge.
 *
 * ⚠️ ET LA CLÉ VIENT DU RÉCAPITULATIF DES PARAMÈTRES, qui fait foi
 * (`docs/user-stories-v1.md`). On n'en invente pas.
 */

export const CLE_SEUIL_LATENCE_DEGRADEE = 'sync.latence_degradee_seuil_ms'

/**
 * Les valeurs initiales, par clé.
 *
 * ⚠️ « VALEUR INITIALE » ET NON « CONSTANTE ». La nuance décide de tout : une
 * constante se lit dans le code et se change en recompilant ; une valeur
 * initiale est ce qu'un établissement voit avant d'avoir réglé quoi que ce
 * soit. Le seuil de 3 000 ms sépare « Enregistré » de « Connexion faible » — et
 * il ne vaudra pas 3 000 partout : la 3G d'Abengourou et la fibre d'Abidjan ne
 * demandent pas le même réglage.
 */
const VALEURS_INITIALES: Readonly<Record<string, string>> = {
  [CLE_SEUIL_LATENCE_DEGRADEE]: '3000',
}

/** Les surcharges posées en session — le panneau Scénarios les emploie. */
const surcharges = new Map<string, string>()

/**
 * Lit un paramètre. Rend toujours une CHAÎNE : c'est le type de la colonne
 * `valeur` de `parametre_configuration`, et le convertir ici cacherait qu'un
 * paramètre peut être un montant, une durée, un booléen ou une énumération.
 */
export function lireParametre(cle: string): string | null {
  return surcharges.get(cle) ?? VALEURS_INITIALES[cle] ?? null
}

/** Lit un paramètre entier, avec son repli quand la valeur est illisible. */
export function lireParametreEntier(cle: string, repli: number): number {
  const brut = lireParametre(cle)
  if (brut === null) return repli
  const valeur = Number.parseInt(brut, 10)
  return Number.isFinite(valeur) ? valeur : repli
}

/** Surcharge un paramètre pour la session courante. */
export function surchargerParametre(cle: string, valeur: string): void {
  surcharges.set(cle, valeur)
}

/** Les clés connues — employé par les tests et par le panneau Scénarios. */
export function clesConnues(): readonly string[] {
  return Object.keys(VALEURS_INITIALES)
}
