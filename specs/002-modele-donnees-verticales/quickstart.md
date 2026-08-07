# Démarrage rapide — appliquer, prouver, mesurer

*Ce que le cycle D2 permet de faire, et comment le prouver. Cinq sections, dans l'ordre où on les déroule. **Aucune ne suppose la précédente**, hormis la première qui monte la base.*

**Prérequis** : `docker` et `docker compose`. Rien d'autre — le client `psql` est celui de l'image, appelé par `docker compose exec`.

---

## 1 · Tout appliquer et tout vérifier — une seule commande

```sh
scripts/verifier.sh
```

Elle monte une base **éphémère**, applique `docs/modele-donnees/*.sql` **trié**, inspecte, puis **détruit la base** — y compris en cas d'échec et à l'interruption.

**Attendu après ce cycle** : quinze fichiers, quatorze schémas, cent dix-huit tables, **trois portes vertes**.

```
── P-01 · le modèle s'applique sur une base vierge, et chaque table porte ENABLE + FORCE + sa politique
   Périmètre : 15 fichiers appliqués · 14 schémas · 118 tables inspectées
   ✓ tenant_id NOT NULL           118/118
   ✓ ENABLE + FORCE               118/118
   ✓ politique isolation_tenant   118/118
   VERT

── P-02 · toute table du modèle a une classe déclarée au registre
   Sens      : table → registre (une entité déclarée sans table est normale)
   VERT

── P-05 · aucune clé étrangère entre deux schémas
   ✓ aucune contrainte inter-schémas
   VERT
```

**Ce qui a changé par rapport au cycle D1** : une porte de plus, et **les planchers de non-vacuité relevés** — P-01 et P-02 en avaient deux, P-05 en apporte un troisième. Les portes elles-mêmes n'ont pas changé de contrat.

---

## 2 · Prouver que le chevauchement est impossible — SC-003

**C'est la démonstration la plus importante du cycle**, et elle ne demande pas une ligne de code applicatif.

Deux terminaux, deux transactions, la même unité, des intervalles qui se recouvrent :

| Terminal A | Terminal B |
|---|---|
| `BEGIN` | |
| `INSERT` occupation `[14h00, 18h00)` | |
| | `BEGIN` |
| | `INSERT` occupation `[16h00, 20h00)` — **bloque**, en attente |
| `COMMIT` — **réussit** | |
| | **`ERROR: 23P01 exclusion_violation`** sur `ex_occupation_unite_periode` |

**Ce que cela prouve** : la seconde transaction n'a pas échoué parce qu'un service a vérifié quelque chose. Elle a échoué **parce que la base l'a refusée**, sous sa propre sérialisation, pour toute transaction sans exception — y compris celle qui aurait oublié de prendre un verrou.

**Les quatre autres cas à dérouler dans la foulée** :

| Cas | Attendu |
|---|---|
| Deux unités distinctes, intervalles superposés | **Les deux réussissent** |
| Occupation finissant à 18h00, nouvelle à 18h15, remise en état de 30 min | **Rejetée** — l'indisponibilité court jusqu'à 18h30 |
| La première occupation est **annulée**, on réinsère sur le même intervalle | **Acceptée** — une annulation libère (clause `WHERE` partielle) |
| `periode` déborde de `periode_indisponibilite` | **Rejetée** par `ck_occupation_periode_incluse` |

> **Le troisième cas est celui qu'on oublie de tester**, et c'est le plus coûteux : sans la clause partielle, **toute annulation rendrait l'unité définitivement inlouable** sur son intervalle. Annulation, no-show et départ anticipé sont trois chemins nominaux.

---

## 3 · Prouver que les trois portes savent échouer

```sh
scripts/verifier.sh --test-negatif        # les trois
scripts/verifier.sh --test-negatif p05    # la nouvelle seule
```

Chaque test opère sur une **copie de travail** du modèle : `docs/modele-donnees/` n'est jamais touché, en aucun mode.

| Test | Ce qu'il casse | Attendu |
|---|---|---|
| `p01` | Retire une politique `isolation_tenant` | **ROUGE**, en nommant la table |
| `p02` | Ajoute une table non déclarée au registre, **avec sa RLS complète** | **ROUGE**, en nommant la table |
| `p05` | Transforme `ligne_sejour.ligne_commande_id` en clé étrangère vers `ventes.ligne_commande` | **ROUGE**, en nommant la contrainte, la table portante et la table référencée |

**Un test négatif qui ne fait pas échouer sa porte sort avec le code `4`** — le plus grave du script : *il dit qu'un contrôle vert ne veut rien dire.*

> **Le test négatif de P-05 rejoue l'erreur réelle qu'on cherche à prévenir**, pas une erreur de laboratoire : c'est exactement la colonne qu'un cycle de phase 3 serait tenté de « réparer » en croyant corriger un oubli.
>
> **Après avoir relevé un plancher, il faut recasser la porte.** Une porte dont on a changé un seuil sans la revérifier n'est plus une porte vérifiée — elle est redevenue une décoration qu'on croit fonctionnelle.

---

## 4 · Mesurer la recherche de disponibilité — SC-010

**Cible : moins de 300 ms, par parcours d'index, sur 50 unités et 20 000 occupations** — l'ordre de grandeur de deux ans d'exploitation du pilote.

**Le jeu de volume se génère en SQL pur**, avec `generate_series`, comme celui de SC-009 au cycle D1 : aucune dépendance, aucun outil.

1. Semer un établissement, cinq catégories, cinquante unités, quatre formules.
2. Semer vingt mille occupations réparties sur deux ans, sans chevauchement — la contrainte d'exclusion le garantit à l'insertion, ce qui est aussi une preuve au passage.
3. `ANALYZE`.
4. `EXPLAIN (ANALYZE, BUFFERS)` sur **la requête que la story demande** :

> *« Quelles unités de la catégorie X sont libres entre T1 et T2 ? »*

**Ce qu'on regarde**, dans cet ordre :

| Ce qu'on lit | Verdict |
|---|---|
| Le type de parcours sur `occupation` | **Index Scan** ou **Bitmap Index Scan** attendu — un `Seq Scan` est l'échec |
| Le temps d'exécution | Sous 300 ms, largement |
| Le nombre de blocs lus | Consigné, pour que la mesure soit comparable plus tard |

**Pourquoi cette requête et pas celle du chevauchement simple** ([D-27](./research.md)) : « cette unité est-elle libre ? » est servie d'office par l'index de la contrainte d'exclusion. La requête réelle du produit part de la **catégorie**, joint `unite`, puis exclut par les occupations — et rien ne garantit d'avance que le planificateur choisisse un parcours d'index. **C'est donc celle-là qu'on mesure**, plutôt que celle qui donnerait un bon chiffre sans rien prouver.

> **Réserve honnête, la même qu'au cycle D1** : la mesure est prise sur poste Apple Silicon, table en cache. La production tourne sur VPS `linux/amd64` à cache froid ; ces chiffres ne la prédisent pas. Ce qu'ils prouvent est **structurel et transposable** : le planificateur choisit l'index, et non un balayage.

---

## 5 · Les constats qu'aucune porte ne couvre

À vérifier une fois, à la main, et à **consigner au rapport de cycle avec leur date** — un contrôle humain non daté n'est pas un contrôle, c'est un souvenir.

| Constat | Attendu | Comment |
|---|---|---|
| **SC-004** — occupation représentée autrement qu'en `tstzrange` | **0** | Colonnes de `occupation` ; aucune paire de colonnes de date portant une période |
| **SC-007** — table à double classe déclarant les deux | **7/7** | Lecture des commentaires d'en-tête |
| **SC-008** — `UPDATE`/`DELETE` sur `lot_envoi` et `taxe_sejour_constat` ; `DELETE` nulle part ; `GRANT … ON ALL TABLES` | **0** partout | `information_schema.role_table_grants` |
| **SC-009** — quantité en entier, montant en flottant, identifiant avec `DEFAULT`, `SEQUENCE` créée | **0** partout | Contrôles du cycle D1, rejoués sur les quatre schémas nouveaux |
| **SC-011** — durée de la commande unique | **< 2 min** | Trois exécutions chronométrées, base détruite entre chacune |
| **SC-015** — tables au README, schémas à la liste opposable | **100 %** | Lecture croisée README ↔ catalogue |
| **Périmètre** — fichier du socle modifié hors README | **0** | `git diff --stat` sur `docs/modele-donnees/0*.sql` à `9*.sql` du cycle D1 |

**Ce que ces constats deviennent le jour où l'un d'eux échoue** : une porte, avec son test négatif — pas un rappel. C'est la règle de la constitution, et c'est ainsi que P-05 est née de ce que le cycle D1 avait constaté à la main.

---

## Où trouver quoi

| Ce qu'on cherche | Où c'est |
|---|---|
| Le détail colonne par colonne des 47 tables | [data-model.md](./data-model.md) |
| Le contrat que chaque fichier `.sql` honore | [conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md) — **cycle D1, repris intégralement** |
| Ce que la base garantit sur la disponibilité, et ce qu'elle ne garantit pas | [contracts/disponibilite.md](./contracts/disponibilite.md) |
| Ce que la phase 3 doit faire du cas orphelin | [contracts/sagas-inter-modules.md](./contracts/sagas-inter-modules.md) |
| Le contrat de la porte nouvelle | [contracts/verifier-p05.md](./contracts/verifier-p05.md) |
| Le contrat de la commande unique | [verifier-cli.md](../001-modele-donnees-socle/contracts/verifier-cli.md) — **cycle D1** |
| Les décisions du cycle et leurs motifs | [research.md](./research.md) |
| La classe hors-ligne d'une entité | [docs/registre-classes-offline.md](../../docs/registre-classes-offline.md), qui **fait foi** |
