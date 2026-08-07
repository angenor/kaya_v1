---

description: "Liste de tâches — cycle D2, modèle de données des capacités et des verticales"
---

# Tâches : Modèle de données des capacités et des verticales (cycle D2)

**Entrée** : documents de conception de `specs/002-modele-donnees-verticales/`

**Prérequis** : [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Phase du produit** : **1 — le modèle de données**, second et dernier cycle. Chaque tâche produit ou modifie un fichier de `docs/modele-donnees/` et se termine par la même preuve : **le SQL s'applique sur une base vierge sans erreur, chaque table porte sa politique RLS, chaque entité nommée a sa classe déclarée dans `docs/registre-classes-offline.md`**.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable — fichiers différents, aucune dépendance sur une tâche inachevée
- **[Story]** : le récit de [spec.md](./spec.md) que la tâche sert (US1 à US7)
- Chaque description porte son chemin de fichier exact

---

## Cinq précisions avant de commencer

**Aucune tâche d'interface.** Ce cycle ne produit **aucun écran**, donc la règle de référence visuelle du prompt — maquetté, dérivé, composé, découvert à l'implémentation — **est sans objet ici**. `docs/design/derivation.md` n'est ni lu ni modifié, `docs/design/lexique.md` non plus : **rien de ce que produit D2 n'est visible par un utilisateur**. La règle s'appliquera pleinement dès la phase 2 du produit, et le cycle F3 sera le premier à montrer une occupation à l'écran.

**Aucune tâche P1 à reporter en fin de liste.** Le module DAT est **intégralement P0** (`docs/user-stories-v1.md` §0.2) : DAT-01 et DAT-03 conditionnent la livraison de la phase 1. L'ordre suit donc les priorités **P1 → P3 des récits de la spécification**, qui sont une échelle différente — P1 y désigne le plus critique.

**La porte P-05 est écrite AVANT le premier fichier de schéma, et c'est délibéré.** Chaque tâche de schéma se termine par `scripts/verifier.sh` **vert**. Si P-05 arrivait après, une clé étrangère inter-schémas écrite par mégarde en T010 ne serait découverte qu'en fin de cycle — c'est-à-dire au moment où la corriger coûte le plus. **Une porte écrite après le défaut qu'elle prévient est une porte qui arrive en retard.**

**Les deux listes du README du modèle ne se tiennent pas au même rythme, et P-01 ne lit que l'une des deux.** Le **tableau de l'ordre d'application** énumère les fichiers et peut annoncer ce qui vient — c'est T001. La liste **`## Schémas déclarés`** est **opposable** : P-01 la confronte au catalogue **dans les deux sens**, et un schéma déclaré-mais-absent la fait sortir rouge. Elle grandit donc **dans la tâche qui crée le fichier du schéma** — T004, T007, T008, T012 —, ce qui est la règle de tenue déjà écrite au README du cycle D1.

**T002, en revanche, doit précéder tout le reste** : P-02 exige qu'une table réelle ait sa classe au registre, et `96-stocks.sql` crée `ligne_inventaire`. Sans T002, T007 sortirait rouge pour une raison qui n'a rien à voir avec elle.

---

## Phase 1 : Mise en place

**Objet** : que les portes existantes acceptent les tables à venir. Rien d'autre — le socle, `compose.yml`, `00-conventions.sql` et `scripts/verifier.sh` existent depuis le cycle D1.

- [ ] T001 Ajouter au **tableau de l'ordre d'application** de `docs/modele-donnees/README.md` les quatre lignes des fichiers à venir, avec leur préfixe définitif (`55-`, `96-`, `97-`, `98-`) et leur famille de crate. **NE PAS toucher à la liste `## Schémas déclarés`** : elle est la **liste opposable** que P-01 confronte au catalogue, et y inscrire un schéma qui n'existe pas encore ferait sortir la porte **rouge** avec le message « DÉCLARÉ SANS ÊTRE CRÉÉ ». Chaque schéma s'y ajoute **dans la tâche qui crée son fichier** — T004, T007, T008, T012 — ce qui est la règle de tenue écrite au README du cycle D1 : *« cette liste dit ce que le modèle CONTIENT, jamais ce qu'il contiendra »*
- [ ] T002 [P] Inscrire **★ `ligne_inventaire`** au registre `docs/registre-classes-offline.md` §6.1 — **B · B3**, story STK-03 — plus sa ligne au journal §13 disant contre quoi le nom a été retenu (`comptage_article` et `ligne_comptage` : `comptage` est **déjà pris au socle** par `caisse.comptage`, et P-02 compare sur le **nom nu**, pas sur `schema.table` — deux homonymes passeraient avec une seule déclaration). C'est **la seule entité que ce cycle nomme** ; toutes les autres sont déjà au registre et sont honorées telles quelles

**Point de contrôle** : `scripts/verifier.sh` **toujours vert** sur les 71 tables du socle — le tableau de l'ordre d'application annonce quinze fichiers, la **liste opposable** en déclare toujours dix, et c'est elle seule que P-01 confronte au catalogue.

> **Ces deux listes du README ne sont pas de même nature, et les confondre rend P-01 soit aveugle, soit rouge en permanence** — le README du cycle D1 le dit déjà en toutes lettres. Le tableau **énumère les fichiers** et peut annoncer ce qui vient ; la liste `## Schémas déclarés` est **opposable** et ne dit que ce qui existe.

---

## Phase 2 : Fondations (prérequis bloquant)

**Objet** : la porte qui servira de critère de fin à **toutes** les tâches de schéma suivantes.

**⚠️ Aucune tâche de schéma ne commence avant la fin de cette phase.**

- [ ] T003 Écrire la porte **P-05** dans `scripts/verifier.sh` — *aucune clé étrangère entre deux schémas* — selon [contracts/verifier-p05.md](./contracts/verifier-p05.md) : requête sur `pg_constraint` filtrant `contype = 'f'` et comparant les `relnamespace` des deux tables ; **réutilisation de la base montée par P-01**, jamais un second conteneur ; impression du périmètre (schémas inspectés **et nombre de contraintes examinées**) ; comparaison des schémas à la liste opposable du README — **la même que P-01, jamais une seconde liste** ; **plancher de non-vacuité posé provisoirement à 1**, porté à sa valeur définitive en T024 ; sortie nommant **la contrainte, la table portante et la table référencée** en cas d'échec

> **P-05 cherche une ABSENCE, et c'est le pire profil de porte qui soit.** Elle est verte quand elle ne trouve rien — donc une requête mal écrite, un nom de catalogue changé ou un filtre trop large la laisseraient verte pour toujours. **Le plancher de contraintes examinées est ce qui distingue « rien à trouver » de « je ne cherche plus »**, et c'est pourquoi le point 4 du contrat de porte compte ici plus qu'ailleurs.

**Point de contrôle** : `scripts/verifier.sh` sort vert avec **trois** portes sur les 71 tables du socle, et P-05 déclare avoir examiné les clés étrangères internes du socle — **une cible déjà non vide avant qu'un seul fichier de D2 n'existe**. Son test négatif viendra en T016, quand les deux sagas existeront : *il doit rejouer l'erreur réelle, pas une erreur de laboratoire*.

---

## Phase 3 : Récit 1 — Le chevauchement devient impossible au niveau de la base (Priorité : P1) 🎯 MVP

**But** : la décision la plus structurante et la plus irréversible du produit, posée et **constatée**.

**Test indépendant** : deux transactions concurrentes sur des intervalles chevauchants — une seule réussit, refusée par la base et non par un verrou applicatif.

**Fin de tâche, identique pour toutes les tâches de schéma du cycle** : le SQL s'applique sur une base vierge sans erreur · chaque table porte `ENABLE` + `FORCE` + `isolation_tenant` + `administration_editeur` dans la **forme littérale unique** du socle · chaque table porte son commentaire d'en-tête (classe, branche, story, **les deux classes quand il y en a deux**) · chaque table porte le **tronc commun** de sa classe — `id UUID` **sans `DEFAULT`**, `tenant_id NOT NULL`, `cree_le` d'autorité, et `horodatage_client` **seulement** sur les tables qu'un terminal écrit (FR-035) · `scripts/verifier.sh` est **vert sur ses trois portes**.

- [ ] T004 [US1] Créer `docs/modele-donnees/97-hebergement.sql` avec son en-tête de fichier et les **7 tables de référentiel** : `categorie`, `unite` (**pas de colonne de statut d'occupation — il est dérivé** ; `statut_menage` en **A · A4**, dernier-écrit-gagne, seul cas du produit), `formule` (`assujettie_taxe_nuitee` et `regle_conversion_taxe` en **paramètres, jamais en constantes**), **`temps_remise_en_etat` avec `uq_temps_remise_categorie_formule`** — l'unicité porte sur le **couple**, ce qu'une colonne ne porterait pas —, `bareme_palier`, `plage_demi_journee`, `calendrier_tarifaire`. **Inscrire `hebergement` à la liste `## Schémas déclarés` du README du modèle dans la même tâche** — la liste ne dit que ce qui existe. Nommer **`ix_unite_categorie`** avec son commentaire d'usage : c'est lui qui sert la **recherche de disponibilité par catégorie** (FR-012, mesurée en T026). Détail en [data-model.md](./data-model.md) § `97-hebergement.sql`
- [ ] T005 [US1] Ajouter **`occupation`** à `docs/modele-donnees/97-hebergement.sql`, avec ses cinq propriétés indissociables : **`periode` et `periode_indisponibilite` en `TSTZRANGE`** — jamais une paire de colonnes de date —, `ck_occupation_periode_incluse` (`periode_indisponibilite @> periode`), le **motif** (`SEJOUR`, `RESERVATION`, `MAINTENANCE`, `BLOCAGE` — la mise hors service est une occupation, **pas une colonne de `unite`**), et **`ex_occupation_unite_periode`** : `EXCLUDE USING gist (unite_id WITH =, periode_indisponibilite WITH &&) WHERE (statut <> 'ANNULEE')`, **posée à la création de la table**. **Aucun index de plus POUR LE CHEVAUCHEMENT** : celui de la contrainte le sert déjà — la recherche par catégorie, elle, est servie par `ix_unite_categorie` posé en T004. Contrat complet : [contracts/disponibilite.md](./contracts/disponibilite.md)

> **La contrainte se pose à la CRÉATION, jamais par `ALTER`.** Sur une table peuplée, elle échoue sur les données existantes — piège consigné par le cycle D1 dans `00-conventions.sql`, **et ce cycle est le premier à le rencontrer pour de vrai**. Corollaire : la forme retenue doit être la bonne **aujourd'hui**, parce qu'une migration de phase 3 ne pourra plus la durcir.

- [ ] T006 [US1] Prouver **SC-003** et consigner le résultat — date, méthode, verdict — dans `specs/002-modele-donnees-verticales/rapport-de-cycle.md`, **créé par cette tâche** sur le modèle de celui du cycle D1 : deux sessions `psql` concurrentes insérant des intervalles chevauchants sur la même unité — **exactement une réussit**, l'autre rend `23P01 exclusion_violation` en nommant la contrainte —, plus les **quatre cas du [quickstart](./quickstart.md) §2** : deux unités distinctes (les deux passent) · intervalle jointif malgré 30 min de remise en état (rejeté) · **occupation annulée puis réinsertion sur le même intervalle (acceptée)** · `periode` débordant de `periode_indisponibilite` (rejeté par le `CHECK`)

> **Le cas de l'annulation est celui qu'on oublie de tester, et c'est le plus coûteux.** Sans la clause `WHERE` partielle, **toute annulation rendrait l'unité définitivement inlouable** sur son intervalle — alors qu'annulation, no-show et départ anticipé sont trois chemins nominaux du produit.

**Point de contrôle** : **c'est le MVP du cycle.** Le chevauchement est impossible au niveau de la base, la remise en état est dans l'intervalle protégé, et rien de tout cela ne dépend d'une ligne de code applicatif.

---

## Phase 4 : Récit 2 — Les quatre fichiers s'appliquent et passent les portes (Priorité : P1)

**But** : les 47 tables du cycle, applicables dans l'ordre sur une base vierge, chacune isolée et déclarée.

**Test indépendant** : `scripts/verifier.sh` sort vert sur ses trois portes, et le nombre de tables inspectées croît d'une tâche à l'autre jusqu'à 118.

- [ ] T007 [P] [US2] Créer `docs/modele-donnees/96-stocks.sql` — les **7 tables** : `point_de_stock`, `article_stock`, `article_stock_catalogue` (liaison, `article_id` **nu**), `mouvement_stock` (**`cout_unitaire` nullable, PROVISION, jamais renseignée au MVP** — A4 ; `quantite` en `NUMERIC` ; **`SELECT, INSERT` seuls**), `inventaire`, **★ `ligne_inventaire`**, `alerte_seuil`. En-tête du fichier : le stock est une **capacité, pas un module**, seul le profil `SIMPLE` est implémenté. **Inscrire `stocks` à la liste `## Schémas déclarés` du README du modèle dans la même tâche**
- [ ] T008 [P] [US2] Créer `docs/modele-donnees/55-ventes.sql` avec son en-tête — **`restauration` et `bar` sont des coquilles vides, et ce n'est pas un oubli** — et les **4 tables de catalogue** : `categorie_article`, **`destination_preparation` rattachée à l'ÉTABLISSEMENT** (une cuisine sert plusieurs points de vente), `article` (**`destination_preparation_id` NULLABLE**, avec le commentaire du repli sur la clé `ventes.destination_preparation_defaut` du cycle D1 · `unite_mesure` **obligatoire, défaut `'unite'`** · `code_barre` et `article_parent_id` **nullables et non utilisés**), **`conversion_unite_mesure` sans aucun `GRANT`, pas même `SELECT`** (A3 — c'est cette absence qui la prouve provision). **Inscrire `ventes` à la liste `## Schémas déclarés` du README du modèle dans la même tâche**
- [ ] T009 [US2] Ajouter à `docs/modele-donnees/55-ventes.sql` les **7 tables de commande** : `commande` (**deux classes** — A à l'ouverture et à la réception QR, B à la validation et sur l'addition de table ; `cible_type` + `cible_id` **nus**, la cible `SEJOUR` étant une **valeur opaque** — `ventes` ne nomme jamais « séjour » ailleurs), `ligne_commande` (**deux classes** — A à la saisie et avant envoi, B à l'annulation après envoi ; `prix_unitaire` **verrouillé à la création** ; `quantite` en `NUMERIC`) — **aucune contrainte `CHECK` sur `cible_type`**, sur le précédent de `caisse.encaissement` au socle : énumérer les valeurs ferait nommer `SEJOUR` par `ventes`, qui est du socle, **dans une contrainte de base**, **`lot_envoi` en `SELECT, INSERT` seuls** (un second envoi crée un second lot), `remise`, `part_addition`, **`numerotation_reference`** (compteur en table à verrou de ligne, **jamais une `SEQUENCE`**), `jeton_table`
- [ ] T010 [US2] Ajouter à `docs/modele-donnees/97-hebergement.sql` les **9 tables de séjour** : `client` (**`personne_id` nu — aucune donnée d'identité dupliquée**, sinon la purge TRX-06 aurait deux cibles), `preference_personne` (sur la **personne**, pas sur le client), `sejour`, `accompagnant`, `note_sejour`, `ligne_sejour` (**`ligne_commande_id` NU — première saga** ; `bon_depot_id` nu ; **`uq_ligne_sejour_ligne_commande` et `uq_ligne_sejour_bon_depot`, deux index UNIQUE partiels** — l'idempotence du report est portée par une **contrainte**, jamais par une lecture préalable : un index ordinaire *retrouverait* le doublon sans le **refuser**, et un événement rejoué produirait une seconde ligne sur la note), `fiche_police`, `numerotation_fiche_police` (compteur en table), **`taxe_sejour_constat` en `SELECT, INSERT` seuls** — le constat est figé au départ. **`client` ne porte AUCUN `etablissement_id`** : SEJ-01 et le registre §7.3 le déclarent *partagé entre les établissements du tenant*, et `uq_client_personne` est unique **par tenant**
- [ ] T011 [US2] Ajouter à `docs/modele-donnees/97-hebergement.sql` les **4 tables de réservation et de maintenance** : `reservation`, `arrhes` (**deux classes** — B en espèces et virement, D en Mobile Money et carte ; `encaissement_id` **nu**), `incident_maintenance` et `intervention` (**A · A4**, `SELECT, INSERT`). **Aucune table pour la politique d'annulation ni pour le délai d'expiration d'une provisoire** : ce sont des clés du catalogue de configuration, et le fichier le dit
- [ ] T012 [P] [US2] Créer `docs/modele-donnees/98-pressing.sql` — les **3 tables** : `bon_depot` (**deux classes** — B à la création et au retrait, A pour les transitions intermédiaires ; **`personne_id` nu vers `comptes.personne`, JAMAIS vers `hebergement.client`** — une verticale ne dépend pas d'une autre verticale, et un pressing seul est un établissement valide ; **`sejour_id` NU — seconde saga** ; `moment_reglement` **résolu à la création puis figé**), `piece_deposee`, `numerotation_retrait` (compteur en table — *un trou est une pièce de linge dont personne ne sait si elle a existé*). **Inscrire `pressing` à la liste `## Schémas déclarés` du README du modèle dans la même tâche** — la quatrième et dernière, après quoi la liste opposable et le catalogue coïncident

**Point de contrôle** : 113 tables appliquées (118 moins les 5 provisions d'hébergement de T019), `scripts/verifier.sh` vert sur trois portes. **Le modèle opérationnel du MVP existe en SQL de bout en bout** — la phase 2 du produit peut donner à ses données simulées la forme exacte de ces tables.

> **Pourquoi T009, T010 et T011 ne portent pas `[P]`** : T009 complète le fichier que T008 crée, T010 et T011 celui que T004 et T005 créent. Elles s'exécutent dans l'ordre indiqué, jamais simultanément. T007 et T012 créent des fichiers neufs et sont libres.

---

## Phase 5 : Récit 3 — Les privilèges disent la classe, y compris quand il y en a deux (Priorité : P1)

**But** : qu'on puisse lire les `GRANT` d'une table et en déduire son régime **sans lire un seul commentaire**.

**Test indépendant** : parcourir les privilèges de `kaya_app` sur les 47 tables et retrouver la matrice de [conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md) §3 sans exception.

- [ ] T013 [US3] Audit des privilèges sur les quatre fichiers de `docs/modele-donnees/` (`55-`, `96-`, `97-`, `98-`), par requête sur `information_schema.role_table_grants`. Points à vérifier **nommément** : `lot_envoi` et `taxe_sejour_constat` **sans `UPDATE` ni `DELETE`** · `conversion_unite_mesure` **sans aucun privilège** · `mouvement_stock`, `inventaire`, `ligne_inventaire`, `alerte_seuil`, `preference_personne`, `accompagnant`, `incident_maintenance`, `intervention`, `piece_deposee` en **`SELECT, INSERT`** · les 5 provisions d'hébergement en **`SELECT` seul** · **aucune table ne reçoit `DELETE`** · **aucun `GRANT … ON ALL TABLES IN SCHEMA`**. Dans la même passe, vérifier que **chaque index porte son commentaire d'usage** nommant la recherche qu'il sert — un index sans usage nommé se retire plutôt que de se justifier après coup
- [ ] T014 [US3] Vérifier dans `docs/modele-donnees/55-ventes.sql`, `96-stocks.sql`, `97-hebergement.sql` et `98-pressing.sql` que les **6 tables à double classe** déclarent **les deux** dans leur commentaire d'en-tête, avec l'opération de chacune : `commande` (A/B), `ligne_commande` (A/B), `unite` (C/A), `arrhes` (B/D), `ligne_sejour` (B / **classe de la ligne d'origine**), `bon_depot` (B/A). Vérifier séparément que `mouvement_stock` et `inventaire` déclarent **une seule classe, B**, avec un privilège plus strict qu'elle n'exige, et que le commentaire dit pourquoi : *une correction est une contre-passation*. **Une décision de forme n'est pas une seconde classe**, et les confondre ferait chercher une double déclaration qui n'a pas lieu d'être. Dans la même passe, contrôler que **l'expression de politique RLS est strictement identique** à celle du socle, mot pour mot — une variante obligerait P-01 à accepter deux formes, et une porte qui en accepte deux en acceptera trois

**Point de contrôle** : la classe de chaque entité est portée par trois choses concordantes — le registre, le commentaire d'en-tête, et le privilège. La troisième est la seule qui se vérifie mécaniquement.

---

## Phase 6 : Récit 4 — Les deux sagas, et le cas orphelin nominal (Priorité : P2)

**But** : que l'absence de clé étrangère soit **opposable**, et non plus seulement commentée.

**Test indépendant** : `scripts/verifier.sh --test-negatif p05` sort rouge en nommant la contrainte, la table portante et la table référencée ; `git status` reste propre.

- [ ] T015 [US4] Rédiger dans `docs/modele-donnees/97-hebergement.sql` et `98-pressing.sql` les **commentaires de colonne des deux sagas** — `hebergement.ligne_sejour.ligne_commande_id` et `pressing.bon_depot.sejour_id` —, chacun énonçant les trois mêmes choses : que c'est une **saga à compensation explicite** et jamais une transaction · que le **cas orphelin — la note est déjà arrêtée — est le chemin NOMINAL**, pas l'exception · que la compensation atterrit dans `synchronisation.reconciliation_orpheline`, **créée au cycle D1**, et qu'**aucune table de réconciliation nouvelle n'est créée**. Même traitement pour les autres rattachements nus recensés en [data-model.md](./data-model.md). Contrat complet : [contracts/sagas-inter-modules.md](./contracts/sagas-inter-modules.md)
- [ ] T016 [US4] Implémenter `scripts/verifier.sh --test-negatif p05` : copier `docs/modele-donnees/` dans un répertoire temporaire, **transformer `hebergement.ligne_sejour.ligne_commande_id` en clé étrangère vers `ventes.ligne_commande`**, relancer la porte sur la copie, **exiger** qu'elle sorte rouge en nommant les trois objets. Si elle passe au vert, sortie **`4`**. La table modifiée garde sa RLS complète et sa classe déclarée, pour qu'elle **passe P-01 et P-02** et n'échoue que sur P-05 — sans quoi on croirait avoir prouvé P-05 alors qu'on aurait prouvé P-01 une troisième fois
- [ ] T017 [US4] Constater **SC-005** et le consigner : requête sur `pg_constraint` où `contype = 'f'` et les deux `relnamespace` diffèrent → **zéro ligne** sur les quatorze schémas. Vérifier dans la même passe que P-05 **déclare son périmètre** — nombre de schémas et **nombre de contraintes examinées** — et que ce nombre est cohérent avec le décompte des clés étrangères internes du modèle

> **Le test négatif de T016 rejoue l'erreur réelle qu'on cherche à prévenir**, et le choix de la cible n'est pas indifférent : c'est précisément la colonne qu'un cycle de phase 3 serait tenté de « réparer », de bonne foi, en croyant corriger un oubli.

**Point de contrôle** : la règle « aucune clé étrangère entre deux schémas » n'est plus un commentaire — elle est refusée par une commande. *Un commentaire ne refuse rien.*

---

## Phase 7 : Récit 5 — Les référentiels portent ce qu'une colonne ne porterait pas (Priorité : P2)

**But** : vérifier que les quatre décisions de référentiel ont bien été prises, et pas approchées.

**Test indépendant** : lire le schéma et retrouver, sans ouvrir la spécification, pourquoi chacune est une table.

- [ ] T018 [US5] Revue des référentiels sur `docs/modele-donnees/97-hebergement.sql` et `55-ventes.sql`, cinq points nommés : **(1)** `uq_temps_remise_categorie_formule` porte bien sur le **couple** — deux formules d'une même catégorie ont deux durées · **(2)** `destination_preparation` est rattachée à l'**établissement**, pas au point de vente · **(3)** `article.destination_preparation_id` est **nullable** et son commentaire énonce le repli, *pour qu'aucun bon d'envoi ne manque* · **(4)** `bareme_palier`, `plage_demi_journee` et `calendrier_tarifaire` sont des **tables**, et `seuil_bascule_nuitee_minutes`, `heure_arrivee_standard`, `heure_depart_standard` **ne sont pas dupliqués** depuis le catalogue du cycle D1 · **(5)** `formule.assujettie_taxe_nuitee` et `regle_conversion_taxe` sont des **entrées de calcul**, jamais une règle — **aucune règle fiscale ne vit hors du `JurisdictionAdapter`**

**Point de contrôle** : aucune de ces quatre décisions ne coûtera de migration au premier exploitant qui aura deux cuisines, ou deux durées de ménage sur la même catégorie.

---

## Phase 8 : Récit 6 — Les provisions existent en table, et nulle part ailleurs (Priorité : P3)

**But** : les provisions du registre §10 qui relèvent de ces quatre schémas — **tables seulement, aucune logique**. C'est **le dernier cycle où elles coûtent zéro**.

**Test indépendant** : chercher chaque provision du registre §10 relevant de ces schémas et la trouver ; lire ses privilèges et constater qu'on ne peut rien bâtir dessus.

- [ ] T019 [US6] Ajouter les **5 provisions** à `docs/modele-donnees/97-hebergement.sql` (FR-048), chacune avec la mention littérale **« PROVISION — tables seulement, aucune logique au MVP »** et sa story : `prestation_incluse` (HEB-09, rattachée à la **formule**), `contrat_location`, `caution`, `charge_locative`, `etat_des_lieux` (HEB-08, résidences meublées, incrément 3). Privilège : **`SELECT` seul**
- [ ] T020 [P] [US6] Vérifier dans `docs/modele-donnees/97-hebergement.sql`, `55-ventes.sql` et `96-stocks.sql` les **6 provisions du cycle** — les 5 ci-dessus plus `conversion_unite_mesure` — et les **deux provisions-colonnes** : `mouvement_stock.cout_unitaire` **nullable et jamais renseignée** (A4), `article.code_barre` et `.article_parent_id` **nullables et non utilisées** (A5). Vérifier aussi que **le décompte d'une prestation incluse n'a reçu aucune table** (FR-049 ; registre §10, incrément 2) et que le fichier le dit — *une table qu'aucune story n'écrit se remplit un jour de ce qui traîne*

**Point de contrôle** : **118 tables.** Toute provision du modèle a sa table, aucune n'a de logique, et aucune ne pourra en recevoir sans qu'un `GRANT` change — ce qui se voit dans un diff.

---

## Phase 9 : Récit 7 — L'index du modèle et le registre restent vrais (Priorité : P3)

**But** : qu'on sache ce que contient le modèle **sans ouvrir un fichier SQL**, et que le registre dise pourquoi chaque nom a été retenu.

**Test indépendant** : lecture croisée du README et du catalogue de la base — chaque table figure des deux côtés, avec sa classe.

- [ ] T021 [US7] Compléter `docs/modele-donnees/README.md` : les **quatre sections de tables** avec leur classe hors-ligne — 11 pour `ventes`, 7 pour `stocks`, 26 pour `hebergement`, 3 pour `pressing` —, les **doubles classes déclarées des deux côtés**, et les décomptes de tête portés à **118 tables · 15 fichiers · 14 schémas · 20 provisions**
- [ ] T022 [US7] Étendre le **schéma des relations en texte** de `docs/modele-donnees/README.md` aux quatre schémas nouveaux, en distinguant visuellement la **clé étrangère** du **rattachement nu** — et vérifier qu'**aucune flèche pleine ne traverse un schéma**. Ajouter la note du **piège du préfixe à trois chiffres** : en tri lexicographique, `100-` vient **avant** `20-`, donc avant tout le socle — pour le cycle qui voudra un quinzième fichier
- [ ] T023 [US7] Vérifier dans `docs/registre-classes-offline.md` que les lignes déjà présentes aux §6, §7 et §8 sont **honorées telles quelles** — elles ont été décidées à froid et ne se réécrivent pas — et que le journal §13 porte **la seule ligne due par ce cycle** (`ligne_inventaire`, posée en T002). **Jamais un décompte de tables ni un état d'avancement** (registre §13). Consigner au même endroit la décision de **ne pas trancher O-02 ni O-03** : jusqu'à leur arbitrage, la classe inscrite s'applique

**Point de contrôle** : le modèle se lit et se tient. La règle de tenue écrite au cycle D1 couvre désormais les quinze fichiers.

---

## Phase 10 : Finition et mesures

**Objet** : porter les planchers à leur valeur définitive, **recasser les trois portes**, mesurer, et clore la phase 1 du produit.

- [ ] T024 Porter les **planchers de non-vacuité** à leur valeur définitive dans `scripts/verifier.sh` : P-01 de 60 à **une valeur réglée juste sous 118** · P-02 sur ses deux côtés — tables réelles et entités extraites, la seconde mesurée après l'ajout de `ligne_inventaire` · P-05 de 1 à **une valeur réglée juste sous le nombre réel de clés étrangères**. **Un plancher se règle juste sous la valeur réelle, jamais loin en dessous** : un plancher confortable ne refuse rien
- [ ] T025 **Rejouer les trois tests négatifs après le relèvement** — `scripts/verifier.sh --test-negatif` — et consigner les trois verdicts. *Une porte dont on a changé un seuil sans la recasser n'est plus une porte vérifiée* : elle est redevenue une décoration qu'on croit fonctionnelle
- [ ] T026 [P] Mesurer **SC-010** hors du script et consigner le plan dans `specs/002-modele-donnees-verticales/rapport-de-cycle.md` : appliquer le modèle sur une base locale non éphémère, semer 5 catégories, **50 unités**, 4 formules et **20 000 occupations** réparties sur deux ans par `generate_series` — la contrainte d'exclusion garantit l'absence de chevauchement à l'insertion, ce qui est une preuve au passage —, `ANALYZE`, puis `EXPLAIN (ANALYZE, BUFFERS)` sur *« quelles unités de la catégorie X sont libres entre T1 et T2 ? »*. **Attendu : moins de 300 ms et un parcours d'index, jamais un `Seq Scan`.** Consigner la réserve d'usage : mesure sur poste Apple Silicon en cache, qui ne prédit pas le VPS `linux/amd64` à froid
- [ ] T027 [P] Mesurer la **durée totale** de `scripts/verifier.sh` sur trois exécutions et la consigner, à comparer aux **5 s** du cycle D1. **Attendu : moins de deux minutes** (SC-011). Au-delà, on cesse de lancer un script — c'est le déclencheur documenté du passage au serveur d'intégration, en phase 3
- [ ] T028 [P] Écrire **une ligne au journal §6 de `docs/versions-reference.md`** : le cycle D2 n'a introduit **aucune dépendance**, n'a monté aucune version et n'a ouvert **aucune famille du §3.4**. *Un journal qui ne dit rien d'un cycle laisse croire qu'on a oublié de l'y écrire.*
- [ ] T029 [P] Documenter la **troisième porte** dans le `README.md` du dépôt, aux côtés de P-01 et P-02 : ce que P-05 vérifie, et le mode `--test-negatif p05`. Une commande non documentée est une commande qu'on relance de mémoire, donc mal
- [ ] T030 Dérouler [quickstart.md](./quickstart.md) de bout en bout, dans l'ordre, sur un dépôt propre : la commande unique · les cinq cas de la contrainte d'exclusion · les trois tests négatifs · la mesure de disponibilité · et `git status` **propre après chaque test négatif**
- [ ] T031 Vérifier les **quinze critères de réussite** de [spec.md](./spec.md) un par un et consigner le verdict de chacun dans `specs/002-modele-donnees-verticales/rapport-de-cycle.md`, dont les **six qu'aucune porte ne couvre** et qui se constatent ici, une fois, par écrit : **SC-004** (aucune période représentée autrement qu'en `tstzrange`) · **SC-007** (les 7 doubles classes déclarées des deux côtés) · **SC-008** (privilèges de `lot_envoi` et `taxe_sejour_constat`, aucun `DELETE`, aucun `GRANT` global) · **SC-009** (zéro quantité en entier, zéro flottant, zéro identifiant avec `DEFAULT`, zéro `SEQUENCE`) · **SC-014** (**zéro** migration, **zéro** fichier Rust ou TypeScript, **zéro** écran, **zéro** fichier sous `.github/workflows/`, **zéro** service ajouté à `compose.yml`) · **SC-015** (README ↔ catalogue) · **le périmètre** — `git diff --stat` sur les onze fichiers du socle : **zéro modification hors README**
- [ ] T032 **Revue de la *Definition of Done*** (`docs/user-stories-v1.md` §0.4), point par point. Les points qui relèvent des phases 2 et 3 du produit se déclarent **« sans objet »**, **jamais cochés en silence**. Les points applicables : 1 (critères couverts), 4 (RLS activée **et** forcée sur toute nouvelle table), 5 (classe hors-ligne déclarée), 7 (i18n — **sans objet**, aucune chaîne utilisateur), 9 (paramètres exposés en configuration — les clés du catalogue du D1 sont employées, jamais dupliquées), 11 (`docs/modele-donnees/` est **le livrable**), 14 (`scripts/verifier.sh` passe en une commande et **toute porte ajoutée a son test négatif** — c'est le point que P-05 engage)

---

## Dépendances et ordre d'exécution

### Dépendances entre phases

- **Phase 1 — Mise en place** : dépend du cycle D1 livré. **T002 bloque T007** — sans elle, `ligne_inventaire` ferait sortir P-02 rouge. **T001 ne bloque rien** : le tableau de l'ordre d'application n'est lu par aucune porte, et la liste opposable grandit fichier par fichier
- **Phase 2 — Fondations** : dépend de la phase 1. **Bloque toutes les tâches de schéma** : P-05 est le critère de fin de chacune
- **Phase 3 — Récit 1** : dépend de la phase 2. T005 dépend de T004 (même fichier), T006 de T005
- **Phase 4 — Récit 2** : T007, T008 et T012 dépendent de la phase 2 seulement ; T009 dépend de T008 ; T010 et T011 dépendent de T005
- **Phase 5 — Récit 3** : dépend des phases 3 et 4 — elle constate sur les tables écrites
- **Phase 6 — Récit 4** : T015 dépend de T010 et T012 ; **T016 dépend de T009 et T010** — le test négatif a besoin des deux tables qu'il relie
- **Phase 7 — Récit 5** : dépend de T004, T008 et T009
- **Phase 8 — Récit 6** : T019 dépend de T005 ; T020 dépend de T007, T008 et T019
- **Phase 9 — Récit 7** : dépend de toutes les phases de schéma — le README liste les 118 tables
- **Phase 10 — Finition** : dépend de tout. **T025 dépend impérativement de T024** : c'est le relèvement des planchers qui rend le rejeu nécessaire

### Ce qui rend chaque récit indépendamment vérifiable

| Récit | Comment on le vérifie seul |
|---|---|
| **US1** (P1) | Deux transactions concurrentes chevauchantes : **exactement une réussit**, par `23P01` |
| **US2** (P1) | `scripts/verifier.sh` vert sur trois portes, 118 tables inspectées |
| **US3** (P1) | La matrice de privilèges se retrouve table par table ; les 7 doubles classes déclarent les deux |
| **US4** (P2) | `--test-negatif p05` sort rouge en nommant trois objets ; `git status` propre |
| **US5** (P2) | L'unicité de `temps_remise_en_etat` porte sur le couple ; la destination est facultative avec son repli |
| **US6** (P3) | Chaque provision du registre §10 relevant de ces schémas a sa table et des privilèges restreints |
| **US7** (P3) | Le README rend chaque table avec sa classe ; aucune flèche pleine ne traverse un schéma |

### Occasions de parallélisme

- **T002** en parallèle de T001 — registre et README du modèle, deux fichiers distincts
- **T007, T008, T012** en parallèle — trois fichiers neufs et distincts. **T009 suit T008**, **T010 et T011 suivent T005**, toutes trois sur des fichiers déjà ouverts
- **T020** en parallèle de T021 — vérification contre rédaction, deux fichiers distincts
- **T026, T027, T028, T029** en parallèle — deux mesures et deux écritures documentaires indépendantes

### Exemple d'exécution parallèle — phase 4

```bash
# Les trois fichiers neufs, ensemble :
Tâche : "Créer docs/modele-donnees/96-stocks.sql — 7 tables"
Tâche : "Créer docs/modele-donnees/55-ventes.sql — 4 tables de catalogue"
Tâche : "Créer docs/modele-donnees/98-pressing.sql — 3 tables"

# Puis les compléments, chacun sur son fichier déjà ouvert :
Tâche : "Ajouter les 7 tables de commande à 55-ventes.sql"
Tâche : "Ajouter les 9 tables de séjour à 97-hebergement.sql"
```

---

## Stratégie de mise en œuvre

### Le plus petit livrable utile — phases 1 à 3

1. Phase 1 : les portes existantes acceptent ce qui vient
2. Phase 2 : **P-05**, le critère de fin de tout le reste
3. Phase 3 : le référentiel d'hébergement et **`occupation`**
4. **S'arrêter et valider** : deux transactions concurrentes, une seule passe
5. À ce point, **la décision la plus irréversible du produit est posée et prouvée**. Tout le reste du cycle est important ; celui-ci est structurant

### Livraison incrémentale

1. Phases 1 + 2 → les portes sont prêtes, P-05 tourne sur le socle
2. Phase 3 → la disponibilité est garantie par la base (**MVP du cycle**)
3. Phase 4 → les 47 tables existent, le modèle opérationnel du MVP est complet
4. Phases 5 + 6 → les classes et l'absence de clé étrangère sont **prouvées**, plus seulement écrites
5. Phases 7 + 8 → les référentiels sont vérifiés, les provisions posées au dernier moment où elles coûtent zéro
6. Phases 9 + 10 → le modèle se lit, se tient, et les mesures sont consignées — **la phase 1 du produit est close**

### Ce qui n'est pas dans cette liste, et qui est délibéré

- **Aucune migration sqlx**, aucun `Cargo.toml`, aucun `package.json`, aucun fichier Rust ou TypeScript, aucun service ajouté à `compose.yml`.
- **Aucun écran, aucune donnée simulée, aucun terme de lexique** — ce cycle ne produit rien de visible par un utilisateur.
- **Aucun workflow GitHub Actions.** Le serveur de CI vient en phase 3 et **lancera ce script sans le modifier**.
- **Aucune modification des onze fichiers du socle** hors README — contrôlé en T031 par `git diff --stat`.
- **Aucune porte au-delà de P-05.** P-03 reste différée au cycle qui crée le premier manifeste de dépendances, avec l'exposition résiduelle inchangée : un fichier, une ligne.
- **Aucun arbitrage d'O-02 ni d'O-03.** Ce sont des questions pour le pilote et pour le cycle du crate QR, pas des questions de modèle.

---

## Notes

- `[P]` = fichiers différents, aucune dépendance sur une tâche inachevée
- Chaque tâche de schéma se termine par `scripts/verifier.sh` **vert sur ses trois portes** — l'agent le lance, et ne rapporte pas une tâche comme terminée si le script est rouge (constitution, flux de travail)
- Commiter après chaque tâche ou groupe logique
- **Ce que ces tâches ne prouveront jamais** : la **justesse** d'une classe. Aucune lecture du schéma ne retrouve qu'une ligne de commande est A à la saisie et B à l'annulation après envoi. C'est le seul point du modèle qui demande un jugement humain — et ce cycle en compte **sept**, contre deux au cycle D1
- **Ce que ce cycle laisse écrit pour la phase 3**, plutôt que de le laisser redécouvrir : le calcul qui pose `periode_indisponibilite` · **insérer et traiter le rejet `23P01`, jamais lire puis insérer** · la compensation des deux sagas et le **test du scénario orphelin** (SYN-03) · la règle « `lot_envoi_id` ne s'écrit qu'une fois », qui est de service et non de privilège
