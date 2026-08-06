# Plan d'implémentation : Modèle de données du socle (cycle D1)

**Branche** : `001-modele-donnees-socle` | **Date** : 2026-08-06 | **Spécification** : [spec.md](./spec.md)

**Entrée** : spécification de fonctionnalité de `specs/001-modele-donnees-socle/spec.md`

**Phase du produit** : **1 — le modèle de données** (constitution, principe 0). Aucun écran, aucun endpoint, aucune migration, aucun crate Rust.

---

## Résumé

Ce cycle écrit **le socle du MVP en SQL de référence**, avant toute ligne de code : onze fichiers dans `docs/modele-donnees/`, un par schéma PostgreSQL, plus leur index. Chaque table y porte `tenant_id`, la RLS `ENABLE` **et** `FORCE`, la politique `isolation_tenant` en `USING` **et** `WITH CHECK`, des privilèges **qui prouvent sa classe hors-ligne**, un commentaire d'en-tête donnant sa classe, sa branche et sa story, et les index des recherches nommées par les stories.

Il crée aussi **`scripts/verifier.sh`**, la commande unique du dépôt, avec ses **deux premières portes** — P-01 (le modèle s'applique sur une base vierge, et chaque table porte les trois éléments RLS) et P-02 (toute table a une classe déclarée au registre) — chacune avec **son test négatif**.

**L'approche technique tient en une phrase** : le patron SQL n'est pas à inventer, il est déjà écrit et arbitré dans [docs/module-dore.md](../../docs/module-dore.md) « Couche 1 » ; ce cycle l'**applique** à soixante-dix tables et le **rend mécanique** par deux portes. Aucune nouvelle dépendance n'est introduite : `postgres:18.4` est déjà inscrit à `docs/versions-reference.md` §4.2.

---

## Contexte technique

**Langage / version** : **SQL** (dialecte PostgreSQL **18.4**) et **Bash** pour la commande de vérification. **Aucun Rust, aucun TypeScript dans ce cycle.**

**Dépendances principales** : image Docker `postgres:18.4` (déjà inscrite, `docs/versions-reference.md` §4.2, multi-architecture) et `docker compose`. Le client `psql` est celui de l'image, appelé par `docker compose exec` — **aucun client à installer sur le poste**. **Aucune dépendance nouvelle** ; ni `Cargo.toml`, ni `package.json` n'est créé par ce cycle.

**Stockage** : PostgreSQL 18.4, **onze schémas** — `etablissements`, `comptes`, `caisse`, `fiscalite`, `documents`, `synchronisation`, `pilotage`, `editeur`, `metriques`, `comptabilite`, plus les objets partagés de `00-conventions.sql`. Extensions : `btree_gist` (posée dès maintenant pour le cycle D2, qui en a besoin pour la contrainte d'exclusion de `occupation`).

**Vérification** : `scripts/verifier.sh`, commande unique, portes **P-01** et **P-02**, chacune avec son test négatif consigné. Aucun harnais de test, aucun runner, aucun workflow GitHub Actions.

**Plateforme cible** : base éphémère lancée par `docker compose` sur le poste de développement (**arm64**) ; production à venir sur VPS Contabo (**linux/amd64**). L'image `postgres:18.4` est multi-architecture, le même fichier sert les deux. Ce cycle ne produit **aucun binaire**, la contrainte d'architecture du binaire Rust ne le concerne donc pas.

**Type de projet** : **modèle de données de référence** — de la documentation exécutable, plus un script de vérification. Ce n'est ni une bibliothèque, ni un service, ni une application.

**Objectifs de performance** : `scripts/verifier.sh` en **moins de deux minutes** sur le poste (SC-008, et déclencheur documenté du passage au serveur en phase 3) ; recherche de personne par nom, téléphone ou pièce en **moins de 300 ms sur 10 000 fiches** (SC-009).

**Contraintes** : zéro migration, zéro fichier Rust, zéro écran, zéro `.github/workflows/`. Le modèle **doit s'appliquer sur une base vierge dans un ordre déclaré** — donc aucune dépendance circulaire entre fichiers, et aucune clé étrangère entre deux schémas de modules différents.

**Échelle** : **71 tables** réparties sur 11 fichiers, dont **14 provisions** sans logique. Les schémas `hebergement`, `ventes`, `pressing` et `stocks` sont hors périmètre (cycle D2).

---

## Contrôle de constitution

*Porte : doit passer avant la phase 0, revérifié après la conception de phase 1.*

| Principe | Ce qu'il exige de ce cycle | Verdict | Où c'est tenu |
|---|---|---|---|
| **0 — Ordre des trois phases** | Le modèle vient d'abord ; aucun écran, aucun endpoint | ✅ | Périmètre du plan ; SC-012 |
| **1b — Modèle source de vérité** | `docs/modele-donnees/` est le livrable ; la règle de tenue est écrite pour la phase 3 | ✅ | `README.md` du modèle, FR-031/032 |
| **2 — Monolithe modulaire** | Un schéma par module ; **aucune FK entre schémas de modules** ; le socle ne connaît ni chambre ni séjour | ✅ | [contracts/conventions-sql.md](./contracts/conventions-sql.md) §4 ; contrôlé à la revue, **pas encore par une porte** — voir « Portes » ci-dessous |
| **3 — Multi-tenant** | `tenant_id` partout, `ENABLE` **et** `FORCE`, politique `USING`/`WITH CHECK`, rôle applicatif distinct du propriétaire | ✅ | Porte **P-01**, mécanique |
| **4 — Temps et disponibilité** | Intervalles horodatés et exclusion GiST | ⚪ **sans objet ici** — `occupation` appartient au cycle D2. `btree_gist` est posée d'avance, et le piège « une contrainte d'exclusion se pose à la création » est consigné en commentaire |
| **5 — Argent et fiscalité** | Montants en entiers d'unité mineure + ISO 4217 ; quantités en `NUMERIC` ; aucune règle fiscale hors adaptateur | ✅ | Domaines partagés de `00-conventions.sql` ; `parametrage_fiscal` porte les **paramètres**, jamais le calcul |
| **6 — Hors ligne** | Chaque entité déclare sa classe ; UUID v7 client ; les privilèges prouvent la classe | ✅ | Porte **P-02** + matrice de privilèges du contrat |
| **7 — Application unique** | — | ⚪ **sans objet** — aucune interface dans ce cycle |
| **8 — Qualité et interface** | i18n, mode sombre, navigateur réel | ⚪ **sans objet** — aucun écran |
| **9 — Sécurité** | Coffre chiffré par tenant ; journal d'audit immuable | ✅ | `fiscalite.cle_fne` (colonnes de coffre, chiffrement applicatif par `aes-gcm` en phase 3) ; `comptes.journal_audit` en `SELECT, INSERT` seuls |
| **10 — Périmètre** | Les provisions sont des **données seulement** | ✅ | 14 provisions, privilèges restreints ou nuls |
| **11 — Versions** | Dernière stable, épinglage exact, URL datée, inscription dans le même changement | ✅ | `postgres:18.4` **repris tel quel** sans revérification (instruction explicite) ; §4.1 et §6 de `versions-reference.md` mis à jour dans le même changement que `compose.yml` |
| **12 — Référence visuelle** | — | ⚪ **sans objet** |
| **13 — Vérification** | Une commande ; le noyau de quatre portes ; contrat de porte en cinq points ; test négatif | ⚠️ **une réserve écrite** — voir « Portes » |

**Verdict** : aucune violation. **Une réserve**, consignée ci-dessous et à la section « Suivi de complexité », sur le déclenchement de la porte P-03.

**Revérification après conception de phase 1** — les artefacts produits ne créent aucune violation nouvelle, et deux points méritent d'être relevés :

- La conception a fait apparaître **une table de plus que la spécification n'en nommait** : `synchronisation.publication_outbox`, conséquence directe du principe 6 appliqué à l'outbox — un événement immuable ne peut pas porter son propre drapeau de publication. Elle entre au registre avec les quatre autres.
- Les décisions [D-02](./research.md) (`partenaire`) et [D-03](./research.md) (référentiels partagés) sont les deux endroits où le principe 3 aurait pu être relâché ; **il ne l'est nulle part** — le modèle n'a qu'une seule forme de politique, ce qui est aussi la condition pour que P-01 n'ait qu'une seule forme à chercher.

---

## Portes de vérification — ce que ce cycle touche, et comment

### P-01 · le modèle s'applique sur une base vierge, et chaque table porte `ENABLE` + `FORCE` + sa politique

**Créée par ce cycle.**

| Contrat (constitution, principe 13) | Comment il est tenu |
|---|---|
| **1. Déclare son périmètre** | Elle imprime la liste des fichiers appliqués dans l'ordre, et la liste des schémas inspectés |
| **2. Vérifie sa complétude** | Elle compare les schémas trouvés dans la base aux schémas déclarés au `README.md` du modèle ; un schéma en trop ou en moins est un échec |
| **3. Ne modifie pas ce qu'elle inspecte** | Elle applique le SQL sur une base **éphémère** créée pour l'occasion et détruite ensuite ; elle ne touche aucun fichier du dépôt |
| **4. Prouve que sa cible n'est pas vide** | Elle échoue si le nombre de tables inspectées est **inférieur à un plancher déclaré** dans le script — une porte qui inspecterait zéro table passerait au vert sans rien prouver |
| **5. Test négatif** | `scripts/verifier.sh --test-negatif p01` retire la politique d'une table dans une **copie de travail** du modèle, relance la porte, et **exige** qu'elle échoue en nommant cette table |

**Mécanisme** : `docker compose up -d postgres_verification` → boucle d'attente sur `pg_isready` → `psql -v ON_ERROR_STOP=1 -f` sur chaque fichier dans l'ordre → trois requêtes d'inspection (colonne `tenant_id` non nulle · `relrowsecurity` **et** `relforcerowsecurity` · politique `isolation_tenant` dont `qual` **et** `with_check` sont non nuls et contiennent le second argument `true` de `current_setting`) → `docker compose down -v`, y compris **en cas d'échec** et **en cas d'interruption** (`trap`).

**Ce qu'elle ne vérifie pas, et qui reste à la revue** : la justesse d'une classe, la pertinence d'un index, et l'absence de FK entre schémas de modules. Les deux premières demandent un jugement humain ; **la troisième est mécanisable et ne l'est pas encore** — voir la réserve ci-dessous.

### P-02 · toute table du modèle a une classe déclarée au registre

**Créée par ce cycle.**

| Contrat | Comment il est tenu |
|---|---|
| **1. Déclare son périmètre** | Elle imprime le nombre de tables réelles confrontées et le nombre d'entités extraites du registre |
| **2. Vérifie sa complétude** | Elle échoue si l'extraction du registre rend **moins d'entités qu'un plancher déclaré** — un registre devenu illisible pour l'extracteur ferait passer la porte au vert en ne comparant rien |
| **3. Ne modifie pas ce qu'elle inspecte** | Lecture seule sur `docs/registre-classes-offline.md` |
| **4. Prouve que sa cible n'est pas vide** | Même plancher, des deux côtés : tables réelles **et** entités déclarées |
| **5. Test négatif** | `scripts/verifier.sh --test-negatif p02` ajoute une table bidon non déclarée dans une **copie de travail** du modèle et **exige** que la porte échoue en la nommant |

**Sens de la comparaison** : **table → registre**, jamais l'inverse. Une entité déclarée sans table est normale — le registre §6, §7 et §8 déclare déjà tout le cycle D2. Une **table non déclarée est l'erreur**.

**Extraction** : les identifiants entre accents graves du registre, tronqués au premier point (`etablissement.classement` → `etablissement`), en minuscules. Une table passe si son nom nu appartient à cet ensemble. **Limite assumée et écrite dans le script** : la comparaison est faite sur le nom nu, pas sur `schema.table` ; une table pourrait passer grâce à une mention en prose portant le même nom. Le coût d'un faux positif ici est nul ; celui d'un faux négatif serait une porte qu'on désactive.

### P-03 · aucune dépendance en intervalle, lockfiles commités — **réserve écrite**

**Ce cycle ne la crée pas, et ce n'est pas neutre.** Son déclencheur documenté est « dès qu'un manifeste existe » (constitution, principe 13), et `docs/versions-reference.md` §4.1 range explicitement `compose.yml` sous P-03. Or ce cycle crée `compose.yml`.

**Décision retenue : P-03 est différée au cycle qui crée le premier manifeste de dépendances** (`Cargo.toml`, `package.json`, `rust-toolchain.toml`, `.nvmrc`), et elle couvrira `compose.yml` à ce moment-là.

**Motifs** : (a) la spécification approuvée de ce cycle dit « deux portes et rien de plus » (FR-038) ; (b) le `compose.yml` de ce cycle ne déclare **aucune dépendance du produit** — il lance une base de vérification jetable ; (c) le noyau de portes grossit **à la demande, pas par anticipation**.

**Exposition résiduelle, et sa contrepartie.** Entre ce cycle et le suivant, un tag `latest` glissé dans `compose.yml` ne serait vu par aucune porte. La surface est **un fichier, une ligne**, écrite et figée par ce cycle à `postgres:18.4` (§4.2 de `versions-reference.md`).

**Ce qui la couvre en attendant** : le tag exact de `compose.yml` est **un constat écrit de T036**, aux côtés des quatre autres que ce cycle vérifie une fois à la main faute de porte (SC-004, SC-010, SC-011, absence de `SEQUENCE`). Ce n'est pas une porte et ne prétend pas l'être — c'est un contrôle humain **daté et consigné**, dont le périmètre est d'une ligne et dont la fin est connue : le cycle qui crée `Cargo.toml` crée P-03, qui absorbe `compose.yml` avec le reste.

**Fermer le trou tout de suite reste possible** : P-03 en forme réduite coûte une dizaine de lignes et un test négatif, et amende FR-038. Le report est retenu parce que la spécification approuvée dit « deux portes et rien de plus », et qu'une porte écrite avant d'avoir rencontré le problème qu'elle prévient regarde souvent à côté.

### P-04 · l'application démarre et chaque écran s'atteint

**Sans objet** — phase 2.

### Aucune porte nouvelle demandée

Ce cycle n'ajoute **aucune porte hors du noyau**. Deux candidates ont été examinées et **écartées faute d'erreur réelle constatée** :

- **« aucune FK entre deux schémas de modules »** — mécanisable en une requête sur `pg_constraint`, et le coût d'un manquement est réel (une jointure inter-modules qui bloque l'extraction en service). **Écartée pour l'instant** : le cycle D1 crée les schémas du socle seuls, et la tentation n'apparaîtra qu'au cycle D2, où `ventes → hebergement` et `pressing → hebergement` sont deux rattachements sans FK. **C'est là qu'elle sera justifiée**, avec une cible non vide à inspecter.
- **« les privilèges correspondent à la classe déclarée »** — séduisante, mais elle demanderait au script de **juger** ce qu'est une entité « append-only » à partir d'un texte de registre. Une porte qui devine se trompe et finit désactivée. Le contrôle reste humain, et le contrat de privilèges est écrit noir sur blanc dans [contracts/conventions-sql.md](./contracts/conventions-sql.md) §3.

---

## Versions — ce que ce cycle touche

**Aucune dépendance ajoutée, aucune montée.** Conformément à l'instruction, les valeurs déjà inscrites sont **reprises sans revérification**.

| Élément | Valeur | Provenance |
|---|---|---|
| Image PostgreSQL | **`postgres:18.4`** — tag exact, jamais `latest` | `docs/versions-reference.md` §2 et §4.2, vérifiée le 2026-07-30 |

**Familles exclusives (§3.4)** : ce cycle **n'ouvre aucune famille nouvelle**. Il n'introduit ni client HTTP, ni bibliothèque de date, ni mécanique de mocks. Le seul outil employé — `psql`, embarqué dans l'image — n'est pas une dépendance du dépôt.

**Écritures dues dans `docs/versions-reference.md`, dans le même changement que `compose.yml`** :

1. §4.1 — retirer l'avertissement « aucun de ces fichiers n'existe encore » pour la ligne `compose.yml`, qui existe désormais.
2. §6 — une ligne au journal : première matérialisation de `postgres:18.4`, valeur reprise du §2 sans revérification.

---

## Structure du projet

### Documentation (cette fonctionnalité)

```text
specs/001-modele-donnees-socle/
├── plan.md                        # ce fichier
├── spec.md                        # la spécification approuvée
├── research.md                    # phase 0 — les décisions et leurs motifs
├── data-model.md                  # phase 1 — les 70 tables, colonne par colonne
├── quickstart.md                  # phase 1 — comment lancer et prouver
├── contracts/
│   ├── conventions-sql.md         # le contrat que chaque fichier .sql honore
│   └── verifier-cli.md            # le contrat de la commande unique
└── checklists/
    └── requirements.md            # contrôle qualité de la spécification
```

### Fichiers du dépôt produits par ce cycle

```text
docs/modele-donnees/
├── README.md                      # index, ordre d'application, relations, classes, règle de tenue
├── 00-conventions.sql             # rôles, extensions, domaines, patron RLS, pièges de migration
├── 10-etablissements.sql          # 13 tables + 6 provisions
├── 20-comptes.sql                 # 10 tables + 1 provision
├── 30-caisse.sql                  # 9 tables + 3 provisions
├── 40-fiscalite.sql               # 8 tables + 2 provisions
├── 50-documents.sql               # 3 tables
├── 60-synchronisation.sql         # 3 tables
├── 70-pilotage.sql                # 1 table
├── 80-editeur.sql                 # 8 tables
├── 90-metriques.sql               # 2 tables
└── 95-comptabilite.sql            # 2 provisions

scripts/
└── verifier.sh                    # la commande unique — P-01, P-02, et leurs tests négatifs

compose.yml                        # service postgres_verification, tag exact, volume éphémère

docs/registre-classes-offline.md   # MODIFIÉ — §5.2, §5.3, §5.8 et journal §13
docs/versions-reference.md         # MODIFIÉ — §4.1 et journal §6
README.md                          # MODIFIÉ — la commande unique y est documentée
```

**Décision de structure** : les fichiers SQL portent un **préfixe numérique** qui **est** l'ordre d'application. L'ordre lexicographique et l'ordre de dépendance coïncident alors, et `scripts/verifier.sh` applique `docs/modele-donnees/*.sql` trié — il n'y a **pas de liste d'ordre à tenir à jour dans le script**, donc pas de liste qui puisse diverger du répertoire. Le `README.md` documente l'ordre, il ne le commande pas.

> **Ce que le préfixe achète, et ce qu'il coûte.** Il achète l'impossibilité d'un désaccord entre le script et le répertoire. Il coûte le renommage d'un fichier si un schéma devait s'intercaler — d'où les pas de dix, qui laissent neuf places libres entre chaque.

---

## Ce que le cycle produit, table par table

Le détail complet — colonnes, contraintes nommées, privilèges, index, classe et branche de chaque table — est dans **[data-model.md](./data-model.md)**. Le contrat que chaque fichier honore est dans **[contracts/conventions-sql.md](./contracts/conventions-sql.md)**.

| Fichier | Tables | Dont provisions | Points qui demandent une décision, traités en [research.md](./research.md) |
|---|---|---|---|
| `00-conventions.sql` | — | — | Rôles, domaines partagés, patron RLS, trois pièges de migration |
| `10-etablissements.sql` | 19 | 6 | `partenaire` et son second identifiant de tenant · `convention_inter_etablissements` conservée sans privilège · module ≠ capacité |
| `20-comptes.sql` | 11 | 1 | `releve_position` nommée ici · l'attestation est un attribut, pas une table · portée par établissement de `compte_role` |
| `30-caisse.sql` | 12 | 3 | `coupure_comptee` nommée ici · `encaissement` porte deux classes · règlement fractionné = plusieurs lignes |
| `40-fiscalite.sql` | 10 | 2 | `item_certifie` persiste les `id` de l'API · `compteur_stickers` est un compteur en table · `rne_ref` est une colonne |
| `50-documents.sql` | 3 | — | `numerotation_document` est un compteur à verrou de ligne, jamais une `SEQUENCE` |
| `60-synchronisation.sql` | 3 | — | L'outbox est immuable : la publication est un **fait ajouté** dans `publication_outbox`, pas un `UPDATE` |
| `70-pilotage.sql` | 1 | — | Tout le reste est **dérivé** et ne reçoit aucune table — le fichier le dit |
| `80-editeur.sql` | 8 | — | `unite_facturable` est une métrique abstraite · deux tables nommées ici pour l'abonnement |
| `90-metriques.sql` | 2 | — | Idempotence par UUID d'événement |
| `95-comptabilite.sql` | 2 | 2 | **Le seul écart à la liste de fichiers de l'entrée**, justifié en [research.md](./research.md) §D-01 |

---

## Livrables attendus — phase 1

*(Les rubriques de phase 2 et de phase 3 du gabarit de plan sont **sans objet** pour ce cycle et ne sont pas remplies : il ne produit ni écran, ni endpoint, ni migration, ni simulation à supprimer.)*

**Fichiers de `docs/modele-donnees/` créés** : les onze listés ci-dessus, aucun modifié — le répertoire n'existe pas encore.

**Pour chaque table** : politique RLS (`isolation_tenant` en `USING` et `WITH CHECK`, plus `administration_editeur FOR ALL TO kaya_owner` posée à la création), privilèges de `kaya_app` dérivés de la classe, contraintes nommées, index justifiés par une recherche nommée, classe hors-ligne et code de branche en commentaire d'en-tête. **Tout est détaillé dans [data-model.md](./data-model.md).**

**Registre des classes hors-ligne** : **cinq** entités nommées par ce cycle y entrent — `releve_position` (§5.2), `coupure_comptee` (§5.3), `publication_outbox` (§5.6), `encaissement_abonnement` et `evenement_webhook_paiement` (§5.8) — plus une ligne par décision de nommage au journal §13.

---

## Suivi de complexité

| Écart | Pourquoi il est nécessaire | Alternative plus simple, et pourquoi elle est écartée |
|---|---|---|
| **Un onzième fichier, `95-comptabilite.sql`**, alors que l'entrée en énumère dix | `mapping_comptable` et `exercice_comptable` sont ajoutés par l'entrée « en provision » sans fichier assigné, et aucun schéma existant ne les accueille sans les coupler à un module qu'ils ne servent pas | Les mettre dans `synchronisation.sql` : coûterait un **déplacement inter-schéma** le jour où le crate comptable naîtra, et la règle « aucune FK entre schémas » interdit de toute façon de les y rattacher. Un fichier aujourd'hui, rien plus tard |
| **`partenaire` porte deux colonnes de tenant** au lieu du seul `tenant_id` nullable décrit par l'amendement A12 | Une ligne au `tenant_id` nul est invisible sous la politique — ou visible de tous si on relâche la politique. La constitution (principe 3) ne souffre pas d'exception | Rendre la politique tolérante au `NULL` : ouvrirait, sur une provision que personne n'utilise, la seule brèche d'isolation du produit. Deux colonnes coûtent une colonne |
| **P-03 différée** alors que ce cycle crée `compose.yml` | La spécification approuvée dit « deux portes et rien de plus », et le `compose.yml` de ce cycle ne déclare aucune dépendance du produit | La créer maintenant en forme réduite : dix lignes et un test négatif. **Réversible sur un mot** — l'exposition résiduelle est écrite ci-dessus, à une ligne près |

---

## Artefacts de conception

- **[research.md](./research.md)** — les treize décisions du cycle, leur motif et ce qui a été écarté.
- **[data-model.md](./data-model.md)** — les soixante-dix tables, schéma par schéma : colonnes, contraintes, privilèges, index, classe et branche.
- **[contracts/conventions-sql.md](./contracts/conventions-sql.md)** — le contrat que chaque fichier `.sql` honore, opposable table par table.
- **[contracts/verifier-cli.md](./contracts/verifier-cli.md)** — le contrat de `scripts/verifier.sh` : usage, codes de sortie, format de sortie, procédure des tests négatifs.
- **[quickstart.md](./quickstart.md)** — comment appliquer le modèle, lancer la vérification et prouver que les deux portes savent échouer.
