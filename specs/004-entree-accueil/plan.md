# Plan d'implémentation : F2 — Entrée

**Dossier** : `specs/004-entree-accueil/` | **Date** : 2026-08-07 | **Spécification** : [spec.md](./spec.md)

**Phase du produit** : **2** — l'application entière en données simulées. Cycle **F2** sur sept.

**Entrée** : la spécification de `spec.md`, 60 exigences, 14 critères de succès, 6 récits priorisés.

---

## Résumé

Ce cycle construit **les deux premiers écrans du produit** — `R0` la connexion et `R1` l'accueil —
et, avec eux, **la grammaire que les six cycles suivants reprendront sans la rejuger** : l'en-tête
permanent et ce qu'il affirme, la manière d'atteindre un écran et d'en revenir, la règle de ce qui
s'affiche selon qui regarde et depuis où.

L'approche technique tient en une phrase : **une surface d'accueil déclare ce qu'elle suppose — une
permission, un module, un écran cible — et ne décide de rien.** Le filtrage est fait par
`useAutorisation` (déjà posé par F1), la navigation par l'index des écrans (déjà posé par F1), et le
rendu par les seize composants (déjà posés par F1). Ce cycle **compose** ; il n'invente ni composant,
ni couleur, ni mot.

Trois décisions structurent le reste, toutes établies sur un fait vérifié plutôt que sur une
préférence : **le modèle ne porte aucun lien `compte → point_de_vente`**, donc le poste n'est affiché
que lorsqu'il est unique et rien ne s'affiche sinon ; **le gabarit porte l'en-tête depuis F1**, donc
« Passer la main » y vit et `docs/module-dore.md` est corrigé ; **l'index des écrans dit déjà ce qui
est construit**, donc une surface dont l'écran n'existe pas le lit là et non dans une chaîne écrite à
la main.

---

## Contexte technique

**Langage** : TypeScript 5.9.3 (contrainte du générateur de client, `versions-reference.md` §3.2) ·
Node **24.18.1** · pnpm **11.18.0**

**Dépendances principales** : Nuxt **4.5.1** en `ssr: false` · Tailwind **4.3.3** ·
`@nuxtjs/i18n` **10.6.0** · `idb` **8.0.3** · `uuid` **14.0.1** · `vite-plugin-pwa` **1.3.0**
— **toutes reprises sans revérification**.

**Ajout de ce cycle** : `libphonenumber-js` **1.13.10** *(registre interrogé le 2026-08-07 —
`research.md` §1.1)*. Aucune montée.

**Stockage** : IndexedDB via `idb` — session, réglages de scénario, file. **Aucune base**, aucun
réseau, aucun conteneur. PostgreSQL appartient aux phases 1 et 3.

**Tests** : Vitest **4.1.10** avec couverture v8 (unité, conformité, parité, absence au HTML rendu) ·
Playwright **1.62.1**, projets `chromium` **et** `webkit` (porte P-04).

**Plateforme cible** : PWA installable, deux moteurs. Toute capacité de plateforme passe par
`PlatformAdapter` — ce cycle en consomme **une** : `STOCKAGE_DURABLE`.

**Type de projet** : une **seule** application Nuxt à la racine. Ni `frontend/`, ni espaces de
travail.

**Objectifs de performance** : le premier écran utile sur l'Android 2 Go d'Aminata. Aucune attente
synchrone sur le chemin du premier rendu — la session est reprise par l'intergiciel global, les
réglages par le greffon, avant montage.

**Contraintes** : hors ligne d'abord · absent jamais grisé · aucune chaîne visible en dur, fr/en à
parité stricte · aucun littéral hors des jetons `@theme` · une page = une racine, qui est un élément.

**Périmètre** : **2 écrans du produit** (sur 46) · **1 gabarit** étendu · **1 instrument** étendu ·
**1 jeu de données** ajouté · **0 endpoint** · **0 migration**.

---

## Contrôle constitutionnel

*Barrière : doit passer avant la phase 0, revérifié après la phase 1.*

| Principe | Ce que ce cycle doit tenir | Verdict |
|---|---|---|
| **0 — Ordre des trois phases** | Phase 2 : des écrans, **aucun backend**, aucun endpoint, aucune migration. La phase 1 est close et n'est pas rouverte. | ✅ |
| **1 — Sources de vérité** | Le SQL fait foi pour les noms de champs ; le lexique pour les mots ; les jetons pour les valeurs. Deux conflits **constatés** sont tranchés et **le document perdant est corrigé dans le même changement** (§ Documents). | ✅ |
| **2 — Architecture** | `app/core/donnees/` reste la couture : une interface de domaine, une simulation. Aucun écran n'appelle une source directement. | ✅ |
| **3 — Multi-tenant** | Aucune écriture en base. Le jeu porte `tenantId` sur chaque enregistrement, comme le modèle. | ✅ |
| **4 — Temps et disponibilité** | Aucune occupation, aucun intervalle. L'heure de l'en-tête relève de l'exemption « rendu de l'instant perçu » et **ne porte aucune règle**. | ✅ |
| **5 — Argent** | Les montants affichés sont des **entiers en unités mineures**, rendus par `format/montant.ts` — la seule fonction qui écrit un montant. | ✅ |
| **6 — Hors ligne** | **Aucune opération de classe B, C ou D n'est atteignable hors ligne.** La connexion est de classe C : hors ligne, l'action **disparaît** et un bandeau dit pourquoi (FR-012). La garde vit dans la fonction d'appel, pas dans le composant. | ✅ |
| **7 — Application unique** | Une application, tous les rôles. Le RBAC décide de ce qu'on voit, **jamais** de quelle application on lance. | ✅ |
| **8 — Qualité et interface** | Absent jamais grisé · i18n fr/en à parité · mode sombre par `dark:` · seize composants et pas un de plus. | ✅ |
| **9 — Sécurité** | **Aucun secret servi au navigateur.** Le mot de passe n'est ni stocké, ni comparé, ni journalisé. Aucun jeton. | ✅ |
| **10 — Périmètre** | Aucune provision n'apparaît à l'écran. `employe` reste vide. | ✅ |
| **11 — Versions** | Épinglage exact, lockfile commité, registre interrogé et daté, `versions-reference.md` mis à jour **dans le même changement**. | ✅ |
| **12 — Référence visuelle** | `R1` est **maquetté** (quatre états), `R0` **dérivé** de `G2` avec les états de `S3`. Les écarts constatés corrigent la maquette, jamais l'inverse. | ✅ |
| **13 — Vérification** | Tout entre dans `scripts/verifier.sh`. **Aucune porte nouvelle** — justifié en `research.md` §9. Aucun workflow GitHub Actions. | ✅ |

**Aucune violation. La section « Suivi de complexité » est donc vide et retirée.**

---

## Structure du projet

### Documentation de ce cycle

```text
specs/004-entree-accueil/
├── spec.md                  # la spécification (déjà écrite)
├── plan.md                  # ce fichier
├── research.md              # phase 0 — les dix décisions et leurs motifs
├── data-model.md            # phase 1 — le jeu simulé et sa conformité au SQL
├── quickstart.md            # phase 1 — le parcours à dérouler pour croire au cycle
├── contracts/
│   ├── comptes-authentification.md   # l'interface de domaine de R0
│   ├── surfaces-accueil.md           # ce qu'une surface déclare, et ce qu'elle ne décide pas
│   └── grammaire-coquille.md         # LE CONTRAT OPPOSABLE AUX SIX CYCLES SUIVANTS
├── checklists/requirements.md
└── tasks.md                 # produit par /speckit-tasks, PAS par ce plan
```

### Code source — ce que ce cycle touche

*Le reste de l'arborescence est celui du cycle F1 et ne bouge pas.*

```text
kaya_v1/
├── app/
│   ├── core/
│   │   ├── accueil/                          ★ NOUVEAU — le motif que onze écrans hériteront
│   │   │   ├── surfaces.ts                   déclaration : permission × module × écran cible
│   │   │   ├── composerAccueil.ts            LE FILTRAGE — la seule fonction qui retient
│   │   │   ├── BlocDeTete.vue                l'action principale, une seule
│   │   │   ├── LigneSuite.vue                « ensuite, dans l'ordre de l'heure »
│   │   │   ├── CarteARegler.vue              « à régler » — danger / alerte / info
│   │   │   └── TuileActivite.vue             « vos activités » — composant 05 habillé
│   │   ├── coquille/
│   │   │   ├── EnTeteContexte.vue            ★ l'en-tête complet — extrait du gabarit
│   │   │   ├── IdentitePersonne.vue          ★ nom, ce qu'elle fait, « Passer la main »
│   │   │   └── useEcranCible.ts              ★ index des écrans → naviguer ou dire
│   │   ├── donnees/
│   │   │   ├── comptes/{interface,simulation}.ts   ← R0 : identifier(), etablissementsDe()
│   │   │   ├── accueil/{interface,simulation,types}.ts  ★ les chiffres et listes de R1
│   │   │   └── jeux/tantie-adjo.ts           ★ LE MAQUIS — sans lui, pas de 4e variante
│   │   ├── session/
│   │   │   ├── useSession.ts                 ← ⚠️ RUPTURANT : etablissementId → portee
│   │   │   │                                    + poste, + passerLaMain()
│   │   │   └── useAutorisation.ts            ← inchangé — il suffisait déjà
│   │   ├── identifiant/normaliser.ts         ★ E.164 ou e-mail — libphonenumber-js
│   │   ├── format/instant.ts                 ★ heure et date au fuseau — Intl, une fois
│   │   └── ecrans/index.ts                   ← R0 et R1 → CONSTRUIT · + le cycle attendu
│   ├── layouts/defaut.vue                    ← en-tête déménagé · MIGRÉ vers portee
│   ├── middleware/session.global.ts          ← + la redirection vers /connexion
│   └── pages/
│       ├── index.vue                         ← R1 — la redirection vers /_ecrans DISPARAÎT
│       ├── connexion.vue                     ★ R0
│       ├── ecrans.vue                        ← MIGRÉ vers portee — rien d'autre
│       └── scenarios.vue                     ← MIGRÉ · + filtrage des sites · + portée « tous »
│                                                (le choix compte/établissement EXISTE DÉJÀ — F1)
├── tests/
│   ├── unite/
│   │   ├── accueil-composition.spec.ts       ★ permission × module, les deux cumulées
│   │   ├── accueil-absence-html.spec.ts      ★ le maquis ne contient AUCUN mot absent
│   │   ├── identifiant-normalisation.spec.ts ★ E.164, e-mail, indicatif par défaut
│   │   ├── connexion-indiscernable.spec.ts   ★ médianes, écart < 10 %
│   │   ├── poste-derive.spec.ts              ★ un poste → segment · plusieurs → rien
│   │   ├── entete-unique.spec.ts             ★ un seul <header> dans tout le dépôt
│   │   └── conformite-modele.spec.ts         ← + le jeu du maquis
│   └── navigateur/
│       ├── connexion.spec.ts                 ★ R0 — les six scénarios de l'US1
│       ├── accueil-variantes.spec.ts         ★ les quatre accueils, quatre moteurs × thèmes
│       └── contexte-deux-taps.spec.ts        ★ ETB-06 — deux gestes, sans reconnexion
├── docs/
│   ├── design/html/R1-accueil*.html          ← témoin + second segment corrigés (×4)
│   ├── design/derivation.md                  ← les routes décidées, tout écran découvert
│   ├── module-dore.md                        ← la note qui lève le conflit de la 8e couche
│   ├── points-entree.md                      ← quatre « dû » deviennent « branché »
│   └── versions-reference.md                 ← §3.2 + §3.4 (deux familles ouvertes)
├── package.json · pnpm-lock.yaml             ← libphonenumber-js 1.13.10, exact
└── scripts/verifier.sh                       ← INCHANGÉ — aucune porte nouvelle
```

**Décision de structure.** `app/core/accueil/` est un dossier **nouveau et assumé** : `R1` n'est pas
une page, c'est **un motif**. `R2`, `M1`, et par transitivité `P1` et `M3`, en hériteront — les poser
dans `pages/index.vue` obligerait chacun à recopier. Le dossier porte la déclaration, le filtrage et
les quatre familles de surface ; la page ne fait que les assembler.

---

## Les écrans de ce cycle — référence, composants, zone, états

*Livrable de phase 2.*

| Écran | Route | Cas | Référence visuelle | Composants employés | Zone |
|---|---|---|---|---|---|
| **`R1` L'accueil** | `/` | **maquetté** — 4 états | `docs/design/html/R1-accueil.html` · `-proprietaire` · `-serveuse` · `-maquis` | **05** tuile d'action *(activités)* · **06** carte de chiffre *(aujourd'hui)* · **07** bandeau d'alerte *(à régler)* · **08** ligne de liste *(la suite, les tables)* · **01 · 02 · 03** actions · **04** pastille d'état · **11** état vide illustré · **13** squelette | **charme** — et **vitesse** sur les variantes serveuse et maquis, qui portent `data-zone="vitesse"` dans leur maquette |
| **`R0` Connexion** | `/connexion` | **dérivé** — de `G2`, états de `S3` | `docs/design/html/G2-offre-hebergement.html` pour le motif de formulaire ; `S3` pour l'erreur et le vide | **16** champ de saisie *(identifiant, mot de passe)* · **01** bouton principal · **07** bandeau d'alerte *(échec, hors ligne, stockage non durable)* | charme |
| **Gabarit** | *(toutes)* | — | l'en-tête des quatre `R1` | **09** sélecteur d'établissement · **10** témoin d'envoi · **03** bouton discret · réglages thème et langue | — |
| **Scénarios** *(instrument)* | `/_scenarios` | composé · instrument | motif de `G2` | **16** *(choix fermé : compte, établissement)* · **12** · **02** · **07** · **10** | charme |

### Les quatre états de chaque rubrique — ce que la porte regarde

| État | `R1` | `R0` |
|---|---|---|
| **Chargement** | **13** squelette, **à la place et à la taille exactes** du contenu à venir — jamais un vide qui fait sauter la mise en page | le bouton principal passe en attente ; les champs restent lisibles |
| **Vide** | **11** état vide illustré, **par rubrique**, disant ce qui viendra s'y loger | sans objet |
| **Erreur** | la rubrique seule porte son message ; **les autres restent affichées** (FR-022) | **07** — « Identifiant ou mot de passe incorrect », phrase unique |
| **Hors ligne** | l'accueil rend ce qui est en cache ; les surfaces de classe B/C/D **disparaissent** avec un bandeau qui dit pourquoi | l'action **disparaît**, le bandeau l'annonce **avant** la saisie (FR-012) |

### Les parcours cliquables, de bout en bout

1. **Entrer** — `/` sans session → `/connexion` → identifiant + mot de passe → retour à l'adresse
   demandée. *Et l'annonce de persistance est lue **avant** la saisie.*
2. **Voir son accueil** — les quatre variantes, obtenues au panneau Scénarios sans recompiler.
3. **Changer de site** — deux taps sur le sélecteur, permissions recalculées, **sans reconnexion**.
4. **Toucher une porte non construite** — la surface est **normale**, l'appui dit l'écran et le cycle.
5. **Passer la main** — refusé **immédiatement** si la file n'est pas vide ; sinon retour à `/connexion`.

---

## Les portes — ce que ce cycle touche, et par quel test

*Une porte concernée sans mécanisme de vérification est un trou du plan. **Aucune porte nouvelle** —
motif en `research.md` §9.*

| Porte | Touchée ? | Comment ce cycle la fait passer | Le test qui le prouve |
|---|---|---|---|
| **P-01** SQL sur base vierge | **non** | Aucune migration, aucun fichier de `docs/modele-donnees/` modifié. La phase 1 est close. | — |
| **P-02** table → registre | **non** | Aucune table nouvelle. Le jeu du maquis peuple des tables **déjà déclarées** au registre des classes. | `tests/unite/conformite-modele.spec.ts`, étendu au nouveau jeu |
| **P-05** aucune FK inter-schémas | **non** | Aucun SQL. | — |
| **P-03** versions | **oui** | `libphonenumber-js@1.13.10` **exact**, lockfile commité, justification dans `versionsJustification` *(rôle, registre, date, pourquoi l'existant ne suffit pas)*, et la ligne inscrite au **§3.2** de `versions-reference.md` **plus** deux lignes au **§3.4** — familles « numéros de téléphone » et « date et heure (JS) ». La porte vérifie **dans les deux sens**. | `scripts/verifier.sh --porte p03` |
| **P-04** l'application démarre, chaque `CONSTRUIT` s'atteint | **oui — c'est la porte du cycle** | `R0` et `R1` passent à `CONSTRUIT` avec leur route à `app/core/ecrans/index.ts`. La porte les exige aussitôt **Chromium × WebKit × clair × sombre** — **8 passages de plus**. La racine `/` cesse de rediriger : elle **sert** `R1`, et l'inventaire des routes est lu **depuis le build**. | `tests/navigateur/{connexion,accueil-variantes,contexte-deux-taps}.spec.ts` + `ecrans-atteignables.spec.ts` (existant, qui croît tout seul) |
| **P-06** branché ou dû, et tout branché exercé | **oui** | Quatre points d'entrée que F1 a déclarés **« dû · cycle F2 / CPT »** deviennent **« branché »** : `SESSION_VIDE` *(passer la main)*, `TYPES_IDENTIFIANT` *(R0)*, `ETATS_PASTILLE_ORDONNES` *(légende)*, `estLangue` *(langue du compte)*. Tout export neuf est déclaré dans le même changement, et **exercé** — la couverture par fonction le vérifie. | `pnpm knip` + `pnpm test:couverture`, confrontés à `docs/points-entree.md` **dans les deux sens** |

**Le test négatif de chaque porte touchée est déjà écrit** (P-03, P-04, P-06 en ont un depuis F1) :
ce cycle **ne modifie aucune porte**, donc aucun test négatif n'est à ajouter. `verifier.sh` reste
**tel quel** — c'est la meilleure preuve que le cycle n'a rien contourné.

**Ce que les portes ne couvriront pas, et qui sera dit au rapport de cycle** : qu'un accueil de
maquis *ait l'air conçu pour un maquis*. Le contrôle mécanique prouve l'absence des mots, jamais le
jugement d'usage. C'est ce que l'atelier terrain doit trancher.

---

## Les documents mis à jour **dans le même changement**

*Sans exception — c'est la règle du dépôt, pas une intention.*

| Document | Ce qui y entre | Motif |
|---|---|---|
| `docs/versions-reference.md` §3.2 | `libphonenumber-js 1.13.10`, URL et date | Règle 4 du §1 — l'inscription se fait dans le changement qui ajoute, jamais reportée |
| `docs/versions-reference.md` §3.4 | **Deux familles ouvertes** : *numéros de téléphone* → `libphonenumber-js` · *date et heure (JS)* → **`Intl` natif, aucune dépendance** | « Une famille absente n'est pas libre : c'est une famille non encore rencontrée. » Le cycle qui l'ouvre **tranche pour tout le dépôt** |
| `docs/design/html/R1-accueil*.html` ×4 | Témoin → « Enregistré » · second segment → commune, ou commune · poste unique | `lexique.md` fait foi ; une maquette qui ment est pire qu'une maquette absente |
| `docs/design/derivation.md` | Les routes `/` et `/connexion` · tout écran découvert à l'implémentation, avec sa mention | Quatrième cas du principe 12 — inventer est autorisé, **inventer en silence** ne l'est pas |
| `docs/module-dore.md` | La note qui lève le conflit de la huitième couche : le motif du **pied** valait pour l'état d'avant F1 | Un conflit constaté n'est jamais tranché en silence (`research.md` §5) |
| `docs/points-entree.md` | Quatre « dû » → « branché » · tout export neuf, dans les deux sens | C'est la porte P-06 elle-même |
| `app/core/ecrans/index.ts` | `R0` et `R1` → `CONSTRUIT` + route · le **cycle attendu** de chaque écran non construit | Source unique — la page la rend, la porte la lit, la mention de `R1` s'y adosse |
| `docs/registre-classes-offline.md` | **rien** | Aucune entité nouvelle. Le maquis peuple des tables déjà déclarées |

---

## Livrables — ce que ce plan **ne** produit pas

**Phase 1** — aucun fichier de `docs/modele-donnees/` créé ni modifié : la phase 1 est **close** et
ce cycle n'a besoin d'aucune table nouvelle. Un accueil et une connexion se composent entièrement des
118 tables existantes.

**Phase 3** — aucune migration, aucun endpoint, aucune annotation `utoipa`, aucun événement outbox,
aucun trait exposé, **et aucune simulation supprimée** : ce cycle en **ajoute** une
(`donnees/accueil/`). Les suppressions commencent au cycle T1, quand le backend remplace endpoint par
endpoint. Rust, Actix, sqlx 0.9, Redis et Garage n'entrent nulle part ici — le principe 0 l'interdit,
et il n'y aurait rien à brancher.

---

## Contrôle constitutionnel après conception

*Revérification exigée après la phase 1.*

Les treize principes tiennent, **et deux d'entre eux méritent d'être repris parce que la conception
les a mis à l'épreuve** :

- **Principe 8 — « absent, jamais grisé ».** La décision de FR-052 *(surface présente, apparence de
  F7, mention à l'appui)* a été examinée contre cette règle et **ne la contredit pas** : la règle
  protège d'une action **interdite** ou d'un **service inexistant ici** — les deux restent absentes
  sans exception. Ici l'action existe, la personne y a droit, le service est actif ; **ce qui manque
  est de notre côté**, et le dire est honnête. L'effacer donnerait de `R1` une image fausse au moment
  précis où onze écrans doivent en hériter le motif. Le contrôle mécanique est SC-014 : **aucune**
  différence de rendu entre une surface aboutie et une surface en attente.
- **Principe 12 — la grammaire fait foi, pas le dessin.** Ce cycle **corrige quatre maquettes**. Ce
  n'est pas une licence prise sur le dessin : c'est l'application littérale de la préséance, deux
  fois, sur constat — le témoin d'envoi et le second segment de l'en-tête (`research.md` §7).

**Aucune violation. Aucune dérogation demandée.**
