# Rapport du cycle F1 — la coquille de l'application

**Phase** : 2 · **Date** : 2026-08-07 · **Plan** : [plan.md](./plan.md)

> **Ce document dit ce que les portes NE COUVRENT PAS.** Le reste — ce qui est vert — se lit dans
> la sortie de `scripts/verifier.sh`. Ici on écrit les constats faits **à la main**, les écarts
> assumés, et **ce qui reste dû**.

---

## 1. L'état à la clôture, sans arrondi

### Ce qui passe, et qu'on peut relancer

| Contrôle | Résultat |
|---|---|
| `scripts/verifier.sh` | **TOUT VERT — 4 portes — 8 s** (P-01, P-02, P-05, P-03) |
| `scripts/verifier.sh --test-negatif` | **4 tests négatifs VERTS — 17 s** |
| `pnpm lint` | vert — quatre règles opposables + aucune chaîne visible en dur |
| `pnpm build` | vert — coquille PWA comprise |
| `pnpm test` | **128 tests d'unité**, 9 fichiers |
| `pnpm test:navigateur` | **52 cas**, Chromium **et** WebKit, clair **et** sombre |

### Ce qui N'EST PAS livré, et qui reste dû

*Écrit en tête et non en note de bas de page : un cycle qui cache ce qu'il n'a pas fait fait perdre
plus de temps qu'il n'en gagne.*

| Tâche | État | Ce qui manque exactement |
|---|---|---|
| **T034** — les quatre états sur les écrans existants | **partiel** | L'état **vide** (composant 11) et l'état **chargement** (composant 13) sont livrés et visibles au guide de style et au panneau. L'état **erreur** l'est aussi (composant 07). Ce qui manque : les brancher sur les leviers **depuis `/_ecrans`**, qui ne lit encore aucune donnée de domaine |
| **T036 · T037** — le RBAC qui retire du HTML | **NON LIVRÉ** | `useSession` porte les permissions et le panneau les recalcule au changement de compte, mais **aucune surface ne les consomme encore** : il n'y a pas d'action métier à retirer. `useAutorisation` et le test `rbac-absence-html.spec.ts` restent dus |
| **T044** — l'affichage des absences sur une surface | **partiel** | Le panneau Scénarios **liste** les absences du moteur courant avec leur alternative. Ce qui manque : la phrase de PWA-04 **sur une surface qui solliciterait l'impression** — il n'y en a aucune dans ce cycle |
| **T045 · T046 · T047** — hors ligne, installation, nouvelle version | **NON LIVRÉ** | La coquille est posée (manifeste valide, service worker enregistré en portée `/`, précache incluant `/` et les icônes), mais `tests/navigateur/hors-ligne.spec.ts`, l'écran d'installation et l'invite de rechargement ne sont pas écrits |
| **T050 → T053** — la porte **P-04** | **NON LIVRÉ** | L'index (`app/core/ecrans/index.ts`) est écrit **comme source unique** et prêt à être lu par la porte ; le crochet `pages:extend` peut produire l'inventaire des routes. La porte elle-même, ses deux tests négatifs, le drapeau `--sans-conteneur` et le rattachement des quatre suites de navigateur au script restent dus |
| **T055 → T058** — la porte **P-06** | **NON LIVRÉ** | `knip` et `@vitest/coverage-v8` sont installés et configurés, le guide de style importe les seize composants **explicitement** (la condition qui rend la porte fiable est donc acquise), mais `docs/points-entree.md`, la porte et ses deux tests négatifs restent dus |
| **T059** — le quickstart déroulé à la main | **partiel** | Les pas 1 à 8 et 11 à 12 ont été constatés sur Chromium et WebKit (voir §3). Les pas 9, 10, 13 et 14 dépendent des tâches non livrées ci-dessus |
| **T061 · T062** | **partiel** | §5 et §6 de ce document |

**Conséquence directe, et elle est importante** : `scripts/verifier.sh` **n'enchaîne pas encore
tout ce qui doit passer**. Le lint, le build, les tests d'unité et les quatre suites de navigateur
se lancent **séparément**, ce que le principe 13 refuse — *« aucun contrôle n'est lancé à la main
en plus du script : ce qui compte est dedans, ou n'existe pas »*. C'est **le premier écart à
refermer**, avant toute nouvelle fonctionnalité.

---

## 2. Les écarts assumés, avec leur mesure

### 2.1 U+202F est absent des deux polices — constaté, non corrigé

`docs/design/tokens.md` §2 impose l'espace fine insécable **U+202F** entre les groupes de milliers
et avant le symbole. `docs/versions-reference.md` §3.2 annonçait le risque ; **la mesure le
confirme** :

| Police | sous-réglée sur U+0020 | sur U+2009 | sur **U+202F** | sur U+4E00 *(absent, témoin)* |
|---|---|---|---|---|
| Archivo | 944 o | 948 o | **960 o** | **960 o** |
| Chivo Mono | 752 o | 776 o | **744 o** | **744 o** |

Le sous-réglage sur U+202F rend **exactement la même taille** que sur un idéogramme dont on sait
qu'il est absent, alors que U+2009 en rend une autre : **le glyphe n'existe pas**.

**Conséquence réelle** : le séparateur de milliers tombe sur une police de repli, et l'écart de
chasse se voit — surtout en Chivo Mono, où la cellule de repli est plus large que la fine attendue.

**Ce qui protège malgré tout le produit**, et ce n'est pas une consolation :

1. **l'insécabilité vient du CARACTÈRE**, de catégorie Unicode `Zs` non sécable, pas de la police :
   un montant ne se coupe pas en fin de ligne, quoi qu'il arrive ;
2. `whitespace-nowrap` est posé sur tout porteur de montant, et le test des jetons le vérifie ;
3. **les colonnes de montants sont alignées à DROITE sur une largeur fixe** (composant 08,
   `w-24 text-right`) : une chasse différente sur un seul caractère ne les décale pas.

**Le remède, pour le cycle qui le prendra** : mapper U+202F sur le dessin de U+2009 dans la table
`cmap`, comme le §3.2 le décrit. Il demande un **éditeur de tables de police** — `fonttools`, ou
équivalent — qui n'est pas dans le jeu de dépendances et qu'on n'ajoute pas ici : `subset-font`
sous-règle, il n'ajoute pas de correspondance.

### 2.2 Le format JSON n'admet pas de commentaire

La règle 4 du §1 de `docs/versions-reference.md` exige un commentaire **au-dessus de chaque ligne**
du manifeste — rôle, URL du registre, date, et pourquoi ce qui est là ne suffit pas. **`package.json`
est du JSON strict.**

L'écart est déclaré dans le manifeste lui-même, et **compensé** : la justification vit dans le bloc
`versionsJustification`, une entrée par dépendance, et **le contrôle C7 de P-03 la vérifie DANS LES
DEUX SENS**. C'est plus fort qu'un commentaire — un commentaire ne se vérifie pas.

### 2.3 Le décompte des six éléments animés se compte **dans la fenêtre**

`docs/design/mouvement.md` §5 pose « six éléments animés simultanément au maximum ». Le guide de
style en porte **vingt sur le document entier** — mais c'est un **catalogue** : il montre les seize
composants dans tous leurs états, ce qu'aucun écran du produit ne fait.

Le test compte donc les éléments animés **visibles dans la fenêtre**. Ce que la règle protège est
le budget d'images par seconde, qui ne dépend que de ce que le compositeur dessine. Compter le
document entier aurait rendu la règle inapplicable au guide, et on l'aurait désactivée.

### 2.4 Le témoin : la file prime sur l'état du réseau

`data-model.md` §6.4 le dit — *« (tout état) · file non vide → En attente d'envoi (n) »* — et
l'implémentation le suit. **Conséquence à connaître pour la démonstration** : au pas 12 du
quickstart, régler la latence à 4 000 ms n'affiche « Connexion faible » **que si la file est
vide**. C'est correct, et ce n'est pas ce que la lecture rapide du quickstart laisse attendre.

---

## 3. Ce qui a été constaté À LA MAIN, sur les deux moteurs

*Aucune porte ne couvre ces constats aujourd'hui. Ils ont été faits en ouvrant l'application.*

| Constat | Chromium | WebKit |
|---|---|---|
| `/` redirige vers `/_ecrans`, en clair et en sombre | ✅ | ✅ |
| Le fond calculé vaut **exactement** le jeton — `#faf4e9` / `#17120f` | ✅ | ✅ |
| Un seul `<main>` dans le document | ✅ | ✅ |
| La session est reprise **dès la première navigation** | ✅ | ✅ |
| Le service worker s'enregistre en portée `/` | ✅ | ✅ |
| Le guide de style rend **seize** sections | ✅ | ✅ |
| L'index rend **46** entrées produit + **3** instruments | ✅ | ✅ |
| Le panneau Scénarios rend ses **sept** leviers | ✅ | ✅ |
| Écriture de **classe A** en ligne → acceptée, témoin « En attente d'envoi (1) » | ✅ | — |
| **Réglage d'établissement hors ligne → REFUSÉ**, avec son versant positif | ✅ | — |
| La file **survit au rechargement**, décompte identique | ✅ | — |
| La **lettre** de la classe n'apparaît nulle part dans le HTML | ✅ | — |
| Les **trois noms d'état internes** n'apparaissent nulle part (SC-022) | ✅ | ✅ |
| Console vide sur les quatre passages de chaque écran | ✅ | ✅ |

**Ce qui n'a PAS été constaté** : l'ouverture hors ligne après installation, l'installation
elle-même sur WebKit, et le comportement de la file sur WebKit. Ce sont les pas 13 et 14 du
quickstart, et ils dépendent de T045–T047.

---

## 4. Les cinq défauts que L'ÉCRAN a trouvés et que les tests n'auraient pas vus

*Ils valent d'être écrits : ce sont les cas où « je valide à l'écran » a payé.*

1. **Le service worker était servi en `text/html`.** Les trois fichiers étaient sur le disque, mais
   posés **après** la compilation de nitro, dont l'inventaire d'actifs est figé pendant celle-ci.
   Chromium refusait l'enregistrement — « unsupported MIME type ». **L'application ne se serait pas
   ouverte hors ligne, et aucun test d'unité ne l'aurait vu.**
2. **L'application démarrait en anglais** dans un navigateur réglé en anglais, alors que « fr par
   défaut » est une exigence. La détection de la langue du navigateur rendait en plus P-04 non
   déterministe. Elle est retirée.
3. **Les icônes ne s'affichaient pas.** `@import` ne vaut qu'**avant** toute autre règle : placée en
   fin de `polices.css`, la ligne était silencieusement écartée à la compilation. Aucune erreur
   n'était levée — c'est le mode de défaillance des feuilles de style.
4. **Le sommaire du guide ne menait nulle part.** `<component :is="'NuxtLink'">` n'est pas résolu —
   le compilateur ne voit pas un nom calculé — et le navigateur rendait un élément inconnu
   `<nuxtlink>`. Zéro `<a>` là où le test en attendait seize.
5. **Le bouton d'annulation faisait 36 px.** `composants.md` §14 écrivait `h-9` ; `tokens.md` dit
   « plancher tactile, **jamais moins** ». C'est la cible où l'écart coûte le plus cher — on a
   **huit secondes** pour l'atteindre, une fois. Tranché en faveur de `tokens.md`, et
   `composants.md` corrigé dans le même changement.

**Et deux défauts que les tests ont trouvés contre eux-mêmes** :

- le test « aucun éclair clair » **passait** avec le script de thème déplacé en fin de corps : il
  prouvait que le script s'exécute avant Vue, ce qui est vrai partout — y compris trop tard. Il est
  devenu **structurel** ;
- le test de contraste accusait le produit d'un **1,21:1** sur un bandeau parfaitement lisible :
  il lisait les couleurs à l'expression régulière, et Tailwind 4 rend `oklab(… / 0.6)`. Les
  couleurs sont désormais résolues **par un canevas**, dans le navigateur.

---

## 5. Les trois points laissés ouverts

*Ils ne se tranchent pas dans ce cycle, et les laisser implicites les ferait trancher par accident.*

1. **La décomposition HT / TVA de `prix_base`.** Le jeu encode la forme conforme — tarif **hors**
   taxe de séjour — mais **ne décompose pas** le prix hors taxe en HT + TVA. C'est le **cycle
   fiscal (F6, tranche T3)** qui le tranchera, avec le `JurisdictionAdapter`. Ce cycle ne calcule
   rien : il porte le référentiel.
2. **Le statut fiscal de la salle de réunion.** Le jeu la pose `assujettie_taxe_nuitee = false` —
   une salle n'étant pas une nuitée — et le signale. Personne n'a validé ce point avec
   l'administration.
3. **Les pairs de paquets constatés à l'installation.** Deux points que `research.md` §5 laissait
   ouverts sont **tranchés sur constat**, pas supposés : `@vitest/browser` est marqué **optionnel**
   dans `peerDependenciesMeta` de `@vitest/coverage-v8` — rien à ajouter ; `yaml-eslint-parser` et
   `jsonc-eslint-parser` sont des pairs **EXIGÉS** de `@intlify/eslint-plugin-vue-i18n`
   (`peerDependenciesMeta` vaut `null`) — ils sont déclarés, avec `vue-eslint-parser`, à leur
   version vérifiée le 2026-08-07.

### Deux points relevés à l'analyse, et tranchés ici

**(a) `ElementFile`, `Session` et `ReglagesScenario` n'entrent PAS au registre des classes.** Ce
sont des **enveloppes de terminal**, non des entités persistées côté serveur : elles vivent dans
IndexedDB, sur l'appareil, et disparaissent avec lui. La règle du registre — *« une entité absente
de ce registre est une entité non implémentable »* — vise **les entités du modèle**, celles qui ont
une table. Aucune des trois n'en a, et aucune n'en aura.

**(b) L'emplacement des valeurs arbitraires (FR-011).** Elles sont dans `docs/design/README.md`,
section « décisions ». Ce cycle en emploie **trois**, toutes déjà inscrites : l'épaisseur de
bordure de **1,5 px** (décision n° 1), les **largeurs de gabarit** (`max-w-280`, tokens.md §7) et
les **mesures de texte** (`max-w-[80ch]`, idem). La règle de lint (c) les exempte **nommément**,
et refuse tout le reste.

### Aucune montée majeure

Ce cycle **n'a monté aucune version** : il en a **ajouté** dix — six prévues par `research.md` et
quatre constatées à l'installation. Aucune brique du §2 de `docs/versions-reference.md` n'a changé
de majeure. `@vite-pwa/nuxt` est **écarté sur conflit constaté**, et remplacé par la brique qu'il
enveloppait.

---

## 6. Revue de la Definition of Done — les quatorze points

*`docs/user-stories-v1.md` §0.4. Les points de phase 1 et 3 se déclarent « sans objet », jamais
cochés en silence.*

| # | Point | Verdict |
|---|---|---|
| 1 | **Tests** | ✅ 128 tests d'unité · 52 cas de navigateur sur deux moteurs. **Réserve** : ils ne sont pas encore dans la commande unique |
| 2 | Annotations utoipa | **SANS OBJET** — aucun code Actix dans ce cycle |
| 3 | Migration sqlx | **SANS OBJET** — aucune base |
| 4 | RLS `ENABLE` + `FORCE` | **SANS OBJET** pour le code de ce cycle. P-01 la vérifie sur les 118 tables du modèle, et elle est **verte** |
| 5 | Classe hors-ligne déclarée | **SANS OBJET** pour les trois enveloppes de terminal (voir §5·a). Les entités du modèle sont couvertes par P-02, **verte** |
| 6 | Événements outbox | **SANS OBJET** — aucune transition d'état serveur |
| 7 | **i18n fr ET en** | ✅ Parité stricte **dans les deux sens**, testée. `no-raw-text` active et **éprouvée**. Lexique complété de cinq entrées |
| 8 | **Écran vérifié en clair et en sombre, en navigateur réel, sur Chromium ET WebKit** | ✅ pour les **trois instruments**. 52 cas, quatre passages par écran |
| 9 | **Paramètres en configuration** | ✅ `sync.latence_degradee_seuil_ms` est une **clé**, de valeur initiale 3 000 ms, lue par le témoin |
| 10 | Aperçu au gabarit exact | **SANS OBJET** — aucun document imprimé dans ce cycle |
| 11 | `docs/modele-donnees/` à jour | **SANS OBJET** — **non touché**, la phase 1 est close. L'empreinte relevée par le script le prouve |
| 12 | **Le jeu simulé a la forme du modèle** | ✅ Dix-huit types confrontés **aux fichiers `.sql`**, dans les deux sens. Six colonnes non reprises, chacune avec son motif écrit |
| 13 | Suppression des données simulées | **SANS OBJET** — aucun endpoint livré. La structure qui rendra la suppression mécanique est en place |
| 14 | **`scripts/verifier.sh` en une commande, et toute porte ajoutée a son test négatif** | ⚠️ **PARTIEL**. P-03 est créée **avec son test négatif**, et les quatre portes passent en une commande. **Mais le lint, le build, les tests d'unité et les suites de navigateur ne sont pas dans le script** — c'est l'écart de §1, et c'est le premier à refermer |

---

## 7. Ce que ce cycle NE PROUVE PAS

*À dire au pilote, sans arrondi.*

- **Ni la conformité fiscale, ni la justesse d'un calcul** : **rien n'est calculé** dans ce cycle.
  Le référentiel porte les barèmes ; personne ne les lit.
- **Ni la résistance aux coupures réelles** : le hors-ligne est un **levier**, pas une coupure. Le
  service worker est enregistré, son comportement en coupure réelle **n'a pas été éprouvé**.
- **Ni les performances sur le matériel visé** — Android 2 Go, poste 1366 × 768 en plein soleil.
  Les mesures faites sur le poste de développement ne les prédisent pas.
- **Ni la lisibilité en conditions réelles.** Les deux questions ouvertes de `tokens.md` §2.1 —
  l'étiquette de 11 px et le corps de 13,5 px — **ne se tranchent pas au bureau** : elles partent à
  la journée d'observation d'Abengourou, et leurs retours iront dans `docs/design/notes-terrain.md`.
- **Ni qu'un appelant est un BON appelant, ni qu'un test est un BON test.** P-06 n'existe pas
  encore, et quand elle existera elle comptera les références sans les juger.
