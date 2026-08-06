# Rapport du cycle D1 — modèle de données du socle

*Ce que les portes ne prouvent pas et qui a été constaté à la main, une fois, par écrit. Chaque
constat porte sa date, sa méthode et son verdict — un contrôle humain non daté n'est pas un
contrôle, c'est un souvenir.*

**Cycle** : D1 · phase 1 du produit (le modèle de données)
**Dépôt** : branche `main`

---

## T019 · Revue de conformité RLS — l'expression est-elle strictement identique partout ?

**Date** : 2026-08-06 · **Méthode** : deux mesures indépendantes, l'une sur les fichiers source,
l'autre sur le catalogue de la base après application.

### Sur les fichiers source

Extraction des lignes de politique de `docs/modele-donnees/*.sql`, puis dédoublonnage :

| Élément | Formes distinctes trouvées |
|---|---|
| `USING (tenant_id = current_setting('app.current_tenant', true)::uuid)` | **1** |
| `WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)` | **1** |
| `FOR ALL TO kaya_owner USING (true) WITH CHECK (true)` | **1** |

*(Une seconde occurrence de chaque forme apparaît dans `00-conventions.sql`, préfixée de `--` :
c'est le patron commenté, et il est identique au mot près à ce que les tables recopient. C'est
précisément la propriété recherchée.)*

### Sur le catalogue, après application

| Politique | Tables portées | Formes distinctes de `qual` | de `with_check` |
|---|---|---|---|
| `isolation_tenant` | 57 | **1** | **1** |
| `administration_editeur` | 57 | **1** | **1** |

### Décomptes croisés, fichiers de schéma seuls (`10-` à `90-`)

| Instruction | Occurrences |
|---|---|
| `CREATE TABLE` | **57** |
| `ENABLE ROW LEVEL SECURITY` | **57** |
| `FORCE ROW LEVEL SECURITY` | **57** |
| `CREATE POLICY isolation_tenant` | **57** |
| `CREATE POLICY administration_editeur` | **57** |

**Verdict : conforme.** Aucune variante d'écriture. P-01 n'a donc qu'une seule forme à chercher —
et c'est la condition pour qu'elle reste stricte : *une porte qui accepterait deux formes en
accepterait trois.*

---

## T020 · Audit des privilèges — les `GRANT` disent-ils la classe ?

**Date** : 2026-08-06 · **Méthode** : interrogation de `information_schema.role_table_grants`
après application du modèle, confrontée à la matrice de
[contracts/conventions-sql.md](./contracts/conventions-sql.md) §3 et aux classes du registre.

### Les cinq contrôles nommés par la tâche

| # | Ce qui est vérifié | Attendu | Constaté |
|---|---|---|---|
| 1 | Tables recevant `DELETE` | **aucune** | **aucune** ✓ |
| 2 | Tables append-only recevant `UPDATE` | **aucune** | **aucune** ✓ |
| 3 | `reconciliation_orpheline` sans `UPDATE` | oui | **oui** ✓ — le privilège absent prouve que la résolution B n'est pas implémentée |
| 4 | `GRANT … ON ALL TABLES IN SCHEMA` | **aucun** | **aucun** ✓ |
| 5 | Index sans recherche nommée | **aucun** | **aucun** ✓ — voir ci-dessous |

### Répartition, sur les 57 tables opérationnelles

| Forme de `GRANT` à `kaya_app` | Tables | Ce que l'absence prouve |
|---|---|---|
| `SELECT, INSERT` | **20** | Aucune ligne ne se récrit — la commutativité que le test de désordre vérifie tient |
| `SELECT, INSERT, UPDATE` | **37** | `DELETE` absent : rien ne s'efface, une correction est une contre-passation |
| Aucun privilège | 0 *(à ce stade)* | `convention_inter_etablissements` l'apportera en T026 |

**Les vingt tables en `SELECT, INSERT`** — et chacune est celle qu'on attend :
`evenement_outbox`, `publication_outbox`, `reconciliation_orpheline`, `journal_audit`,
`releve_position`, `note_etablissement`, `etat_reversement_communal`, `item_certifie`, `avoir`,
`telemetrie_parc`, `bundle_diagnostic`, `evenement_webhook_paiement`, `evenement_metrique`,
`agregat_quotidien`, `sortie_de_caisse`, `comptage`, `coupure_comptee`, `ecart_de_caisse`,
`cloture_shift`, `cloture_journaliere`.

> **Les six dernières sont de classe B et non A, et c'est voulu.** Une dépense constatée ne se
> corrige pas, elle se contre-passe. La classe reste **B** — le commentaire d'en-tête le dit — et
> le privilège dit **en plus** qu'aucune ligne ne se récrit. C'est une décision de forme, pas de
> classe, et c'est le seul endroit du modèle où le privilège est *plus strict* que la classe ne
> l'exigerait.

### Index — chacun porte-t-il sa recherche ?

**38 index explicites** dans les fichiers `10-` à `90-` :

| | Nombre |
|---|---|
| Portant un commentaire `-- Sert : <recherche> (<STORY>)` | **36** |
| Portant un **invariant** et non une recherche — `uq_shift_caisse_ouvert`, `uq_document_operationnel_numero`, deux index uniques partiels | **2** |
| **Sans usage nommé** | **0** ✓ |

**Verdict : conforme.** On peut lire les `GRANT` d'une table et en déduire sa classe sans lire un
seul commentaire — ce qui était l'objet du récit 3.

---

## T033 · SC-009 — la recherche de personne sur 10 000 fiches

**Date** : 2026-08-06 · **Méthode** : modèle appliqué sur une base locale, 10 000 lignes de
`comptes.personne` générées (dix patronymes ivoiriens répétés, téléphones E.164 distincts, trois
types de pièce), `ANALYZE`, puis `EXPLAIN (ANALYZE, BUFFERS)` sur chaque recherche.

**Attendu : moins de 300 ms et un parcours d'index sur les trois.**

| Recherche | Index employé | Type de parcours | Temps d'exécution |
|---|---|---|---|
| Préfixe de `nom_normalise` (`LIKE 'kouame1%'`) | `ix_personne_nom` | Bitmap Index Scan | **0,28 ms** |
| `telephone_e164` exact | `ix_personne_telephone` | Index Scan | **0,03 ms** |
| `type_piece` + `numero_piece` | `ix_personne_piece` | Index Scan | **0,03 ms** |
| *(hors SC-009)* purge TRX-06 par `piece_capturee_le` | `ix_personne_purge` | Index **Only** Scan | **0,24 ms** |

**Verdict : conforme, avec trois ordres de grandeur de marge.** Parcours d'index sur les trois,
aucun balayage séquentiel.

### Le cas infixe, mesuré exprès — et ce qu'il ne justifie pas encore

`LIKE '%ouame4%'` tombe en **Seq Scan**, à **3,6 ms** sur 10 000 fiches. C'est le cas que
`pg_trgm` servirait, et il est ici mesuré plutôt que supposé.

**`pg_trgm` n'est pas créée, et la mesure conforte la décision** ([D-13](./research.md)) :

- l'usage réel au comptoir est **le préfixe** — on tape le début d'un nom, pas son milieu ;
- même dégradé, l'infixe rend **3,6 ms**, soit quatre-vingts fois sous la cible de 300 ms ;
- l'extension **s'ajoutera sans migration de données** le jour où la recherche infixe sera
  demandée par une story et constatée trop lente sur un volume réel.

> **Ce qui déclenchera `pg_trgm`** : une recherche infixe nommée par une story, sur un volume où le
> Seq Scan sort de l'épure. Ni avant, ni « au cas où » — ouvrir une extension avant d'avoir
> constaté qu'elle manque, c'est décider trop tôt.

**Réserve honnête sur ces chiffres** : ils sont pris sur poste de développement Apple Silicon,
table entièrement en cache (`shared hit` partout, aucun `read`). La production tourne sur VPS
`linux/amd64` avec un cache froid ; ces mesures ne la prédisent pas. Ce qu'elles prouvent est
**structurel et transposable** : le planificateur choisit l'index, et non un balayage.

---

## T034 · SC-008 — la durée de la commande unique

**Date** : 2026-08-06 · **Méthode** : trois exécutions consécutives, chronométrées de bout en bout,
base éphémère détruite entre chacune.

| Exécution | Durée |
|---|---|
| 1 | **5 s** |
| 2 | **5 s** |
| 3 | **4 s** |
| `--test-negatif` (les deux, chacun remontant sa propre base) | **9 s** |

**Attendu : moins de deux minutes (SC-008). Verdict : conforme, avec un facteur 24 de marge.**

Deux choix expliquent ce coût : les données de la base de vérification sont en **`tmpfs`**, et la
base n'est démarrée **qu'une fois pour les deux portes** — P-02 réutilise ce que P-01 a monté.

> **Le repère de deux minutes n'est pas un seuil de performance, c'est un seuil d'USAGE.** Le jour
> où le script dépasse deux ou trois minutes, on cesse de le lancer — et une porte qu'on ne lance
> plus ne prouve rien. C'est le déclencheur documenté du passage au serveur d'intégration, en
> phase 3. À 5 s, il en est loin ; le noter maintenant donne le point de comparaison qui manquera
> le jour où la question se posera.

---

## T035 · Le quickstart déroulé de bout en bout, sur dépôt propre

**Date** : 2026-08-06 · **Méthode** : les cinq sections de [quickstart.md](./quickstart.md), dans
l'ordre, `git status` contrôlé à chaque étape.

| § | Étape | Résultat |
|---|---|---|
| — | `git status` avant | **propre** |
| 1 | `scripts/verifier.sh` | **TOUT VERT** — 11 fichiers, 10 schémas, 71 tables, 4 contrôles à 71/71, P-02 verte, 5 s |
| 2 | `--test-negatif p01` | **rouge attendu**, nommant `caisse.coupure_comptee` |
| 3 | `--test-negatif p02` | **rouge attendu**, nommant `etablissements.zzz_table_non_declaree`, P-01 restée verte |
| 4 | Sens de P-02 | **71 tables réelles < 174 entités extraites** — l'extraction ne voit pas *que* ce qu'elle confronte |
| 5 | Mesure SC-009 | *(consignée en T033 ci-dessus)* |
| — | `git status` après | **propre** |
| — | Conteneurs et volumes restants | **0 et 0** |

**Verdict : conforme.** Le guide se déroule sans blocage ni écart entre ce qu'il annonce et ce que
la commande rend.

---

## T036 · Les cinq constats qu'aucune porte ne couvre

**Date** : 2026-08-06 · **Méthode** : requêtes sur le catalogue après application, plus une lecture
de `compose.yml`. **Ce ne sont pas des portes et ils ne prétendent pas l'être** : ce sont des
contrôles humains, datés et consignés, dont la fin est connue.

| Constat | Attendu | Mesuré | Comment |
|---|---|---|---|
| **SC-004** — clé étrangère entre deux schémas | **0** | **0** ✓ | `pg_constraint` où `contype='f'` et les deux `relnamespace` diffèrent |
| **SC-010a** — montant en flottant | **0** | **0** ✓ | Aucune colonne `real` ni `double precision` portant un nom de montant |
| **SC-010b** — *toute* colonne en flottant | **0** | **0** ✓ | Contrôle élargi : **le modèle ne contient aucun flottant, nulle part** |
| **SC-010c** — quantité en entier | **0** | **1**, examiné ci-dessous | Colonnes nommées `%quantite%` de type entier |
| **SC-011** — colonne d'identifiant avec `DEFAULT` | **0** | **0** ✓ | `id` et `%_id` dont `column_default` est non nul |
| **FR-023** — `SEQUENCE` créée | **0** | **0** ✓ | `pg_class` où `relkind='S'` |
| **`compose.yml`** — tag exact | oui | **oui** ✓ | `image: postgres:18.4` ; le seul « latest » du fichier est dans le commentaire qui l'interdit |

### Le seul écart apparent, et pourquoi il n'en est pas un

`editeur.unite_facturable.quantite_comptee` est un **`INTEGER`** et non le domaine `quantite`
(`NUMERIC`). L'amendement A2 vise les quantités de **marchandise** — une quincaillerie vend
2,3 mètres de fer, une boulangerie achète 47,5 kg de farine. Ici on compte des **objets discrets** :
des chambres, des points de vente, des véhicules. **Une demi-chambre facturable n'existe pas**, et
un `NUMERIC` laisserait entendre le contraire.

La colonne porte « quantite » dans son nom parce que c'est le mot du métier de l'abonnement ; le
type dit ce qu'elle est réellement. **Un commentaire de colonne a été ajouté** pour que le prochain
qui lance ce contrôle ne le rouvre pas.

`fiscalite.item_certifie.quantite`, elle, est bien sur le domaine `quantite` — c'est la seule
quantité de marchandise du socle, les autres arrivant au cycle D2.

### Emploi des trois domaines partagés

| Domaine | Colonnes |
|---|---|
| `montant_mineur` | **24** |
| `code_devise` | **17** |
| `quantite` | **1** *(le socle ne porte presque aucune quantité — les lignes de vente et les mouvements de stock sont en D2)* |

---

## T037 · Revue de la *Definition of Done* (`docs/user-stories-v1.md` §0.4)

**Date** : 2026-08-06. Les points de phase 2 et 3 sont déclarés **« sans objet »**, jamais cochés
en silence.

| # | Point | Verdict |
|---|---|---|
| 1 | Critères d'acceptation couverts | ✅ **Tenu** — les douze critères de réussite sont vérifiés un par un, ci-dessus et par les portes |
| 2 | Écrans, navigateur réel, deux moteurs | ⚪ **Sans objet** — phase 2. Ce cycle ne produit aucun écran |
| 3 | Index des écrans à jour | ⚪ **Sans objet** — phase 2 |
| 4 | RLS activée **et forcée** sur toute nouvelle table | ✅ **Tenu, mécaniquement** — P-01, contrôles 2, 3 et 4, à 71/71 |
| 5 | Classe hors-ligne déclarée | ✅ **Tenu, mécaniquement** — P-02, plus cinq entités nommées et inscrites au registre |
| 6 | Endpoints, contrat OpenAPI, client régénéré | ⚪ **Sans objet** — phase 3 |
| 7 | i18n, clés `fr` et `en` | ⚪ **Sans objet** — **aucune chaîne utilisateur n'existe dans ce cycle**. Rien de ce que produit D1 n'est visible par un utilisateur |
| 8 | Migrations `sqlx`, `cargo sqlx prepare`, seeds | ⚪ **Sans objet** — phase 3 |
| 9 | Paramètres exposés en configuration, jamais en dur | ✅ **Tenu** — `parametre_catalogue` et `parametre_configuration` existent, avec leur chaîne d'héritage à quatre portées. Aucun paramètre métier n'est figé dans le schéma : les deux `CHECK` d'énumération qui l'auraient fait ont été **retirées** (`profil_stock`, `etablissement.classement`) |
| 10 | Données simulées supprimées | ⚪ **Sans objet** — aucune donnée simulée n'a été produite |
| 11 | `docs/modele-donnees/` mis à jour dans le même changement | ✅ **Tenu** — c'est **le livrable** de ce cycle, et la règle de tenue est écrite pour la phase 3 |
| 12 | Événements outbox émis à chaque transition | ⚪ **Sans objet** — phase 3. La table et sa contrainte de séquence existent ; rien n'émet encore |
| 13 | Tests de classe instanciés | ⚪ **Sans objet** — phase 3. Aucun harnais de test n'existe |
| 14 | `scripts/verifier.sh` passe en une commande, et toute porte ajoutée a son test négatif | ✅ **Tenu** — une commande, 5 s, deux portes, **deux tests négatifs, chacun vérifié en le cassant volontairement une fois** |

**Sept points « sans objet », six tenus, un tenu mécaniquement par chacune des deux portes.**
Aucun point applicable n'est en échec.
