---

description: "Tâches d'implémentation — cycle F1, la coquille de l'application"
---

# Tâches : La coquille de l'application (cycle F1 — Fondations)

**Entrée** : les documents de conception de `/specs/003-coquille-application/`
**Prérequis** : [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Phase du projet** : **2** — l'application entière en données simulées. Les règles de phase 1 (SQL, RLS, registre des classes) et de phase 3 (migrations, utoipa, suppression des simulations) sont **sans objet** ici et se déclarent comme telles, jamais cochées en silence.

**Tests** : demandés. Le cycle crée trois portes, et **une porte sans test négatif est une décoration** (constitution, principe 13).

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable — fichiers différents, aucune dépendance sur une tâche incomplète
- **[US*]** : le récit de [spec.md](./spec.md) que la tâche sert
- Chaque tâche porte son **chemin de fichier exact**

---

## Ce qui a été lu à la source, et ne se recopie pas

| Fait | Valeur relevée | Où elle a été lue |
|---|---|---|
| Décompte des écrans du produit | **46** = 11 maquettés · 32 dérivés · 3 composés | `docs/design/derivation.md`, « Les 46 écrans du produit » |
| Codes maquettés | `C4` `F2` `G2` `M4` `P2` `Q1` `R1` `R4` `R7` `S2` `V1` | idem |
| Codes dérivés | `R0` `R2` `R3` `R5` `R6` `P1` `P3` `P4` `C1` `C2` `C3` `F1` `F3` `F4` `G1` `G3` `G4` `A1` `S1` `S3` `M1` `M2` `M3` `M5` `V2` `Q2` `E1` `E2` `E3` `E4` `E5` | idem, 32 lignes comptées |
| Composés | `G5` · **Notes internes (`/notes`)** · **Les articles (`/articles`)** | idem, tableau « Les écrans composés » |
| Composants canoniques | **16**, sections numérotées | `docs/design/composants.md` |

> ⚠️ **Deux des trois écrans composés n'ont PAS de code** — « Notes internes » et « Les articles » sont nommés par leur route. L'index (T048) porte donc **le code quand il existe, la route sinon** : une colonne « code » obligatoire pour tous serait fausse dès la première ligne.

## ✅ Aucun composant ne manque à la bibliothèque

*C'est le seul cas où le cycle devrait s'arrêter et vous le signaler. Vérification faite, composant par composant, pour les trois instruments :*

| Besoin | Composant qui le sert |
|---|---|
| Bascule booléenne des quatre leviers | **12** · sélecteur segmenté, variante deux options — *« deux à quatre options courtes, toutes visibles »* |
| Choix du compte et de l'établissement | **16** · champ de saisie, état **« choix fermé »** |
| Choix de la classe d'écriture (A/B/C/D) | **12** · quatre options |
| Réglage de la latence | **16** · champ de saisie |
| État d'avancement d'un écran à l'index | **04** · pastille d'état |
| Sommaire du guide de style | **08** · ligne de liste |

**Aucun motif d'interaction nouveau n'est requis.** Le cycle ne s'arrête pas.

## Sur l'ordre — pourquoi les tâches P1 ne sont pas toutes en fin de liste

L'instruction du cycle demande deux choses qui se rencontrent ici : **« ordonnées par dépendance »** et **« les tâches P1 en fin de liste »**. La première l'emporte, et voici pourquoi :

- **TRX-08 (design system, P1)** est la seule source P1 de ce cycle qui produise du code, et **c'est le prérequis de tout écran**. La différer rendrait toute tâche d'interface inexécutable — *une tâche qui produit un composant sans écran qui l'affiche n'est pas terminée*, et l'inverse est vrai aussi.
- Les sources **P0** — PWA-01, PWA-02, SYN-01/02, CPT-02/03, ETB-02 — sont livrées **après** le design system pour la même raison de dépendance.
- **Ce qui EST repoussé en fin de liste** : les deux récits **P3** de la spécification — l'index complet (US11) et les points d'entrée (US12) —, plus la porte **P-04**, qui ne peut pas s'écrire avant qu'il y ait des écrans à atteindre.

---

## Phase 1 : Mise en place

**Objet** : le projet existe, ses versions sont épinglées, et **la porte des dépendances mord dès le premier manifeste**.

*Règle de phase 2 « chaque tâche livre un écran atteignable » : **sans objet** pour cette phase — il n'y a pas encore d'application. Chaque tâche porte son propre critère de fin.*

- [X] T001 Créer le projet Nuxt 4 en SPA (`ssr: false`) à la racine du dépôt : `nuxt.config.ts`, `app/app.vue` minimal, `package.json`, `.nvmrc` (`24.18.1`), `tsconfig`. **Chaque dépendance porte, en commentaire au-dessus de sa ligne, son rôle, l'URL du registre interrogé, la date et pourquoi ce qui est déjà là ne suffit pas** (`docs/versions-reference.md` §1, règle 4). Les six ajouts et leurs versions sont dans [research.md §1](./research.md). **Versions exactes, aucun `^` ni `~`**, `pnpm-lock.yaml` **commité**. *Fin : `pnpm install --frozen-lockfile` puis `pnpm build` passent.*
- [X] T002 Étendre `scripts/verifier.sh` de la porte **P-03**, selon [contracts/verifier-p03.md](./contracts/verifier-p03.md) : cinq contrôles, périmètre déclaré, plancher **dérivé du nombre de dépendances** (jamais une constante). **Ajouter un sixième contrôle : `.github/workflows/` est ABSENT** — *le serveur d'intégration vient en phase 3, et rien d'autre dans le dépôt ne le vérifie* (FR-073, SC-019). Le contrôle est un répertoire du dépôt : coût nul, et il refuse le workflow que personne n'a encore écrit. *Fin : `scripts/verifier.sh --porte p03` est VERT.*
- [X] T003 Écrire le **test négatif de P-03** dans `scripts/verifier.sh` : dans une **copie de travail**, `@nuxtjs/i18n` passe de `10.6.0` à `^10.6.0`. La porte **doit rougir en nommant le paquet et la valeur** ; sinon, sortie en **code 4 — porte aveugle**. Empreinte du dépôt relevée avant et après. *Fin : `scripts/verifier.sh --test-negatif p03` est VERT.*
- [X] T004 Copier `docs/design/theme.css` **TEL QUEL** dans `app/assets/css/theme.css` — **seul fichier de `docs/design/` qui se copie** (constitution, principe 12) — et brancher `@tailwindcss/vite` dans `nuxt.config.ts`. Écrire dans `tests/unite/theme-copie-conforme.spec.ts` **deux** tests : (1) l'**empreinte des deux fichiers** coïncide — toute divergence fait échouer ; (2) **la SYMÉTRIE des jetons** — tout nom déclaré dans le bloc clair l'est aussi sous `.dark`, et réciproquement. ⚠️ **Le premier prouve l'égalité à la source, pas la symétrie** : un jeton défini en clair et oublié en sombre rend un composant illisible sur la moitié du parc **sans lever aucune erreur** (FR-008). *Fin : les deux tests passent, et `@theme static` est intact dans le CSS compilé.*
- [X] T005 [P] Embarquer **localement** les polices et les glyphes : `@fontsource-variable/archivo`, `@fontsource-variable/chivo-mono`, et `@phosphor-icons/web` **sous-réglé** par `subset-font`, dans `app/assets/css/polices.css`. **Aucun chargement depuis un service distant** — l'ouverture hors ligne l'impose, et une police absente le jour de la démonstration serait irrattrapable. *Fin : aucune requête sortante au chargement, constatée dans l'inspecteur réseau.*
- [X] T006 [P] Configurer l'outillage de test : `vitest.config.ts` (+ `happy-dom`, `@vue/test-utils`, `@vitest/coverage-v8` avec **rapport JSON par fonction**), `playwright.config.ts` (**projets `chromium` ET `webkit`**), `knip.json`. *Fin : les trois commandes s'exécutent sur une suite vide sans erreur de configuration.*
- [X] T007 [P] Configurer ESLint dans `eslint.config.ts` avec les **quatre règles opposables** : (a) aucune API de plateforme hors `app/core/plateforme/` et `app/core/file/` ; (b) aucun composant n'importe de `**/simulation.ts` ni de `donnees/jeux/**` ; (c) aucune valeur littérale de couleur, espacement, rayon, durée ou courbe hors des jetons ; (d) **une page a une seule racine, et c'est un élément — jamais un `v-if`/`v-else` de premier niveau**. ⚠️ **L'identifiant exact de la règle (d) se vérifie contre le greffon installé, jamais cité de mémoire** ([research.md §5](./research.md)). *Fin : chaque règle est prouvée par un fichier fautif volontaire qui la fait échouer.*

**Point de contrôle** : le projet se construit, ses versions sont épinglées, et **P-03 mord**. L'écart consigné au rapport du cycle D1 — un `latest` invisible dans `compose.yml` — **est refermé**.

---

## Phase 2 : Fondations (prérequis bloquants)

**Objet** : le cycle de vie que **toute page nouvelle hérite sans rien écrire et ne peut pas oublier**, et la coquille PWA posée **tôt** — c'est la propriété la plus difficile à rétrofitter.

**⚠️ Aucun récit ne peut démarrer avant la fin de cette phase.**

- [X] T008 Écrire `app/layouts/defaut.vue` : **racine stable**, **un seul `<main>`**, barre d'en-tête portant les emplacements du sélecteur d'établissement (09), du témoin (10), du thème et de la langue. **Référence visuelle : cas (a) — la barre d'en-tête de `docs/design/html/R1-accueil-compose.html`.** *Fin : la racine ne se démonte pas à la navigation.*
- [X] T009 Poser le **thème avant le premier pixel** : un script en ligne dans le `<head>` de `nuxt.config.ts` applique la classe depuis le choix persistant, à défaut depuis la préférence système. Puis `app/plugins/theme.client.ts`, qui **assure la suite et n'applique rien** — *un greffon arrive toujours trop tard*. *Fin : au démarrage en thème sombre, aucune image capturée avant la première interaction ne présente le fond clair.*
- [X] T010 Câbler `@nuxtjs/i18n` : **fr par défaut**, en second, catalogues `app/core/i18n/fr.ts` et `en.ts` créés et **à parité dès leur première clé**. *Fin : la bascule de langue fonctionne sur le libellé de la barre d'en-tête.*
- [X] T011 Écrire `app/middleware/session.global.ts` — reprend la session **à chaque navigation, la première comprise** — et `app/core/session/useSession.ts`, adossé à `idb`. **Aucun écran de connexion** : le compte actif se choisira au panneau Scénarios (US7). *Fin : un journal prouve que le middleware s'exécute à la première navigation comme aux suivantes.*
- [X] T012 Poser la coquille PWA avec `vite-plugin-pwa` dans `nuxt.config.ts` : **manifeste** (nom, icônes 192/512/maskable dans `public/`, couleur de thème, orientation, affichage autonome) et **service worker à précache de la coquille**. ⚠️ **Rien de métier dans le service worker, aucune logique dans le manifeste** — la coquille est mince et remplaçable, Capacitor prendra le relais. *Fin : le manifeste est valide et le service worker s'enregistre. La vérification hors ligne appartient à US1.*
- [X] T013 Créer la **première route atteignable** : `app/pages/ecrans.vue` en squelette, route déclarée par `definePageMeta({ path: '/_ecrans' })`, et `app/pages/index.vue` qui y redirige. ⚠️ **Le nom de fichier ne porte pas le trait bas** — la route est déclarée explicitement, ce qui la rend indépendante de la sémantique du scanner ([research.md §4.2](./research.md)). **Référence visuelle : cas (c) — composé, motif de liste posé par `G5`.** *Fin : `/` et `/_ecrans` s'ouvrent en navigateur, **en clair et en sombre**.*

**Point de contrôle** : l'application démarre et **un écran s'ouvre dans les deux thèmes**.

---

## Phase 3 : US3 — Une page nouvelle ne peut pas oublier le cycle de vie (P1)

**But** : la phase 2 a **posé** le gabarit, le middleware et le thème. Cette phase **prouve qu'une page nouvelle en hérite sans rien écrire, et qu'elle ne peut pas l'oublier** — c'est le livrable dont les six cycles suivants héritent sans y penser, et une propriété qui se prouve, pas qui se déclare.

**Vérification indépendante** : ajouter une page nulle et constater ce qu'elle porte, sans avoir écrit une ligne de plus.

- [X] T014 [US3] Écrire `tests/navigateur/cycle-de-vie.spec.ts` : monter une **page témoin vide** — déclarée dans une configuration de test, jamais dans le produit — et vérifier, **par le routeur et non par un montage de composant**, qu'elle est rendue dans le gabarit par défaut, qu'il y a **un seul `<main>`** dans le document, que **le middleware a repris la session avant le rendu** et que **la classe de thème est déjà posée**. Vérifier aussi qu'une navigation entre deux pages **ne démonte pas la racine du gabarit** — le témoin et le sélecteur ne clignotent pas. *Fin : le test passe sur Chromium et sur WebKit, dans les deux thèmes.*
- [X] T015 [US3] Prouver le **refus** de la règle (d) configurée en T007 : écrire dans `tests/unite/racine-unique.spec.ts` un cas qui soumet au lint une page dont le premier niveau de gabarit est un `v-if`/`v-else` et **exige que le lint échoue en nommant la page**. ⚠️ **Une règle configurée et jamais éprouvée est une règle qu'on croit active** — c'est le même raisonnement qu'un test négatif de porte. *Fin : la page fautive fait échouer le lint ; la même page corrigée le fait passer.*

**Point de contrôle** : **toute page nouvelle hérite du gabarit, du middleware et du thème sans rien écrire, et ne peut pas l'oublier.**

---

## Phase 4 : US2 — Le guide de style et les seize composants (P1) 🎯 MVP

**But** : la page qu'on ouvre pour voir si le design system tient. **Elle est aussi ce qui « branche » les composants** — le guide de style les importe **explicitement**, un par un, ce qui rend l'analyse de P-06 fiable sans heuristique ([contracts/verifier-p06.md §3.1](./contracts/verifier-p06.md)).

**Vérification indépendante** : ouvrir `/_guide-de-style`, compter seize sections, basculer le thème, comparer à `docs/design/styleguide.html` sur les valeurs de `docs/design/tokens.md`.

**Référence visuelle, pour les quatre tâches** : **cas (c) — écran composé**, assemblé uniquement à partir des seize composants, **zone de charme**. Rendu de référence : `docs/design/styleguide.html`. ⚠️ **Ce fichier se lit, il ne se copie pas** : il est autonome, non sémantique, sans i18n, sans mode sombre câblé, sans RBAC.

- [X] T016 [US2] Créer `app/pages/guide-de-style.vue` (route `/_guide-de-style` par `definePageMeta`) avec son sommaire (composant **08**) et sa bascule de thème (composant **12**), puis écrire les composants **01 bouton principal**, **02 bouton secondaire**, **03 bouton discret** et **04 pastille d'état** dans `app/core/design-system/`, **chacun dans tous les états que `docs/design/composants.md` lui prête**. *Fin : l'écran s'ouvre, les quatre sections s'affichent en clair et en sombre.*
- [X] T017 [US2] Ajouter au guide de style les composants **05 tuile d'action**, **06 carte chiffre**, **07 bandeau d'alerte** et **08 ligne de liste** dans `app/core/design-system/`. ⚠️ **06 et 08 portent des montants** : ils consomment `app/core/format/montant.ts` (US5, T022) — d'ici là, une valeur de démonstration figée, remplacée dans la même tâche que T022. *Fin : les huit premières sections s'affichent dans les deux thèmes.*
- [X] T018 [US2] Ajouter les composants **09 sélecteur d'établissement**, **10 témoin de synchronisation**, **11 état vide illustré** et **12 sélecteur segmenté**, et **brancher 09 et 10 dans le gabarit par défaut** — *« présents partout »* (`docs/Kaya_Design.md` §13). ⚠️ **Le témoin n'affiche encore aucun décompte réel** : son alimentation est US10. Ses libellés sont **déjà ceux du lexique** — « Enregistré », « En attente d'envoi (n) », « Connexion faible », « Hors connexion » —, **jamais « connecté », « dégradé » ni « hors ligne »**. *Fin : douze sections, et la barre d'en-tête porte 09 et 10 sur toutes les pages.*
- [X] T019 [US2] Ajouter les composants **13 squelette de chargement**, **14 bandeau d'annulation**, **15 barre de proportion** et **16 champ de saisie**, puis **mettre à jour `docs/design/composants.md` dans le même changement** pour acter l'entrée du composant 15 au canon — le fichier le déclarait « hors série, à valider », et le rendre dans tous ses états tranche la décision. *Fin : **seize** sections, décompte égal à celui des sections numérotées de `composants.md`.*
- [X] T020 [US2] Écrire `tests/navigateur/guide-de-style.spec.ts` : pour chaque composant, lire le **style calculé** dans le navigateur réel — fond, hauteur, rayon, corps — et le comparer à `docs/design/tokens.md`. ⚠️ **C'est le contrôle qui attrape l'utilitaire venu du CDN** : un utilitaire absent du build rend une valeur par défaut du navigateur, qui ne coïncide avec aucun jeton. Vérifier aussi **44 px** de zone de touche minimum et **AA / AAA** de contraste. ⚠️ **Et vérifier la FORME, pas seulement la couleur** : rendre chaque composant porteur d'état **en niveaux de gris** et constater que l'état reste lisible — losange, rond, carré, triangle, cercle vide, roue, selon le vocabulaire fixe de `composants.md` §04. *Sur un 1366 × 768 en plein soleil, une bordure rouge seule ne se voit pas — et pas du tout pour un daltonien.* *Fin : le test passe sur Chromium et sur WebKit, dans les deux thèmes.*
- [X] T021 [US2] Appliquer `docs/design/mouvement.md` au guide de style et le **prouver en navigateur**, dans `tests/navigateur/mouvement.spec.ts` : les **quatre durées** et les **quatre courbes** viennent des jetons ; le **réglage d'intensité par zone** (`data-zone="vitesse"` → ×0,45, décalage nul, élastique interdite) est posé **sur le conteneur d'écran, jamais sur un composant** ; **six éléments animés simultanément au maximum** ; **`transform` et `opacity` uniquement**. ⚠️ **Le point qui compte le plus est la préférence système « réduire les animations »** : tout devient instantané, **rien ne casse, rien ne manque**, et **seul le retour tactile du bouton garde ses 90 ms** — c'est le seul mouvement jamais réduit, parce qu'il ne raconte rien : il confirme que le doigt a été vu. *Fin : le test passe sur les deux moteurs, avec et sans la préférence de réduction.*

**Point de contrôle** : les seize composants existent, sont visibles, **leurs valeurs sont prouvées égales à celles de la maquette**, et le mouvement respecte la préférence de réduction. ⚠️ **FR-023 reste due** : les montants du guide de style portent encore des valeurs figées jusqu'à T022.

---

## Phase 5 : US5 — Les catalogues fr et en, sans une chaîne en dur (P1)

**But** : aucune chaîne visible en dur, deux catalogues à parité stricte, le lexique qui prime.

**Vérification indépendante** : basculer la langue sur le guide de style et sur l'index — tout passe en anglais, aucune clé brute.

- [X] T022 [US5] Écrire `app/core/format/montant.ts` — **la seule fonction du dépôt qui écrit un montant**, avec l'**espace fine insécable U+202F** entre les milliers et avant le F, et `whitespace-nowrap` sur tout élément porteur. Remplacer les valeurs figées de T017. *Fin : `12 500 F` est rendu avec U+202F, prouvé par un test sur le point de code.*
- [X] T023 [US5] Remplir `app/core/i18n/fr.ts` et `en.ts` pour toutes les chaînes des écrans existants, en reprenant **les formulations de `docs/design/lexique.md` là où elles existent** — le lexique **prime** sur le catalogue, et un écart se corrige dans le catalogue. *Fin : le guide de style et l'index sont intégralement traduits.*
- [X] T024 [US5] Ajouter à `docs/design/lexique.md`, **dans le même changement**, les **cinq entrées** que ce cycle rend visibles et qui n'y figurent pas : le **thème** et ses valeurs (clair, sombre, comme l'appareil), la **langue**, l'**installation de l'application** — **avec son cas WebKit** —, et le **rechargement pour une nouvelle version**. ⚠️ **Les noms des trois instruments N'Y ENTRENT PAS** : *le lexique protège l'utilisateur du jargon, il n'est pas le registre des noms d'outils.* *Fin : cinq entrées ajoutées, aucun nom d'instrument.*
- [X] T025 [US5] Activer `@intlify/vue-i18n/no-raw-text` dans `eslint.config.ts` et écrire `tests/unite/i18n-parite.spec.ts` qui compare les deux catalogues **dans les deux sens** — aucune clé orpheline d'un côté ni de l'autre. Ajouter au même test la vérification **SC-022** : les mots « connecté », « dégradé » et « hors ligne » apparaissent **zéro fois** dans les deux catalogues. ⚠️ Si le greffon signale des pairs non satisfaits (`yaml-eslint-parser`, `jsonc-eslint-parser`), **les ajouter avec leur version vérifiée sur le registre**, jamais de mémoire. *Fin : une chaîne en dur ajoutée volontairement fait échouer le lint en nommant le fichier et la ligne.*

**Point de contrôle** : aucune chaîne visible n'échappe aux catalogues, et les deux langues sont à parité.

---

## Phase 6 : US4 — Les données simulées, à la forme du modèle (P1)

**But** : le jeu de Deloria, aux **mêmes noms de champs, mêmes types, mêmes valeurs d'énumération** que `docs/modele-donnees/`. C'est ce qui rendra le branchement de la phase 3 mécanique.

**Vérification indépendante** : le test de conformité confronte chaque type au `.sql` correspondant, champ par champ.

**Référence** : [data-model.md](./data-model.md) et [contracts/interfaces-domaine.md](./contracts/interfaces-domaine.md).

- [X] T026 [US4] Écrire `app/core/donnees/contrat.ts` — le **patron** qu'un domaine nouveau recopie : `ResultatDomaine<T>`, `EchecDomaine` avec **code stable et jamais de message**, `PorteeLecture`, `ClasseHorsLigne` — et `app/core/donnees/fournisseur.ts`, **le seul endroit du dépôt qui sait qu'une implémentation est simulée**. *Fin : le patron est documenté et compile.*
- [X] T027 [P] [US4] Écrire le domaine `etablissements` (`interface.ts`, `types.ts`, `simulation.ts`) et le domaine `comptes`, plus `app/core/donnees/jeux/deloria.ts` et `residence-test.ts` pour leur part : **2 tenants, 2 établissements, 5 modules, les points de vente, 5 personnes, 5 comptes aux rôles cumulés**. ⚠️ **`empreinte_mot_de_passe` n'est PAS repris** — aucun secret dans le paquet servi au navigateur. ⚠️ **`listerModulesActifs` ne rend pas les modules inactifs avec un drapeau : elle ne les rend pas.** *Fin : les décomptes sont prouvés par test.*
- [X] T028 [P] [US4] Écrire le domaine `hebergement` et sa part du jeu Deloria : **17 unités en 5 catégories** aux codes `A1–A3`, `B1–B5`, `C1–C4`, `D1–D2`, `E1–E3`, plus la salle de réunion `SR1` ; les **formules** (nuitée, passage, demi-journée, mensuel), le **barème de passage à paliers** (60→1 500, 120→2 800, 180→4 000, 240→5 000, +60→1 200 en heure supplémentaire), les **plages de demi-journée** (8h–12h, 13h–16h), les **temps de remise en état** (30 min, 2 h, 1 h). ⚠️ **`prix_base` porte le tarif HORS taxe de séjour** — 12 000, 15 000, 17 000, 20 000, 25 000 — et non le tarif affiché : les 500 F sont une **ligne distincte**, sinon la taxe serait comptée deux fois au premier cycle qui calcule ([data-model.md §4.3](./data-model.md)). Plus **Résidence Test** : 4 unités, une catégorie. *Fin : les décomptes et les valeurs sont prouvés par test.*
- [X] T029 [P] [US4] Écrire le domaine `ventes` et sa part du jeu : **au moins 30 articles** répartis sur les points de vente Bar, Restaurant et Pressing, avec leurs catégories. ⚠️ **`taux_tva` est un `NUMERIC`** : il s'écrit en **chaîne décimale**, jamais en nombre à virgule flottante (constitution, principe 5). *Fin : ≥ 30 articles, prouvé par test.*
- [X] T030 [US4] Écrire `tests/unite/conformite-modele.spec.ts` : pour chaque type de `app/core/donnees/`, **lire le `.sql` correspondant de `docs/modele-donnees/`** et comparer l'ensemble des champs (après transformation `snake_case → camelCase`), les valeurs d'énumération et la classe de type. Les colonnes délibérément non reprises sont **listées avec leur motif**. ⚠️ **Le test lit les fichiers SQL** : il n'y a donc pas de seconde liste à tenir, et elle ne peut pas diverger. *Fin : zéro écart.*

**Point de contrôle** : le jeu simulé a la forme exacte du modèle, et un branchement futur est mécanique.

---

## Phase 7 : US7 — Basculer l'application dans un état dégradé, depuis l'interface (P2)

**But** : les cinq leviers, actionnables depuis n'importe quel écran, **sans recompiler**, et **persistants**.

**Vérification indépendante** : actionner chaque levier, constater l'effet, recharger — le réglage tient.

**Référence visuelle** : **cas (c) — écran composé**, motif de configuration posé par `G2`, **zone de charme**. Composants : **16** (latence, et « choix fermé » pour le compte et l'établissement), **12** (les leviers booléens en deux options, et la classe d'écriture en quatre), **02**, **07**, **10**.

- [X] T031 [US7] Créer `app/pages/scenarios.vue` (route `/_scenarios` par `definePageMeta`, titre « **Scénarios** ») et `app/core/scenarios/useScenarios.ts` : les cinq leviers — **latence réglable, échec réseau, mode hors ligne, jeu vide, compte actif** — plus le choix d'établissement. **Persistance dans IndexedDB via `idb`.** *Fin : l'écran s'ouvre en clair et en sombre ; chaque réglage survit à un rechargement.*
- [X] T032 [US7] Ajouter une **accroche permanente** au gabarit par défaut, qui ouvre le panneau **depuis n'importe quel écran** — sans elle, on ne bascule pas en cours de parcours. *Fin : le panneau s'ouvre depuis `/_ecrans` et depuis `/_guide-de-style`.*
- [X] T033 [US7] Appliquer les leviers **à l'intérieur de la couche de simulation**, jamais dans un composant : latence → attente avant réponse ; échec réseau → `ECHEC_RESEAU` ; hors ligne → `HORS_LIGNE` ; jeu vide → collections vides. ⚠️ **Un composant qui saurait qu'un scénario existe serait un composant à réécrire en phase 3.** *Fin : les quatre leviers produisent un effet observable sur `/_ecrans`.*
- [ ] T034 [US7] Livrer les **quatre états** sur les écrans existants : **vide** (composant 11 — motif ocre, la phrase qui dit ce qui apparaîtra, l'action qui démarre), **chargement** (composant 13, à la forme exacte du contenu ; la roue **uniquement** pour une attente indéterminée), **erreur** (composant 07 — ce qui s'est passé, pourquoi, l'action suivante ; **jamais deux bandeaux empilés**), **hors ligne**. *Fin : les quatre états s'obtiennent depuis le panneau, sur chaque écran, dans les deux thèmes.*

**Point de contrôle** : les états dégradés se regardent, au lieu de rester un paragraphe de spécification.

---

## Phase 8 : US9 — Une action interdite est absente du HTML rendu (P2)

**But** : les permissions viennent de la session ; l'action interdite **n'est pas dans le document**, jamais grisée.

**Vérification indépendante** : rendre la même page sous Adjoua puis sous Aminata et comparer les deux documents.

- [X] T035 [US9] Compléter `app/core/session/useSession.ts` : le compte actif vient du panneau Scénarios, et les permissions sont l'**union** de celles de ses rôles **sur l'établissement actif**, via `DonneesComptes.resoudrePermissions`. Brancher le **composant 09** du gabarit sur le vrai sélecteur d'établissement. *Fin : basculer Deloria → Résidence Test change le contexte en deux taps, sans rechargement.*
- [ ] T036 [US9] Écrire `app/core/session/useAutorisation.ts` et l'employer sur les surfaces existantes. ⚠️ **Une action non permise est ABSENTE du rendu** — ni grisée, ni masquée en CSS, ni `disabled`. ⚠️ **Une surface d'un service inactif est absente aussi** : sur Résidence Test, qui n'a que l'hébergement, les surfaces des autres services **disparaissent**. ⚠️ **Les mots « rôle » et « permission » n'atteignent jamais l'écran** — on montre ce qui est possible, pas la mécanique qui l'autorise. *Fin : l'écran diffère entre Adjoua et Aminata.*
- [ ] T037 [US9] Écrire `tests/unite/rbac-absence-html.spec.ts` : monter la surface sous un compte dépourvu de la permission et vérifier **sur le HTML rendu** que l'action apparaît **zéro fois**. Ajouter un test qui **échoue si un attribut de désactivation** est employé à la place d'un retrait. *Fin : les deux tests passent.*

**Point de contrôle** : le RBAC retire au lieu de griser, et le test le prouve sur le document.

---

## Phase 9 : US10 — La file accumule, affiche, et refuse (P2)

**But** : **le refus est la propriété qu'on teste, pas l'envoi.** En phase 2 la file n'expédie rien.

**Vérification indépendante** : passer hors ligne, produire une écriture de chaque classe, recharger.

- [X] T038 [US10] Écrire `app/core/file/useFile.ts` : file **persistante dans IndexedDB via `idb`**, chaque élément portant un **UUID v7 généré côté client** par `uuid.v7()` et son horodatage local. *Fin : la file survit au rechargement et à la relance, avec le même décompte.*
- [X] T039 [US10] Écrire `app/core/file/classes.ts`, qui **lit la classe depuis `docs/registre-classes-offline.md`** — jamais une valeur recopiée dans un composant —, et le **refus** : toute opération de **classe B, C ou D** hors ligne est refusée **avant la tentative**, avec la phrase du lexique « **Cette action nécessite internet.** » **suivie de ce qui reste possible**. ⚠️ **La lettre de la classe n'atteint jamais l'écran.** ⚠️ **Aucune donnée B, C ou D en cache d'écriture.** *Fin : la classe A entre dans la file, les trois autres sont refusées avec leur explication.*
- [X] T040 [US10] Ajouter au panneau Scénarios le **levier d'essai d'écriture** (composant **12**, quatre classes, plus composant **01**) — sans lui, rien dans ce cycle n'exercerait le refus, et ce cycle ne produit aucun écran métier qui pourrait le faire. *Fin : les deux chemins — acceptation et refus — s'exercent depuis l'interface.*
- [X] T041 [US10] Alimenter le **composant 10** du gabarit : trois états internes, le **décompte exact** d'éléments en attente, **jamais un pourcentage**, passage hors ligne **instantané et sans transition**. Le seuil qui sépare « connecté » de « connexion faible » est une **clé de configuration** de valeur initiale **3 000 ms** (`sync.latence_degradee_seuil_ms`), **jamais une constante**. *Fin : régler la latence à 4 000 ms affiche « Connexion faible » ; le HTML ne contient aucun des trois noms d'état internes.*

**Point de contrôle** : la file refuse ce que le serveur refusera, et le témoin dit la vérité.

---

## Phase 10 : US8 — Une capacité absente le dit, et propose l'alternative (P2)

**But** : le seul point d'articulation entre le code et la coquille. C'est lui qui rendra le passage à Capacitor mécanique.

**Vérification indépendante** : appeler chaque capacité sur les deux moteurs et lire ce que l'interface dit.

**Référence** : [contracts/platform-adapter.md](./contracts/platform-adapter.md).

- [X] T042 [US8] Écrire `app/core/plateforme/PlatformAdapter.ts` — **l'interface complète** : impression, scan, caméra et OCR, stockage sécurisé, notifications, géolocalisation, état réseau. ⚠️ **Aucune signature ne prend ni ne rend un type propre au navigateur** — pas de `File`, `Blob`, `MediaStream`, `HTMLElement` : un plugin natif sérialise du JSON. ⚠️ **`Resultat<T>` porte `alternativeCle` NON optionnel** — c'est le type, et non une convention, qui rend l'exigence impossible à oublier. **Toute méthode est asynchrone**, y compris celles que le web sert de façon synchrone. *Fin : l'interface compile et la règle ESLint (b) de T007 ne trouve aucun type interdit.*
- [X] T043 [US8] Écrire l'implémentation web dans `app/core/plateforme/web/` et le **recensement par moteur** dans `app/core/plateforme/capacites.ts` : les **12 codes de capacité**, leur disponibilité sur Chromium et WebKit, et pour chaque absence son motif et **son alternative**. Écrire la **note lisible** correspondante, et un test qui vérifie que **la note et le code disent la même chose**. ⚠️ `ATTESTATION_INTEGRITE` **n'existe sur aucun moteur web** : son alternative pointe vers une phrase qui dit qu'il n'y en a pas — c'est une limite assumée, pas un défaut. ⚠️ **Le chiffrement au repos est HORS PÉRIMÈTRE** (PWA-05, tranche T4) : ce cycle livre l'accès, pas la protection. *Fin : `absences()` rend la liste attendue sur chaque moteur.*
- [ ] T044 [US8] Afficher les absences : sur toute surface qui solliciterait une capacité manquante, l'interface **l'annonce AVANT la tentative** et propose l'alternative. Le cas de l'impression porte sa formulation écrite : « **cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception** ». Ajouter au panneau Scénarios une section qui liste les absences du moteur courant. *Fin : sur WebKit la phrase s'affiche, sur Chromium non.*

**Point de contrôle** : aucun composant n'appelle une API de plateforme, et chaque absence est un fait affiché.

---

## Phase 11 : US1 — Installée, hors ligne, sans éclair (P1)

**But** : la propriété la plus difficile à rétrofitter, **vérifiée** maintenant qu'il y a des écrans à ouvrir. *La coquille elle-même a été posée en T012, tôt et non rétrofitée.*

**Vérification indépendante** : installer, couper le réseau, rouvrir.

- [ ] T045 [US1] Régler la **stratégie de cache** : **précache de la coquille** — l'application s'ouvre hors ligne **dès le premier écran** — et **révision au rechargement**, pour qu'un correctif parte le jour même. Écrire `tests/navigateur/hors-ligne.spec.ts` : réseau coupé, l'application s'ouvre et affiche sa première page — **jamais la page d'erreur du navigateur**. *Fin : le test passe sur Chromium et sur WebKit.*
- [ ] T046 [US1] Livrer le **parcours d'installation**, étape guidée du produit et non un détail : invite sur Chromium ; sur **WebKit**, l'écran **explique le menu de partage** et dit qu'**aucune bannière ne se déclenchera**, et que **sans installation l'appareil ne recevra pas les alertes**. Libellés depuis le lexique (T024). *Fin : le parcours est constaté sur les deux moteurs.*
- [ ] T047 [US1] Livrer l'**invite de nouvelle version** : quand une version nouvelle est disponible, l'interface **propose explicitement de recharger** — ni rechargement d'office, ni silence. *Fin : simuler une révision fait apparaître l'invite.*

**Point de contrôle** : l'application installée s'ouvre hors ligne, dans le bon thème, **sans éclair clair**.

---

## Phase 12 : US11 — L'index des écrans (P3)

**But** : la page par laquelle le produit se regarde, et **le périmètre déclaré de P-04**.

**Vérification indépendante** : ouvrir `/_ecrans`, compter, suivre chaque lien construit.

- [X] T048 [US11] Écrire `app/core/ecrans/index.ts` — **la source unique** que la page rend **et que la porte lit**, pour qu'il n'y ait pas de seconde liste — puis compléter `app/pages/ecrans.vue` en **deux sections** : (a) **les 46 écrans du produit**, repris de `docs/design/derivation.md` sans les rejuger, chacun avec son **état d'avancement** ; (b) **les instruments, sans code**. ⚠️ **« Notes internes » et « Les articles » n'ont pas de code** : la colonne porte le code quand il existe, **la route sinon**. *Fin : 46 entrées produit + 3 instruments, chaque lien construit aboutit.*
- [X] T049 [US11] Inscrire à `docs/design/derivation.md`, **dans le même changement**, les **trois instruments** — Guide de style, Écrans, Scénarios —, en **zone de charme**, avec la liste des composants employés. ⚠️ **Et AMENDER la règle opposable de `derivation.md` dans le même changement, parce qu'une entrée de tableau ne suffit pas** : le **guide de style échoue à la condition 1** du test d'un écran composé — *« liste, formulaire ou fiche suivant un motif déjà posé »* — alors qu'il satisfait les trois autres et la zone. `/_ecrans` (une liste) et `/_scenarios` (un formulaire) la satisfont, lui non. **La règle gagne donc une catégorie explicite, « instrument de développement »**, définie ainsi : *assemblé uniquement à partir des seize composants, en zone de charme, consulté par le développeur et non par l'exploitant, **hors du décompte des écrans du produit**, et sans code de préfixe.* ⚠️ **Le décompte des 46 reste inchangé** et `docs/Kaya_Design.md` §3 **n'est pas amendé** — les instruments n'ont pas de code. *Motif : la condition 1 existe pour empêcher qu'un écran invente un motif ; le guide de style n'en invente aucun, il les montre. La substance est respectée, la lettre ne l'est pas — et un écart constaté ne se tranche jamais en silence.* *Fin : la règle définit la catégorie, les trois instruments y sont inscrits, et les documents sont cohérents avec l'index.*

**Point de contrôle** : ce qui existe est visible, et ce qui n'existe pas encore est annoncé.

---

## Phase 13 : US6 — La commande unique (P1)

**But** : tout ce qui doit passer, en une commande, **avec arrêt au premier contrôle rouge**. *P-03 mord depuis la phase 1 ; il reste P-04 et l'intégration.*

**Vérification indépendante** : `scripts/verifier.sh`, puis chaque test négatif.

**Référence** : [contracts/verifier-p04.md](./contracts/verifier-p04.md).

- [X] T050 [US6] Ajouter la porte **P-04** à `scripts/verifier.sh` : construire l'application, la servir localement **sans conteneur**, lire l'inventaire des routes **depuis le build** et les entrées **depuis `app/core/ecrans/index.ts`**, puis exécuter la matrice `routes construites × 2 thèmes × 2 moteurs`. **Deux sens** : toute route atteignable est à l'index ; **toute entrée marquée construite est atteignable** — une entrée « pas commencé » **n'est pas exigible**. **Plancher dérivé du routeur**, jamais une constante. *Fin : `scripts/verifier.sh --porte p04` est VERT et imprime son périmètre et son nombre de passages.*
- [ ] T051 [US6] Écrire les **deux tests négatifs de P-04**, un par sens : (A) `/_scenarios` **retirée de l'index** alors que la route est servie → rouge, **en la nommant** ; (B) `/_guide-de-style` rendue **inatteignable** alors que son entrée est marquée construite → rouge, **en la nommant**. Ajouter le **troisième constat** : une entrée « pas commencé » et inatteignable **ne doit PAS** faire rougir — sans lui, on aurait prouvé que la porte échoue, pas qu'elle échoue **au bon endroit**. *Fin : `scripts/verifier.sh --test-negatif p04` est VERT.*
- [ ] T052 [US6] Rendre le **prérequis de conteneur local à ses portes** : déplacer `exiger_prerequis` de `main()` vers `preparer_base()`, et ajouter le drapeau **`--sans-conteneur`** qui exécute lint, build, tests, P-03, P-04 et P-06, **saute et NOMME** P-01, P-02 et P-05, et imprime « **VERT SOUS RÉSERVE** », **jamais « TOUT VERT »**. Sans le drapeau et sans démon : **code 3**, comme aujourd'hui. *Fin : sur un poste démon arrêté, `--sans-conteneur` rend 0 en nommant les trois portes sautées.*
- [X] T053 [US6] Intégrer au script, **avant les portes** : le **lint**, le **build** et les **tests d'unité**. ⚠️ **Et rattacher les QUATRE suites de navigateur** — `cycle-de-vie` (T014), `guide-de-style` (T020), `mouvement` (T021) et `hors-ligne` (T045) —, en les exécutant **dans la porte P-04**, qui monte déjà l'application et pilote les deux moteurs. *Sans ce rattachement, ce sont quatre contrôles qu'on lancerait de mémoire, et le principe 13 l'interdit : **ce qui compte est dedans, ou n'existe pas.*** Vérifier que l'enchaînement **sort en échec au premier contrôle rouge** et **imprime sa durée** ; **le repère est cinq minutes**, et le franchissement des **trois** minutes se consigne au rapport de cycle (SC-017). *Fin : `scripts/verifier.sh` enchaîne tout en une commande, aucune suite ne reste hors du script.*
- [X] T054 [US6] Mettre à jour `README.md` : la **commande de démarrage**, la **commande unique**, les portes **P-03**, **P-04** et **P-06** avec ce que chacune prouve, leurs **tests négatifs**, le drapeau `--sans-conteneur` et les **codes de sortie**. *Fin : quelqu'un qui n'a jamais vu le dépôt démarre l'application et lance la vérification en lisant le README seul.*

**Point de contrôle** : une commande, et un écran inatteignable ne peut plus passer inaperçu.

---

## Phase 14 : US12 — Les points d'entrée, dans les deux sens (P3)

**But** : *une unité écrite n'est ni testée ni branchée par défaut, et il faut un contrôle pour chacune des deux propriétés.*

**Vérification indépendante** : muter le registre dans un sens, puis dans l'autre, et constater les deux échecs.

**Référence** : [contracts/verifier-p06.md](./contracts/verifier-p06.md).

- [ ] T055 [US12] Créer `docs/points-entree.md` : une ligne par **surface publique de la coquille** — méthodes de `PlatformAdapter`, méthodes des interfaces de domaine, composables exportés, composants du design system, gabarits, intergiciels, greffons —, chacune portant **« branché »** ou **« dû »** et qui l'appelle ou qui l'attend. *Fin : chaque surface publique existante y figure.*
- [ ] T056 [US12] Ajouter la porte **P-06**, propriété **« branché »** : `knip` rend les exports sans référence, confrontés au registre **dans les deux sens** — un « dû » avec appelant échoue, un « branché » sans appelant échoue, un export hors registre échoue. **Deux planchers**, des deux côtés : entrées du registre et exports examinés. ⚠️ **Vérifier que le guide de style importe les seize composants EXPLICITEMENT** — c'est ce qui rend l'analyse fiable sans heuristique d'auto-import. *Fin : `--porte p06` est VERT et imprime les deux décomptes.*
- [ ] T057 [US12] Ajouter la propriété **« testé »** : `@vitest/coverage-v8` en rapport JSON, couverture **par fonction** ; tout point d'entrée « branché » dont la fonction porte **zéro passage** fait échouer. Une entrée « dû » non couverte est **normale**. *Fin : retirer un test fait rougir la porte en nommant la fonction.*
- [ ] T058 [US12] Écrire les **deux tests négatifs de P-06**, un par sens : (A) un appelant **ajouté** à une entrée « dû » → rouge en la nommant ; (B) l'import d'un composant **retiré** du guide de style, son entrée restant « branché » → rouge en le nommant. Ajouter le **troisième constat** : un « dû » sans appelant **ne doit PAS** rougir — c'est ce qui distingue P-06 d'un contrôle « aucun code mort », qui serait rouge dès la première méthode en attente de la phase 3. ⚠️ **Le négatif B est celui qui compte le plus** : *sans lui, tout déclarer « branché » rendrait le contrôle muet.* *Fin : `--test-negatif p06` est VERT.*

**Point de contrôle** : rien d'écrit n'est ni orphelin ni non testé sans que le build le dise.

---

## Phase 15 : Finition et transversal

- [ ] T059 Dérouler [quickstart.md](./quickstart.md) **de bout en bout, à la main**, sur les deux moteurs et **sur les deux établissements** — Deloria puis **Résidence Test**, qui est le pendant en phase 2 du test d'agnosticité **ETB-02c**. Consigner tout écart. *Fin : les quatorze pas sont constatés ou l'écart est écrit.*
- [X] T060 [P] Écrire `specs/003-coquille-application/rapport-de-cycle.md` : ce qu'**aucune porte ne couvre**, les constats faits **à la main** sur les deux moteurs, et les **trois points laissés ouverts** — la décomposition HT/TVA de `prix_base` (cycle fiscal), le statut fiscal de la salle de réunion, et le résultat des pairs de paquets constatés à l'installation. **Y trancher aussi, explicitement, deux points relevés à l'analyse** : (a) `ElementFile`, `Session` et `ReglagesScenario` sont des **enveloppes de terminal**, non des entités persistées côté serveur — c'est pourquoi elles n'entrent pas au registre des classes, dont la règle *« une entité absente de ce registre est une entité non implémentable »* vise les entités du modèle ; (b) l'emplacement des **valeurs arbitraires** employées et leur justification (FR-011), dans `docs/design/README.md`, décisions. Signaler la **montée majeure** s'il y en a eu une (`docs/versions-reference.md` §1, règle 5). *Fin : le rapport dit ce que la phase 2 ne prouve pas — ni la conformité fiscale, ni la résistance aux coupures réelles, ni les performances sur le matériel visé.*
- [X] T061 [P] Vérifier que `docs/versions-reference.md` §3.2, §3.4 et §6 **coïncident avec `package.json`**, et que **P-03 est verte dans les deux sens**. Corriger toute ligne inscrite au plan qui n'aurait finalement pas été installée. *Fin : P-03 est verte, document et manifestes d'accord.*
- [X] T062 **Revue de la Definition of Done** (`docs/user-stories-v1.md` §0.4), point par point, les quatorze. **Les points de phase 1 et 3 se déclarent « sans objet », jamais cochés en silence** : (2) utoipa, (3) migration sqlx, (4) RLS, (5) classe déclarée, (6) outbox, (13) suppression des simulations. Les points dus ici sont (1) tests, (7) **i18n fr et en**, (8) **écran vérifié en clair et en sombre, en navigateur réel, sur Chromium et WebKit**, (9) paramètres en configuration, (10) aperçu au gabarit exact — **sans objet, aucun document imprimé dans ce cycle**, (11) `docs/modele-donnees/` **à jour — non touché, la phase 1 est close**, (12) **le jeu simulé a la forme du modèle**, (14) **`scripts/verifier.sh` passe en une commande, et toute porte ajoutée a son test négatif**. *Fin : les quatorze points sont statués et écrits.*

---

## Dépendances et ordre d'exécution

### Dépendances de phase

- **Phase 1 — Mise en place** : aucune dépendance. **P-03 mord dès T002.**
- **Phase 2 — Fondations** : dépend de la phase 1. **Bloque tous les récits.**
- **Phase 3 — US3 (cycle de vie)** : dépend de la phase 2, dont elle **prouve** le résultat. Courte, et placée là parce qu'une propriété non éprouvée se perd au premier écran suivant.
- **Phase 4 — US2 (guide de style)** : dépend des phases 2 et 3. **Bloque tout ce qui affiche quelque chose** — c'est pourquoi elle vient si tôt malgré son origine P1 (TRX-08).
- **Phases 5 à 10** : dépendent d'US2. Entre elles, l'ordre est celui des dépendances réelles :
  - **US5** (i18n) avant tout écran nouveau — sinon les chaînes se figent et il faut repasser.
  - **US4** (données) avant **US7** (scénarios), qui applique ses leviers dans la simulation.
  - **US7** avant **US9** (le compte actif se choisit au panneau) et avant **US10** (le levier d'essai y vit).
- **Phase 11 — US1 (PWA vérifiée)** : dépend de tout ce qui produit un écran. *La coquille elle-même est posée en **T012**, phase 2 — tôt, et non rétrofitée.*
- **Phase 12 — US11 (index)** : dépend des écrans existants.
- **Phase 13 — US6 (P-04)** : dépend de **US11** — l'index est le périmètre déclaré de la porte.
- **Phase 14 — US12 (P-06)** : dépend de tout le code écrit, et de **T016–T019** pour les imports explicites du guide de style.
- **Phase 15 — Finition** : dépend de tout.

### Ce qui peut se paralléliser

| Groupe | Tâches | Pourquoi c'est sûr |
|---|---|---|
| Outillage | **T005, T006, T007** | trois fichiers de configuration distincts |
| Domaines de données | **T027, T028, T029** | trois répertoires distincts sous `app/core/donnees/` |
| Finition | **T060, T061** | deux fichiers distincts |

**Tout le reste est séquentiel** : les tâches d'interface touchent le guide de style ou le gabarit, et deux tâches sur le même fichier ne se parallélisent pas.

---

## Stratégie de mise en œuvre

### Le plus petit incrément qui se démontre

**Phases 1 → 2 → 3 → 4.** À la fin de la phase 4, l'application démarre par une commande, s'ouvre dans les deux thèmes, une page nouvelle hérite du cycle de vie sans rien écrire, et **le guide de style montre les seize composants**. C'est déjà la moitié de ce que la démonstration d'Abengourou doit montrer, et c'est vérifiable seul.

### Livraison incrémentale

| Après | Ce qui se démontre |
|---|---|
| Phase 4 | Le design system tient — *la page que j'ouvre pour le voir* |
| Phase 6 | Les données de Deloria existent, à la forme du modèle |
| Phase 7 | **Les états dégradés se regardent** — l'un des trois critères de fin du cycle F1 |
| Phase 9 | La file refuse ce que le serveur refusera |
| Phase 11 | **Ouvrir l'application installée, hors ligne, en clair et en sombre** — le critère F1 au complet |
| Phase 13 | Un écran inatteignable ne passe plus inaperçu |

### Notes

- `[P]` = fichiers différents, aucune dépendance
- Chaque tâche d'interface **cite sa référence visuelle** parmi les quatre cas
- **Le HTML de maquette se lit, il ne se copie jamais** vers `app/` — seule exception, `theme.css` (T004)
- **Tout terme visible passe par le lexique** ; s'il n'y figure pas, il y entre **dans le même changement** (T024)
- Chaque tâche se termine par `scripts/verifier.sh` ; une tâche n'est pas terminée si le script est rouge
