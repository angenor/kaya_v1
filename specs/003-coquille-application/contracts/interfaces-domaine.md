# Contrat — les interfaces de domaine, et le patron qu'un domaine nouveau recopie

**Cycle** : F1 · **Exigences** : FR-038 à FR-043 · **Modèle** : [data-model.md](../data-model.md)
**Famille §3.4 tranchée par ce cycle** : *Données simulées du front* — voir [research.md §2.1](../research.md)

---

## 1. La couture, et pourquoi elle est là et pas ailleurs

> **La couture entre le simulé et le réel est l'INTERFACE DE DOMAINE, jamais la requête HTTP.**

C'est la décision structurante du cycle, et elle découle directement de la règle de branchement de la constitution :

> *« Aucune donnée simulée ne survit à la mise en service de l'endpoint qui la remplace. Le cycle backend qui livre un endpoint DOIT supprimer la simulation correspondante dans le même changement. »* — principe 0

**Un remplacement endpoint par endpoint se fait derrière une interface.** On change l'implémentation liée à un domaine, et **aucun composant ne s'en aperçoit** : il n'a jamais connu la provenance (FR-039).

```
        ┌─────────────────────────────────────────────┐
        │  Composants et pages                        │
        │  — ne connaissent JAMAIS la provenance      │
        └───────────────────┬─────────────────────────┘
                            │ consomme
                  ┌─────────▼──────────┐
                  │ DonneesHebergement │   ← l'interface. Elle NE CHANGE PAS.
                  └─────────┬──────────┘
              ┌─────────────┴─────────────┐
   phase 2 ►  │                           │  ◄ phase 3
  ┌───────────▼──────────┐   ┌────────────▼─────────────┐
  │ SimulationHebergement│   │ ClientHebergement        │
  │ jeu Deloria, mémoire │   │ openapi-fetch + types    │
  │ SUPPRIMÉE au         │   │ générés depuis openapi   │
  │ branchement          │   │                          │
  └──────────────────────┘   └──────────────────────────┘
```

**Ce que cette couture rend possible, et qu'une interception réseau ne rendrait pas** : la simulation et le vrai code ne cohabitent **jamais** dans le même fichier. Supprimer une simulation, c'est supprimer un fichier et changer une ligne de liaison — pas retirer des gestionnaires un à un dans un fichier partagé.

---

## 2. Le patron — `contrat.ts`

*Ce qu'un domaine nouveau recopie. C'est ce qui rend l'ajout mécanique pour F2 à F7, et c'est la moitié du livrable de ce cycle : les dix domaines non peuplés n'ont pas d'interface, mais ils ont ce patron.*

```ts
/**
 * Toute interface de domaine respecte ces quatre règles.
 * Elles ne sont pas des conseils : la porte P-06 et le test de conformité
 * du modèle les vérifient.
 */

// 1 — Toute opération est asynchrone et rend un Resultat.
//     Un domaine peut échouer (réseau, permission, jeu vide) et l'échec
//     n'est pas une exception : il s'affiche.
export type ResultatDomaine<T> =
  | { readonly ok: true;  readonly valeur: T }
  | { readonly ok: false; readonly echec: EchecDomaine }

export interface EchecDomaine {
  /** Code stable — l'interface branche sa clé i18n SUR LE CODE, jamais sur un message. */
  readonly code: CodeEchec
  /** Paramètres de la phrase (nombres, heures, noms). Jamais une phrase. */
  readonly parametres: Readonly<Record<string, string | number>>
}

export type CodeEchec =
  | 'HORS_LIGNE'          // le levier hors ligne, ou le réseau réel
  | 'ECHEC_RESEAU'        // le levier d'échec
  | 'INTROUVABLE'
  | 'PERMISSION_ABSENTE'  // ne devrait JAMAIS s'afficher — l'action est absente

// 2 — Toute écriture déclare SA CLASSE HORS-LIGNE, et elle vient du registre.
export interface Operation {
  readonly nom: string
  /** Lue depuis docs/registre-classes-offline.md — jamais recopiée ici. */
  readonly classe: ClasseHorsLigne
}
export type ClasseHorsLigne = 'A' | 'B' | 'C' | 'D'

// 3 — Toute lecture est paramétrée par l'établissement actif.
//     AUCUNE interface ne suppose qu'un établissement a de l'hébergement
//     ou un point de vente (constitution, principe 2).
export interface PorteeLecture {
  readonly etablissementId: string
}

// 4 — Aucune interface ne rend un type propre à la simulation.
//     Ce qu'elle rend est ce que le client généré rendra.
```

> **Le code d'échec, jamais le message.** Le lexique est formel : *« L'interface branche sa clé i18n sur le `code`, jamais sur le `message` — qui nomme des tables et parle anglais technique. »* La simulation d'aujourd'hui et l'API de demain rendent donc **le même code**, et l'écran ne change pas au branchement.

---

## 3. Les quatre interfaces livrées

*Seules les opérations que ce cycle exerce réellement sont déclarées. **Une opération sans appelant serait un « dû » de plus au registre de P-06** — on n'en écrit pas par anticipation.*

### 3.1 `DonneesEtablissements`

```ts
export interface DonneesEtablissements {
  listerEtablissements(): Promise<ResultatDomaine<Etablissement[]>>
  lireEtablissement(id: string): Promise<ResultatDomaine<Etablissement>>
  /** Les modules ACTIFS. Un module inactif n'est pas rendu — il est absent. */
  listerModulesActifs(portee: PorteeLecture): Promise<ResultatDomaine<ModuleActivite[]>>
  listerPointsDeVente(portee: PorteeLecture): Promise<ResultatDomaine<PointDeVente[]>>
}
```

> ⚠️ **`listerModulesActifs` ne rend PAS les modules inactifs avec un drapeau.** Elle ne les rend pas. C'est le principe 7 appliqué à la source : *« L'interface ne montre jamais un module d'activité inactif : pas de grisé, absent. »* Rendre la liste complète avec un booléen inviterait chaque écran à décider lui-même — et l'un d'eux griserait.

### 3.2 `DonneesComptes`

```ts
export interface DonneesComptes {
  listerComptes(): Promise<ResultatDomaine<Compte[]>>
  lireCompte(id: string): Promise<ResultatDomaine<Compte>>
  /** L'UNION des permissions des rôles du compte SUR CET ÉTABLISSEMENT. */
  resoudrePermissions(compteId: string, etablissementId: string): Promise<ResultatDomaine<string[]>>
}
```

### 3.3 `DonneesHebergement`

```ts
export interface DonneesHebergement {
  listerCategories(portee: PorteeLecture): Promise<ResultatDomaine<Categorie[]>>
  listerUnites(portee: PorteeLecture): Promise<ResultatDomaine<Unite[]>>
  listerFormules(categorieId: string): Promise<ResultatDomaine<Formule[]>>
  lireBareme(formuleId: string): Promise<ResultatDomaine<BaremePalier[]>>
  listerPlagesDemiJournee(formuleId: string): Promise<ResultatDomaine<PlageDemiJournee[]>>
}
```

**Aucune opération d'occupation, de séjour ou de réservation.** Ce sont des données de mouvement, et elles appartiennent aux cycles F3 et F7.

### 3.4 `DonneesVentes`

```ts
export interface DonneesVentes {
  listerCategoriesArticle(pointDeVenteId: string): Promise<ResultatDomaine<CategorieArticle[]>>
  listerArticles(pointDeVenteId: string): Promise<ResultatDomaine<Article[]>>
}
```

---

## 4. La liaison — `fournisseur.ts`

```ts
/**
 * LE SEUL endroit du dépôt qui sait qu'une implémentation est simulée.
 * En phase 3, chaque ligne bascule INDÉPENDAMMENT des autres — c'est
 * exactement ce que « endpoint par endpoint » veut dire.
 */
export interface Fournisseur {
  readonly etablissements: DonneesEtablissements
  readonly comptes:        DonneesComptes
  readonly hebergement:    DonneesHebergement
  readonly ventes:         DonneesVentes
}
```

**Ce que le cycle de phase 3 fera, concrètement** : remplacer une ligne, supprimer le fichier `simulation.ts` du domaine, et laisser `interface.ts` et `types.ts` intacts. *Un test échoue si une simulation subsiste pour un endpoint servi* — c'est la porte que la phase 3 ajoutera, et cette structure est ce qui la rend écrivable.

---

## 5. Où les scénarios s'appliquent — et pourquoi pas dans les composants

Les cinq leviers (FR-044) s'appliquent **dans la couche de simulation**, jamais dans un composant :

| Levier | Effet, à l'intérieur de la simulation |
|---|---|
| **latence** | chaque opération attend `latenceMs` avant de rendre → l'écran montre son **squelette** |
| **échec réseau** | rend `{ ok: false, echec: { code: 'ECHEC_RESEAU' } }` → l'écran montre son **bandeau** |
| **hors ligne** | rend `{ ok: false, echec: { code: 'HORS_LIGNE' } }` **en lecture** ; **en écriture**, la file tranche selon la classe |
| **jeu vide** | rend des collections vides → l'écran montre son **état vide illustré** |
| **permissions restreintes** | change `compteActif` → `resoudrePermissions` rend un autre ensemble → **le HTML change** |

> **Pourquoi pas dans les composants.** Un composant qui saurait qu'un scénario existe serait un composant à réécrire en phase 3. La simulation, elle, **disparaît** au branchement — et les leviers avec elle. *Les scénarios sont une propriété de la source de données, pas de l'écran qui l'affiche.*

**Le levier d'essai d'écriture** (FR-093, D-18) est la seule exception, et il vit dans le panneau **Scénarios** : il produit une écriture dont on choisit la classe, et la donne à la file. Il n'appartient à aucun domaine parce qu'il n'appartient à aucun métier — c'est un instrument.

---

## 6. Comment le contrat est vérifié

| Exigence | Mécanisme | Où |
|---|---|---|
| **FR-038** — une interface par domaine, celle de la phase 3 | Revue à la conception + le patron `contrat.ts` | — |
| **FR-039** — les composants ne connaissent pas la provenance | Règle **ESLint** : aucun composant n'importe de `**/simulation.ts` ni de `donnees/jeux/**` | étape **lint** |
| **FR-040** — mêmes noms, mêmes types, mêmes énumérations | Test d'unité : les types sont confrontés aux `.sql` de `docs/modele-donnees/`, champ par champ, après transformation `snake_case → camelCase` | **tests d'unité** |
| **FR-041** — couverture = les domaines que Deloria peuple | Test d'unité : `Fournisseur` porte **exactement quatre** clés | **tests d'unité** |
| **FR-042 · FR-043** — le jeu de Deloria et Résidence Test | Tests d'unité de décompte : 17 unités / 5 catégories, ≥ 30 articles, 5 comptes, 4 unités / 1 module | **tests d'unité** |
| **Aucune surface ne suppose l'hébergement ou le point de vente** | **P-04** : le parcours complet est rejoué sur **Résidence Test** — pendant de **ETB-02c** en phase 2 | **P-04** |
| **FR-044 · FR-045** — les cinq leviers, depuis l'interface, persistants | **P-04** : chaque levier est actionné, son effet constaté, puis la page rechargée | **P-04** |
