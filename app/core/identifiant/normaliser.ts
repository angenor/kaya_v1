import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

import {
  CLE_INDICATIF_TELEPHONIQUE_DEFAUT,
  lireParametre,
} from '~/core/configuration/configuration'

/**
 * LA SEULE FONCTION QUI NORMALISE UN IDENTIFIANT SAISI.
 *
 * ⚠️ ELLE S'APPELLE **AVANT** LE DOMAINE, JAMAIS DEDANS. `R0` accepte le numéro
 * sous la forme que l'exploitant tape — `07 08 09 10 11`, `+225 07 08 09 10 11`,
 * `0708091011` — et le domaine, lui, compare un E.164 à `compte.identifiant`.
 * La normalisation est ce qui rend les trois formes équivalentes ; la faire
 * dans le domaine la ferait refaire par le serveur en phase 3, à sa manière.
 *
 * ⚠️ UN `@` ⇒ E-MAIL, SANS AUTRE EXAMEN. C'est le cas limite de la
 * spécification : `0708091011@…` ressemble aux deux, et **la forme e-mail
 * l'emporte**. Analyser d'abord comme un numéro rendrait l'adresse d'un compte
 * inatteignable, et le refus serait indistinguable d'un mot de passe faux.
 *
 * ⚠️ L'INDICATIF PAR DÉFAUT EST **LU DE LA CONFIGURATION**, jamais écrit ici
 * (`identite.indicatif_telephonique_defaut`, valeur initiale `+225`). Le produit
 * vise un second pays : un indicatif en dur serait la première ligne à corriger,
 * et celle qu'on oublierait.
 *
 * ⚠️ ET C'EST LE SOUS-ENSEMBLE `/min` QUI EST EMPLOYÉ — métadonnées réduites,
 * suffisantes pour analyser un numéro dont le pays est connu. C'est notre cas :
 * le pays vient de la configuration, il n'est jamais deviné. Le jeu complet
 * pèserait pour un service que le produit ne rend pas.
 */

/**
 * ⚠️ `CODE` EXISTE AU RÉFÉRENTIEL ET N'EST PAS PRODUIT ICI. `TYPES_IDENTIFIANT`
 * en porte trois — `TELEPHONE`, `EMAIL`, `CODE` —, et aucun compte du jeu ne se
 * connecte par code. Cette fonction ne rend donc jamais `CODE` : inventer une
 * heuristique pour une forme que rien n'emploie produirait une branche que
 * personne ne peut exercer, et P-06 la compterait comme un point d'entrée dû.
 */
export type IdentifiantNormalise =
  | { readonly forme: 'EMAIL'; readonly valeur: string }
  /** E.164, ex. `+2250708091011`. */
  | { readonly forme: 'TELEPHONE'; readonly valeur: string }
  /** Champ vide ou blanc. Rend `IDENTIFIANT_ABSENT`, jamais un échec de connexion. */
  | { readonly forme: 'ABSENT' }

/**
 * `libphonenumber-js` attend l'indicatif **sans le `+`** (`defaultCallingCode`).
 * La configuration, elle, le porte **avec**, parce que c'est ainsi qu'un
 * exploitant le lit et l'écrit. La conversion vit ici, une fois.
 */
function indicatifParDefaut(): string | null {
  const brut = lireParametre(CLE_INDICATIF_TELEPHONIQUE_DEFAUT)
  if (brut === null) return null
  const chiffres = brut.replace(/[^0-9]/g, '')
  return chiffres.length > 0 ? chiffres : null
}

export function normaliserIdentifiant(saisi: string): IdentifiantNormalise {
  const propre = saisi.trim()
  if (propre.length === 0) return { forme: 'ABSENT' }

  // Le `@` l'emporte, avant tout examen de numéro.
  if (propre.includes('@')) return { forme: 'EMAIL', valeur: propre.toLowerCase() }

  const indicatif = indicatifParDefaut()
  const numero = parsePhoneNumberFromString(
    propre,
    indicatif === null ? undefined : { defaultCallingCode: indicatif },
  )

  // ⚠️ UN NUMÉRO ILLISIBLE RESTE UN TÉLÉPHONE, ET SA VALEUR EST CE QUI A ÉTÉ
  // TAPÉ. Le rendre `ABSENT` ferait dire « indiquez un numéro ou une adresse » à
  // quelqu'un qui vient précisément d'en indiquer un — la phrase serait fausse
  // et le renverrait à un champ qu'il croit rempli. Il ne correspondra à aucun
  // compte, et c'est la phrase unique d'échec qui répondra, comme pour tout
  // identifiant inconnu.
  if (numero === undefined) return { forme: 'TELEPHONE', valeur: propre }
  return { forme: 'TELEPHONE', valeur: numero.number }
}
