# Contrat — ce que chaque fichier `docs/modele-donnees/*.sql` honore

*Opposable table par table. Ce n'est pas un guide de style : chaque point est une décision arbitrée dont l'écart coûte une migration, une fuite entre clients, ou une classe hors-ligne devenue fausse en silence.*

**Source** : ce contrat reprend à la lettre `docs/module-dore.md` « Couche 1 » et `docs/module-dore.md` « Couche 2 ». Il ne les reformule pas — une reformulation dérive.

---

## 1 · Structure d'un fichier

```
1. En-tête du fichier    schéma, crate propriétaire, ce que le schéma couvre,
                         ce qu'il ne couvre PAS et pourquoi
2. CREATE SCHEMA         puis GRANT USAGE ON SCHEMA … TO kaya_app
3. Par table, dans l'ordre de dépendance interne au schéma :
   a. commentaire d'en-tête        (§2)
   b. CREATE TABLE                 colonnes typées, contraintes NOMMÉES
   c. ALTER TABLE … ENABLE + FORCE ROW LEVEL SECURITY
   d. CREATE POLICY isolation_tenant       USING + WITH CHECK
   e. CREATE POLICY administration_editeur FOR ALL TO kaya_owner
   f. GRANT …                      qui disent la classe (§3)
   g. CREATE INDEX                 chacun avec son commentaire d'usage (§6)
```

**L'ordre `c → d → e → f` n'est pas interchangeable** : les privilèges se posent après la politique, et la politique après l'activation. Un fichier qui les mêle se relit mal, et c'est un fichier qu'on relira souvent.

**Le nom du fichier porte l'ordre d'application** — préfixe numérique par pas de dix. `scripts/verifier.sh` applique `*.sql` **trié** : il n'existe pas de liste d'ordre ailleurs, donc pas de liste qui puisse diverger du répertoire.

---

## 2 · Commentaire d'en-tête de table — obligatoire, format fixe

```sql
-- ============================================================================
-- <schema>.<table> — <à quoi elle sert, en une phrase>
-- CLASSE <A|B|C|D> · branche <A4|B3|C2|D1> — <le motif de la branche>
-- Story : <CODE-NN>[, <CODE-NN>]
-- <mentions particulières : provision, double classe, compteur, immuabilité>
-- ============================================================================
```

**Une table qui porte deux classes selon l'opération les déclare toutes les deux**, avec l'opération de chacune. C'est le cas normal, pas l'exception : `encaissement` est **B** en espèces et **D** en Mobile Money ; `reconciliation_orpheline` est **A** à la création et **B** à la résolution.

**Une provision porte la mention littérale** : `PROVISION — tables seulement, aucune logique au MVP`.

---

## 3 · Les privilèges disent la classe — matrice opposable

| Forme de l'entité | `kaya_app` reçoit | Ce que l'absence prouve |
|---|---|---|
| **Classe A, append-only** | `SELECT, INSERT` | Qu'aucune ligne ne se récrit — la commutativité que le test de désordre vérifie tient |
| **Classe B ou D avec cycle de vie** | `SELECT, INSERT, UPDATE` | `DELETE` absent : rien ne s'efface, une correction est une contre-passation |
| **Classe C, référentiel** | `SELECT, INSERT, UPDATE` | Idem |
| **Double classe dont une non implémentée** | Les seuls privilèges de la classe **implémentée** | Que la seconde n'est pas là — `reconciliation_orpheline` sans `UPDATE` prouve que la résolution B n'existe pas |
| **Provision lisible** | `SELECT` | Qu'on ne peut rien bâtir dessus |
| **Provision que rien n'a de raison de lire** | **aucun privilège** | Que ce n'est pas la voie retenue — `convention_inter_etablissements`, remplacée par `partenaire` (A12) |

**Aucun `GRANT … ON ALL TABLES IN SCHEMA`.** Un privilège global effacerait toute l'information que cette matrice porte : c'est justement le `UPDATE` **absent sur une table donnée** qui prouve quelque chose.

**`kaya_app` ne reçoit jamais `DELETE`** dans ce cycle. Aucune story du socle ne demande d'effacer une ligne ; la purge ARTCI (TRX-06) est une **anonymisation**, opération d'administration exécutée sous `kaya_owner`.

---

## 4 · Les cinq règles de contenu, à la lettre

### 4.1 · L'identifiant est fourni par le client

```sql
id UUID PRIMARY KEY,   -- UUID v7 généré côté client — AUCUN DEFAULT
```

C'est ce qui rend le rejeu inoffensif : trois envois de la même écriture entrent en conflit de clé primaire et produisent **un** enregistrement. Une clé générée par la base en produirait trois, et le terminal qui vide sa file après une coupure créerait des doublons silencieux — découverts trois mois plus tard, en clôture.

**`DEFAULT gen_random_uuid()` est interdit sur toute clé primaire de ce modèle.**

### 4.2 · Deux horodatages distincts, jamais fusionnés

```sql
horodatage_client TIMESTAMPTZ     NULL,                 -- indicatif ; AUCUNE règle ne s'y appuie
cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),   -- AUTORITÉ SERVEUR
```

| Colonne | Ce qui peut s'y appuyer |
|---|---|
| `cree_le` | **Tout** — durées, taxes, clôtures, tri, pagination |
| `horodatage_client` | **Rien**, hors trois exemptions **limitativement énumérées** : ordre d'affichage local, détection de dérive d'horloge, rendu de l'instant tel que le terminal l'a perçu |

Les tables de **classe C** ne portent pas `horodatage_client` : aucun terminal ne les écrit, et une colonne qu'on n'écrit jamais finit par être écrite.

**Tout tri se fait `ORDER BY cree_le DESC, id DESC`.** Le départage n'est pas décoratif : deux lignes créées dans la même transaction partagent `now()`, et sans lui la pagination sauterait ou répéterait des lignes. L'UUID v7 étant ordonné dans le temps, il départage dans le bon sens.

### 4.3 · Aucune clé étrangère entre deux schémas de modules différents

```sql
auteur_compte_id UUID NOT NULL,   -- pas de REFERENCES : socle/comptes est un autre module
```

**Ce n'est pas parce que la table cible n'existe pas encore.** Même quand elle existe, une clé étrangère joindrait deux schémas de modules, ce que la constitution interdit (principe 2). **L'intégrité référentielle inter-modules passe par un trait exposé, jamais par la base.**

**À l'intérieur d'un même schéma, les clés étrangères sont normales et souhaitables** — et nommées.

**Tout identifiant inter-modules porte un commentaire de colonne le disant.** Sans lui, le cycle qui relira le fichier prendra l'absence de `REFERENCES` pour un oubli et l'ajoutera.

### 4.4 · Montants entiers, quantités décimales

| Grandeur | Domaine | Jamais |
|---|---|---|
| Montant | `montant_mineur` (`BIGINT`) + `code_devise` porté par l'établissement | Un flottant. Nulle part |
| Quantité | `quantite` (`NUMERIC`) | Un entier — une quincaillerie vendra 2,3 mètres de fer, une boulangerie achètera 47,5 kg de farine |

Passer d'entier à décimal après mise en production imposerait de **migrer toutes les lignes** de vente et de stock.

### 4.5 · Toute numérotation continue est un compteur en table

Une `SEQUENCE` PostgreSQL **n'est pas transactionnelle** : chaque transaction annulée laisse un trou. Pour une numérotation opposable — document interne, fiche de police, numéro de retrait pressing, référence à emporter — un trou est une pièce dont personne ne sait si elle a existé.

**La forme est une table à une ligne par portée**, verrouillée ligne à ligne (`SELECT … FOR UPDATE`) par le service en phase 3. **Aucune `SEQUENCE` n'est créée dans ce modèle.**

---

## 5 · Les trois éléments RLS, et pourquoi aucun n'est optionnel

```sql
ALTER TABLE <schema>.<table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <schema>.<table> FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON <schema>.<table>
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON <schema>.<table>
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);
```

| Élément | Ce que son absence coûte |
|---|---|
| **`FORCE`** | Le propriétaire des tables reste hors politique, et la première tâche de maintenance voit tous les clients |
| **`WITH CHECK`** | Un tenant peut **insérer** chez un autre. **C'est la fuite la moins visible du produit : elle n'apparaît dans aucune lecture** |
| **Second argument `true`** | Une transaction sans contexte lève une erreur au lieu de ne rien voir. Un résultat vide ne peut se dégrader qu'en résultat vide ; une erreur peut être avalée par un `catch` mal placé et devenir un accès ouvert |
| **`administration_editeur`, posée à la création** | Toute migration de peuplement ultérieure **réussirait en n'écrivant rien** — sans lever d'erreur |

**Aucune variante d'expression n'est admise.** P-01 cherche cette forme ; une porte qui accepterait deux formes en accepterait trois.

**`SET LOCAL app.current_tenant` se pose dans chaque transaction, jamais à l'ouverture de connexion** — avec un pool, c'est la différence entre l'isolation et la fuite. Cette règle appartient à la phase 3 ; elle est rappelée en commentaire de `00-conventions.sql` pour que le premier cycle backend ne la redécouvre pas.

---

## 6 · Index — justifiés un par un

```sql
-- Sert : <la recherche nommée par la story> (<CODE-NN>)
CREATE INDEX ix_<table>_<usage> ON <schema>.<table> (…);
```

**Un index sans recherche nommée n'est pas créé.** Un index deviné coûte à chaque écriture et ne sert jamais ; et il rend le fichier illisible, parce qu'on ne sait plus lesquels comptent.

---

## 7 · Trois pièges de migration, consignés pour la phase 3

Ils vivent en commentaire dans `00-conventions.sql`. Ils ne concernent pas ce cycle — ils concernent **celui qui écrira la première migration**, et c'est le seul endroit où il les lira à temps.

| Piège | Ce qui se passe | Les formes qui marchent |
|---|---|---|
| **`INSERT`/`UPDATE` de migration sous `FORCE`** | La politique s'applique au propriétaire, `current_setting` vaut `NULL`, **aucune ligne n'est touchée, aucune erreur n'est levée** — la migration réussit en n'écrivant rien | `ADD COLUMN … NOT NULL DEFAULT` (du DDL, hors politique) · peupler un référentiel **avant** `ENABLE`/`FORCE` · la politique `administration_editeur FOR ALL TO kaya_owner`, **posée dès la création** |
| **Contrainte d'exclusion ajoutée après coup** | Elle échoue sur les données existantes | Elle se pose **à la création** de la table |
| **`SEQUENCE` pour une numérotation continue** | Non transactionnelle, laisse des trous | **Compteur en table** avec verrou de ligne (§4.5) |

---

## 8 · Trois conventions opposables au cycle D2

Elles portent sur des tables que le socle ne possède pas. Elles sont écrites ici parce que **c'est le fichier des conventions**, et qu'une règle écrite dans le fichier qu'on n'ouvre pas n'est pas une règle.

| Amendement | Ce qui est dû, sur une table de `ventes` ou de `stocks` |
|---|---|
| **A3** | `unite_mesure` **obligatoire** sur `article`, défaut `'unite'` ; table `conversion_unite_mesure` **créée et non exploitée**, **sans aucun `GRANT` à `kaya_app`, pas même `SELECT`** — rien du produit n'a de raison de la lire, et c'est ce qui la prouve provision |
| **A4** | `cout_unitaire` **nullable** sur `mouvement_stock`, **jamais renseigné au MVP** — sans elle, aucune valorisation rétroactive ne serait possible |
| **A5** | `code_barre` et `article_parent_id` **nullables** sur `article`, non utilisés |
