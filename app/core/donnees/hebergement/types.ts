/**
 * ⚠️ MÊME FORME QUE `docs/modele-donnees/97-hebergement.sql`.
 *
 * ⚠️ **LE MOUVEMENT EST ENTRÉ AU CYCLE F3.** Ce fichier portait, jusqu'ici,
 * l'avertissement inverse — « ce cycle porte le RÉFÉRENTIEL, pas le
 * mouvement ». Il est **levé dans le changement qui livre les neuf types
 * ci-dessous** : le laisser en place ferait mentir le seul avertissement que
 * quelqu'un lira avant d'ajouter une entité, et le mensonge coûterait une
 * seconde définition d'`Occupation` ailleurs.
 *
 * Ce qui reste vrai, et qui n'est PAS du mouvement : la **réservation**
 * (`hebergement.reservation`, cycle F7) et les **cinq provisions** —
 * `prestation_incluse`, `contrat_location`, `caution`, `charge_locative`,
 * `etat_des_lieux`. Elles existent en phase 1 **et nulle part ailleurs**
 * (constitution, principe 10) : les typer ici serait les faire entrer par la
 * porte de service.
 *
 * ⚠️ LA CONTRAINTE D'EXCLUSION GiST A DÉSORMAIS QUELQUE CHOSE À GARANTIR, et
 * c'est `periodeIndisponibilite` — jamais `periode`. Son pendant front vit dans
 * `app/core/reception/disponibilite.ts`, **seconde ligne de défense**, jamais la
 * première.
 */

/** ← `hebergement.categorie` — « Type de chambre » à l'écran, jamais ce mot. */
export interface Categorie {
  readonly id: string
  readonly tenantId: string
  readonly etablissementId: string
  readonly nom: string
  readonly capaciteAccueil: number
  readonly ordre: number
  readonly actif: boolean
}

/**
 * ⚠️ **TROIS VALEURS, ET PAS UNE DE PLUS** — celles de
 * `ck_unite_statut_menage`. Le cycle F1 en déclarait **quatre**, dont
 * `EN_NETTOYAGE` et `HORS_SERVICE` que la base **refuse** : l'écart est passé
 * parce que le test de conformité comparait les noms de colonnes sans lire les
 * contraintes. *Corrigé au cycle F3, dès que le premier écran a eu à rendre un
 * statut — et un test lit désormais le `CHECK`.*
 *
 * ⚠️ **`MAINTENANCE` EST UN ÉTAT DE MÉNAGE — « la chambre attend un
 * plombier » —, JAMAIS UNE INDISPONIBILITÉ.** Celle-là est une occupation, de
 * motif `MAINTENANCE` ou `BLOCAGE`. Les confondre produirait deux mécanismes de
 * disponibilité concurrents, donc des doubles attributions.
 */
export const STATUTS_MENAGE = ['PROPRE', 'A_NETTOYER', 'MAINTENANCE'] as const
export type StatutMenage = (typeof STATUTS_MENAGE)[number]

/** ← `hebergement.unite` — « chambre », « logement » ou « salle » à l'écran. */
export interface Unite {
  readonly id: string
  readonly tenantId: string
  readonly categorieId: string
  readonly code: string
  readonly etage: string | null
  readonly statutMenage: StatutMenage
  readonly actif: boolean
}

export const TYPES_FORMULE = ['NUITEE', 'PASSAGE', 'DEMI_JOURNEE', 'MENSUEL'] as const
export type TypeFormule = (typeof TYPES_FORMULE)[number]

export const REGLES_CONVERSION_TAXE = ['une_nuitee_par_occupation', 'au_prorata'] as const
export type RegleConversionTaxe = (typeof REGLES_CONVERSION_TAXE)[number]

/**
 * ← `hebergement.formule` — « Formule » à l'écran, jamais « tarif ».
 *
 * ⚠️ `prixBase` PORTE LE TARIF **HORS TAXE DE SÉJOUR**, ET C'EST LE POINT
 * FISCAL DU JEU. Le cadrage §2.1 porte un point de conformité explicite : les
 * tarifs affichés « incluent une augmentation de 500 FCFA par catégorie », ce
 * qui correspond à la taxe communale de nuitée — intégrée au prix au lieu
 * d'être une ligne distincte, elle place l'établissement EN INFRACTION.
 *
 * Le jeu simulé encode donc la forme CONFORME. Y écrire 12 500 avec
 * `assujettieTaxeNuitee = true` ferait COMPTER LA TAXE DEUX FOIS au premier
 * cycle qui calcule — et le défaut passerait pour un défaut de calcul.
 *
 * ⚠️ ET CE CYCLE NE CALCULE RIEN : il porte le référentiel, il ne le lit pas.
 * La décomposition HT/TVA appartient au cycle fiscal.
 */
export interface Formule {
  readonly id: string
  readonly tenantId: string
  readonly categorieId: string
  readonly type: TypeFormule
  /** Entier en unité mineure (principe 5). `null` quand un barème le remplace. */
  readonly prixBase: number | null
  readonly codeDevise: string
  readonly dureeMinMinutes: number | null
  readonly dureeMaxMinutes: number | null
  /** `HH:MM` — la forme d'un `TIME`. */
  readonly heureArriveeStandard: string | null
  readonly heureDepartStandard: string | null
  readonly joursAutorises: readonly number[] | null
  readonly assujettieTaxeNuitee: boolean
  readonly regleConversionTaxe: RegleConversionTaxe | null
  readonly actif: boolean
}

/** ← `hebergement.bareme_palier` — le barème de passage, à paliers dégressifs. */
export interface BaremePalier {
  readonly id: string
  readonly tenantId: string
  readonly formuleId: string
  readonly dureeMinutes: number
  readonly prix: number
  readonly codeDevise: string
  readonly estHeureSupplementaire: boolean
}

/**
 * ← `hebergement.plage_demi_journee`
 * ⚠️ LES PLAGES SONT CELLES DE L'ÉTABLISSEMENT, jamais écrites en dur : le
 * lexique l'exige pour le refus `plage_non_fractionnable`, dont la phrase les
 * REÇOIT.
 */
export interface PlageDemiJournee {
  readonly id: string
  readonly tenantId: string
  readonly formuleId: string
  readonly libelle: string
  readonly heureDebut: string
  readonly heureFin: string
}

/** ← `hebergement.temps_remise_en_etat` — intégré à l'indisponibilité. */
export interface TempsRemiseEnEtat {
  readonly id: string
  readonly tenantId: string
  readonly categorieId: string | null
  readonly formuleId: string | null
  readonly dureeMinutes: number
}

// ###########################################################################
// LE MOUVEMENT — les neuf types du cycle F3
//
// ⚠️ CE QUI SE PASSE, PAS CE QUI EXISTE. Au-dessus vit le référentiel : les
// chambres, les formules, les barèmes. Ici vivent les occupations, les séjours,
// les notes — ce qu'une réceptionniste crée en travaillant.
// ###########################################################################

/**
 * Un intervalle `[début, fin)` — **jamais une paire de dates** (constitution,
 * principe 4). Instants ISO 8601, en UTC.
 *
 * ⚠️ **LA BORNE HAUTE EST EXCLUE, ET C'EST CE QUI REND DEUX PASSAGES
 * CONSÉCUTIFS POSSIBLES.** `[15 h, 18 h)` et `[18 h, 20 h)` ne se chevauchent
 * pas. Avec une borne fermée, la seconde chambre serait refusée à l'instant
 * exact où la première se libère — et le refus serait juste selon le code,
 * faux selon le couloir.
 */
export interface Intervalle {
  readonly debut: string
  /** Exclue : 18 h 00 → 18 h 00 ne se chevauchent pas. */
  readonly fin: string
}

export const MOTIFS_OCCUPATION = ['SEJOUR', 'RESERVATION', 'MAINTENANCE', 'BLOCAGE'] as const
export type MotifOccupation = (typeof MOTIFS_OCCUPATION)[number]

export const STATUTS_OCCUPATION = ['ACTIVE', 'TERMINEE', 'ANNULEE'] as const
export type StatutOccupation = (typeof STATUTS_OCCUPATION)[number]

/**
 * ← `hebergement.occupation` — **classe B**.
 *
 * ⚠️ **DEUX PÉRIODES, ET ELLES NE DISENT PAS LA MÊME CHOSE.** `periode` est ce
 * que le client occupe **et ce qui se facture** ; `periodeIndisponibilite` est
 * `periode` **plus la remise en état**, et c'est **elle** que le refus protège.
 * Vérifier le chevauchement sur `periode` laisserait passer une occupation qui
 * mord sur le ménage de la précédente : la chambre serait donnée, et le refus
 * se découvrirait avec le client dans le couloir.
 *
 * ⚠️ `periodeIndisponibilite` CONTIENT TOUJOURS `periode`, égalité comprise —
 * une occupation sans remise en état est licite. La base le garantit par
 * `ck_occupation_periode_incluse` ; en phase 2, c'est `disponibilite.ts`, et un
 * test le vérifie.
 *
 * ⚠️ LA MISE HORS SERVICE EST UNE OCCUPATION (motif `MAINTENANCE` ou
 * `BLOCAGE`), jamais une colonne de `unite` : **un seul mécanisme de
 * disponibilité**.
 */
export interface Occupation {
  /** UUID **v7 client** — l'ordre du temps est dans l'identifiant. */
  readonly id: string
  readonly tenantId: string
  readonly uniteId: string
  readonly motif: MotifOccupation
  /** Ce qui est occupé **et facturé**. */
  readonly periode: Intervalle
  /** `periode` + remise en état — **c'est elle que le refus protège**. */
  readonly periodeIndisponibilite: Intervalle
  readonly statut: StatutOccupation
  /** Colonne **nue** : la cible varie — séjour, réservation, intervention. */
  readonly origineType: string | null
  readonly origineId: string | null
  /** **Indicatif**, aucune règle ne s'y appuie. */
  readonly horodatageClient: string | null
  /** **Fait autorité** (constitution, principe 4). */
  readonly creeLe: string
}

export const ETATS_SEJOUR = ['EN_COURS', 'TERMINE', 'ANNULE'] as const
export type EtatSejour = (typeof ETATS_SEJOUR)[number]

/**
 * ← `hebergement.sejour` — **classe B**.
 *
 * ⚠️ **`clientId` EST FACULTATIF, ET C'EST CE QUI REND LE PASSAGE ANONYME
 * REPRÉSENTABLE.** Un passage n'ouvre **aucune** fiche client : la fiche est de
 * classe **C** — partagée entre les établissements du tenant —, et en créer une
 * pour un client de deux heures ferait entrer au fichier une personne qui n'a
 * rien demandé, tout en rendant le passage impossible hors ligne pour une
 * raison qui n'est pas la sienne.
 */
export interface Sejour {
  readonly id: string
  readonly tenantId: string
  /** Rattachement inter-modules vers `etablissements.etablissement` — **nu**. */
  readonly etablissementId: string
  /** ⚠️ Facultatif : le passage anonyme n'ouvre aucune fiche. */
  readonly clientId: string | null
  readonly uniteId: string
  readonly formuleId: string
  readonly occupationId: string
  readonly reservationId: string | null
  readonly etat: EtatSejour
  readonly arriveLe: string
  readonly partiLe: string | null
  readonly horodatageClient: string | null
  readonly creeLe: string
}

export const ETATS_NOTE = ['OUVERTE', 'ARRETEE'] as const
export type EtatNote = (typeof ETATS_NOTE)[number]

/**
 * ← `hebergement.note_sejour` — **classe B**.
 *
 * ⚠️ **`totalProvisoire` EST UN CACHE DE LECTURE**, recalculé depuis les lignes,
 * **jamais incrémenté** : un cache incrémenté dérive en silence, et personne ne
 * compare. *Le total opposable est celui du document fiscal certifié — jamais
 * celui-ci.*
 *
 * ⚠️ **`ARRETEE` EST IRRÉVERSIBLE** et déclenche le cas orphelin des deux
 * sagas : une consommation qui arrive après **ne s'ajoute pas d'office**. La
 * couture refuse, avec sa phrase ; l'écran de réconciliation est du cycle F6.
 */
export interface NoteSejour {
  readonly id: string
  /** **Unique** : une note par séjour. */
  readonly sejourId: string
  readonly tenantId: string
  readonly etat: EtatNote
  readonly arreteeLe: string | null
  /** ⚠️ Cache de lecture, recalculé — jamais incrémenté. */
  readonly totalProvisoire: number
  readonly codeDevise: string
  readonly horodatageClient: string | null
  readonly creeLe: string
}

export const TYPES_LIGNE_SEJOUR = [
  'HEBERGEMENT',
  'CONSOMMATION',
  'PRESSING',
  'TAXE',
  'DIVERS',
] as const
export type TypeLigneSejour = (typeof TYPES_LIGNE_SEJOUR)[number]

/**
 * ← `hebergement.ligne_sejour` — **classe B** *(ou celle de la ligne d'origine)*.
 *
 * ⚠️ **`TAXE` EST UN TYPE DE LIGNE, ET C'EST CE QUI REND L'OBLIGATION LÉGALE
 * STRUCTURELLE.** La taxe de séjour n'est pas un champ du total : c'est **une
 * ligne**, au même rang que les autres. La fondre dans le prix demanderait de
 * la faire disparaître de cette énumération — ce qui se verrait.
 *
 * ⚠️ **`quantite` EST DÉCIMALE, `prixUnitaire` EST ENTIER.** Les deux règles
 * sont dans la même phrase de la constitution et se contredisent en apparence ;
 * elles portent sur des grandeurs différentes. Toutes les quantités de ce cycle
 * valent 1 — l'hébergement ne fractionne pas —, ce qui rend le type facile à
 * écrire faux sans que rien ne le dise avant la quincaillerie de l'incrément 3.
 *
 * ⚠️ **`tauxTva` EST UNE CHAÎNE DÉCIMALE, JAMAIS UN FLOTTANT** — même règle que
 * `Article.tauxTva` (SC-011, cycle F1). `data-model.md` §2.4 l'écrivait
 * `number` ; **le conflit est tranché en faveur de la règle du dépôt**, et le
 * document perdant est corrigé dans le même changement. *Un `NUMERIC` porté par
 * un flottant perd sa dernière décimale sans prévenir, et le taux entre dans un
 * calcul d'argent.*
 */
export interface LigneSejour {
  readonly id: string
  readonly tenantId: string
  readonly noteSejourId: string
  readonly type: TypeLigneSejour
  readonly libelle: string
  /** ⚠️ **Décimale** — `NUMERIC`, jamais un entier. */
  readonly quantite: number
  /** ⚠️ **Entier en unité mineure** (constitution, principe 5). */
  readonly prixUnitaire: number
  readonly codeDevise: string
  /** ⚠️ Chaîne décimale — un `NUMERIC` ne se porte pas par un flottant. */
  readonly tauxTva: string
  /** Saga `ventes` → `hebergement` — colonne **nue**. */
  readonly ligneCommandeId: string | null
  /** Transfert de charges d'un séjour à l'autre — colonne **nue**. */
  readonly sejourOrigineId: string | null
  readonly bonDepotId: string | null
  readonly horodatageClient: string | null
  readonly creeLe: string
}

/**
 * ← `hebergement.client` — **classe C**.
 *
 * ⚠️ **AUCUNE DONNÉE D'IDENTITÉ N'EST DUPLIQUÉE ICI.** Le nom, les prénoms, le
 * type et le numéro de pièce vivent dans `comptes.personne` et **nulle part
 * ailleurs** : la purge de rétention (TRX-06) n'a ainsi qu'une cible. La
 * recherche client lit donc **deux domaines**, et c'est voulu.
 *
 * ⚠️ **DEUX CLASSES SUR UNE MÊME ENTITÉ.** Créer ou modifier la fiche est de
 * classe **C** ; sa note interne, ses préférences et sa photo sont de classe
 * **A**. La couture les sépare **par opération**, jamais par table.
 */
export interface Client {
  readonly id: string
  readonly tenantId: string
  /** Rattachement inter-modules vers `comptes.personne` — **nu**. */
  readonly personneId: string
  readonly nationalite: string | null
  readonly adresse: string | null
  readonly categorieCommerciale: string | null
  /** ⚠️ Classe **A** — modifiable hors ligne, contrairement à la fiche. */
  readonly noteInterne: string | null
  readonly creeLe: string
  readonly modifieLe: string
}

/**
 * ← `hebergement.accompagnant` — **classe A**.
 *
 * ⚠️ **L'ACCOMPAGNANT PORTE LUI-MÊME SON NUMÉRO DE PIÈCE** — il n'a pas de
 * fiche client. La fiche de police couvre le titulaire **et** ses
 * accompagnants ; leur créer une fiche pour porter leur pièce ferait entrer au
 * fichier des personnes qui n'ont rien demandé.
 *
 * ⚠️ **`estMineur` EST UNE COLONNE, PAS UN CALCUL** : le statut vaut **au
 * moment du séjour**, et la date de naissance n'est pas toujours collectée.
 *
 * ⚠️ **LE NOMBRE D'ACCOMPAGNANTS N'ENTRE DANS AUCUN CALCUL DE TAXE** (décision
 * B-10, close). Il est reporté au constat **à titre indicatif**.
 */
export interface Accompagnant {
  readonly id: string
  readonly tenantId: string
  readonly sejourId: string
  readonly nom: string
  readonly prenoms: string | null
  readonly typePiece: string | null
  readonly numeroPiece: string | null
  readonly estMineur: boolean
  readonly horodatageClient: string | null
  readonly creeLe: string
}

/**
 * ← `hebergement.fiche_police` — **classe B**.
 *
 * ⚠️ **`contenu` EST UN DOCUMENT, PAS UN ÉTAT COURANT.** Les mentions exigées
 * varient par juridiction et par époque ; la fiche doit rester lisible **telle
 * qu'elle a été émise**.
 *
 * ⚠️ **`complete: false` N'EST PAS UN DÉFAUT DE SAISIE, C'EST LE PARCOURS
 * NORMAL DU PASSAGE** : la pièce vient **après** la clé. L'écran dit « Identité
 * à compléter », jamais « incomplète » seul.
 */
export interface FichePolice {
  readonly id: string
  readonly tenantId: string
  readonly sejourId: string
  /** Rattachement inter-modules — **nu**. Le registre est par établissement. */
  readonly etablissementId: string
  readonly numero: string
  readonly annee: number
  readonly complete: boolean
  readonly emiseLe: string
  /** JSONB — le document tel qu'il a été émis. */
  readonly contenu: Readonly<Record<string, unknown>>
  readonly horodatageClient: string | null
  readonly creeLe: string
}

/**
 * ← `hebergement.numerotation_fiche_police` — **classe B**.
 *
 * ⚠️ **COMPTEUR, JAMAIS UNE SÉQUENCE.** *Un trou dans une numérotation
 * opposable est une fiche dont personne ne sait si elle a existé.* Une séquence
 * PostgreSQL consomme son numéro même quand la transaction échoue ; un compteur
 * verrouillé ne le fait pas. La simulation reproduit le comportement —
 * incrément **puis** émission —, et un test vérifie qu'une série de N fiches
 * porte les numéros 1..N **sans trou**.
 */
export interface NumerotationFichePolice {
  readonly id: string
  readonly tenantId: string
  readonly etablissementId: string
  readonly annee: number
  readonly dernierNumero: number
  readonly horodatageClient: string | null
  readonly creeLe: string
}

/**
 * ← `hebergement.taxe_sejour_constat` — **classe B**, **immuable**.
 *
 * ⚠️ **TRACE FIGÉE, JAMAIS UNE RÈGLE.** Immuable **par privilège** en base —
 * `SELECT, INSERT` seuls : un changement de paramétrage **ne doit pas réécrire
 * une taxe déjà déclarée**. La simulation le reproduit en **refusant** toute
 * écriture sur un constat existant, plutôt qu'en s'abstenant poliment.
 *
 * ⚠️ **`nombrePersonnes` EST INDICATIF.** Il documente le séjour et **n'entre
 * dans aucun calcul** — c'est la forme, dans la donnée, de la décision B-10 :
 * la taxe se compte **par nuitée et par séjour**, jamais par personne.
 *
 * ⚠️ **`regleAppliquee` PERMET DE RELIRE POURQUOI CE MONTANT** sans rejouer un
 * calcul dont les paramètres ont changé.
 */
export interface TaxeSejourConstat {
  readonly id: string
  readonly tenantId: string
  /** **Unique** : deux constats donneraient deux montants au même reversement. */
  readonly sejourId: string
  readonly nuiteesAssujetties: number
  /** ⚠️ **Indicatif** — n'entre dans aucun calcul (décision B-10). */
  readonly nombrePersonnes: number
  readonly montantUnitaire: number
  readonly montantTotal: number
  readonly codeDevise: string
  readonly regleAppliquee: string
  readonly constateLe: string
  readonly horodatageClient: string | null
  readonly creeLe: string
}
