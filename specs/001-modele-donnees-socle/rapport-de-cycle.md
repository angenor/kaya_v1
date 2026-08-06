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
