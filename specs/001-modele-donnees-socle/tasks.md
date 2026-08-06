---

description: "Liste de tâches — cycle D1, modèle de données du socle"
---

# Tâches : Modèle de données du socle (cycle D1)

**Entrée** : documents de conception de `specs/001-modele-donnees-socle/`

**Prérequis** : [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Phase du produit** : **1 — le modèle de données**. Chaque tâche produit ou modifie un fichier de `docs/modele-donnees/` et se termine par la même preuve : **le SQL s'applique sur une base vierge sans erreur, chaque table porte sa politique RLS, chaque entité nommée a sa classe déclarée dans `docs/registre-classes-offline.md`**.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable — fichiers différents, aucune dépendance sur une tâche inachevée
- **[Story]** : le récit de [spec.md](./spec.md) que la tâche sert (US1 à US6)
- Chaque description porte son chemin de fichier exact

---

## Trois précisions avant de commencer

**Aucune tâche d'interface.** Ce cycle ne produit **aucun écran**, donc la règle de référence visuelle du prompt — maquetté, dérivé, composé, découvert à l'implémentation — **est sans objet ici**. `docs/design/derivation.md` n'est ni lu ni modifié par ce cycle, et aucun terme du lexique n'est mobilisé : rien de ce que produit D1 n'est visible par un utilisateur. La règle s'appliquera pleinement dès la phase 2.

**Aucune tâche P1 à reporter en fin de liste.** Le module DAT est **intégralement P0** (`docs/user-stories-v1.md` §0.2 et module DAT) : DAT-01, DAT-02 et DAT-03 conditionnent la livraison de la phase 1. L'ordre suit donc les priorités **P1 → P3 des récits de la spécification**, qui sont une échelle différente — P1 y désigne le plus critique.

**La preuve de fin de tâche est mécanique dès la phase 2 des tâches.** `scripts/verifier.sh` est construit **avant** les fichiers de schéma, précisément pour que chaque tâche de schéma puisse se terminer par une commande verte plutôt que par une relecture.

---

## Phase 1 : Mise en place

**Objet** : de quoi lancer une base vierge et y appliquer du SQL. Rien d'autre.

- [X] T001 Créer `compose.yml` à la racine avec le service `postgres_verification` — image **`postgres:18.4`** (tag exact du §4.2 de `docs/versions-reference.md`, **jamais `latest`**), données en `tmpfs`, port non exposé par défaut, variables d'environnement de la base de vérification
- [X] T002 Mettre à jour `docs/versions-reference.md` **dans le même changement que T001** : §4.1 — retirer l'avertissement « aucun de ces fichiers n'existe encore » pour la ligne `compose.yml` ; §6 — une ligne au journal, première matérialisation de `postgres:18.4`, valeur reprise du §2 **sans revérification**
- [X] T003 [P] Créer les répertoires `docs/modele-donnees/` et `scripts/`, avec un `docs/modele-donnees/README.md` réduit à la liste ordonnée des fichiers attendus — c'est cette liste que P-01 confrontera aux schémas trouvés dans la base

**Point de contrôle** : `docker compose up -d postgres_verification` démarre une base vierge, `docker compose down -v` la détruit sans laisser de volume.

---

## Phase 2 : Fondations (prérequis bloquants)

**Objet** : le patron que les soixante et onze tables recopieront, et **les deux portes qui serviront de critère de fin à chaque tâche suivante**.

**⚠️ Aucune tâche de schéma ne commence avant la fin de cette phase.**

- [X] T004 Écrire la première moitié de `docs/modele-donnees/00-conventions.sql` : rôles `kaya_owner` et `kaya_app` en forme idempotente (`DO $$ … IF NOT EXISTS`), extension `btree_gist`, et les trois domaines partagés `montant_mineur` (`BIGINT`), `code_devise` (`CHAR(3)` avec `ck_code_devise_iso4217`), `quantite` (`NUMERIC`)
- [X] T005 Écrire la seconde moitié de `docs/modele-donnees/00-conventions.sql` : le **tronc commun commenté** dans ses **deux variantes** — « écriture » (`id UUID PRIMARY KEY` **sans aucun `DEFAULT`** · `tenant_id UUID NOT NULL` · `horodatage_client TIMESTAMPTZ NULL`, indicatif · `cree_le TIMESTAMPTZ NOT NULL DEFAULT now()`, **autorité serveur**) et « référentiel » (sans `horodatage_client`, avec `modifie_le`) — plus la règle de tri `ORDER BY cree_le DESC, id DESC` et les **trois exemptions limitativement énumérées** de `horodatage_client` ; le **patron RLS commenté** (les quatre instructions et les quatre motifs de [contracts/conventions-sql.md](./contracts/conventions-sql.md) §5) ; les **conventions de nommage** (`pk_` `fk_` `uq_` `ck_` `ix_`, politiques `isolation_tenant` et `administration_editeur`) ; les **trois pièges de migration** (§7 du contrat) et les **trois conventions opposables au cycle D2** (A3, A4, A5 — §8 du contrat)

> **Le tronc commun est écrit ici, une seule fois, et c'est le point de cette tâche.** Sans lui, chacune des neuf tâches de schéma le rederiverait de mémoire — et c'est ainsi qu'une table finit avec `DEFAULT gen_random_uuid()` sur sa clé primaire, ce qui rend le rejeu **destructeur** au lieu d'inoffensif. FR-015 et FR-016 ne reposent sur rien d'autre.
- [X] T006 Écrire le squelette de `scripts/verifier.sh` : usage et `--aide`, **codes de sortie 0/1/2/3/4**, contrôle de présence de `docker compose`, `trap` de destruction en sortie normale **et** en échec **et** à l'interruption, démarrage de la base, attente sur `pg_isready`, application de `docs/modele-donnees/*.sql` **triée** avec `psql -v ON_ERROR_STOP=1` fichier par fichier, et impression de la durée totale
- [X] T007 Écrire la porte **P-01** dans `scripts/verifier.sh` : les trois contrôles de [contracts/verifier-cli.md](./contracts/verifier-cli.md) §4 — colonne `tenant_id NOT NULL` · `relrowsecurity` **et** `relforcerowsecurity` · politique `isolation_tenant` dont `qual` **et** `with_check` sont non nuls et portent le second argument `true` de `current_setting` — plus l'impression du périmètre inspecté et la comparaison des schémas trouvés à ceux déclarés au README du modèle
- [X] T008 Écrire la porte **P-02** dans `scripts/verifier.sh` : extraction des identifiants entre accents graves de `docs/registre-classes-offline.md`, troncature au premier point, minuscules, dédoublonnage ; comparaison **table → registre** ; échec listant **toutes** les tables non déclarées ; les deux planchers de non-vacuité, **posés provisoirement à 1** et portés à leur valeur définitive en T032

**Point de contrôle** : `scripts/verifier.sh` s'exécute sur un modèle réduit à `00-conventions.sql` et sort **vert** — zéro table inspectée, plancher provisoire atteint. C'est le seul moment du cycle où un vert ne prouve rien, et c'est pourquoi T027 existe.

---

## Phase 3 : Récit 1 — Le socle s'applique sur une base vierge (Priorité : P1) 🎯 MVP

**But** : les neuf fichiers de schéma opérationnels, 57 tables, applicables dans l'ordre sur une base vierge.

**Test indépendant** : `scripts/verifier.sh --porte p01` sort vert, et le nombre de tables inspectées croît d'une tâche à l'autre.

**Fin de tâche, identique pour les neuf** : le SQL s'applique sur une base vierge sans erreur · chaque table porte `ENABLE` + `FORCE` + `isolation_tenant` + `administration_editeur` · chaque table porte son commentaire d'en-tête (classe, branche, story) · chaque entité **nommée par ce cycle** est déclarée à `docs/registre-classes-offline.md` · `scripts/verifier.sh` est **vert**.

- [X] T009 [P] [US1] Écrire `docs/modele-donnees/10-etablissements.sql` — les 13 tables opérationnelles : `tenant` (avec `ck_tenant_auto_reference`), `etablissement`, `module_activite`, `capacite`, `profil_stock`, `module_capacite`, `etablissement_module`, `point_de_vente` (identifiant de caisse **sans FK**, commenté), `table_pdv`, `parametre_catalogue`, `parametre_configuration` (+ `ix_parametre_configuration_resolution`), `branding`, `note_etablissement` (**`SELECT, INSERT`** seuls). Détail en [data-model.md](./data-model.md) §2
- [X] T010 [US1] Écrire `docs/modele-donnees/20-comptes.sql` — les 10 tables opérationnelles : `personne` (+ les quatre index de SC-009 et de la purge TRX-06), `compte`, `methode_authentification`, `role`, `permission`, `role_permission`, `compte_role` (**avec `etablissement_id`**, sans FK), `appareil_enrole` (l'attestation est **deux colonnes**, pas une table), `journal_audit` (**`SELECT, INSERT`**), **★ `releve_position`** — et **inscrire `releve_position` au registre §5.2** (A · A4). Détail en [data-model.md](./data-model.md) §3
- [X] T011 [US1] Écrire `docs/modele-donnees/30-caisse.sql` — les 9 tables opérationnelles : `caisse`, `shift` (+ `uq_shift_caisse_ouvert`, index unique partiel), `encaissement` (**deux classes déclarées au commentaire d'en-tête**, B en espèces / D en Mobile Money), `sortie_de_caisse`, `comptage`, **★ `coupure_comptee`**, `ecart_de_caisse`, `cloture_shift`, `cloture_journaliere` — et **inscrire `coupure_comptee` au registre §5.3** (B · B3). Détail en [data-model.md](./data-model.md) §4
- [X] T012 [P] [US1] Écrire `docs/modele-donnees/40-fiscalite.sql` — les 8 tables opérationnelles : `parametrage_fiscal` (**des paramètres datés, jamais un calcul**), `cle_fne` (colonnes de coffre chiffré, chiffrement applicatif), `document_fiscal`, `item_certifie` (**`id_item_dgi` — la colonne dont l'oubli serait irrattrapable**), `avoir`, `file_certification` (cinq états, `INDETERMINEE` comprise), `compteur_stickers` (**compteur en table**), `etat_reversement_communal`. Détail en [data-model.md](./data-model.md) §5
- [X] T013 [P] [US1] Écrire `docs/modele-donnees/50-documents.sql` — `document_operationnel` (**deux classes** : A en brouillon, B à l'émission numérotée), `numerotation_document` (**compteur en table à verrou de ligne, jamais une `SEQUENCE`** — le commentaire d'en-tête le dit), `modele_document`. Détail en [data-model.md](./data-model.md) §6
- [X] T014 [US1] Écrire `docs/modele-donnees/60-synchronisation.sql` — `evenement_outbox` (**`SELECT, INSERT` seuls**, séquence monotone par établissement, charge utile financière complète et dénormalisée), **★ `publication_outbox`** (la publication est un **fait ajouté**, jamais un `UPDATE`), `reconciliation_orpheline` (**jamais `UPDATE`** — le privilège absent prouve que la résolution B n'est pas implémentée) — et **inscrire `publication_outbox` au registre §5.6** (A · A4). Détail en [data-model.md](./data-model.md) §7
- [X] T015 [P] [US1] Écrire `docs/modele-donnees/70-pilotage.sql` — `alerte_configurable`, plus le **commentaire de tête du fichier** disant ce qui n'a délibérément aucune table : tableaux de bord, KPI, recettes par service, rapports périodiques et consultation du journal d'audit sont **dérivés**, et leur donner une table serait dupliquer une vérité qui existe déjà. Détail en [data-model.md](./data-model.md) §8
- [X] T016 [US1] Écrire `docs/modele-donnees/80-editeur.sql` — `plan`, `palier`, `abonnement`, `unite_facturable` (**métrique abstraite** : `verticale_code` dit qui compte, `metrique` dit ce qu'on compte — jamais « chambre » en dur), `telemetrie_parc`, `bundle_diagnostic`, **★ `encaissement_abonnement`**, **★ `evenement_webhook_paiement`** (l'idempotence est portée par `uq_evenement_webhook_identifiant`, **une contrainte, pas du code**) — et **inscrire les deux au registre §5.8** (D · D1). Détail en [data-model.md](./data-model.md) §9
- [X] T017 [P] [US1] Écrire `docs/modele-donnees/90-metriques.sql` — `evenement_metrique` (**l'idempotence par UUID n'a pas besoin d'une seconde colonne** : l'identifiant vient du client, un lot renvoyé trois fois entre trois fois en conflit de clé primaire), `agregat_quotidien` (un recalcul est **une nouvelle ligne**). Détail en [data-model.md](./data-model.md) §10

**Point de contrôle** : 57 tables appliquées, `scripts/verifier.sh` vert. Le socle opérationnel du MVP existe en SQL — **c'est le MVP de ce cycle**, et la phase 2 du produit pourrait déjà donner à ses données simulées la forme de ces tables.

> **Pourquoi T010, T011, T014 et T016 ne portent pas `[P]`** : elles modifient toutes `docs/registre-classes-offline.md`. Elles s'exécutent dans n'importe quel ordre, mais **jamais simultanément**.

---

## Phase 4 : Récit 2 — Chaque table prouve son isolation multi-tenant (Priorité : P1)

**But** : que l'isolation soit **constatée sur les soixante et onze tables**, pas seulement écrite dans chacune.

**Test indépendant** : `scripts/verifier.sh --porte p01` déclare son périmètre, atteint son plancher définitif, et rend `71/71` sur les trois contrôles.

- [X] T018 [US2] Étendre le contrôle 3 de P-01 dans `scripts/verifier.sh` : exiger **aussi** la politique `administration_editeur … FOR ALL TO kaya_owner` sur chaque table. Son absence ne se voit sur aucun écran et fait **réussir en n'écrivant rien** toute migration de peuplement de la phase 3 — c'est le défaut le plus silencieux du modèle
- [X] T019 [US2] Revue de conformité RLS sur les onze fichiers de `docs/modele-donnees/*.sql` : vérifier que **l'expression de politique est strictement identique partout**, mot pour mot. Une variante d'écriture obligerait P-01 à accepter deux formes, et une porte qui en accepte deux en acceptera trois

**Point de contrôle** : aucune table du modèle ne peut plus être lue, insérée ou modifiée hors du contexte de son tenant, y compris par le propriétaire des tables.

---

## Phase 5 : Récit 3 — Les privilèges disent la classe hors-ligne (Priorité : P2)

**But** : qu'on puisse lire les `GRANT` d'une table et en déduire sa classe **sans lire un seul commentaire**.

**Test indépendant** : parcourir les privilèges de `kaya_app` table par table et retrouver la matrice de [contracts/conventions-sql.md](./contracts/conventions-sql.md) §3 sans exception.

- [X] T020 [US3] Audit des privilèges sur les neuf fichiers de schéma de `docs/modele-donnees/` (`10-` à `90-`) : confronter chaque `GRANT` à la matrice du contrat et à la classe déclarée au registre. Points à vérifier nommément — `evenement_outbox`, `publication_outbox`, `journal_audit`, `releve_position`, `note_etablissement`, `etat_reversement_communal`, `evenement_metrique`, `agregat_quotidien`, `item_certifie`, `avoir`, `telemetrie_parc`, `bundle_diagnostic` et `evenement_webhook_paiement` n'ont **ni `UPDATE` ni `DELETE`** · `reconciliation_orpheline` n'a **pas `UPDATE`** · **aucune table ne reçoit `DELETE`** · **aucun `GRANT … ON ALL TABLES IN SCHEMA`** nulle part. Dans la même passe, vérifier que **chaque index porte son commentaire d'usage** nommant la recherche qu'il sert (FR-025) — un index sans usage nommé se retire plutôt que de se justifier après coup
- [X] T021 [US3] Compléter `docs/registre-classes-offline.md` : le **journal §13** reçoit une ligne par nom posé par ce cycle (`releve_position`, `coupure_comptee`, `publication_outbox`, `encaissement_abonnement`, `evenement_webhook_paiement`) et par **décision de nommage arbitrée** — pourquoi l'attestation d'intégrité n'a pas de table, pourquoi l'ouverture de tiroir est une entrée du journal d'audit, pourquoi la publication de l'outbox est une table. **Jamais un décompte de tables ni un état d'avancement** (registre §13)

**Point de contrôle** : la classe de chaque entité est portée par trois choses concordantes — le registre, le commentaire d'en-tête, et le privilège. La troisième est la seule qui se vérifie.

---

## Phase 6 : Récit 4 — La commande unique et ses deux portes (Priorité : P2)

**But** : deux portes dont on a **constaté** qu'elles savent échouer.

**Test indépendant** : lancer les deux tests négatifs et voir chacune sortir rouge en nommant la cause ; `git status` reste propre après coup.

- [X] T022 [US4] Implémenter `scripts/verifier.sh --test-negatif p01` : copier `docs/modele-donnees/` dans un répertoire temporaire, **retirer une instruction `CREATE POLICY isolation_tenant`**, relancer la porte sur la copie, **exiger** qu'elle sorte rouge **en nommant la table**. Si elle passe au vert, sortie **`4`**
- [ ] T023 [US4] Implémenter `scripts/verifier.sh --test-negatif p02` : ajouter dans la copie de travail une table `zzz_table_non_declaree` **portant son tronc commun et sa RLS complète** — sans quoi l'échec viendrait de P-01 et l'on croirait avoir prouvé P-02 alors qu'on aurait prouvé P-01 une seconde fois — relancer, **exiger** l'échec nominatif, sinon sortie **`4`**
- [ ] T024 [US4] Compléter le contrat de porte sur les deux portes : impression du **périmètre inspecté**, vérification de **complétude** (schémas base ↔ README pour P-01, extraction du registre effectivement rendue pour P-02), garantie de **non-modification** de ce qui est inspecté, et le format de sortie de [contracts/verifier-cli.md](./contracts/verifier-cli.md) §3. **Les valeurs des planchers ne sont pas fixées ici** — elles le sont en T032, quand le modèle est complet
- [ ] T025 [US4] Vérifier qu'**aucun fichier n'existe sous `.github/workflows/`** et que `scripts/verifier.sh` ne suppose ni variable d'environnement d'intégration continue, ni chemin absolu, ni jeton — il sera lancé **sans être modifié** par le serveur, en phase 3

**Point de contrôle** : les deux portes ont chacune été rouges au moins une fois, volontairement. *Une porte qui ne trouve jamais rien est indistinguable d'une porte qui n'a rien à trouver.*

---

## Phase 7 : Récit 5 — Les provisions existent en table, et nulle part ailleurs (Priorité : P3)

**But** : les quatorze provisions du cadrage §14 et du registre §10 qui relèvent du socle, **tables seulement, aucune logique**.

**Test indépendant** : chercher chaque provision du registre §10 relevant du socle et la trouver ; lire ses privilèges et constater qu'on ne peut rien bâtir dessus.

- [ ] T026 [P] [US5] Ajouter les 6 provisions à `docs/modele-donnees/10-etablissements.sql` : **`partenaire`** avec `tenant_id` **NOT NULL** (l'isolation) **et** `tenant_partenaire_id` **NULLABLE** (le compte Kaya du partenaire — décision [D-02](./research.md)), `demande_partenaire`, `compte_compensation`, `mouvement_compensation`, **`convention_inter_etablissements` sans aucun `GRANT`** (remplacée par `partenaire`, amendement A12 — l'absence de privilège dit qu'elle n'est pas la voie retenue), `dispositif` (contrôle d'accès, canal hors ligne obligatoire au commentaire)
- [ ] T027 [P] [US5] Ajouter les provisions des trois autres schémas : `employe` dans `20-comptes.sql` (**jamais confondu avec `compte`** — CPT-00), `compte_client` / `encours` / `condition_reglement` dans `30-caisse.sql`, `devis` / `document_commercial` dans `40-fiscalite.sql`, et la colonne **`rne_ref` nullable** sur `item_certifie` plus `canal_emission` sur `document_fiscal` (provision RNE, cadrage §9.8)
- [ ] T028 [P] [US5] Créer `docs/modele-donnees/95-comptabilite.sql` — schéma `comptabilite`, `mapping_comptable` et `exercice_comptable`, `SELECT` seul. **C'est le seul écart à la liste de fichiers de l'entrée**, justifié en [research.md](./research.md) §D-01 : les loger ailleurs imposerait un déplacement inter-schéma le jour où le crate comptable naîtra

**Point de contrôle** : 71 tables. Toute provision du socle a sa table, aucune n'a de logique, et **aucune ne pourra en recevoir sans qu'un `GRANT` change** — ce qui se voit dans un diff.

---

## Phase 8 : Récit 6 — L'index qui se tient à jour (Priorité : P3)

**But** : qu'on sache ce que contient le modèle **sans ouvrir un fichier SQL**, et que la règle qui l'empêche de se périmer soit écrite.

**Test indépendant** : ouvrir le README du modèle et y retrouver chaque table avec sa classe, l'ordre d'application, et la règle de tenue.

- [ ] T029 [US6] Écrire `docs/modele-donnees/README.md` : l'**index des onze fichiers et leur ordre d'application** (porté par le préfixe numérique — décision [D-07](./research.md)), le **schéma des relations principales en texte**, et la **liste des 71 tables avec leur classe hors-ligne**
- [ ] T030 [US6] Ajouter au même README la **règle de tenue** : *toute migration de phase 3 met à jour le fichier de son schéma dans le même changement, et un test compare le schéma réel aux fichiers et échoue sur tout écart* — plus le motif, à écrire : *une source de vérité périmée est pire que pas de source du tout, parce qu'on continue de la croire*
- [ ] T031 [US6] Documenter **la commande unique** dans le `README.md` du dépôt : `scripts/verifier.sh`, ce que chaque porte vérifie, et les deux modes `--test-negatif`. Une commande non documentée est une commande qu'on relance de mémoire, donc mal

**Point de contrôle** : le modèle se lit et se tient. La règle qui l'empêche de dériver existe avant la première migration, ce qui est le seul moment où elle est gratuite.

---

## Phase 9 : Finition et mesures

**Objet** : porter les planchers à leur valeur définitive, mesurer ce qui doit l'être, et clore le cycle.

- [ ] T032 Porter les **planchers de non-vacuité** de P-01 et P-02 à leur valeur définitive dans `scripts/verifier.sh` — **60 tables** minimum côté P-01 ; **60 tables et 140 entités** côté P-02 — et vérifier qu'un modèle amputé de la moitié de ses fichiers fait échouer la porte. Le plancher provisoire de T008 disparaît ici

> **Pourquoi 140 et non 80.** L'essai à blanc de l'extraction rend **165 entités** sur le registre actuel. Un plancher à 80 laisserait passer une extraction à moitié cassée — la moitié restante suffirait à couvrir les 71 tables, et la porte serait verte en ne comparant plus rien. C'est exactement le mode de défaillance qu'un plancher existe pour refuser.
- [ ] T033 [P] Mesurer **SC-009** hors du script : appliquer le modèle sur une base locale non éphémère, générer 10 000 lignes de `comptes.personne`, `EXPLAIN ANALYZE` sur les trois recherches (préfixe de `nom_normalise` · `telephone_e164` · `type_piece` + `numero_piece`), consigner les temps et les plans dans le rapport de cycle. **Attendu : moins de 300 ms et un parcours d'index sur les trois.** Si la recherche par nom échoue sur un cas **infixe** réel, le signaler — `pg_trgm` s'ajoutera sans migration de données, et pas avant ([D-13](./research.md))
- [ ] T034 [P] Mesurer la **durée totale** de `scripts/verifier.sh` et la consigner. **Attendu : moins de deux minutes** (SC-008). Au-delà, on cesse de lancer un script — c'est le déclencheur documenté du passage au serveur d'intégration, en phase 3
- [ ] T035 Dérouler [quickstart.md](./quickstart.md) de bout en bout, dans l'ordre, sur un dépôt propre : la commande unique, les deux tests négatifs, le contrôle du sens de P-02 (plus d'entités extraites que de tables réelles), et `git status` propre après chaque test négatif
- [ ] T036 Vérifier les douze critères de réussite de [spec.md](./spec.md) un par un et consigner le verdict de chacun, plus **deux constats qu'aucun critère ne porte**. Les cinq qui ne sont vérifiés par **aucune porte** et se constatent ici, une fois, par écrit : **SC-004** (zéro clé étrangère entre deux schémas de modules, par requête sur `pg_constraint`) · **SC-010** (zéro montant en flottant, zéro quantité en entier) · **SC-011** (zéro colonne d'identifiant avec valeur par défaut) · **aucune `SEQUENCE` créée dans le modèle** (FR-023 — la règle est écrite trois fois, elle n'était contrôlée nulle part) · **`compose.yml` porte un tag exact, jamais `latest`** — c'est la contrepartie écrite du report de la porte P-03, et la seule chose qui couvre ce fichier d'ici au cycle du premier manifeste
- [ ] T037 **Revue de la *Definition of Done*** (`docs/user-stories-v1.md` §0.4), point par point. Les points 2, 3, 6, 8, 10, 12 et 13 relèvent des phases 2 et 3 du produit et se déclarent **« sans objet »**, **jamais cochés en silence**. Les points qui s'appliquent : 1 (critères couverts), 4 (RLS activée et forcée sur toute nouvelle table), 5 (classe hors-ligne déclarée), 7 (i18n — **sans objet**, aucune chaîne utilisateur), 9 (paramètres exposés en configuration — les clés du catalogue existent), 11 (`docs/modele-donnees/` est **le livrable**), 14 (`scripts/verifier.sh` passe en une commande et **toute porte ajoutée a son test négatif**)

---

## Dépendances et ordre d'exécution

### Dépendances entre phases

- **Phase 1 — Mise en place** : aucune dépendance
- **Phase 2 — Fondations** : dépend de la phase 1. **Bloque tout le reste** : les domaines partagés de `00-conventions.sql` sont employés par chaque table, et les deux portes sont le critère de fin de chaque tâche suivante
- **Phase 3 — Récit 1** : dépend de la phase 2. Neuf tâches largement parallélisables
- **Phase 4 — Récit 2** : dépend de la phase 3 — elle constate sur les tables écrites
- **Phase 5 — Récit 3** : dépend de la phase 3, indépendante de la phase 4
- **Phase 6 — Récit 4** : dépend de la phase 2 seulement pour l'écriture des tests négatifs, mais **le test négatif de P-01 exige au moins un fichier de schéma** — donc après T009
- **Phase 7 — Récit 5** : dépend de la phase 3 pour les trois fichiers qu'elle complète ; T028 est indépendante
- **Phase 8 — Récit 6** : dépend des phases 3 et 7 — le README liste les 71 tables
- **Phase 9 — Finition** : dépend de tout

### Ce qui rend chaque récit indépendamment vérifiable

| Récit | Comment on le vérifie seul |
|---|---|
| **US1** (P1) | `scripts/verifier.sh --porte p01` sort vert, 57 tables inspectées |
| **US2** (P1) | Les trois contrôles rendent `71/71`, plancher définitif atteint |
| **US3** (P2) | La matrice de privilèges se retrouve table par table, sans exception |
| **US4** (P2) | Les deux tests négatifs sortent rouges en nommant leur cause ; `git status` propre |
| **US5** (P3) | Chaque provision du registre §10 relevant du socle a sa table et des privilèges restreints |
| **US6** (P3) | Le README rend chaque table avec sa classe, et porte la règle de tenue |

### Occasions de parallélisme

- **T003** en parallèle de T001/T002
- **T009, T012, T013, T015, T017** en parallèle — cinq fichiers distincts, aucun ne touche le registre
- **T010, T011, T014, T016** dans n'importe quel ordre mais **jamais simultanément** — elles modifient toutes `docs/registre-classes-offline.md`
- **T026, T027, T028** en parallèle — T028 crée un fichier neuf, les deux autres complètent des fichiers déjà écrits et distincts
- **T033, T034** en parallèle — deux mesures indépendantes

### Exemple d'exécution parallèle — phase 3

```bash
# Les cinq fichiers qui ne touchent pas le registre, ensemble :
Tâche : "Écrire docs/modele-donnees/10-etablissements.sql — 13 tables opérationnelles"
Tâche : "Écrire docs/modele-donnees/40-fiscalite.sql — 8 tables opérationnelles"
Tâche : "Écrire docs/modele-donnees/50-documents.sql — 3 tables"
Tâche : "Écrire docs/modele-donnees/70-pilotage.sql — 1 table + le commentaire du dérivé"
Tâche : "Écrire docs/modele-donnees/90-metriques.sql — 2 tables"

# Puis les quatre qui inscrivent au registre, une à la fois :
Tâche : "Écrire 20-comptes.sql + inscrire releve_position au registre §5.2"
```

---

## Stratégie de mise en œuvre

### Le plus petit livrable utile — phases 1 à 3

1. Phase 1 : de quoi lancer une base vierge
2. Phase 2 : le patron et les deux portes — **critique, bloque tout**
3. Phase 3 : les 57 tables opérationnelles
4. **S'arrêter et valider** : `scripts/verifier.sh` vert sur 57 tables
5. À ce point, la phase 2 du produit peut déjà donner à ses données simulées **la forme exacte des tables réelles** — ce qui est la raison d'être de l'ordre des trois phases

### Livraison incrémentale

1. Phases 1 + 2 → le patron existe, les portes tournent
2. Phase 3 → le socle opérationnel est en SQL (**MVP du cycle**)
3. Phases 4 + 5 → l'isolation et les classes sont **prouvées**, plus seulement écrites
4. Phase 6 → les portes ont été rouges une fois, volontairement
5. Phase 7 → les provisions sont posées, au seul moment où elles coûtent zéro
6. Phases 8 + 9 → le modèle se lit, se tient, et les mesures sont consignées

### Ce qui n'est pas dans cette liste, et qui est délibéré

- **Aucune migration sqlx**, aucun `Cargo.toml`, aucun `package.json`, aucun fichier Rust ou TypeScript.
- **Aucun écran, aucune donnée simulée, aucun terme de lexique** — ce cycle ne produit rien de visible par un utilisateur.
- **Aucun workflow GitHub Actions.** Le serveur de CI vient en phase 3 et **lancera ce script sans le modifier**.
- **Aucune porte au-delà de P-01 et P-02.** P-03 est différée au cycle qui crée le premier manifeste de dépendances, avec l'exposition résiduelle écrite dans [plan.md](./plan.md) — un fichier, une ligne.

---

## Notes

- `[P]` = fichiers différents, aucune dépendance sur une tâche inachevée
- Chaque tâche de schéma se termine par `scripts/verifier.sh` **vert** — l'agent le lance, et ne rapporte pas une tâche comme terminée si le script est rouge (constitution, flux de travail)
- Commiter après chaque tâche ou groupe logique
- **Ce que ces tâches ne prouveront jamais** : la **justesse** d'une classe. Aucune lecture du schéma ne retrouve qu'un encaissement est B en espèces et D en Mobile Money. C'est le seul point du modèle qui demande un jugement humain, et c'est pourquoi l'arbre de décision du registre §3 est court et ses branches nommées
