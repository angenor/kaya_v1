# Démarrage rapide — appliquer le modèle et prouver que les portes savent échouer

*Cinq minutes, une commande, et deux preuves. Ce guide valide le cycle D1 de bout en bout ; il ne contient aucun SQL — le modèle est dans [`docs/modele-donnees/`](../../docs/modele-donnees/), le contrat dans [contracts/conventions-sql.md](./contracts/conventions-sql.md).*

---

## Prérequis

| Élément | Vérification | Si absent |
|---|---|---|
| Docker et le greffon Compose | `docker compose version` | Le script sort en `3` avec le message qui le dit |
| Rien d'autre | — | **Ni `psql`, ni Rust, ni Node.** Le client `psql` est celui de l'image `postgres:18.4`, appelé par `docker compose exec` |

> **Le poste de développement est arm64, la production est linux/amd64.** L'image `postgres:18.4` est multi-architecture (`docs/versions-reference.md` §4.2) : le même `compose.yml` sert les deux. Ce cycle ne produit aucun binaire, la contrainte d'architecture ne le concerne pas.

---

## 1 · La commande unique

```sh
scripts/verifier.sh
```

C'est tout. Elle enchaîne les deux portes, **sort en échec au premier contrôle rouge**, détruit la base de vérification en sortant — normalement, en échec, ou à l'interruption — et imprime sa durée.

**Attendu** :

```
── P-01 · le modèle s'applique sur une base vierge, et chaque table porte ENABLE + FORCE + sa politique
   Périmètre : 11 fichiers appliqués · 11 schémas · 71 tables inspectées
   Plancher  : 60 tables attendues au minimum — atteint
   ✓ tenant_id NOT NULL           71/71
   ✓ ENABLE + FORCE               71/71
   ✓ politique isolation_tenant   71/71
   VERT

── P-02 · toute table du modèle a une classe déclarée au registre
   Périmètre : 71 tables réelles confrontées à N entités extraites du registre
   Sens      : table → registre
   VERT

TOUT VERT — 2 portes — 47 s
```

**Repère de coût** : sous **deux minutes** (SC-008). Au-delà, on cesse de lancer un script — c'est le déclencheur documenté du passage au serveur d'intégration, en phase 3.

---

## 2 · Prouver que P-01 sait échouer

```sh
scripts/verifier.sh --test-negatif p01
```

Le script copie `docs/modele-donnees/` dans un répertoire temporaire, **retire une politique `isolation_tenant`**, relance la porte sur la copie et exige qu'elle sorte rouge.

**Attendu** :

```
── TEST NÉGATIF P-01 · politique retirée sur caisse.coupure_comptee (copie de travail)
   ✗ politique isolation_tenant   70/71
     MANQUANTE : caisse.coupure_comptee
   La porte a échoué comme attendu — TEST NÉGATIF VERT
```

**Ce qu'on refuse** : que la porte passe au vert. Dans ce cas le script sort en **`4`**, un code distinct de l'échec ordinaire — parce qu'une porte rouge signale un défaut du modèle, tandis qu'une porte qui refuse d'être rouge signale un défaut **de la porte**, et les deux ne se réparent pas au même endroit.

**Aucun fichier de `docs/modele-donnees/` n'est touché.** Le mode opère sur une copie ; vérifiez-le d'un `git status` propre après coup.

---

## 3 · Prouver que P-02 sait échouer

```sh
scripts/verifier.sh --test-negatif p02
```

Le script ajoute dans la copie de travail une table `zzz_table_non_declaree` — **avec son tronc commun et sa RLS complète**, pour qu'elle passe P-01 et n'échoue que sur P-02.

**Attendu** :

```
── TEST NÉGATIF P-02 · table zzz_table_non_declaree ajoutée (copie de travail)
   ✗ 1 table non déclarée au registre
     etablissements.zzz_table_non_declaree
   La porte a échoué comme attendu — TEST NÉGATIF VERT
```

> **Pourquoi la table du test porte sa RLS complète.** Sans elle, l'échec viendrait de P-01, et on croirait avoir prouvé P-02 alors qu'on aurait prouvé P-01 une seconde fois. C'est la faute type d'un test négatif écrit vite.

---

## 4 · Prouver ce que P-02 ne doit **pas** refuser

Le sens de la comparaison est **table → registre**. Une entité déclarée au registre **sans table** est normale : les §6, §7 et §8 déclarent déjà tout le cycle D2, et le §10 déclare des provisions que ce cycle ne crée pas.

**Contrôle à l'œil, une fois** : la sortie de P-02 annonce plus d'entités extraites que de tables réelles. Si les deux nombres étaient égaux, l'extraction du registre serait cassée — elle ne verrait que ce qu'elle confronte.

---

## 5 · Mesurer la recherche de personne (SC-009)

Le seul critère de performance du cycle qui ne se lise pas dans le catalogue.

```sh
scripts/verifier.sh --porte p01      # laisse la base debout ? non : elle est détruite
```

**La mesure est manuelle et ponctuelle**, hors du script : elle exige un jeu de volume que le cycle ne produit pas. Marche à suivre, à consigner dans le rapport de cycle :

1. Appliquer le modèle sur une base locale non éphémère.
2. Générer 10 000 lignes de `comptes.personne` — noms, téléphones E.164, numéros de pièce.
3. `EXPLAIN ANALYZE` sur les trois recherches : par préfixe de `nom_normalise`, par `telephone_e164`, par `(type_piece, numero_piece)`.
4. **Attendu : moins de 300 ms sur les trois**, et un parcours d'index sur les trois.

> **Si la recherche par nom échoue sur un cas réel** — une recherche **infixe**, pas par préfixe —, l'extension `pg_trgm` s'ajoute sans migration de données. Elle n'est **pas** créée par ce cycle : ouvrir une extension avant d'avoir constaté qu'elle manque, c'est décider trop tôt (décision [D-13](./research.md)).

---

## 6 · Ce que ce guide ne prouve pas

- **Ni la justesse d'une classe.** Aucune lecture du schéma ne retrouve qu'un encaissement est **B** en espèces et **D** en Mobile Money. C'est le seul point du modèle qui demande un jugement humain, et c'est pourquoi l'arbre de décision du registre §3 est court et ses branches nommées.
- **Ni l'absence de clé étrangère entre schémas de modules.** Mécanisable, et **non mécanisée par ce cycle** : les schémas du socle sont créés seuls, la tentation n'apparaît qu'au cycle D2 où `ventes → hebergement` et `pressing → hebergement` sont deux rattachements sans FK. La porte s'y justifiera, avec une cible non vide à inspecter.
- **Ni la pertinence d'un index.** Chaque index porte en commentaire la recherche nommée qu'il sert ; c'est une discipline d'écriture, pas un contrôle.
- **Ni quoi que ce soit de la phase 2 ou 3.** Aucun écran, aucun endpoint, aucune migration n'existe encore — et c'est l'ordre voulu.
