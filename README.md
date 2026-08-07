# Kaya

*Logiciel de gestion pour les établissements d'Afrique de l'Ouest — hébergement, restauration,
bar, pressing. Multi-tenant, hors-ligne d'abord, conforme à la facturation normalisée ivoirienne.*

**Phase 1 — le modèle de données : CLOSE.** Aucun écran, aucun endpoint, aucune migration n'existe
encore, et c'est l'ordre voulu (constitution, principe 0) : le modèle vient d'abord, les écrans
ensuite sur données simulées, le serveur en dernier.

**Le modèle complet du MVP existe en SQL : 118 tables · 15 fichiers · 14 schémas · 20 provisions.**
Cycle D1 — le socle, 71 tables. Cycle D2 — les capacités et les verticales, 47 tables. La phase 2
peut donner à ses données simulées la forme exacte de ces tables.

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
| **P-05** | **Aucune clé étrangère entre deux schémas.** Les rattachements inter-modules sont des colonnes d'identifiant **nues**, et deux d'entre eux sont des **sagas dont le cas orphelin est le chemin nominal** — une consommation prise hors ligne qui arrive sur une note déjà arrêtée. Une `REFERENCES` ajoutée de bonne foi **ferait échouer en base** l'écriture que le produit doit accepter puis réconcilier, et rien ne le signalerait avant la première coupure réseau en exploitation |

Chaque porte déclare son **périmètre inspecté**, vérifie sa **complétude**, ne **modifie pas** ce
qu'elle inspecte — l'empreinte du modèle et du registre est relevée avant et après —, et prouve que
sa **cible n'est pas vide** par un plancher déclaré.

> **Pourquoi P-05 porte le numéro 5 alors qu'elle est la troisième.** `P-03` (dépendances) et `P-04`
> (écrans) sont **nommées par la constitution** et réservées par le noyau de quatre portes. Les
> numéros s'attribuent **dans l'ordre d'apparition** ; la première porte hors noyau est donc P-05.
> `P-03` naîtra avec le premier manifeste de dépendances, `P-04` avec le premier écran.

> **Pourquoi P-05 est le profil de porte le plus fragile qui soit — et ce qui la tient.** Elle
> cherche une **absence** : elle est verte quand elle ne trouve rien. Un filtre trop étroit, un nom
> de catalogue changé, et elle resterait verte pour toujours. Elle déclare donc **le nombre de clés
> étrangères qu'elle a examinées**, avec un plancher — ce qui distingue *« rien à trouver »* de
> *« je ne cherche plus »*. Le cycle D2 a vérifié que **ce plancher ne suffit pas** : en sabotant le
> prédicat de détection, la porte est restée verte en annonçant 92 contraintes examinées, et **seul
> le test négatif a vu la faute**.

### Une porte seule

```sh
scripts/verifier.sh --porte p01
scripts/verifier.sh --porte p02
scripts/verifier.sh --porte p05
```

### Les trois tests négatifs

```sh
scripts/verifier.sh --test-negatif p01   # retire une politique et EXIGE que P-01 échoue
scripts/verifier.sh --test-negatif p02   # ajoute une table non déclarée et EXIGE que P-02 échoue
scripts/verifier.sh --test-negatif p05   # ajoute une clé étrangère inter-schémas et EXIGE que P-05 échoue
scripts/verifier.sh --test-negatif       # les trois
```

> **`--test-negatif` n'est pas un mode de débogage, c'est une preuve.** *Une porte qui ne trouve
> jamais rien est indistinguable d'une porte qui n'a rien à trouver.* Le mode opère sur une **copie
> de travail** du modèle : il ne touche jamais `docs/modele-donnees/`, et l'empreinte du répertoire
> le vérifie plutôt que de le promettre.

La table ajoutée par le test de P-02 porte **son tronc commun et sa RLS complète**, pour qu'elle
passe P-01 et n'échoue que sur P-02. Sans cela, l'échec viendrait de P-01 et l'on croirait avoir
prouvé P-02 alors qu'on aurait prouvé P-01 une seconde fois. **Le test de P-05 suit le même
principe, en trois temps** : P-01 **et** P-02 doivent rester vertes, et P-05 seule doit rougir — en
nommant **la contrainte, la table portante et la table référencée**.

> **Le test de P-05 rejoue l'erreur réelle, pas une erreur de laboratoire.** Il transforme
> `hebergement.ligne_sejour.ligne_commande_id` en clé étrangère vers `ventes.ligne_commande` — c'est
> **précisément la colonne** qu'un cycle de phase 3 serait tenté de « réparer », de bonne foi, en
> croyant corriger un oubli.

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
| La conception du cycle **D1** — le socle | [`specs/001-modele-donnees-socle/`](specs/001-modele-donnees-socle/) |
| La conception du cycle **D2** — capacités et verticales | [`specs/002-modele-donnees-verticales/`](specs/002-modele-donnees-verticales/) |
| Ce que les portes ne prouvent pas, constaté à la main | [`specs/001-…/rapport-de-cycle.md`](specs/001-modele-donnees-socle/rapport-de-cycle.md), [`specs/002-…/rapport-de-cycle.md`](specs/002-modele-donnees-verticales/rapport-de-cycle.md) |
| Ce que la base garantit sur la disponibilité, et ce qu'elle ne garantit pas | [`contracts/disponibilite.md`](specs/002-modele-donnees-verticales/contracts/disponibilite.md) |
| Ce que la phase 3 doit faire du cas orphelin | [`contracts/sagas-inter-modules.md`](specs/002-modele-donnees-verticales/contracts/sagas-inter-modules.md) |
