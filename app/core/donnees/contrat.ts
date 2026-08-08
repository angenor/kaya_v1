/**
 * LE PATRON QU'UN DOMAINE NOUVEAU RECOPIE.
 *
 * ⚠️ LA COUTURE ENTRE LE SIMULÉ ET LE RÉEL EST L'INTERFACE DE DOMAINE, JAMAIS LA
 * REQUÊTE HTTP. C'est la décision structurante du cycle, et elle découle de la
 * règle de branchement : « aucune donnée simulée ne survit à la mise en service
 * de l'endpoint qui la remplace ». Un remplacement ENDPOINT PAR ENDPOINT se fait
 * derrière une interface — on change l'implémentation liée à un domaine, et
 * aucun composant ne s'en aperçoit, puisqu'il n'a jamais connu la provenance.
 *
 * Derrière une interception réseau, il faudrait retirer des gestionnaires un à
 * un dans un fichier partagé : la simulation et le vrai code cohabiteraient au
 * même endroit. C'est pour cela que MSW est écarté (research.md §2.1).
 *
 * QUATRE RÈGLES. Elles ne sont pas des conseils : la porte P-06 et le test de
 * conformité au modèle les vérifient.
 */

/**
 * 1 — Toute opération est asynchrone et rend un `ResultatDomaine`.
 *
 * Un domaine peut échouer — réseau, permission, jeu vide — et **l'échec n'est
 * pas une exception : il s'affiche**. Une exception traverse les couches et
 * finit en écran blanc ; un résultat se rend, se teste, et se traduit.
 */
export type ResultatDomaine<T> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly echec: EchecDomaine }

export interface EchecDomaine {
  /**
   * ⚠️ CODE STABLE, ET JAMAIS DE MESSAGE. Le lexique est formel : « l'interface
   * branche sa clé i18n sur le CODE, jamais sur le message — qui nomme des
   * tables et parle anglais technique ». La simulation d'aujourd'hui et l'API de
   * demain rendent donc le même code, et l'écran ne change pas au branchement.
   */
  readonly code: CodeEchec
  /**
   * Les paramètres de la phrase — nombres, heures, noms. JAMAIS une phrase.
   *
   * ⚠️ **UNE LISTE Y EST ADMISE, ET UN SEUL CODE EN A BESOIN.**
   * `CONFLIT_OCCUPATION_SUIVANTE` porte les chambres libres de la même
   * catégorie, parce que le lexique exige que le refus soit **suivi de son
   * alternative**. Sans cet élargissement, l'alternative devrait être
   * recomposée par l'écran — donc réécrite six fois, et la sixième serait
   * fausse. *L'élargissement est du contrat, pas de l'écran.*
   */
  readonly parametres: Readonly<Record<string, string | number | readonly string[]>>
}

export type CodeEchec =
  | 'HORS_LIGNE'
  | 'ECHEC_RESEAU'
  | 'INTROUVABLE'
  /** Ne devrait JAMAIS s'afficher : sans le droit, l'action est ABSENTE. */
  | 'PERMISSION_ABSENTE'
  /**
   * ⚠️ QUATRE CAS, UN SEUL CODE — ET C'EST LA PROPRIÉTÉ, PAS UNE
   * SIMPLIFICATION. Compte inconnu, mot de passe faux, compte `SUSPENDU`,
   * compte `REVOQUE` : les distinguer publierait la liste des comptes
   * existants à qui essaie des numéros. La tentation de préciser sera
   * permanente ; le lexique porte la mention « une seule phrase », et elle ne
   * se scinde pas sans rouvrir FR-003.
   */
  | 'IDENTIFIANTS_INVALIDES'
  /**
   * Le champ identifiant est vide. **Ce n'est pas un échec de connexion** : la
   * personne doit savoir quoi corriger, et lui servir la phrase ci-dessus la
   * renverrait vérifier un mot de passe qu'elle n'a pas encore tapé.
   */
  | 'IDENTIFIANT_ABSENT'
  // ── Les onze refus de la réception · cycle F3 ────────────────────────────
  //
  // ⚠️ AUCUN NE PORTE DE MESSAGE, ET C'EST TOUT LEUR INTÉRÊT. L'écran branche
  // sa clé i18n sur le CODE ; la simulation d'aujourd'hui et l'endpoint de
  // demain rendent le même, et l'écran ne change pas au branchement.
  //
  // ⚠️ ET AUCUN N'EST GÉNÉRIQUE. « Cette chambre n'est pas disponible » serait
  // vrai six fois et utile zéro : c'est la différence entre un refus qu'une
  // réceptionniste peut EXPLIQUER au client et un refus qu'elle contournera.
  /** `unite`, `debut`, `fin` — « Cette chambre est déjà prise sur cette période. » */
  | 'UNITE_DEJA_OCCUPEE'
  /**
   * `heure` + **la liste des chambres libres de la même catégorie**.
   * ⚠️ LE SEUL CODE QUI PORTE UNE LISTE, et c'est pourquoi `parametres`
   * l'admet. Le lexique exige que ce refus soit suivi de son alternative.
   */
  | 'CONFLIT_OCCUPATION_SUIVANTE'
  /**
   * `unite` — « Cette chambre n'est pas libre sur la période restante. »
   * ⚠️ DISTINCT DE `UNITE_DEJA_OCCUPEE` : celui-ci porte sur **ce qui reste du
   * séjour** lors d'un changement de chambre, celui-là sur une période demandée.
   */
  | 'UNITE_CIBLE_OCCUPEE'
  /** `plage1`, `plage2` **de l'établissement** — jamais des heures écrites ici. */
  | 'PLAGE_NON_FRACTIONNABLE'
  /** — « La fin doit être après le début. » */
  | 'INTERVALLE_INVALIDE'
  /** `min`, `max` **de la formule** — « Cette formule se loue de 1 h à 8 h. » */
  | 'DUREE_HORS_CONTRAINTE'
  /** — « Cette formule ne s'applique pas à cette chambre. » */
  | 'FORMULE_HORS_CATEGORIE'
  /** — « Ce séjour est déjà terminé. » */
  | 'SEJOUR_DEJA_CLOS'
  /**
   * — « On ne prolonge pas un séjour terminé. »
   * ⚠️ LA PHRASE DIT LA RÈGLE, PAS L'ÉTAT, et les deux codes coexistent pour
   * cela : dire « ce séjour est terminé » ferait chercher comment le rouvrir.
   */
  | 'SEJOUR_CLOS'
  /** — « La note est arrêtée : plus rien ne peut s'y ajouter. » */
  | 'NOTE_ARRETEE'
  /**
   * `seuilHeures`, `montant` — « Au-delà de {n} h, le tarif passe à la nuitée. »
   * ⚠️ CE N'EST PAS UN REFUS DÉFINITIF : c'est une ANNONCE qui attend une
   * confirmation. Rien n'est appliqué avant elle.
   */
  | 'BASCULE_FORMULE_NON_CONFIRMEE'

export function reussite<T>(valeur: T): ResultatDomaine<T> {
  return { ok: true, valeur }
}

export function echec<T>(
  code: CodeEchec,
  parametres: Readonly<Record<string, string | number | readonly string[]>> = {},
): ResultatDomaine<T> {
  return { ok: false, echec: { code, parametres } }
}

/**
 * 2 — Toute écriture déclare SA CLASSE HORS-LIGNE, et elle vient du registre.
 *
 * ⚠️ LA CLASSE EST LUE DEPUIS `docs/registre-classes-offline.md`, JAMAIS
 * RECOPIÉE ICI. Une valeur recopiée diverge au premier changement, et la
 * divergence ne se voit qu'à la première coupure réseau en exploitation.
 */
export type ClasseHorsLigne = 'A' | 'B' | 'C' | 'D'

export interface Operation {
  readonly nom: string
  readonly classe: ClasseHorsLigne
}

/**
 * 3 — Toute lecture est paramétrée par l'établissement actif.
 *
 * ⚠️ AUCUNE INTERFACE NE SUPPOSE QU'UN ÉTABLISSEMENT A DE L'HÉBERGEMENT OU UN
 * POINT DE VENTE (constitution, principe 2). C'est ce que « Résidence Test »
 * vérifie : un seul module actif, aucun point de vente, aucun article.
 */
export interface PorteeLecture {
  readonly etablissementId: string
}

/**
 * 4 — Aucune interface ne rend un type propre à la simulation.
 *     Ce qu'elle rend est ce que le client généré rendra.
 */
