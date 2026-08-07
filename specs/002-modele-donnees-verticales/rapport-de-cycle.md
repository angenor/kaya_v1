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

> **Périmètre de ce décompte : les 42 tables du cycle AU MOMENT de l'audit** — les cinq provisions
> d'hébergement arrivent en T019 et portent le total à **47**. La même méthode appliquée au dépôt
> livré rend **47 tables pour 53 classes déclarées**, donc **les mêmes 6 doubles classes**. C'est la
> précaution que T013 prend et que celle-ci avait omise ; le verdict, lui, ne change pas.

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

*Sur le dépôt livré, après les cinq provisions de T019 : **47 tables · 53 classes déclarées · 6
doubles classes** — `97-hebergement.sql` passant de 21/24 à 26/29. **L'écart entre les deux colonnes
est le même**, et c'est lui qui porte le verdict.*

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

---

## T016 · La porte P-05 sait échouer — cassée volontairement une fois

**Date** : 2026-08-07 · **Méthode** : `scripts/verifier.sh --test-negatif p05`, puis **sabotage
délibéré du prédicat de détection** de la porte pour vérifier que le test négatif sait le voir.

### Le test négatif, en trois temps

`--test-negatif p05` opère sur une **copie de travail** et ajoute par `ALTER` la clé étrangère
`hebergement.ligne_sejour.ligne_commande_id → ventes.ligne_commande`.

| Temps | Ce qui est exigé | Constaté |
|---|---|---|
| 1 | **P-01 reste VERTE** — la mutation n'ôte ni RLS ni politique | ✓ |
| 2 | **P-02 reste VERTE** — la mutation n'ajoute aucune table | ✓ |
| 3 | **P-05 rougit** | ✓ |
| 4 | L'échec **nomme les trois objets** | ✓ — `fk_ligne_sejour_ligne_commande : hebergement.ligne_sejour → ventes.ligne_commande` |
| 5 | `docs/modele-donnees/` **inchangé** — empreinte identique avant et après | ✓ |

> **Les temps 1 et 2 ne sont pas de la décoration.** Sans eux, une mutation mal formée ferait rougir
> P-01 d'abord, et l'on croirait avoir prouvé P-05 alors qu'on aurait prouvé P-01 une **troisième**
> fois. C'est la même précaution que le test négatif de P-02 du cycle D1, portée à trois portes.

### Le sabotage — ce qui prouve que le test négatif n'est pas décoratif lui non plus

Le prédicat `np.nspname <> nr.nspname` de la requête de détection a été remplacé par un prédicat
toujours faux, puis le tout rejoué :

| Commande | Attendu si la porte est aveugle | Constaté |
|---|---|---|
| `verifier.sh --porte p05` sur le modèle sain | **VERT** — et c'est le problème : rien ne le signale | **VERT**, 92 contraintes examinées, plancher atteint |
| `verifier.sh --test-negatif p05` | **CODE 4** — « la porte est aveugle » | **CODE 4** ✓, avec le message *« LA PORTE EST PASSÉE AU VERT sur une clé étrangère inter-schémas »* |
| Après restauration du script | **CODE 0** | **CODE 0** ✓ |

*Les **92** de ce tableau sont le décompte du modèle **au moment du sabotage**, avant les cinq
provisions d'hébergement de T019 ; le modèle complet en porte **98**. Ce récit est daté, et ses
chiffres le restent.*

> **C'est exactement le mode de défaillance que P-05 rendait probable**, et qui justifiait le
> plancher de non-vacuité : la porte sabotée **passait au vert en annonçant fièrement 92 contraintes
> examinées**. Le plancher n'a rien vu — il ne pouvait rien voir, puisque la cible n'était pas vide,
> seulement le prédicat était faux. **C'est le test négatif, et lui seul, qui a fait la différence.**
> Le plancher et le test négatif ne couvrent donc pas la même faute, et il en faut deux.

---

## T017 · SC-005 — zéro clé étrangère entre deux schémas, et le périmètre de P-05

**Date** : 2026-08-07 · **Méthode** : requête sur `pg_constraint` où `contype = 'f'` et les deux
`relnamespace` diffèrent, sur les **quatorze schémas** du modèle appliqué. **Contre-mesure
indépendante** : `grep -c "FOREIGN KEY"` sur les quinze fichiers.

> **Décomptes remesurés après T019.** La première rédaction de cette section donnait **92** clés
> étrangères et **28** pour `hebergement` : c'était l'état du modèle **avant les cinq provisions
> d'hébergement**, qui en apportent six de plus. Les chiffres ci-dessous sont ceux du modèle
> **complet**, et ce sont ceux que la porte imprime. *Un décompte non daté vieillit en silence — et
> celui-ci a vieilli entre deux sections du même rapport.*

### Le constat

| Ce qui est compté | Attendu | Constaté |
|---|---|---|
| Clés étrangères **entre deux schémas** | **0** | **0** ✓ — les deux sagas comprises |
| Clés étrangères **internes**, total | — | **98** |
| Mêmes, comptées par `grep` sur les fichiers | **98** | **98** ✓ — *deux mesures indépendantes qui concordent* |

### Répartition, schéma par schéma

| Schéma | Clés étrangères internes | | Schéma | Clés étrangères internes |
|---|---|---|---|---|
| `hebergement` | **34** | | `stocks` | 8 |
| `etablissements` | 17 | | `fiscalite` | 5 |
| `ventes` | 12 | | `editeur` | 3 |
| `caisse` | 9 | | `pressing` | 1 |
| `comptes` | 8 | | `synchronisation` | 1 |

*Les quatre schémas restants — `documents`, `pilotage`, `metriques`, `comptabilite` — n'en portent
aucune, ce qui est cohérent : ce sont des schémas de tables autonomes ou de provisions.*

### P-05 déclare bien son périmètre, et le nombre est le bon

La porte imprime **`Périmètre : 14 schéma(s) · 98 contrainte(s) de clé étrangère examinée(s)`**.
Ce **98** est le décompte réel du modèle complet, vérifié par deux voies. La porte n'inspecte donc
pas un sous-ensemble sans le dire — ce qui est très exactement le point 1 du contrat de porte.

> **Le contraste avec le socle mérite d'être noté** : `hebergement` porte à lui seul **34** clés
> étrangères internes, soit plus que n'importe quel schéma du socle. C'est la mesure de ce que
> « toute la verticale vit dans son schéma » veut dire concrètement — et donc la mesure de ce que
> P-05 protège.

**Verdict : SC-005 est constaté.** Zéro clé étrangère inter-schémas sur les quatorze, et la règle
n'est plus un commentaire : elle est refusée par une commande.

---

## T018 · Revue des référentiels — les quatre décisions ont-elles été prises, ou approchées ?

**Date** : 2026-08-07 · **Méthode** : interrogation du catalogue — définitions de contraintes,
nullabilité, commentaires de colonne —, confrontée au récapitulatif des paramètres de
`docs/user-stories-v1.md` §« quatre valeurs HEB ».

**Le test de cette revue** : *lire le schéma et retrouver, sans ouvrir la spécification, pourquoi
chacune est une table.*

| # | Décision | Constaté |
|---|---|---|
| **1** | `uq_temps_remise_categorie_formule` porte sur le **couple** | `UNIQUE (tenant_id, categorie_id, formule_id)` ✓ — deux formules d'une même catégorie ont donc **deux durées**, ce qu'une colonne de `categorie` ne porterait pas |
| **2** | `destination_preparation` rattachée à l'**établissement** | Colonnes : `id, tenant_id, etablissement_id, nom, actif, cree_le, modifie_le` — **aucun `point_de_vente_id`** ✓. *Une cuisine sert plusieurs points de vente* |
| **3** | `article.destination_preparation_id` **nullable**, avec le repli énoncé | `nullable = true`, commentaire : *« le nul veut dire suivre la clé de catalogue `ventes.destination_preparation_defaut` du point de vente — POUR QU'AUCUN BON D'ENVOI NE MANQUE »* ✓ |
| **4** | Trois **tables**, et les clés du catalogue non dupliquées | `bareme_palier`, `plage_demi_journee`, `calendrier_tarifaire` sont des tables ✓ · `seuil_bascule_nuitee_minutes` **n'a aucune colonne nulle part dans le modèle** ✓ |
| **5** | `assujettie_taxe_nuitee` et `regle_conversion_taxe` sont des **entrées**, jamais une règle | Les deux portent un commentaire qui le dit ✓ · et **zéro `TRIGGER`, zéro fonction** dans les quatorze schémas — *aucune règle fiscale ne peut vivre là où il n'y a pas de code* ✓ |

### Le point 4 mérite une précision, parce qu'il aurait pu être coché à tort

`heure_arrivee_standard` et `heure_depart_standard` **existent comme colonnes de `formule`** — ce
qui, lu vite, ressemble à la duplication que ce point interdit. Ce n'en est pas une, et trois
constats le montrent :

1. **Les deux colonnes sont `NULLABLE`**, et le nul a un sens déclaré : *« prendre la clé de
   catalogue de l'établissement »*. Une duplication porterait une valeur par défaut.
2. **Aucune valeur d'heure n'est écrite en dur dans le SQL** — ni `14:00`, ni `12:00`, qui sont les
   valeurs du récapitulatif des paramètres.
3. **`seuil_bascule_nuitee_minutes`, lui, n'a AUCUNE colonne** : c'est le contrôle qui distingue une
   surcharge d'une duplication. Si les colonnes de `formule` étaient des copies du catalogue, il y
   en aurait une pour lui aussi.

**La différence est celle entre *surcharger* et *recopier*.** Une surcharge nullable dit « sauf
indication contraire, demande à l'établissement » ; une copie dit « la valeur est ici », et le jour
où l'on modifie le catalogue, la copie ment. Le seul contrôle qui les sépare mécaniquement est la
nullabilité **plus** l'absence de valeur par défaut — les deux sont vérifiés.

### Le point 5 mérite d'être vérifié autrement qu'en lisant un commentaire

Un commentaire qui dit « ceci n'est pas une règle » n'est pas une preuve. **La preuve est qu'il n'y
a nulle part où une règle pourrait vivre** : le modèle des quatorze schémas contient **zéro
`TRIGGER`** et **zéro fonction**. Aucun calcul fiscal ne s'exécute dans cette base — ni ici, ni
ailleurs —, et le `JurisdictionAdapter` de la phase 3 reste le seul endroit possible.

**Verdict : conforme sur les cinq points.** Aucune de ces décisions ne coûtera de migration au
premier exploitant qui aura deux cuisines, ou deux durées de ménage sur la même catégorie.

---

## T020 · Les provisions existent en table, et nulle part ailleurs

**Date** : 2026-08-07 · **Méthode** : privilèges du catalogue, commentaires de table et de colonne,
et **recherche des tables qui n'auraient pas dû naître**.

**Le test de ce récit** : *chercher chaque provision du registre §10 relevant de ces schémas et la
trouver ; lire ses privilèges et constater qu'on ne peut rien bâtir dessus.*

### Les six provisions du cycle

| Provision | Schéma | Privilège | Mention littérale |
|---|---|---|---|
| `prestation_incluse` | `hebergement` | **`SELECT`** | ✓ fichier **et** catalogue |
| `contrat_location` | `hebergement` | **`SELECT`** | ✓ fichier **et** catalogue |
| `caution` | `hebergement` | **`SELECT`** | ✓ fichier **et** catalogue |
| `charge_locative` | `hebergement` | **`SELECT`** | ✓ fichier **et** catalogue |
| `etat_des_lieux` | `hebergement` | **`SELECT`** | ✓ fichier **et** catalogue |
| `conversion_unite_mesure` | `ventes` | **aucun** — *pas même `SELECT`* | ✓ fichier **et** catalogue |

**Le défaut trouvé, et corrigé** : `conversion_unite_mesure` portait sa mention **dans le fichier
seulement**. Les cinq autres la portaient des deux côtés. Un `COMMENT ON TABLE` a été ajouté, et les
six sont désormais reconnaissables **depuis la base**, sans ouvrir un fichier — ce qui est le seul
endroit où un cycle de phase 3 les rencontrera vraiment.

### Les deux provisions-colonnes

| Colonne | Nullable | Valeur par défaut | Commentaire |
|---|---|---|---|
| `stocks.mouvement_stock.cout_unitaire` (A4) | ✓ | **aucune** | *« PROVISION — nullable et JAMAIS RENSEIGNÉE AU MVP »* |
| `ventes.article.code_barre` (A5) | ✓ | **aucune** | *« PROVISION-COLONNE — non utilisée au MVP »* |
| `ventes.article.article_parent_id` (A5) | ✓ | **aucune** | *idem* |

> **L'absence de valeur par défaut est ce qui les tient.** Une provision-colonne avec un `DEFAULT`
> serait **renseignée à chaque insertion** — et l'on croirait le stock valorisé alors qu'on aurait
> seulement écrit des zéros. `atthasdef` vaut `false` sur les trois.

### Le décompte d'une prestation incluse n'a reçu aucune table

| Ce qui est cherché | Attendu | Constaté |
|---|---|---|
| Table nommée `*decompte*`, `*consommation_prestation*`, `*quota*` | **aucune** | **aucune** ✓ |
| Le fichier dit-il pourquoi ? | oui | **oui** ✓ — *« une table qu'aucune story n'écrit se remplit un jour de ce qui traîne »* |

### Le décompte des vingt provisions du modèle complet

| Régime | Tables | Dont ce cycle |
|---|---|---|
| **Aucun privilège** — la provision qu'on ne peut même pas lire | **2** (`etablissements.convention_inter_etablissements`, `ventes.conversion_unite_mesure`) | 1 |
| **`SELECT` seul** | **18** | 5 |
| | **20** ✓ | **6** |

**Verdict : conforme.** Toute provision du modèle a sa table, aucune n'a de logique, et **aucune ne
pourra en recevoir sans qu'un `GRANT` change** — ce qui se voit dans un diff, et se discute.

---

## T023 · Le registre est-il honoré tel quel ?

**Date** : 2026-08-07 · **Méthode** : `git diff` du registre entre la fin du cycle D1 et la fin du
cycle D2, ligne à ligne.

### Ce que le cycle D2 a changé au registre — quatre lignes, et pas une de plus

| Ligne | Nature |
|---|---|
| `- \| Liaison article de catalogue → article de stock \| **C** \| C2 \| STK-01 \|` | **remplacée** |
| `+ \| \`article_stock_catalogue\` — liaison … \| **C** \| C2 \| STK-01 \|` | **nommage** — classe, branche et story **identiques** |
| `+ \| \`ligne_inventaire\` — quantité comptée et écart … \| **B** \| B3 \| STK-03 \|` | **entité nouvelle** |
| `+` deux lignes au journal §13 | **traçabilité du nommage** |

**Aucune classe n'a changé. Aucune branche n'a changé. Aucune ligne des §6, §7 ou §8 n'a été
réécrite.** Les classes ont été décidées à froid, et ce cycle les honore telles quelles (FR-037).

> **La seule suppression du diff n'est pas une suppression de classe** : c'est la même ligne, à
> laquelle un nom a été donné. `C · C2 · STK-01` d'un côté comme de l'autre.

### Les deux décisions ouvertes ne sont pas tranchées, et c'est la décision

| # | Question | Classe qui s'applique jusqu'à l'arbitrage | Qui tranche, et quand |
|---|---|---|---|
| **O-02** | `mouvement_stock` en A ou en B ? | **B** — la plus stricte des deux | Le **pilote**, S4, avant la tranche T5 |
| **O-03** | Crate d'accueil de la surface QR | `jeton_table` reste dans `ventes` | Le **cycle du crate QR**, avant QRC-01 (tranche T4) |

**Deux conséquences ont été écrites pour que l'arbitrage ne coûte rien le jour venu** :

- **O-02** : `mouvement_stock` porte `SELECT, INSERT` seuls. **Ce privilège reste valide si la classe
  passe en A** — un privilège plus strict que la classe ne devient jamais faux. L'arbitrage ne
  demandera donc **aucune migration**, seulement une ligne au registre.
- **O-03** : l'arbitrage porte sur le **crate**, pas sur le schéma. `ventes.jeton_table` restera où
  elle est quel que soit le crate qui la sert — **aucune migration de données** non plus.

> **Pourquoi ne pas les trancher ici aurait pu passer pour de la paresse, et ne l'est pas.** O-02
> demande au pilote si le stock sert à *détecter le vol* ou à *réapprovisionner* — une question de
> terrain, pas de modèle. O-03 demande où loger un besoin transverse à deux verticales — une
> question du cycle qui écrira ce crate. Les trancher aujourd'hui, c'est demander au développeur
> d'arbitrer à la place de ceux qui savent.

### Le journal §13 ne dit que ce qu'il doit dire

Le registre l'exige : *« ce journal enregistre des **décisions de classe et de nommage**, pas
l'avancement d'un chantier »*, et n'y ont pas leur place *« les décomptes de tables, les numéros de
tâche, l'état d'avancement »*. **Contrôle** : aucune occurrence d'un numéro de tâche, d'un décompte
de tables ou d'un état d'avancement dans le §13 — les deux seules occurrences des mots interdits
sont **la règle elle-même**.

**Verdict : conforme.** Le modèle se lit et se tient ; la règle de tenue écrite au cycle D1 couvre
désormais les quinze fichiers.

---

## T024 · Les quatre planchers à leur valeur définitive — et la preuve qu'ils mordent

**Date** : 2026-08-07 · **Méthode** : mesure des valeurs réelles, réglage **juste en dessous**, puis
**vérification que chaque plancher refuse pour de vrai** sur un modèle amputé de ses quatre fichiers
de verticales.

### Les valeurs

| Plancher | Cycle D1 | Valeur réelle | **Définitif** | Marge |
|---|---|---|---|---|
| P-01 · tables inspectées | 60 | **118** | **110** | 8 |
| P-02 · tables réelles | 60 | **118** | **110** | 8 |
| P-02 · entités extraites du registre | 140 | **180** | **170** | 10 |
| P-05 · clés étrangères examinées | 1 *(provisoire)* | **98** | **90** | 8 |

> **Un plancher se règle JUSTE SOUS la valeur réelle, jamais loin en dessous.** À 60, le modèle
> **amputé de ses quarante-sept tables de verticales passerait encore** — la porte serait verte en
> n'inspectant plus que le socle, c'est-à-dire en ne prouvant plus rien de ce cycle. La marge
> absorbe le retrait délibéré de quelques tables, et rien de plus.

### La preuve que les trois mordent

Un modèle privé de `55-ventes.sql`, `96-stocks.sql`, `97-hebergement.sql` et `98-pressing.sql` — et
dont la liste opposable a été alignée, **pour que l'échec vienne du plancher et non de la
complétude** :

| Porte | Ce qui est inspecté | Verdict |
|---|---|---|
| **P-01** | 71 tables | **ROUGE**, code 1 — *« Plancher : 110 — NON ATTEINT (71) »* |
| **P-02** | 71 tables | **ROUGE**, code 1 — *« la porte comparerait trop peu de choses »* |
| **P-05** | 43 clés étrangères | **ROUGE**, code 1 — *« Plancher : 90 — NON ATTEINT (43) »* |

**Avec les anciennes valeurs, les trois seraient passées au vert.** C'est très exactement ce que le
relèvement achète.

---

## T025 · Les trois tests négatifs rejoués APRÈS le relèvement

**Date** : 2026-08-07 · **Méthode** : `scripts/verifier.sh --test-negatif`.

> **Une porte dont on a changé un seuil sans la recasser n'est plus une porte vérifiée** : elle est
> redevenue une décoration qu'on croit fonctionnelle. Le relèvement des planchers est exactement le
> genre de changement qui peut rendre un test négatif inopérant — un seuil mal réglé ferait rougir
> la porte **pour la mauvaise raison**, et le test passerait en croyant avoir prouvé autre chose.

| Test | Ce qu'il casse | Verdict | Ce qui est nommé |
|---|---|---|---|
| `p01` | Politique `isolation_tenant` retirée | **ROUGE** ✓ | `caisse.coupure_comptee` — et **117/118**, donc le plancher n'a pas mordu à sa place |
| `p02` | Table non déclarée ajoutée, **avec sa RLS complète** | **ROUGE** ✓ | `etablissements.zzz_table_non_declaree` — **P-01 reste VERTE** |
| `p05` | `ligne_sejour.ligne_commande_id` → clé étrangère | **ROUGE** ✓ | **les trois objets** — **P-01 et P-02 restent VERTES** |

```
TESTS NÉGATIFS VERTS — 3 — 18 s
```

**`git status` reste propre** après les trois, et l'empreinte de `docs/modele-donnees/` est
identique avant et après chacun.

> **Le détail qui prouve que le relèvement n'a rien cassé** : le test de P-01 rend `117/118`. La
> porte a donc bien échoué **sur le contrôle de politique**, et non sur le plancher — qui aurait
> rougi lui aussi si les tables avaient manqué. Un test négatif qui échouerait sur le plancher
> plutôt que sur son contrôle prouverait le plancher, pas la porte.

**Verdict : les trois portes savent échouer, après relèvement.**

---

## T026 · SC-010 — la recherche de disponibilité par catégorie

**Date** : 2026-08-07 · **Méthode** : modèle appliqué sur une base locale **non éphémère**, jeu de
volume généré **en SQL pur** avec `generate_series` — aucune dépendance, aucun outil —, `ANALYZE`,
puis `EXPLAIN (ANALYZE, BUFFERS)`.

### Le jeu de volume

| Objet | Volume |
|---|---|
| Catégories | **5** |
| Unités | **50** — 10 par catégorie |
| Formules | **20** — 4 par catégorie |
| **Occupations** | **20 000** — 400 par unité, réparties sur deux ans |

**Les occupations sont décalées de 3 h par unité**, sinon toutes les unités seraient occupées aux
mêmes heures et la requête rendrait toujours **zéro** — un résultat vide se court-circuite, et la
mesure ne prouverait rien. *C'est la première version de la mesure qui l'a montré : elle rendait 0,
et ne mesurait donc que la vitesse à laquelle on trouve qu'il n'y a rien.*

> **Une preuve tombe au passage** : ces 20 000 lignes ont été insérées **sous la contrainte
> d'exclusion**. Si le semis passe, c'est qu'il n'y a aucun chevauchement — la base l'a vérifié
> 20 000 fois.

### La requête mesurée, et pourquoi celle-là

> *« Quelles unités de la catégorie X sont libres entre T1 et T2 ? »*

**Fenêtre de 4 heures — un passage**, qui est le cas principal du marché (cadrage §5.1).

*« Cette unité est-elle libre ? » est servie d'office par l'index de la contrainte d'exclusion et
donnerait un bon chiffre sans rien prouver.* La requête réelle du produit part de la **catégorie**,
joint `unite`, puis exclut par les occupations — et rien ne garantissait d'avance que le
planificateur choisisse un parcours d'index.

### Le plan

```
 Nested Loop Anti Join (actual time=0.405..0.431 rows=3.00 loops=1)
   Buffers: shared hit=69
   ->  Seq Scan on unite u (actual time=0.004..0.007 rows=10.00 loops=1)
         Filter: (actif AND (categorie_id = '…'::uuid))
         Rows Removed by Filter: 40
         Buffers: shared hit=1
   ->  Index Only Scan using ex_occupation_unite_periode on occupation o
                            (actual time=0.042..0.042 rows=0.70 loops=10)
         Index Cond: ((unite_id = u.id)
                      AND (periode_indisponibilite && '["2026-07-15 14:00+00","2026-07-15 18:00+00")'))
         Heap Fetches: 7
         Index Searches: 10
         Buffers: shared hit=68
 Planning Time: 0.414 ms
 Execution Time: 0.441 ms
```

**Résultat : 3 unités libres sur les 10 de la catégorie.** Le résultat est **non vide**, donc la
mesure a bien parcouru la chaîne complète.

| Ce qu'on lit | Attendu | Constaté |
|---|---|---|
| Parcours sur `occupation` | **Index Scan** ou **Bitmap Index Scan** ; un `Seq Scan` est l'échec | **`Index Only Scan using ex_occupation_unite_periode`** ✓ |
| Temps d'exécution | **< 300 ms** | **0,441 ms** — soit **680 fois** sous la cible ✓ |
| Blocs lus | consigné pour comparaison ultérieure | **69** blocs partagés, tous en cache |
| Bout en bout depuis `psql`, trois exécutions | — | **1,24 · 1,44 · 1,22 ms** — aller-retour réseau compris |

### ⚠️ Il y a un `Seq Scan` dans ce plan, et il est écrit ici plutôt que passé sous silence

**`Seq Scan on unite`.** Lu strictement, la cible de SC-010 dit « jamais un `Seq Scan` » — il
convient donc de dire pourquoi celui-ci n'est pas l'échec que le critère vise :

1. **`unite` fait 8 192 octets — une seule page.** Passer par `ix_unite_categorie` coûterait la
   lecture de l'index **plus** celle de la table ; le planificateur choisit correctement de lire la
   page unique. **Un plan qui utiliserait l'index ici serait moins bon.**
2. **Le critère vise `occupation`**, où sont les 20 000 lignes et les 3 Mo — et là, l'index GiST est
   employé, avec `Index Only Scan` et seulement 7 accès au tas.
3. **`ix_unite_categorie` n'est pas inutile pour autant** : il sert dès que le parc grandit. À 50
   unités, il ne peut pas encore gagner ; c'est une propriété du volume, pas du schéma.

**Ce qu'il faudra surveiller** : sur un parc de plusieurs milliers d'unités — plusieurs
établissements, plusieurs tenants sur la même base —, `unite` cessera de tenir en une page et le
planificateur devra basculer sur `ix_unite_categorie`. **C'est à ce moment-là que l'index gagnera
son coût**, et la mesure sera à refaire.

### Taille des objets, pour que la mesure soit comparable plus tard

| Objet | Taille |
|---|---|
| `occupation` (table) | 3 080 kio |
| `ex_occupation_unite_periode` (index GiST) | 2 472 kio |
| `unite` (table) | 8 192 o |
| `ix_unite_categorie` | 16 kio |

> **Réserve d'usage, la même qu'au cycle D1 et elle est honnête** : mesure prise sur **poste Apple
> Silicon (arm64)**, table **en cache**, base en `tmpfs`. La production tournera sur **VPS Contabo
> `linux/amd64` à cache froid**, et ces chiffres **ne la prédisent pas**. Ce qu'ils prouvent est
> **structurel et transposable** : le planificateur choisit l'index GiST, et non un balayage des
> 20 000 occupations. La marge de 680× laisse d'ailleurs de la place à un facteur d'écart
> considérable.

**Verdict : SC-010 est tenu**, avec la réserve d'usage ci-dessus et le `Seq Scan` sur `unite`
expliqué plutôt que masqué.

---

## T027 · SC-011 — la durée de la commande unique

**Date** : 2026-08-07 · **Méthode** : trois exécutions chronométrées de `scripts/verifier.sh`, base
détruite entre chacune (le script s'en charge lui-même, y compris en cas d'échec).

| Exécution | Mesure du script | Chronomètre externe | Verdict |
|---|---|---|---|
| 1 | 6 s | **8 s** | vert |
| 2 | 6 s | **6 s** | vert |
| 3 | 6 s | **7 s** | vert |
| **Les trois tests négatifs** | 18 s | **19 s** | vert |

*Le chronomètre externe couvre le démarrage du conteneur et sa destruction ; celui du script compte
depuis la première porte.*

| Repère | Cible | Constaté |
|---|---|---|
| Une exécution complète | **< 2 min** (SC-011) | **7 s** en moyenne — **17 fois** sous la cible |
| Rappel du cycle D1 | 5 s pour 71 tables | **+2 s pour 47 tables et une porte de plus** |

> **Ce que coûte réellement l'ajout de P-05 : une à deux secondes.** Elle réutilise la base montée
> par P-01 — aucun conteneur de plus — et ne fait que deux requêtes sur `pg_constraint`. C'est ce
> choix, et le `tmpfs` de `compose.yml`, qui tiennent la durée.

> **Le repère des deux minutes n'est pas un objectif de performance, c'est un DÉCLENCHEUR.**
> Au-delà, on cesse de lancer un script — on l'oublie, on le contourne, on le désactive. Le jour où
> la commande unique franchira cette barre, c'est le passage au serveur d'intégration qui sera dû,
> en phase 3, et il lancera ce script **sans le modifier**. À 7 s, la marge est de deux ordres de
> grandeur : rien ne presse.

**Verdict : SC-011 est tenu, largement.**

---

## T030 · Le quickstart déroulé de bout en bout, dans l'ordre, sur un dépôt propre

**Date** : 2026-08-07.

| § | Ce qui est déroulé | Résultat |
|---|---|---|
| **1** | `scripts/verifier.sh` — la commande unique | **code 0** · 15 fichiers, 14 schémas, **118 tables**, trois portes vertes, 7 s |
| **2** | Les cinq cas de la contrainte d'exclusion | **5/5** — voir T006 |
| **3** | Les trois tests négatifs, séparément **puis ensemble** | **codes 0** · trois VERTS, 18 s |
| **4** | La mesure de disponibilité | **0,441 ms**, `Index Only Scan` — voir T026 |
| **5** | Les constats qu'aucune porte ne couvre | voir T031 ci-dessous |

**`git status` est propre après chaque test négatif** — vérifié séparément pour `p01`, `p02` et
`p05`, et une quatrième fois après les trois enchaînés. L'empreinte de `docs/modele-donnees/` est
identique avant et après dans les quatre cas.

**Aucun conteneur ni volume du projet `kaya_verification` ne survit** : `0` conteneur et `0` volume
après exécution. *(Trois conteneurs `kaya-db`, `kaya-cache` et `kaya-objets` tournent sur le poste
depuis quatre jours ; ils appartiennent à un **autre projet** et ne sont ni créés ni touchés par ce
dépôt — `compose.yml` ne déclare qu'un service.)*

---

## T031 · Les quinze critères de réussite, un par un

**Date** : 2026-08-07 · **Méthode** : chaque critère mesuré, jamais déclaré.

| # | Critère | Attendu | Constaté | Où |
|---|---|---|---|---|
| **SC-001** | Le modèle s'applique sur une base vierge en **une commande**, sans erreur, base détruite ensuite | 0 erreur | **15 fichiers appliqués, 0 erreur**, 0 conteneur et 0 volume survivant | P-01 · T030 |
| **SC-002** | **100 %** des tables nouvelles portent les trois éléments, forme **strictement identique** | 0 écart, 0 variante | **118/118** sur les quatre contrôles · **1 seule forme** de `qual` et de `with_check` | P-01 · T014 |
| **SC-003** | Deux transactions concurrentes chevauchantes : **exactement une** réussit, refusée **par la base** | 1 sur 2 | **1 sur 2**, `23P01 exclusion_violation` nommant `ex_occupation_unite_periode` | **T006** |
| **SC-004** | **Zéro** période représentée autrement qu'en `tstzrange` ; **zéro** paire de dates portant une disponibilité | 0 | **0** — voir l'examen ci-dessous | **T031** |
| **SC-005** | **Zéro** clé étrangère entre deux schémas, sagas comprises | 0 | **0** sur 98 examinées, **deux mesures indépendantes** | P-05 · T017 |
| **SC-006** | **100 %** des tables nouvelles déclarées au registre | 0 non déclarée | **118/118**, P-02 verte | P-02 · T002 |
| **SC-007** | **Les six** tables à double classe déclarent **les deux**, avec l'opération de chacune | 6/6 | **6/6** · décompte croisé sur le dépôt livré : **47** tables, **53** classes déclarées | **T014** |
| **SC-008** | **Zéro** `UPDATE`/`DELETE` sur `lot_envoi` et `taxe_sejour_constat` ; **zéro** `DELETE` ; **zéro** `GRANT … ON ALL TABLES` | 0 partout | **0 · 0 · 0**, plus **0** `ALTER DEFAULT PRIVILEGES** *(contrôle ajouté)* | **T013** |
| **SC-009** | **Zéro** quantité en entier, flottant, identifiant avec `DEFAULT`, `SEQUENCE` | 0 partout | **0 · 0 · 0 · 0**, plus **0** colonne `IDENTITY` *(contrôle ajouté)* | **T013** |
| **SC-010** | Disponibilité par catégorie **< 300 ms**, **par parcours d'index** | < 300 ms | **0,441 ms** · `Index Only Scan` sur l'index GiST | **T026** |
| **SC-011** | `scripts/verifier.sh` **< 2 min** | < 120 s | **6 · 6 · 6 s** (7 s au chronomètre externe) | **T027** |
| **SC-012** | Les **trois** portes échouent quand on les casse, P-01 et P-02 **après** relèvement, et l'échec **nomme la cause** | 3/3 | **3/3**, après relèvement, chacune nommant son objet | **T025** |
| **SC-013** | **Une seule** porte ajoutée ; **zéro** contrat existant modifié ; **zéro** fichier du socle modifié hors README | 1 · 0 · 0 | **3 portes** au total (2 du D1 + **P-05**) · **0** fichier de `specs/001-…/` modifié · **0** fichier SQL du socle modifié | **T031** |
| **SC-014** | **Zéro** migration, fichier Rust, écran, `.github/workflows/` | 0 partout | **0** `migrations/` · **0** `.rs` · **0** `.ts`/`.tsx`/`.vue` · **0** `Cargo.toml`/`package.json` · **0** `.github/workflows/` · **0** `app/` · **`compose.yml` non modifié** | **T031** |
| **SC-015** | **100 %** des tables au README avec leur classe ; **100 %** des schémas à la liste opposable | 100 % | **118/118** au README · **14/14** à la liste opposable, confrontée dans les **deux sens** par P-01 et P-05 | **T021** |

**Quinze critères sur quinze.**

### L'examen de SC-004, qui demandait plus qu'un décompte

**Deux colonnes `tstzrange` dans tout le cycle** — `occupation.periode` et
`occupation.periode_indisponibilite` —, et **aucune autre représentation d'une occupation**. Mais le
critère dit aussi *« zéro paire de colonnes de date portant une période de disponibilité »*, et le
cycle en contient **quatre paires de dates**. Les compter comme des violations aurait été faux ; les
ignorer aurait été pire.

| Paire | Ce qu'elle porte | Est-ce une disponibilité ? |
|---|---|---|
| `calendrier_tarifaire.date_effet` / `.date_fin` | Validité d'un **tarif** | **non** |
| `charge_locative.periode_debut` / `.periode_fin` *(provision)* | Période de **facturation** | **non** |
| `contrat_location.date_debut` / `.date_fin` *(provision)* | Durée d'un **contrat** | **non** |
| **`sejour.arrive_le` / `.parti_le`** | **Constat des instants réels** d'arrivée et de départ | **non — et c'est celle qui demandait un examen** |

**La quatrième est la seule dangereuse**, parce qu'elle *ressemble* à une période d'occupation. Deux
choses l'en séparent :

1. **`sejour.occupation_id` est `NOT NULL`.** Il n'existe pas de séjour sans son occupation, donc
   pas d'attribution que la contrainte d'exclusion n'aurait pas vue.
2. **Ces deux colonnes sont des constats *a posteriori***, pas une réservation : `parti_le` est nul
   tant que le client est là. Une recherche de disponibilité qui partirait d'elles ne verrait
   **aucun séjour en cours** comme occupant.

**Les quatre paires portent désormais un commentaire de colonne qui le dit**, et celui de
`sejour.arrive_le` va plus loin que constater : *« aucune recherche de disponibilité ne doit partir
d'ici ; s'en servir contournerait la contrainte d'exclusion et produirait des doubles
attributions »*. C'est le mode de défaillance exact que SC-004 existe pour prévenir, écrit à
l'endroit où on le lira.

### Le périmètre — et un écart à déclarer

`git diff --stat` entre la fin du cycle D1 et la fin du cycle D2, sur **les onze fichiers SQL du
socle** : **aucune ligne**. Zéro modification, README du modèle excepté, qui est le fichier que la
règle de tenue oblige à mettre à jour.

**Ce que le cycle D2 a touché, en tout** :

| Fichier | Nature |
|---|---|
| `docs/modele-donnees/55-`, `96-`, `97-`, `98-*.sql` | **créés** |
| `docs/modele-donnees/README.md` | index, liste opposable, relations, classes |
| `scripts/verifier.sh` | P-05, trois planchers relevés, `--test-negatif p05` |
| `docs/registre-classes-offline.md` | §6.1 et journal §13 |
| `docs/versions-reference.md` | une ligne au journal §6 |
| `README.md` | la troisième porte |
| ⚠️ `docs/Kaya_Prompts_SpecKit.md` | **HORS PÉRIMÈTRE — voir ci-dessous** |

> **⚠️ Un fichier hors périmètre a été emporté par un commit du cycle, et il est déclaré plutôt que
> tu.** `docs/Kaya_Prompts_SpecKit.md` portait une modification **préexistante à ce cycle** — une
> reformulation de deux lignes du document de prompts, faite par l'auteur avant le début des
> travaux et visible dans le `git status` initial. Un `git add -A docs/` l'a emportée dans le commit
> `20d04c2` (T013). **Le contenu n'a pas été produit par ce cycle et n'a pas été modifié par lui** ;
> seule sa mise en dépôt lui est imputable. Il n'est pas défait : ce serait écarter le travail de
> son auteur. *La leçon est mécanique et vaut pour les cycles suivants : `git add -A <répertoire>`
> emporte ce qui traîne, et un `git add` de chemins nommés ne l'aurait pas fait.*

`.specify/feature.json` pointe désormais sur `specs/002-modele-donnees-verticales` : c'est l'état de
l'outil de spécification pour ce cycle, et il est commité avec lui.

---

## T032 · Revue de la *Definition of Done* — `docs/user-stories-v1.md` §0.4

**Date** : 2026-08-07 · **Règle appliquée** : *les points hors phase se déclarent « sans objet »,
**jamais cochés en silence**.*

| # | Point | Phase | Verdict |
|---|---|---|---|
| **1** | Critères d'acceptation couverts par des tests | **toutes** | ✅ **tenu, avec une réserve nommée** — voir ci-dessous |
| **2** | Annotations utoipa, client TypeScript régénéré | phase 3 | ⚪ **sans objet** |
| **3** | Migration sqlx versionnée, `cargo sqlx prepare`, seeds | phase 3 | ⚪ **sans objet** |
| **4** | **RLS activée ET forcée** sur toute nouvelle table, avec test d'isolation | phases 1 et 3 | ✅ **118/118**, `ENABLE` **et** `FORCE`, forme unique · le **test d'isolation multi-tenant** est de phase 3 : ⚪ **sans objet ici** |
| **5** | **Classe hors-ligne déclarée** pour toute nouvelle entité, avec son test | phases 1 et 3 | ✅ **118/118** déclarées, P-02 verte · les **tests `tester_classe_bcd!`** sont de phase 3 : ⚪ **sans objet ici** |
| **6** | Événement outbox pour tout changement d'état | phase 3 | ⚪ **sans objet** |
| **7** | **Clés i18n fr et en**, aucune chaîne en dur | **toutes** | ⚪ **sans objet** — ce cycle ne produit **aucune chaîne exposée à un utilisateur**. Les libellés de `CHECK` (`'SEJOUR'`, `'PRET'`) sont des **valeurs d'énumération de base**, jamais un texte affiché ; leur traduction naîtra avec l'écran qui les montre |
| **8** | Écran vérifié clair **et** sombre, en navigateur réel, Chromium **et** WebKit | phase 2 | ⚪ **sans objet** — aucun écran |
| **9** | **Paramètres exposés en configuration** quand la story dit « paramétrable » | **toutes** | ✅ **tenu** — voir ci-dessous |
| **10** | Document imprimé vérifié sur imprimante thermique | phase 3 | ⚪ **sans objet** |
| **11** | **`docs/modele-donnees/{schema}.sql` à jour** — en phase 1 il **est** le livrable | **toutes** | ✅ **c'est le livrable** : quatre fichiers créés, README tenu dans le même changement |
| **12** | Jeu de données simulées à la forme du modèle | phase 2 | ⚪ **sans objet** — aucune donnée simulée |
| **13** | Données simulées des endpoints livrés supprimées | phase 3 | ⚪ **sans objet** |
| **14** | **`scripts/verifier.sh` passe en une commande**, enchaîne tout, et **toute porte ajoutée a son test négatif** | **toutes** | ✅ **tenu** — voir ci-dessous |

### Point 1 — « couverts par des tests », et ce que cela veut dire quand il n'y a pas de code

**Ce cycle ne livre aucun code exécutable**, donc aucun test unitaire n'a de sujet. Ce qui en tient
lieu, et qui est **exécutable** :

- **Trois portes** dans une commande unique, sur **118 tables** — appliquées sur une base vierge à
  chaque exécution ;
- **Trois tests négatifs** qui prouvent que les portes savent échouer, **rejoués après le
  relèvement des planchers** ;
- **Cinq cas de la contrainte d'exclusion** déroulés à la main, dont **deux transactions
  réellement concurrentes** ;
- **une mesure de performance** sur 20 000 lignes.

**La réserve, et elle est nommée parce qu'elle ne se réparera pas toute seule** : *aucun de ces
contrôles ne prouve la **justesse d'une classe**.* Aucune lecture du schéma ne retrouve qu'une ligne
de commande est **A** à la saisie et **B** à l'annulation après envoi. C'est le seul point du modèle
qui demande un **jugement humain**, et ce cycle en compte **six** — contre deux au cycle D1.

### Point 9 — aucun paramètre métier en dur

| Paramètre | Où il vit | Ce que le cycle **n'a pas** fait |
|---|---|---|
| Seuil de bascule passage → nuitée | Clé de catalogue `seuil_bascule_nuitee_minutes` (D1) | **aucune colonne** nulle part |
| Heures d'arrivée et de départ standard | Clés de catalogue (D1) | colonnes de `formule` **nullables**, sens = « demander à l'établissement » ; **aucune valeur en dur** |
| Destination de préparation par défaut | Clé `ventes.destination_preparation_defaut` (D1) | `article.destination_preparation_id` **nullable**, avec le repli commenté |
| Politique d'annulation, délai d'expiration d'une provisoire | Clés de catalogue (RSV-01, RSV-03) | **aucune table** — et `97-hebergement.sql` le dit |
| Moment de règlement du pressing | Clé `pressing.moment_reglement` | **résolu à la création du bon, puis figé** |
| Toute règle fiscale | `JurisdictionAdapter`, phase 3 | **zéro `TRIGGER`, zéro fonction** dans les quatorze schémas |

### Point 14 — la commande unique, et la porte ajoutée

**`scripts/verifier.sh` passe en une commande, et il enchaîne tout ce qui doit passer.** Aucun
contrôle n'est lancé à la main **en plus** de lui : les constats de ce rapport sont des **constats
humains datés**, pas des contrôles à rejouer — c'est la distinction que la constitution pose, et le
jour où l'un d'eux échoue, il devient une porte.

**La porte ajoutée par ce cycle a son test négatif** — `--test-negatif p05` —, et il a lui-même été
vérifié **en cassant P-05 volontairement** : la porte sabotée est restée verte, et le test est sorti
en **code 4**.

> **Sur l'ajout de P-05 lui-même** : la spécification approuvée disait « aucune porte nouvelle ».
> **Le plan du cycle D1 avait explicitement désigné celui-ci** comme le moment où elle serait
> justifiée, cible non vide à l'appui — et la cible est passée de **zéro** à **onze rattachements
> distincts et une trentaine de colonnes**. Le conflit **n'a pas été tranché en silence** : FR-044,
> FR-046, FR-047, SC-012, SC-013 et la section « Hors périmètre » de la spécification ont été
> amendés dans le même changement, avec le motif écrit.

**Verdict : quatre points tenus, sept sans objet, trois partiellement sans objet — et la seule
réserve du cycle est nommée plutôt que passée.**

---

## Ce que ce cycle laisse écrit pour la phase 3, plutôt que de le laisser redécouvrir

| Ce qui reste à faire | Où c'est écrit |
|---|---|
| Le calcul qui pose `periode_indisponibilite` à `periode.fin + temps_remise_en_etat` | [disponibilite.md](./contracts/disponibilite.md) §3 · commentaire de colonne |
| **Insérer et traiter le rejet `23P01`**, jamais lire puis insérer | [disponibilite.md](./contracts/disponibilite.md) §2 · en-tête d'`occupation` |
| **Insérer et traiter le conflit `23505`** pour les deux reports, jamais lire puis insérer | [sagas-inter-modules.md](./contracts/sagas-inter-modules.md) §4 · commentaires de colonne |
| La compensation des deux sagas et le **test du scénario orphelin** (SYN-03) | [sagas-inter-modules.md](./contracts/sagas-inter-modules.md) §3 et §5 |
| La règle « `lot_envoi_id` ne s'écrit qu'une fois » — **de service, pas de privilège** | Commentaire de colonne, `55-ventes.sql` |
| **La portée du compteur doit égaler celle de l'index d'unicité** — `numerotation_reference`, `numerotation_retrait` | Commentaires, `55-ventes.sql` et `98-pressing.sql` |
| Le **test structurel** qui échoue si `verticales/hebergement` déclare `verticales/pressing`, ou l'inverse | En-tête de `98-pressing.sql` · [sagas-inter-modules.md](./contracts/sagas-inter-modules.md) §4.2 |
| Le **piège du préfixe à trois chiffres** pour un seizième fichier | [README du modèle](../../docs/modele-donnees/README.md) |
| **Le `COMMIT` du perdant rend `ROLLBACK`** : vérifier le succès sur l'`INSERT`, jamais sur le `COMMIT` | Ce rapport, T006 |
| **Quand `ix_unite_categorie` gagnera son coût** — et qu'il faudra refaire la mesure | Ce rapport, T026 |
| Le **surbooking contrôlé** : deux réservations concurrentes sur la même catégorie sont légitimes tant qu'il reste des unités — c'est le `domain` qui compte, jamais la base qui refuse | Commentaire de `reservation.periode` |

---

## Revue adverse du cycle, après les trente-deux tâches

**Date** : 2026-08-07 · **Méthode** : six lecteurs indépendants, une dimension chacun — correction
SQL, écart à la conception, porte P-05, classes et privilèges, parcours du produit, véracité de la
documentation. **Chaque constat a ensuite été soumis à un vérificateur distinct, chargé de le
RÉFUTER** et non de le confirmer. **48 agents, 42 constats soumis, 10 survivants.**

> **Pourquoi une réfutation plutôt qu'une confirmation.** Un relecteur à qui l'on demande de trouver
> des défauts en trouve — y compris là où il n'y en a pas. Un vérificateur à qui l'on demande de
> réfuter doit aller lire le fichier, rejouer la requête, chercher la décision assumée. **Trente-deux
> constats sur quarante-deux sont tombés** à cette épreuve : citations tronquées au point de
> s'inverser, décisions écrites trois lignes plus bas, conséquences impossibles à produire.

### Les trois défauts majeurs, et leur correction

#### 1 · Une requête de contrôle qui ÉCHOUE était indiscernable d'un contrôle qui RÉUSSIT

**C'est le plus grave du cycle, et il touchait LES TROIS PORTES.**

| Maillon | Ce qui se passait |
|---|---|
| 1 | `psql` écrit ses erreurs sur **stderr** et sort en 1 ; la substitution de commande ne capturait que **stdout**, donc le résultat était une **chaîne vide** |
| 2 | `set -e` est **neutralisé** dans le corps d'une fonction appelée en `porte_pXX … \|\| exit` — bash le désactive dans tout membre non final d'une liste `&&`/`\|\|` |
| 3 | Une chaîne vide est **indiscernable de « aucun objet fautif »**, et `rendre_verdict` imprimait `✓ 118/118` puis `VERT` |

**Sur un contrôle de plancher, c'était pire encore** : `[ "" -lt 90 ]` rend le code **2**
(*« integer expression expected »*), donc la branche du `if` **n'est pas prise** — la porte
imprimait *« Plancher atteint »* sur **zéro objet examiné**. Le plancher, qui existe précisément
pour distinguer « rien à trouver » de « je ne cherche plus », **était sauté dans le seul cas qui le
justifie**.

**La correction, en trois points** : `interroger()` capture stderr, relève le statut de `psql`,
**imprime l'erreur** et rend un statut non nul ; `interroger_nombre()` **exige en plus un entier** —
une requête peut réussir et rendre autre chose qu'un nombre ; et **les dix appels** transforment
l'échec en rouge par `|| return "$CODE_ROUGE"`, sans quoi le statut se perdrait dans la substitution.

**Preuve que la correction mord** — cinq requêtes cassées volontairement :

| Ce qui est cassé | Avant | Après |
|---|---|---|
| P-01 · requête de **comptage** | ~~VERT~~ | **ROUGE**, code 1 |
| P-01 · requête de **liste** | ~~VERT~~ | **ROUGE**, code 1 |
| P-02 · requête de tables | ~~VERT~~ | **ROUGE**, code 1 |
| P-05 · requête de **comptage** | ~~VERT~~ | **ROUGE**, code 1 |
| P-05 · requête de **détection** | ~~VERT~~ | **ROUGE**, code 1 |

Chacune sort désormais *« LA REQUÊTE DE CONTRÔLE A ÉCHOUÉ — la porte ne peut RIEN prouver »*, suivie
du message de `psql`. **Les trois tests négatifs restent verts.**

> **Ce défaut complète la leçon de T016 plutôt que de la contredire.** Le sabotage de T016 avait
> montré qu'un **plancher atteint** ne prouve rien si le prédicat est faux. Celui-ci montre qu'un
> **contrôle vert** ne prouve rien si la requête n'a pas tourné. *Une porte a trois façons d'être
> aveugle — cible vide, prédicat faux, requête morte — et il faut trois défenses distinctes.*

#### 2 · `ck_formule_type` refusait `MENSUEL`

**Trois documents normatifs l'exigent**, et aucun ne l'écarte :

- `spec.md` — qui **fait foi** — énumère `NUITEE`, `PASSAGE`, `DEMI_JOURNEE`, **`MENSUEL`** ;
- HEB-03 (P0) reprend les quatre valeurs à l'identique ;
- le cadrage §5 est formel : *« aucune formule n'est réservée à un type d'établissement ; **un hôtel
  peut proposer du mensuel** »*, et une résidence meublée en fait sa formule principale.

**Une résidence meublée ne pouvait pas créer son tarif au mois.** La valeur `SALLE_REUNION` avait
pris sa place — **une invention de l'implémentation, qu'aucun document n'arbitrait**, et qui était
en outre **redondante** : une salle de réunion est une **unité d'une catégorie dédiée** (PDV-08,
HEB-05), louée à l'heure — donc en `PASSAGE` — ou à la demi-journée. Lui donner un type propre
créait une cinquième mécanique de tarification faisant ce que les quatre autres font déjà.

**Vérifié en base** : `MENSUEL` accepté, `SALLE_REUNION` désormais refusée par `ck_formule_type`.

#### 3 · `reservation` ne portait AUCUNE période

**Le chemin nominal de cette table était impossible à écrire**, et c'est son propre commentaire qui
le déclarait nominal : *« on réserve d'abord une **catégorie** ; l'unité précise est attribuée plus
tard, parfois à l'arrivée »*. `unite_id` et `occupation_id` sont donc nullables **exprès** — mais
tant qu'aucune unité n'est désignée, **il n'y a pas d'occupation, donc aucun `tstzrange` où loger
« du 15 au 17 décembre »**. Une réservation de catégorie s'insérait sans qu'aucune colonne ne dise
**pour quand**, alors que RSV-01 la déclare « ressource unique **sur un intervalle** ».

**La colonne `periode TSTZRANGE NOT NULL` est ajoutée** — et `data-model.md` ne la contenait pas :
c'est un manque de la conception, découvert à l'implémentation, déclaré comme tel dans le fichier.

> **Aucune contrainte d'exclusion ne la protège, et ce n'est pas un oubli.** Une réservation de
> catégorie ne bloque **aucune unité en particulier** : le blocage naît de l'`occupation` créée à
> l'attribution, et c'est elle qui porte l'exclusion. Deux réservations concurrentes sur la même
> catégorie sont **légitimes** tant qu'il reste des unités — c'est le **surbooking contrôlé**, que
> le `domain` arbitre **en comptant**, jamais la base **en refusant**. Un index GiST partiel
> (`ix_reservation_categorie_periode`) sert ce comptage.

**Vérifié en base** : une réservation de catégorie sans unité s'écrit avec sa période ; une
réservation sans période est refusée.

### Les sept constats mineurs

| Constat | Traitement |
|---|---|
| T017 annonce **92** clés étrangères et `hebergement 28` — instantané pris **avant** les cinq provisions de T019 ; le réel est **98** et **34** *(quatre lecteurs l'ont relevé)* | **corrigé** — voir T017 |
| T014 présente **42 tables / 48 classes** comme le constat final de SC-007, alors que c'est un instantané pris avant T019 ; le réel est **47 / 53** | **corrigé** — la précaution temporelle est ajoutée |
| `README.md` du modèle : le tableau « ce que ce répertoire ne contient pas » renvoyait encore les quatre schémas au cycle D2 | **corrigé** |
| Diagramme des relations : `conversion_unite_mesure` était placée dans la colonne `stocks` alors qu'elle est dans `ventes` | **corrigé** |

> **Les quatre constats sur le 92 disent tous la même chose, et c'est ce qui les rend crédibles** :
> quatre lecteurs partis de dimensions différentes — cohérence de conception, porte P-05,
> documentation — sont tombés sur le même écart par des chemins indépendants.

### Ce que la revue n'a PAS trouvé

Aucun constat survivant sur : la contrainte d'exclusion et ses cinq cas · l'absence de clé étrangère
inter-schémas · les privilèges des 118 tables · les six doubles classes · les provisions · les deux
sagas · la forme RLS · les décomptes du modèle appliqué. **Trente-deux constats sont tombés à la
réfutation**, dont plusieurs citaient exactement le commentaire qui les démentait trois lignes plus
bas.
