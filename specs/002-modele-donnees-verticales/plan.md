# Plan d'implémentation : Modèle de données des capacités et des verticales (cycle D2)

**Branche** : `main` *(aucune branche dédiée — aucune extension `before_specify` n'est enregistrée dans ce dépôt)* | **Date** : 2026-08-07 | **Spécification** : [spec.md](./spec.md)

**Entrée** : spécification de fonctionnalité de `specs/002-modele-donnees-verticales/spec.md`

**Phase du produit** : **1 — le modèle de données** (constitution, principe 0). **Second et dernier cycle de la phase.** Aucun écran, aucun endpoint, aucune migration, aucun crate Rust.

---

## Résumé

Ce cycle **termine le modèle de données du MVP** : quatre fichiers de plus dans `docs/modele-donnees/` — `55-ventes.sql`, `96-stocks.sql`, `97-hebergement.sql`, `98-pressing.sql` —, **47 tables**, dont 6 provisions. Le modèle complet passe à **118 tables sur 15 fichiers et 14 schémas**.

**L'approche technique tient en une phrase** : le patron SQL n'est pas à inventer — il est écrit, arbitré et mesuré au cycle D1 ([conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md)) ; ce cycle l'**applique** à quarante-sept tables de plus, **exerce pour la première fois** ce que le socle avait posé d'avance (l'extension `btree_gist`, le piège de la contrainte d'exclusion, la table de réconciliation), et **ferme mécaniquement** la règle que le D1 avait laissée à la revue.

**Trois choses seulement sont nouvelles, et chacune est structurante** :

1. **La contrainte d'exclusion GiST sur `occupation`** — la décision la plus irréversible du produit. Le chevauchement devient impossible **au niveau de la base**, et le temps de remise en état est **dans** l'intervalle protégé.
2. **Les deux sagas inter-modules**, sans clé étrangère, dont le **cas orphelin est le chemin nominal**.
3. **Une porte nouvelle, P-05**, qui refuse toute clé étrangère entre deux schémas — **le cycle D1 l'avait explicitement différée à celui-ci**.

**Aucune dépendance n'est ajoutée, aucune n'est montée, aucune famille du §3.4 n'est ouverte.**

---

## Contexte technique

**Langage / version** : **SQL** (dialecte PostgreSQL **18.4**) et **Bash** pour la porte ajoutée à la commande de vérification. **Aucun Rust, aucun TypeScript dans ce cycle.**

**Dépendances principales** : image Docker `postgres:18.4`, **déjà inscrite** (`docs/versions-reference.md` §4.2) et **déjà lancée** par le `compose.yml` du cycle D1. **Aucune dépendance nouvelle** ; ni `Cargo.toml`, ni `package.json` n'est créé par ce cycle, et aucun service n'est ajouté à `compose.yml`.

**Stockage** : PostgreSQL 18.4, **quatorze schémas** après ce cycle — les dix du socle, plus `ventes`, `stocks`, `hebergement`, `pressing`. Extension employée : **`btree_gist`**, posée par `00-conventions.sql` au cycle D1 *explicitement pour ce cycle* — `unite_id WITH =` sur un `UUID` ne s'indexe pas en GiST sans elle.

**Vérification** : `scripts/verifier.sh`, commande unique, **trois portes** — P-01, P-02 (inchangées, planchers relevés) et **P-05 (nouvelle)** —, chacune avec son test négatif consigné. Aucun harnais de test, aucun runner, aucun workflow GitHub Actions.

**Plateforme cible** : base éphémère lancée par `docker compose` sur le poste de développement (**arm64**) ; production à venir sur VPS Contabo (**linux/amd64**). L'image est multi-architecture. Ce cycle ne produit **aucun binaire** — la contrainte d'architecture du binaire Rust ne le concerne pas.

**Type de projet** : **modèle de données de référence** — de la documentation exécutable, plus une porte de vérification. Ni bibliothèque, ni service, ni application.

**Objectifs de performance** : `scripts/verifier.sh` toujours **sous deux minutes** malgré 47 tables de plus (SC-011) ; recherche de disponibilité par catégorie sur un intervalle en **moins de 300 ms sur 50 unités et 20 000 occupations**, **par parcours d'index** (SC-010).

**Contraintes** : zéro migration, zéro fichier Rust, zéro écran, zéro `.github/workflows/`, **zéro fichier du socle modifié hors README**. Le modèle doit s'appliquer sur une base vierge dans l'ordre déclaré — donc aucune dépendance circulaire, et **aucune clé étrangère entre deux schémas**, désormais garantie par une porte.

**Échelle** : **47 tables** sur 4 fichiers, dont 6 provisions et **6 tables à double classe**. Modèle complet : **118 tables, 15 fichiers, 14 schémas, 20 provisions**.

---

## Contrôle de constitution

*Porte : doit passer avant la phase 0, revérifié après la conception de phase 1.*

| Principe | Ce qu'il exige de ce cycle | Verdict | Où c'est tenu |
|---|---|---|---|
| **0 — Ordre des trois phases** | Le modèle d'abord ; aucun écran, aucun endpoint | ✅ | Périmètre du plan ; SC-014 |
| **1b — Modèle source de vérité** | Les quatre fichiers **sont** le livrable ; le README est mis à jour dans le même changement | ✅ | FR-041 à FR-043 |
| **2 — Monolithe modulaire** | Un schéma par module ; **aucune FK entre schémas** ; le socle ne connaît ni chambre ni séjour ; `verticales/` ne dépend jamais d'une autre verticale | ✅ **et désormais mécanique** | Porte **P-05** · `ventes` ne nomme « séjour » que comme valeur opaque · [D-28](./research.md) pour `pressing` |
| **3 — Multi-tenant** | `tenant_id` partout, `ENABLE` **et** `FORCE`, politique `USING`/`WITH CHECK`, forme unique | ✅ | Porte **P-01**, mécanique, périmètre élargi sans modification |
| **4 — Temps et disponibilité** | Intervalle `[début, fin)` horodaté, **jamais une paire de dates** ; exclusion GiST ; remise en état **intégrée** ; horodatage d'autorité seul | ✅ **c'est le cœur du cycle** | [contracts/disponibilite.md](./contracts/disponibilite.md) · SC-003, SC-004 |
| **5 — Argent et fiscalité** | Montants entiers d'unité mineure + ISO 4217 ; quantités en `NUMERIC` ; **aucune règle fiscale hors `JurisdictionAdapter`** | ✅ | Domaines partagés · `formule` porte `assujettie_taxe_nuitee` et sa règle de conversion comme **paramètres**, jamais comme calcul · `taxe_sejour_constat` fige une **trace**, pas une règle |
| **6 — Hors ligne** | Chaque entité déclare sa classe ; UUID v7 client ; les privilèges prouvent la classe ; **double classe déclarée des deux côtés** | ✅ | Porte **P-02** · matrice de privilèges du contrat D1 · SC-007 |
| **7 — Application unique** | — | ⚪ **sans objet** — aucune interface dans ce cycle |
| **8 — Qualité et interface** | i18n, mode sombre, navigateur réel | ⚪ **sans objet** — aucun écran, **aucune chaîne utilisateur** |
| **9 — Sécurité** | Journal d'audit sur remise, annulation, rebascule de palier | ✅ | Ces opérations écrivent dans `comptes.journal_audit` (socle) ; `remise` et `ligne_commande` portent l'auteur en identifiant nu |
| **10 — Périmètre** | Les provisions sont des **données seulement** | ✅ | 6 provisions, privilèges `SELECT` ou **aucun** ; le décompte de prestation incluse **n'a pas de table** |
| **11 — Versions** | Dernière stable, épinglage exact, inscription dans le même changement | ✅ | **Aucune dépendance ajoutée ni montée** — voir « Versions » |
| **12 — Référence visuelle** | — | ⚪ **sans objet** |
| **13 — Vérification** | Une commande ; le noyau grossit **à la demande** ; contrat de porte en cinq points ; test négatif | ✅ **avec une porte ajoutée et justifiée** | Voir « Portes » |

**Verdict : aucune violation.** Un écart à la spécification approuvée, assumé et justifié : **la porte P-05**, que la spécification interdisait et qui est amendée dans le même changement (voir « Suivi de complexité »).

**Revérification après conception de phase 1** — les artefacts produits ne créent aucune violation nouvelle, et trois points méritent d'être relevés :

- **Le principe 2 a mordu trois fois pendant la conception**, et dans les trois cas la conception a plié, pas le principe : `pressing.bon_depot` pointe sur `comptes.personne` et **jamais** sur `hebergement.client` ([D-28](./research.md)) ; le rattachement croisé `pressing` ↔ `hebergement` passe par un **événement outbox dont le type est déclaré au socle**, donc sans dépendance de crate — et un test structurel de phase 3 doit le vérifier ; **`cible_type` ne porte aucune contrainte `CHECK`**, sur le précédent de `caisse.encaissement`, faute de quoi `ventes` — qui est du socle — nommerait `SEJOUR` dans une contrainte de base.
- **Le principe 4 a produit une table de plus que la lecture naïve n'en donnait** : `occupation` porte **deux** intervalles et non un ([D-15](./research.md)). Une période unique aurait, au choix, facturé le ménage au client ou laissé attribuer une unité encore sale.
- **Le principe 3 n'est relâché nulle part.** Le modèle n'a toujours qu'**une seule forme de politique**, ce qui est la condition pour que P-01 n'en cherche qu'une.

---

## Portes de vérification — ce que ce cycle touche, et comment

### P-01 · le modèle s'applique, et chaque table porte `ENABLE` + `FORCE` + sa politique

**Créée au cycle D1. Ce cycle ne la modifie pas** — il élargit son périmètre sans qu'elle change, ce qui est la preuve que le dispositif tient : elle applique `*.sql` **trié**, sans liste interne.

| Ce que ce cycle lui doit | Comment |
|---|---|
| **Que les 47 tables nouvelles passent les trois contrôles** | Forme RLS **strictement identique** à celle du socle, reprise du contrat D1 sans reformulation |
| **Que la liste opposable des schémas soit à jour** | Les quatre schémas nouveaux inscrits au `README.md` du modèle — la porte compare base ↔ README, un écart dans un sens ou l'autre est un échec |
| **Que son plancher de non-vacuité soit relevé** | De **60** à une valeur réglée **juste sous 118** — un plancher confortable ne refuse rien |
| **Que son test négatif soit rejoué après le relèvement** | `--test-negatif p01`, consigné au rapport de cycle |

**Vérifié par** : `scripts/verifier.sh` (vert attendu) puis `scripts/verifier.sh --test-negatif p01` (rouge attendu, nommant la table).

### P-02 · toute table du modèle a une classe déclarée au registre

**Créée au cycle D1. Ce cycle ne la modifie pas.** Le sens reste **table → registre** : une entité déclarée sans table est normale, une table non déclarée est l'erreur.

| Ce que ce cycle lui doit | Comment |
|---|---|
| **Que les 47 tables nouvelles soient déclarées** | Les §6, §7 et §8 du registre les nomment **déjà** — elles sont honorées telles quelles (FR-037). Une seule entité est nommée par ce cycle : **`ligne_inventaire`** ([D-25](./research.md)) |
| **Que ses deux planchers soient relevés** | Tables réelles : de 60 à **juste sous 118**. Entités extraites : la valeur mesurée après ajout de `ligne_inventaire`, réglée juste en dessous |
| **Que son test négatif soit rejoué** | `--test-negatif p02`, consigné |

**Vérifié par** : `scripts/verifier.sh --test-negatif p02` (rouge attendu, nommant la table bidon, **P-01 restant verte**).

> **Un piège que ce cycle introduit et que le contrat de P-02 nommait déjà** : la comparaison porte sur le **nom nu**, pas sur `schema.table`. `ligne_inventaire` a été nommée **contre** `comptage_article` pour cette raison précise — `comptage` existe déjà au socle (`caisse.comptage`), et deux homonymes dans deux schémas passeraient avec une seule déclaration.

### P-03 · aucune dépendance en intervalle, lockfiles commités — **réserve maintenue**

**Ce cycle ne la crée pas, et ne change rien à la réserve écrite au cycle D1.** Il ne crée aucun manifeste de dépendances — ni `Cargo.toml`, ni `package.json`, ni `rust-toolchain.toml`, ni `.nvmrc` — et **n'ajoute aucun service à `compose.yml`**.

**L'exposition résiduelle est inchangée** : une ligne, `postgres:18.4`, dans un fichier que ce cycle ne touche pas. Sa fin est connue et écrite (`docs/versions-reference.md` §4.1) : le cycle qui crée `Cargo.toml` crée P-03, qui absorbe `compose.yml` avec le reste.

### P-04 · l'application démarre et chaque écran s'atteint

**Sans objet** — phase 2.

### P-05 · aucune clé étrangère entre deux schémas — **PORTE NOUVELLE**

**Créée par ce cycle.** Contrat complet : **[contracts/verifier-p05.md](./contracts/verifier-p05.md)**. Décision et motifs : **[D-23](./research.md)**.

**Pourquoi elle est justifiée, et pourquoi maintenant** — le plan du cycle D1 l'a examinée, écartée, et **désigné ce cycle-ci** :

> « Écartée pour l'instant : le cycle D1 crée les schémas du socle seuls, et la tentation n'apparaîtra qu'au cycle D2, où `ventes → hebergement` et `pressing → hebergement` sont deux rattachements sans FK. **C'est là qu'elle sera justifiée**, avec une cible non vide à inspecter. »

**Le coût manifeste** — ce n'est pas un principe d'architecture abstrait :

1. Une clé étrangère sur `ligne_sejour.ligne_commande_id` **casse le chemin nominal du conflit le plus fréquent du produit**. L'écriture orpheline n'irait pas en réconciliation : elle échouerait, en base, sur une contrainte.
2. Le mode de défaillance est **silencieux et différé** : un cycle de phase 3 prend l'absence de `REFERENCES` pour un oubli et l'ajoute **de bonne foi**. La migration s'applique, tous les tests passent, le défaut se voit à la première coupure réseau en exploitation.
3. **Le commentaire de colonne est aujourd'hui la seule défense, et un commentaire ne refuse rien.**

| Contrat (constitution, principe 13) | Comment il est tenu |
|---|---|
| **1. Déclare son périmètre** | Nombre de schémas inspectés et **nombre de contraintes de clé étrangère examinées** |
| **2. Vérifie sa complétude** | Schémas de la base comparés à la liste opposable du `README.md` — **la même que P-01**, jamais une seconde |
| **3. Ne modifie pas ce qu'elle inspecte** | Lecture seule du catalogue, **sur la base que P-01 a déjà montée** |
| **4. Prouve que sa cible n'est pas vide** | **Plancher de clés étrangères examinées.** Point critique : P-05 cherche une **absence** et est verte quand elle ne trouve rien — le pire profil de porte qui soit. Le plancher distingue « rien à trouver » de « je ne cherche plus » |
| **5. Test négatif** | `--test-negatif p05` transforme `ligne_sejour.ligne_commande_id` en clé étrangère vers `ventes.ligne_commande` et **exige** un échec nommant la contrainte, la table portante et la table référencée |

**Coût d'exécution** : une requête sur `pg_constraint`, aucun conteneur de plus, quelques secondes. La cible des deux minutes (SC-011) est préservée.

**Vérifié par** : `scripts/verifier.sh` (vert) puis `scripts/verifier.sh --test-negatif p05` (rouge, nommant les trois objets).

### Aucune autre porte demandée

Deux candidates ont été réexaminées et **écartées** :

- **« les privilèges correspondent à la classe déclarée »** — écartée pour le même motif qu'au cycle D1 : elle demanderait au script de **juger** ce qu'est une entité append-only à partir d'un texte de registre. **Ce cycle la rend même moins souhaitable** : six tables portent deux classes, et deux tables de classe B reçoivent délibérément un privilège **plus strict** que leur classe ([D-24](./research.md)). Une porte qui devine se trompe et finit désactivée.
- **« la période facturée est incluse dans l'indisponibilité »** — **inutile en tant que porte** : c'est une contrainte `CHECK` de la table, donc déjà garantie par la base à chaque écriture. Une porte qui vérifierait qu'une contrainte existe vérifierait un fichier, pas un comportement.

---

## Versions — ce que ce cycle touche

**Aucune dépendance ajoutée, aucune montée, aucune famille du §3.4 ouverte.** Conformément à l'instruction, les valeurs déjà inscrites sont **reprises sans revérification**.

| Élément | Valeur | Provenance |
|---|---|---|
| Image PostgreSQL | **`postgres:18.4`** — tag exact, jamais `latest` | `docs/versions-reference.md` §2 et §4.2, vérifiée le 2026-07-30, **matérialisée par le cycle D1** |
| Extension | **`btree_gist`** — livrée avec PostgreSQL, aucune version à épingler | Posée par `00-conventions.sql` au cycle D1, *explicitement pour ce cycle* |

**Familles exclusives (§3.4)** : ce cycle **n'ouvre aucune famille**. Il n'introduit ni client HTTP, ni bibliothèque de date, ni mécanique de mocks, ni coquille native. Le seul outil employé — `psql`, embarqué dans l'image — n'est pas une dépendance du dépôt.

**Écriture due dans `docs/versions-reference.md`** : **une seule ligne au journal §6**, disant que le cycle D2 n'a introduit aucune dépendance. Un journal qui ne dit rien d'un cycle laisse croire qu'on a oublié de l'y écrire.

---

## Structure du projet

### Documentation (cette fonctionnalité)

```text
specs/002-modele-donnees-verticales/
├── plan.md                        # ce fichier
├── spec.md                        # la spécification approuvée — AMENDÉE pour P-05
├── research.md                    # phase 0 — les quinze décisions D-14 à D-28
├── data-model.md                  # phase 1 — les 47 tables, colonne par colonne
├── quickstart.md                  # phase 1 — appliquer, prouver, mesurer
├── contracts/
│   ├── disponibilite.md           # ce que la base garantit, et ce qui reste au domain
│   ├── sagas-inter-modules.md     # les deux sagas, et le cas orphelin nominal
│   └── verifier-p05.md            # le contrat de la porte nouvelle
└── checklists/
    └── requirements.md            # contrôle qualité de la spécification
```

### Fichiers du dépôt produits ou modifiés par ce cycle

```text
docs/modele-donnees/
├── 55-ventes.sql                  # CRÉÉ — 11 tables, dont 1 provision
├── 96-stocks.sql                  # CRÉÉ —  7 tables
├── 97-hebergement.sql             # CRÉÉ — 26 tables, dont 5 provisions
├── 98-pressing.sql                # CRÉÉ —  3 tables
└── README.md                      # MODIFIÉ — index, schémas déclarés, relations, classes, piège des 3 chiffres

scripts/
└── verifier.sh                    # MODIFIÉ — P-05 ajoutée, trois planchers relevés, --test-negatif p05

docs/registre-classes-offline.md   # MODIFIÉ — §6.1 (ligne_inventaire) et journal §13
docs/versions-reference.md         # MODIFIÉ — une ligne au journal §6
README.md                          # MODIFIÉ — la troisième porte y est documentée
```

**Aucun des onze fichiers SQL du cycle D1 n'est modifié.** C'est un contrôle du quickstart §5, fait par `git diff --stat`.

### Décision de structure — où les quatre fichiers s'insèrent

**Les préfixes restent à deux chiffres** ([D-14](./research.md)) : en tri lexicographique, `100-` vient **avant** `20-`, et le passage à trois chiffres imposerait de renommer les onze fichiers du D1 pour un bénéfice nul.

| Préfixe | Fichier | Famille de crate | Pourquoi là |
|---|---|---|---|
| `55-` | `ventes` | **`socle/`** | `ventes` est un crate du socle ; le placer après les verticales dirait le contraire à qui lit le répertoire |
| `96-` | `stocks` | `capacites/` | Après tout le socle — l'ordre lexicographique **dit la hiérarchie de dépendance** |
| `97-` | `hebergement` | `verticales/` | Idem |
| `98-` | `pressing` | `verticales/` | Idem |

> **Cet ordre n'est pas une contrainte technique et ne prétend pas l'être.** Aucune clé étrangère ne traverse un schéma : PostgreSQL accepterait n'importe quel ordre. Il est **purement documentaire**, et c'est précisément pourquoi il doit dire la hiérarchie — c'est la seule information qu'il porte.

---

## Ce que le cycle produit, table par table

Le détail complet — colonnes, contraintes nommées, privilèges, index, classe et branche — est dans **[data-model.md](./data-model.md)**.

| Fichier | Tables | Provisions | Points qui demandaient une décision, traités en [research.md](./research.md) |
|---|---|---|---|
| `55-ventes.sql` | 11 | 1 | L'addition **est** une commande ([D-19](./research.md)) · l'immuabilité du lot d'envoi et sa limite ([D-20](./research.md)) · la destination facultative et son repli ([D-21](./research.md)) |
| `96-stocks.sql` | 7 | — | `ligne_inventaire` nommée ici ([D-25](./research.md)) · classe B avec privilège plus strict ([D-24](./research.md)) |
| `97-hebergement.sql` | 26 | 5 | **Deux périodes sur l'occupation** ([D-15](./research.md)) · **contrainte partielle** ([D-16](./research.md)) · **mise hors service = occupation** ([D-17](./research.md)) · `client` spécialise `personne` ([D-18](./research.md)) · l'index de disponibilité ([D-27](./research.md)) |
| `98-pressing.sql` | 3 | — | **Aucune dépendance vers une autre verticale** ([D-28](./research.md)) · le moment de règlement figé à la création |

**Six tables portent deux classes**, et c'est le cas normal ici : `commande`, `ligne_commande`, `unite`, `arrhes`, `ligne_sejour`, `bon_depot`. Le commentaire d'en-tête déclare les deux, avec l'opération de chacune ; les privilèges permettent les deux. **`mouvement_stock` et `inventaire` ne sont pas du nombre** : elles portent une seule classe, B, avec un privilège plus strict qu'elle n'exige — une décision de forme n'est pas une seconde classe.

---

## Livrables attendus — phase 1

*(Les rubriques de phase 2 et de phase 3 sont **sans objet** pour ce cycle et ne sont pas remplies : il ne produit ni écran, ni endpoint, ni migration, ni simulation à supprimer. Elles sont déclarées sans objet, jamais cochées en silence.)*

**Fichiers de `docs/modele-donnees/` créés** : les quatre listés ci-dessus. **Modifié** : `README.md` seul.

**Pour chaque table** : politique RLS dans la forme littérale unique du socle, privilèges de `kaya_app` dérivés de la classe, contraintes nommées, index justifiés par une recherche nommée, classe hors-ligne et code de branche en commentaire d'en-tête — **les deux classes quand il y en a deux**. Tout est détaillé dans [data-model.md](./data-model.md).

**Registre des classes hors-ligne** : **une** entité nommée par ce cycle y entre — `ligne_inventaire` (§6.1) — plus une ligne au journal §13 disant contre quoi le nom a été retenu.

**Ce que le cycle laisse explicitement à la phase 3**, écrit pour ne pas être redécouvert :

| Ce qui reste à faire | Où c'est écrit |
|---|---|
| Le calcul qui pose `periode_indisponibilite` à `periode.fin + temps_remise_en_etat` | [disponibilite.md](./contracts/disponibilite.md) §3 |
| Les contraintes de formule — durée min/max, plages, jours autorisés | [disponibilite.md](./contracts/disponibilite.md) §3 |
| **Insérer et traiter le rejet `23P01`**, jamais lire puis insérer | [disponibilite.md](./contracts/disponibilite.md) §2 |
| La compensation des deux sagas, et le **test du scénario orphelin** (SYN-03) | [sagas-inter-modules.md](./contracts/sagas-inter-modules.md) §3 et §5 |
| La règle « `lot_envoi_id` ne s'écrit qu'une fois » — de service, pas de privilège | [data-model.md](./data-model.md), `55-ventes.sql` |
| Le refus explicite des profils de stock `VALORISE` et `DETAILLE`, et des capacités non implémentées | Socle, cycle D1 |

---

## Suivi de complexité

| Écart | Pourquoi il est nécessaire | Alternative plus simple, et pourquoi elle est écartée |
|---|---|---|
| **Une porte nouvelle, P-05**, alors que la spécification approuvée disait « aucune porte nouvelle » (FR-044, SC-013) | Le plan du cycle D1 a **explicitement désigné ce cycle** comme le moment où elle serait justifiée, cible non vide à l'appui. Le coût du manquement est manifeste et **silencieux** : une clé étrangère ajoutée de bonne foi casse le chemin nominal du conflit le plus fréquent du produit, et rien ne le signale avant la première coupure réseau en exploitation | Laisser le contrôle **humain**, comme le D1 l'a fait pour ce même point. Écartée parce que la cible passe de **zéro** à **onze cibles distinctes et une trentaine de colonnes**, et qu'elle grandira à chaque cycle de phase 3. Un constat daté tient sur une ligne de `compose.yml` ; il ne tient pas sur une trentaine de colonnes qu'un cycle ultérieur pourrait « réparer ». **FR-044, SC-013 et la section « Hors périmètre » sont amendés dans le même changement** — un conflit constaté ne se tranche pas en silence |
| **`occupation` porte deux intervalles** au lieu d'un | Le temps de remise en état doit être **dans** l'intervalle d'indisponibilité (constitution, principe 4) **et** hors de la facturation. Un intervalle unique force un choix, et les deux sont faux | Un seul intervalle plus une colonne de durée : le calcul de chevauchement devrait alors reconstruire l'intervalle réel à chaque requête, et la contrainte d'exclusion ne pourrait plus le protéger — ce qui reviendrait à un verrou applicatif |
| **`ventes` s'intercale à `55-`**, hors du pas de dix | `ventes` est un crate de `socle/` ; le placer après les capacités et les verticales dirait le contraire au lecteur du répertoire | Le placer à `99-` avec les verticales : coûterait la lisibilité de la hiérarchie, seule information que l'ordre porte. Le README du D1 prévoit explicitement l'intercalation — c'est ce que les pas de dix achètent |

---

## Artefacts de conception

- **[research.md](./research.md)** — les quinze décisions du cycle (D-14 à D-28), leur motif et ce qui a été écarté.
- **[data-model.md](./data-model.md)** — les quarante-sept tables, fichier par fichier : colonnes, contraintes, privilèges, index, classe et branche.
- **[contracts/disponibilite.md](./contracts/disponibilite.md)** — ce que la base garantit toute seule, et ce qui reste au `domain` de la phase 3.
- **[contracts/sagas-inter-modules.md](./contracts/sagas-inter-modules.md)** — les deux sagas, leur compensation, et pourquoi le cas orphelin est le chemin nominal.
- **[contracts/verifier-p05.md](./contracts/verifier-p05.md)** — le contrat de la porte nouvelle, son plancher de non-vacuité et son test négatif.
- **[quickstart.md](./quickstart.md)** — appliquer, prouver que le chevauchement est impossible, mesurer, et casser les trois portes.

**Repris intégralement du cycle D1, jamais reformulés** : [conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md) — le contrat que chaque fichier `.sql` honore — et [verifier-cli.md](../001-modele-donnees-socle/contracts/verifier-cli.md) — le contrat de la commande unique, auquel `verifier-p05.md` n'ajoute qu'une porte.
