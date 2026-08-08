import type { BaremePalier, Formule } from '~/core/donnees/hebergement/types'

/**
 * LE BARÈME DÉGRESSIF DU PASSAGE — prix d'une durée, palier atteint,
 * **rebascule** au dépassement, **bascule en nuitée** au seuil.
 *
 * ⚠️ **AUCUNE VALEUR N'EST ÉCRITE ICI.** Ni un palier, ni un prix d'heure
 * supplémentaire, ni le seuil de bascule : tout vient du référentiel — les
 * lignes `bareme_palier` et les colonnes `duree_min_minutes` /
 * `duree_max_minutes` de la formule. *Un tarif écrit dans le code est un tarif
 * que l'exploitant ne peut pas changer, et il finira par vendre au mauvais
 * prix en attendant une livraison.*
 *
 * ⚠️ **FONCTION PURE, HORS DE TOUT COMPOSANT.** La constitution exige un test
 * doré sur jeu de cas figés pour tout calcul qui décide d'argent (principe 5).
 * Un calcul enfermé dans un composant se teste en montant le composant — donc
 * lentement, et à travers le rendu ; celui-ci se teste en microsecondes, et son
 * jeu doré est lisible par quelqu'un qui ne sait pas lire Vue.
 *
 * ⚠️ **ET IL NE LIT AUCUNE HORLOGE.** Une durée lui est donnée ; il ne la
 * calcule pas. La durée réelle d'un passage vient de l'horodatage d'autorité —
 * `cree_le`, posé par la base —, jamais de l'horloge d'un terminal partagé,
 * *qui se règle à la main et dont l'écart coûte de l'argent réel*.
 */

/** Ce qu'une durée coûte, et **pourquoi**. */
export interface PrixDeDuree {
  /** Entier en unité mineure. */
  readonly montant: number
  readonly codeDevise: string
  /** Le palier de base retenu — sa durée en minutes. */
  readonly paliersMinutes: number
  /**
   * Les heures supplémentaires facturées au-delà du dernier palier.
   * ⚠️ **ENTIÈRES ET COMMENCÉES** : 4 h 30 en facture une. Une heure entamée
   * immobilise la chambre autant qu'une heure pleine, et le proratiser
   * demanderait de compter les minutes au comptoir.
   */
  readonly heuresSupplementaires: number
}

/** L'issue d'une demande de durée : un prix, ou l'annonce d'une bascule. */
export type IssueBareme =
  | { readonly bascule: false; readonly prix: PrixDeDuree }
  /**
   * ⚠️ **UNE ANNONCE, PAS UN REFUS.** Au-delà du seuil de l'établissement, le
   * tarif passe à la nuitée — l'écran l'annonce **avant** de l'appliquer, avec
   * le montant résultant, et attend une confirmation.
   *
   * ⚠️ **LA BASCULE EST STRUCTURELLE, PAS CONDITIONNÉE PAR LE MONTANT.** Au-delà
   * de `dureeMaxMinutes`, la formule de passage **ne s'applique plus** — que le
   * tarif de nuitée soit connu ou non. `montantNuitee` vaut alors `null`, et
   * l'écran annonce la bascule **sans son prix** plutôt que de facturer douze
   * heures au barème horaire. *Trouvé par le test doré, qui exigeait qu'une
   * durée de 600 min ne produise pas de rebascule silencieuse.*
   */
  | {
      readonly bascule: true
      readonly seuilMinutes: number
      readonly montantNuitee: number | null
    }

/** Les paliers de base, du plus court au plus long. */
function paliersDeBase(bareme: readonly BaremePalier[]): readonly BaremePalier[] {
  return [...bareme]
    .filter((palier) => !palier.estHeureSupplementaire)
    .sort((a, b) => a.dureeMinutes - b.dureeMinutes)
}

/** La ligne d'heure supplémentaire, s'il y en a une. */
function heureSupplementaire(bareme: readonly BaremePalier[]): BaremePalier | null {
  return bareme.find((palier) => palier.estHeureSupplementaire) ?? null
}

/**
 * Les durées que l'écran propose — **celles du barème, dans l'ordre**.
 *
 * ⚠️ **L'ÉCRAN NE CHOISIT PAS SES BOUTONS.** `R4` en affiche quatre parce que
 * Deloria a quatre paliers ; un établissement qui en déclarerait trois en
 * verrait trois. Écrire « 1 h, 2 h, 3 h, 4 h » dans le composant aurait rendu
 * le barème décoratif.
 */
export function dureesProposees(bareme: readonly BaremePalier[]): readonly number[] {
  return paliersDeBase(bareme).map((palier) => palier.dureeMinutes)
}

/**
 * Le palier atteint par une durée — **le plus long qui ne la dépasse pas**.
 *
 * Rend `null` sous le premier palier : une durée plus courte que le plus petit
 * palier n'a pas de prix, et l'inventer serait décider d'un tarif.
 */
export function palierAtteint(
  bareme: readonly BaremePalier[],
  dureeMinutes: number,
): BaremePalier | null {
  const candidats = paliersDeBase(bareme).filter((palier) => palier.dureeMinutes <= dureeMinutes)
  return candidats.at(-1) ?? null
}

/**
 * Le prix d'une durée, **paliers dégressifs et heures supplémentaires
 * comprises**.
 *
 * ⚠️ **AU-DELÀ DU SEUIL, CE N'EST PLUS UN PASSAGE.** `formule.dureeMaxMinutes`
 * porte le seuil de bascule en nuitée ; la fonction rend alors une **annonce**
 * plutôt qu'un prix, et rien n'est appliqué avant confirmation. Facturer
 * silencieusement douze heures au barème horaire coûterait plus cher qu'une
 * nuitée — l'exploitant s'en apercevrait au comptage, le client au comptoir.
 */
export function prixDeLaDuree(
  bareme: readonly BaremePalier[],
  formule: Formule,
  dureeMinutes: number,
  prixNuitee: number | null = null,
): IssueBareme | null {
  const seuil = formule.dureeMaxMinutes
  if (seuil !== null && dureeMinutes > seuil) {
    return { bascule: true, seuilMinutes: seuil, montantNuitee: prixNuitee }
  }

  const palier = palierAtteint(bareme, dureeMinutes)
  if (palier === null) return null

  const supplement = heureSupplementaire(bareme)
  const reste = dureeMinutes - palier.dureeMinutes
  // ⚠️ ENTIÈRES ET COMMENCÉES — `Math.ceil`, jamais `Math.round` : une heure
  // entamée immobilise la chambre autant qu'une heure pleine.
  const heures =
    reste > 0 && supplement !== null ? Math.ceil(reste / supplement.dureeMinutes) : 0

  return {
    bascule: false,
    prix: {
      montant: palier.prix + heures * (supplement?.prix ?? 0),
      codeDevise: palier.codeDevise,
      paliersMinutes: palier.dureeMinutes,
      heuresSupplementaires: heures,
    },
  }
}

/** Ce qu'une rebascule de palier ajoute à la note, et **pourquoi**. */
export interface Rebascule {
  /** L'écart à facturer en plus, en unité mineure. Toujours positif. */
  readonly complement: number
  readonly codeDevise: string
  /** Le palier d'origine, en minutes — celui qui avait été payé. */
  readonly palierOrigineMinutes: number
  /** Le palier réellement atteint. */
  readonly palierAtteintMinutes: number
  readonly heuresSupplementaires: number
}

/**
 * LA REBASCULE — la durée réelle a dépassé le palier payé.
 *
 * ⚠️ **ELLE PRODUIT UNE LIGNE DISTINCTE, JAMAIS UNE CORRECTION DE L'ANCIENNE.**
 * *La ligne d'origine reste visible* : une note dont une ligne a changé de
 * montant sans laisser de trace est une note que personne ne peut expliquer au
 * client — et c'est au comptoir qu'on la lui explique.
 *
 * Rend `null` quand rien n'est dû : la durée réelle tient dans le palier payé.
 */
export function rebasculeDePalier(
  bareme: readonly BaremePalier[],
  formule: Formule,
  dureePayeeMinutes: number,
  dureeReelleMinutes: number,
): Rebascule | null {
  if (dureeReelleMinutes <= dureePayeeMinutes) return null

  const paye = prixDeLaDuree(bareme, formule, dureePayeeMinutes)
  const reel = prixDeLaDuree(bareme, formule, dureeReelleMinutes)
  if (paye === null || reel === null) return null
  // Une bascule en nuitée n'est pas une rebascule : elle s'annonce et se
  // confirme, elle ne s'ajoute pas à la note d'autorité.
  if (paye.bascule || reel.bascule) return null

  const complement = reel.prix.montant - paye.prix.montant
  if (complement <= 0) return null

  return {
    complement,
    codeDevise: reel.prix.codeDevise,
    palierOrigineMinutes: paye.prix.paliersMinutes,
    palierAtteintMinutes: reel.prix.paliersMinutes,
    heuresSupplementaires: reel.prix.heuresSupplementaires,
  }
}
