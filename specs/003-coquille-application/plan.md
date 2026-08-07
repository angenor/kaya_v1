# Plan d'implémentation : La coquille de l'application (cycle F1 — Fondations)

**Branche** : `003-coquille-application` *(le dépôt travaille sur `main` ; aucune extension `before_specify` n'y est enregistrée)* · **Date** : 2026-08-07 · **Spécification** : [spec.md](./spec.md)

**Entrée** : la spécification de la fonctionnalité, 97 exigences et 25 critères de succès, plus les 20 décisions consignées à sa section `## Clarifications`.

**Phase** : 2 — l'application entière en données simulées. **Premier des sept cycles.**

---

## Résumé

Ce cycle pose **ce que les six cycles suivants réinventeraient chacun de leur côté** : une application à page unique installable, qui **s'ouvre hors ligne**, dans le thème du système et **sans éclair clair** ; les **seize composants canoniques** et le guide de style qui les montre ; les catalogues **fr et en** à parité ; un cycle de vie qu'une page nouvelle **ne peut pas oublier** ; une couche de **données simulées à la forme exacte du modèle SQL**, portant le jeu de Deloria et une mécanique de scénarios pilotable depuis l'interface ; l'interface **complète** de `PlatformAdapter` avec son implémentation web ; le **RBAC qui retire du HTML** au lieu de griser ; la **file hors-ligne qui refuse** les classes B, C et D ; l'**index des écrans** ; et l'extension de la commande unique par **P-03**, **P-04** et une porte nouvelle, **P-06**.

**Aucun écran métier, aucun appel réseau réel, aucun conteneur, aucun service distant.** L'approche technique tient en une phrase : **la couture entre le simulé et le réel est l'interface de domaine, jamais la requête HTTP** — c'est ce qui rendra le branchement de la phase 3 mécanique, endpoint par endpoint.

---

## Contexte technique

**Langage / version** : TypeScript **5.9.3** *(dernière `5.x` — contrainte du générateur de client, §3.2)* · Node **24.18.1** LTS · pnpm **11.18.0**

**Dépendances principales** : Nuxt **4.5.1** en SPA (`ssr: false`) · Tailwind CSS **4.3.3** via `@tailwindcss/vite` **4.3.3** · `@nuxtjs/i18n` **10.6.0** · `vite-plugin-pwa` **1.3.0** *(nouveau)* · `uuid` **14.0.1** *(nouveau)* · `idb` **8.0.3** *(nouveau)* · `@phosphor-icons/web` **2.1.2** + `subset-font` **2.5.0** · `@fontsource-variable/archivo` **5.3.0** · `@fontsource-variable/chivo-mono` **5.3.0**

**Stockage** : **aucune base.** IndexedDB via `idb` pour la file hors-ligne, la session et les réglages de scénario. Les jeux de données simulées sont en mémoire, chargés au démarrage.

**Tests** : `vitest` **4.1.10** + `@vue/test-utils` **2.4.11** + `happy-dom` **20.11.1** + `@vitejs/plugin-vue` **6.0.8** *(unité et composants)* · `@vitest/coverage-v8` **4.1.10** *(nouveau — propriété « testé » de P-06)* · `@playwright/test` **1.62.1** *(navigateur réel, P-04)* · `knip` **6.32.0** *(nouveau — propriété « branché » de P-06)*

**Plateforme cible** : navigateur réel, **Chromium et WebKit**, en installation autonome. Matériel visé : poste de réception Windows 1366 × 768 en plein soleil ; Android d'entrée de gamme 5,5" à 2 Go, debout, à une main.

**Type de projet** : application web à page unique, coquille PWA. **Aucun backend dans ce cycle.**

**Objectifs de performance** : **60 images/s tenues sur 2 Go de RAM** · `transform` et `opacity` uniquement · **six éléments animés simultanément au maximum** · plafond de mouvement 400 ms, 240 ms sur tout chemin fréquent (FR-096). **Aucun budget de démarrage n'existe au cadrage ni aux stories, et ce cycle n'en invente pas** (D-15).

**Contraintes** : ouverture **hors ligne** dès la première page · **aucun conteneur, aucun service distant** pour démarrer et exercer tout écran · **aucune chaîne visible en dur** · **aucune valeur littérale** de couleur, espacement, rayon, durée ou courbe hors des jetons · **aucun secret** dans le paquet servi au navigateur · thème appliqué **avant le premier pixel**

**Échelle / périmètre** : **4 routes construites** — la racine (redirection) et les 3 instruments · **46 écrans du produit déclarés** à l'index, dont 43 « pas commencé » · **16 composants** dans tous leurs états · **4 domaines** de données simulées · **2 établissements**, 17 + 4 unités, ~30 articles, 5 comptes · **~20 méthodes** de `PlatformAdapter`

---

## Contrôle de constitution

*PORTE : doit passer avant la recherche de phase 0. Re-contrôlée après la conception de phase 1.*

### Principes dont ce cycle relève directement

| Principe | Ce qu'il exige ici | Comment le plan s'y tient | Vérifié par |
|---|---|---|---|
| **0 · Ordre des phases** | Phase 2 : tous les écrans, aucun backend | Aucune migration, aucun endpoint, aucun conteneur. La règle de branchement est préparée : la couture est l'interface de domaine | P-04 sans conteneur *(§ Portes)* |
| **1·b · Modèle SQL, source de vérité** | Le jeu simulé a **la forme du modèle** | Chaque type de `app/core/donnees/` est confronté champ par champ à `docs/modele-donnees/{schema}.sql` | Test d'unité de conformité *(§ Portes)* |
| **1·c · Configuration d'établissement** | Tout paramètre « paramétrable » vit dans la configuration | Le seuil de connexion faible (**3 000 ms**) est une **clé de configuration**, jamais une constante | Test d'unité |
| **5 · Argent** | Montants **entiers** en unités mineures ; quantités en **NUMERIC** | Tarifs Deloria en entiers XOF ; formatage par **une seule fonction**, espace fine U+202F | Test d'unité + guide de style |
| **6 · Hors ligne** | Classes déclarées ; **B/C/D refusées hors ligne** ; UUID v7 client ; file locale | La classe vient de `docs/registre-classes-offline.md` ; la file refuse et **explique** ; `uuid.v7()` sur toute écriture | Tests d'unité + P-04 *(parcours hors ligne)* |
| **7 · Une application, trois coquilles** | `PlatformAdapter` **obligatoire** ; rôles cumulables ; **absent, jamais grisé** ; chargement paresseux par module | Interface complète, implémentation web seule ; permissions = union ; le RBAC **retire du HTML** | ESLint *(aucune API de plateforme hors adaptateur)* + test sur le HTML rendu |
| **8 · Qualité et interface** | i18n **fr et en**, aucune chaîne en dur ; **mode sombre dès le premier écran** ; aucune couleur littérale ; **deux moteurs** ; index des écrans navigable | Catalogues à parité stricte ; `dark:` seule ; jetons seuls ; Chromium **et** WebKit ; `/_ecrans` | `@intlify/vue-i18n/no-raw-text` + test de parité + P-04 |
| **9 · Sécurité** | **Aucun secret dans le paquet** ; l'attestation n'existe pas sur le web, et on l'écrit | Les jeux simulés ne portent ni clé, ni jeton, ni identifiant réel ; le recensement dit l'absence d'attestation | Test d'unité + note de plateforme |
| **10 · Périmètre** | Les provisions existent **en phase 1 et nulle part ailleurs** | Aucun domaine de provision n'est peuplé ni exposé | Revue de `app/core/donnees/` |
| **11 · Versions** | Épinglage exact, lockfile commité, inscription **dans le même changement** | Six ajouts, chacun vérifié sur son registre le 2026-08-07 | **P-03** |
| **12 · Référence visuelle** | `theme.css` **seul fichier copié** ; les seize composants font foi ; un écran composé s'inscrit à `derivation.md` | Copie conforme vérifiée ; les 3 instruments s'inscrivent comme composés, **hors des 46** | Test de copie conforme + P-04 |
| **13 · Vérification** | Une commande ; toute porte ajoutée a **son test négatif** ; aucun workflow GitHub Actions | P-03, P-04, **P-06** ; trois tests négatifs ; aucun `.github/` | Le script lui-même |

### Principes sans objet pour ce cycle — déclarés, jamais cochés en silence

| Principe | Pourquoi sans objet ici |
|---|---|
| **1·a · Contrat OpenAPI** | Aucun code Actix, donc aucun contrat à générer. Le client TypeScript arrive en phase 3 |
| **2 · Hiérarchie de crates** | Aucun crate Rust. **Le pendant front existe et il est tenu** : `app/core/donnees/` a une interface par domaine, et aucune surface de la coquille ne suppose l'hébergement ni le point de vente — c'est ce que « Résidence Test » vérifie |
| **3 · Multi-tenant / RLS** | Aucune base, donc aucune politique. La coquille porte néanmoins deux établissements et **ne mélange jamais leurs données** |
| **4 · Temps et disponibilité** | Aucune occupation n'est simulée par ce cycle. Les formules et barèmes sont du **référentiel**, pas de la disponibilité |

### Écarts à justifier

**Un seul, et c'est un ajout de porte.**

| Écart | Pourquoi il est nécessaire | Alternative plus simple, et pourquoi elle est rejetée |
|---|---|---|
| **Une cinquième porte au-delà du noyau : P-06** | Le principe 13 n'autorise l'ajout d'une porte que sur **une erreur réelle** ou un **coût manifeste**. L'erreur réelle est **documentée dans le dépôt** : `docs/design/lexique.md` v1.3.0 — *« `fermerSession()` existait depuis le cycle CPT sans aucun appelant — il n'y avait, littéralement, aucun moyen de sortir de sa session. »* C'est exactement le défaut que P-06 refuse, et il s'est produit. Ce cycle livre `PlatformAdapter` dont **la moitié des méthodes n'aura d'appelant qu'en phase 3** : sans la porte, cette moitié est indistinguable de code mort, et personne ne saura laquelle | **Un contrôle de revue** : rejeté, il n'y a pas de second lecteur (le développeur est seul), et le principe 13 dit qu'un rappel n'est pas un contrôle. **Un simple contrôle « aucun export mort »** : rejeté, il rendrait rouge toute méthode légitimement en attente de la phase 3 — c'est le second état, « dû », qui rend la porte tenable. **Ne rien faire** : rejeté, c'est l'état qui a produit `fermerSession()` |

**Aucun autre écart.** En particulier : aucun workflow GitHub Actions, aucune dépendance en intervalle, aucune seconde palette, aucun composant hors des seize.

---

## Structure du projet

### Documentation de cette fonctionnalité

```text
specs/003-coquille-application/
├── plan.md                       # Ce fichier
├── spec.md                       # La spécification, 97 exigences
├── research.md                   # Phase 0 — versions, familles §3.4, les trois questions différées
├── data-model.md                 # Phase 1 — entités simulées et conformité au modèle SQL
├── quickstart.md                 # Phase 1 — le parcours de validation, de bout en bout
├── contracts/
│   ├── platform-adapter.md       # L'interface complète, ses deux implémentations, les absences par moteur
│   ├── interfaces-domaine.md     # Le patron, et les quatre domaines que Deloria peuple
│   ├── verifier-p03.md           # La porte des dépendances, et son test négatif
│   ├── verifier-p04.md           # La porte des écrans, et son test négatif
│   └── verifier-p06.md           # La porte des points d'entrée, et son test négatif
└── checklists/requirements.md    # Checklist qualité, re-validée à la clarification
```

### Code source (racine du dépôt)

```text
kaya_v1/
├── app/                              # srcDir de Nuxt
│   ├── app.vue                       # racine — <NuxtLayout><NuxtPage/></NuxtLayout>
│   ├── assets/css/
│   │   ├── theme.css                 # ⚠️ COPIE CONFORME de docs/design/theme.css — jamais éditée
│   │   └── polices.css               # @font-face locaux (Archivo, Chivo Mono, icônes sous-réglées)
│   ├── core/
│   │   ├── design-system/            # les SEIZE composants canoniques
│   │   │   ├── BoutonPrincipal.vue         # 01      ├── EtatVide.vue            # 11
│   │   │   ├── BoutonSecondaire.vue        # 02      ├── SelecteurSegmente.vue   # 12
│   │   │   ├── BoutonDiscret.vue           # 03      ├── Squelette.vue           # 13
│   │   │   ├── PastilleEtat.vue            # 04      ├── BandeauAnnulation.vue   # 14
│   │   │   ├── TuileAction.vue             # 05      ├── BarreProportion.vue     # 15
│   │   │   ├── CarteChiffre.vue            # 06      └── ChampSaisie.vue         # 16
│   │   │   ├── BandeauAlerte.vue           # 07
│   │   │   ├── LigneListe.vue              # 08
│   │   │   ├── SelecteurEtablissement.vue  # 09
│   │   │   └── TemoinSynchronisation.vue   # 10
│   │   ├── donnees/                  # LA COUTURE — remplacée endpoint par endpoint en phase 3
│   │   │   ├── contrat.ts            # le patron qu'un domaine nouveau recopie
│   │   │   ├── fournisseur.ts        # liaison interface → implémentation (simulée aujourd'hui)
│   │   │   ├── etablissements/{interface.ts,simulation.ts,types.ts}
│   │   │   ├── comptes/{interface.ts,simulation.ts,types.ts}
│   │   │   ├── hebergement/{interface.ts,simulation.ts,types.ts}
│   │   │   ├── ventes/{interface.ts,simulation.ts,types.ts}
│   │   │   └── jeux/{deloria.ts,residence-test.ts}
│   │   ├── plateforme/
│   │   │   ├── PlatformAdapter.ts    # L'INTERFACE COMPLÈTE — écrite pour DEUX implémentations
│   │   │   ├── web/                  # l'implémentation livrée par ce cycle
│   │   │   └── capacites.ts          # le recensement des absences, PAR MOTEUR
│   │   ├── file/                     # file hors-ligne persistante + classes + témoin
│   │   ├── session/                  # session, rôles cumulés, permissions
│   │   ├── scenarios/                # les cinq leviers + le levier d'essai d'écriture
│   │   ├── i18n/{fr.ts,en.ts}        # catalogues à parité stricte
│   │   └── format/montant.ts         # LA SEULE fonction qui écrit un montant (U+202F)
│   ├── layouts/defaut.vue            # racine stable · UN SEUL <main> · 09 et 10 présents partout
│   ├── middleware/session.global.ts  # reprend la session À CHAQUE navigation, la première comprise
│   ├── pages/
│   │   ├── index.vue                 # /              → redirige vers /_ecrans (F2 y posera R1)
│   │   ├── guide-de-style.vue        # /_guide-de-style   via definePageMeta({ path })
│   │   ├── ecrans.vue                # /_ecrans           idem
│   │   └── scenarios.vue             # /_scenarios        idem
│   └── plugins/theme.client.ts       # assure la SUITE — le script du <head> a déjà posé la classe
├── public/                           # icônes du manifeste (192, 512, maskable), favicon
├── tests/
│   ├── unite/                        # Vitest — conformité au modèle, parité i18n, classes, RBAC
│   └── navigateur/                   # Playwright — P-04, deux moteurs × deux thèmes
├── docs/points-entree.md             # LE REGISTRE — « branché » / « dû », vérifié dans les deux sens
├── scripts/verifier.sh               # LA COMMANDE UNIQUE — étendue de P-03, P-04, P-06
├── nuxt.config.ts                    # ssr:false · @tailwindcss/vite · vite-plugin-pwa · i18n
├── package.json                      # versions EXACTES, chacune commentée (rôle, URL, date, motif)
├── pnpm-lock.yaml                    # COMMITÉ
├── .nvmrc                            # 24.18.1
├── eslint.config.ts                  # dont : aucune API de plateforme hors PlatformAdapter
├── knip.json · vitest.config.ts · playwright.config.ts
└── compose.yml                       # inchangé — la base de vérification de P-01/P-02/P-05
```

**Décision de structure.** Une **seule** application Nuxt à la racine du dépôt, pas de `frontend/` ni de monorepo à espaces de travail. Motif : la constitution pose « **une seule application Nuxt en SPA** pour tous les rôles métier » (principe 7) ; les deux surfaces web séparées du cadrage — page publique QR, console éditeur — appartiennent à des cycles ultérieurs et **ne sont pas anticipées ici** (principe 13 : on ne construit pas par anticipation). Le jour où elles arrivent, elles deviennent des applications sœurs et `app/core/` devient un espace de travail partagé — c'est un déplacement de fichiers, pas une réécriture.

---

## Les écrans de ce cycle — référence visuelle, composants, zone

*Livrable de phase 2. Les trois instruments s'inscrivent à `docs/design/derivation.md` dans le même changement, **hors du décompte des 46**.*

> ⚠️ **Amendement du 2026-08-07, issu de l'analyse de cohérence.** Les trois instruments étaient qualifiés d'**écrans composés** (`docs/Kaya_Design.md` §2 bis, cas c). L'analyse a établi que **le guide de style échoue à la condition 1** du test d'un écran composé — *« liste, formulaire ou fiche suivant un motif déjà posé »* —, alors que `/_ecrans` (une liste) et `/_scenarios` (un formulaire) la satisfont. Le même changement **amende donc la règle opposable de `derivation.md`** pour définir une catégorie **« instrument de développement »**, plutôt que d'introduire par une entrée de tableau une cinquième catégorie que la constitution ne connaît pas (principe 12, quatre cas). *La condition 1 existe pour empêcher qu'un écran invente un motif ; le guide de style n'en invente aucun, il les montre.* Voir **FR-089** et la tâche **T049**.

| Écran | Route | Cas | Référence visuelle | Composants employés | Zone |
|---|---|---|---|---|---|
| *(racine)* | `/` | — | — | aucun — redirection vers `/_ecrans`. **F2 y posera `R1`** | — |
| **Guide de style** | `/_guide-de-style` | **instrument** ⚠️ | **`docs/design/styleguide.html`** — rendu de référence, comparé sur les valeurs de `tokens.md` | **les seize**, chacun dans tous ses états, importés **explicitement** *(c'est ce qui les « branche », voir P-06)* | charme |
| **Écrans** | `/_ecrans` | **composé** · instrument | motif de liste posé par **`G5`** (`derivation.md`) | **08** ligne de liste · **04** pastille d'état *(avancement)* · **12** sélecteur segmenté *(produit / instruments)* · **11** état vide · **13** squelette · **03** bouton discret | charme |
| **Scénarios** | `/_scenarios` | **composé** · instrument | motif de configuration posé par **`G2`** | **16** champ de saisie *(latence, dont « choix fermé » pour le compte et l'établissement)* · **12** sélecteur segmenté *(les leviers)* · **02** bouton secondaire · **07** bandeau d'alerte · **10** témoin | charme |
| **Gabarit par défaut** | *(toutes)* | — | `R1` pour la barre d'en-tête | **09** sélecteur d'établissement · **10** témoin de synchronisation — **présents partout** (`Kaya_Design.md` §13) · réglages thème et langue | — |

**Les quatre états sont produits systématiquement**, sur chaque écran :

| État | Comment il se déclenche | Ce qu'il montre |
|---|---|---|
| **Vide** | levier « jeu vide » | Composant **11**, motif de contreforts ocre, **une phrase et l'action qui démarre** — jamais une impasse |
| **Chargement** | levier « latence » | Composant **13**, à la **forme exacte** du contenu à venir. La roue **uniquement** pour une attente réseau indéterminée |
| **Erreur** | levier « échec réseau » | Composant **07** : **ce qui s'est passé, pourquoi, l'action suivante**. Jamais deux bandeaux empilés |
| **Hors ligne** | levier « hors ligne » | Composant **10** en « **Hors connexion** », passage **instantané, sans transition** ; refus annoncé **avant** la tentative |

---

## Le parcours cliquable, de bout en bout

*Livrable de phase 2 : ce qui doit s'enchaîner sans recompiler. Il est déroulé pas à pas dans [quickstart.md](./quickstart.md) et exécuté par P-04.*

1. **Une commande** → l'application démarre, **sans conteneur** ni service distant.
2. `/` → redirigé vers **Écrans** → **46 entrées codées** + **3 instruments sans code**.
3. → **Guide de style** → les **seize** composants ; bascule de thème → **les deux rendus**.
4. Bascule de langue → **tout** passe en anglais, **aucune clé brute**.
5. → **Scénarios** → levier **hors ligne** → le témoin passe à « **Hors connexion** », **instantanément**.
6. Levier d'essai, **classe A** → **acceptée** → le témoin dit « **En attente d'envoi (1)** ».
7. Levier d'essai, **classe C** → **refusée** → « **Cette action nécessite internet.** » **et l'alternative**.
8. **Rechargement** → la file est **intacte**, le décompte dit toujours **1**.
9. Compte actif **Adjoua → Aminata** → une action **disparaît du HTML rendu**.
10. Établissement **Deloria → Résidence Test** → les surfaces des services absents **disparaissent**.
11. Levier **jeu vide** → chaque liste montre son **état vide illustré** avec sa porte de sortie.
12. Levier **latence 4 000 ms** → **squelettes**, puis « **Connexion faible** » *(seuil 3 000 ms dépassé)*.
13. Demande d'**impression** → « **cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception** ».
14. **Installation**, coupure du réseau, **réouverture** → l'application **s'ouvre**, dans le bon thème, **sans éclair clair**.

---

## Les portes — ce que ce cycle touche, et par quel test

*Le principe 13 exige que chaque porte déclare son périmètre, vérifie sa complétude, ne modifie rien, **prouve que sa cible n'est pas vide**, et ait **son test négatif**. Une porte concernée sans mécanisme de vérification serait un trou du plan.*

| Porte | État | Ce qu'elle prouve ici | Non-vacuité | Test négatif |
|---|---|---|---|---|
| **P-01** | inchangée | *(modèle SQL — hors périmètre)* | plancher 110 tables | existant |
| **P-02** | inchangée | *(classes hors-ligne — hors périmètre)* | planchers 110 / 170 | existant |
| **P-05** | inchangée | *(clés étrangères — hors périmètre)* | plancher 90 FK | existant |
| **P-03** | **CRÉÉE** | Aucun intervalle · lockfile commité **et à jour** · chaque version inscrite à `versions-reference.md`, **dans les deux sens** · **`.github/workflows/` absent** | nombre de dépendances inspectées, **dérivé des manifestes** | un `^` introduit dans une **copie de travail** de `package.json` → **doit rougir en nommant le paquet** |
| **P-04** | **CRÉÉE** | L'application **démarre** et **chaque entrée d'index marquée construite s'atteint**, en clair **et** en sombre, sur **Chromium et WebKit**, dans un navigateur réel | **dérivée du routeur** — jamais une constante *(voir research §3.2)* | une route retirée de l'index alors qu'elle reste atteignable → **doit rougir dans le premier sens** ; un écran rendu inatteignable alors qu'il est marqué construit → **doit rougir dans le second** |
| **P-06** | **CRÉÉE** | **Deux propriétés distinctes** : *(a)* tout point d'entrée est « branché » ou « dû », **vérifié dans les deux sens** ; *(b)* tout « branché » est **exercé par au moins un test** | nombre d'entrées du registre, **plancher déclaré** | **deux mutations**, une par sens : un appelant **ajouté** à un « dû » → rouge ; le dernier appelant **retiré** d'un « branché » → rouge |

**Ce que le script inclut désormais, toujours en une seule commande** : le **lint** *(dont : aucune API de plateforme hors `PlatformAdapter` · aucune chaîne visible en dur · aucune valeur littérale hors jetons)*, le **build**, les **tests d'unité**, puis **P-01, P-02, P-05, P-03, P-04, P-06**, avec **arrêt au premier contrôle rouge**.

**Le prérequis de conteneur devient local à ses portes** (FR-085) : `scripts/verifier.sh --sans-conteneur` exécute lint, build, tests, **P-03, P-04 et P-06**, **nomme les trois portes sautées**, et imprime « **VERT SOUS RÉSERVE** », jamais « TOUT VERT ». Sans le drapeau et sans démon, le script sort en code 3 comme aujourd'hui — *un poste de développement sans conteneur est une anomalie, pas un mode.*

**Aucun workflow GitHub Actions.** Le serveur vient en phase 3, et il lancera ce script **sans le modifier**.

### Les contrôles qui ne sont pas des portes

*Ils comptent autant, mais une porte s'ajoute sur une erreur réelle, pas parce qu'elle figurerait bien dans une liste.*

| Contrôle | Exigence | Mécanisme | Où il s'exécute |
|---|---|---|---|
| Aucune API de plateforme hors `PlatformAdapter` | FR-054 | Règle ESLint *(le §3.2 la nomme déjà comme rôle d'eslint)* | étape **lint** |
| Aucune chaîne visible en dur | FR-029 | `@intlify/vue-i18n/no-raw-text` | étape **lint** |
| Aucune valeur littérale hors jetons | FR-006 | Règle ESLint sur les classes utilitaires et le CSS résiduel | étape **lint** |
| Une seule racine, et c'est un élément | FR-036 | Règle ESLint — **l'identifiant exact est à vérifier contre le greffon installé**, jamais cité de mémoire | étape **lint** |
| Parité stricte des catalogues | FR-028 | Test d'unité, **dans les deux sens** | **tests d'unité** |
| Conformité au modèle SQL | FR-040 | Test d'unité, champ par champ contre `docs/modele-donnees/` | **tests d'unité** |
| `theme.css` est une copie conforme | FR-005 | Test d'unité : empreinte du fichier copié = empreinte de la source | **tests d'unité** |
| Le guide de style rend les valeurs de `tokens.md` | FR-020, SC-005 | **Style calculé** lu dans le navigateur réel, jamais une capture d'écran | **P-04** |
| Une action interdite est absente du **HTML** | FR-050 | Test de composant sur le **HTML rendu**, pas sur un attribut | **tests d'unité** + **P-04** |
| Le témoin n'emploie jamais les trois noms internes | FR-086, SC-022 | Recherche dans le HTML rendu **et** dans les deux catalogues | **tests d'unité** + **P-04** |

---

## Ce que ce cycle met à jour dans le même changement que le code

*Sans exception — un document mis à jour « juste après » ne l'est jamais.*

| Document | Ce qui y entre | Exigence |
|---|---|---|
| `docs/versions-reference.md` | **§3.2** : six lignes ajoutées, la ligne `@vite-pwa/nuxt` **remplacée** avec le motif de son écartement · **§3.3** inchangé · **§3.4** : **six familles**, dont celle que le document nous adressait | FR-081 |
| `docs/design/composants.md` | Le **composant 15** entre au canon | FR-025, FR-082 |
| `docs/design/lexique.md` | **Cinq entrées** : thème, sombre, langue, installer l'application, recharger. **Aucun nom d'instrument** | FR-091, FR-097 |
| `docs/design/derivation.md` | Les **trois instruments**, comme **composés**, entrée distincte « instrument de développement », **hors des 46** | FR-089 |
| `docs/points-entree.md` | **Créé** — le registre « branché » / « dû » | FR-074 |
| `README.md` | La commande de démarrage · la commande unique · **P-03, P-04, P-06** et leurs tests négatifs · le drapeau `--sans-conteneur` | FR-083 |
| `specs/003-…/rapport-de-cycle.md` | Ce qu'aucune porte ne couvre — au premier chef les constats faits **à la main** sur les deux moteurs | FR-084 |

---

## Contrôle de constitution — après la conception de phase 1

**Re-contrôlé le 2026-08-07, après `data-model.md`, `contracts/` et `quickstart.md`.**

| Point | Verdict |
|---|---|
| Aucune phase sautée, aucun backend introduit | ✅ Aucune migration, aucun endpoint, aucun conteneur exigé par l'application |
| La couture permet le branchement **endpoint par endpoint** | ✅ L'interface de domaine est la couture ; le client de phase 3 en est une seconde implémentation *(research §2.1)* |
| Aucune surface ne suppose l'hébergement ni le point de vente | ✅ Vérifié par « Résidence Test » — pendant de **ETB-02c** en phase 2 |
| Aucune provision exposée | ✅ Les quatre domaines peuplés ne portent aucune table de provision |
| Aucune règle fiscale hors `JurisdictionAdapter` | ✅ Ce cycle **ne calcule aucune taxe** ; les formules portent leur drapeau, sans le lire |
| Montants entiers, quantités NUMERIC | ✅ Tarifs Deloria en entiers XOF ; les quantités simulées sont décimales par type |
| Toute entité a sa classe au registre | ✅ La file lit la classe depuis `docs/registre-classes-offline.md`, jamais une valeur recopiée |
| Épinglage exact et lockfile | ✅ Six ajouts, tous vérifiés le 2026-08-07 ; P-03 le prouve |
| Une commande, portes avec test négatif | ✅ Trois portes créées, **trois tests négatifs**, dont **deux mutations** pour P-06 |
| Aucun workflow GitHub Actions | ✅ |

**Un seul écart, déjà justifié** : l'ajout de **P-06**, sur une erreur réelle documentée au dépôt. Il est inscrit au tableau *Écarts à justifier* ci-dessus.
