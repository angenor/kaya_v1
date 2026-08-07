/**
 * LA SEULE FONCTION DU DÉPÔT QUI ÉCRIT UN MONTANT.
 *
 * ⚠️ ESPACE FINE INSÉCABLE **U+202F** entre les groupes de milliers ET avant le
 * symbole : `12 500 F`, jamais `12 500 F` (`tokens.md` §2). Deux propriétés en
 * dépendent, et aucune n'est cosmétique : un montant ne se coupe pas en fin de
 * ligne, et les colonnes s'alignent en Chivo Mono tabulaire.
 *
 * ⚠️ LE MONTANT EST UN ENTIER EN UNITÉ MINEURE, ET LA DEVISE L'ACCOMPAGNE
 * TOUJOURS (constitution, principe 5). XOF a **zéro décimale** ; un produit qui
 * supposerait deux décimales partout écrirait « 12 500,00 F » à Abengourou.
 * Le nombre de décimales vient donc de la devise, jamais d'une constante.
 *
 * ⚠️ ET CETTE FONCTION NE CALCULE RIEN. Aucun arrondi, aucune conversion,
 * aucune règle fiscale : tout cela vit dans le `JurisdictionAdapter` du serveur.
 * Elle met en forme, et c'est tout.
 *
 * ⚠️ ÉCART CONNU, MESURÉ, ET DOCUMENTÉ AU RAPPORT DE CYCLE : U+202F est ABSENT
 * d'Archivo comme de Chivo Mono. Le séparateur tombe donc sur une police de
 * repli. Ce qui protège malgré tout le produit : l'insécabilité vient du
 * CARACTÈRE — catégorie Unicode Zs non sécable —, pas de la police, et les
 * colonnes de montants sont alignées à droite sur une largeur fixe.
 */

/** L'espace fine insécable. Écrite une fois, ici, et nulle part ailleurs. */
export const FINE_INSECABLE = ' '

/** Ce qu'une devise décide : son symbole visible et ses décimales. */
export interface Devise {
  readonly code: string
  /** Ce que l'utilisateur lit — jamais le code ISO, sauf s'il fait office. */
  readonly symbole: string
  /** XOF : 0. EUR : 2. La valeur vient de la devise, jamais d'une constante. */
  readonly decimales: number
}

/**
 * Les devises que le produit sait écrire.
 *
 * ⚠️ CE N'EST PAS UN PARAMÈTRE MÉTIER, ET C'EST POURQUOI IL EST ICI. La devise
 * D'UN ÉTABLISSEMENT est une donnée — colonne `etablissement.devise` — et elle
 * se lit dans la configuration. Ce que cette table porte est la CONVENTION
 * D'ÉCRITURE de chaque code ISO, qui ne se paramètre pas : XOF a zéro décimale
 * pour tout le monde.
 */
const DEVISES: Readonly<Record<string, Devise>> = {
  XOF: { code: 'XOF', symbole: 'F', decimales: 0 },
}

export function deviseConnue(code: string): Devise | null {
  return DEVISES[code] ?? null
}

/** Groupe les milliers par l'espace fine insécable. */
function grouperMilliers(entier: string): string {
  return entier.replace(/\B(?=(\d{3})+(?!\d))/g, FINE_INSECABLE)
}

/**
 * Écrit un montant.
 *
 * @param montantMineur le montant en unité mineure — un ENTIER, toujours
 * @param codeDevise    le code ISO 4217 porté par l'établissement
 */
export function formaterMontant(montantMineur: number, codeDevise: string): string {
  if (!Number.isInteger(montantMineur)) {
    // Un montant non entier signale une erreur de conception EN AMONT — une
    // division, un pourcentage appliqué trop tôt. On ne l'arrondit pas en
    // silence : l'arrondi est une décision fiscale, et elle n'appartient pas à
    // une fonction d'affichage.
    throw new TypeError(
      `montant non entier : ${montantMineur}. Un montant est un entier en unité mineure (principe 5).`,
    )
  }
  const devise = deviseConnue(codeDevise)
  if (!devise) {
    throw new TypeError(`devise inconnue : ${codeDevise}. Ajoutez sa convention d'écriture.`)
  }

  const negatif = montantMineur < 0
  const absolu = Math.abs(montantMineur)
  const diviseur = 10 ** devise.decimales
  const entier = grouperMilliers(String(Math.trunc(absolu / diviseur)))
  const fraction =
    devise.decimales > 0
      ? `,${String(absolu % diviseur).padStart(devise.decimales, '0')}`
      : ''

  // Le signe moins est le VRAI signe moins (U+2212), pas le trait d'union :
  // le trait d'union se coupe en fin de ligne et se lit comme un tiret.
  return `${negatif ? '−' : ''}${entier}${fraction}${FINE_INSECABLE}${devise.symbole}`
}

/**
 * Écrit un écart, avec son signe explicite. Employé par la carte chiffre.
 * Le « + » compte : sans lui, un écart positif se lit comme un total.
 */
export function formaterEcart(montantMineur: number, codeDevise: string): string {
  const ecrit = formaterMontant(Math.abs(montantMineur), codeDevise)
  const signe = montantMineur < 0 ? '−' : '+'
  return `${signe}${FINE_INSECABLE}${ecrit}`
}
