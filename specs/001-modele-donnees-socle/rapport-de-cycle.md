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
