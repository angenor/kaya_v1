# Rapport du cycle D2 — modèle de données des capacités et des verticales

*Ce que les portes ne prouvent pas et qui a été constaté à la main, une fois, par écrit. Chaque
constat porte sa date, sa méthode et son verdict — un contrôle humain non daté n'est pas un
contrôle, c'est un souvenir.*

**Cycle** : D2 · phase 1 du produit (le modèle de données), **second et dernier cycle de la phase**
**Dépôt** : branche `main`
**Poste de mesure** : Apple Silicon (arm64), image `postgres:18.4` multi-architecture, base
éphémère en `tmpfs`

---

## T006 · SC-003 — le chevauchement est-il impossible AU NIVEAU DE LA BASE ?

**Date** : 2026-08-07 · **Méthode** : base éphémère montée par `compose.yml`, modèle appliqué dans
l'ordre, semis d'une catégorie et de deux unités, puis **cinq cas** dont le premier oppose deux
sessions `psql` **réellement concurrentes**.

**C'est la démonstration la plus importante du cycle**, et elle ne demande pas une ligne de code
applicatif.

### Cas 1 — deux transactions concurrentes sur des intervalles chevauchants

| Terminal A | Terminal B |
|---|---|
| `BEGIN` | |
| `INSERT` occupation `[14h00, 18h00)` sur l'unité 101 | |
| | `BEGIN` |
| | `INSERT` occupation `[16h00, 20h00)` sur la **même** unité — **bloque**, en attente |
| `pg_sleep(4)` puis `COMMIT` — **réussit** | |
| | **`ERROR: 23P01`** — l'insertion est refusée |

**Sortie littérale du terminal B**, `VERBOSITY verbose` :

```
ERROR:  23P01: conflicting key value violates exclusion constraint "ex_occupation_unite_periode"
CONSTRAINT NAME:  ex_occupation_unite_periode
LOCATION:  check_exclusion_or_unique_constraint, execIndexing.c:928
DETAIL:  Key (unite_id, periode_indisponibilite)=(…101, ["2026-09-01 16:00:00+00","2026-09-01 20:00:00+00"))
         conflicts with existing key (unite_id, periode_indisponibilite)=(…101, ["2026-09-01 14:00:00+00","2026-09-01 18:00:00+00")).
```

**Décompte après les deux transactions** : `1` ligne sur l'unité 101. **Exactement une a réussi.**

> **Une observation qui mérite d'être écrite plutôt que d'être redécouverte** : le `COMMIT` du
> terminal B rend `ROLLBACK`. PostgreSQL a annulé la transaction au moment de l'insertion ; le
> `COMMIT` ne fait que constater. Un service de phase 3 qui vérifierait le succès sur le retour du
> `COMMIT` plutôt que sur celui de l'`INSERT` **ne verrait pas l'échec**.

**Ce que cela prouve, et qui est le point** : la seconde transaction n'a pas échoué parce qu'un
service a vérifié quelque chose. Elle a échoué **parce que la base l'a refusée**, sous sa propre
sérialisation, pour toute transaction sans exception — y compris celle qui aurait oublié de prendre
un verrou.

### Les quatre autres cas du [quickstart](./quickstart.md) §2

| # | Cas | Attendu | Constaté |
|---|---|---|---|
| 2 | Deux unités distinctes, intervalles superposés | les deux passent | **les deux passent** ✓ — 2 lignes |
| 3 | Occupation jusqu'à 18h00, **remise en état de 30 min** (indisponibilité jusqu'à 18h30), nouvelle occupation à 18h15 | rejetée | **rejetée**, `23P01` ✓ |
| 3b | *(contrôle ajouté)* même situation, nouvelle occupation à **18h30 pile** | acceptée — bornes `[début, fin)` | **acceptée** ✓ |
| 4a | Réinsertion sur le même intervalle, occupation **encore active** | rejetée | **rejetée**, `23P01` ✓ |
| 4 | La même, **après passage du statut à `ANNULEE`** | **acceptée** | **acceptée** ✓ |
| 5 | `periode` débordant de `periode_indisponibilite` | rejetée par le `CHECK` | **rejetée**, `ck_occupation_periode_incluse` ✓ |

> **Le cas 3b n'était pas demandé et il a été ajouté**, parce que le cas 3 seul ne distingue pas
> « l'indisponibilité protège » de « la contrainte refuse tout ce qui est proche ». À 18h30 pile,
> les bornes `[début, fin)` font que les deux intervalles **se touchent sans se chevaucher** —
> et c'est cette propriété qui permet d'exprimer « jusqu'à midi » sans se demander si midi est
> inclus. Sans ce contrôle, une contrainte trop large aurait passé le cas 3 pour la mauvaise raison.

> **Le cas 4 est celui qu'on oublie de tester, et c'est le plus coûteux.** Sans la clause `WHERE`
> partielle, **toute annulation rendrait l'unité définitivement inlouable** sur son intervalle —
> alors qu'annulation, no-show et départ anticipé sont **trois chemins nominaux** du produit. Le
> cas 4a est là pour prouver que c'est bien l'annulation qui libère, et non la contrainte qui
> n'aurait jamais mordu.

**Verdict : SC-003 est prouvé.** Le chevauchement est impossible au niveau de la base, la remise en
état est **dans** l'intervalle protégé, l'annulation libère, et rien de tout cela ne dépend d'une
ligne de code applicatif.

---

## T013 · Audit des privilèges — les `GRANT` disent-ils la classe ?

**Date** : 2026-08-07 · **Méthode** : interrogation d'`information_schema.role_table_grants` après
application du modèle, confrontée à la matrice de
[conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md) §3 et aux classes du
registre. **Périmètre** : les quatre schémas du cycle, **42 tables** au moment de l'audit — les cinq
provisions d'hébergement arrivent en T019 et sont auditées en T020.

### Les sept contrôles nommés par la tâche

| # | Ce qui est vérifié | Attendu | Constaté |
|---|---|---|---|
| 1 | `lot_envoi` et `taxe_sejour_constat` recevant `UPDATE` ou `DELETE` | **0** | **0** ✓ |
| 2 | `conversion_unite_mesure` recevant un privilège quelconque | **0** | **0** ✓ — *l'absence est ce qui la prouve provision* |
| 3 | Les onze tables attendues en `SELECT, INSERT` seuls | conformes | **onze conformes**, aucune exception ✓ |
| 4 | `DELETE` sur le cycle | **0** | **0** ✓ |
| 4b | `DELETE` sur le **modèle entier**, socle compris | **0** | **0** ✓ |
| 5 | `GRANT … ON ALL TABLES IN SCHEMA` | **0** | **0** ✓ |
| 5b | `ALTER DEFAULT PRIVILEGES` *(contrôle ajouté)* | **0** | **0** ✓ — `pg_default_acl` vide |
| 6 | Privilège hors `SELECT`/`INSERT`/`UPDATE` | **0** | **0** ✓ — ni `TRUNCATE`, ni `REFERENCES`, ni `TRIGGER` |
| 7 | Index sans commentaire d'usage nommant sa recherche | **0** | **0** — *après correction, voir ci-dessous* |

> **Le contrôle 5b a été ajouté et il n'était pas demandé.** `GRANT … ON ALL TABLES` s'attrape par
> `grep` sur les fichiers ; `ALTER DEFAULT PRIVILEGES` **ne s'attrape pas ainsi** et produirait le
> même effet en pire — il accorderait un privilège à des tables **qui n'existent pas encore**, donc
> à toutes celles de la phase 3. Vérifier le premier sans le second aurait laissé la porte de
> derrière ouverte.

### Répartition des privilèges — 42 tables du cycle

| Privilèges | Tables | Ce que cela dit |
|---|---|---|
| `SELECT, INSERT, UPDATE` | **30** | Classes B, C, D, et les A qui se corrigent avant envoi |
| `SELECT, INSERT` | **11** | Append-only, **immuables par privilège** |
| *aucun* | **1** | `conversion_unite_mesure` — la provision que rien ne peut lire |
| `DELETE` | **0** | **Aucune ligne de ce modèle ne se supprime.** Une correction est une contre-passation |

### Le défaut trouvé par cet audit, et corrigé

**Deux index sur `hebergement.ligne_sejour` portaient leur usage sans employer la forme littérale
`-- Sert :` du socle** — `uq_ligne_sejour_ligne_commande` et `uq_ligne_sejour_bon_depot`. Leur
commentaire disait bien à quoi ils servent, mais **dans une autre forme**, ce qui les rendait
invisibles à un contrôle mécanique.

**C'est exactement la faute que le cycle D1 avait nommée pour les politiques RLS** : *une forme
unique est la condition pour qu'un contrôle reste strict, et un contrôle qui accepterait deux formes
en accepterait trois*. Les deux commentaires sont réécrits en `-- Sert :`. **Les 49 index des quatre
fichiers portent désormais tous leur recherche nommée, dans la même forme.**

| Fichier | Index |
|---|---|
| `55-ventes.sql` | 13 |
| `96-stocks.sql` | 8 |
| `97-hebergement.sql` | 24 |
| `98-pressing.sql` | 4 |

**Verdict : conforme.** On peut lire les `GRANT` d'une table du cycle et en déduire son régime
**sans lire un seul commentaire** — ce qui est précisément ce que le récit demandait.

---

## T014 · Doubles classes déclarées, et unicité de la forme RLS

**Date** : 2026-08-07 · **Méthode** : lecture des commentaires d'en-tête, décompte croisé sur les
fichiers, et **mesure indépendante sur le catalogue** après application.

### Les six tables à double classe déclarent bien les deux, avec l'opération de chacune

| Table | Première classe · opération | Seconde classe · opération |
|---|---|---|
| `ventes.commande` | **A · A4** — ouverture, réception d'une commande QR | **B · B3** — validation QR, addition de table |
| `ventes.ligne_commande` | **A · A4** — saisie, modification **avant** envoi | **B · B3** — annulation **après** envoi |
| `hebergement.unite` | **C · C2** — référentiel : code, étage, catégorie | **A · A4** — `statut_menage`, dernier-écrit-gagne, **seul cas du produit** |
| `hebergement.arrhes` | **B · B3** — espèces, virement | **D · D1** — Mobile Money, carte |
| `hebergement.ligne_sejour` | **B · B3** — effet monétaire sur la note | **« celle de la ligne d'origine »** — quand elle vient d'un point de vente |
| `pressing.bon_depot` | **B · B3** — création, transition `pret → retire` | **A · A4** — transitions `depose → en_traitement → pret` |

**Décompte croisé — c'est ce qui rend la vérification mécanique plutôt que déclarative** :

| Fichier | `CREATE TABLE` | Classes déclarées | Doubles classes |
|---|---|---|---|
| `55-ventes.sql` | 11 | 13 | **2** |
| `96-stocks.sql` | 7 | 7 | **0** |
| `97-hebergement.sql` | 21 | 24 | **3** |
| `98-pressing.sql` | 3 | 4 | **1** |
| | **42** | **48** | **6** ✓ |

### `mouvement_stock` et `inventaire` déclarent **une seule** classe

Les deux portent **B · B3**, avec un privilège **plus strict** que la classe n'exige — `SELECT,
INSERT` seuls là où B autoriserait `UPDATE` —, et le commentaire d'en-tête dit pourquoi : **une
correction est une contre-passation**, pas une réécriture. Corriger une entrée de 12 en 10 par
`UPDATE` effacerait la trace de l'erreur ; écrire un ajustement de −2 la conserve.

> **Une décision de forme n'est pas une seconde classe**, et les confondre ferait chercher au
> lecteur une double déclaration qui n'a pas lieu d'être.

### Le défaut trouvé par cet audit, et corrigé

**Le commentaire d'`inventaire` produisait une huitième ligne `-- CLASSE` sur sept tables.** La
phrase « une décision de forme n'est pas une seconde **CLASSE.** » se terminait sur un retour à la
ligne, et le mot isolé en début de ligne était **indistinguable d'une déclaration de classe** pour
un décompte mécanique. Le décompte disait donc « 8 classes pour 7 tables », c'est-à-dire **une
double classe sur `stocks`** — précisément la confusion que ce commentaire existe pour empêcher.

*Un commentaire qui met en garde contre une confusion et la produit lui-même est pire qu'un
commentaire absent.* La phrase est reformatée sur une seule ligne ; le décompte de `96-stocks.sql`
rend désormais 7 pour 7.

### L'expression de politique est strictement identique à celle du socle

**Deux mesures indépendantes, l'une sur les fichiers, l'autre sur le catalogue.**

Sur les quatre fichiers du cycle :

| Élément | Formes distinctes |
|---|---|
| `USING (tenant_id = current_setting('app.current_tenant', true)::uuid)` | **1** |
| `WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)` | **1** |
| `FOR ALL TO kaya_owner USING (true) WITH CHECK (true)` | **1** |

| Instruction | Occurrences |
|---|---|
| `CREATE TABLE` | **42** |
| `ENABLE ROW LEVEL SECURITY` | **42** |
| `FORCE  ROW LEVEL SECURITY` | **42** |
| `CREATE POLICY isolation_tenant` | **42** |
| `CREATE POLICY administration_editeur` | **42** |

Sur le catalogue, **modèle entier** — socle et verticales confondus :

| Politique | Tables portées | Formes distinctes de `qual` | de `with_check` |
|---|---|---|---|
| `isolation_tenant` | **113** | **1** | **1** |
| `administration_editeur` | **113** | **1** | **1** |

**Verdict : conforme.** Le modèle complet n'a **qu'une seule forme de politique**, ce qui est la
condition pour que P-01 n'en cherche qu'une — *une porte qui accepterait deux formes en accepterait
trois*.
