# Rapport du cycle F1 — la coquille de l'application

**Phase** : 2 · **Date** : 2026-08-07 · **Plan** : [plan.md](./plan.md)

> **Ce document dit ce que les portes NE COUVRENT PAS.** Le reste — ce qui est vert — se lit dans
> la sortie de `scripts/verifier.sh`. Ici on écrit les constats faits **à l'écran**, les écarts
> assumés, et **ce qui reste dû**.

---

## 1. L'état à la clôture, sans arrondi

### Une seule commande, et tout est dedans

| Contrôle | Résultat |
|---|---|
| `scripts/verifier.sh` | **TOUT VERT — 6 portes — 71 s** (préalables · P-01 · P-02 · P-05 · P-03 · P-04 · P-06) |
| `scripts/verifier.sh --test-negatif` | **6 tests négatifs VERTS — 43 s**, dont **deux portes à deux sens** |
| `scripts/verifier.sh --sans-conteneur` | **VERT SOUS RÉSERVE**, P-01/P-02/P-05 sautées **et nommées** |

**L'écart de la clôture précédente est refermé.** Le lint, les types, la construction, les tests
d'unité et **les cinq suites de navigateur** sont **dans le script** : les quatre premiers comme
préalables, les suites **dans la porte P-04**, qui monte déjà l'application et pilote les deux
moteurs. *Ce qui compte est dedans, ou n'existe pas.*

| Ce qui s'exécute | Où | Décompte |
|---|---|---|
| `eslint .` | préalable 1 | 4 règles opposables + aucune chaîne en dur |
| `nuxt typecheck` | préalable 2 | — |
| `nuxt build` **avec `KAYA_PAGE_TEMOIN=1`** | préalable 3 | 6 routes à l'inventaire |
| `vitest run --coverage` | préalable 4 | **134 cas**, 10 fichiers |
| `playwright test` | **dans P-04** | **102 cas**, Chromium **et** WebKit, clair **et** sombre |

### Les trois portes créées par ce cycle

| Porte | Sens | Test négatif |
|---|---|---|
| **P-03** | un | 1 mutation |
| **P-04** | **deux** | **2 mutations**, une par sens, **+ un troisième constat** |
| **P-06** | **deux** | **2 mutations**, une par sens, **+ un troisième constat** |

### Ce qui N'EST PAS livré, et qui reste dû

*Écrit en tête et non en note de bas de page.*

| Ce qui manque | Où c'est écrit |
|---|---|
| **L'ouverture hors ligne n'est prouvée de bout en bout que sur Chromium** | §2.1 — c'est une limite de l'outillage, pas du produit, et ce qui reste observable sur WebKit est prouvé |
| **U+202F est absent des deux polices** | §2.2 — constaté, mesuré, non corrigé |
| **43 des 46 écrans du produit sont « pas commencé »** | c'est le plan de charge des six cycles suivants, et P-04 ne les exige pas |
| Le chiffrement au repos, l'impression, le scan | hors périmètre déclaré (PWA-05, tranche T4) |

---

## 2. Les écarts assumés, avec leur mesure

### 2.1 Hors ligne : **prouvé de bout en bout sur Chromium, pas sur WebKit**

**Playwright ne sait pas couper le réseau pour une NAVIGATION sur WebKit.** Les deux voies ont été
essayées, et les deux échouent **avant** que le service worker ne voie la requête :

| Voie | Ce que WebKit répond |
|---|---|
| `context.setOffline(true)` | *WebKit encountered an internal error* |
| interception de requêtes (`route.abort`) | *Blocked by Web Inspector* |

**Ce n'est pas le produit qui échoue, c'est l'outillage qui n'observe pas.** Ce qui est donc prouvé,
et par quel moyen :

- **sur Chromium** — coupure réelle, navigation réelle, l'application s'ouvre et rend son premier
  écran ; une route interne s'ouvre aussi, par le repli de navigation ;
- **sur les DEUX moteurs** — le service worker s'enregistre **en portée `/`**, contrôle la page, et
  **son précache porte le document** (avec son script de thème) **et les quatre icônes**.

**Ce qui reste NON PROUVÉ sur WebKit** : que le moteur remette bien la navigation à son service
worker quand le réseau tombe. C'est le contrat de WebKit, pas le nôtre — mais l'écrire vaut mieux
que le supposer. **Le premier cycle qui aura un appareil iOS sous la main le constatera à la main.**

### 2.2 U+202F est absent des deux polices — constaté, non corrigé

`docs/design/tokens.md` §2 impose l'espace fine insécable **U+202F**. La mesure le confirme :

| Police | sur U+0020 | sur U+2009 | sur **U+202F** | sur U+4E00 *(absent, témoin)* |
|---|---|---|---|---|
| Archivo | 944 o | 948 o | **960 o** | **960 o** |
| Chivo Mono | 752 o | 776 o | **744 o** | **744 o** |

Le sous-réglage sur U+202F rend **exactement la même taille** que sur un idéogramme dont on sait
qu'il est absent : **le glyphe n'existe pas**.

**Ce qui protège malgré tout le produit** : l'insécabilité vient du **CARACTÈRE** et non de la
police ; `whitespace-nowrap` est posé sur tout porteur de montant ; les colonnes de montants sont
alignées **à droite sur une largeur fixe**. **Le remède** : mapper U+202F sur le dessin de U+2009
dans la table `cmap` — il demande un éditeur de tables de police, absent du jeu de dépendances.

### 2.3 Le format JSON n'admet pas de commentaire

L'écart est déclaré dans le manifeste et **compensé** : la justification vit dans
`versionsJustification`, et **le contrôle C7 de P-03 la vérifie DANS LES DEUX SENS**. C'est plus
fort qu'un commentaire — un commentaire ne se vérifie pas.

### 2.4 Le décompte des six éléments animés se compte **dans la fenêtre**

Le guide de style en porte vingt sur le document entier, mais c'est un **catalogue**. Le test compte
donc les éléments animés **visibles dans la fenêtre** : ce que la règle protège est le budget
d'images par seconde, qui ne dépend que de ce que le compositeur dessine.

### 2.5 Le témoin : la file prime sur l'état du réseau

`data-model.md` §6.4 le dit, et l'implémentation le suit. **Conséquence pour la démonstration** :
au pas 12, régler la latence à 4 000 ms n'affiche « Connexion faible » **que si la file est vide**.
Le parcours automatisé vide la file avant, et **dit pourquoi** dans son commentaire.

### 2.6 Deux amendements au contrat de P-06, écrits dans le contrat

1. **Les constantes entrent au périmètre.** `knip` ne les distingue pas des fonctions : un périmètre
   qui les exclurait **ne serait pas calculable par la porte**. Les types restent exclus — `knip`
   les rend dans un champ séparé, donc l'exclusion se calcule. *Ce que la porte ne peut pas
   calculer, elle ne l'exclut pas.*
2. **Le registre déclare COMMENT l'entrée est exercée.** `coverage-v8` ne mesure que ce que Vitest
   exécute : un composant rendu par les deux moteurs, quatre fois par écran, y porte **zéro
   passage**. La colonne « exercé par » vaut `unité`, `navigateur` ou `—`, et **un plancher de huit
   entrées réellement couvertes** empêche « navigateur » de devenir une échappatoire.

### 2.7 Le coût de l'enchaînement

**71 s** en conditions normales. Le repère de consignation est **180 s**, et il a été **franchi une
fois** — 166 s — sur une machine portant six serveurs de développement d'autres projets. Le script
imprime sa durée et **demande la consignation** au-delà de 180 s ; il ne rougit pas, et c'est
délibéré : *faire rougir le script parce qu'il a mis quatre minutes punirait le cycle qui ajoute un
contrôle utile, et l'on retirerait le contrôle plutôt que la lenteur.*

---

## 3. Les onze défauts que L'ÉCRAN a trouvés et que les tests n'auraient pas vus

*Ce sont les cas où « je valide à l'écran » a payé. Les cinq premiers viennent de la première
tranche du cycle, les six suivants de la seconde.*

1. **Le service worker était servi en `text/html`.** Les trois fichiers étaient sur le disque, mais
   posés **après** la compilation de nitro, dont l'inventaire d'actifs est figé pendant celle-ci.
   **L'application ne se serait pas ouverte hors ligne, et aucun test d'unité ne l'aurait vu.**
2. **L'application démarrait en anglais** dans un navigateur réglé en anglais. La détection de la
   langue est retirée — elle rendait en plus P-04 non déterministe.
3. **Les icônes ne s'affichaient pas.** `@import` ne vaut qu'**avant** toute autre règle.
4. **Le sommaire du guide ne menait nulle part.** `<component :is="'NuxtLink'">` n'est pas résolu.
5. **Le bouton d'annulation faisait 36 px** là où `tokens.md` dit « plancher tactile, jamais moins ».

6. **LE SÉLECTEUR D'ÉTABLISSEMENT AFFICHAIT « K » SUR TOUS LES ÉCRANS.** Le gabarit rendait le
   composant **sans aucune donnée**, donc son initiale de repli. *Le repère d'orientation le plus
   important du produit — « savoir où on est avant de faire quoi que ce soit » — ne disait pas où
   l'on était.* Aucun test ne le regardait, **parce qu'aucun ne demandait au composant ce qu'il rend
   AVEC des données**. Constaté sur une capture, corrigé, et un cas du parcours le garde désormais.
7. **LES LEVIERS N'AVAIENT AUCUN EFFET AU PREMIER CHARGEMENT D'UN ÉCRAN.** Les réglages étaient
   repris par le gabarit à `onNuxtReady`, donc **après** le `setup()` des pages : une page qui lit
   ses données au montage les lisait avec les réglages **initiaux**. *On l'aurait pris pour une
   lenteur de l'application, jamais pour un ordre d'exécution.* Un greffon `await`é les reprend
   maintenant avant le montage.
8. **LES PERMISSIONS N'ÉTAIENT JAMAIS RÉSOLUES SUR UN APPAREIL NEUF.** Les réglages portent un
   compte et un établissement par défaut, la session est vide : le contexte ne se résolvait **que si
   l'on changeait le sélecteur**. La surface des actions montrait son état vide **à une gérante qui
   a huit droits**.
9. **`import.meta.env` n'expose que `VITE_*`.** Sans `vite.envPrefix`, l'index n'aurait **jamais**
   inscrit les pages témoin pendant que le routeur les servait — et P-04 aurait rougi sur un vrai
   défaut, **à la mauvaise adresse**.
10. **Le serveur du build fuyait.** `$!` après `( … ) &` rend le PID du **sous-shell** : `kill`
    tuait le sous-shell et **laissait le serveur vivant**. La porte suivante aurait trouvé un
    serveur servant un build **précédent** — un vert qui n'aurait rien prouvé du jour.
11. **`nuxt typecheck` réécrivait l'inventaire des routes** sans le drapeau de page témoin — quatre
    routes au lieu de six. La construction le retire d'abord : P-04 lit ce que **la construction de
    cette exécution** a produit.

**Et quatre défauts que les tests ont trouvés contre eux-mêmes** :

- le test « aucun éclair clair » **passait** avec le script de thème déplacé en fin de corps. Il est
  devenu **structurel** ;
- le test de contraste accusait le produit d'un **1,21:1** sur un bandeau lisible : il lisait les
  couleurs à l'expression régulière, et Tailwind 4 rend `oklab(… / 0.6)`. **Les couleurs se
  résolvent par un canevas** ;
- **la matrice rougissait selon la charge de la machine.** Une mesure par élément, c'est un
  aller-retour de protocole par élément et par propriété — plus de cinq cents pour un passage du
  guide. Poste chargé, WebKit dépassait les trente secondes et **cinq cas rougissaient sans qu'aucun
  défaut n'existe**. Tout est calculé **dans la page**, en un aller-retour : les suites passent de
  54 s à 28 s. ⚠️ **Et parce que la fonction envoyée au navigateur ne peut RIEN capturer de la
  portée du test, les formules y sont recopiées** — un cas neuf confronte les deux implémentations
  et exige le **même nombre** ;
- **`typecheck` était déclaré au manifeste et ne pouvait pas s'exécuter** : il réclamait `vue-tsc`,
  absente. *Un script déclaré qui ne peut pas s'exécuter se lit comme un contrôle existant.*

---

## 4. Ce qui a été constaté À L'ÉCRAN, sur les deux moteurs

*Le parcours de `quickstart.md` a été déroulé en navigateur réel, sur Chromium **et** WebKit, en
clair **et** en sombre, sur les **deux établissements**. Ce que la porte P-04 rejoue à chaque
exécution est marqué **✅ porte** ; ce qui a été constaté sur capture est marqué **👁 écran**.*

| Pas du quickstart | Constat |
|---|---|
| 1 · `/` mène à `/_ecrans` | ✅ porte · 👁 écran |
| 2 · l'index porte **46** + **3** + les actions | ✅ porte · 👁 écran |
| 3 · les **seize** composants, dans les deux thèmes | ✅ porte · 👁 écran |
| 4 · l'anglais, **sans une clé brute** | ✅ porte — *ce pas n'était couvert par aucun test avant cette tranche* |
| 5 · hors ligne, instantanément, sans nom d'état interne | ✅ porte |
| 6 · une écriture de classe A entre dans la file | ✅ porte |
| 7 · une écriture de classe C est **refusée**, avec son versant positif | ✅ porte |
| 8 · la file survit au rechargement, **hors ligne** | ✅ porte |
| 9 · une action interdite est **absente du HTML** | ✅ porte |
| 10 · un service absent est absent — **ETB-02c** | ✅ porte |
| 11 · le vide propose une porte de sortie | ✅ porte |
| 12 · latence → **squelette**, puis « Connexion faible » | ✅ porte |
| 13 · une capacité absente le dit **avant**, avec l'alternative | ✅ porte — visible sur WebKit, absente sur Chromium |
| 14 · installée, hors ligne, sans éclair | ✅ porte **sur Chromium** · voir §2.1 pour WebKit |

**Ce qui reste vrai et n'est pas couvert** : l'application n'a jamais été ouverte sur un **appareil
réel** — ni Android, ni iPhone. Tout ce qui précède s'est passé sur un poste de développement.

---

## 5. Les trois points laissés ouverts

1. **La décomposition HT / TVA de `prix_base`.** Le jeu encode la forme conforme — tarif **hors**
   taxe de séjour — mais **ne décompose pas** le prix hors taxe. C'est le **cycle fiscal (F6,
   tranche T3)** qui le tranchera, avec le `JurisdictionAdapter`.
2. **Le statut fiscal de la salle de réunion.** Le jeu la pose `assujettie_taxe_nuitee = false` — une
   salle n'étant pas une nuitée — et le signale. **Personne n'a validé ce point avec
   l'administration.**
3. **Les pairs de paquets constatés à l'installation.** `@vitest/browser` est **optionnel** ;
   `yaml-eslint-parser` et `jsonc-eslint-parser` sont **exigés** par le greffon i18n. Et **`vue`
   l'était aussi**, sans être déclaré : le montage d'un composant hors Nuxt échouait sur
   « Failed to resolve import "vue" ». Il est épinglé **à la version de Nuxt**, non à la dernière
   stable — deux copies de Vue dans un arbre casseraient l'identité des composants.

### Deux points relevés à l'analyse, et tranchés ici

**(a) `ElementFile`, `Session` et `ReglagesScenario` n'entrent PAS au registre des classes.** Ce
sont des **enveloppes de terminal**, non des entités persistées côté serveur : elles vivent dans
IndexedDB, sur l'appareil, et disparaissent avec lui. La règle du registre vise **les entités du
modèle**, celles qui ont une table. Aucune des trois n'en a, et aucune n'en aura.

**(b) L'emplacement des valeurs arbitraires (FR-011).** Dans `docs/design/README.md`, section
« décisions ». Ce cycle en emploie **trois**, toutes déjà inscrites : la bordure de **1,5 px**, les
**largeurs de gabarit** et les **mesures de texte**. La règle de lint (c) les exempte **nommément**.

### Les dépendances de la tranche

**Deux ajouts, aucune montée, aucune famille nouvelle** : `vue-tsc 3.3.9` — parce qu'un script
déclaré qui ne peut pas s'exécuter est pire qu'un script absent — et `vue 3.5.41`, pair exigé de
`@vue/test-utils`. Les deux sont inscrites au §3.2, justifiées dans `versionsJustification`, et
**P-03 les vérifie dans les deux sens**. **Aucune montée majeure à signaler.**

---

## 6. Revue de la Definition of Done — les quatorze points

*`docs/user-stories-v1.md` §0.4. Les points de phase 1 et 3 se déclarent « sans objet », jamais
cochés en silence.*

| # | Point | Verdict |
|---|---|---|
| 1 | **Tests** | ✅ **134 tests d'unité · 102 cas de navigateur** sur deux moteurs. **La réserve de la clôture précédente est levée** : tout est dans la commande unique |
| 2 | Annotations utoipa | **SANS OBJET** — aucun code Actix dans ce cycle |
| 3 | Migration sqlx | **SANS OBJET** — aucune base |
| 4 | RLS `ENABLE` + `FORCE` | **SANS OBJET** pour le code de ce cycle. P-01 la vérifie sur les 118 tables, et elle est **verte** |
| 5 | Classe hors-ligne déclarée | **SANS OBJET** pour les trois enveloppes de terminal (§5·a). Les entités du modèle sont couvertes par P-02, **verte** |
| 6 | Événements outbox | **SANS OBJET** — aucune transition d'état serveur |
| 7 | **i18n fr ET en** | ✅ Parité stricte **dans les deux sens**, testée. `no-raw-text` active. ⚠️ Et **le pas 4 du quickstart — la bascule en anglais sans clé brute — est désormais un test**, ce qu'il n'était pas |
| 8 | **Écran vérifié en clair et en sombre, en navigateur réel, sur Chromium ET WebKit** | ✅ pour les **trois instruments**, 24 passages par exécution, plus les deux parcours de bout en bout sur les **deux établissements** |
| 9 | **Paramètres en configuration** | ✅ `sync.latence_degradee_seuil_ms` est une **clé**, de valeur initiale 3 000 ms |
| 10 | Aperçu au gabarit exact | **SANS OBJET** — aucun document imprimé dans ce cycle |
| 11 | `docs/modele-donnees/` à jour | **SANS OBJET** — **non touché**, la phase 1 est close. L'empreinte relevée par le script le prouve |
| 12 | **Le jeu simulé a la forme du modèle** | ✅ Dix-huit types confrontés **aux fichiers `.sql`**, dans les deux sens |
| 13 | Suppression des données simulées | **SANS OBJET** — aucun endpoint livré |
| 14 | **`scripts/verifier.sh` en une commande, et toute porte ajoutée a son test négatif** | ✅ **6 portes en une commande, 71 s. Les trois portes créées ont leur test négatif, et les DEUX portes à deux sens en ont DEUX chacune** — plus un troisième constat qui prouve qu'elles échouent **au bon endroit** |

---

## 7. Ce que ce cycle NE PROUVE PAS

*À dire au pilote, sans arrondi.*

- **Ni la conformité fiscale, ni la justesse d'un calcul** : **rien n'est calculé** dans ce cycle.
- **Ni la résistance aux coupures réelles sur iOS** : voir §2.1. Sur Chromium, la coupure est réelle
  et l'application s'ouvre ; sur WebKit, seul le précache est observable.
- **Ni les performances sur le matériel visé** — Android 2 Go, poste 1366 × 768 en plein soleil.
- **Ni la lisibilité en conditions réelles.** L'étiquette de 11 px et le corps de 13,5 px **ne se
  tranchent pas au bureau** : ils partent à la journée d'observation d'Abengourou.
- **Ni qu'un appelant est un BON appelant, ni qu'un test est un BON test.** P-06 compte les
  références **sans les juger**, et la couverture mesure **le passage, pas l'assertion**.
- **Ni que le registre décrit la bonne intention.** Déclarer « dû » une méthode qu'on aurait dû
  brancher est cohérent, donc vert. *C'est le seul jugement que la porte laisse à l'humain — et il
  est visible, puisque le registre est un fichier qu'on relit.*
