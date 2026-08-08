# Modèle de données — cycle F3, le mouvement de la réception

**Phase 2.** Ce document décrit **les types front** que ce cycle ajoute à la couture, et **rien
d'autre** : aucune table n'est créée, aucune migration n'est écrite. Les tables existent depuis le
cycle **D2** ; `docs/modele-donnees/97-hebergement.sql` **fait foi** et ce document en est le miroir
côté application.

> ⚠️ **La règle qui gouverne ce fichier** : *« le jeu de données simulées a la forme du modèle —
> mêmes noms de champs, mêmes types, mêmes valeurs d'énumération »* (Definition of Done, point 12).
> Un test d'unité le vérifie **champ par champ** contre le SQL ; c'est lui qui empêche la simulation
> de dériver pendant les six mois qui la séparent de son endpoint.

---

## 1. Ce que le cycle F1 a déjà posé, et que F3 ne retouche pas

`app/core/donnees/hebergement/types.ts` porte le **référentiel** : `Categorie`, `Unite`,
`StatutMenage`, `Formule`, `TypeFormule`, `RegleConversionTaxe`, `BaremePalier`, `PlageDemiJournee`,
`TempsRemiseEnEtat`. Ce cycle les **lit** et n'en modifie aucun.

Le fichier porte en tête : *« Ce cycle porte le RÉFÉRENTIEL, pas le mouvement. Aucune occupation,
aucun séjour, aucune réservation, aucune note, aucune fiche de police : ce sont des données de
mouvement, et elles appartiennent aux cycles F3 et F7. »* **Ce commentaire est levé par ce
cycle-ci**, dans le même changement que les types ci-dessous — le laisser en place ferait mentir le
seul avertissement que quelqu'un lira avant d'ajouter une entité.

---

## 2. Les neuf types de mouvement ajoutés

Tous vivent dans `app/core/donnees/hebergement/types.ts`, à la suite du référentiel, avec le renvoi
`← hebergement.{table}` que le fichier emploie déjà.

### 2.1 `Occupation` ← `hebergement.occupation` — classe **B**

| Champ front | Colonne SQL | Type | Note |
|---|---|---|---|
| `id` | `id` | `string` | UUID **v7 client** |
| `tenantId` | `tenant_id` | `string` | |
| `uniteId` | `unite_id` | `string` | |
| `motif` | `motif` | `MotifOccupation` | `SEJOUR` · `RESERVATION` · `MAINTENANCE` · `BLOCAGE` |
| `periode` | `periode` | `Intervalle` | **ce qui est occupé ET facturé** |
| `periodeIndisponibilite` | `periode_indisponibilite` | `Intervalle` | `periode` + remise en état — **c'est elle que le refus protège** |
| `statut` | `statut` | `StatutOccupation` | `ACTIVE` · `TERMINEE` · `ANNULEE` |
| `origineType` | `origine_type` | `string \| null` | colonne **nue**, la cible varie |
| `origineId` | `origine_id` | `string \| null` | idem |
| `horodatageClient` | `horodatage_client` | `string \| null` | **indicatif**, aucune règle |
| `creeLe` | `cree_le` | `string` | **fait autorité** |

```ts
/** Un intervalle [début, fin) — jamais une paire de dates. Instants ISO 8601. */
export interface Intervalle {
  readonly debut: string
  /** Exclue : 18 h 00 → 18 h 00 ne se chevauchent pas. */
  readonly fin: string
}
```

⚠️ **`periodeIndisponibilite` contient toujours `periode`**, égalité comprise — une occupation sans
remise en état est licite. Le domaine la pose à `periode.fin + duree`, **la base ne peut pas le
garantir** : la contrainte devrait joindre trois tables à chaque écriture. En phase 2, c'est
`app/core/reception/disponibilite.ts` qui tient cette invariante, et un test la vérifie.

### 2.2 `Sejour` ← `hebergement.sejour` — classe **B**

`id` · `tenantId` · `etablissementId` *(rattachement inter-modules, **nu**)* · **`clientId: string |
null`** · `uniteId` · `formuleId` · `occupationId` · `reservationId: string | null` ·
`etat: 'EN_COURS' | 'TERMINE' | 'ANNULE'` · `arriveLe` · `partiLe: string | null` ·
`horodatageClient` · `creeLe`.

⚠️ **`clientId` est facultatif, et c'est ce qui rend le passage anonyme représentable.** Un passage
n'ouvre **aucune** fiche client : la fiche est de classe **C** (partagée entre les établissements du
tenant), et en créer une pour un client de deux heures ferait entrer au fichier une personne qui n'a
rien demandé — et rendrait le passage impossible hors ligne pour une raison qui n'est pas la sienne.

### 2.3 `NoteSejour` ← `hebergement.note_sejour` — classe **B**

`id` · `tenantId` · `sejourId` *(**unique**)* · `etat: 'OUVERTE' | 'ARRETEE'` ·
`arreteeLe: string | null` · `totalProvisoire: number` · `codeDevise: string` · `horodatageClient` ·
`creeLe`.

⚠️ **`totalProvisoire` est un CACHE de lecture**, recalculé depuis les lignes. *Le total opposable
est celui du document fiscal certifié — jamais celui-ci.* En phase 2, la simulation le recalcule à
chaque écriture plutôt que de l'incrémenter : un cache incrémenté dérive en silence, et personne ne
compare.

⚠️ **`ARRETEE` déclenche le cas orphelin** des deux sagas : une consommation qui arrive après **ne
s'ajoute pas d'office**. Ce cycle ne construit pas l'écran de réconciliation (F6), mais la couture
**refuse déjà** l'ajout, avec sa phrase.

### 2.4 `LigneSejour` ← `hebergement.ligne_sejour` — classe **B** *(ou celle de la ligne d'origine)*

`id` · `tenantId` · `noteSejourId` · `type: TypeLigneSejour` · `libelle` · **`quantite: number`
(décimale)** · **`prixUnitaire: number` (entier en unités mineures)** · `codeDevise` ·
**`tauxTva: string`** · `ligneCommandeId: string | null` *(saga `ventes` → `hebergement`, **nue**)* ·
`sejourOrigineId: string | null` *(transfert de charges)* · `bonDepotId: string | null` ·
`horodatageClient` · `creeLe`.

⚠️ **`tauxTva` EST UNE CHAÎNE, ET CE DOCUMENT A ÉTÉ CORRIGÉ.** La première rédaction l'écrivait
`number` ; c'est un **conflit constaté** avec la règle du dépôt, posée au cycle F1 et vérifiée par
SC-011 : *« `tauxTva` en CHAÎNE décimale — jamais un flottant »* (`Article.tauxTva`, et le test
`conformite-modele.spec.ts` qui l'exige). **Tranché en faveur de la règle du dépôt**, et le document
perdant — celui-ci — est corrigé **dans le même changement que le code** (`CLAUDE.md`). *Un `NUMERIC`
porté par un flottant perd sa dernière décimale sans prévenir, et le taux entre dans un calcul
d'argent.*

```ts
export const TYPES_LIGNE_SEJOUR = [
  'HEBERGEMENT', 'CONSOMMATION', 'PRESSING', 'TAXE', 'DIVERS',
] as const
```

⚠️ **`TAXE` est un type de ligne, et c'est ce qui rend l'obligation légale structurelle** : la taxe
de séjour n'est pas un champ du total, c'est **une ligne**, au même rang que les autres. La fondre
dans le prix demanderait de la faire disparaître de cette énumération — ce qui se verrait.

⚠️ **`quantite` est décimale, `prixUnitaire` est entier.** Les deux règles sont dans la même phrase
de la constitution et se contredisent en apparence ; elles portent sur des grandeurs différentes.
Toutes les quantités de ce cycle valent 1 — l'hébergement ne fractionne pas —, ce qui rend le type
facile à écrire faux sans que rien ne le dise avant la quincaillerie de l'incrément 3.

### 2.5 `Client` ← `hebergement.client` — classe **C**

`id` · `tenantId` · **`personneId`** *(rattachement **nu** vers `comptes.personne`)* ·
`nationalite: string | null` · `adresse: string | null` · `categorieCommerciale: string | null` ·
`noteInterne: string | null` · `creeLe` · `modifieLe`.

⚠️ **Aucune donnée d'identité n'est dupliquée ici.** Le nom, les prénoms, le type et le numéro de
pièce vivent dans `comptes.personne` — déjà exposé par `app/core/donnees/comptes/types.ts` — et
**nulle part ailleurs** : la purge de rétention (TRX-06) n'a ainsi qu'une cible. La recherche client
de `R5` lit donc **deux domaines**, et c'est voulu.

⚠️ **`noteInterne`, les préférences et la photo sont de classe A** — modifiables hors ligne — alors
que la **création ou la modification de la fiche est de classe C**. Deux classes sur une même
entité : la couture les sépare **par opération**, jamais par table.

### 2.6 `Accompagnant` ← `hebergement.accompagnant` — classe **A**

`id` · `tenantId` · `sejourId` · `nom` · `prenoms: string | null` · `typePiece: string | null` ·
`numeroPiece: string | null` · **`estMineur: boolean`** · `horodatageClient` · `creeLe`.

⚠️ **L'accompagnant porte lui-même son numéro de pièce** — il n'a pas de fiche client. La fiche de
police couvre le titulaire **et** ses accompagnants ; leur créer une fiche client pour porter leur
pièce ferait entrer au fichier des personnes qui n'ont rien demandé.

⚠️ **`estMineur` est une colonne, pas un calcul** : le statut vaut **au moment du séjour**, et la
date de naissance n'est pas toujours collectée.

⚠️ **Le nombre d'accompagnants n'entre dans aucun calcul de taxe** (décision B-10, close). Il est
reporté au constat à titre indicatif.

### 2.7 `FichePolice` ← `hebergement.fiche_police` — classe **B**

`id` · `tenantId` · `sejourId` · **`etablissementId`** · `numero` · `annee` ·
**`complete: boolean`** · `emiseLe` · **`contenu: Record<string, unknown>`** *(JSONB)* ·
`horodatageClient` · `creeLe`.

⚠️ **`contenu` est un document, pas un état courant.** Les mentions exigées varient par juridiction
et par époque ; la fiche doit rester lisible **telle qu'elle a été émise**.

⚠️ **`complete: false` n'est pas un défaut de saisie, c'est le parcours normal du passage** : la
pièce vient **après** la clé. L'écran dit « Identité à compléter », jamais « incomplète » seul.

### 2.8 `NumerotationFichePolice` ← `hebergement.numerotation_fiche_police` — classe **B**

`id` · `tenantId` · `etablissementId` · `annee` · `dernierNumero` · `horodatageClient` · `creeLe`.

⚠️ **LES DEUX DERNIÈRES COLONNES ONT ÉTÉ AJOUTÉES À L'IMPLÉMENTATION**, sur constat : la table les
porte dans `97-hebergement.sql`, et le test de conformité — qui lit le SQL plutôt qu'une liste
recopiée — les a réclamées. *C'est exactement le service qu'on attend de lui.*

⚠️ **Compteur, jamais une séquence.** *Un trou dans une numérotation opposable est une fiche dont
personne ne sait si elle a existé.* La simulation reproduit le comportement — incrément puis
émission —, et un test vérifie qu'une série de N fiches porte les numéros 1..N **sans trou**.

### 2.9 `TaxeSejourConstat` ← `hebergement.taxe_sejour_constat` — classe **B**, **immuable**

`id` · `tenantId` · `sejourId` *(**unique**)* · `nuiteesAssujetties` · **`nombrePersonnes`** ·
`montantUnitaire` · `montantTotal` · `codeDevise` · **`regleAppliquee`** · `constateLe` ·
`horodatageClient` · `creeLe`.

⚠️ **Trace figée, jamais une règle.** Immuable **par privilège** en base — `SELECT, INSERT` seuls :
un changement de paramétrage **ne doit pas réécrire une taxe déjà déclarée**. La simulation le
reproduit en refusant toute écriture sur un constat existant, plutôt qu'en s'abstenant poliment.

⚠️ **`nombrePersonnes` est indicatif.** Il documente le séjour et **n'entre dans aucun calcul** —
c'est la forme, dans la donnée, de la décision B-10.

⚠️ **`regleAppliquee` permet de relire POURQUOI ce montant** sans rejouer un calcul dont les
paramètres ont changé.

---

## 3. Les classes hors-ligne — lues au registre, jamais recopiées

`docs/registre-classes-offline.md` porte déjà les neuf entités (§7.2 et §7.3). **Aucune ligne n'est
à ajouter**, et c'est le résultat attendu : le cycle D2 les a déclarées en même temps qu'il créait
les tables.

| Opération de ce cycle | Classe | Ligne du registre |
|---|---|---|
| Attribution d'unité — créer une occupation | **B** | `occupation` — B3, ressource unique, contrainte GiST |
| Arrivée — créer un séjour | **B** | `sejour` — check-in, B3 |
| Garder une chambre *(occupation `RESERVATION` courte)* | **B** | même ligne que l'occupation |
| Ouvrir / arrêter une note | **B** | `note_sejour` — effet monétaire |
| Porter une ligne sur la note | **B** | `ligne_sejour` — effet monétaire |
| Départ, figeage de la taxe | **B** | `sejour` check-out · `taxe_sejour_constat` |
| Émettre une fiche de police | **B** | `fiche_police` + `numerotation_fiche_police` |
| **Encaisser en espèces** | **B** | registre §8 — encaissement espèces, irréversible |
| Créer / modifier une fiche client | **C** | `client` — partagée entre établissements du tenant |
| Note interne, préférence, photo | **A** | `client.preferences` — explicitement A |
| Ajouter un accompagnant | **A** | `accompagnant` |
| Changer le statut ménage | **A** | dernier-écrit-gagne autorisé |
| Lire le planning, une note, une fiche | **A** | lecture, fraîcheur affichée |
| Envoyer le document aux impôts | **D** | certification FNE — **simulée ici** |

⚠️ **La couture lit la classe, elle ne la déclare pas.** `app/core/donnees/contrat.ts` porte déjà
`Operation { nom, classe }` avec l'avertissement : *« la classe est lue depuis
`docs/registre-classes-offline.md`, JAMAIS recopiée ici »*.

---

## 4. Les codes d'échec ajoutés à la couture

`CodeEchec` de `app/core/donnees/contrat.ts` s'étend de **onze codes**, tous déjà nommés au lexique
avec leur phrase et leurs paramètres. **Aucun message n'est rendu** — l'écran branche sa clé i18n
sur le code.

| Code | Paramètres | Phrase (lexique) |
|---|---|---|
| `UNITE_DEJA_OCCUPEE` | `unite`, `debut`, `fin` | « Cette chambre est déjà prise sur cette période. » |
| `CONFLIT_OCCUPATION_SUIVANTE` | `heure` + **les chambres libres** | « Cette chambre est réservée à partir de {heure}. » |
| `UNITE_CIBLE_OCCUPEE` | `unite` | « Cette chambre n'est pas libre sur la période restante. » |
| `PLAGE_NON_FRACTIONNABLE` | `plage1`, `plage2` *(de l'établissement)* | « Une demi-journée se loue en entier : … » |
| `INTERVALLE_INVALIDE` | — | « La fin doit être après le début. » |
| `DUREE_HORS_CONTRAINTE` | `min`, `max` *(de la formule)* | « Cette formule se loue de 1 h à 8 h. » |
| `FORMULE_HORS_CATEGORIE` | — | « Cette formule ne s'applique pas à cette chambre. » |
| `SEJOUR_DEJA_CLOS` | — | « Ce séjour est déjà terminé. » |
| `SEJOUR_CLOS` | — | « On ne prolonge pas un séjour terminé. » |
| `NOTE_ARRETEE` | — | « La note est arrêtée : plus rien ne peut s'y ajouter. » |
| `BASCULE_FORMULE_NON_CONFIRMEE` | `seuilHeures`, `montant` | « Au-delà de {n} h, le tarif passe à la nuitée. » ⚠️ **à valider au terrain** |

⚠️ **`CONFLIT_OCCUPATION_SUIVANTE` porte une liste dans ses paramètres**, et c'est la seule.
`EchecDomaine.parametres` est typé `Record<string, string | number>` : le contrat s'étend pour
admettre `readonly string[]`. *Sans cela, l'alternative que le lexique exige — « suivie des chambres
libres de la même catégorie » — devrait être recomposée par l'écran, donc réécrite six fois.*

---

## 5. Le jeu de données simulées

**Établissement** : Hôtel Deloria — déjà peuplé par le cycle F1 pour le référentiel.

| Ce que le jeu ajoute | Volume | Ce que cela exerce |
|---|---|---|
| Occupations de la semaine **calme** | 9 | `V1-planning.html` |
| Occupations de la semaine **dense** | 34 | `V1-planning-dense.html` — passages, demi-journées et nuits mêlés |
| Chambre **entièrement prise** à l'instant courant | 12/12 | `R4-passage-complet.html` — l'état vide illustré |
| **Deux occupations chevauchantes** à la seconde près | 1 paire | le refus `UNITE_DEJA_OCCUPEE` |
| Une chambre libre **dont la remise en état couvre la demande** | 1 | le refus voisin — celui qu'on oublie, parce que la chambre *paraît* libre |
| Séjour de 4 nuits, 2 personnes, 13 lignes | 1 | `R7-note-depart.html` — et **500 F de taxe**, pas 4 000 |
| Séjour **déjà terminé** | 1 | les deux phrases distinctes du lexique |
| Note **arrêtée** recevant une consommation | 1 | le refus d'ajout, ancêtre du cas orphelin |
| Passage **dont la durée réelle a dépassé son palier** | 1 | la rebascule et sa ligne de motif |
| Passage **au-delà du seuil de bascule** (480 min) | 1 | l'annonce avant application |
| Client connu, 7ᵉ passage, chambre habituelle | 1 | `R4-passage-connu.html` |
| Fiches clients pour la mesure de recherche | 10 000 | SEJ-01 — **jeu séparé**, jamais le jeu nominal |

⚠️ **Toutes les dates du jeu sont relatives à l'horloge de la couture**, jamais absolues. *Un jeu
daté en dur cesse d'exercer ses cas le lendemain, et le test devient vert en ne testant plus rien.*

⚠️ **Le jeu « Résidence Test » n'est pas peuplé de mouvement**, et c'est le contrôle du principe 2 :
un établissement sans hébergement actif ne doit voir **aucune** surface de ce cycle — pas une liste
vide, **rien**.

---

## 6. Transitions d'état

```text
occupation :  ACTIVE ──────► TERMINEE        (départ, ou fin de la garde de chambre)
                 └─────────► ANNULEE         (bandeau d'annulation, ou garde relâchée)
              ⚠️ ANNULEE ne bloque plus la disponibilité — c'est ce qui rend
                 l'annulation de 8 s réellement réversible.

sejour     :  EN_COURS ────► TERMINE         (départ : taxe figée, note arrêtée)
                 └─────────► ANNULE          (annulation dans la fenêtre)

note       :  OUVERTE ─────► ARRETEE         (⚠️ SANS RIEN DIRE DU RÈGLEMENT)
              ⚠️ IRRÉVERSIBLE. Rien ne rouvre une note ; une écriture postérieure
                 part en réconciliation (cycle F6).

envoi      :  EN_ATTENTE ──► SOUMISE ──┬──► CERTIFIEE
                                       ├──► ECHEC          (motif métier → correction)
                                       └──► INDETERMINEE   (butée → JAMAIS rejouée)
              ⚠️ Simulé intégralement. Le cycle F6 porte les cinq états réels.
```

⚠️ **Le passage traverse `OUVERTE → ARRETEE` en un seul geste**, avec l'encaissement entre les deux.
C'est la seule opération du produit où trois transitions tiennent dans un tap — et c'est pourquoi la
fenêtre d'annulation les défait **toutes les trois**, jamais une seule.
