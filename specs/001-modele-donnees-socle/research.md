# Phase 0 — Recherche et décisions : modèle de données du socle (cycle D1)

*Treize décisions. Chacune porte ce qui a été retenu, pourquoi, et ce qui a été écarté. Aucune n'est un détail d'écriture : ce sont celles qui coûteraient une migration de toutes les lignes si on les prenait plus tard.*

---

## D-01 · Un onzième fichier — `95-comptabilite.sql`

**Décision** : `mapping_comptable` et `exercice_comptable` vivent dans un **schéma `comptabilite` dédié**, dans un onzième fichier, et non dans un des dix fichiers énumérés par l'entrée.

**Motif** : l'entrée les ajoute « en provision » sans leur assigner de fichier. Un schéma par module est la règle (constitution, principe 2) ; il n'existe pas de crate comptable, mais il en existera un — la provision est faite pour ça. Les loger dans `synchronisation` les coupleraient à un module qu'ils ne servent pas, et la règle « aucune FK entre schémas de modules » interdirait de toute façon de les y rattacher. **Un fichier aujourd'hui contre un déplacement inter-schéma demain.**

**Écarté** : `synchronisation.sql` — ils consomment l'outbox, l'idée se tenait. Mais consommer n'est pas appartenir : les métriques aussi consomment l'outbox et ont leur schéma.

**C'est le seul écart à la liste de fichiers de l'entrée. Il est réversible d'un `git mv`.**

---

## D-02 · `partenaire` porte deux identifiants de tenant

**Décision** : `tenant_id` **non nul** (le tenant propriétaire de la fiche, qui porte l'isolation) **et** `tenant_partenaire_id` **nullable** (le compte Kaya du partenaire, quand il en a un).

**Motif** : trois documents disent « `tenant_id` nullable » pour `partenaire` (cadrage §14.9, ETB-07, amendement A12) et la constitution dit « chaque table porte `tenant_id` » avec une politique sans exception. Une ligne au `tenant_id` nul est **invisible** sous `tenant_id = current_setting(…)::uuid` — la provision serait inutilisable — ou **visible de tous** si on relâchait la politique, ce qui ouvrirait la seule brèche d'isolation du produit sur une table que personne n'utilise.

En relisant l'intention d'A12, la contradiction se dissout : le `tenant_id` nullable désigne **le compte Kaya du partenaire**, pas le propriétaire de la fiche. « Le partenaire sans compte Kaya est le cas normal, celui avec compte est l'enrichissement » — c'est bien un second lien, facultatif, pas le lien d'isolation.

**Écarté** : une politique `tenant_id = current_setting(…) OR tenant_id IS NULL`. Elle rendrait chaque fiche partenaire sans compte visible de **tous les tenants** du SaaS mutualisé.

---

## D-03 · Aucune exception d'isolation pour les référentiels partagés

**Décision** : `module_activite`, `capacite`, `profil_stock`, `role`, `permission`, `parametre_catalogue`, `methode_authentification`, `plan`, `palier` portent un `tenant_id` non nul comme toutes les autres tables et sont **semés au provisionnement du tenant** (ADM-01). Le catalogue de l'éditeur appartient au **tenant de l'éditeur**, qui est un tenant comme un autre.

**Motif** : c'est la seule lecture de « `tenant_id` sur CHAQUE table » qui ne relâche nulle part la politique. Elle a un second mérite : ETB-08 promet qu'ajouter `SPA` ou `BOULANGERIE` au référentiel des modules est « de la configuration, pas une migration » — un référentiel porté par tenant rend cet ajout possible **pour un client sans toucher les autres**.

**Écarté** : un `tenant_systeme` réservé plus une politique `tenant_id = current OR tenant_id = tenant_systeme`. Techniquement propre, mais elle crée **deux formes de politique** dans le dépôt ; P-01 devrait alors accepter deux expressions, et une porte qui accepte deux formes en acceptera trois.

**Conséquence assumée** : le référentiel des modules est dupliqué par tenant. À l'échelle visée — quelques dizaines de tenants, huit modules — le coût est nul.

---

## D-04 · L'outbox est immuable : la publication est un fait ajouté

**Décision** : `evenement_outbox` reçoit `SELECT, INSERT` et **ni `UPDATE` ni `DELETE`**. Le marquage « publié » est porté par une **seconde table**, `publication_outbox`, dont l'existence d'une ligne vaut publication.

**Motif** : trois règles indissociables de TRX-02 — rétention illimitée, charge utile financière complète, **immuabilité**. Un `GRANT UPDATE` accordé « juste pour le drapeau `publie_le` » suffit à casser la troisième, et rien ne le signalerait. Le privilège absent est ce qui prouve l'immuabilité.

**Écarté** : une colonne `publie_le` mise à jour par le worker — la forme la plus courante, et celle qui exige exactement le privilège qu'on veut refuser.

**Conséquence** : le worker de publication sélectionne les événements sans ligne de publication (`LEFT JOIN … WHERE p.evenement_id IS NULL`), et l'index qui sert cette requête est nommé et justifié. `publication_outbox` est elle-même append-only.

> **`publication_outbox` est une entité nommée par ce cycle** et entre au registre §5.6 en classe **A / A4**.

---

## D-05 · Toute numérotation continue est un compteur en table

**Décision** : `documents.numerotation_document` et `fiscalite.compteur_stickers` sont des **tables à une ligne par portée**, destinées à être verrouillées ligne à ligne (`SELECT … FOR UPDATE`) en phase 3. **Aucune `SEQUENCE` PostgreSQL** n'est créée par ce cycle.

**Motif** : une `SEQUENCE` n'est pas transactionnelle et laisse des trous à chaque transaction annulée. Pour un numéro de document interne opposable à un contrôle, un trou est une pièce dont personne ne sait si elle a existé. Le registre le dit déjà pour la fiche de police et le numéro de retrait pressing (cycle D2) ; la règle est **générale** et s'écrit ici, dans les conventions, pour que D2 n'ait pas à la redécouvrir.

**Écarté** : `SEQUENCE` avec `CACHE 1` — réduit les trous, ne les supprime pas ; une transaction annulée en consomme toujours un.

---

## D-06 · Quatre entités que le registre décrit sans les nommer

**Décision** : ce cycle pose leur nom et les inscrit au registre.

| Nom posé | Ce que le registre décrit | Section | Classe |
|---|---|---|---|
| `comptes.releve_position` | « Relevé de position (géorepérage souple) » | §5.2 | **A · A4** |
| `caisse.coupure_comptee` | « Comptage par coupure » (CAI-04) | §5.3 | **B · B3** |
| `editeur.encaissement_abonnement` | « Encaissement d'abonnement » | §5.8 | **D · D1** |
| `editeur.evenement_webhook_paiement` | « Webhook de paiement — validation HMAC, idempotence » | §5.8 | **D · D1** |
| `synchronisation.publication_outbox` | conséquence de D-04 | §5.6 | **A · A4** |

**Motif** : « une entité absente de ce registre est une entité non implémentable » (registre §1), et « quand ce registre décrit une table sans la nommer, c'est le cycle D1 ou D2 qui pose le nom, et qui l'inscrit ici » (registre, encadré de tête).

**Ce qui n'a PAS reçu de table, et pourquoi** : l'**attestation d'intégrité** (registre §5.2) est un **état de l'appareil enrôlé**, pas un journal — son résultat courant suffit, et CPT-06 ne demande pas d'historique. L'**ouverture de tiroir-caisse** (registre §5.3) est une **entrée du journal d'audit**, qui la liste explicitement (CPT-04). La **sélection d'établissement actif** est une préférence locale du terminal, hors base.

---

## D-07 · L'ordre d'application est porté par le nom des fichiers

**Décision** : préfixe numérique par pas de dix — `00-conventions.sql`, `10-etablissements.sql`, … `95-comptabilite.sql`. `scripts/verifier.sh` applique `docs/modele-donnees/*.sql` **trié**, sans liste interne.

**Motif** : une liste d'ordre écrite dans le script est une seconde source de vérité, et deux sources divergent. Avec le préfixe, l'ordre lexicographique **est** l'ordre de dépendance ; ajouter un fichier ne demande de toucher ni le script, ni une liste.

**Écarté** : un `psql -f tout.sql` avec des `\i` — masque quel fichier a échoué dans la trace, et c'est justement ce que P-01 doit nommer.

**Coût** : intercaler un schéma demande un renommage. Les pas de dix laissent neuf places libres entre chaque.

---

## D-08 · La base de vérification est éphémère et détruite quoi qu'il arrive

**Décision** : `compose.yml` déclare un service `postgres_verification` sur l'image **`postgres:18.4`** (tag exact, `docs/versions-reference.md` §4.2), en **`tmpfs`** pour son répertoire de données. `scripts/verifier.sh` pose un `trap` qui exécute `docker compose down -v` en sortie normale, en échec **et** à l'interruption.

**Motif** : le contrat de porte exige qu'elle **ne modifie pas ce qu'elle inspecte** (constitution, principe 13, point 3). Une base survivante entre deux exécutions ferait passer P-01 au vert sur un modèle qui ne s'applique plus **sur une base vierge** — précisément ce que la porte prétend prouver. Le `tmpfs` supprime aussi le coût disque et accélère l'application, ce qui sert SC-008.

**Écarté** : réutiliser une base de développement en la vidant par `DROP SCHEMA … CASCADE`. Un objet créé hors schéma — un rôle, une extension — survivrait, et la vérification deviendrait dépendante de l'historique du poste.

**Point d'attention** : `kaya_owner` et `kaya_app` sont des **rôles de cluster**, pas des objets de base. `00-conventions.sql` les crée en `CREATE ROLE … ` idempotent (`DO $$ … IF NOT EXISTS`) pour que le fichier s'applique aussi bien sur un cluster neuf que sur un cluster déjà pourvu.

---

## D-09 · Comment P-01 inspecte, et ce qu'elle refuse

**Décision** : trois contrôles, par requête sur le catalogue, sur **toutes** les tables ordinaires des schémas déclarés.

1. **La colonne** — `tenant_id` existe et est `NOT NULL`.
2. **L'activation** — `pg_class.relrowsecurity` **et** `pg_class.relforcerowsecurity` sont vrais.
3. **La politique** — il existe une politique nommée `isolation_tenant` dont **`qual` et `with_check` sont tous deux non nuls**, et dont chacune des deux expressions contient le **second argument `true`** de `current_setting`.

**Motif du contrôle 3, qui est le moins évident** : `pg_policies.with_check` vaut `NULL` quand la politique n'en déclare pas — et une politique sans `WITH CHECK` permet à un tenant d'**insérer** chez un autre. C'est la fuite la moins visible du produit : elle n'apparaît dans aucune lecture (`docs/module-dore.md`, couche 1). Vérifier la seule présence de la politique laisserait passer exactement cette faute.

**Sur le second argument `true`** : sans lui, une transaction sans contexte de tenant lève une erreur au lieu de ne rien voir ; un résultat vide ne peut se dégrader qu'en résultat vide, une erreur peut être avalée par un `catch` mal placé. Le contrôle est textuel (`qual LIKE '%true%'` dans l'appel à `current_setting`) — grossier, mais il attrape l'oubli, qui est la faute réelle.

**Preuve de non-vacuité** : le script déclare un **plancher** de tables attendues et échoue en dessous. Une porte qui inspecterait zéro table passerait au vert sans rien prouver.

---

## D-10 · Comment P-02 lit le registre

**Décision** : extraction des identifiants entre accents graves de `docs/registre-classes-offline.md`, troncature au premier point (`etablissement.classement` → `etablissement`), passage en minuscules. Une table réelle passe si son **nom nu** appartient à l'ensemble obtenu.

**Motif** : le registre est un document de prose destiné à être lu par un humain ; en faire un format structuré le rendrait moins lisible et casserait la propriété qui le rend utile. L'extraction par accents graves est robuste parce que **la convention d'écriture du registre est déjà celle-là** : toute entité y est citée entre accents graves.

**Limites assumées, écrites dans le script** :

- La comparaison porte sur le **nom nu**, pas sur `schema.table`. Deux tables homonymes dans deux schémas passeraient avec une seule déclaration. Le coût de ce faux positif est nul aujourd'hui ; le rendre strict demanderait de réécrire le registre en `schema.entite`, ce qui n'est pas au périmètre.
- Une mention en prose entre accents graves peut faire passer une table par accident. Même arbitrage : **un faux négatif ferait désactiver la porte, un faux positif la laisse utile.**

**Preuve de non-vacuité** : plancher des deux côtés — nombre de tables réelles **et** nombre d'entités extraites. Un registre devenu illisible pour l'extracteur ferait passer la porte au vert en ne comparant rien ; c'est le mode de défaillance qu'il faut refuser.

**Écarté** : un bloc de données structuré (YAML, tableau à colonnes fixes) en tête du registre. Il ferait de la classe une donnée à tenir **deux fois** — dans le tableau lisible et dans le bloc machine.

---

## D-11 · La contrainte d'exclusion n'est pas de ce cycle, l'extension si

**Décision** : `00-conventions.sql` crée `btree_gist`. **Aucune contrainte d'exclusion n'est posée par le cycle D1**, puisque `occupation` appartient au cycle D2.

**Motif** : le piège est écrit — une contrainte d'exclusion **ajoutée sur une table déjà peuplée échoue sur les données existantes** ; elle se pose **à la création**. Le consigner dans les conventions maintenant coûte trois lignes, et évite au cycle D2 de le découvrir sur une table de démonstration déjà remplie.

`btree_gist` est nécessaire dès que la contrainte mêle une égalité (`unite_id WITH =`) et un chevauchement (`periode WITH &&`) : sans elle, `EXCLUDE USING gist` refuse la colonne `uuid`.

---

## D-12 · Montants, quantités et devise

**Décision** : trois **domaines** partagés déclarés dans `00-conventions.sql`.

| Domaine | Type sous-jacent | Contrainte | Motif |
|---|---|---|---|
| `montant_mineur` | `BIGINT` | — | Entiers d'unité mineure ; XOF a 0 décimale, mais le domaine ne le suppose pas |
| `code_devise` | `CHAR(3)` | `~ '^[A-Z]{3}$'` | ISO 4217, porté par l'établissement |
| `quantite` | `NUMERIC` | — | Jamais un entier (amendement A2) — une quincaillerie vendra 2,3 mètres de fer |

**Motif du domaine plutôt que du type nu** : un domaine se cherche par une requête sur `pg_type`, donc « zéro montant en flottant » (SC-010) devient vérifiable mécaniquement le jour où on en fait une porte. Un `BIGINT` nu ne se distingue pas d'un compteur.

**Le socle ne porte aucune quantité au cycle D1** — les lignes de vente et les mouvements de stock sont en D2. Le domaine est néanmoins déclaré ici, parce que c'est le fichier des conventions et qu'un domaine déclaré tard est un domaine que la moitié des tables n'emploie pas.

---

## D-13 · Les index sont justifiés un par un, ou ils ne sont pas créés

**Décision** : chaque index porte en commentaire **la recherche nommée dans une story** qu'il sert. Aucun index « au cas où ».

| Index | Recherche servie | Story |
|---|---|---|
| `personne` par nom normalisé, téléphone, numéro de pièce | Recherche client au comptoir, **< 300 ms sur 10 000 fiches** | SEJ-01, CPT-00 |
| `journal_audit` par établissement, type, période, auteur | Consultation filtrée du journal | DIR-04, CPT-04 |
| `evenement_outbox` non publié, par établissement et séquence | Boucle du worker de publication | TRX-02 |
| `file_certification` par état et par établissement | Tableau de bord « documents non certifiés » | FIS-05 |
| `document_fiscal` par établissement et période d'émission | État de reversement communal, réimpression | FIS-08, IMP-03 |
| `encaissement` par shift et par mode de règlement | Récapitulatif de clôture de shift | CAI-05 |
| `evenement_metrique` par tenant et jour | Agrégats quotidiens | MET-03 |

**Sur la recherche de personne** : trois critères, trois usages distincts. Le téléphone et le numéro de pièce sont des **égalités** — un index B-tree sur une valeur normalisée suffit. Le nom est une **recherche partielle** — c'est le seul des trois qui demande un index de trigrammes (`pg_trgm`). **Décision** : `pg_trgm` **n'est pas créée par ce cycle**. Sur 10 000 fiches, un index B-tree sur le nom normalisé sert le préfixe, qui est l'usage réel au comptoir — on tape le début d'un nom. Ouvrir une extension pour la recherche infixe avant d'avoir constaté qu'elle manque, c'est décider trop tôt.

**Écarté** : `pg_trgm` dès maintenant. Elle s'ajoute sans migration de données le jour où la mesure de SC-009 échoue sur un cas réel — et cette mesure est au périmètre du cycle.

---

## Ce qui n'a pas eu à être cherché

Le patron RLS, les deux horodatages, l'identifiant fourni par le client, l'absence de FK inter-modules et les privilèges qui disent la classe **sont déjà écrits et arbitrés** dans [docs/module-dore.md](../../docs/module-dore.md), couche 1. Ce cycle les **applique** ; il ne les rediscute pas, et le contrat de [contracts/conventions-sql.md](./contracts/conventions-sql.md) les reprend à la lettre plutôt que de les reformuler — une reformulation aurait dérivé.
