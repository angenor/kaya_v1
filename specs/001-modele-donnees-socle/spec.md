# Spécification de fonctionnalité : Modèle de données du socle (cycle D1)

**Répertoire de fonctionnalité** : `specs/001-modele-donnees-socle`

**Branche** : `main` *(aucune branche dédiée créée — aucune extension `before_specify` n'est enregistrée dans ce dépôt)*

**Créée le** : 2026-08-06

**Statut** : Brouillon

**Phase** : 1 — le modèle de données (constitution, principe 0)

**Entrée** : description utilisateur du cycle D1 de `docs/Kaya_Prompts_SpecKit.md` §3 — « LE MODÈLE DE DONNÉES DU SOCLE, EN SQL, ÉCRIT AVANT TOUT CODE ».

---

## Ce que ce cycle produit, et ce qu'il ne produit pas

| Produit | Non produit |
|---|---|
| `docs/modele-donnees/*.sql` — le SQL de référence de tous les schémas du socle | Aucune migration sqlx |
| `docs/modele-donnees/README.md` — index, relations, classes, règle de tenue | Aucun crate Rust, aucun trait, aucun endpoint |
| `scripts/verifier.sh` — la commande unique, avec **P-01** et **P-02** | Aucun écran, aucune donnée simulée |
| Les tests négatifs des deux portes, exécutés et consignés | **Aucun workflow GitHub Actions** (le serveur de CI vient en phase 3) |
| La mise à jour de `docs/registre-classes-offline.md` | Aucun schéma `hebergement`, `ventes`, `pressing`, `stocks` (cycle D2) |

---

## Scénarios utilisateur et vérification *(obligatoire)*

> **Aucun persona métier.** Ce cycle ne produit pas d'interface. L'unique acteur est **le développeur solo**, et les bénéficiaires sont les cycles suivants : la phase 2 donne à ses données simulées la forme exacte de ces tables, la phase 3 y adosse ses migrations.

### Récit 1 — Le socle s'applique sur une base vierge (Priorité : P1)

Le développeur lance une base PostgreSQL vierge et applique, dans l'ordre, `00-conventions.sql` puis chaque fichier de schéma. Tout passe sans erreur, sans dépendance manquante, sans ordre implicite. À la fin, la base contient l'intégralité des tables du socle du MVP, provisions comprises.

**Pourquoi cette priorité** : c'est la condition de tout le reste. Un modèle qui ne s'applique pas n'est pas un modèle, c'est un brouillon. Et c'est la seule preuve mécanique qu'il est complet et cohérent.

**Vérification indépendante** : `docker compose` lance une base neuve, le script applique les fichiers dans l'ordre déclaré, aucune erreur n'est retournée, la base est détruite ensuite. Testable sans aucun autre livrable du cycle.

**Scénarios d'acceptation** :

1. **Étant donné** une base PostgreSQL vierge, **quand** on applique les fichiers de `docs/modele-donnees/` dans l'ordre déclaré au README, **alors** aucune commande ne retourne d'erreur et chaque schéma annoncé existe.
2. **Étant donné** l'application réussie, **quand** on inspecte le catalogue, **alors** chaque table nommée à la section « Entités clés » de la présente spécification existe, avec ses contraintes nommées.
3. **Étant donné** un fichier appliqué hors de son ordre, **quand** une dépendance lui manque, **alors** l'échec est immédiat et explicite — jamais silencieux.

---

### Récit 2 — Chaque table prouve son isolation multi-tenant (Priorité : P1)

Le développeur interroge `pg_policies` et `pg_class` après application. Chaque table du modèle porte les **trois** éléments : `tenant_id`, `ENABLE` **et** `FORCE ROW LEVEL SECURITY`, et la politique `isolation_tenant` en `USING` **et** `WITH CHECK`. Aucune exception, aucune table oubliée.

**Pourquoi cette priorité** : une politique manquante est une fuite de données entre clients — le seul défaut dont le coût ne se rattrape pas (constitution, principe 3). C'est la moitié de la porte P-01.

**Vérification indépendante** : une requête sur les vues du catalogue compare la liste des tables du modèle à celles qui portent les trois éléments ; l'écart, dans un sens comme dans l'autre, est un échec.

**Scénarios d'acceptation** :

1. **Étant donné** le modèle appliqué, **quand** on compare la liste des tables à celles portant `relrowsecurity` **et** `relforcerowsecurity`, **alors** les deux listes sont identiques.
2. **Étant donné** le modèle appliqué, **quand** on inspecte `pg_policies`, **alors** chaque table porte une politique `isolation_tenant` dont l'expression `USING` **et** l'expression `WITH CHECK` sont toutes deux présentes et non nulles.
3. **Étant donné** une politique référençant `current_setting('app.current_tenant')`, **quand** le paramètre n'est pas posé, **alors** l'appel ne lève pas d'exception — le second argument `true` est présent partout.
4. **Étant donné** une table à laquelle on retire volontairement sa politique, **quand** on relance la porte, **alors** elle échoue en nommant la table fautive.

---

### Récit 3 — Les privilèges disent la classe hors-ligne (Priorité : P2)

Le développeur lit les `GRANT` d'une table et en déduit sa classe sans lire un seul commentaire. Une entité append-only de classe A reçoit `SELECT, INSERT` et jamais `UPDATE` ni `DELETE`. Une provision sans logique reçoit `SELECT` seul — ou rien du tout quand rien n'a de raison de la lire.

**Pourquoi cette priorité** : c'est le privilège qui **prouve** la propriété ; un commentaire ne prouve rien et se périme. C'est aussi ce qui empêche un cycle de phase 3 d'écrire, sans s'en apercevoir, une mise à jour sur une table qui n'aurait jamais dû en accepter.

**Vérification indépendante** : l'inspection des privilèges de `kaya_app` sur chaque table, confrontée à la classe déclarée au registre.

**Scénarios d'acceptation** :

1. **Étant donné** `synchronisation.evenement_outbox` (classe A, immuable, rétention illimitée), **quand** on inspecte les privilèges de `kaya_app`, **alors** `SELECT` et `INSERT` sont accordés, `UPDATE` et `DELETE` sont absents. *(Le marquage « publié » est traité au modèle sans `UPDATE` — voir Cas limites.)*
2. **Étant donné** `synchronisation.reconciliation_orpheline` (création A, résolution B non implémentée), **quand** on inspecte les privilèges, **alors** `UPDATE` est absent — l'absence prouve la provision.
3. **Étant donné** `comptes.employe` (provision), **quand** on inspecte les privilèges, **alors** `kaya_app` n'y a aucun droit d'écriture.
4. **Étant donné** une table dont la classe au registre est A append-only, **quand** un `GRANT UPDATE` lui est accordé, **alors** l'incohérence est visible à la lecture du fichier de son schéma, à côté du commentaire d'en-tête qui déclare sa classe.

---

### Récit 4 — La commande unique et ses deux portes (Priorité : P2)

Le développeur lance `scripts/verifier.sh`. Une seule commande enchaîne tout ce qui doit passer et sort en échec au premier contrôle rouge. Elle porte exactement deux portes : **P-01** et **P-02**. Chacune a été cassée volontairement une fois, et l'échec a été constaté.

**Pourquoi cette priorité** : ce qui a de la valeur pour un développeur seul n'est pas qu'une machine lance les contrôles, c'est qu'ils soient **mécaniques**. Une porte qui ne trouve jamais rien est indistinguable d'une porte qui n'a rien à trouver.

**Vérification indépendante** : lancer le script sur le dépôt sain (vert), puis sur deux dépôts volontairement cassés (rouge, avec un message qui nomme la cause).

**Scénarios d'acceptation** :

1. **Étant donné** le dépôt sain, **quand** on lance `scripts/verifier.sh`, **alors** il sort en succès et déclare le périmètre inspecté par chaque porte.
2. **Étant donné** une politique RLS retirée d'un fichier, **quand** on lance le script, **alors** P-01 échoue, nomme la table, et le script sort en échec sans exécuter P-02.
3. **Étant donné** une table ajoutée à un fichier sans être déclarée au registre, **quand** on lance le script, **alors** P-02 échoue et nomme la table.
4. **Étant donné** une entité déclarée au registre **sans** table correspondante, **quand** on lance le script, **alors** P-02 **passe** — la comparaison se fait dans le sens table → registre, et une entité de D2 déclarée d'avance est normale.
5. **Étant donné** l'exécution complète, **quand** elle se termine, **alors** la base de vérification a été détruite — le script ne laisse aucun conteneur ni volume derrière lui.

---

### Récit 5 — Les provisions existent en table, et nulle part ailleurs (Priorité : P3)

Le développeur retrouve dans le modèle chaque provision du cadrage §14 et du registre §10 : correspondance comptable, partenaires externes et compensation, comptes clients à crédit, documents commerciaux, canal d'émission RNE, dispositif de contrôle d'accès, employé. Aucune ne porte de logique, aucune n'apparaîtra dans un écran de phase 2 ni dans un endpoint de phase 3.

**Pourquoi cette priorité** : une provision coûte zéro dans le modèle de données et coûte un incrément partout ailleurs (constitution, principe 10). Le seul moment où elle est gratuite est celui-ci.

**Vérification indépendante** : la liste des provisions du registre §10 relevant du socle est confrontée aux tables créées ; chacune existe, chacune porte des privilèges restreints qui interdisent d'y bâtir quoi que ce soit.

**Scénarios d'acceptation** :

1. **Étant donné** le modèle appliqué, **quand** on cherche chaque provision du socle listée au registre §10, **alors** sa table existe.
2. **Étant donné** une provision, **quand** on lit son commentaire d'en-tête, **alors** il porte la mention « PROVISION — tables seulement, aucune logique au MVP » et la story qui l'introduit.
3. **Étant donné** `etablissements.partenaire`, **quand** on lit ses colonnes, **alors** le rattachement facultatif au compte Kaya du partenaire est nullable, **et** la colonne d'isolation `tenant_id` ne l'est pas.

---

### Récit 6 — L'index qui se tient à jour (Priorité : P3)

Le développeur ouvre `docs/modele-donnees/README.md` et y trouve, sans ouvrir un seul fichier SQL : l'index des fichiers et leur ordre d'application, le schéma des relations principales en texte, la liste des tables avec leur classe hors-ligne, et la règle de tenue opposable à la phase 3.

**Pourquoi cette priorité** : une source de vérité périmée est pire que pas de source du tout, parce qu'on continue de la croire. La règle de tenue est ce qui empêche le modèle de devenir une photo en trois cycles.

**Vérification indépendante** : lecture du README ; chaque table du modèle y figure avec sa classe, et la règle de tenue y est écrite noir sur blanc.

**Scénarios d'acceptation** :

1. **Étant donné** le README, **quand** on cherche l'ordre d'application, **alors** il est explicite et correspond à celui qu'utilise `scripts/verifier.sh`.
2. **Étant donné** le README, **quand** on cherche une table du modèle, **alors** elle figure dans la liste avec sa classe A/B/C/D.
3. **Étant donné** le README, **quand** on cherche la règle de tenue, **alors** elle énonce que toute migration de phase 3 met à jour le fichier de son schéma **dans le même changement**, et qu'un test compare le schéma réel aux fichiers et échoue sur tout écart.

---

### Cas limites

- **Une provision dont le `tenant_id` serait nullable.** `partenaire` est décrit avec un `tenant_id` nullable (cadrage §14.9, ETB-07, amendement A12) alors que la constitution impose `tenant_id` sur chaque table et une politique d'isolation sans exception. Une ligne au `tenant_id` nul serait invisible sous la politique — ou visible de tous si on relâchait la politique. **Résolution retenue** : deux colonnes distinctes — l'isolation reste portée par un `tenant_id` non nul (le tenant propriétaire de la fiche), et le rattachement facultatif au compte Kaya du partenaire est une seconde colonne nullable. L'intention d'A12 est préservée, l'invariant d'isolation ne l'est pas moins.
- **Un référentiel partagé entre tenants.** `module_activite`, `capacite`, `role`, `permission`, `plan`, `palier` sont des référentiels. Aucune exception à la politique n'est ouverte : ils sont **portés par un tenant**, semés au provisionnement (ADM-01), et le catalogue de l'éditeur appartient au tenant de l'éditeur — un tenant comme un autre.
- **Une table qu'aucun rôle applicatif n'a de raison de lire.** Elle reçoit `ENABLE`, `FORCE` et sa politique comme toutes les autres, et **aucun `GRANT`**. La porte P-01 inspecte le catalogue, pas les droits ; elle la voit donc quand même.
- **Une entité append-only qui doit changer d'état.** `evenement_outbox` est immuable et ne reçoit pas `UPDATE` ; le marquage « publié » ne peut donc pas être une colonne mise à jour. Le modèle porte la publication comme un **fait ajouté**, jamais comme une mutation de l'événement.
- **Une table qui porte deux classes selon l'opération.** `encaissement` est B en espèces et D en Mobile Money ; `reconciliation_orpheline` est A à la création et B à la résolution. Le commentaire d'en-tête déclare **les deux**, et les privilèges autorisent ce qui est implémenté au MVP, **rien de plus**.
- **Un `INSERT` ou un `UPDATE` de migration sur une table en `FORCE ROW LEVEL SECURITY`.** Il ne fonctionne pas, et **ne se plaint pas** : la politique s'applique au propriétaire, `current_setting` vaut NULL, aucune ligne n'est touchée, la migration réussit en n'écrivant rien. Consigné en commentaire avec les trois formes qui marchent.
- **Une contrainte d'exclusion ajoutée après coup.** Elle échoue sur les données existantes ; elle se pose à la création. Consigné, bien qu'aucune contrainte d'exclusion ne relève du socle (elles arrivent avec `occupation`, cycle D2).
- **Une numérotation qui doit être continue.** Une `SEQUENCE` PostgreSQL n'est pas transactionnelle et laisse des trous. Toute numérotation continue est un **compteur en table avec verrou de ligne** — jamais une `SEQUENCE`.
- **Une entité que le registre décrit sans la nommer.** Le relevé de position du géorepérage, le détail d'un comptage par coupure, l'encaissement d'abonnement, l'événement de webhook de paiement. C'est ce cycle qui pose leur nom et l'inscrit au registre §5 et §13.
- **Une entité déclarée au registre mais qui relève de D2.** Elle n'est pas créée ici, et P-02 ne s'en émeut pas : la comparaison va de la table vers le registre, jamais l'inverse.

---

## Exigences *(obligatoire)*

### Exigences fonctionnelles — livrables

- **FR-001** : Le cycle **DOIT** produire `docs/modele-donnees/` contenant `00-conventions.sql`, un fichier par schéma PostgreSQL du socle, et `README.md`. Il **NE DOIT** produire ni migration, ni crate Rust, ni endpoint, ni écran, ni workflow GitHub Actions.
- **FR-002** : `00-conventions.sql` **DOIT** définir : les rôles `kaya_owner` (propriétaire des tables) et `kaya_app` (rôle applicatif, distinct), les extensions requises (`btree_gist`, et `pgcrypto` si le coffre chiffré l'exige), les types et domaines partagés (montant entier d'unité mineure, code ISO 4217, identifiant, horodatages), le **patron RLS commenté** repris à l'identique par chaque table, et les conventions de nommage des contraintes et des index.
- **FR-003** : `00-conventions.sql` **DOIT** consigner en commentaire les **trois pièges de migration** destinés à la phase 3 : (a) l'écriture silencieusement vide sous `FORCE ROW LEVEL SECURITY`, avec les trois formes qui marchent — `ADD COLUMN … NOT NULL DEFAULT`, peupler un référentiel **avant** d'activer la RLS, ou poser dès la création une politique `FOR ALL TO kaya_owner` ; (b) la contrainte d'exclusion qui échoue sur une table déjà peuplée et se pose donc à la création ; (c) la `SEQUENCE` non transactionnelle, proscrite pour toute numérotation continue.
- **FR-004** : Chaque fichier de schéma **DOIT** commencer par le `CREATE SCHEMA` correspondant, puis enchaîner ses `CREATE TABLE` avec colonnes typées et **contraintes nommées** — aucune contrainte anonyme.
- **FR-005** : Chaque table **DOIT** porter un **commentaire d'en-tête** disant : à quoi elle sert, sa **classe A/B/C/D avec son code de branche** (`D1`/`C2`/`B3`/`A4`), et la **story qui l'introduit**. Quand la table porte deux classes selon l'opération, le commentaire les déclare toutes les deux.

### Exigences fonctionnelles — isolation multi-tenant

- **FR-006** : **Chaque** table **DOIT** porter une colonne `tenant_id` **non nulle**. Aucune exception, provisions comprises.
- **FR-007** : **Chaque** table **DOIT** recevoir `ENABLE ROW LEVEL SECURITY` **et** `FORCE ROW LEVEL SECURITY`.
- **FR-008** : **Chaque** table **DOIT** porter une politique `isolation_tenant` comportant **à la fois** une clause `USING` et une clause `WITH CHECK`, l'une et l'autre s'appuyant sur `current_setting('app.current_tenant', true)` — le **second argument `true` est obligatoire**, faute de quoi toute requête hors transaction applicative lève une exception au lieu de ne rien voir. Les trois éléments — colonne, activation forcée, politique — sont indissociables ; aucun n'est optionnel.
- **FR-009** : Chaque table **DOIT** porter, **dès sa création**, une politique permettant au propriétaire `kaya_owner` d'écrire — sans quoi toute migration de peuplement de la phase 3 réussirait en n'écrivant rien.

### Exigences fonctionnelles — les privilèges prouvent la classe

- **FR-010** : Les `GRANT` accordés à `kaya_app` **DOIVENT** refléter la classe hors-ligne déclarée au registre. Une entité **append-only de classe A** reçoit `SELECT, INSERT` et **jamais** `UPDATE` ni `DELETE`.
- **FR-011** : Une **provision sans logique** reçoit `SELECT` seul — ou **aucun privilège** quand rien du produit n'a de raison de la lire ; c'est cette absence qui la prouve provision.
- **FR-012** : `synchronisation.reconciliation_orpheline` **DOIT** recevoir `SELECT, INSERT` et **jamais** `UPDATE` : sa création est de classe A, sa résolution de classe B n'est pas implémentée au MVP, et le privilège absent est ce qui le prouve.
- **FR-013** : `synchronisation.evenement_outbox` **DOIT** être immuable et à rétention illimitée : ni `UPDATE`, ni `DELETE`. Sa charge utile est **financièrement complète et dénormalisée** — un encaissement y porte montant, mode, contrepartie, ventilation de taxes et référence de document, jamais un simple identifiant.
- **FR-014** : `comptes.journal_audit` **DOIT** être append-only par privilège : `SELECT, INSERT` seuls.

### Exigences fonctionnelles — les dix règles de modèle

- **FR-015** : L'identifiant de chaque table **DOIT** être un UUID **fourni par le client**, jamais généré par la base : aucune colonne d'identifiant ne porte de valeur par défaut. UUID v7, donc ordonné dans le temps. C'est ce qui rend le rejeu inoffensif.
- **FR-016** : Chaque table qui enregistre une écriture **DOIT** porter **deux horodatages distincts et jamais fusionnés** : `horodatage_client`, **nullable et purement indicatif**, et `cree_le`, `NOT NULL DEFAULT now()`, qui fait **autorité**. Un commentaire de colonne **DOIT** énoncer qu'aucune règle métier, fiscale, de clôture ou de durée ne s'appuie sur le premier.
- **FR-017** : **Aucune clé étrangère entre deux schémas de modules différents**, même quand la table cible existe. Tout rattachement inter-modules est une colonne d'identifiant nue, **commentée comme telle**, dont l'intégrité passe par un trait exposé. À l'intérieur d'un même schéma, les clés étrangères sont normales et souhaitables.
- **FR-018** : Tout montant **DOIT** être un **entier d'unité mineure**, accompagné du code **ISO 4217** porté par l'établissement (XOF, 0 décimale). Aucun flottant, nulle part.
- **FR-019** : Toute quantité **DOIT** être en `NUMERIC`, jamais en entier (amendement A2).
- **FR-020** : `00-conventions.sql` **DOIT** consigner comme **conventions opposables au cycle D2** les trois amendements qui portent sur des tables que le socle ne possède pas : `unite_mesure` obligatoire sur `article` avec défaut `unite` et table `conversion_unite_mesure` créée, non exploitée et **sans aucun `GRANT`** (A3) ; `cout_unitaire` nullable sur `mouvement_stock`, jamais renseigné au MVP (A4) ; `code_barre` et `article_parent_id` nullables sur `article`, non utilisés (A5).
- **FR-021** : **Module d'activité et capacité sont deux référentiels distincts**, tous deux en **table**, reliés par une table de déclaration de consommation qui porte le profil de stock (amendements A6 et A7). Seule la capacité `STOCK` au profil `SIMPLE` est implémentée ; les autres valeurs existent au référentiel et sont **refusées explicitement**, jamais ignorées.
- **FR-022** : `editeur.unite_facturable` **DOIT** être une **métrique abstraite** définie par la verticale — jamais « chambre » en dur (amendement A11).
- **FR-023** : Toute numérotation qui doit être **continue** **DOIT** être un **compteur en table** destiné à être verrouillé ligne à ligne, jamais une `SEQUENCE` PostgreSQL. Cela vaut au socle pour `documents.numerotation_document` et pour tout compteur de même nature. Un commentaire d'en-tête le dit à chaque compteur.

### Exigences fonctionnelles — index

- **FR-024** : Le modèle **DOIT** porter les index nécessaires aux recherches nommées dans les stories, au minimum : recherche d'une personne par **nom, téléphone ou numéro de pièce** (cible : moins de 300 ms sur 10 000 fiches) ; consultation du journal d'audit filtrée par **utilisateur, établissement, type d'action et période** (DIR-04) ; sélection des événements outbox **non encore publiés** (TRX-02) ; sélection des documents par **état de certification** (FIS-05) ; sélection des documents fiscaux par **établissement et période** (FIS-08, IMP-03) ; sélection des encaissements par **shift et mode de règlement** (CAI-05).
- **FR-025** : Chaque index **DOIT** être nommé et **DOIT** porter en commentaire la recherche qu'il sert — un index sans usage nommé n'est pas créé.

### Exigences fonctionnelles — provisions

- **FR-026** : Le modèle **DOIT** créer, **en tables seulement et sans aucune logique**, les provisions du socle : `mapping_comptable` et `exercice_comptable` ; `partenaire`, `demande_partenaire`, `compte_compensation`, `mouvement_compensation` ; `convention_inter_etablissements` ; `dispositif` ; `comptes.employe` ; `compte_client`, `encours`, `condition_reglement` ; `devis` et `document_commercial` ; le canal d'émission RNE et sa référence nullable.
- **FR-027** : `etablissements.partenaire` **DOIT** porter un `tenant_id` **non nul** (le tenant propriétaire de la fiche, qui porte l'isolation) **et** une colonne distincte **nullable** rattachant le partenaire à son propre compte Kaya lorsqu'il en a un — le partenaire sans compte étant le cas normal, celui avec compte l'enrichissement (amendement A12).

### Exigences fonctionnelles — registre des classes

- **FR-028** : Toute entité nommée par ce cycle et absente de `docs/registre-classes-offline.md` **DOIT** y être inscrite, avec sa **classe**, son **code de branche** et sa **story de référence**.
- **FR-029** : Les lignes déjà présentes au registre **DOIVENT** être honorées telles quelles — elles ont été décidées à froid et ne se réécrivent pas. Une divergence constatée entre le registre et le cadrage se corrige **en faveur du cadrage** et dans le même changement (registre §1).
- **FR-030** : Le **journal des modifications** du registre (§13) **DOIT** recevoir une ligne par nom posé par ce cycle et par décision de nommage arbitrée — jamais un décompte de tables ni un état d'avancement.

### Exigences fonctionnelles — README du modèle

- **FR-031** : `docs/modele-donnees/README.md` **DOIT** contenir : l'**index des fichiers** et leur **ordre d'application** ; le **schéma des relations principales en texte** ; la **liste de toutes les tables avec leur classe hors-ligne** ; et la **règle de tenue**.
- **FR-032** : La règle de tenue **DOIT** énoncer que *toute migration de phase 3 met à jour le fichier de son schéma dans le même changement, et qu'un test compare le schéma réel aux fichiers et échoue sur tout écart*.

### Exigences fonctionnelles — la commande unique

- **FR-033** : `scripts/verifier.sh` **DOIT** être **une seule commande**, documentée au README du dépôt, qui enchaîne tout ce qui doit passer et **sort en échec au premier contrôle rouge**.
- **FR-034** : **P-01** **DOIT** vérifier que le SQL de `docs/modele-donnees/` s'applique **dans l'ordre**, **sans erreur**, sur une base PostgreSQL **vierge** lancée par `docker compose`, **et** que chaque table porte `ENABLE` + `FORCE` + sa politique — par inspection de `pg_policies` et du catalogue. Le script crée la base, applique, inspecte, puis la **détruit**.
- **FR-035** : **P-02** **DOIT** vérifier que toute table du modèle a une classe déclarée dans `docs/registre-classes-offline.md`, dans le sens **table → registre** : une entité déclarée sans table est normale, une **table non déclarée est l'erreur**.
- **FR-036** : Chaque porte **DOIT** respecter le contrat de la constitution (principe 13) : déclarer son **périmètre inspecté**, **vérifier sa complétude**, **ne pas modifier** ce qu'elle inspecte, et **prouver que sa cible n'est pas vide**.
- **FR-037** : Chaque porte **DOIT** avoir son **test négatif**, exécuté au moins une fois et consigné : retirer une politique pour P-01, ajouter une table non déclarée pour P-02. Une porte sans test négatif est une décoration.
- **FR-038** : Le script **NE DOIT** contenir **aucune porte au-delà de P-01 et P-02**, et le cycle **NE DOIT** créer aucun fichier sous `.github/workflows/`.

### Entités clés

> Classes reprises de `docs/registre-classes-offline.md`, qui fait foi. Les entités marquées **★** sont **nommées par ce cycle** et à inscrire au registre.

**`etablissements`** — `tenant` (C·C2) · `etablissement` (C·C2 — juridiction, classement, commune, fuseau, devise ISO 4217, NCC) · `module_activite` (C·C2) · `capacite` (C·C2) · `module_capacite` (C·C2, porte le profil de stock) · `profil_stock` (C·C2) · `etablissement_module` (C·C2) · `point_de_vente` (C·C2) · `table_pdv` (C·C2) · `parametre_catalogue` (C·C2) · `parametre_configuration` (C·C2, chaîne d'héritage tenant → établissement → module → point de vente) · `branding` (C·C2) · `note_etablissement` (A·A4) · **provisions** : `partenaire` (C·C2), `demande_partenaire` (C·C2), `compte_compensation` (B·B3), `mouvement_compensation` (B·B3), `convention_inter_etablissements` (C·C2), `dispositif` (A·A4).

**`comptes`** — `personne` (C·C2 — porte `numero_piece`, `type_piece`, `piece_capturee_le` pour la purge TRX-06) · `compte` (C·C2) · `methode_authentification` (C·C2) · `role` (C·C2) · `permission` (C·C2) · `role_permission` (C·C2) · `compte_role` (C·C2, portée par établissement) · `appareil_enrole` (C·C2) · `journal_audit` (A·A4, immuable) · ★`releve_position` (A·A4 — le relevé de géorepérage souple, décrit au registre §5.2 sans être nommé) · **provision** : `employe` (C·C2).

**`caisse`** — `caisse` (C·C2) · `shift` (B·B3) · `encaissement` (B·B3 espèces/virement/à crédit, **D·D1** Mobile Money/carte) · `sortie_de_caisse` (B·B3) · `comptage` (B·B3) · ★`coupure_comptee` (B·B3 — le détail du comptage par coupure, CAI-04) · `ecart_de_caisse` (B·B3) · `cloture_shift` (B·B3) · `cloture_journaliere` (B·B3, atomique) · **provisions** : `compte_client` (B·B3), `encours` (B·B3), `condition_reglement` (B·B3).

**`fiscalite`** — `parametrage_fiscal` (C·C2) · `cle_fne` (C·C2, coffre chiffré par tenant) · `document_fiscal` (D·D1) · `item_certifie` (D·D1 — persiste les `id` d'items retournés par l'API, sans lesquels aucun avoir n'est possible ; porte la référence RNE nullable) · `avoir` (D·D1, par quantité) · `file_certification` (D·D1, états `EN_ATTENTE → SOUMISE → CERTIFIEE`, branches `ECHEC` et `INDETERMINEE` **jamais rejouée**) · `compteur_stickers` (D·D1) · `etat_reversement_communal` (A·A4, dérivé) · **provisions** : `devis` (B·B3), `document_commercial` (B·B3).

**`documents`** — `document_operationnel` (A·A4 en brouillon, **B·B3** à l'émission numérotée) · `numerotation_document` (B·B3, **compteur en table à verrou de ligne**) · `modele_document` (C·C2).

**`synchronisation`** — `evenement_outbox` (A·A4 — grand livre permanent, immuable, rétention illimitée, séquence monotone par établissement) · ★`publication_outbox` (A·A4 — l'événement étant immuable, la publication est un **fait ajouté**, jamais une mutation) · `reconciliation_orpheline` (A·A4 à la création, **B·B3** à la résolution non implémentée).

**`pilotage`** — `alerte_configurable` (C·C2). *Tout le reste du pilotage est **dérivé** — tableaux de bord, KPI, rapports périodiques — et ne reçoit aucune table ; le fichier le dit en commentaire.*

**`editeur`** — `plan` (C·C2) · `palier` (C·C2) · `abonnement` (C·C2) · `unite_facturable` (C·C2, **métrique abstraite**) · `telemetrie_parc` (A·A4) · `bundle_diagnostic` (A·A4) · ★`encaissement_abonnement` (D·D1) · ★`evenement_webhook_paiement` (D·D1 — idempotence du webhook, validation HMAC).

**`metriques`** — `evenement_metrique` (A·A4, idempotent par UUID) · `agregat_quotidien` (A·A4, dérivé, recalculable).

**`comptabilite`** *(provisions seules)* — `mapping_comptable` (C·C2) · `exercice_comptable` (C·C2, une période close n'accepte plus d'écriture).

---

## Critères de réussite *(obligatoire)*

### Résultats mesurables

- **SC-001** : Le modèle complet s'applique sur une base vierge en **une commande**, **sans aucune erreur**, et la base est détruite ensuite sans laisser de conteneur ni de volume.
- **SC-002** : **100 %** des tables du modèle portent les trois éléments — `tenant_id` non nul, `ENABLE` **et** `FORCE`, politique `isolation_tenant` avec `USING` **et** `WITH CHECK`. L'écart toléré est **zéro table**.
- **SC-003** : **100 %** des politiques utilisent le second argument `true` de `current_setting` — aucune requête hors contexte de tenant ne lève d'exception.
- **SC-004** : **Zéro** clé étrangère entre deux schémas de modules différents, constaté par inspection du catalogue.
- **SC-005** : **100 %** des tables du modèle ont une classe déclarée au registre ; l'écart toléré est **zéro table non déclarée**.
- **SC-006** : **100 %** des tables portent un commentaire d'en-tête donnant leur classe, leur code de branche et leur story.
- **SC-007** : Les **deux** portes échouent quand on les casse volontairement, et l'échec **nomme la cause** — vérifié une fois chacune et consigné.
- **SC-008** : `scripts/verifier.sh` s'exécute en **moins de deux minutes** sur le poste de développement — au-delà, on cesse de le lancer, et c'est le déclencheur documenté du passage au serveur en phase 3.
- **SC-009** : Une recherche de personne par nom, téléphone ou numéro de pièce répond en **moins de 300 ms sur 10 000 fiches**, mesurée sur un jeu de volume.
- **SC-010** : **Zéro** montant en flottant et **zéro** quantité en entier dans l'ensemble du modèle.
- **SC-011** : **Zéro** colonne d'identifiant portant une valeur par défaut générée par la base.
- **SC-012** : **Zéro** fichier créé sous `.github/workflows/`, **zéro** migration, **zéro** fichier Rust, **zéro** écran.

---

## Hypothèses

Les points suivants n'étaient pas tranchés par l'entrée ; ils le sont ici par défaut raisonnable, et chacun est réversible sans migration tant que la phase 3 n'a pas commencé.

1. **Un onzième fichier, `comptabilite.sql`.** L'entrée énumère dix fichiers puis ajoute `mapping_comptable` et `exercice_comptable` « en provision » sans leur assigner de fichier. Les placer dans `synchronisation.sql` imposerait un déplacement inter-schéma le jour où le crate comptable naîtra — et la règle « aucune FK entre schémas de modules » interdit de toute façon de les y coupler. Un schéma `comptabilite` dédié, sans crate, coûte un fichier aujourd'hui et rien plus tard. **C'est le seul écart à la liste de fichiers de l'entrée, et il est délibéré.**
2. **`partenaire`, `demande_partenaire`, `compte_compensation`, `mouvement_compensation`, `convention_inter_etablissements` et `dispositif` vivent dans `etablissements.sql`** — ce sont des référentiels de l'établissement (ETB-07, cadrage §4.3 et §14.21), et aucun autre schéma du socle ne les accueillerait mieux.
3. **`convention_inter_etablissements` est créée bien que l'amendement A12 la déclare remplacée par `partenaire`.** Le registre §10 la nomme, et le registre est normatif. Elle est créée **sans aucun `GRANT`**, avec un commentaire d'en-tête renvoyant à A12 — l'absence de privilège dit qu'elle n'est pas la voie retenue, mieux qu'une suppression silencieuse ne le dirait.
4. **Aucune exception à la politique d'isolation pour les référentiels partagés.** `module_activite`, `capacite`, `role`, `permission`, `plan`, `palier` sont portés par un tenant et semés au provisionnement (ADM-01). Le catalogue de l'éditeur appartient au tenant de l'éditeur, qui est un tenant comme un autre. C'est la seule lecture compatible avec « `tenant_id` sur CHAQUE table » sans relâcher la politique.
5. **La référence RNE est une colonne nullable, pas une table.** Le cadrage §9.8 et le registre §10 la décrivent comme `ligne_facture.rne_ref` ; au socle, l'item certifié est ce qui s'en rapproche, et il la porte. Le canal d'émission (`FneApi` / `Terne`) est une colonne du document fiscal.
6. **L'attestation d'intégrité ne reçoit pas de table** : son résultat est un attribut de l'appareil enrôlé (CPT-06). Le relevé de position, lui, en reçoit une — c'est un signal d'audit répété dans le temps, pas un état courant.
7. **Le marquage « publié » de l'outbox n'est pas une mutation.** L'événement étant immuable par privilège, la publication est portée comme un fait ajouté. Le mécanisme exact relève du fichier `synchronisation.sql` ; l'exigence est qu'aucun `UPDATE` ne soit accordé sur l'événement.
8. **PostgreSQL et Docker Compose sont disponibles sur le poste de développement.** La version exacte de PostgreSQL est celle de `docs/versions-reference.md` §2, vérifiée au moment de l'écriture du `docker-compose.yml` et inscrite dans le même changement (constitution, principe 11).
9. **Aucun jeu de données de volume n'existe encore.** La mesure de SC-009 se fait sur un jeu généré par le script de vérification ou à la main ; elle ne dépend d'aucun seed de phase 3.
10. **Les schémas `hebergement`, `ventes`, `pressing` et `stocks` sont hors périmètre** (cycle D2). Les entités du registre §6, §7 et §8 ne sont donc pas créées, et P-02 ne s'en émeut pas.

## Dépendances

- `docs/registre-classes-offline.md` — **entrée directe** du cycle et **seul document extérieur que ce cycle modifie**.
- `docs/cadrage-v1.md`, `docs/user-stories-v1.md`, `docs/Kaya_Vision_Plateforme.md` §8 et §14.5 — sources des entités et des contraintes de modèle. Lus, non modifiés.
- `.specify/memory/constitution.md` — principes 0, 1b, 2, 3, 5, 6, 10 et 13. En cas de conflit, elle prime.
- `docs/versions-reference.md` — version de PostgreSQL, à inscrire dans le même changement que le `docker-compose.yml`.

## Hors périmètre

- Les schémas `hebergement`, `ventes`, `pressing` et `stocks` — cycle **D2**.
- Toute migration sqlx, tout code Rust, tout trait, tout endpoint, tout écran, toute donnée simulée.
- Les portes **P-03** et **P-04** — elles arrivent avec le premier manifeste et avec la phase 2.
- Tout workflow GitHub Actions — le serveur de CI vient en phase 3 et lancera ce script **sans le modifier**.
- Les seeds (TRX-05a/05b) — mécanique rejouable, à part des migrations, en phase 3.
