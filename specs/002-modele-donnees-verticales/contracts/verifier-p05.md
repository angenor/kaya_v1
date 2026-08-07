# Contrat — **P-05**, la porte qui refuse une clé étrangère entre deux schémas

*Complément à [verifier-cli.md](../../001-modele-donnees-socle/contracts/verifier-cli.md) du cycle D1, qui reste le contrat de `scripts/verifier.sh` — usage, codes de sortie, format de sortie, procédure des tests négatifs. **Ce document n'ajoute qu'une porte** ; il ne redéfinit rien.*

---

## 1 · Pourquoi cette porte, et pourquoi maintenant

**Le cycle D1 l'a examinée et l'a explicitement différée à celui-ci**, en écrivant pourquoi :

> « **aucune FK entre deux schémas de modules** — mécanisable en une requête sur `pg_constraint`, et le coût d'un manquement est réel. **Écartée pour l'instant** : le cycle D1 crée les schémas du socle seuls, et la tentation n'apparaîtra qu'au cycle D2, où `ventes → hebergement` et `pressing → hebergement` sont deux rattachements sans FK. **C'est là qu'elle sera justifiée**, avec une cible non vide à inspecter. »
> — [plan du cycle D1](../../001-modele-donnees-socle/plan.md), « Aucune porte nouvelle demandée »

**Ce cycle est celui-là.** La cible passe de **zéro** rattachement inter-modules à **onze cibles distinctes et une trentaine de colonnes**, dont deux sagas.

### Le coût manifeste, en trois points

1. **Une clé étrangère sur `ligne_sejour.ligne_commande_id` casse le chemin nominal du conflit le plus fréquent du produit.** L'écriture orpheline ne partirait pas en réconciliation : elle échouerait, en base, sur une contrainte. Voir [sagas-inter-modules.md](./sagas-inter-modules.md) §2.
2. **Le mode de défaillance est silencieux et différé.** Un cycle de phase 3 relit le fichier, prend l'absence de `REFERENCES` pour un oubli, l'ajoute de bonne foi. La migration s'applique, tous les tests passent, et le défaut ne se voit qu'à la première coupure réseau en exploitation.
3. **Le commentaire de colonne est aujourd'hui la seule défense, et un commentaire ne refuse rien.** C'est la définition d'une règle non opposable.

### Pourquoi le numéro 5

`P-03` (dépendances) et `P-04` (écrans) sont **nommées par la constitution** et réservées par le noyau de quatre portes. Les numéros s'attribuent dans l'ordre d'apparition ; la première porte hors noyau est donc **P-05**.

---

## 2 · Ce qu'elle vérifie, exactement

**Aucune contrainte de clé étrangère ne relie deux tables de schémas différents.**

```
Pour toute contrainte de type 'f' du catalogue :
    le schéma de la table portante  ==  le schéma de la table référencée
```

**Périmètre inspecté** : toutes les contraintes de type clé étrangère des schémas déclarés au `README.md` du modèle. Les schémas système sont hors périmètre.

**Ce que la porte ne juge pas** : si la colonne nue est *justifiée*, si son commentaire est *présent*, si la compensation est *écrite*. Elle constate une forme, elle ne lit pas une intention — c'est ce qui la rend fiable, et c'est ce qui laisse [sagas-inter-modules.md](./sagas-inter-modules.md) §5 nommer ce qu'elle laisse à un test d'intégration de phase 3.

---

## 3 · Le contrat des cinq points — constitution, principe 13

| # | Exigence | Comment P-05 la tient |
|---|---|---|
| **1** | **Déclare son périmètre inspecté** | Elle imprime le nombre de schémas inspectés et le **nombre total de contraintes de clé étrangère** examinées |
| **2** | **Vérifie sa complétude** | Elle compare les schémas trouvés dans la base à ceux déclarés au `README.md` du modèle — **la même liste opposable que P-01**, jamais une seconde liste |
| **3** | **Ne modifie pas ce qu'elle inspecte** | Lecture seule du catalogue, sur la base **que P-01 a déjà montée** ; aucun fichier du dépôt n'est touché |
| **4** | **Prouve que sa cible n'est pas vide** | Elle échoue si le nombre de clés étrangères examinées est **inférieur à un plancher déclaré**. *Une porte qui trouverait zéro clé étrangère à examiner passerait au vert sans rien prouver* — et c'est exactement ce qui arriverait si une requête cassée rendait un ensemble vide |
| **5** | **A un test négatif** | `scripts/verifier.sh --test-negatif p05` |

**Le point 4 mérite d'être compris ici plutôt qu'ailleurs.** P-05 cherche une **absence** : elle est verte quand elle ne trouve rien. C'est le pire profil de porte qui soit — une requête mal écrite, un nom de catalogue changé, un filtre trop large, et elle reste verte pour toujours. **Le plancher de clés étrangères examinées est ce qui distingue « rien à trouver » de « je ne cherche plus ».** Il se règle **juste sous** le compte réel du modèle, jamais loin en dessous, exactement comme les planchers de P-01 et P-02.

---

## 4 · Le test négatif

`--test-negatif p05` opère sur une **copie de travail** du modèle dans un répertoire temporaire — il ne touche jamais `docs/modele-donnees/`.

**Ce qu'il fait** : il ajoute un `REFERENCES` sur une colonne nue **inter-schémas** — concrètement, il transforme la déclaration de `hebergement.ligne_sejour.ligne_commande_id` en clé étrangère vers `ventes.ligne_commande`.

**Ce qu'il exige** : que P-05 sorte **rouge**, en nommant **la contrainte, la table portante et la table référencée**. Si elle passe au vert, le script sort avec le code `4` — *un test négatif qui n'échoue pas dit qu'un contrôle vert ne veut rien dire*.

> **La table fautive du test négatif porte sa RLS complète et sa classe déclarée**, pour qu'elle **passe P-01 et P-02** et n'échoue que sur P-05. Sans cette précaution, on croirait avoir prouvé P-05 alors qu'on aurait prouvé P-01 une troisième fois.
>
> **Le choix de la cible n'est pas indifférent** : c'est précisément la colonne qu'un cycle de phase 3 serait tenté de « réparer ». Le test négatif rejoue donc **l'erreur réelle qu'on cherche à prévenir**, pas une erreur de laboratoire.

---

## 5 · Où elle s'insère dans la commande unique

```
scripts/verifier.sh                      # P-01, P-02, P-05 — dans l'ordre, arrêt au premier échec
scripts/verifier.sh --porte p05          # P-05 seule
scripts/verifier.sh --test-negatif p05   # casse P-05 volontairement et EXIGE qu'elle échoue
scripts/verifier.sh --test-negatif       # les TROIS tests négatifs
```

**Elle vient après P-02 et réutilise la base montée par P-01.** Aucun conteneur de plus, aucune dépendance de plus, quelques secondes — c'est ce qui préserve la cible des deux minutes (SC-011).

**Format de sortie, dans la forme du D1** :

```
── P-05 · aucune clé étrangère entre deux schémas
   Périmètre : 14 schémas · 96 contraintes de clé étrangère examinées
   Plancher  : 80 contraintes attendues au minimum — atteint
   ✓ aucune contrainte inter-schémas
   VERT
```

En échec, la sortie **nomme les trois objets** :

```
   ✗ contrainte inter-schémas trouvée
     fk_ligne_sejour_ligne_commande : hebergement.ligne_sejour → ventes.ligne_commande
   ROUGE — P-05
```

---

## 6 · Ce que cette porte amende dans la spécification

La spécification approuvée de ce cycle disait « aucune porte nouvelle » — **FR-044**, **SC-013**, et la section « Hors périmètre ». **Les trois sont corrigés dans le même changement que ce contrat.**

Un conflit constaté ne se tranche pas en silence : il est corrigé dans le document perdant (constitution, gouvernance). Ici le document perdant est la spécification, parce que la constitution — *une porte s'ajoute quand son absence coûterait cher, et les numéros s'attribuent dans l'ordre d'apparition* — prime sur elle, et parce que le plan du cycle D1 avait nommé ce cycle-ci comme le bon moment.
