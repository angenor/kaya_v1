# Recherche — cycle F3, le cœur métier de la réception

**Phase 0 du plan.** Ce document tranche ce que la spécification laissait ouvert **au niveau
technique**, et rien d'autre. Les décisions de produit sont dans [spec.md](./spec.md) ; celles-ci
n'y reviennent pas.

---

## 1. Versions — ce cycle n'ajoute aucune dépendance, et c'est un résultat

**Consigne du cycle** : `docs/versions-reference.md` fait foi, ses valeurs se reprennent **sans
revérification**, et l'ajout est libre. La règle 4 du §1 précise l'autre moitié : **elle écarte
elle-même l'ajout quand ce qui est présent suffit.**

### 1.1 Les cinq besoins nouveaux, et ce qui les couvre

| Besoin de F3 | Couvert par | Pourquoi rien à ajouter |
|---|---|---|
| **Arithmétique d'intervalles** — chevauchement, remise en état, durée réelle | Rien — trois comparaisons | `a.debut < b.fin && b.debut < a.fin` **est** le test de chevauchement. Ce n'est pas « soixante lignes pour éviter une bibliothèque », c'est une ligne |
| **Affichage d'une heure dans le fuseau de l'établissement** | **`app/core/format/instant.ts`** (cycle F2), qui enveloppe `Intl.DateTimeFormat` avec l'option `timeZone` | La famille « Date et heure (JS) » est **déjà tranchée** au §3.4 : `Intl` natif, `date-fns`/`dayjs`/`luxon`/`moment` écartés. F3 ne rouvre pas une famille close |
| **Identifiants d'écriture** | **`uuid` 14.0.1**, fonction `v7` | Déjà là, déjà justifié |
| **Persistance de la file et des scénarios** | **`idb` 8.0.3** | Déjà là |
| **Ruban élastique du planning** | Rien — un calcul de largeur par heure | **Voir §1.2 : une famille est ouverte pour l'écarter**, pas pour l'adopter |

### 1.2 Une famille est rencontrée, donc tranchée pour tout le dépôt : le planning horaire

`V1` demande un ruban où **une heure occupée est plus large qu'une heure de nuit morte**. Les
bibliothèques de la famille — `vis-timeline`, `frappe-gantt`, `dhtmlx-gantt`, `svelte-gantt` et les
composants de gantt en général — partagent une hypothèse : **l'axe du temps est linéaire**. Sous
cette hypothèse, un passage de trois heures sur une semaine de sept jours occupe **1,8 %** de la
largeur, soit ≈ 19 px sur 1 040 : illisible.

> **C'est exactement le défaut que `V1` existe pour éviter** — *« passages de 1 à 4 h et
> demi-journées lisibles, pas écrasés dans une case de journée »*. Adopter une de ces bibliothèques
> reviendrait à payer une dépendance pour obtenir le comportement qu'on refuse.

**Décision** : aucune bibliothèque. Le calcul vit dans `app/core/planning/ruban.ts`, une fonction
pure qui prend des occupations et rend des positions. La maquette porte déjà l'algorithme dans son
commentaire de fin — largeur par heure selon l'occupation, × 0,13 pour les jours éloignés, puis
normalisation. **La ligne est inscrite au §3.4 dans le même changement.**

**Alternatives écartées** : les cinq bibliothèques ci-dessus (échelle linéaire, donc défaut
structurel) ; une échelle logarithmique appliquée à un gantt existant (rendrait les durées
incomparables entre elles, ce que le ruban élastique évite en ne déformant que **les vides**).

### 1.3 Ce que le fuseau nous laisse comme dette, et pourquoi elle est acceptable aujourd'hui

L'arithmétique d'intervalle se fait **en instants absolus** (millisecondes depuis l'époque), et la
conversion vers l'heure lue se fait par `Intl` avec `timeZone`. C'est exact tant que le fuseau de
l'établissement **n'a pas d'heure d'été** — ce qui est le cas de `Africa/Abidjan` (UTC+0 toute
l'année, paramètre par défaut du pilote).

Un fuseau à heure d'été poserait une question qu'aucune de nos briques ne résout : *« 14 h le jour
du basculement » désigne-t-il un instant qui n'existe pas, ou un instant qui existe deux fois ?*
**C'est une dette nommée, pas une tolérance** : elle se lèvera avec le second pays de l'incrément 3,
et c'est ce jour-là qu'il faudra décider si `Temporal` — natif dans les deux moteurs à ce
moment-là — remplace l'enveloppe. L'écrire maintenant coûterait un choix par anticipation, ce que le
principe 13 refuse.

---

## 2. Où vit le motif du document à lignes — et pourquoi pas au design system

`R7` pose un motif dont **six écrans de quatre cycles différents** héritent (`R5`, `R6`, `P3`, `P4`,
`C2`, `C3`, `F4` selon `derivation.md`). Trois emplacements étaient possibles :

| Emplacement | Verdict |
|---|---|
| `app/core/design-system/` | ❌ **Le canon est fermé** : `CLAUDE.md` pose « les seize composants, **et rien d'autre** », et `docs/design/composants.md` les énumère. Y ajouter un dix-septième composant demanderait d'amender le canon — ce que le motif ne justifie pas : un document à lignes n'est pas un composant, c'est un **assemblage** de trois pièces |
| `app/core/reception/` | ❌ Six écrans hors réception en héritent. Le premier cycle qui en aurait besoin devrait importer « la réception » pour afficher une addition de bar |
| **`app/core/document-a-lignes/`** | ✅ **Retenu.** Un dossier de `core/`, au même rang que `format/` ou `file/`, distinct du design system. Trois pièces : la **ligne**, le **sous-total de section**, le **pied de total épinglé** |

**Ce que le motif porte, et qui doit être vrai pour les six héritiers** : des sections nommées, un
sous-total par section, un bloc de taxes en lignes distinctes, un total dans un pied qui **ne défile
jamais**, la mention « Document non fiscal — ne tient pas lieu de facture », et **une action finale
optionnelle** — `R6` est précisément `R7` sans elle.

**Alternative écartée** : recopier le balisage dans chaque écran. Elle se paierait au premier
changement fiscal : une TVA modifiée demanderait sept modifications, et la septième serait oubliée.

---

## 3. Le calcul métier est pur, et il ne vit dans aucun composant

Quatre calculs de ce cycle décident d'argent ou de disponibilité. Ils vivent dans
`app/core/reception/`, en **fonctions pures**, hors de tout composant et de toute simulation :

| Fichier | Ce qu'il calcule | Ce qu'il ne fait pas |
|---|---|---|
| `bareme.ts` | Le prix d'une durée, le palier atteint, la **rebascule** au dépassement, la **bascule en nuitée** au seuil | Il ne lit aucune constante : paliers, prix d'heure supplémentaire et seuil viennent du référentiel |
| `disponibilite.ts` | Le chevauchement, les chambres libres d'une catégorie, la **prochaine libération** | Il ne connaît pas la base : en phase 3, il devient la **seconde ligne de défense** derrière la contrainte GiST, jamais la première |
| `taxe-sejour.ts` | Les nuitées assujetties, le montant, la **règle appliquée** | ⚠️ **Il est l'ancêtre front du `JurisdictionAdapter`** : aucune valeur fiscale n'y est écrite, tout vient de la formule et du paramétrage. En phase 3, il est **supprimé** et remplacé par l'adaptateur — jamais dupliqué |
| `gestes.ts` | Le barème de conversion geste → seconde, **déclaré en un seul endroit** | Il n'est pas du produit : il est lu par les tests et par le rapport de cycle |

**Motif du découpage** : la constitution exige un **test doré sur jeu de cas figés** pour tout calcul
fiscal (principe 5). Un calcul enfermé dans un composant se teste en montant le composant — donc
lentement, et à travers le rendu. Ces quatre-là se testent en microsecondes, et le jeu doré est
lisible par quelqu'un qui ne sait pas lire Vue.

---

## 4. Comment un compte de gestes devient une porte, sans porte nouvelle

`FR-070` et `FR-071` exigent que le dépassement d'un budget de gestes **fasse rougir la
vérification**. Trois mécanismes ont été examinés :

| Mécanisme | Verdict |
|---|---|
| Chronométrer le parcours en navigateur | ❌ Mesure la machine de développement, pas le comptoir. Un poste rapide masquerait un parcours long, et l'inverse ferait rougir sans défaut |
| Compter les gestes **dans le test Playwright**, par un compteur d'interactions | ✅ **Retenu.** Le test ouvre l'écran, agit, et **compte ses propres actions** ; le budget est une assertion. Un tap ajouté au parcours fait échouer P-04 en nommant le parcours |
| Une porte **P-07 « ergonomie »** | ❌ **Écartée.** Le noyau grossit *à la demande, pas par anticipation* (principe 13). Ce contrôle a besoin d'un navigateur réel, sur deux moteurs, avec l'application démarrée — c'est **exactement le périmètre de P-04**. Une porte de plus dupliquerait son démarrage pour trois assertions |

**Conséquence** : le compteur est un utilitaire de test, `tests/navigateur/gestes.ts`, et non du
produit. Il s'inscrit à `docs/points-entree.md` comme **exercé par le navigateur**.

---

## 5. Ce que la simulation doit savoir faire échouer

Le cadrage §13.0 ter est explicite : *« une simulation doit savoir échouer aussi bien que
réussir »*. Pour ce cycle, cela veut dire que la couche simulée porte, **en dur dans ses données et
non dans un interrupteur d'écran** :

- un jeu où **deux occupations se chevauchent** à la seconde près, pour exercer le refus ;
- une chambre dont le **temps de remise en état** couvre la demande, pour exercer le refus voisin —
  celui qu'on oublie parce que la chambre *paraît* libre ;
- un séjour **déjà terminé**, pour exercer les deux phrases distinctes du lexique ;
- une note **arrêtée** sur laquelle une consommation arrive, pour exercer le refus d'ajout ;
- un passage **dont la durée réelle a dépassé son palier**, et un autre **au-delà du seuil de
  bascule** ;
- les **trois issues fiscales**, pilotées depuis `/_scenarios`, dont l'**indéterminée** par butée.

**Décision** : ces cas vivent dans le jeu `deloria.ts` **et sont datés relativement à l'horloge de
la couture**, jamais à des dates absolues. Un jeu daté en dur cesse d'exercer ses cas le lendemain,
et le test devient vert **en ne testant plus rien** — le pire des deux mondes.

---

## 6. Les routes, et une collision évitée

Quatre écrans de ce cycle n'avaient pas de route à l'index (`app/core/ecrans/index.ts`). Elles sont
décidées ici :

| Écran | Route retenue | Motif |
|---|---|---|
| `V1` Le planning | **`/planning`** | Le mot est celui de la maquette et du métier |
| `R2` Vue du jour | **`/jour`** | Court, et il ne prétend pas être un tableau de bord |
| `R6` Note temps réel | **`/note/:sejour`** | ⚠️ **`/notes` est déjà pris** par l'écran composé « Notes internes » (cycle F7, à l'index). Le pluriel désigne les notes **internes** de l'établissement, le singulier **la note d'un séjour** — deux objets sans rapport que le lexique distingue déjà (`note_etablissement` → « Note interne » · `note_sejour` → « la note »). Une route `/notes/:id` aurait fait du second un cas particulier du premier |
| `R3`, `R4`, `R5`, `R7` | `/arrivee`, `/passage`, `/clients`, `/depart` | **Déjà décidées** et inscrites à l'index — le lexique les impose nommément (« check-in » et « check-out » n'atteignent **ni l'interface ni une route**) |

---

## 7. Ce que ce cycle **ne** cherche pas

- **Aucune recherche de bibliothèque de recherche floue.** La recherche client porte sur trois
  champs, par préfixe et sous-chaîne, sur 10 000 fiches — quelques millisecondes en JavaScript
  ordinaire. La famille n'est donc **pas rencontrée**, et rien n'est inscrit au §3.4 : *une famille
  absente est une famille non encore rencontrée*, pas une famille libre.
- **Aucune recherche de magasin d'état.** `useState` de Nuxt + composables, tranché au cycle F1.
- **Aucune recherche de bibliothèque de décimales.** Les montants sont des entiers en unités
  mineures ; les quantités décimales de ce cycle valent toutes 1. Le jour où une quantité fractionne
  vraiment — la quincaillerie de l'incrément 3 —, la famille se tranchera là.
- **Aucune recherche sur la certification fiscale.** Elle est simulée, et le vrai intégrateur est du
  périmètre de la phase 3.
