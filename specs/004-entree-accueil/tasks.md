# Tâches : F2 — Entrée

**Entrée** : les documents de conception de `specs/004-entree-accueil/`

**Prérequis** : [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) ·
[data-model.md](./data-model.md) · [contracts/](./contracts/)

**Phase du produit** : **2** — l'application entière en données simulées.
**Phase 1** *(modèle de données)* : **sans objet** — aucune table, aucun fichier SQL touché.
**Phase 3** *(backend)* : **sans objet** — aucune migration, aucun endpoint, aucune simulation
supprimée. Ce cycle en **ajoute** une.

**Tests** : exigés. La *Definition of Done* §0.4 point 1 les impose, et les critères de succès de la
spécification sont écrits pour être mesurés.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable — fichiers distincts, aucune dépendance sur une tâche inachevée
- **[Story]** : le récit servi (`US1`…`US6`)
- Chaque tâche porte **son chemin de fichier exact**

## Règles opposables à toute tâche de ce cycle

| Règle | Ce qu'elle interdit |
|---|---|
| **Le HTML de maquette n'est jamais copié ni déplacé vers `app/`** | On en lit les valeurs et la structure ; on **réimplémente** en composants Nuxt — avec i18n, mode sombre et RBAC, que l'export ne contient pas |
| **Une tâche d'interface qui ne livre pas d'écran atteignable n'est pas terminée** | Un composant sans écran qui l'affiche |
| **Chaque tâche d'interface se termine par** : l'écran s'ouvre en navigateur, **clair ET sombre**, avec ses états vide / chargement / erreur / hors ligne | Un composant monté en test qui tiendrait lieu de preuve (DoD §0.4 point 8) |
| **Tout terme visible passe par `docs/design/lexique.md`** | Écrire un terme technique en dur « en attendant ». S'il manque au lexique, il y entre **dans le même changement** |
| **Aucune valeur littérale** hors des jetons `@theme` · mode sombre par `dark:` seulement | Une seconde palette |
| **Une page a une seule racine, et c'est un élément** | Un `v-if`/`v-else` de premier niveau |

**Référence visuelle** — le décompte des écrans se lit dans `docs/design/derivation.md`, jamais ici.
Les deux écrans de ce cycle relèvent des cas **(a)** et **(b)** :

| Écran | Cas | Référence |
|---|---|---|
| `R1` L'accueil | **(a) maquetté** | `docs/design/html/R1-accueil.html` · `-proprietaire` · `-serveuse` · `-maquis` |
| `R0` Connexion | **(b) dérivé** | ligne `R0` de `derivation.md` : *hérite de `G2`, états d'erreur et vides de `S3`* → ouvrir `docs/design/html/G2-offre-hebergement.html` |

**Aucun composant ne manque à la bibliothèque** — vérifié composant par composant contre
`docs/design/composants.md`. La grille de tables des variantes serveuse et maquis est la **tuile
d'action 05 en variante compacte**, portant une **pastille 04** au lieu d'une icône. Voir **T008**,
qui lève le seul écart constaté.

---

## Phase 1 — Mise en place

**Objet** : ce sans quoi aucune tâche suivante ne compile ni ne se vérifie.

- [X] T001 Ajouter `libphonenumber-js` en version **exacte** `1.13.10` à `package.json`, avec son entrée dans `versionsJustification` — rôle, registre `https://registry.npmjs.org/libphonenumber-js/latest`, date de vérification **2026-08-07**, et **pourquoi les dépendances présentes ne suffisent pas** (`research.md` §1.1) ; `pnpm install` et **commiter `pnpm-lock.yaml`**
- [X] T002 Inscrire `libphonenumber-js 1.13.10` au **§3.2** de `docs/versions-reference.md`, avec URL et date — dans le même changement que T001, jamais reporté
- [X] T003 [P] Ouvrir **deux familles** au **§3.4** de `docs/versions-reference.md` : *numéros de téléphone* → retenu `libphonenumber-js`, écartés `google-libphonenumber`, `awesome-phonenumber`, validation maison ; *date et heure (JS)* → retenu **`Intl` natif, aucune dépendance**, écartés `date-fns`, `dayjs`, `luxon`, `moment`. Chaque ligne porte son motif — le cycle qui ouvre une famille **tranche pour tout le dépôt**
- [X] T004 Vérifier que `scripts/verifier.sh --porte p03` est **vert** après T001–T003 — la porte confronte manifeste et document **dans les deux sens**

**Point de contrôle** : les versions sont épinglées, justifiées et inscrites. P-03 est verte.

---

## Phase 2 — Fondations bloquantes

**⚠️ Aucun récit ne peut commencer avant la fin de cette phase.**

### Le jeu de données

- [ ] T005 [P] Créer `app/core/donnees/jeux/tantie-adjo.ts` — le maquis : 1 `etablissement` (Abobo, `TANTIE_ADJO_ABOBO`, fuseau `Africa/Abidjan`), **1 seul** `etablissement_module` (restauration), 1 `point_de_vente` « La salle » (`avecTables: true`, `caisseId: null`), 9 `table_pdv` dont `COMPTOIR`. Champs et types **repris du SQL**, `snake_case → camelCase` seule transformation autorisée — voir `data-model.md` §3.3
- [ ] T006 [P] Ajouter à `app/core/donnees/jeux/deloria.ts` les trois `compte_role` du maquis : Yao **gérant** et **caissier**, M. Koffi **propriétaire** — avec le commentaire qui dit que Yao reste réceptionniste à Deloria, **la même personne avec des rôles différents selon le site**
- [ ] T007 Étendre `tests/unite/conformite-modele.spec.ts` au jeu du maquis — le test **lit les `.sql`** et compare ; il n'y a pas de seconde liste à tenir

### Le constat sur le composant 05 — à lever avant d'écrire une tuile

- [ ] T008 Corriger `docs/design/composants.md` **§05 · Tuile d'action** : retirer l'état **« désactivé (rôle) »** et la phrase *« Désactivée, elle passe sur `bg-tile` et dit pourquoi (« rôle serveuse ») »*. **Deux violations en une ligne** — une tuile non autorisée est **absente**, jamais grisée (constitution, principe 8) ; et le mot « rôle » n'atteint **jamais** l'écran (lexique). Écrire à la place la règle qui vaut : *une tuile dont la permission manque ou dont le service est inactif n'est pas rendue*. La constitution et le lexique priment sur `composants.md`, et le document perdant se corrige **dans le même changement**
- [ ] T009 Étendre `tests/unite/seize-composants.spec.ts` pour que l'état retiré ne puisse pas revenir — le test échoue si `composants.md` §05 mentionne à nouveau un état désactivé

### Les fondations de la coquille

- [ ] T010 [P] Créer `app/core/format/instant.ts` — **la seule fonction** qui écrit une heure ou une date, au **fuseau de l'établissement**, par `Intl.DateTimeFormat`. Le remplacement du séparateur (`09:40` → `09 h 40`) se fait **ici, une fois**, comme `montant.ts` impose son U+202F. Aucune dépendance
- [ ] T011 [P] Créer `app/core/identifiant/normaliser.ts` — `EMAIL` | `TELEPHONE` (E.164) | `ABSENT`. **Un `@` ⇒ e-mail**, sans autre examen ; sinon analyse avec **l'indicatif par défaut lu de la configuration**, jamais en dur. Emploie `libphonenumber-js/min`
- [ ] T012 Étendre `app/core/session/useSession.ts` : remplacer `etablissementId` par **`portee`** — `{ type: 'etablissement', id }` ou `{ type: 'tous' }` —, ajouter `posteUnique: string | null`, et écrire le commentaire qui dit **pourquoi ce n'est pas `etablissementId: null`** : `null` signifie déjà « aucun choix fait » et déclenche la reprise ; confondre les deux ferait afficher la vue d'ensemble d'un propriétaire à un compte fraîchement connecté (`data-model.md` §5.1). **⚠️ Changement rupturant : migrer les quatre appelants DANS LA MÊME TÂCHE** — `app/layouts/defaut.vue` (lignes 78 et 121), `app/pages/scenarios.vue` (`appliquerContexte` et la comparaison de reprise), `app/pages/ecrans.vue` (lignes 76 et 129), et `app/core/session/useAutorisation.ts` si elle lit le champ. **Sans eux, le dépôt ne compile plus dès cette tâche** — et `pnpm typecheck` est un préalable de `scripts/verifier.sh`
- [ ] T013 Ajouter `app/core/ecrans/index.ts` un champ **`cycle`** sur chaque entrée non construite (`'F3'`, `'F5'`…) — c'est là qu'il vit, **jamais dans une surface de `R1`**
- [ ] T014 Créer `app/core/coquille/useEcranCible.ts` — d'un **code d'écran** vers `{ etat: 'construit', route }` | `{ etat: 'aVenir', titre, cycle }` | `{ etat: 'inconnu' }`, lu **à l'index et nulle part ailleurs** (`contracts/surfaces-accueil.md` §5)
- [ ] T015 Extraire l'en-tête de `app/layouts/defaut.vue` vers `app/core/coquille/EnTeteContexte.vue`, **sans en changer le rendu** — la tâche est un déplacement, et le test de non-régression est que les suites de navigateur existantes restent vertes

**Point de contrôle** : le jeu, les formats, la session et l'index sont prêts. Les récits peuvent
commencer.

---

## Phase 3 — US1 · Entrer dans l'application (Priorité : P1 · story produit **CPT-01, P0**)

**But** : `R0` s'ouvre, refuse sans rien révéler, et **dit avant la saisie** ce que deviendra la
session.

**Test indépendant** : ouvrir sans session, se tromper de mot de passe, constater la phrase unique ;
recharger et constater que le comportement est **celui qui avait été annoncé**.

**Référence visuelle** : cas **(b)** — `R0` hérite de `G2`
(`docs/design/html/G2-offre-hebergement.html`) pour le motif de formulaire, et de `S3` pour les états
d'erreur et vides. **Composants** : **16** champ de saisie · **01** bouton principal · **07** bandeau
d'alerte.

- [ ] T016 [P] [US1] Écrire `tests/unite/identifiant-normalisation.spec.ts` — `0708091011` → `+2250708091011` · `+225 07 08 09 10 11` → idem · `adjoua@…` → e-mail · `0708091011@…` → **e-mail** (le `@` l'emporte) · vide → `ABSENT`
- [ ] T017 [US1] Étendre `app/core/donnees/comptes/interface.ts` et `simulation.ts` avec `identifier(identifiantSaisi, motDePasse)` — le mot de passe est **reçu et ignoré**, avec le commentaire qui dit pourquoi le retirer ferait de la phase 3 une **rupture d'interface** (`contracts/comptes-authentification.md` §3). Quatre cas d'échec, **deux codes** : `IDENTIFIANTS_INVALIDES` pour compte inconnu, mot de passe faux, `SUSPENDU` et `REVOQUE` ; `IDENTIFIANT_ABSENT` pour le champ vide
- [ ] T018 [US1] Ordonner la simulation comme `lireSimule` : hors ligne → échec réseau → **attendre la latence** → **puis** décider du verdict. Les deux chemins d'échec traversent la même attente ; le verdict se calcule après
- [ ] T019 [US1] Écrire `tests/unite/connexion-indiscernable.spec.ts` — médiane de 20 tentatives par chemin, **écart < 10 %** (SC-005). Test d'**unité**, jamais de navigateur : le bruit d'un moteur réel dépasserait l'écart cherché
- [ ] T020 [US1] Créer `app/pages/connexion.vue` — route `/connexion`. Une racine, un élément. Champ identifiant, champ mot de passe, bouton principal, bandeau d'alerte. **Pas d'en-tête de contexte** : il n'y a pas encore de contexte, et un sélecteur d'établissement vide y serait un mensonge (FR-009)
- [ ] T021 [US1] Interroger `STOCKAGE_DURABLE` au `PlatformAdapter` **avant tout affichage de champ**, et rendre l'une des deux phrases — jamais un troisième cas silencieux. **Appelé une fois**, verdict mémorisé pour la session : `navigator.storage.persist()` est asynchrone et peut ouvrir une invite, le rappeler à chaque rendu ferait clignoter l'annonce
- [ ] T022 [US1] Ajouter les clés i18n **fr et en** de `R0` à `app/core/i18n/{fr,en}.ts`, à **parité stricte** — les phrases sont **celles du lexique**, mot pour mot : « Identifiant ou mot de passe incorrect », « Indiquez un numéro de téléphone ou une adresse e-mail. ». Si une phrase manque au lexique, **l'y ajouter dans le même changement** et le signaler
- [ ] T023 [US1] Étendre `app/middleware/session.global.ts` : sans session, **`return navigateTo('/connexion')`** — jamais `abortNavigation()` ni `return false`, qui affichent « Page Not Found » sur la navigation initiale d'une SPA. Retenir l'adresse demandée et y revenir après l'entrée
- [ ] T024 [US1] Rendre l'action de connexion **absente** hors ligne, avec le bandeau qui dit pourquoi **avant** la saisie (FR-012) — `compte` est de **classe C** au registre. La garde vit dans la **fonction d'appel**, pas dans le composant
- [ ] T025 [US1] Passer `R0` à **`CONSTRUIT`** avec sa route à `app/core/ecrans/index.ts`, et inscrire la route `/connexion` à `docs/design/derivation.md`
- [ ] T026 [US1] Écrire `tests/navigateur/connexion.spec.ts` — les sept gestes de `quickstart.md` §2.1, **Chromium et WebKit**, **clair et sombre**

**Point de contrôle** : `R0` s'ouvre aux quatre passages, avec ses états erreur et hors ligne.

---

## Phase 4 — US2 · Un accueil qui ressemble à ce qu'on fait (Priorité : P1 · story produit **CPT-02/03, P0**) 🎯 MVP

**But** : les **quatre** accueils maquettés, obtenus par le contexte et **jamais par une branche de
code**.

**Test indépendant** : basculer de compte et d'établissement, obtenir les quatre variantes, chacune
**sans reste** — aucune section vide, aucun libellé d'un service absent, aucun élément inerte.

**Référence visuelle** : cas **(a)** — les quatre fichiers d'état `R1-accueil*.html`.
**Composants** : **05** tuile d'action · **06** carte de chiffre · **07** bandeau d'alerte ·
**08** ligne de liste · **01 · 02 · 03** actions · **04** pastille · **11** état vide · **13**
squelette.
**Zone** : `charme`, et **`data-zone="vitesse"`** sur les variantes serveuse et maquis, que leur
maquette porte.

- [ ] T027 [P] [US2] Créer `app/core/accueil/surfaces.ts` — `SurfaceAccueil extends ActionAutorisable` : `permission`, `moduleCode`, **`ecranCible` (le code, jamais une route)**, `famille`, `titreCle`. Une surface **ne porte ni route, ni libellé de mention, ni condition d'affichage** (`contracts/surfaces-accueil.md` §2)
- [ ] T028 [US2] Créer `app/core/accueil/composerAccueil.ts` — appelle **`useAutorisation.retenir()` de F1, inchangée**, et retire toute rubrique dont **toutes** les surfaces sont tombées, **titre compris** (FR-015)
- [ ] T029 [P] [US2] Créer `app/core/donnees/accueil/{types,interface,simulation}.ts` — les listes et chiffres de chaque rubrique, **une source par rubrique** : c'est ce qui rend FR-022 tenable, l'échec de l'une n'emporte pas les autres
- [ ] T030 [P] [US2] Créer `app/core/accueil/BlocDeTete.vue` — **une seule action principale par écran**, composants **01** et **03**
- [ ] T031 [P] [US2] Créer `app/core/accueil/LigneSuite.vue` — composant **08**, ordonné **par l'heure**, jamais par importance supposée ; composants **02** et **04**
- [ ] T032 [P] [US2] Créer `app/core/accueil/CarteARegler.vue` — composant **07**, trois niveaux (danger · alerte · info), **jamais plus de trois cartes**
- [ ] T033 [P] [US2] Créer `app/core/accueil/TuileActivite.vue` — composant **05**. La **grille de tables** des variantes serveuse et maquis est **ce même composant en variante compacte**, portant une **pastille 04** au lieu d'une icône. Aucun composant nouveau — voir T008
- [ ] T034 [US2] Créer `app/pages/index.vue` servant `R1` à la racine `/` — **la redirection vers `/_ecrans` posée par F1 disparaît**, elle disait explicitement « F2 y posera `R1` ». Une racine, un élément
- [ ] T035 [US2] Brancher l'appui d'une surface sur `useEcranCible` (T014) : navigation si l'écran est construit, **mention** sinon — titre et cycle **lus à l'index**. La surface garde **l'apparence exacte** d'une surface aboutie : ni atténuation, ni badge, ni `disabled`, ni classe distinctive. *Un badge « bientôt » réintroduirait le grisé par la porte de derrière*
- [ ] T036 [US2] Donner à chaque rubrique ses **quatre états** : squelette **13** à la place et à la taille exactes du contenu · état vide **11** illustré, par rubrique · erreur locale · nominal. **Une rubrique qui échoue n'en emporte pas cinq**. Dans `app/core/accueil/composerAccueil.ts` et les quatre composants de surface
- [ ] T037 [US2] Abandonner toute réponse arrivée **après** un changement d'établissement (FR-023) dans `app/core/accueil/composerAccueil.ts` — sinon Deloria montre les chiffres du maquis
- [ ] T038 [US2] Faire passer **tout montant de `R1`** par `app/core/format/montant.ts` — la seule fonction qui écrit un montant —, dans les quatre composants de surface de `app/core/accueil/` et dans `app/core/donnees/accueil/simulation.ts`, qui les porte en **entiers d'unité mineure** et dans la **devise de l'établissement** (FR-020, constitution principe 5). Écrire l'assertion correspondante dans `tests/unite/accueil-composition.spec.ts` : aucun montant rendu sans passer par la fonction, aucun flottant dans le jeu. *`R1` affiche huit montants ou plus selon la variante ; un seul écrit à la main et l'alignement tabulaire tombe*
- [ ] T039 [US2] Ajouter les clés i18n **fr et en** de `R1`, à parité stricte, **toutes issues du lexique**
- [ ] T040 [US2] Écrire `tests/unite/accueil-composition.spec.ts` — les **deux** conditions cumulées ; un compte ayant le droit d'appliquer une remise sur un site sans restauration ne voit **rien** ; passer un écran à `CONSTRUIT` à l'index fait disparaître la mention **sans que `R1` soit retouché**
- [ ] T041 [US2] Écrire `tests/unite/accueil-absence-html.spec.ts` — sur le maquis, le document rendu ne contient **aucune** occurrence de « Hébergement », « Pressing », « Salle de réunion » : ni en texte, ni en attribut, ni sous un élément masqué ; et **aucun** élément de l'accueil ne porte `disabled` (SC-003, SC-004, SC-014)
- [ ] T042 [US2] Passer `R1` à **`CONSTRUIT`** avec la route `/` à `app/core/ecrans/index.ts`, et inscrire la route à `docs/design/derivation.md`
- [ ] T043 [US2] Écrire `tests/navigateur/accueil-variantes.spec.ts` — les **quatre** accueils, **Chromium et WebKit**, **clair et sombre**

**Point de contrôle** : 🎯 **MVP atteint.** On se connecte et on voit son accueil, quatre variantes,
huit passages de navigateur.

---

## Phase 5 — US3 · Savoir où l'on est, et en changer en deux taps (Priorité : P1 · story produit **ETB-06, P1**)

> **C'est le premier incrément livrable *après* le cœur P0.** `CPT-01→03` sont **P0** et vivent en
> phases 3 et 4 ; `ETB-06` est **P1**. L'ordre suit les priorités du produit, pas seulement celles
> des récits.

**But** : la barre du haut ne bouge jamais, et le changement de site coûte **deux gestes**.

**Test indépendant** : compter les gestes entre deux accueils, et vérifier que la personne connectée
n'a pas changé.

**Référence visuelle** : l'en-tête des quatre `R1`. **Composants** : **09** sélecteur
d'établissement · **10** témoin d'envoi · **03** bouton discret.

- [ ] T044 [US3] Dériver le poste dans `app/core/donnees/comptes/simulation.ts#posteUniqueSur` — `rôles → permissions → modules → points de vente`, et rendre **`null` dès qu'il y en a plus d'un**. Écrire le commentaire qui porte le fait : **le modèle ne contient aucun lien `compte → point_de_vente`** (vérifié dans `20-comptes.sql`) — le poste est un **calcul**, jamais une donnée
- [ ] T045 [US3] Afficher dans `EnTeteContexte.vue` : le détail du composant 09 porte **la commune, toujours** ; le **poste** est un segment distinct, **affiché seulement s'il est unique**. **Jamais** « plusieurs postes », jamais un poste par défaut, jamais une liste. *Le second segment affirme un fait ; l'affirmer sans le savoir est un mensonge que six cycles hériteraient*
- [ ] T046 [US3] Écrire `tests/unite/poste-derive.spec.ts` — Yao au maquis → « Abobo · La salle » · Adjoua → « Abengourou » seul · Aminata → seul · M. Koffi → seul. **Les deux formes d'en-tête sont couvertes** (FR-030c, SC-013)
- [ ] T047 [US3] Brancher le choix du sélecteur 09 sur la session, dans `app/core/coquille/EnTeteContexte.vue` et `app/core/session/useSession.ts` : **deux interactions**, **sans reconnexion**, permissions **recalculées pour ce site** (FR-027) — un droit détenu ailleurs ne suit pas la personne
- [ ] T048 [US3] Persister l'établissement actif dans `app/core/session/useSession.ts` et le reprendre à l'ouverture suivante (FR-032) — rouvrir ramène au **dernier site choisi**, pas au premier de la liste
- [ ] T049 [US3] Remonter dans `app/core/coquille/EnTeteContexte.vue` l'alerte d'un **autre** établissement en pastille sur le sélecteur fermé, et **ne jamais changer de contexte tout seul** — *un changement non demandé fait saisir une consommation sur le mauvais site*
- [ ] T050 [US3] Ajouter le troisième état du sélecteur — **« Mes N établissements »**, la portée `tous` de T012 —, sous lequel **aucune surface qui modifie une caisse** n'existe (FR-019)
- [ ] T051 [US3] Afficher l'heure et la date au **fuseau de l'établissement** via `format/instant.ts` (T010), et vérifier que le témoin **10** emploie les libellés du lexique — jamais « connecté », « dégradé », « hors ligne », « synchronisation »
- [ ] T052 [US3] Écrire `tests/navigateur/contexte-deux-taps.spec.ts` — deux gestes, sans reconnexion, avec persistance ; et le sélecteur **non-bouton** pour un compte à un seul site

**Point de contrôle** : `ETB-06` est tenue. Le cœur du cycle est livré.

---

## Phase 6 — US4 · La grammaire que les six cycles suivants reprennent (Priorité : P2)

**But** : ce qui est décidé ici, F3 à F7 le reprennent **sans le rejuger**.

**Test indépendant** : l'en-tête est défini **une fois** dans le dépôt, et aucun écran ne le recopie.

- [ ] T053 [US4] Ajouter l'identité dans `app/core/coquille/IdentitePersonne.vue` — nom, ce que la personne fait, et **« Passer la main »**, avec l'effet annoncé : « La personne suivante devra entrer son identifiant. » **Jamais « se déconnecter »**
- [ ] T054 [US4] Corriger `docs/module-dore.md`, huitième couche : la sortie de session y est placée **au pied** au motif que *« `R1` et `G1` portent déjà deux `<header>` différents »* — **ce motif ne tient plus**, le gabarit porte l'en-tête pour tous les écrans depuis F1. Écrire la note qui dit ce que le motif protégeait et ce qui l'a remplacé. Un conflit constaté n'est **jamais** tranché en silence
- [ ] T055 [US4] Refuser « Passer la main » **immédiatement** tant que la file n'est pas vide, avec la phrase du lexique — jamais un échec constaté après coup. La garde est **synchrone**, `useFile().enAttente` de F1
- [ ] T056 [US4] Poser le motif de **retour** dans `app/core/coquille/EnTeteContexte.vue` et `app/layouts/defaut.vue` : il ramène à **l'accueil de l'établissement courant**, jamais à l'entrée précédente de l'historique — qui peut appartenir à un **autre site** (FR-036)
- [ ] T057 [US4] Écrire `tests/unite/entete-unique.spec.ts` — le dépôt contient **exactement un** `<header>`, et aucune page ne le recopie
- [ ] T058 [US4] Corriger les **quatre** `docs/design/html/R1-accueil*.html` : le témoin passe à **« Enregistré »** (le lexique fait foi ; le composant 10 de F1 était **déjà** conforme, c'est la maquette qui a dérivé) et le second segment porte **la commune, ou commune · poste unique** — « 20 chambres » et « 9 tables » redescendent dans le corps. *Une maquette qui ment est pire qu'une maquette absente*

**Point de contrôle** : la grammaire est écrite, testée, et opposable.

---

## Phase 7 — US5 · Atteindre les quatre variantes sans recompiler (Priorité : P2)

**But** : quatre accueils depuis **un seul** démarrage, sans build, sans fichier à éditer.

**Référence visuelle** : cas **(c)** — instrument composé, motif de configuration posé par `G2`.
**Composants** : **16** *(choix fermé : compte, établissement)* · **12** · **02** · **07** · **10**.

- [ ] T059 [US5] Compléter `app/pages/scenarios.vue` — **le choix du compte et de l'établissement existe déjà** (F1 : `appliquerContexte`, `compteActif`, `etablissementActif`, persistés par `regler` ; FR-046 et FR-047 sont **partiellement tenues**). Deux manques seulement : `listerEtablissements()` les rend **tous**, il faut **ne proposer que ceux où le compte a des droits** — les proposer et refuser ensuite serait un grisé déguisé — et ajouter le choix de la **portée « tous »**. **Ne pas réécrire ce qui marche**
- [ ] T060 [US5] Ajouter à `tests/navigateur/contexte-deux-taps.spec.ts` l'assertion des **deux formes d'en-tête** obtenues depuis `app/pages/scenarios.vue` — un compte à un poste, un compte à quatre (FR-030c, SC-013). **Mesurée, pas constatée à l'œil** : T046 la prouve en unité, celle-ci en navigateur
- [ ] T061 [US5] Étendre le contrôle **(b)** de `tests/unite/regles-opposables.spec.ts` — qui interdit déjà à un composant d'importer une simulation ou un jeu — pour couvrir `app/core/scenarios/reglages.ts` (FR-048). **Étendre, jamais ouvrir un second mécanisme** : deux contrôles pour une règle divergent, et c'est le plus faible qu'on croira

**Point de contrôle** : les quatre variantes sont atteignables par un relecteur, sans outil.

---

## Phase 8 — US6 · L'accueil quand rien ne va (Priorité : P3)

**But** : ni page blanche, ni tourniquet éternel, ni message d'ingénieur.

> **Ce que cette phase est, dite honnêtement.** Les quatre états sont **implémentés** en phases 3 et
> 4 (T021, T024, T036) ; cette phase les **prouve en navigateur réel**, ce qu'aucun test de composant
> ne remplace (DoD §0.4 point 8), et livre **un** cas neuf — le compte sans établissement. Ce n'est
> donc pas un incrément fonctionnel, et l'appeler ainsi tromperait sur ce qui reste à faire.

- [ ] T062 [P] [US6] Écrire `tests/navigateur/etats-degrades.spec.ts` — sous le levier **jeu vide**, vérifier que chaque rubrique porte son **état vide illustré**, disant ce qui viendra s'y loger — et non un cadre nu
- [ ] T063 [US6] Étendre `tests/navigateur/etats-degrades.spec.ts` — sous **échec réseau**, vérifier que les autres rubriques **restent affichées** — c'est le point dur : si tout l'accueil tombe, l'indépendance des sources n'est pas tenue
- [ ] T064 [US6] Étendre `tests/navigateur/etats-degrades.spec.ts` — sous **hors ligne**, vérifier que la connexion le dit **avant** la saisie, et que les surfaces de classe B/C/D **disparaissent** avec un bandeau qui dit pourquoi
- [ ] T065 [US6] Étendre `tests/navigateur/etats-degrades.spec.ts` — sous **latence**, vérifier que chaque rubrique porte son squelette **à la place et à la taille** de ce qui viendra — jamais un vide qui fait sauter la mise en page
- [ ] T066 [US6] Traiter le cas d'un compte **sans aucun établissement** (l'administrateur éditeur, rattachement `null`) : un accueil qui **le dit** et ne propose que ce qui a un sens sans site — jamais un accueil vide, jamais une erreur (FR-024)

---

## Phase 9 — Finitions et transversal

- [ ] T067 Mettre `docs/points-entree.md` à jour **dans les deux sens** : les quatre « dû » que F1 nommait pour ce cycle passent à **branché** — `SESSION_VIDE`, `TYPES_IDENTIFIANT`, `ETATS_PASTILLE_ORDONNES`, `estLangue` — plus `ETATS_COMPTE`, et **tout export neuf** de ce cycle. Un export sans appelant est **dû**, avec le cycle qui l'attend
- [ ] T068 Vérifier la **parité stricte fr/en** par `tests/unite/i18n-parite.spec.ts` — aucune clé d'un côté sans son équivalent de l'autre (SC-010) —, et **étendre le test aux mots proscrits** : aucun catalogue ne contient « session », « jeton », « rôle », « permission », « synchronisation », « dégradé » (FR-011, FR-033). *Le mécanisme existe déjà pour les chaînes en dur ; il manquait la liste des mots*
- [ ] T069 Vérifier que le contrôle **(c)** de `tests/unite/regles-opposables.spec.ts` — « aucune valeur littérale hors des jetons » — couvre bien les fichiers neufs de `app/core/accueil/`, `app/core/coquille/` et `app/pages/` (SC-011), et que le mode sombre passe **uniquement** par `dark:`. Étendre au passage le contrôle **(a)** pour interdire `fetch`, `XMLHttpRequest` et `WebSocket` partout hors `app/core/plateforme/` (FR-051) — **la phase 2 n'émet aucun appel réseau**, et rien ne l'empêchait
- [ ] T070 Inscrire à `docs/design/derivation.md` **tout écran découvert à l'implémentation**, avec la mention « découvert à l'implémentation, à valider », les composants employés, et — s'il tombe en **zone de vitesse** — la mention **« à maquetter avant le pilote »**. *Le risque n'est pas d'inventer un écran, c'est de l'inventer en silence*
- [ ] T071 Vérifier que `app/core/ecrans/index.ts` reflète l'avancement réel — c'est la **source unique** : la page la rend, la porte P-04 la lit, et la mention de `R1` s'y adosse
- [ ] T072 Lancer **`scripts/verifier.sh`** — les préalables et les six portes. Vert exigé (SC-012). Le script est **inchangé** : aucune porte nouvelle, donc aucun test négatif à ajouter, et c'est la meilleure preuve que le cycle n'a rien contourné
- [ ] T073 Dérouler `quickstart.md` §2 **à la main**, dont §2.2 — *l'accueil de Yao a-t-il l'air conçu pour un maquis, ou d'un hôtel amputé ?* Le contrôle mécanique prouve l'absence des mots, **jamais le jugement d'usage**
- [ ] T074 Écrire `specs/004-entree-accueil/rapport-de-cycle.md` — **ce que les portes ne couvrent pas** : le jugement d'usage sur le maquis, d'où viendra le poste (F4), l'alignement de `R4` et `R7` (F3), le régime mobile (F4), et l'absence d'essai sur appareil réel
- [ ] T075 **Revue de la Definition of Done** (`docs/user-stories-v1.md` §0.4), point par point. Les points **2, 3, 4, 5, 6, 10, 13** se déclarent **« sans objet »** — phases 1 et 3 —, **jamais cochés en silence**. Les points **1, 7, 8, 9, 11, 12, 14** sont dus et vérifiés

---

## Dépendances

```
Phase 1 (T001–T004)  ─── versions
        ↓
Phase 2 (T005–T015)  ─── jeu · composant 05 corrigé · session · index · en-tête extrait
        ↓
        ├─→ Phase 3 · US1 (T016–T026)   R0        ── P0 produit
        │        ↓
        └─→ Phase 4 · US2 (T027–T043)   R1  🎯MVP ── P0 produit
                 ↓
             Phase 5 · US3 (T044–T052)   ETB-06    ── P1 produit
                 ↓
        ┌────────┴────────┐
   Phase 6 · US4     Phase 7 · US5
   (T053–T058)       (T059–T061)
        └────────┬────────┘
                 ↓
             Phase 8 · US6 (T062–T066)
                 ↓
             Phase 9 (T067–T075)
```

**Ce qui est vraiment bloquant** :

- **T008 avant T033** — la tuile d'action porte un état « désactivé (rôle) » qui viole deux règles ;
  l'employer avant de l'avoir retiré propagerait la faute au premier écran RBAC du produit.
- **T012 avant T034** — la portée `tous` est une structure de session ; sans elle, `R1` ne livre que
  trois variantes sur quatre.
- **T014 avant T035** — sans `useEcranCible`, une surface écrirait sa mention à la main, et il
  faudrait la retoucher onze fois.
- **T005 et T006 avant tout `R1`** — sans le maquis, la quatrième variante n'a rien à afficher.
- **T025 et T042 déclenchent P-04** — dès qu'un écran est `CONSTRUIT`, la porte l'exige aux quatre
  passages. Les inscrire avant que l'écran ne tienne rend la porte rouge, et c'est voulu.

---

## Exécution en parallèle

**Phase 2** — T005, T006, T010, T011 : quatre fichiers distincts, aucune dépendance croisée.

**Phase 4** — T030, T031, T032, T033 : les quatre familles de surface sont indépendantes ; T027 et
T029 le sont aussi.

**Phase 8** — **aucun parallélisme** : T062 crée `tests/navigateur/etats-degrades.spec.ts`, T063 à
T065 l'étendent. Même fichier, donc à la file.

**Jamais en parallèle** : T015 *(déplacement de l'en-tête)* et toute tâche qui le touche · T034 et
T042 *(même fichier d'index que T025)* · T067 et T071 *(deux registres qui se répondent)*.

---

## Stratégie de livraison

| Incrément | Phases | Ce qu'on peut montrer |
|---|---|---|
| **MVP** | 1 → 4 | On se connecte, on voit son accueil, **quatre variantes**. C'est ce qui se démontre |
| **Cœur complet** | + 5 | La bascule en deux taps, le poste, la persistance — `ETB-06` tenue |
| **Grammaire close** | + 6, 7 | Ce que F3 reprendra tel quel, et l'instrument qui le prouve |
| **Fini** | + 8, 9 | Les états dégradés, les registres à jour, la DoD passée en revue |

**Le MVP s'arrête au point de contrôle de la phase 4**, et il est démontrable seul : `R0` et `R1`
suffisent à raconter le produit. Tout ce qui suit rend le cycle **complet**, pas montrable.
