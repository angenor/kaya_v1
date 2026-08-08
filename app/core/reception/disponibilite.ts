import type {
  Intervalle,
  Occupation,
  TempsRemiseEnEtat,
  Unite,
} from '~/core/donnees/hebergement/types'

/**
 * LA DISPONIBILITÉ — chevauchement, chambres libres, prochaine libération.
 *
 * ⚠️ **CE FICHIER EST LA SECONDE LIGNE DE DÉFENSE, JAMAIS LA PREMIÈRE.** La
 * première est la contrainte `EXCLUDE USING gist` de `hebergement.occupation`,
 * qui refuse le chevauchement **en base**, sous concurrence, quoi qu'un client
 * ait vérifié. Ce qu'on écrit ici sert à *(a)* refuser tôt et proprement,
 * *(b)* rendre le refus explicable, *(c)* tenir la phase 2 où il n'y a pas de
 * base. **Il ne remplace jamais la contrainte** : deux réceptionnistes qui
 * tapent à la même seconde ne sont départagés que par elle.
 *
 * ⚠️ **TOUT PORTE SUR `periodeIndisponibilite`, JAMAIS SUR `periode`.**
 * Vérifier sur `periode` laisserait passer une occupation qui mord sur le
 * ménage de la précédente : la chambre serait donnée, et le refus se
 * découvrirait avec le client dans le couloir.
 *
 * ⚠️ **ET IL NE LIT AUCUNE HORLOGE.** L'instant lui est donné ; il vient de
 * l'horloge de la couture, jamais de `Date.now()` dans un composant.
 */

/** Millisecondes d'un instant ISO. */
function instant(iso: string): number {
  return Date.parse(iso)
}

/**
 * Deux intervalles `[début, fin)` se chevauchent-ils ?
 *
 * ⚠️ **LA BORNE HAUTE EST EXCLUE, ET C'EST CE QUI REND DEUX PASSAGES
 * CONSÉCUTIFS POSSIBLES.** `[15 h, 18 h)` et `[18 h, 20 h)` **ne se chevauchent
 * pas** : c'est une comparaison stricte des deux côtés. Avec `<=`, la seconde
 * chambre serait refusée à l'instant exact où la première se libère — un refus
 * juste selon le code, faux selon le couloir.
 */
export function seChevauchent(a: Intervalle, b: Intervalle): boolean {
  return instant(a.debut) < instant(b.fin) && instant(b.debut) < instant(a.fin)
}

/** Un intervalle est-il bien formé ? La fin doit être **après** le début. */
export function intervalleValide(periode: Intervalle): boolean {
  return instant(periode.fin) > instant(periode.debut)
}

/** La durée d'un intervalle, en minutes. */
export function dureeMinutes(periode: Intervalle): number {
  return Math.round((instant(periode.fin) - instant(periode.debut)) / 60_000)
}

/** Décale la fin d'un intervalle de `minutes` — la remise en état. */
export function avecRemiseEnEtat(periode: Intervalle, minutes: number): Intervalle {
  return {
    debut: periode.debut,
    fin: new Date(instant(periode.fin) + minutes * 60_000).toISOString(),
  }
}

/**
 * ⚠️ **`periodeIndisponibilite` CONTIENT-ELLE `periode` ?** Égalité comprise :
 * une occupation **sans** remise en état est licite. La base le garantit par
 * `ck_occupation_periode_incluse` ; en phase 2, c'est cette fonction, et un
 * test l'exige sur chaque écriture simulée.
 */
export function indisponibiliteContientPeriode(occupation: Occupation): boolean {
  return (
    instant(occupation.periodeIndisponibilite.debut) <= instant(occupation.periode.debut) &&
    instant(occupation.periodeIndisponibilite.fin) >= instant(occupation.periode.fin)
  )
}

/**
 * Les occupations qui **bloquent réellement** une unité.
 *
 * ⚠️ **UNE OCCUPATION `ANNULEE` NE BLOQUE PLUS**, et c'est ce qui rend la
 * fenêtre d'annulation de 8 secondes réellement réversible. La base porte la
 * même clause — `WHERE (statut <> 'ANNULEE')` sur la contrainte d'exclusion.
 * *Les deux doivent dire la même chose, sinon l'annulation rend la chambre à
 * l'écran et pas en base.*
 */
export function occupationsBloquantes(
  occupations: readonly Occupation[],
  uniteId: string,
): readonly Occupation[] {
  return occupations.filter(
    (occupation) => occupation.uniteId === uniteId && occupation.statut !== 'ANNULEE',
  )
}

/**
 * L'occupation qui empêche de prendre `periode` sur `uniteId`, s'il y en a une.
 *
 * `exclureOccupationId` sert la prolongation et le changement de chambre : le
 * séjour ne doit pas se refuser lui-même.
 */
export function occupationEnConflit(
  occupations: readonly Occupation[],
  uniteId: string,
  periode: Intervalle,
  exclureOccupationId: string | null = null,
): Occupation | null {
  return (
    occupationsBloquantes(occupations, uniteId)
      .filter((occupation) => occupation.id !== exclureOccupationId)
      .find((occupation) => seChevauchent(occupation.periodeIndisponibilite, periode)) ?? null
  )
}

/** Une unité libre, et **ce qui la rend proposable**. */
export interface UniteDisponible {
  readonly unite: Unite
  /**
   * L'instant où l'unité cesse d'être libre, quand une occupation suit.
   * ⚠️ **C'EST CE QUI PERMET DE REFUSER AVANT DE DONNER** : une chambre libre
   * maintenant mais prise dans une heure ne convient pas à un passage de trois.
   */
  readonly libreJusqua: string | null
}

/**
 * Le temps de remise en état applicable — **par formule, puis par catégorie**.
 *
 * ⚠️ **L'ORDRE N'EST PAS INDIFFÉRENT.** Une ligne qui nomme la formule est plus
 * précise qu'une ligne qui nomme la catégorie ; prendre la première trouvée
 * ferait dépendre le résultat de l'ordre d'insertion en base.
 */
export function remiseEnEtatMinutes(
  temps: readonly TempsRemiseEnEtat[],
  formuleId: string,
  categorieId: string,
): number {
  const parFormule = temps.find(
    (ligne) => ligne.formuleId === formuleId && ligne.categorieId === categorieId,
  )
  if (parFormule) return parFormule.dureeMinutes
  const formuleSeule = temps.find(
    (ligne) => ligne.formuleId === formuleId && ligne.categorieId === null,
  )
  if (formuleSeule) return formuleSeule.dureeMinutes
  const categorieSeule = temps.find(
    (ligne) => ligne.categorieId === categorieId && ligne.formuleId === null,
  )
  // Aucune ligne : la remise en état est nulle, ce qui se dit en n'ayant pas de
  // ligne (`ck_temps_remise_duree_positive` interdit la durée zéro explicite).
  return categorieSeule?.dureeMinutes ?? 0
}

/**
 * Les unités libres sur une période, **remise en état comprise**.
 *
 * ⚠️ **LA PÉRIODE TESTÉE EST CELLE DE LA DEMANDE PLUS SA PROPRE REMISE EN
 * ÉTAT.** Une chambre dont le ménage suivant mordrait sur l'occupation d'après
 * n'est pas libre — même si l'occupation elle-même y tiendrait.
 */
export function unitesDisponibles(
  unites: readonly Unite[],
  occupations: readonly Occupation[],
  periodeAvecRemise: Intervalle,
): readonly UniteDisponible[] {
  return unites
    .filter((unite) => unite.actif)
    .filter(
      (unite) => occupationEnConflit(occupations, unite.id, periodeAvecRemise) === null,
    )
    .map((unite) => ({
      unite,
      libreJusqua: prochaineOccupation(occupations, unite.id, periodeAvecRemise.fin),
    }))
}

/** Le début de la prochaine occupation d'une unité après un instant donné. */
export function prochaineOccupation(
  occupations: readonly Occupation[],
  uniteId: string,
  depuis: string,
): string | null {
  const suivantes = occupationsBloquantes(occupations, uniteId)
    .map((occupation) => occupation.periodeIndisponibilite.debut)
    .filter((debut) => instant(debut) >= instant(depuis))
    .sort()
  return suivantes[0] ?? null
}

/** Ce qui se libère, et quand — l'état « tout est pris » en dépend. */
export interface Liberation {
  readonly uniteId: string
  /** L'instant où l'unité redevient disponible, **remise en état comprise**. */
  readonly libreA: string
}

/**
 * Les prochaines libérations, **dans l'ordre du temps**.
 *
 * ⚠️ **C'EST `periodeIndisponibilite.fin` QUI FAIT FOI, PAS `periode.fin`.**
 * Annoncer « libre à 16 h » alors que le ménage court jusqu'à 16 h 30
 * produirait un refus à l'instant même où l'on aurait promis la chambre.
 */
export function prochainesLiberations(
  occupations: readonly Occupation[],
  depuis: string,
  limite: number,
): readonly Liberation[] {
  const parUnite = new Map<string, string>()
  for (const occupation of occupations) {
    if (occupation.statut === 'ANNULEE') continue
    const fin = occupation.periodeIndisponibilite.fin
    if (instant(fin) < instant(depuis)) continue
    const connue = parUnite.get(occupation.uniteId)
    if (connue === undefined || instant(fin) < instant(connue)) {
      parUnite.set(occupation.uniteId, fin)
    }
  }
  return [...parUnite.entries()]
    .map(([uniteId, libreA]) => ({ uniteId, libreA }))
    .sort((a, b) => instant(a.libreA) - instant(b.libreA))
    .slice(0, limite)
}
