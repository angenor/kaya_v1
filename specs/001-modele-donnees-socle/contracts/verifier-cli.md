# Contrat — `scripts/verifier.sh`, la commande unique

*Une seule commande, documentée au README du dépôt, qui enchaîne tout ce qui doit passer et **sort en échec au premier contrôle rouge**. Pas dix scripts qu'on lance de mémoire.*

**Ce cycle la crée avec deux portes : P-01 et P-02.** Elle grossira ; elle ne se dupliquera pas.

---

## 1 · Usage

```
scripts/verifier.sh                      # toutes les portes, dans l'ordre, arrêt au premier échec
scripts/verifier.sh --porte p01          # une porte seule
scripts/verifier.sh --test-negatif p01   # casse P-01 volontairement et EXIGE qu'elle échoue
scripts/verifier.sh --test-negatif p02   # idem pour P-02
scripts/verifier.sh --test-negatif       # les deux tests négatifs
scripts/verifier.sh --aide
```

**`--test-negatif` n'est pas un mode de débogage, c'est une preuve.** *Une porte qui ne trouve jamais rien est indistinguable d'une porte qui n'a rien à trouver.* Le mode opère sur une **copie de travail** du modèle dans un répertoire temporaire ; il ne touche jamais `docs/modele-donnees/`.

---

## 2 · Codes de sortie

| Code | Signification |
|---|---|
| `0` | Toutes les portes demandées passent |
| `1` | Une porte a échoué — la sortie nomme la porte, la cause et l'objet fautif |
| `2` | Erreur d'usage — argument inconnu |
| `3` | Prérequis manquant — `docker` ou `docker compose` indisponible, base qui ne démarre pas dans le délai |
| `4` | **Un test négatif n'a pas échoué** — la porte est aveugle. C'est le code le plus grave du script : il dit qu'un contrôle vert ne veut rien dire |

**Le code `4` mérite d'être distinct de `1`.** Une porte rouge signale un défaut du modèle ; une porte qui refuse d'être rouge signale un défaut **de la porte**, et les deux ne se réparent pas au même endroit.

---

## 3 · Format de sortie

Chaque porte imprime, dans cet ordre : son **périmètre inspecté**, son **verdict**, et en cas d'échec la **liste nominative** des objets fautifs.

```
── P-01 · le modèle s'applique sur une base vierge, et chaque table porte ENABLE + FORCE + sa politique
   Périmètre : 11 fichiers appliqués · 11 schémas · 71 tables inspectées
   Plancher  : 60 tables attendues au minimum — atteint
   ✓ tenant_id NOT NULL           71/71
   ✓ ENABLE + FORCE               71/71
   ✓ politique isolation_tenant   71/71  (USING et WITH CHECK non nuls, second argument `true` présent)
   VERT

── P-02 · toute table du modèle a une classe déclarée au registre
   Périmètre : 71 tables réelles confrontées à 165 entités extraites du registre
   Plancher  : 60 tables et 140 entités au minimum — atteint
   Sens      : table → registre (une entité déclarée sans table est normale)
   VERT
```

En échec :

```
   ✗ politique isolation_tenant   70/71
     MANQUANTE : caisse.coupure_comptee
   ROUGE — P-01
```

**La sortie nomme toujours l'objet.** « Une table n'a pas de politique » envoie chercher pendant vingt minutes ; `caisse.coupure_comptee` envoie à la ligne.

---

## 4 · P-01 — le modèle s'applique, et chaque table est isolée

### Déroulé

1. Vérifier la présence de `docker` et de `docker compose` — sinon, sortie `3`.
2. Poser un `trap` qui exécute `docker compose down -v` **en sortie normale, en échec et à l'interruption**.
3. `docker compose up -d postgres_verification` — image **`postgres:18.4`**, tag exact, données en `tmpfs`.
4. Boucler sur `pg_isready` avec un délai maximal ; au-delà, sortie `3`.
5. Appliquer `docs/modele-donnees/*.sql` **trié**, un fichier par appel, avec `psql -v ON_ERROR_STOP=1`. Au premier échec : nommer **le fichier** et sortir `1`.
6. Inspecter le catalogue — trois contrôles, ci-dessous.
7. Détruire la base.

### Les trois contrôles

| # | Ce qui est vérifié | Sur quoi | Pourquoi celui-là |
|---|---|---|---|
| **1** | Une colonne `tenant_id` existe et est `NOT NULL` | `information_schema.columns` | Sans elle, la politique compare une colonne absente |
| **2** | `relrowsecurity` **et** `relforcerowsecurity` sont vrais | `pg_class` | Sans `FORCE`, le propriétaire reste hors politique et la première tâche de maintenance voit tous les clients |
| **3** | Une politique `isolation_tenant` existe, dont **`qual` et `with_check` sont tous deux non nuls**, et dont **les deux expressions contiennent le second argument `true`** de `current_setting` | `pg_policies` | `with_check` vaut `NULL` quand la politique n'en déclare pas — et **une politique sans `WITH CHECK` laisse un tenant insérer chez un autre, ce qui n'apparaît dans aucune lecture** |

**Périmètre inspecté** : toutes les relations `relkind = 'r'` des schémas déclarés au `README.md` du modèle. Un schéma présent dans la base et absent du README, ou l'inverse, est un échec.

**Preuve de non-vacuité** : le script porte un **plancher de tables attendues**. En dessous, il sort `1` — une porte qui inspecterait zéro table passerait au vert sans rien prouver.

### Test négatif

`--test-negatif p01` copie `docs/modele-donnees/` dans un répertoire temporaire, **retire une instruction `CREATE POLICY isolation_tenant`** d'un fichier, relance la porte sur la copie, et **exige** qu'elle sorte rouge **en nommant cette table**. Si elle passe au vert, sortie `4`.

---

## 5 · P-02 — toute table a une classe déclarée

### Déroulé

1. Extraire les identifiants entre **accents graves** de `docs/registre-classes-offline.md`, tronquer au **premier point** (`etablissement.classement` → `etablissement`), passer en minuscules, dédoublonner.
2. Lister les tables réelles de la base créée par P-01, en nom nu.
3. Pour chaque table réelle, exiger l'appartenance à l'ensemble extrait.
4. Échec : lister **toutes** les tables non déclarées, pas seulement la première.

### Sens de la comparaison

**Table → registre. Jamais l'inverse.** Une entité déclarée sans table est **normale** — le registre §6, §7 et §8 déclare déjà tout le cycle D2, et le §10 déclare des provisions que ce cycle ne crée pas. **Une table non déclarée est l'erreur.**

### Preuve de non-vacuité — des deux côtés

Le script porte **deux planchers** : nombre minimal de tables réelles, et nombre minimal d'entités extraites du registre. Le second est le plus important : **un registre devenu illisible pour l'extracteur ferait passer la porte au vert en ne comparant rien.** C'est le mode de défaillance à refuser.

**Les valeurs sont calées sur une mesure, pas sur une intuition.** L'extraction rend **165 entités** sur le registre au 2026-08-06 ; le plancher est fixé à **140**. Un plancher confortable — 80, par exemple — serait inutile : la moitié d'une extraction cassée suffirait encore à couvrir les 71 tables, et la porte resterait verte en ne comparant plus rien. **Un plancher se règle juste sous la valeur réelle, jamais loin en dessous.**

### Limites, écrites dans le script

- La comparaison porte sur le **nom nu**, pas sur `schema.table`. Deux tables homonymes dans deux schémas passeraient avec une seule déclaration.
- Une mention en prose entre accents graves peut faire passer une table par accident.

**L'arbitrage est écrit** : un faux négatif ferait désactiver la porte sous trois semaines ; un faux positif la laisse utile. On tolère le second, jamais le premier.

### Test négatif

`--test-negatif p02` ajoute dans une **copie de travail** une table `zzz_table_non_declaree` — tronc commun, RLS complète, pour qu'elle **passe P-01** et n'échoue que sur P-02 — relance la porte, et **exige** qu'elle sorte rouge en nommant cette table. Sinon, sortie `4`.

> **La table du test négatif porte sa RLS complète, et c'est délibéré.** Une table sans politique échouerait d'abord sur P-01, et on croirait avoir prouvé P-02 alors qu'on aurait prouvé P-01 une seconde fois.

---

## 6 · Contrat que chaque porte respecte — constitution, principe 13

| # | Exigence | P-01 | P-02 |
|---|---|---|---|
| 1 | Déclare son périmètre inspecté | fichiers, schémas, tables | tables réelles, entités extraites |
| 2 | Vérifie sa complétude | schémas base ↔ README | plancher d'entités extraites |
| 3 | Ne modifie pas ce qu'elle inspecte | base éphémère, aucun fichier touché | lecture seule |
| 4 | Prouve que sa cible n'est pas vide | plancher de tables | plancher des deux côtés |
| 5 | A un test négatif | `--test-negatif p01` | `--test-negatif p02` |

**Une porte sans test négatif est une décoration.**

---

## 7 · Ce que ce script n'est pas

- **Ce n'est pas un installateur** : il ne crée aucune base persistante, ne pose aucune migration, ne peuple rien.
- **Ce n'est pas un formateur** : il ne modifie aucun fichier du dépôt, jamais, y compris en mode `--test-negatif`.
- **Ce n'est pas un workflow d'intégration continue.** Aucun fichier n'est créé sous `.github/workflows/` par ce cycle. Le serveur vient en phase 3 et **lancera ce script sans le modifier** — c'est pourquoi le script ne suppose ni variable d'environnement de CI, ni chemin absolu, ni jeton.

---

## 8 · Performance

`scripts/verifier.sh` doit tenir **sous deux minutes** sur le poste de développement (SC-008). Deux choix y contribuent : les données de la base de vérification sont en **`tmpfs`**, et la base n'est démarrée **qu'une fois** pour les deux portes — P-02 réutilise la base créée par P-01 plutôt que d'en lancer une seconde.

**Le jour où le script dépasse deux ou trois minutes, on cesse de le lancer** — c'est le déclencheur documenté du passage au serveur, en phase 3. Le mesurer fait donc partie du contrat : le script imprime sa durée totale en fin d'exécution.
