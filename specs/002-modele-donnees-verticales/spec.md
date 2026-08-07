# Spécification de fonctionnalité : Modèle de données des capacités et des verticales (cycle D2)

**Répertoire de fonctionnalité** : `specs/002-modele-donnees-verticales`

**Branche** : `main` *(aucune branche dédiée créée — aucune extension `before_specify` n'est enregistrée dans ce dépôt)*

**Créée le** : 2026-08-07

**Statut** : Brouillon — **amendée le 2026-08-07 par la planification** sur un point, tracé ci-dessous

**Phase** : 1 — le modèle de données (constitution, principe 0). **Second et dernier cycle de la phase.**

**Entrée** : description utilisateur du cycle D2 de `docs/Kaya_Prompts_SpecKit.md` §3 — « LE MODÈLE DE DONNÉES DES CAPACITÉS ET DES VERTICALES, EN SQL », avec la mention « mêmes règles, mêmes livrables et mêmes interdits que le cycle D1 ».

---

## Ce que ce cycle produit, et ce qu'il ne produit pas

| Produit | Non produit |
|---|---|
| Quatre fichiers SQL de plus dans `docs/modele-donnees/` : `stocks`, `hebergement`, `ventes`, `pressing` | Aucune migration sqlx |
| La mise à jour de `docs/modele-donnees/README.md` — index, relations, classes, décomptes | Aucun crate Rust, aucun trait, aucun endpoint |
| La mise à jour de `docs/registre-classes-offline.md` pour les entités que ce cycle nomme | Aucun écran, aucune donnée simulée |
| Le relèvement des **planchers de non-vacuité** de P-01 et P-02 dans `scripts/verifier.sh` | **Aucune porte au-delà de P-05** — P-01 et P-02 ne changent pas de contrat, et leur périmètre s'élargit sans qu'on les modifie |
| **La porte P-05** — aucune clé étrangère entre deux schémas — avec son test négatif | **Aucun workflow GitHub Actions** (le serveur de CI vient en phase 3) |
| Le rapport de cycle des constats qu'aucune porte ne couvre | Aucune modification des onze fichiers du socle *(hors README)* |

> **Amendement du 2026-08-07 — la porte P-05.** Cette spécification disait initialement « aucune porte nouvelle ». La planification a établi que le cycle D1 avait **explicitement désigné celui-ci** comme le moment où la porte « aucune clé étrangère entre deux schémas » serait justifiée, cible non vide à l'appui — et que le coût de son absence est manifeste : une clé étrangère ajoutée de bonne foi sur `ligne_sejour.ligne_commande_id` **casse le chemin nominal du conflit le plus fréquent du produit**, silencieusement, jusqu'à la première coupure réseau en exploitation. **FR-044, FR-045, SC-012, SC-013 et la section « Hors périmètre » sont corrigés en conséquence.** Motifs complets : [research.md D-23](./research.md) et [contracts/verifier-p05.md](./contracts/verifier-p05.md). Un conflit constaté ne se tranche pas en silence (constitution, gouvernance).

**La règle de reprise, énoncée une fois pour tout le cycle.** Le contrat [`specs/001-modele-donnees-socle/contracts/conventions-sql.md`](../001-modele-donnees-socle/contracts/conventions-sql.md) — structure de fichier, format du commentaire d'en-tête, matrice des privilèges, cinq règles de contenu, trois éléments RLS, justification des index — **s'applique intégralement et à la lettre**. Il n'est pas reformulé ici : une reformulation dérive. Les exigences ci-dessous ne portent que sur **ce que D2 ajoute** ou sur **ce que D2 est le premier à exercer**.

---

## Scénarios utilisateur et vérification *(obligatoire)*

> **Aucun persona métier.** Ce cycle ne produit pas d'interface. L'unique acteur est **le développeur solo**, et les bénéficiaires sont les cycles suivants : la phase 2 donne à ses données simulées la forme exacte de ces tables, la phase 3 y adosse ses migrations.

### Récit 1 — Le chevauchement devient impossible au niveau de la base (Priorité : P1)

Le développeur ouvre deux sessions PostgreSQL et tente d'attribuer la même unité sur deux intervalles qui se recouvrent. **Une seule des deux transactions réussit** ; l'autre est rejetée par la base, pas par un verrou applicatif, pas par une lecture préalable. Il recommence avec deux intervalles jointifs séparés par un temps de remise en état : la seconde est rejetée elle aussi, parce que **la remise en état est dans l'intervalle d'indisponibilité**, pas gérée à part.

**Pourquoi cette priorité** : c'est la décision la plus structurante et la plus irréversible du produit (cadrage §5.1, constitution principe 4). Le marché pratique massivement le passage horaire et la demi-journée ; une paire de dates rendrait le produit inapte à son marché principal, et le rattraper coûterait la migration de toutes les occupations. Un verrou applicatif se contourne par un second processus ; une contrainte d'exclusion ne se contourne pas.

**Vérification indépendante** : deux transactions concurrentes sur une base fraîchement montée par la commande unique, sans une ligne de code applicatif. Testable sans aucun autre livrable du cycle.

**Scénarios d'acceptation** :

1. **Étant donné** une occupation posée sur une unité de `[14h00, 18h00)`, **quand** une seconde occupation `[16h00, 20h00)` est insérée sur la même unité, **alors** la base la rejette par violation de contrainte d'exclusion, en nommant la contrainte.
2. **Étant donné** deux transactions concurrentes insérant des intervalles chevauchants sur la même unité, **quand** elles sont validées, **alors** **exactement une** réussit — sans verrou applicatif, sans `SELECT` préalable.
3. **Étant donné** une occupation de passage terminée à 18h00 et un temps de remise en état de 30 min pour sa catégorie et sa formule, **quand** une occupation débutant à 18h15 est insérée, **alors** elle est rejetée : l'intervalle d'indisponibilité court jusqu'à 18h30.
4. **Étant donné** une occupation **annulée**, **quand** une nouvelle occupation couvrant le même intervalle est insérée, **alors** elle est **acceptée** — une occupation annulée ne réserve plus rien.
5. **Étant donné** deux unités distinctes, **quand** deux occupations parfaitement superposées sont insérées, une par unité, **alors** les deux réussissent.
6. **Étant donné** la table `occupation`, **quand** on inspecte sa définition, **alors** l'intervalle est un **`tstzrange`** et **aucune paire de colonnes de date** ne porte la période.

---

### Récit 2 — Les quatre fichiers s'appliquent et passent les portes (Priorité : P1)

Le développeur lance `scripts/verifier.sh`. La base vierge reçoit les onze fichiers du socle **puis** les quatre nouveaux, dans l'ordre porté par leur préfixe. Tout passe. Chaque table nouvelle porte les trois éléments d'isolation, et chacune a sa classe au registre. **P-01 et P-02 n'ont pas changé de contrat** — seuls leurs planchers de non-vacuité ont été relevés. **Une troisième porte, P-05, refuse désormais toute clé étrangère entre deux schémas.**

**Pourquoi cette priorité** : un modèle qui ne s'applique pas n'est pas un modèle. Et une porte dont le périmètre s'élargit sans qu'on la touche est la preuve que le dispositif du D1 tient : `*.sql` trié, comparaison table → registre, aucune liste à maintenir ailleurs.

**Vérification indépendante** : la commande unique sur une base éphémère, détruite ensuite. Aucun autre livrable requis.

**Scénarios d'acceptation** :

1. **Étant donné** une base PostgreSQL vierge, **quand** la commande unique applique `docs/modele-donnees/*.sql` trié, **alors** aucune commande ne retourne d'erreur et les quatre schémas nouveaux existent.
2. **Étant donné** le modèle appliqué, **quand** on compare la liste des tables à celles portant `relrowsecurity` **et** `relforcerowsecurity`, **alors** les deux listes sont identiques — le socle et les verticales confondus.
3. **Étant donné** chaque table nouvelle, **quand** on inspecte `pg_policies`, **alors** elle porte `isolation_tenant` en `USING` **et** `WITH CHECK`, avec le second argument `true`, **et** `administration_editeur FOR ALL TO kaya_owner`, dans la forme **strictement identique** à celle du socle.
4. **Étant donné** les planchers de non-vacuité, **quand** on les lit, **alors** ils ont été relevés à une valeur qui reste **juste sous** le compte réel — un plancher qu'une extraction à moitié cassée franchirait encore ne refuse rien.
5. **Étant donné** le fichier `scripts/verifier.sh`, **quand** on en compare la logique à celle du cycle D1, **alors** **P-01 et P-02 n'ont changé ni de contrat ni de mécanisme**, et la seule porte ajoutée est **P-05**, dont le contrat en cinq points est tenu et le test négatif exécuté.

---

### Récit 3 — Les privilèges disent la classe, y compris quand il y en a deux (Priorité : P1)

Le développeur lit les `GRANT` d'une table de vente et en déduit son régime sans lire un commentaire. `lot_envoi` reçoit `SELECT, INSERT` : un second envoi crée un second lot, il ne modifie pas le premier. `taxe_sejour_constat` de même : le constat est figé au départ. `ligne_commande` reçoit `SELECT, INSERT, UPDATE` — elle est **A à la saisie et B à l'annulation après envoi**, et son commentaire d'en-tête déclare **les deux**.

**Pourquoi cette priorité** : c'est le privilège qui **prouve** la propriété ; un commentaire ne prouve rien et se périme. Et la double classe n'est pas une bizarrerie à cacher : c'est le cas normal dans les verticales, où la même ligne se saisit hors ligne et s'annule en ligne.

**Vérification indépendante** : inspection des privilèges de `kaya_app` sur chaque table nouvelle, confrontée aux classes du registre §6, §7 et §8.

**Scénarios d'acceptation** :

1. **Étant donné** `ventes.lot_envoi`, **quand** on inspecte ses privilèges, **alors** `SELECT` et `INSERT` sont accordés, `UPDATE` et `DELETE` sont **absents**.
2. **Étant donné** `hebergement.taxe_sejour_constat`, **quand** on inspecte ses privilèges, **alors** même régime — le constat du départ ne se récrit pas.
3. **Étant donné** `ventes.ligne_commande`, **quand** on lit son commentaire d'en-tête, **alors** il déclare **A à la saisie et à la modification avant envoi**, **B à l'annulation après envoi**, et les privilèges autorisent les deux.
4. **Étant donné** toute table nouvelle, **quand** on inspecte ses privilèges, **alors** `DELETE` n'est accordé **nulle part**, et aucun `GRANT … ON ALL TABLES IN SCHEMA` n'existe.
5. **Étant donné** `ventes.conversion_unite_mesure`, **quand** on inspecte ses privilèges, **alors** `kaya_app` n'en a **aucun, pas même `SELECT`** — c'est cette absence qui la prouve provision (amendement A3, D1 FR-020).

---

### Récit 4 — Les deux relations inter-modules sont des sagas, et l'orphelin est le chemin nominal (Priorité : P2)

Le développeur cherche la clé étrangère qui relierait une ligne de commande à la note d'un séjour. **Il n'en trouve aucune** : il trouve une colonne d'identifiant nue, et un commentaire qui dit pourquoi. Même chose pour le bon de dépôt rattaché à un séjour. Le commentaire nomme la compensation : quand la note est déjà arrêtée, l'écriture part en réconciliation à résolution humaine — **et c'est le chemin nominal**, pas le cas d'erreur.

**Pourquoi cette priorité** : sans le commentaire, le cycle qui relira le fichier prendra l'absence de `REFERENCES` pour un oubli et l'ajoutera — et une clé étrangère posée là ferait échouer en base l'écriture orpheline que le produit doit accepter puis réconcilier. C'est le conflit le plus fréquent du produit (registre §12, cas piège 2).

**Vérification indépendante** : inspection du catalogue — zéro contrainte de clé étrangère dont les deux tables appartiennent à des schémas différents — plus lecture des deux commentaires de colonne.

**Scénarios d'acceptation** :

1. **Étant donné** le modèle appliqué, **quand** on interroge `pg_constraint` sur les contraintes de type clé étrangère, **alors** **aucune** ne joint deux schémas différents.
2. **Étant donné** la ligne de note de séjour issue d'une consommation de point de vente, **quand** on lit la colonne qui désigne la ligne de commande d'origine, **alors** elle est **nue, nullable et commentée** : pas de `REFERENCES`, saga à compensation explicite, cas orphelin nominal.
3. **Étant donné** le bon de dépôt du pressing rattaché au séjour d'un client logé, **quand** on lit la colonne qui désigne le séjour, **alors** même forme et même commentaire.
4. **Étant donné** ces deux rattachements, **quand** on cherche où atterrit une écriture dont la cible est close, **alors** le commentaire renvoie à `synchronisation.reconciliation_orpheline`, créée au cycle D1 — **aucune table de réconciliation nouvelle n'est créée**.
5. **Étant donné** une ligne de note de séjour **sans** ligne de commande d'origine, **quand** on l'insère, **alors** elle est acceptée : une consommation saisie directement sur la note est le cas courant.

---

### Récit 5 — Les référentiels portent ce qu'une colonne ne porterait pas (Priorité : P2)

Le développeur cherche la durée de remise en état d'une chambre : il ne la trouve pas sur la catégorie, il la trouve dans une **table** indexée par catégorie **et** par formule — 30 minutes en passage, 2 heures en nuitée, 1 heure en demi-journée, sur la même catégorie. Il cherche « cuisine » : il ne trouve pas d'énumération, il trouve une **table par établissement**, et la destination est **facultative** sur l'article.

**Pourquoi cette priorité** : une colonne `temps_remise_en_etat` sur la catégorie ne porte pas la formule, et il faudrait la migrer au premier exploitant qui distingue ses durées. Une énumération `cuisine | bar` imposerait une migration au premier client qui a **deux** cuisines. Ces deux choix coûtent une table aujourd'hui et une migration de production plus tard.

**Vérification indépendante** : lecture du schéma — la durée de remise en état est une table à clé composée, la destination de préparation est une table portée par l'établissement, et la colonne qui la référence sur l'article est nullable.

**Scénarios d'acceptation** :

1. **Étant donné** `hebergement.temps_remise_en_etat`, **quand** on lit sa contrainte d'unicité, **alors** elle porte sur **le couple catégorie + formule** — deux formules d'une même catégorie ont deux durées.
2. **Étant donné** `ventes.destination_preparation`, **quand** on lit son rattachement, **alors** elle appartient à l'**établissement** et non au point de vente : la cuisine sert plusieurs points de vente (registre §8.1).
3. **Étant donné** un article **sans** destination propre, **quand** on lit le commentaire de la colonne, **alors** il énonce le repli : l'envoi suit la destination par défaut du point de vente, portée par la clé de configuration `ventes.destination_preparation_defaut` créée au cycle D1 — **pour qu'aucun bon ne manque**.
4. **Étant donné** le barème de passage et les plages de demi-journée, **quand** on les cherche, **alors** ce sont des **tables** de référentiel tarifaire, pas des clés du catalogue de configuration (`docs/user-stories-v1.md`, note « quatre valeurs HEB »).
5. **Étant donné** la formule, **quand** on lit ses colonnes fiscales, **alors** `assujettie_taxe_nuitee` et la **règle de conversion** y figurent en paramètres, **jamais en constantes** — le traitement fiscal du passage et de la demi-journée est éditable (cadrage §5.5).

---

### Récit 6 — Les provisions des verticales existent en table, et nulle part ailleurs (Priorité : P3)

Le développeur retrouve dans le modèle chaque provision du registre §10 qui relève de ces quatre schémas : la prestation incluse attachée à la formule, les quatre tables de contrat de location, la conversion d'unité de mesure, le coût unitaire du mouvement de stock, le code-barre et l'article parent. Aucune ne porte de logique ; leurs privilèges interdisent d'y bâtir quoi que ce soit.

**Pourquoi cette priorité** : une provision coûte zéro dans le modèle de données et coûte un incrément partout ailleurs (constitution, principe 10). **C'est le dernier cycle où elle est gratuite** — la phase 1 se termine ici.

**Vérification indépendante** : la liste des provisions du registre §10 relevant de `stocks`, `hebergement`, `ventes` et `pressing` est confrontée aux tables créées ; chacune existe, chacune porte la mention littérale et des privilèges restreints.

**Scénarios d'acceptation** :

1. **Étant donné** le modèle appliqué, **quand** on cherche `prestation_incluse`, `contrat_location`, `caution`, `charge_locative`, `etat_des_lieux` et `conversion_unite_mesure`, **alors** chacune existe.
2. **Étant donné** une provision, **quand** on lit son commentaire d'en-tête, **alors** il porte la mention littérale « PROVISION — tables seulement, aucune logique au MVP » et la story qui l'introduit.
3. **Étant donné** `stocks.mouvement_stock`, **quand** on lit `cout_unitaire`, **alors** elle est **nullable** et son commentaire dit qu'elle n'est **jamais renseignée au MVP** (amendement A4).
4. **Étant donné** `ventes.article`, **quand** on lit `code_barre` et `article_parent_id`, **alors** elles sont **nullables** et commentées comme non utilisées (amendement A5) ; **et** `unite_mesure` est **obligatoire**, de valeur par défaut `unite` (amendement A3).
5. **Étant donné** le **décompte** d'une prestation incluse (registre §10, incrément 2), **quand** on le cherche, **alors** **aucune table ne lui est créée** — et le fichier le dit, plutôt que d'inventer une table qu'aucune story du MVP n'écrit.

---

### Récit 7 — L'index du modèle et le registre restent vrais (Priorité : P3)

Le développeur ouvre `docs/modele-donnees/README.md` et y trouve les quinze fichiers, les quatorze schémas, toutes les tables avec leur classe, et un diagramme de relations où **aucune flèche pleine ne traverse un schéma**. Il ouvre le registre : chaque entité que ce cycle a nommée y figure, avec sa classe, sa branche et sa story, et le journal des modifications dit **pourquoi** ce nom-là.

**Pourquoi cette priorité** : une source de vérité périmée est pire que pas de source du tout, parce qu'on continue de la croire. Le README du D1 est aujourd'hui exact ; il devient faux à la première table de D2 non inscrite.

**Vérification indépendante** : lecture croisée du README et de la base appliquée ; chaque table du catalogue figure au README avec sa classe, et réciproquement.

**Scénarios d'acceptation** :

1. **Étant donné** le README, **quand** on lit le tableau de l'ordre d'application, **alors** il énumère les quinze fichiers avec leur schéma, leur compte de tables et leur compte de provisions.
2. **Étant donné** le README, **quand** on lit la liste des schémas déclarés — **opposable à P-01** —, **alors** les quatre schémas nouveaux y figurent.
3. **Étant donné** le diagramme de relations, **quand** on suit un rattachement inter-modules, **alors** il est tracé de la notation « rattachement nu », jamais de celle de la clé étrangère.
4. **Étant donné** le registre, **quand** on cherche une entité nommée par ce cycle, **alors** elle y figure avec sa classe, sa branche et sa story, et le journal §13 porte **une ligne par nom posé**, disant contre quoi il a été retenu — jamais un décompte de tables ni un état d'avancement.
5. **Étant donné** une ligne **déjà présente** au registre §6, §7 ou §8, **quand** on la compare au modèle livré, **alors** elle est **honorée telle quelle** — ces lignes ont été décidées à froid et ne se réécrivent pas.

---

### Cas limites

- **Une contrainte d'exclusion ajoutée après coup.** Elle échoue sur les données existantes. Le cycle D1 l'avait consignée sans avoir de contrainte à poser ; **D2 est le premier à en poser une**, et elle se pose **à la création de la table**, jamais par `ALTER`.
- **Une occupation annulée qui continuerait de bloquer.** La contrainte d'exclusion doit être **partielle** : une occupation annulée ne réserve plus rien, sinon toute annulation rendrait l'unité définitivement inlouable sur son intervalle.
- **La période facturée et la période d'indisponibilité ne sont pas la même.** La remise en état est **dans** l'indisponibilité et **hors** de la facturation. Les confondre facture le ménage au client, ou laisse attribuer une unité encore sale. L'occupation porte donc les deux, et la contrainte d'exclusion porte sur l'indisponibilité.
- **Le statut d'occupation d'une unité n'est pas une colonne.** « Libre », « occupée », « réservée » sont **dérivés** des occupations (registre §7.2). Seul le **statut ménage** est librement modifiable, en classe A, dernier-écrit-gagne — le seul cas du produit. Les confondre produit des doubles attributions (cadrage §11.4).
- **La mise hors service d'une unité est de classe B, alors que l'unité est un référentiel de classe C.** Elle est donc portée comme une **occupation d'un motif de maintenance**, et non comme une colonne de l'unité : elle bénéficie ainsi de la contrainte d'exclusion sans qu'un second mécanisme de disponibilité n'existe. Deux mécanismes se contrediraient le jour où l'un des deux ne serait plus écrit.
- **Une table qui porte deux classes selon l'opération.** C'est le cas **normal** ici : `commande` est A à l'ouverture et à la réception d'un panier QR, B à la validation ; `ligne_commande` est A à la saisie et B à l'annulation après envoi ; `bon_depot` est B à la création et au retrait, A pour ses transitions intermédiaires ; `arrhes` suit la classe du mode de règlement — B en espèces, D en Mobile Money. Le commentaire d'en-tête déclare **les deux**, et les privilèges permettent **les deux**.
- **Une entité de classe B dont aucune ligne ne se récrit.** `mouvement_stock` et `inventaire` sont de classe B ; un mouvement constaté ne se corrige pas, il se contre-passe. Le privilège peut donc être **plus strict** que la classe ne l'exige — comme les six tables de caisse du socle. C'est une décision de forme, pas de classe, et le commentaire le dit pour qu'on ne la relise pas comme une erreur.
- **Une décision ouverte non tranchée.** `mouvement_stock` est **B** par décision par défaut (O-02, cadrage B-05) ; le crate d'accueil de la surface QR n'est pas arrêté (O-03). Le registre est formel : jusqu'à l'arbitrage, **la classe inscrite s'applique**, et c'est toujours la plus stricte des options. Ce cycle ne tranche ni l'une ni l'autre.
- **Une numérotation qui doit être continue.** Trois compteurs arrivent ici — fiche de police, référence de retrait « à emporter », numéro de retrait pressing. **Aucune `SEQUENCE`** : un trou est une pièce de linge, ou une fiche de police, dont personne ne sait si elle a existé.
- **Un référentiel partagé entre modules.** L'article de vente et l'article de stock vivent dans deux schémas de modules différents ; leur liaison est une table du module qui la consomme, avec des identifiants nus des deux côtés.
- **Une entité que le registre décrit sans la nommer.** La ligne d'un inventaire — le registre §6.1 nomme `inventaire` « saisie, écart » sans nommer la table qui porte l'article compté. C'est ce cycle qui pose le nom et l'inscrit au registre §13.
- **Deux verticales sans contenu.** `restauration` et `bar` sont des **coquilles vides** : leur tronc commun vit dans `socle/ventes` (registre §8). Aucun schéma, aucun fichier, aucune table — et le fichier `ventes` le dit en tête, plutôt que de laisser croire à un oubli.
- **Un préfixe numérique à trois chiffres.** Il casserait l'ordre : en tri lexicographique, `100-` vient **avant** `20-`, et donc avant tout le socle. La numérotation reste à **deux chiffres**, et ce piège est consigné au README pour le cycle qui voudra intercaler un quinzième fichier.

---

## Exigences *(obligatoire)*

### Exigences fonctionnelles — livrables et périmètre

- **FR-001** : Le cycle **DOIT** produire quatre fichiers de schéma dans `docs/modele-donnees/` — `stocks`, `hebergement`, `ventes`, `pressing` — un par schéma PostgreSQL. Il **NE DOIT** produire ni migration, ni crate Rust, ni endpoint, ni écran, ni donnée simulée, ni workflow GitHub Actions.
- **FR-002** : Le cycle **NE DOIT MODIFIER** aucun des onze fichiers SQL du socle. Toute contrainte que D2 découvrirait sur une table du socle est **consignée**, jamais appliquée en silence.
- **FR-003** : Chaque fichier **DOIT** honorer intégralement le contrat `specs/001-modele-donnees-socle/contracts/conventions-sql.md` : structure de fichier, ordre `activation → politique → privilèges → index`, commentaire d'en-tête au format fixe, matrice des privilèges, cinq règles de contenu, forme unique et littérale des trois éléments RLS, et un commentaire d'usage par index.
- **FR-004** : L'ordre d'application **DOIT** rester porté par le **seul préfixe numérique du nom de fichier**, à **deux chiffres**, sans qu'aucune liste d'ordre n'existe ailleurs. L'ordre lexicographique **DOIT** placer les capacités et les verticales **après** tout le socle, et `ventes` **dans** la plage du socle — sa famille de crate est `socle/`, et le nom du fichier ne doit pas laisser croire autre chose.
- **FR-005** : Le fichier `ventes` **DOIT** énoncer en tête que `restauration` et `bar` sont des **coquilles vides** dont le tronc commun vit ici, afin qu'aucun cycle ultérieur ne cherche un schéma absent.

### Exigences fonctionnelles — l'occupation et la disponibilité

- **FR-006** : L'occupation **DOIT** être un **intervalle `tstzrange`**, **jamais une paire de colonnes de date**. Aucune autre représentation de période n'est admise pour la disponibilité.
- **FR-007** : La table d'occupation **DOIT** porter, **posée à sa création**, une contrainte d'exclusion `EXCLUDE USING gist (unite_id WITH =, periode WITH &&)` rendant tout chevauchement impossible **au niveau de la base**. Aucun verrou applicatif ne tient lieu de cette garantie.
- **FR-008** : Cette contrainte **DOIT** être **partielle**, de sorte qu'une occupation **annulée** cesse de réserver son intervalle.
- **FR-009** : Le **temps de remise en état DOIT être intégré à l'intervalle d'indisponibilité**, jamais géré à part. L'occupation porte donc **deux périodes distinctes** — celle que le client occupe et celle pendant laquelle l'unité est indisponible —, la seconde contenant la première, et **c'est la seconde que la contrainte d'exclusion protège**.
- **FR-010** : L'unité **NE DOIT PAS** porter de colonne de statut d'occupation : « libre », « occupée » et « réservée » sont **dérivés** des occupations. Elle **DOIT** porter le **statut ménage**, seul statut librement modifiable, de classe A.
- **FR-011** : La **mise hors service** d'une unité **DOIT** être portée comme une occupation d'un motif dédié, et non par une colonne du référentiel — un seul mécanisme de disponibilité, jamais deux.
- **FR-012** : Le modèle **DOIT** porter un index servant la **recherche de disponibilité** — les unités libres d'une catégorie sur un intervalle donné —, avec son commentaire d'usage nommant la story.

### Exigences fonctionnelles — les référentiels qu'une colonne ne porterait pas

- **FR-013** : Le temps de remise en état **DOIT** être une **table**, dont l'unicité porte sur le couple **catégorie + formule** — la durée varie par l'une **et** par l'autre, ce qu'une colonne ne porte pas.
- **FR-014** : La destination de préparation **DOIT** être une **table**, jamais une énumération, et **DOIT** être rattachée à l'**établissement** — une cuisine sert plusieurs points de vente.
- **FR-015** : La destination **DOIT** être **facultative sur l'article**. Le commentaire de la colonne **DOIT** énoncer le repli : à défaut, l'envoi suit la destination par défaut du point de vente, portée par la clé de configuration `ventes.destination_preparation_defaut` du cycle D1 — **pour qu'aucun bon d'envoi ne manque**.
- **FR-016** : Le barème de paliers du passage, les plages de demi-journée et le calendrier tarifaire **DOIVENT** être des **tables de référentiel**, jamais des clés du catalogue de configuration. Le barème porte les paliers `{durée, prix}` **et** le prix de l'heure supplémentaire au-delà du dernier palier.
- **FR-017** : La formule **DOIT** porter `assujettie_taxe_nuitee` **et** sa **règle de conversion** comme **paramètres éditables**, jamais comme constantes : le traitement fiscal du passage et de la demi-journée diffère par commune et n'est pas arrêté (cadrage §5.5, décision B-02).
- **FR-018** : Le seuil de bascule du passage en nuitée **NE DOIT PAS** être une colonne du référentiel de formule : c'est la clé de catalogue `seuil_bascule_nuitee_minutes` du cycle D1, comme `heure_arrivee_standard` et `heure_depart_standard`.

### Exigences fonctionnelles — les privilèges disent la classe

- **FR-019** : `ventes.lot_envoi` **DOIT** être **immuable par privilège** — `SELECT, INSERT` seuls. Un second envoi crée un **second lot** ; il ne modifie pas le premier.
- **FR-020** : `hebergement.taxe_sejour_constat` **DOIT** recevoir le **même régime** : le constat est figé au départ et ne se récrit jamais.
- **FR-021** : Toute table portant **deux classes selon l'opération DOIT** les déclarer **toutes les deux** dans son commentaire d'en-tête, avec l'opération de chacune, **et** recevoir les privilèges permettant les deux. Cela vise au minimum `commande`, `ligne_commande`, `bon_depot` et `arrhes`.
- **FR-022** : `ventes.conversion_unite_mesure` **DOIT** être créée **sans aucun `GRANT` à `kaya_app`, pas même `SELECT`** (amendement A3) — c'est cette absence qui la prouve provision.
- **FR-023** : `kaya_app` **NE DOIT** recevoir `DELETE` sur **aucune** table de ce cycle, et **aucun** `GRANT … ON ALL TABLES IN SCHEMA` **NE DOIT** exister — un privilège global effacerait toute l'information que la matrice porte.
- **FR-024** : Les entités de classe **B dont aucune ligne ne se récrit** — mouvement de stock, inventaire — **PEUVENT** recevoir `SELECT, INSERT` seuls. Le commentaire d'en-tête **DOIT** alors dire que le privilège est **plus strict que la classe**, et pourquoi : une correction est une contre-passation.

### Exigences fonctionnelles — les deux sagas inter-modules

- **FR-025** : Le rattachement d'une **ligne de commande reportée sur la note d'un séjour** (`ventes` → `hebergement`) **DOIT** être une colonne d'identifiant **nue et nullable**, **sans `REFERENCES`**, et **commentée** comme telle.
- **FR-026** : Le rattachement d'un **bon de dépôt au séjour** d'un client logé (`pressing` → `hebergement`) **DOIT** avoir la même forme et le même commentaire.
- **FR-027** : Chacun de ces deux commentaires **DOIT** énoncer trois choses : que c'est une **saga à compensation explicite** et jamais une transaction ; que le **cas orphelin — la note est déjà arrêtée — est le chemin NOMINAL**, pas l'exception ; et que la compensation atterrit dans `synchronisation.reconciliation_orpheline`, créée au cycle D1. **Aucune table de réconciliation nouvelle N'EST créée.**
- **FR-028** : **Aucune clé étrangère entre deux schémas différents**, sans exception et même quand la table cible existe. À l'intérieur d'un même schéma, les clés étrangères sont normales, souhaitables et nommées.
- **FR-029** : Tout autre rattachement inter-modules — l'article vers son point de vente, la destination vers son établissement, le jeton de table vers sa table, le client vers sa personne, l'arrhes vers son encaissement, la liaison catalogue → stock — **DOIT** suivre la même règle : identifiant nu, commentaire qui le dit.

### Exigences fonctionnelles — numérotations et compteurs

- **FR-030** : Les trois numérotations de ce cycle — **fiche de police**, **référence de retrait « à emporter »**, **numéro de retrait pressing** — **DOIVENT** être des **compteurs en table** destinés à être verrouillés ligne à ligne, **jamais des `SEQUENCE`**. Un commentaire d'en-tête le dit à chaque compteur.
- **FR-031** : Le modèle **NE DOIT** créer **aucune `SEQUENCE`**, y compris implicitement par un type sériel.

### Exigences fonctionnelles — argent, quantités, identifiants

- **FR-032** : Toute **quantité** — ligne de commande, mouvement de stock, ligne d'inventaire, prestation incluse — **DOIT** être en `NUMERIC` via le domaine partagé, **jamais en entier** (amendement A2). C'est ce cycle qui porte l'essentiel des quantités du produit : le socle n'en avait qu'une.
- **FR-033** : Tout **montant DOIT** être un entier d'unité mineure via le domaine partagé, accompagné du code ISO 4217 porté par l'établissement. **Aucun flottant, nulle part.**
- **FR-034** : Le **prix DOIT** être **verrouillé à la création de la ligne** — de commande comme de note de séjour : une modification de tarif ultérieure ne modifie aucune ligne existante.
- **FR-035** : L'identifiant de chaque table **DOIT** être un UUID **fourni par le client**, sans aucune valeur par défaut. Les **deux horodatages** — indicatif client nullable, autorité serveur non nulle — **DOIVENT** figurer sur toute table qu'un terminal écrit, et **jamais** sur une table de classe C.
- **FR-036** : `stocks.mouvement_stock.cout_unitaire` **DOIT** être **nullable et jamais renseigné au MVP** (amendement A4) ; `ventes.article` **DOIT** porter `unite_mesure` **obligatoire** de défaut `unite`, plus `code_barre` et `article_parent_id` **nullables et non utilisés** (amendements A3 et A5).

### Exigences fonctionnelles — registre des classes

- **FR-037** : Les lignes déjà présentes au registre §6, §7 et §8 **DOIVENT** être honorées **telles quelles** — elles ont été décidées à froid et ne se réécrivent pas. Une divergence constatée entre le registre et le cadrage se corrige **en faveur du cadrage**, dans le même changement.
- **FR-038** : Toute entité nommée par ce cycle et absente du registre **DOIT** y être inscrite avec sa **classe**, son **code de branche** et sa **story de référence**.
- **FR-039** : Le **journal des modifications** du registre (§13) **DOIT** recevoir une ligne par nom posé et par décision de nommage arbitrée, disant contre quoi le nom a été retenu — **jamais un décompte de tables ni un état d'avancement**.
- **FR-040** : Ce cycle **NE TRANCHE NI O-02** (classe de `mouvement_stock`) **NI O-03** (crate d'accueil de la surface QR). Jusqu'à leur arbitrage, la classe inscrite au registre s'applique.

### Exigences fonctionnelles — README et commande unique

- **FR-041** : `docs/modele-donnees/README.md` **DOIT** être mis à jour **dans le même changement** : tableau de l'ordre d'application, liste **opposable** des schémas déclarés, diagramme des relations principales en texte, liste de toutes les tables avec leur classe, et décomptes.
- **FR-042** : Le diagramme **DOIT** distinguer visuellement la clé étrangère du **rattachement nu**, et **aucune clé étrangère ne DOIT** y traverser un schéma.
- **FR-043** : Le README **DOIT** consigner le **piège du préfixe à trois chiffres** — `100-` trie avant `20-` — pour le cycle qui voudra intercaler un fichier au-delà du quinzième.
- **FR-044** : `scripts/verifier.sh` **NE DOIT** modifier **ni le contrat ni le mécanisme** de P-01 et de P-02 : leur périmètre s'élargit sans qu'on les touche. Leurs **planchers de non-vacuité DOIVENT** être relevés aux nouvelles valeurs, réglés **juste sous** le compte réel — un plancher confortable ne refuse rien.
- **FR-045** : Les **tests négatifs** de P-01 et P-02 **DOIVENT** être rejoués après le relèvement des planchers, et le résultat consigné : une porte dont on a changé un seuil sans la recasser n'est plus une porte vérifiée.
- **FR-046** : Le cycle **DOIT** ajouter la porte **P-05** — *aucune contrainte de clé étrangère ne relie deux tables de schémas différents* —, et **aucune autre**. Elle **DOIT** respecter le contrat en cinq points de la constitution, réutiliser la base montée par P-01, et porter un **plancher de clés étrangères examinées** : cherchant une **absence**, elle est verte quand elle ne trouve rien, et le plancher est ce qui distingue « rien à trouver » de « je ne cherche plus ».
- **FR-047** : Le **test négatif** de P-05 **DOIT** transformer `hebergement.ligne_sejour.ligne_commande_id` en clé étrangère vers `ventes.ligne_commande` — **l'erreur réelle qu'on cherche à prévenir**, pas une erreur de laboratoire — et **exiger** un échec nommant la contrainte, la table portante et la table référencée.

### Exigences fonctionnelles — provisions

- **FR-048** : Le modèle **DOIT** créer, **en tables seulement et sans aucune logique**, les provisions du registre §10 qui relèvent de ces quatre schémas : `prestation_incluse` rattachée à la **formule** (HEB-09) ; `contrat_location`, `caution`, `charge_locative` et `etat_des_lieux` (HEB-08) ; `conversion_unite_mesure` (A3, FR-022). Chacune **DOIT** porter la mention littérale **« PROVISION — tables seulement, aucune logique au MVP »** et la story qui l'introduit, et recevoir **`SELECT` seul** — ou **aucun privilège** quand rien du produit n'a de raison de la lire.
- **FR-049** : Le **décompte d'une prestation incluse** (registre §10, incrément 2) **NE DOIT** recevoir **aucune table**, et le fichier **DOIT** le dire — une table qu'aucune story du MVP n'écrit se remplit un jour de ce qui traîne.

### Exigences fonctionnelles — idempotence des reports

- **FR-050** : Chacune des deux colonnes de report — `ligne_sejour.ligne_commande_id` et `ligne_sejour.bon_depot_id` — **DOIT** porter un **index UNIQUE partiel** sur sa valeur non nulle. **L'idempotence est portée par une contrainte, jamais par une lecture préalable** : un index ordinaire *retrouverait* le doublon sans le **refuser**, et un événement rejoué après coupure produirait une **seconde ligne sur la note**, donc une double facturation. C'est la forme que le socle a déjà posée (`uq_evenement_metrique_id`, cycle D1), et le service de la phase 3 **insère puis traite le conflit**, comme pour la contrainte d'exclusion.

### Entités clés

> Classes reprises de `docs/registre-classes-offline.md` §6, §7, §8 et §10, qui **fait foi**. **★** marque les entités **nommées par ce cycle** et à inscrire au registre. Une table qui porte deux classes les déclare toutes les deux.

**`stocks`** *(capacité — `capacites/stocks`)* — `article_stock` (C·C2) · `point_de_stock` (C·C2 — cave, cuisine, bar) · liaison catalogue → stock (C·C2, avec la quantité consommée par vente) · `mouvement_stock` (B·B3 — entrée, sortie sur vente, ajustement, transfert, casse ; porte `cout_unitaire` nullable, **provision**) · `inventaire` (B·B3) · ★ligne d'inventaire (B·B3 — l'article compté et son écart, que le registre décrit sans la nommer) · `alerte_seuil` (A·A4).

**`hebergement`** *(verticale)* — **Référentiel** : `categorie` (C·C2) · `unite` (C·C2 — spécialisation de `ressource_reservable`, porte le statut ménage en A·A4) · `temps_remise_en_etat` (C·C2, par catégorie **et** formule) · `formule` (C·C2 — `NUITEE`, `PASSAGE`, `DEMI_JOURNEE`, `MENSUEL`, avec `assujettie_taxe_nuitee` et sa règle de conversion) · `bareme_palier` (C·C2) · `plage_demi_journee` (C·C2) · `calendrier_tarifaire` (C·C2). — **Disponibilité** : `occupation` (B·B3 — `tstzrange` + contrainte d'exclusion, remise en état intégrée, motif de maintenance compris). — **Séjour** : `client` (C·C2) · `preference_personne` (A·A4) · `sejour` (B·B3) · `accompagnant` (A·A4) · `note_sejour` (B·B3) · `ligne_sejour` (B·B3, ou **classe de la ligne d'origine** quand elle vient d'un point de vente) · `fiche_police` (B·B3) · `numerotation_fiche_police` (B·B3, **compteur en table**) · `taxe_sejour_constat` (B·B3, **immuable par privilège**). — **Réservation** : `reservation` (B·B3) · `arrhes` (**classe du mode** : B·B3 espèces et virement, D·D1 Mobile Money et carte). — **Maintenance** : `incident_maintenance` (A·A4) · `intervention` (A·A4). — **Provisions** : `prestation_incluse` (C·C2) · `contrat_location`, `caution`, `charge_locative`, `etat_des_lieux` (C·C2).

**`ventes`** *(socle — `socle/ventes` ; `restauration` et `bar` sont des coquilles vides)* — `categorie_article` (C·C2) · `article` (C·C2 — `unite_mesure` obligatoire, `code_barre` et `article_parent_id` nullables) · `destination_preparation` (C·C2, **par établissement**) · `commande` (A·A4 à l'ouverture et à la réception QR, **B·B3** à la validation et sur l'addition de table) · `ligne_commande` (A·A4 à la saisie et avant envoi, **B·B3** à l'annulation après envoi) · `lot_envoi` (A·A4, **immuable par privilège**) · `remise` (B·B3) · `part_addition` (B·B3) · `numerotation_reference` (B·B3, **compteur en table**) · `jeton_table` (C·C2, signé et révocable) · **provision** : `conversion_unite_mesure` (C·C2, **aucun `GRANT`**).

**`pressing`** *(verticale)* — `bon_depot` (B·B3 à la création et au retrait, **A·A4** pour les transitions `depose → en_traitement → pret` ; porte le moment de règlement **figé à la création**) · `piece_deposee` (A·A4) · `numerotation_retrait` (B·B3, **compteur en table**).

**Ce à quoi ce cycle ne crée délibérément aucune table** : le statut d'occupation d'une unité (dérivé) · la salle de réunion (une **catégorie d'unité**, pas une entité) · le panier de la page publique QR (hors application, registre §9) · la limitation de débit par jeton (éphémère Redis) · la politique d'annulation et l'expiration d'une réservation provisoire (**clés du catalogue** de configuration) · le décompte d'une prestation incluse (incrément 2) · les schémas `restauration` et `bar` (coquilles vides) · toute table de réconciliation (elle existe au socle).

---

## Critères de réussite *(obligatoire)*

### Résultats mesurables

- **SC-001** : Le modèle complet — socle **et** verticales — s'applique sur une base vierge en **une commande**, **sans aucune erreur**, et la base est détruite ensuite sans laisser de conteneur ni de volume.
- **SC-002** : **100 %** des tables nouvelles portent les trois éléments — `tenant_id` non nul, `ENABLE` **et** `FORCE`, politique `isolation_tenant` avec `USING` **et** `WITH CHECK` — dans la forme **strictement identique** à celle du socle. L'écart toléré est **zéro table** et **zéro variante d'expression**.
- **SC-003** : Sur deux transactions concurrentes insérant des occupations chevauchantes sur la même unité, **exactement une** réussit — refusée par la base, **jamais** par un verrou applicatif. Mesuré une fois et consigné.
- **SC-004** : **Zéro** occupation représentée autrement que par un `tstzrange` ; **zéro** paire de colonnes de date portant une période de disponibilité.
- **SC-005** : **Zéro** clé étrangère entre deux schémas, constaté par inspection du catalogue — les deux sagas comprises.
- **SC-006** : **100 %** des tables nouvelles ont une classe déclarée au registre ; P-02 est verte, et l'écart toléré est **zéro table non déclarée**.
- **SC-007** : **Les six** tables à double classe — `commande`, `ligne_commande`, `unite`, `arrhes`, `ligne_sejour`, `bon_depot` — déclarent **les deux** dans leur commentaire d'en-tête, avec l'opération de chacune. `mouvement_stock` et `inventaire` n'en font **pas** partie : elles portent **une seule classe, B**, avec un privilège plus strict qu'elle n'exige — une décision de forme n'est pas une seconde classe.
- **SC-008** : **Zéro** privilège `UPDATE` ou `DELETE` sur `lot_envoi` et sur `taxe_sejour_constat` ; **zéro** privilège `DELETE` sur l'ensemble du cycle ; **zéro** `GRANT … ON ALL TABLES IN SCHEMA`.
- **SC-009** : **Zéro** quantité en entier, **zéro** montant en flottant, **zéro** colonne d'identifiant portant une valeur par défaut, **zéro** `SEQUENCE` créée.
- **SC-010** : Une recherche de disponibilité — les unités libres d'une catégorie sur un intervalle donné — répond en **moins de 300 ms** sur un parc de **50 unités** et **20 000 occupations** (l'ordre de grandeur de deux ans d'exploitation du pilote), **par parcours d'index et non par balayage séquentiel**, mesurée sur un jeu de volume.
- **SC-011** : `scripts/verifier.sh` s'exécute toujours en **moins de deux minutes** malgré les schémas ajoutés — au-delà, on cesse de le lancer, et c'est le déclencheur documenté du passage au serveur en phase 3.
- **SC-012** : Les **trois** portes échouent quand on les casse volontairement — P-01 et P-02 **après** relèvement de leurs planchers —, et l'échec **nomme la cause** : vérifié une fois chacune et consigné.
- **SC-013** : **Une seule** porte ajoutée, **P-05** ; **zéro** contrat de porte existante modifié ; **zéro** fichier du socle modifié hors README.
- **SC-014** : **Zéro** migration, **zéro** fichier Rust, **zéro** écran, **zéro** fichier sous `.github/workflows/`.
- **SC-015** : **100 %** des tables du modèle — socle et verticales — figurent au README avec leur classe, et **100 %** des schémas de la base figurent à la liste opposable des schémas déclarés.

---

## Hypothèses

Les points suivants n'étaient pas tranchés par l'entrée ; ils le sont ici par défaut raisonnable, et chacun est réversible sans migration tant que la phase 3 n'a pas commencé.

1. **Les préfixes numériques restent à deux chiffres, et `ventes` s'intercale dans la plage du socle.** Trois chiffres casseraient l'ordre — `100-` trie avant `20-` — et imposeraient de renommer les onze fichiers du D1. `ventes` appartenant à `socle/` (constitution, principe 2), le placer après les capacités et les verticales laisserait croire l'inverse. Les capacités puis les verticales viennent après tout le socle, dans l'ordre de la hiérarchie de dépendance. **Aucune clé étrangère ne traversant un schéma, l'ordre entre ces fichiers n'a aucune contrainte technique** : il est purement documentaire, et c'est pourquoi il doit dire la hiérarchie.
2. **`client` est une spécialisation de `comptes.personne`, rattachée par un identifiant nu.** Les données d'identité — nom, téléphone, type et numéro de pièce, date de capture — vivent déjà sur `personne` (cycle D1), qui porte l'index de recherche de SC-009 et la colonne de purge TRX-06. Les dupliquer sur `client` donnerait **deux cibles à la purge ARTCI** et deux vérités sur la même personne. `client` ne porte donc que ce qui est propre au client de l'hébergement.
3. **`preference_personne` porte sur la personne, pas sur le client** — c'est le nom que le registre §7.3 lui donne, et une préférence (chambre calme, étage bas) suit la personne d'un établissement à l'autre du tenant, comme sa fiche.
4. **L'addition d'une table est une commande de cible `table`**, non une entité distincte. L'entrée nomme `part_addition` — la **division** d'une addition — sans nommer d'entité `addition` ; en créer une dupliquerait le cycle de vie de la commande. Le transfert et la fusion de tables se lisent alors comme un changement de cible.
5. **L'occupation porte deux périodes** : celle que le client occupe et celle pendant laquelle l'unité est indisponible, la seconde englobant la première **et** le temps de remise en état. Une période unique facturerait le ménage au client ; deux mécanismes séparés laisseraient attribuer une unité encore sale.
6. **La mise hors service d'une unité est une occupation de motif « maintenance ».** C'est la seule lecture qui concilie une opération de **classe B** avec un référentiel de **classe C** sans créer un second mécanisme de disponibilité.
7. **`jeton_table` vit dans le schéma `ventes`**, comme le demande l'entrée, **sans préjuger d'O-03** : la décision ouverte porte sur le **crate d'accueil** de la surface QR, pas sur le schéma SQL, et ce cycle ne produit aucun crate.
8. **`conversion_unite_mesure` vit dans `ventes`**, aux côtés d'`article` dont elle convertit l'unité de mesure — le registre §10 la rattache à PDV-01. Le stock la lirait par un trait exposé si le profil `VALORISE` était un jour implémenté ; il ne l'est pas.
9. **Les privilèges de `mouvement_stock` et d'`inventaire` sont plus stricts que leur classe** : `SELECT, INSERT` seuls, comme les six tables de caisse du socle. La classe reste **B** ; c'est une décision de forme, consignée au commentaire d'en-tête pour qu'on ne la relise pas comme une incohérence.
10. **Les seeds ne sont pas produits par ce cycle** — barème Deloria, plages de demi-journée, cinq tarifs de nuitée. Ce sont des données, pas du schéma ; ils relèvent de la mécanique rejouable de la phase 3 (TRX-05a/05b).
11. **Aucun jeu de données de volume n'existe encore.** La mesure de SC-010 se fait sur un jeu généré pour l'occasion, comme celle de SC-009 au cycle D1 ; elle ne dépend d'aucun seed.
12. **Les décomptes exacts de tables ne sont pas figés par cette spécification.** Le README les portera après écriture ; les figer ici produirait deux chiffres à maintenir, et donc un qui serait faux.

## Dépendances

- **Le cycle D1**, livré : les onze fichiers du socle, `00-conventions.sql` (rôles, extension `btree_gist` **déjà posée pour cette contrainte d'exclusion**, domaines partagés, patron RLS), `scripts/verifier.sh` avec ses deux portes, et le contrat `contracts/conventions-sql.md` — **repris intégralement, jamais reformulé**.
- Les tables du socle auxquelles ce cycle se rattache **sans clé étrangère** : `etablissements.etablissement`, `.point_de_vente`, `.table_pdv`, `.parametre_configuration` · `comptes.personne` · `caisse.encaissement` · `documents.document_operationnel` · `synchronisation.reconciliation_orpheline`.
- `docs/registre-classes-offline.md` §6, §7, §8 et §10 — **entrée directe** du cycle et **seul document extérieur que ce cycle modifie**.
- `docs/cadrage-v1.md` §5, §6, §7 et §14 · `docs/user-stories-v1.md` modules HEB, SEJ, RSV, PDV, QRC, STK et le récapitulatif des paramètres d'établissement — sources des entités et des contraintes. Lus, non modifiés.
- `.specify/memory/constitution.md` — principes 0, 1b, 2, 3, 4, 5, 6, 10 et 13. En cas de conflit, elle prime.

## Hors périmètre

- **Les onze fichiers du socle** — livrés au cycle D1, non modifiés ici (le README excepté).
- Toute migration sqlx, tout code Rust, tout trait, tout endpoint, tout écran, toute donnée simulée, tout seed.
- Les portes **P-03** et **P-04** — elles arrivent avec le premier manifeste et avec la phase 2 — et **toute porte au-delà de P-05** : le contrat de la constitution est qu'une porte s'ajoute quand son absence coûterait cher, jamais parce qu'elle figurerait bien dans une liste. Deux candidates ont été réexaminées et écartées à la planification : *« les privilèges correspondent à la classe »* — elle demanderait au script de **juger**, et six tables portent ici deux classes — et *« la période facturée est incluse dans l'indisponibilité »* — c'est une contrainte `CHECK`, donc déjà garantie par la base à chaque écriture.
- Tout workflow GitHub Actions — le serveur de CI vient en phase 3 et lancera ce script **sans le modifier**.
- L'arbitrage d'**O-02** (classe de `mouvement_stock`) et d'**O-03** (crate d'accueil de la surface QR) — le registre s'applique en l'état.
- Les schémas `restauration` et `bar` — **coquilles vides**, dont le tronc commun vit dans `ventes`.
- Les profils de stock `VALORISE` et `DETAILLE`, les capacités autres que `STOCK` — déclarés au socle et **refusés explicitement**, jamais implémentés.
