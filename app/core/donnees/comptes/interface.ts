import type { ResultatDomaine } from '~/core/donnees/contrat'
import type { Compte, Personne } from '~/core/donnees/comptes/types'
import type { Etablissement } from '~/core/donnees/etablissements/types'

/**
 * CE QUE `R0` OBTIENT QUAND L'IDENTIFICATION RÉUSSIT.
 *
 * ⚠️ CE N'EST PAS UNE `Session`, ET LA NUANCE COMPTE. Une session porte aussi
 * une **portée**, et la portée est un CHOIX — le dernier site retenu, ou celui
 * qu'on désigne. Le domaine, lui, rend ce qu'il sait : qui est entré, et où il
 * a des droits. C'est l'écran qui compose la session à partir de là, et c'est
 * pourquoi rouvrir l'application ramène au dernier site choisi plutôt qu'au
 * premier de la liste (FR-032).
 *
 * ⚠️ ET IL N'Y A NI JETON, NI EMPREINTE, NI DATE D'EXPIRATION. Aucun secret
 * n'est servi au navigateur (constitution, principe 9). En phase 3, le serveur
 * fera foi ; ce type ne changera pas.
 */
export interface Identification {
  readonly compteId: string
  /** Les établissements où CE compte a des droits. Rien d'autre n'est proposé. */
  readonly etablissements: readonly Etablissement[]
}

export interface DonneesComptes {
  listerComptes(): Promise<ResultatDomaine<readonly Compte[]>>
  lireCompte(id: string): Promise<ResultatDomaine<Compte>>
  /**
   * L'IDENTITÉ CIVILE — **distincte du compte**, et jamais confondue avec lui
   * (CPT-00). `compte` porte un identifiant d'authentification ; `personne`
   * porte un nom. Afficher l'un pour l'autre mettrait un numéro de téléphone en
   * haut à droite de chaque écran.
   */
  lirePersonne(id: string): Promise<ResultatDomaine<Personne>>
  /**
   * CE QUE `R0` APPELLE.
   *
   * ⚠️ `motDePasse` EST **REÇU ET IGNORÉ**, ET C'EST DÉLIBÉRÉ. Aucun secret
   * n'est servi au navigateur, et il n'y a pas de serveur en phase 2 : **il n'y
   * a rien à comparer**. Le retirer de la signature ferait de la phase 3 une
   * **rupture d'interface** — `R0` devrait changer le jour où
   * l'authentification arrive, c'est-à-dire au moment où l'on a le moins envie
   * d'y toucher. Le garder rend le branchement mécanique : on remplace
   * `simulation.ts` par un appel à `POST /api/v1/session`, et l'écran ne bouge
   * pas. Il n'est ni stocké, ni journalisé, ni comparé.
   *
   * ⚠️ QUATRE CAS D'ÉCHEC, **DEUX CODES**. Compte inconnu, mot de passe faux,
   * compte `SUSPENDU` et compte `REVOQUE` rendent tous
   * `IDENTIFIANTS_INVALIDES` : les distinguer publierait la liste des comptes
   * existants. Le champ vide, lui, a son propre code — ce n'est pas un échec de
   * connexion, et la personne doit savoir quoi corriger.
   */
  identifier(
    identifiantSaisi: string,
    motDePasse: string,
  ): Promise<ResultatDomaine<Identification>>
  /** Les établissements où CE compte a des droits. Rien d'autre n'est proposé. */
  etablissementsDe(compteId: string): Promise<ResultatDomaine<readonly Etablissement[]>>
  /**
   * LE POSTE, **SI ET SEULEMENT SI IL EST UNIQUE**. `null` sinon — jamais
   * « plusieurs », jamais une liste, jamais un poste choisi par défaut.
   *
   * ⚠️ **CONSTAT VÉRIFIÉ DANS LE SQL** : `20-comptes.sql` ne contient AUCUNE
   * référence à `point_de_vente`. Il n'existe, dans tout le modèle de phase 1,
   * aucun lien `compte → point_de_vente`. Le poste n'est donc **pas une
   * donnée** : c'est un **calcul**, et il ne rend un résultat que lorsqu'il est
   * sans ambiguïté.
   *
   *     compte ─(compte_role · etablissementId)→ rôles
   *            ─(permissionsParRole)→ permissions
   *            ─(permission.moduleActiviteCode, non nul)→ modules
   *            ─(point_de_vente.moduleActiviteId)→ postes candidats
   *
   * ⚠️ ET C'EST POURQUOI ELLE REND `null` DÈS QU'IL Y EN A PLUS D'UN. Le second
   * segment de l'en-tête **affirme un fait** ; l'affirmer sans le savoir est un
   * mensonge que six cycles hériteraient. **Ne rien afficher rend le manque
   * visible à l'écran**, ce qui est l'objet même de la phase 2. D'où viendra le
   * poste quand il y en a plusieurs appartient au cycle **F4**.
   */
  posteUniqueSur(
    compteId: string,
    etablissementId: string,
  ): Promise<ResultatDomaine<string | null>>
  /**
   * CE QUE LA PERSONNE FAIT ICI — « Gérant », « Caisse », « Réception ».
   *
   * ⚠️ CE SONT LES **LIBELLÉS** DU RÉFÉRENTIEL, PAS LE MOT « RÔLE ». Le lexique
   * proscrit du visible les mots « rôle » et « permission » — la MÉCANIQUE — et
   * non les fonctions elles-mêmes, que les quatre maquettes affichent en haut à
   * droite. « Gérante · Caisse · Réception » dit ce qu'Adjoua fait ; « trois
   * rôles » dirait comment le système le sait.
   *
   * ⚠️ ET C'EST **SUR CET ÉTABLISSEMENT**. Yao est « Gérant · Caissier » au
   * maquis et « Réceptionniste » à Deloria : afficher l'union des deux ferait
   * croire qu'il encaisse là où il ne le peut pas.
   */
  fonctionsSur(
    compteId: string,
    etablissementId: string,
  ): Promise<ResultatDomaine<readonly string[]>>
  /**
   * ⚠️ L'**UNION** DES PERMISSIONS DES RÔLES DU COMPTE **SUR CET
   * ÉTABLISSEMENT**. Les rôles sont cumulables, et c'est la norme, pas
   * l'exception (CPT-02) : Adjoua en porte trois.
   */
  resoudrePermissions(
    compteId: string,
    etablissementId: string,
  ): Promise<ResultatDomaine<readonly string[]>>
}
