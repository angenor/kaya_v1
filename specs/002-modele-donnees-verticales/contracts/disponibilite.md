# Contrat — la disponibilité, et ce que la base garantit toute seule

*Opposable à la phase 3. Ce document dit **ce qu'aucune ligne de code n'a plus à faire**, et **ce qu'il reste à faire** — la frontière entre les deux est la seule chose qui compte ici, parce qu'un service qui reprend un contrôle que la base tient déjà finit par le tenir différemment.*

**Décision la plus structurante et la plus irréversible du produit** (cadrage §5.1, constitution principe 4). Le marché pratique massivement le passage horaire et la demi-journée : une paire de dates rendrait le produit inapte à son marché principal, et le rattraper coûterait la migration de toutes les occupations.

---

## 1 · La forme, à la lettre

```sql
periode                 TSTZRANGE NOT NULL,   -- ce que le client occupe, et ce qui se facture
periode_indisponibilite TSTZRANGE NOT NULL,   -- l'occupation + le temps de remise en état

CONSTRAINT ck_occupation_periode_incluse
    CHECK (periode_indisponibilite @> periode),

CONSTRAINT ex_occupation_unite_periode
    EXCLUDE USING gist (unite_id WITH =, periode_indisponibilite WITH &&)
    WHERE (statut <> 'ANNULEE')
```

**Les bornes sont `[début, fin)`** — fermée à gauche, ouverte à droite. Une occupation qui finit à 18h00 et une qui commence à 18h00 **ne se chevauchent pas**. C'est ce qui permet d'exprimer « jusqu'à midi » sans se demander si midi est inclus.

**`unite_id WITH =` exige l'extension `btree_gist`** — un `UUID` ne s'indexe pas en GiST sans elle. Elle est posée par `00-conventions.sql` depuis le cycle D1, explicitement pour ce jour.

---

## 2 · Ce que la base garantit — et qu'aucun service ne refait

| Garantie | Ce qu'elle rend impossible |
|---|---|
| **Aucun chevauchement d'indisponibilités sur une même unité** | La double attribution, y compris entre deux processus concurrents, y compris sous forte charge |
| **Le temps de remise en état est respecté** | Attribuer une unité qui n'a pas été faite — la remise en état est **dans** l'intervalle protégé |
| **La période facturée est incluse dans l'indisponibilité** | Facturer plus que ce qui a été bloqué |
| **Une occupation annulée ne réserve plus rien** | Qu'une annulation rende l'unité définitivement inlouable |

**Ce n'est pas un verrou applicatif, et la différence est la raison d'être de cette page.** Un verrou se contourne par un second processus, un second nœud, un rejeu de file après coupure. Une contrainte d'exclusion ne se contourne pas : elle est évaluée par le moteur, sous la sérialisation du moteur, pour toute transaction sans exception — y compris celle qui aurait oublié de prendre le verrou.

**Corollaire opposable à la phase 3** : **aucun `SELECT` de vérification préalable ne tient lieu de garantie.** Lire « l'unité est libre » puis insérer est un intervalle de temps pendant lequel elle cesse de l'être. La forme correcte est **d'insérer et de traiter le rejet** — code d'erreur `23P01`, `exclusion_violation`.

---

## 3 · Ce que la base NE garantit pas — et qui reste au `domain`

| Non garanti | Pourquoi la base ne peut pas | Où c'est |
|---|---|---|
| Que `periode_indisponibilite` finisse bien à `periode.fin + temps_remise_en_etat` | La durée dépend du couple **catégorie + formule** ; une contrainte devrait joindre trois tables à chaque écriture | Calcul du `domain`, phase 3 |
| Que la période respecte les contraintes de la formule — durée min et max, plages, jours autorisés | Même motif | Calcul du `domain`, phase 3 |
| Qu'une demi-journée tombe sur une plage déclarée | Idem | Calcul du `domain`, phase 3 |
| Que le début d'occupation vienne de l'**horodatage d'autorité** et jamais d'un terminal | Aucune contrainte SQL ne distingue l'origine d'une valeur | **Règle de service**, cadrage §11.4 |

**Le dernier point est le plus dangereux, et il est écrit ici parce que c'est là qu'on le lira.** Le calcul de durée de passage s'appuie **exclusivement** sur l'horodatage d'autorité serveur — en mode nœud de site, sur celui du nœud. **Jamais sur l'horloge d'un terminal**, qui se règle à la main. `horodatage_client` existe sur `occupation` comme sur toute table qu'un terminal alimente : il est **indicatif**, et aucune règle de durée, de tarification ou de fiscalité ne s'y appuie.

---

## 4 · Les quatre écritures qui touchent la disponibilité

| Opération | Ce qui se passe sur `occupation` | Classe |
|---|---|---|
| **Check-in** (SEJ-02) | Une ligne, motif `SEJOUR`, statut actif | **B** |
| **Réservation** (RSV-01) | Une ligne, motif `RESERVATION` ; la conversion en séjour **conserve la même ligne** et change son motif | **B** |
| **Prolongation, départ anticipé** (SEJ-04) | `periode` et `periode_indisponibilite` étendues ou réduites — **le rejet sur conflit avec la réservation suivante est le signalement explicite** que la story demande | **B** |
| **Changement d'unité en cours de séjour** (SEJ-04) | **Deux lignes** — la première close sur l'instant du changement, la seconde ouverte sur la nouvelle unité. L'historique est conservé, comme la story l'exige | **B** |
| **Mise hors service** (HEB-06) | Une ligne, motif `MAINTENANCE` — **un seul mécanisme de disponibilité, jamais deux** | **B** |
| **Annulation, no-show** (RSV-04) | Statut passé à annulé — l'intervalle est libéré, la ligne demeure | **B** |

**Les six sont de classe B**, donc **inatteignables depuis un chemin de code exécutable hors ligne** (constitution, principe 6). Le test qui échoue si elles le deviennent est celui du registre §11, instancié par `tester_classe_bcd!`.

**Le statut d'occupation d'une unité — libre, occupée, réservée — se calcule depuis cette table.** Il n'a **aucune colonne**, et le confondre avec le statut ménage produit des doubles attributions (cadrage §11.4). Le statut **ménage**, lui, est une colonne de `unite`, de classe **A**, en dernier-écrit-gagne — **seul cas du produit**.

---

## 5 · Deux recherches, un seul index

**L'index GiST de la contrainte d'exclusion sert les recherches de chevauchement.** Une contrainte `EXCLUDE` est adossée à un index ; en créer un second ferait payer chaque écriture deux fois pour la même recherche.

| Recherche | Ce qui la sert |
|---|---|
| « Cette unité est-elle libre entre T1 et T2 ? » | L'index de `ex_occupation_unite_periode` |
| « Quelles unités de la catégorie X sont libres entre T1 et T2 ? » | `ix_unite_categorie`, puis l'index d'exclusion — **c'est la requête que SC-010 mesure** |

**La seconde est mesurée plutôt que supposée** ([D-27](../research.md)) : elle part de la catégorie, joint `unite`, puis exclut par les occupations, et rien ne garantit d'avance que le planificateur choisisse un parcours d'index. Le [quickstart](../quickstart.md) la mesure sur 50 unités et 20 000 occupations, avec `EXPLAIN (ANALYZE, BUFFERS)`.

---

## 6 · Le piège que ce cycle est le premier à rencontrer

**Une contrainte d'exclusion ajoutée après coup échoue sur les données existantes.** Elle se pose **à la création de la table**, jamais par `ALTER TABLE`.

Le cycle D1 l'a consigné dans `00-conventions.sql` sans avoir de contrainte à poser — il l'écrivait pour ce cycle-ci. **C'est maintenant qu'il compte** : une migration de phase 3 qui voudrait durcir cette contrainte — ajouter un motif au `WHERE`, changer les bornes — ne pourra pas le faire sur une table peuplée. La forme retenue doit donc être la bonne **dès aujourd'hui**, et c'est pourquoi les deux périodes et la clause partielle ont été arbitrées ici plutôt que laissées à plus tard.
