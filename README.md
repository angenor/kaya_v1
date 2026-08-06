# Kaya

*Logiciel de gestion pour les établissements d'Afrique de l'Ouest — hébergement, restauration,
bar, pressing. Multi-tenant, hors-ligne d'abord, conforme à la facturation normalisée ivoirienne.*

**Phase en cours : 1 — le modèle de données.** Aucun écran, aucun endpoint, aucune migration
n'existe encore, et c'est l'ordre voulu (constitution, principe 0) : le modèle vient d'abord, les
écrans ensuite sur données simulées, le serveur en dernier.

---

## La commande unique

```sh
scripts/verifier.sh
```

**Une seule commande, qui enchaîne tout ce qui doit passer et sort en échec au premier contrôle
rouge.** Pas dix scripts qu'on lance de mémoire, dont on oublie le troisième. Elle grossira à
mesure que le produit grandit ; elle ne se dupliquera pas.

**Prérequis : `docker` et le greffon `compose`. Rien d'autre.** Ni `psql`, ni Rust, ni Node : le
client `psql` est celui de l'image `postgres:18.4`, appelé par `docker compose exec`.

**Repère de coût : moins de deux minutes.** Le script imprime sa durée. Au-delà de deux ou trois
minutes, on cesse de lancer un script — c'est le déclencheur documenté du passage au serveur
d'intégration, en phase 3.

### Ce que chaque porte vérifie

| Porte | Ce qu'elle prouve |
|---|---|
| **P-01** | Le modèle de [`docs/modele-donnees/`](docs/modele-donnees/) s'applique **dans l'ordre, sans erreur, sur une base PostgreSQL vierge** — et chaque table porte les quatre éléments d'isolation : une colonne `tenant_id` non nulle, `ENABLE` **et** `FORCE ROW LEVEL SECURITY`, la politique `isolation_tenant` en `USING` **et** `WITH CHECK`, et la politique `administration_editeur` posée dès la création |
| **P-02** | Toute table du modèle a une **classe hors-ligne déclarée** dans [`docs/registre-classes-offline.md`](docs/registre-classes-offline.md). Sens de la comparaison : **table → registre**. Une entité déclarée sans table est normale — le registre déclare déjà le cycle suivant ; une **table non déclarée est l'erreur** |

Chaque porte déclare son **périmètre inspecté**, vérifie sa **complétude**, ne **modifie pas** ce
qu'elle inspecte — l'empreinte du modèle et du registre est relevée avant et après —, et prouve que
sa **cible n'est pas vide** par un plancher déclaré.

### Une porte seule

```sh
scripts/verifier.sh --porte p01
scripts/verifier.sh --porte p02
```

### Les deux tests négatifs

```sh
scripts/verifier.sh --test-negatif p01   # retire une politique et EXIGE que P-01 échoue
scripts/verifier.sh --test-negatif p02   # ajoute une table non déclarée et EXIGE que P-02 échoue
scripts/verifier.sh --test-negatif       # les deux
```

> **`--test-negatif` n'est pas un mode de débogage, c'est une preuve.** *Une porte qui ne trouve
> jamais rien est indistinguable d'une porte qui n'a rien à trouver.* Le mode opère sur une **copie
> de travail** du modèle : il ne touche jamais `docs/modele-donnees/`, et l'empreinte du répertoire
> le vérifie plutôt que de le promettre.

La table ajoutée par le test de P-02 porte **son tronc commun et sa RLS complète**, pour qu'elle
passe P-01 et n'échoue que sur P-02. Sans cela, l'échec viendrait de P-01 et l'on croirait avoir
prouvé P-02 alors qu'on aurait prouvé P-01 une seconde fois.

### Codes de sortie

| Code | Signification |
|---|---|
| `0` | Toutes les portes demandées passent |
| `1` | Une porte a échoué — la sortie nomme la porte, la cause et **l'objet fautif** |
| `2` | Erreur d'usage |
| `3` | Prérequis manquant — `docker compose` indisponible, ou base qui ne démarre pas |
| `4` | **Un test négatif n'a pas échoué — la porte est aveugle** |

> **Le code `4` mérite d'être distinct du `1`.** Une porte rouge signale un défaut du **modèle** ;
> une porte qui refuse d'être rouge signale un défaut **de la porte**, et les deux ne se réparent
> pas au même endroit.

---

## Où lire quoi

| Ce que vous cherchez | Où |
|---|---|
| Le modèle de données, table par table | [`docs/modele-donnees/README.md`](docs/modele-donnees/README.md) |
| La classe hors-ligne d'une entité — **fait foi** | [`docs/registre-classes-offline.md`](docs/registre-classes-offline.md) |
| Les principes non négociables | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Le patron que toute tranche recopie | [`docs/module-dore.md`](docs/module-dore.md) |
| Les versions épinglées et leur journal | [`docs/versions-reference.md`](docs/versions-reference.md) |
| Le cadrage et les récits utilisateur | [`docs/cadrage-v1.md`](docs/cadrage-v1.md), [`docs/user-stories-v1.md`](docs/user-stories-v1.md) |
| La conception du cycle en cours | [`specs/001-modele-donnees-socle/`](specs/001-modele-donnees-socle/) |
