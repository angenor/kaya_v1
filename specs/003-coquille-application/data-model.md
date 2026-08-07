# Modèle des données simulées — cycle F1

**Cycle** : F1 — Fondations · **Phase** : 2 · **Date** : 2026-08-07
**Plan** : [plan.md](./plan.md) · **Contrat des interfaces** : [contracts/interfaces-domaine.md](./contracts/interfaces-domaine.md)

> ### La règle qui gouverne tout ce document
>
> **Le jeu simulé a la FORME du modèle : mêmes noms de champs, mêmes types, mêmes valeurs d'énumération** (constitution, principe 0 ; DoD point 12 ; FR-040). Chaque type déclaré ici cite **sa table** dans `docs/modele-donnees/`, et un test d'unité confronte les deux champ par champ.
>
> **Ce document ne crée aucune table et n'en modifie aucune.** La phase 1 est close ; `docs/modele-donnees/` fait foi et n'est pas touché par ce cycle.

---

## 1. Les quatre domaines peuplés — et pourquoi pas les quatorze

La clarification a tranché : **la couverture est celle des domaines que le jeu Deloria peuple**, plus le patron qui rend l'ajout mécanique.

| Domaine | Schéma SQL miroir | Ce que Deloria y met | Cycle qui l'a ouvert |
|---|---|---|---|
| `etablissements` | `10-etablissements.sql` | 2 tenants, 2 établissements, 5 modules d'activité, les points de vente | **F1** |
| `comptes` | `20-comptes.sql` | 5 personnes, 5 comptes, les rôles cumulés, les permissions | **F1** |
| `hebergement` | `97-hebergement.sql` | 21 unités, 6 catégories, les formules, les barèmes, les plages | **F1** |
| `ventes` | `55-ventes.sql` | ~30 articles, leurs catégories | **F1** |
| *caisse, fiscalite, documents, synchronisation, pilotage, editeur, metriques, stocks, pressing* | — | **rien** | F2 à F7, **chacun à son tour** |

**Un domaine non peuplé n'a pas d'interface.** Écrire dix interfaces vides produirait dix points d'entrée « dû » qui ne prouveraient rien — et P-06 les compterait.

---

## 2. Domaine `etablissements`

### 2.1 `Tenant` ← `etablissements.tenant`

| Champ | Type | Contrainte reprise du modèle |
|---|---|---|
| `id` | `string` (UUID) | **UUID v7 client, aucune valeur par défaut** — commentaire de la table |
| `tenantId` ⚠️ | `string` | ⚠️ **Le champ SQL s'appelle `tenant_id`** — voir §7, règle de nommage |
| `code` | `string` | unique par tenant |
| `raisonSociale` | `string` | |
| `statut` | `string` | |
| `estEditeur` | `boolean` | `false` pour les deux jeux |

**Les deux tenants** :

| `code` | `raison_sociale` | `est_editeur` |
|---|---|---|
| `DELORIA` | Résidence Hôtel Deloria | `false` |
| `RESIDENCE_TEST` | Résidence Test | `false` |

### 2.2 `Etablissement` ← `etablissements.etablissement`

Champs repris **à l'identique** : `id`, `tenant_id`, `code`, `nom`, `juridiction_code`, `classement`, `commune`, `fuseau_horaire`, `devise`, `adresse`, `ncc`, `cree_le`, `modifie_le`.

| Établissement | `juridiction_code` | `classement` | `commune` | `fuseau_horaire` | `devise` |
|---|---|---|---|---|---|
| **Deloria — Abengourou** | `CI` | `NON_CLASSE` | Abengourou | `Africa/Abidjan` | `XOF` |
| **Résidence Test** | `CI` | `RESIDENCE_MEUBLEE` | Abengourou | `Africa/Abidjan` | `XOF` |

> **`classement` n'a AUCUNE contrainte d'énumération en base**, et le commentaire de la table dit pourquoi : les valeurs sont propres à la juridiction, et les figer imposerait une migration au second pays. **La simulation ne resserre donc pas ce que la base laisse ouvert** : le type est `string`, avec les valeurs ivoiriennes en constantes documentées, jamais en union fermée.
>
> *Sources : `docs/cadrage-v1.md` §2.1 et le Récapitulatif des paramètres d'établissement.*

### 2.3 `ModuleActivite` ← `etablissements.module_activite` et `etablissements.etablissement_module`

**Référentiel en table, jamais une énumération figée dans le code** (ETB-02, provision cadrage §14.3).

| `code` | `libelle` | `implemente_au_mvp` | Deloria | Résidence Test |
|---|---|---|---|---|
| `HEBERGEMENT` | Hébergement | `true` | **actif** | **actif** |
| `RESTAURATION` | Restauration | `true` | **actif** | — |
| `BAR` | Bar | `true` | **actif** | — |
| `PRESSING` | Pressing | `true` | **actif** | — |
| `SALLE_REUNION` | Salle de réunion | `true` | **actif** | — |

`etablissement_module` porte `actif`, `active_le`, `desactive_le` — repris tels quels.

> ⚠️ **Résidence Test est le pendant en phase 2 du test d'agnosticité du socle (ETB-02c).** Un seul module actif, aucun point de vente, aucun article. **Toute surface de la coquille qui supposerait une chambre, un article, un tarif ou une table le découvre ici** — et c'est le moment le moins cher pour le découvrir.

### 2.4 `PointDeVente` ← `etablissements.point_de_vente`

Champs : `id`, `tenant_id`, `etablissement_id`, `module_activite_id`, `nom`, `avec_tables`, `caisse_id`.

| Nom | Module | `avec_tables` |
|---|---|---|
| Restaurant | `RESTAURATION` | `true` |
| Bar | `BAR` | `true` |
| Pressing | `PRESSING` | `false` — **c'est un comptoir**, et l'absence de tables *est* le comptoir (lexique) |

**Résidence Test n'en a aucun.**

---

## 3. Domaine `comptes`

### 3.1 `Personne` ← `comptes.personne` et `Compte` ← `comptes.compte`

**Trois entités distinctes, jamais confondues** (CPT-00) : `personne` (identité civile), `compte` (identité d'authentification, porteuse des rôles), `employe` (**provision vide — non peuplée**).

`Compte` reprend `id`, `tenant_id`, `personne_id`, `identifiant`, `type_identifiant`, `etat`, `derniere_connexion_le`.

> ⚠️ **`empreinte_mot_de_passe` N'EST PAS repris.** La colonne existe en base ; le type simulé ne la porte pas. **Aucun secret dans le paquet servi au navigateur** (cadrage §12.1, FR-094) — et il n'y a pas d'authentification dans ce cycle. La colonne réapparaîtra côté serveur, en phase 3, et jamais dans une réponse.

### 3.2 Les cinq comptes, et leurs rôles cumulés

`comptes.role` porte `code` et `libelle` ; `comptes.compte_role` rattache **un compte à un rôle POUR UN ÉTABLISSEMENT** — la colonne `etablissement_id` est dans la table de liaison, et c'est ce qui permet des rôles différents par site.

| Personne | Identifiant | Rôles | Établissement | Ce qu'il ou elle sert à démontrer |
|---|---|---|---|---|
| **Adjoua** | `+2250700000001` | `gerant` · `caissier` · `receptionniste` | Deloria | **Les rôles cumulés sont la norme, pas l'exception** (CPT-02) |
| **Yao** | `+2250700000002` | `receptionniste` | Deloria | Le jeu de permissions le plus étroit de la réception |
| **Aminata** | `+2250700000003` | `serveur` | Deloria | Celui sur lequel se vérifie qu'**une action interdite est absente du HTML** |
| **M. Koffi** | `+2250700000004` | `proprietaire` | Deloria **et** Résidence Test | **Le multi-établissement** — le sélecteur bascule en deux taps |
| **Éditeur** | `admin@kaya.ci` | `admin_editeur` | *(portée éditeur)* | La portée qui n'est pas celle d'un établissement |

`type_identifiant ∈ {TELEPHONE, EMAIL, CODE}` · `etat ∈ {ACTIF, SUSPENDU, REVOQUE}` — **valeurs reprises des commentaires de colonne**, non inventées.

### 3.3 `Permission` ← `comptes.permission`

Champs : `code`, `module_activite_code` *(nullable — une permission peut être transverse)*, `libelle`.

**Les permissions d'un compte sont l'UNION de celles de ses rôles** (FR-049). Le calcul est une fonction pure, testée sur Adjoua — trois rôles — et sur Aminata — un seul.

> ⚠️ **Les mots « rôle » et « permission » n'atteignent jamais l'interface** (D-06, FR-090). Ils vivent dans les types et dans le panneau **Scénarios**, qui est un instrument, pas le produit.

---

## 4. Domaine `hebergement` — le jeu de Deloria

### 4.1 `Categorie` ← `hebergement.categorie`

Champs : `id`, `tenant_id`, `etablissement_id`, `nom`, `capacite_accueil`, `ordre`, `actif`.

### 4.2 `Unite` ← `hebergement.unite`

Champs : `id`, `tenant_id`, `categorie_id`, `code`, `etage`, `statut_menage`, `actif`.

**Les 17 unités de Deloria, en 5 catégories, plus la salle de réunion** — codes et tarifs de `docs/cadrage-v1.md` §2.1 :

| Catégorie | Unités | Nombre | Tarif **affiché** à Deloria |
|---|---|---|---|
| Standard | `A1` `A2` `A3` | 3 | 12 500 F |
| Classique | `B1` `B2` `B3` `B4` `B5` | 5 | 15 500 F |
| Classique supérieure | `C1` `C2` `C3` `C4` | 4 | 17 500 F |
| Supérieure A | `D1` `D2` | 2 | 20 500 F |
| Supérieure B | `E1` `E2` `E3` | 3 | 25 500 F |
| **Total chambres** | | **17** ✓ | |
| Salle de réunion | `SR1` | 1 | 50 500 F / jour |

**Résidence Test** : 4 unités, une seule catégorie (`Logement`), codes `L1` à `L4`.

`statut_menage` par défaut `'PROPRE'` — repris du modèle.

### 4.3 `Formule` ← `hebergement.formule` — ⚠️ le point fiscal du jeu

Champs repris : `id`, `tenant_id`, `categorie_id`, `type`, `prix_base`, `code_devise`, `duree_min_minutes`, `duree_max_minutes`, `heure_arrivee_standard`, `heure_depart_standard`, `jours_autorises`, `assujettie_taxe_nuitee`, `regle_conversion_taxe`, `actif`.

> ### ⚠️ Les 500 F de la taxe de séjour ne sont PAS dans `prix_base`
>
> `docs/cadrage-v1.md` §2.1 porte un **point de conformité** explicite : *« les tarifs affichés “incluent une augmentation de 500 FCFA par catégorie”, ce qui correspond au montant de la taxe communale de nuitée pour un établissement non classé. Intégrée au prix au lieu d'être une ligne distincte sur la facture, elle place l'établissement en infraction. La reprise de données devra décomposer chaque tarif en prix HT + TVA + taxe de nuitée. »*
>
> **Le jeu simulé encode donc la forme CONFORME, pas le statu quo** : `prix_base` porte le tarif **hors taxe de séjour** — 12 000 pour Standard, 15 000 pour Classique, 17 000, 20 000, 25 000 —, et les 500 F sont une **ligne distincte** portée par la taxe communale du Récapitulatif.
>
> **Motif** : un jeu de données est recopié par les six cycles suivants. Y écrire 12 500 en `prix_base` avec `assujettie_taxe_nuitee = true` ferait **compter la taxe deux fois** au premier cycle qui calcule — et le défaut passerait pour un défaut de calcul.
>
> **Ce cycle ne calcule rien** : il porte le référentiel, il ne le lit pas. **La décomposition HT / TVA reste ouverte** et appartient au cycle fiscal (F6, tranche T3) ; elle est signalée au rapport de cycle plutôt que devinée ici.

**Les quatre formules, par catégorie** — valeurs du **Récapitulatif des paramètres d'établissement** :

| `type` | `prix_base` | `duree_min` / `max` | `heure_arrivee` / `depart` | `assujettie_taxe_nuitee` | `regle_conversion_taxe` |
|---|---|---|---|---|---|
| `NUITEE` | tarif − 500 | — | **14 h** / **12 h** | **`true`** | **`une_nuitee_par_occupation`** |
| `PASSAGE` | *(barème, §4.4)* | 60 / **480 min** | — | **`false`** — *tranché au terrain le 2026-08-02* | — |
| `DEMI_JOURNEE` | *(plages, §4.5)* | — | — | **`false`** — *idem* | — |
| `MENSUEL` | — | — | — | `true` | `au_prorata` |

*`480 min` est le `seuil_bascule_nuitee_minutes` du Récapitulatif — 8 h —, porté ici par `duree_max_minutes`.*

### 4.4 `BaremePalier` ← `hebergement.bareme_palier`

Champs : `id`, `tenant_id`, `formule_id`, `duree_minutes`, `prix`, `code_devise`, `est_heure_supplementaire`.

**Le barème de passage, à paliers dégressifs** — Récapitulatif, HEB-04 :

| `duree_minutes` | `prix` | `est_heure_supplementaire` |
|---|---|---|
| 60 | 1 500 | `false` |
| 120 | 2 800 | `false` |
| 180 | 4 000 | `false` |
| 240 | 5 000 | `false` |
| 60 | **1 200** | **`true`** |

*Aucun de ces prix ne porte les 500 F : le passage n'est **pas assujetti** à la taxe de nuitée.*

### 4.5 `PlageDemiJournee` ← `hebergement.plage_demi_journee`

Champs : `id`, `tenant_id`, `formule_id`, `libelle`, `heure_debut`, `heure_fin`.

| `libelle` | `heure_debut` | `heure_fin` |
|---|---|---|
| Matinée | `08:00` | `12:00` |
| Après-midi | `13:00` | `16:00` |

*Les deux plages sont **celles de l'établissement**, jamais écrites en dur : le lexique l'exige pour le refus `plage_non_fractionnable`, et le jeu simulé les porte comme des données.*

### 4.6 `TempsRemiseEnEtat` ← `hebergement.temps_remise_en_etat`

| Formule | Durée |
|---|---|
| `PASSAGE` | **30 min** |
| `NUITEE` | **2 h** |
| `DEMI_JOURNEE` | **1 h** |

### 4.7 Ce que ce cycle NE peuple PAS dans `hebergement`

**Aucune occupation, aucun séjour, aucune réservation, aucune note, aucune fiche de police, aucun client.** Ce sont des **données de mouvement**, et elles appartiennent aux cycles F3 et F7. Ce cycle porte le **référentiel** : ce qui existe, pas ce qui se passe.

*Conséquence directe : la contrainte d'exclusion GiST du principe 4 n'a rien à garantir ici, et le plan le déclare « sans objet » plutôt que de le cocher en silence.*

---

## 5. Domaine `ventes`

### 5.1 `CategorieArticle` ← `ventes.categorie_article` et `Article` ← `ventes.article`

`Article` reprend : `id`, `tenant_id`, `point_de_vente_id`, `categorie_article_id`, `destination_preparation_id`, `nom`, `prix`, `code_devise`, `taux_tva`, `disponible`, `suivi_stock`, `unite_mesure`, `code_barre`, `article_parent_id`.

**La trentaine d'articles, répartie sur les points de vente** :

| Point de vente | Catégories | Articles | Exemples |
|---|---|---|---|
| **Bar** | Bières · Boissons sans alcool · Spiritueux | ~14 | bières locales, sucreries, eau |
| **Restaurant** | Grillades · Plats · Accompagnements · Petits déjeuners | ~12 | poulet braisé, attiéké, garba |
| **Pressing** | Prestations | ~5 | chemise, pantalon, boubou |
| **Total** | | **≥ 30** ✓ (SC-011) | |

> ⚠️ **`taux_tva` est un `NUMERIC`, et `prix` un `montant_mineur` (BIGINT).** Les deux types viennent de `00-conventions.sql` et le principe 5 les impose : **montant entier en unité mineure, quantité en NUMERIC**. Le type simulé **ne doit pas rendre `taux_tva` en nombre à virgule flottante** — 18 % s'écrit `'18'` ou `'0.18'` en chaîne décimale, jamais `0.18` en flottant. *Une quincaillerie vendra 2,3 mètres de fer, et un flottant sur une quantité est refusé par le principe 5.*

### 5.2 Ce que ce cycle NE peuple PAS dans `ventes`

Aucune commande, aucune ligne, aucune addition, aucun bon de dépôt. **Référentiel seulement.**

---

## 6. Les entités propres à la coquille — hors modèle SQL, et déclarées comme telles

*Elles n'ont **aucune** table dans `docs/modele-donnees/` et n'en auront jamais : elles vivent sur le terminal.*

### 6.1 `ElementFile` — la file hors-ligne

| Champ | Type | Origine |
|---|---|---|
| `id` | `string` | **UUID v7 client** — `uuid.v7()` (cadrage §11.5, point 1 ; FR-057) |
| `horodatageClient` | `string` (ISO) | indicatif, ordre d'affichage local |
| `classe` | `'A' \| 'B' \| 'C' \| 'D'` | **lue depuis `docs/registre-classes-offline.md`**, jamais recopiée (FR-060) |
| `operation` | `string` | le nom de l'opération visée |
| `charge` | `unknown` | la charge utile |
| `etat` | `'EN_ATTENTE'` | **une seule valeur en phase 2** : la file n'envoie rien (FR-061) |

**Persistée dans IndexedDB via `idb`** — magasin `file`. Elle survit au rechargement et à la relance (FR-058).

> **La classe A seule entre.** Une opération B, C ou D est **refusée avant la tentative**, avec la phrase du lexique — « **Cette action nécessite internet.** » — et l'alternative. **Aucune donnée B, C ou D en cache d'écriture** (cadrage §11.5, point 4 ; FR-061).

### 6.2 `Session`

| Champ | Type | Note |
|---|---|---|
| `compteId` | `string` | choisi parmi les cinq, **depuis le panneau Scénarios** |
| `etablissementId` | `string` | l'établissement actif |
| `permissions` | `string[]` | **l'union** des permissions des rôles, recalculée |

**Persistée dans IndexedDB** — magasin `session`. **Reprise par le middleware global à chaque navigation, la première comprise** (FR-033). **Aucun jeton, aucun secret** : il n'y a pas d'authentification dans ce cycle.

### 6.3 `ReglagesScenario`

| Levier | Type | Valeur initiale |
|---|---|---|
| `latenceMs` | `number` | `0` |
| `echecReseau` | `boolean` | `false` |
| `horsLigne` | `boolean` | `false` |
| `jeuVide` | `boolean` | `false` |
| `compteActif` | `string` | Adjoua |
| `etablissementActif` | `string` | Deloria |

**Persistés** — un réglage qui ne survivrait pas au rechargement se reposerait à chaque essai, et on cesserait de s'en servir (FR-045).

### 6.4 `EtatTemoin` — dérivé, jamais stocké

| État interne | Condition | **Libellé visible** *(lexique — fait foi)* |
|---|---|---|
| `connecte` | en ligne, latence < seuil | « **Enregistré** » / *Saved* |
| `degrade` | en ligne, latence **≥ 3 000 ms** *(`sync.latence_degradee_seuil_ms`)* | « **Connexion faible** » / *Weak connection* |
| `hors_ligne` | levier hors ligne actif | « **Hors connexion** » / *No connection* |
| *(tout état)* | file non vide | « **En attente d'envoi (n)** » / *Pending send (n)* |

> ⚠️ **Les trois noms d'état internes n'atteignent jamais l'écran** (D-01, FR-086). Le lexique documente que `app/core/i18n` avait dérivé sur exactement ces trois libellés, et qu'il a fallu le corriger. **SC-022 le vérifie : zéro occurrence de « connecté », « dégradé » et « hors ligne » dans le HTML rendu et dans les deux catalogues.**

---

## 7. La règle de nommage — et le seul endroit où la simulation s'écarte du SQL

Le modèle SQL est en `snake_case` ; TypeScript est en `camelCase`. **C'est le seul écart autorisé**, et il doit être mécanique pour rester vérifiable.

**Décision** : les types simulés portent le `camelCase` (`tenantId`, `prixBase`, `assujettieTaxeNuitee`), et **le test de conformité applique la transformation `snake_case → camelCase` avant de comparer**. Il compare donc :

1. **l'ensemble des champs** — aucun champ en trop, aucun manquant *(hors les colonnes délibérément non reprises, qui sont **listées** avec leur motif : `empreinte_mot_de_passe`, `cree_le`, `modifie_le`)* ;
2. **les valeurs d'énumération** — celles des commentaires de colonne et des contraintes `CHECK` ;
3. **la classe de type** — `montant_mineur` → entier ; `quantite` et `NUMERIC` → **chaîne décimale, jamais un flottant** ; `TIMESTAMPTZ` → chaîne ISO ; `TIME` → `HH:MM`.

**Toute divergence fait échouer la vérification** (FR-040, SC-012). *Le test lit les fichiers `.sql` : il n'y a donc pas de seconde liste à tenir, et elle ne peut pas diverger.*

---

## 8. Ce que ce document n'établit pas

| Point | Qui le tranche |
|---|---|
| La décomposition **HT / TVA** de `prix_base` | Le cycle fiscal (F6, tranche T3). **Signalé au rapport de cycle**, pas deviné ici |
| Le statut fiscal de la salle de réunion vis-à-vis de la taxe de séjour | idem — le jeu la pose `assujettie_taxe_nuitee = false`, une salle n'étant pas une nuitée, et le signale |
| Les données de **mouvement** — occupations, séjours, commandes | Les cycles F3 à F7, chacun pour son parcours |
| Les dix domaines non peuplés | Le cycle qui en a besoin, en recopiant le patron de [contracts/interfaces-domaine.md](./contracts/interfaces-domaine.md) |
