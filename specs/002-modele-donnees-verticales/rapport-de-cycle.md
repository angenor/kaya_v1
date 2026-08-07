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

### Le constat

| Ce qui est compté | Attendu | Constaté |
|---|---|---|
| Clés étrangères **entre deux schémas** | **0** | **0** ✓ — les deux sagas comprises |
| Clés étrangères **internes**, total | — | **92** |
| Mêmes, comptées par `grep` sur les fichiers | **92** | **92** ✓ — *deux mesures indépendantes qui concordent* |

### Répartition, schéma par schéma

| Schéma | Clés étrangères internes | | Schéma | Clés étrangères internes |
|---|---|---|---|---|
| `hebergement` | **28** | | `stocks` | 8 |
| `etablissements` | 17 | | `fiscalite` | 5 |
| `ventes` | 12 | | `editeur` | 3 |
| `caisse` | 9 | | `pressing` | 1 |
| `comptes` | 8 | | `synchronisation` | 1 |

*Les quatre schémas restants — `documents`, `pilotage`, `metriques`, `comptabilite` — n'en portent
aucune, ce qui est cohérent : ce sont des schémas de tables autonomes ou de provisions.*

### P-05 déclare bien son périmètre, et le nombre est le bon

La porte imprime **`Périmètre : 14 schéma(s) · 92 contrainte(s) de clé étrangère examinée(s)`**.
Ce **92** est le décompte réel du modèle, vérifié par deux voies. La porte n'inspecte donc pas un
sous-ensemble sans le dire — ce qui est très exactement le point 1 du contrat de porte.

> **Le contraste avec le socle mérite d'être noté** : `hebergement` porte à lui seul **28** clés
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
