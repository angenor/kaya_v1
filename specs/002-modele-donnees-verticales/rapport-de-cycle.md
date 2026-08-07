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
