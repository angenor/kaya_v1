---

description: "Tâches d'implémentation — cycle F3, le cœur métier de la réception"
---

# Tâches : Le cœur métier de la réception (cycle F3)

**Entrée** : les documents de conception de `/specs/005-reception-passage-note-planning/`
**Prérequis** : [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Phase du projet** : **2** — l'application entière en données simulées. Les règles de **phase 1** (SQL, RLS, registre des classes) et de **phase 3** (migrations, utoipa, suppression des simulations) sont **sans objet** ici et se déclarent comme telles, jamais cochées en silence — voir la note de fin.

**Tests** : demandés. Trois objectifs du cahier des charges sont des **assertions**, pas des souhaits, et le cycle étend deux portes.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable — fichiers différents, aucune dépendance sur une tâche incomplète
- **[US*]** : le récit de [spec.md](./spec.md) que la tâche sert
- Chaque tâche porte son **chemin de fichier exact** et son **critère de fin**

---

## Ce qui a été lu à la source, et ne se recopie pas

| Fait | Valeur relevée | Où elle a été lue |
|---|---|---|
| Décompte des écrans du produit | **46** = 11 maquettés · 32 dérivés · 3 composés | `docs/design/derivation.md`, « Les 46 écrans du produit » |
| Écrans **maquettés** de ce cycle | `R4` · `R7` · `V1` | idem, ligne « Codes maquettés » |
| Écrans **dérivés** de ce cycle | `R2` *(hérite de `R1` + composant 14)* · `R3` *(de `R4`)* · `R5` et `R6` *(de `R7`)* | idem, tableau des dérivés |
| Écrans **composés** de ce cycle | **aucun** | idem — les trois composés sont `G5`, `/notes`, `/articles`, tous du cycle F7 |
| Écrans affectés à **F3** | `R2` `R3` `R4` `R5` `R6` `R7` `V1` — **sept** | `app/core/ecrans/index.ts`, colonne `cycle` |
| Composants canoniques | **16**, sections numérotées | `docs/design/composants.md` |
| Fichiers d'état à honorer | `R4` : 5 · `R7` : 3 **+ 1 inventé** · `V1` : 2 | `docs/design/html/` |

> ⚠️ **`R4` et `V1` ne se composent pas, et c'est écrit.** `derivation.md` : *« Il est en zone de vitesse et ne se compose jamais… `R4` porte une intention dessinée qu'un assemblage ne retrouverait pas — les tailles de la durée et de l'heure de fin, la place du prix sur le bouton. »* Leurs blocs de décision sont **propres à l'écran** ; ils empruntent des composants canoniques **autour**, jamais **à la place**.

---

## ✅ Aucun composant ne manque à la bibliothèque — le cycle ne s'arrête pas

*C'est le seul cas où il faudrait s'arrêter et vous le signaler. Vérification faite, besoin par besoin.*

| Besoin de ce cycle | Ce qui le sert |
|---|---|
| Boutons de durée, numéro de chambre annoncé, heure de fin (`R4`) | **Propres à l'écran** — maquette, pas assemblage (`derivation.md`) |
| Grille des chambres (`R4`) | **04** pastille d'état, dans un bloc propre à l'écran |
| Fenêtre d'annulation de 8 s | **14** bandeau d'annulation — *« toute action destructrice s'exécute immédiatement et laisse 8 secondes »*, `h-11` depuis la correction du cycle F1 |
| « Tout est pris » | **11** état vide illustré |
| Document à lignes (`R7`) | **Assemblage de trois pièces**, `app/core/document-a-lignes/` — voir [research §2](./research.md) : ce n'est pas un dix-septième composant, et le canon reste **fermé à seize** |
| Ruban horaire (`V1`) | **Propre à l'écran** — maquette |
| Semaine / jour | **12** sélecteur segmenté |
| Recherche client | **16** champ de saisie |
| Chargement du planning et de la note | **13** squelette, à la **forme exacte** du contenu |
| Refus, alerte, hors ligne | **07** bandeau d'alerte · **10** témoin de synchronisation |
| **Attente de l'envoi aux impôts** | ⚠️ **13**, état **roue** — *« réservée à une attente réseau dont on ne connaît pas la forme »* — **plus le compte à rebours chiffré** du motif **14**. Voir l'encadré ci-dessous |

> ⚠️ **Un troisième point où la maquette perd, et il ne coûte aucun composant.** `R7-note-depart-envoi.html` dessine, en plus de la roue, **une barre de progression à un tiers, sans chiffre**. Le composant **15** — barre de proportion — porte la règle contraire : *« elle porte **toujours** son chiffre à côté d'elle : une barre seule ne se lit pas »*, et ce qu'elle montre est **une part**, pas une attente. Une barre remplie au tiers pendant une attente dont **personne ne connaît la durée** affiche une progression inventée. **Elle est écartée** : l'attente se rend par la **roue** (13) et le **compte à rebours chiffré** (14), tous deux canoniques. *À inscrire à `derivation.md` avec les deux autres points, dans le changement qui livre `R7`.*

---

## ⚠️ Trois termes entrent au lexique, et je vous les signale

*Aucun n'est écrit en dur en attendant. Ils s'ajoutent à `docs/design/lexique.md` **dans le changement qui livre l'écran**, avec leur formulation en fr **et** en en.*

| Terme | Formulation proposée | Ce qu'on refuse, et pourquoi |
|---|---|---|
| Garder une chambre qui va se libérer | « **Garder la chambre** » / *Hold the room* · état : « **Tenue jusqu'à 16 h 25** » / *Held until 4:25 p.m.* | ⛔ **« Réserver »** — le mot promet un engagement que **quinze minutes** ne portent pas, et il collerait à `RSV`, qui est un autre produit (cycle F7) |
| Titre et route de `V1` | « **Le planning** » / *The schedule* — route `/planning` | ⛔ « Calendrier », qui suggère des journées ; **c'est justement ce que cet écran n'est pas** |
| Route de `R2` | route **`/jour`** — le titre reste « **Vue du jour** » / *Day view* | ⛔ « Tableau de bord », qui promet des chiffres de direction. ⚠️ **« Le jour » a été proposé puis écarté à l'analyse de cohérence du 2026-08-08** : `docs/design/derivation.md` **et** `app/core/ecrans/index.ts` portent déjà « Vue du jour », et l'index précise que son titre est *« en clair pour le produit »* — ce n'est donc pas un nom interne. Renommer aurait touché deux documents opposables pour gagner deux mots, et laissé trois documents à deux noms le temps de l'oubli |

---

## Sur l'ordre — deux axes de priorité, et lequel commande

L'instruction demande **« ordonnées par dépendance »** et **« les tâches P1 en fin de liste »**. Deux échelles portent le même nom, et les confondre inverserait l'ordre :

- **P0 / P1 des stories** (`docs/user-stories-v1.md`) — c'est **celle que l'instruction vise**. Dans ce cycle, une seule source est **P1** : **HEB-06, le statut d'unité**. Elle est en **phase 11**, après tout le cœur P0.
- **P1 / P2 / P3 des récits** (`spec.md`, convention Spec Kit) — c'est l'ordre de valeur **à l'intérieur** du cycle. Les cinq récits P1 forment le cœur ; les récits **P3** (la recherche client) sont en fin.

**La dépendance l'emporte sur les deux** quand elles se rencontrent : `R2` **Vue du jour** est un dérivé sans priorité propre, mais il porte **le point d'entrée du passage**. Sans lui, le parcours des trois taps n'a pas de premier tap, et **aucun budget de gestes ne se mesure**.

---

## Phase 1 · Fondations de domaine

**Objet** : les types, les calculs et le jeu — ce sans quoi aucun écran ne peut être juste.

> *Règle de phase 2 « chaque tâche livre un écran atteignable » : **elle vise les composants**, et ces sept tâches n'en produisent aucun. Ce sont des **types et des fonctions pures**, dont la preuve est un **test doré**, pas un rendu. Chacune porte son critère de fin propre, et **aucune ne peut être différée** : un écran juste posé sur un calcul faux est pire qu'un écran absent — il ment sans le dire.*

- [ ] **T001** Étendre `app/core/donnees/hebergement/types.ts` des **neuf types de mouvement** de [data-model.md §2](./data-model.md) — `Intervalle`, `Occupation`, `Sejour`, `NoteSejour`, `LigneSejour`, `Client`, `Accompagnant`, `FichePolice`, `NumerotationFichePolice`, `TaxeSejourConstat` — avec leurs énumérations exactes et le renvoi `← hebergement.{table}`. ⚠️ **Lever l'avertissement d'en-tête** *« ce cycle porte le référentiel, pas le mouvement »* : le laisser en place ferait mentir le seul avertissement que quelqu'un lira avant d'ajouter une entité. Écrire `tests/unite/conformite-modele-mouvement.spec.ts` : **champ par champ** contre `docs/modele-donnees/97-hebergement.sql`. *Fin : le test passe, et il échoue si un champ est renommé d'un seul côté.*
- [ ] **T002** [P] Étendre `app/core/donnees/contrat.ts` des **onze codes de refus** de [data-model.md §4](./data-model.md), et élargir `EchecDomaine.parametres` pour admettre `readonly string[]`. ⚠️ **`CONFLIT_OCCUPATION_SUIVANTE` porte une liste** — les chambres libres de la même catégorie — et c'est la seule : sans cet élargissement, l'alternative que le lexique exige devrait être recomposée par l'écran, donc réécrite six fois. *Fin : `pnpm typecheck` vert, et aucun code ne porte de message.*
- [ ] **T003** Écrire `app/core/reception/bareme.ts` — prix d'une durée, palier atteint, **rebascule** au dépassement, **bascule en nuitée** au seuil — et son **test doré sur jeu de cas figés**, `tests/unite/bareme-dore.spec.ts`. ⚠️ **Aucune valeur n'est écrite** : paliers, prix d'heure supplémentaire et seuil viennent du référentiel du cycle F1. Cas dorés obligatoires : 1 h, 2 h, 3 h, 4 h, 4 h 30 *(heure supplémentaire)*, 8 h 01 *(au-delà du seuil de 480 min)*. *Fin : les six cas passent, et changer un palier du jeu change le résultat sans toucher au code.*
- [ ] **T004** [P] Écrire `app/core/reception/disponibilite.ts` — chevauchement sur **`periodeIndisponibilite`**, chambres libres d'une catégorie, prochaine libération — et `tests/unite/disponibilite.spec.ts`. ⚠️ **Trois invariantes testées** : *(a)* `periodeIndisponibilite ⊇ periode`, égalité comprise ; *(b)* une occupation **`ANNULEE` ne bloque plus** ; *(c)* `[15 h, 18 h)` et `[18 h, 20 h)` **ne se chevauchent pas** — la borne haute est exclue, et c'est ce qui rend deux passages consécutifs possibles. *Fin : les trois passent.*
- [ ] **T005** [P] Écrire `app/core/reception/taxe-sejour.ts` — nuitées assujetties, montant, **règle appliquée** — et `tests/unite/taxe-sejour-dore.spec.ts`. ⚠️ **Le cas doré central** : 4 nuits × 2 personnes sous `une_nuitee_par_occupation` = **500 F**, et **le même séjour à 1 personne donne le même montant**. Deuxième cas : `au_prorata` = 500 F × 4. Troisième : **passage et demi-journée → aucune ligne**, l'appel ayant tout de même lieu. *C'est le test qui refuse la valeur de la maquette (4 000 F), et ce fichier est l'**ancêtre front du `JurisdictionAdapter`** — il sera **supprimé** en phase 3, jamais dupliqué.* *Fin : les trois cas passent.*
- [ ] **T006** Étendre `app/core/donnees/jeux/deloria.ts` des **douze jeux de cas** de [data-model.md §5](./data-model.md) — semaine calme, semaine dense, tout est pris, chevauchement, remise en état bloquante, séjour de 4 nuits à 13 lignes, séjour terminé, note arrêtée, passage dépassé, passage au-delà du seuil, client au 7ᵉ passage — et le jeu séparé de 10 000 fiches. ⚠️ **Toutes les dates sont relatives à l'horloge de la couture, jamais absolues** : *un jeu daté en dur cesse d'exercer ses cas le lendemain, et le test devient vert en ne testant plus rien.* ⚠️ **« Résidence Test » ne reçoit aucun mouvement** — c'est le contrôle du principe 2. *Fin : `tests/unite/jeu-cas.spec.ts` vérifie que chacun des douze cas est atteignable, et qu'aucune date absolue ne subsiste.*

- [ ] **T006a** Écrire la **règle ESLint « aucune horloge lue dans un composant »** — `Date.now`, `new Date()` et `performance.now` interdits sous `app/pages/` et sur tout composant de `app/core/` ; l'instant vient de **l'horloge de la couture**. ⚠️ *Le plan affirmait ce contrôle et **le cochait**, sans qu'aucune tâche ne l'écrive — trouvé par l'analyse de cohérence du 2026-08-08. Un contrôle affirmé et absent fait cocher une case, ce qui est pire que son absence.* ⚠️ **Le calcul de durée d'un passage est facturé** : une horloge de terminal qu'on règle à la main change un montant. *Fin : `pnpm lint` rougit sur un `Date.now()` introduit dans une page, et `app/core/format/instant.ts` reste autorisé.*

---

## Phase 2 · US1 + US3 — le passage, et le refus qui nomme le conflit

**Objectif** : *« enregistrer un passage en moins de 30 secondes »*, et **rendre impossible** une double attribution.
**Vérification indépendante** : ouvrir `/passage`, compter les interactions jusqu'à la confirmation ; puis tenter une chambre occupée et lire le refus.

- [ ] **T007** Étendre `app/core/donnees/hebergement/interface.ts` et `simulation.ts` des **lectures** de [contracts/interfaces-domaine-reception.md §2](./contracts/interfaces-domaine-reception.md) : `listerOccupations`, `listerUnitesDisponibles`, `listerProchainesLiberations`. ⚠️ **`listerUnitesDisponibles` prend la formule, pas seulement la période** — sans elle, elle ne peut appliquer ni la remise en état *(qui varie par catégorie **et** par formule)* ni les contraintes de durée, et rendrait des chambres « libres » que la création refuserait ensuite : **le pire refus, celui qu'on n'a pas vu venir**. *Fin : les trois lectures honorent les leviers latence et échec réseau du cycle F1, sans code propre.*
- [ ] **T008** [US1] Livrer **`R2` Le jour** — `app/pages/jour.vue`, route `/jour`. **Écran dérivé** : `derivation.md`, *« hérite de `R1` + composant 14 »* ; ouvrir `docs/design/html/R1-accueil.html` et en respecter la grammaire. Composants **05** tuile d'action · **08** ligne de liste · **06** carte chiffre · **04** pastille · **11** état vide. Il porte **le point d'entrée du passage et celui de l'arrivée**. Ajouter au lexique l'entrée « **Vue du jour** » / *Day view* et sa route `/jour` — **le titre de `derivation.md` et de l'index fait foi**. *Fin : `/jour` s'ouvre en clair **et** en sombre, avec ses états vide / chargement / erreur / hors ligne, et « Donner une chambre » y mène.*
- [ ] **T009** [US1] Livrer **`R4` Le passage**, état nominal — `app/pages/passage.vue`, route `/passage`. **Écran maquetté**, référence : `docs/design/html/R4-passage.html`. ⚠️ **Ne se compose pas** : les quatre boutons de durée, l'annonce de la chambre et l'heure de fin sont **propres à l'écran**, aux corps `--text-geste` (46 px), `--text-annonce` (68 px) et `--text-annonce-l` (88 px) de `tokens.md`, **qui prime sur l'export**. `data-zone="vitesse"` sur la racine. **Une seule racine, et c'est un élément.** Le prix, la durée et l'heure de fin de chaque bouton viennent **du barème du jeu**. ⚠️ **Aucun bouton de soumission** : le dernier geste est le tap sur la durée. ⚠️ **Trois éléments de la maquette que la description ne doit pas laisser passer** : *(a)* **une chambre libre est proposée automatiquement**, avec le motif de la proposition quand il existe ; *(b)* la **grille des chambres** ne rend touchables **que** les chambres réellement disponibles ; *(c)* le bloc **« Pièce d'identité : après la clé, pas avant »** est présent — c'est lui qui tient les 30 secondes, et l'ôter ferait basculer le parcours à ≈ 41 s (FR-003, FR-005). *Fin : `/passage` s'ouvre en clair et en sombre ; le HTML rendu ne contient **aucun montant écrit en dur** ; les trois éléments ci-dessus sont présents.*
- [ ] **T010** [US1] Écrire `enregistrerPassage` dans `simulation.ts`, selon **l'ordre en dix étapes** de [contracts/interfaces-domaine-reception.md §4](./contracts/interfaces-domaine-reception.md) : validation, calcul des **deux périodes**, **vérification du chevauchement AVANT toute écriture**, occupation, séjour, note ouverte, ligne d'hébergement, **encaissement espèces**, note arrêtée, fiche de police à compléter. ⚠️ **L'étape 3 précède toute écriture** — vérifier après aurait donné la chambre, et le refus se découvrirait avec le client dans le couloir. ⚠️ **La garde hors-ligne vit ici, pas dans le composant** (module doré, point 6). UUID **v7** sur la demande, et **déduplication** dès la simulation. *Fin : `tests/unite/passage.spec.ts` — les cinq effets sont produits ; trois envois de la même demande n'en produisent qu'un ; **et N fiches de police émises portent les numéros 1..N sans trou** — le compteur est un **verrou de ligne, jamais une séquence**, parce qu'**un trou est une fiche dont personne ne sait si elle a existé**.*
- [ ] **T011** [US1] Livrer l'état **enregistré** de `R4` — référence `docs/design/html/R4-passage-enregistre.html`. Numéro de chambre et heure de fin **les deux plus grands éléments de la page** ; « encaissé en espèces » ; la chambre passe à « Donnée » **dans la grille, sans rechargement**. Composant **14** en **surimpression, jamais en flux**, **8 s**, `h-11`. ⚠️ **L'annulation défait les cinq effets** — occupation, séjour, note, encaissement, fiche —, jamais un seul. *Fin : l'écran s'ouvre dans les deux thèmes ; annuler dans les 8 s rend la chambre libre au planning.*
- [ ] **T012** [US3] Livrer les **refus de disponibilité** dans `R4` et dans la couture — les six cas de FR-021 : chambre déjà prise · occupation suivante · chambre cible occupée · demi-journée fractionnée · intervalle invalide · durée hors contrainte. Chaque refus **nomme la période qui bloque** ; `CONFLIT_OCCUPATION_SUIVANTE` **liste les chambres libres de la même catégorie**. Rendu par le composant **07**, **jamais deux bandeaux empilés**. Clés i18n **fr et en**, branchées sur le **code**, jamais sur un message. ⚠️ **Un message générique est un défaut** : *c'est la différence entre un refus qu'Adjoua peut expliquer au client et un refus qu'elle contournera.* ⚠️ **Le refus se décide AU MOMENT DU TAP, jamais au moment de l'affichage.** La grille montre l'état d'il y a quelques secondes ; entre les deux, un autre poste a pu donner la chambre. *Cas limite de la spécification, simulé par un jeu où l'occupation apparaît entre le rendu et le tap.* *Fin : les six refus s'affichent avec leurs paramètres ; une chambre devenue occupée après le rendu est refusée au tap ; le HTML rendu ne contient ni « conflit », ni « chevauchement », ni « occupation », ni « intervalle ».*
- [ ] **T013** [US1] Livrer l'état **tout est pris** de `R4` — référence `docs/design/html/R4-passage-complet.html`. Composant **11**, motif de contreforts ocre, **ce qui se libère et quand**, et **« Garder la chambre »**. Écrire `garderChambre` : une **occupation de motif `RESERVATION`**, **15 min**, **relâchée automatiquement**, **soumise au même refus de chevauchement**. Ajouter au lexique « **Garder la chambre** » et « **Tenue jusqu'à {heure}** », ⛔ jamais « réserver ». ⚠️ **La durée vient du catalogue, jamais du composant** : `heb.duree_garde_comptoir_minutes`, **inscrite au « Récapitulatif des paramètres d'établissement »** le 2026-08-08 — *un délai décidé dans un composant serait devenu une constante que personne ne rouvre*. ⚠️ **Ce n'est pas un état vide** : la maison est pleine, ce n'est pas une panne. *Fin : l'écran s'ouvre avec le jeu « complet », la garde apparaît au planning et disparaît seule.*
- [ ] **T014** [US1] Inscrire `R2` et `R4` à `app/core/ecrans/index.ts` — **`CONSTRUIT`**, avec leur route — et passer leurs lignes de `docs/design/derivation.md` à « **codé** ». ⚠️ **Dans ce changement, jamais avant** : *y inscrire « codé » sur un écran qui n'existe pas ferait mentir le seul document qui dise ce qui a le droit d'être codé.* Cela fait **disparaître les mentions « à venir · cycle F3 »** de l'accueil **sans que `R1` soit retouché**. *Fin : `scripts/verifier.sh --porte p04` est VERT sur 9 écrans construits.*

---

## Phase 3 · US2 — le client reconnu, et le parcours long

**Objectif** : *« moins de 60 secondes pour un client connu »*, sans une seule ressaisie.

- [ ] **T015** [US2] Écrire `rechercherClients` dans la couture — par **nom, téléphone ou numéro de pièce**, ⚠️ **en lisant DEUX domaines** : `hebergement.client` **et** `comptes.personne`, où vivent le nom, les prénoms et la pièce. *Aucune donnée d'identité n'est dupliquée : la purge de rétention n'a ainsi qu'une cible.* Seuils de déclenchement : **3 caractères** pour un nom, **4 chiffres** pour un numéro — paramètres, jamais des constantes. ⚠️ **Une personne non qualifiée cliente ne remonte jamais** : chercher « Kouamé » à la réception ne doit pas montrer la femme de ménage. *Fin : `tests/unite/recherche-client.spec.ts` couvre les trois critères et l'exclusion.*
- [ ] **T016** [US2] Livrer l'état **client reconnu** de `R4` — référence `docs/design/html/R4-passage-connu.html`. Reconnaissance **sans geste de validation** ; l'écran dit **ce qui est déjà connu et ne sera pas redemandé** — la pièce et sa date de capture — et **propose la chambre habituelle avec le motif**. « **Ce n'est pas lui** » défait la reconnaissance **en un tap**. *Fin : l'écran s'ouvre dans les deux thèmes ; le parcours tient en **5 taps et 10 frappes**.*
- [ ] **T017** [US2] Livrer **`R3` Arrivée** — `app/pages/arrivee.vue`, route `/arrivee`. **Écran dérivé** : `derivation.md`, *« parcours long : plus de champs, même grammaire »* ; ouvrir `R4-passage.html` et la respecter. ⚠️ **Même zone de vitesse, et le dernier geste reste le tap sur la chambre — aucun bouton de soumission.** Composant **16** pour les champs, **04**, **07**, **11**. Client connu → **pré-remplissage intégral**. **Accompagnants ajoutés par un nom seul** *(exiger une pièce par accompagnant coûterait la cible des 60 s)*, chacun portant **son propre** numéro de pièce, ⚠️ **jamais une fiche client créée pour l'occasion**. Écrire `enregistrerArrivee` — **classe B, n'encaisse rien** : le règlement est au départ. Inscrire `R3` à l'index et à `derivation.md`. *Fin : `/arrivee` s'ouvre dans les deux thèmes avec ses quatre états ; le parcours client connu tient en **7 taps et 10 frappes**.*

---

## Phase 4 · US6 — le planning à granularité horaire

**Objectif** : ce qui distingue ce planning de tout planning hôtelier existant.

- [ ] **T018** Écrire `app/core/planning/ruban.ts` — fonction **pure** : occupations → positions et largeurs. Algorithme lu dans le commentaire de fin de `docs/design/html/V1-planning.html` : largeur **par heure** selon l'occupation *(nuit morte, heure creuse, heure occupée, heures intérieures d'une nuit)*, × 0,13 pour les jours éloignés, puis **normalisation**. ⚠️ **Aucune bibliothèque** — famille tranchée et inscrite au §3.4 de `docs/versions-reference.md` : *toutes supposent un axe linéaire, sous lequel un passage de 3 h fait 19 px sur 1 040*. *Fin : `tests/unite/ruban.spec.ts` — un passage de 3 h reste au-dessus du seuil de lisibilité sur une semaine dense, et les positions sont **calculées**, jamais écrites.*
- [ ] **T019** [US6] Livrer **`V1` Le planning**, semaine calme — `app/pages/planning.vue`, route `/planning`. **Écran maquetté**, référence : `docs/design/html/V1-planning.html`. Ruban horizontal, une ligne par chambre, **hachures de remise en état** entre deux occupations, **trait de *maintenant*** venant de l'horloge de la couture. Composants **12** semaine/jour · **03** · **01** *(« Donner une chambre »)* · **11** · **13**. Ajouter au lexique « **Le planning** » / *The schedule*. *Fin : `/planning` s'ouvre dans les deux thèmes ; un passage de 3 h et une nuitée du même jour sont **tous deux lisibles**.*
- [ ] **T020** [US6] Livrer l'état **semaine dense** — référence `docs/design/html/V1-planning-dense.html`, **34 occupations**, passages et demi-journées mêlés. ⚠️ **Même largeur que la semaine calme**, et **toute barre passée sous le seuil de lisibilité est signalée** plutôt que rendue muette. ⚠️ **Les quatre familles — nuitée, passage, demi-journée, remise en état — se distinguent par la FORME autant que par la couleur** : le mode sombre ne doit rien perdre. *Fin : les deux états s'ouvrent dans les deux thèmes ; le contrôle de forme passe en sombre.*
- [ ] **T021** [US6] Rendre le planning **navigable** : toucher une barre ouvre le séjour ou la note **sans écran intermédiaire** ; le planning est **consultable hors ligne** avec **sa fraîcheur affichée** *(lecture, donc classe A)*. *Fin : hors ligne, `/planning` reste lisible et affiche sa fraîcheur.*
- [ ] **T022** [US6] Inscrire `V1` à l'index et à `derivation.md`. *Fin : `--porte p04` VERT sur 11 écrans construits.*

---

## Phase 5 · US4 — la note, et le motif dont six écrans héritent

**Objectif** : *« le total provisoire visible instantanément »* — un des cinq problèmes explicites du cahier des charges.

- [ ] **T023** Écrire les **trois pièces** de `app/core/document-a-lignes/` — `LigneDocument.vue`, `SousTotalSection.vue`, `PiedTotal.vue` — selon [contracts/document-a-lignes.md](./contracts/document-a-lignes.md). ⚠️ **Elles ne calculent rien et ne formatent aucun montant** : `app/core/format/montant.ts` reste la seule fonction qui écrit un montant. ⚠️ **`PiedTotal` est une pièce SÉPARÉE** — c'est ce qui permettra à `R5` de la rejeter sans réécriture. ⚠️ **Ce n'est pas un dix-septième composant** : le canon reste fermé à seize. *Fin : les trois sont importées par `R7` à la tâche suivante — **aucune ne reste sans écran qui l'affiche**.*
- [ ] **T024** [US4] Écrire `lireNote` dans la couture, et **le recalcul du total** : ⚠️ **recalculé depuis les lignes, jamais incrémenté** — *un cache incrémenté dérive en silence, et personne ne compare*. Le total est un **cache de lecture** ; **l'opposable est le document fiscal certifié**. *Fin : `tests/unite/note.spec.ts` — ajouter une ligne change le total, et le total égale toujours la somme des lignes.*
- [ ] **T025** [US4] Livrer **`R7` La note**, état nominal — `app/pages/depart.vue`, route `/depart`. **Écran maquetté**, référence : `docs/design/html/R7-note-depart.html`. Lignes **groupées par service** avec **leur sous-total**, bloc de taxes, **total dans un pied épinglé qui ne défile jamais**, mention « **Document non fiscal — ne tient pas lieu de facture** ». ⚠️ **Le total est présent au PREMIER rendu** : il n'existe **aucun** état où les lignes sont visibles et le total absent, et **aucun bouton « calculer » n'existe**. ⚠️ **Les sections non servies se rendent en creux, nommées** — jamais supprimées. *Fin : `/depart` s'ouvre dans les deux thèmes avec ses quatre états ; le total reste visible en faisant défiler 13 lignes.*
- [ ] **T025a** [US4] Brancher les **deux gestes d'impression** que portent les maquettes — « **Imprimer le reçu** » sur `R4-passage-enregistre.html`, « **Imprimer la note** » sur `R7-note-depart.html` — **à travers le `PlatformAdapter`**, avec l'annonce d'alternative déjà livrée au cycle F1 quand la capacité est absente : *« cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception »*. ⚠️ **Aucun composant n'appelle une API d'impression directement** — la règle ESLint du cycle F1 le refuse déjà. ⚠️ **Ce cycle branche le geste, il ne dessine pas le ticket** : le gabarit thermique (80 mm, ~42 caractères, sans couleur) est du cycle **F6**. *Trouvé par l'analyse de cohérence : les deux boutons étaient dans les maquettes et dans aucune tâche — ils auraient été livrés morts, ou branchés sur `window.print()` depuis un composant.* *Fin : les deux boutons appellent l'adaptateur ; capacité absente, l'alternative s'affiche au lieu d'un échec.*
- [ ] **T026** [US4] Livrer le **bloc des taxes** — TVA, **taxe de séjour**, taxe de développement touristique, chacune **une ligne distincte** de type `TAXE`, avec **son assiette en clair**. ⚠️ **500 F pour 4 nuits et 2 personnes**, et le total de cette note vaut **282 860 F**. *La maquette affiche 4 000 F et « par personne et par nuit » : elle est **antérieure à la clôture de la décision B-10**, et le test doit refuser sa valeur.* Elle reste la référence pour **le dessin** de la ligne, **pas pour le montant**. *Fin : `SC-015a` passe ; le montant vient de `taxe-sejour.ts`, jamais du balisage.*
- [ ] **T027** [US4] Écrire le **refus d'ajout sur une note arrêtée** — `NOTE_ARRETEE`, phrase exacte du lexique. ⚠️ **C'est l'ancêtre du cas orphelin** : ce cycle ne construit pas l'écran de réconciliation (F6), mais la couture **refuse déjà**, et c'est le minimum qui empêche de mentir au branchement. *Fin : `tests/unite/note.spec.ts` couvre le refus.*
- [ ] **T028** [US4] Livrer **`R6` Note temps réel** — `app/pages/note.vue`, route **`/note/:sejour`**. **Écran dérivé** : `derivation.md`, *« hérite de `R7`, sans l'action finale »*. ⚠️ **`/notes` est déjà pris** par « Notes internes » (cycle F7) : le pluriel désigne les notes **internes** de l'établissement, le singulier **la note d'un séjour** — deux objets sans rapport que le lexique distingue déjà. *Fin : `/note/:sejour` s'ouvre dans les deux thèmes, **sans le bouton de départ**.*
- [ ] **T029** [US4] Inscrire `R6` et `R7` à l'index et à `derivation.md`, ⚠️ **avec les trois points où la maquette perd** : le bandeau hors-ligne de `R4`, la ligne de taxe de `R7`, et **la barre de progression de l'envoi, écartée au profit de la roue et du compte à rebours chiffré**. *Fin : `--porte p04` VERT sur 13 écrans construits.*

---

## Phase 6 · US5 — le départ, et les trois issues devant le client debout

**Objectif** : que le produit tienne au moment où il peut se casser.

- [ ] **T030** [US5] Écrire `enregistrerDepart` — compte final, **taxe figée à cet instant** dans un **constat immuable** *(la simulation **refuse** l'écriture sur un constat existant, elle ne l'ignore pas)*, encaissement **espèces**, note **arrêtée**, chambre libérée. ⚠️ **Trois faits distincts, jamais fondus** : la note est arrêtée · le règlement est encaissé · le document est parti. *Fin : `tests/unite/depart.spec.ts` — les quatre effets, et le constat porte **nuitées assujetties**, **nombre de personnes indicatif** et **règle appliquée**.*
- [ ] **T031** [US5] Livrer l'écran de **départ** — référence `docs/design/html/R7-note-depart-envoi.html`. Le compte final s'affiche **avant tout encaissement**, et l'écran le dit. Pendant l'attente : **combien de temps cela prend** et **ce qui est déjà acquis**, avec ses trois coches. ⚠️ **Composant 13, état roue** *(attente indéterminée)* **+ compte à rebours chiffré** — **la barre de progression de la maquette est écartée** : une barre remplie au tiers pendant une attente dont personne ne connaît la durée affiche une progression inventée, et le composant **15** exige un chiffre qu'elle n'a pas. *Fin : l'écran s'ouvre dans les deux thèmes ; « Laisser partir le client » est possible sans attendre.*
- [ ] **T032** [US5] Écrire `envoyerDocumentFiscal` et ses **trois issues** — `CERTIFIEE`, `ECHEC`, `INDETERMINEE` — **pilotées depuis `/_scenarios`**, avec un réglage de **butée à 10 s**. ⚠️ **Aucune méthode « réessayer » n'existe dans l'interface, et l'absence est le contrat** : *un second envoi créerait une seconde facture réelle chez l'administration, et elle ne s'annule pas côté client.* Ajouter **au même endroit le levier « conflit de disponibilité »** exigé par FR-069 — il fait apparaître une occupation concurrente entre le rendu et le tap, et c'est lui qui exerce le cas limite des deux réceptionnistes (T012). *Fin : les trois issues **et** le levier de conflit sont atteignables depuis le panneau, sans recompilation.*
- [ ] **T033** [US5] Livrer l'issue **succès** : le numéro officiel revient, **la mention « document non fiscal » disparaît**. *Fin : constaté dans les deux thèmes.*
- [ ] **T034** [US5] Livrer l'issue **échec** — référence `docs/design/html/R7-note-depart-echec.html`. **Le motif en clair**, le détail technique **en second plan**, et **deux issues praticables** : corriger et renvoyer, ou **émettre sans numéro de contribuable**. ⚠️ **`motif_cle` prime sur le code** — *elle enseigne là où le code constate*. *Fin : l'écran s'ouvre dans les deux thèmes ; le HTML ne contient ni « certification », ni « FNE », ni « rejeu », ni « file d'attente ».*
- [ ] **T035** [US5] Livrer l'issue **indéterminée** — ⚠️ **écran inventé à l'implémentation**, la maquette n'a que trois états. Phrase du lexique : « **Nous ne savons pas si les impôts ont reçu cette facture** ». **Aucun renvoi automatique, aucun bouton « réessayer »**. Le rapprochement manuel est **nommé sans être ouvert** — il est du cycle F6. Il n'emploie **que** des composants, jetons et termes existants. ⚠️ **Zone de charme** — l'utilisateur lit, il ne court pas : **pas de mention « à maquetter avant le pilote »**. Inscrit à `derivation.md` **dans ce changement**, mention « découvert à l'implémentation, à valider », avec la liste des composants employés *(07, 13, 02, document à lignes)*. *Fin : l'écran s'ouvre dans les deux thèmes, et `derivation.md` porte sa ligne.*
- [ ] **T036** [US5] Vérifier, dans les **trois** issues, que « **la note est arrêtée** » et l'état du règlement sont **deux phrases distinctes**. ⚠️ *Sans cette séparation, l'écran laisse croire au paiement, et le trou se découvre au comptage de caisse sans qu'on sache à quel séjour il se rattache.* *Fin : `tests/unite/depart-phrases.spec.ts` cherche les deux phrases dans le HTML rendu des trois états.*

---

## Phase 6 bis · SEJ-04 — prolonger, changer de chambre, partir plus tôt

> ⚠️ **Ces trois tâches réparent un trou trouvé par l'analyse de cohérence du 2026-08-08.** `SEJ-04` est **P0**, et sa seconde moitié n'apparaissait que dans les cas limites de la spécification — **aucune exigence, aucune tâche**, alors que le contrat déclarait déjà `prolongerSejour` et `changerUnite`. *Un contrat qui promet ce que les tâches ne construisent pas se découvre au branchement de la phase 3, quand le client généré porte une méthode que rien n'appelle.* Exigences ajoutées : **FR-041a → FR-041d**, critère **SC-020**.

- [ ] **T036a** [US5] Livrer la **prolongation** sur `R6` — écrire `prolongerSejour` : la disponibilité est vérifiée **sur l'intervalle étendu**, et le conflit avec l'occupation suivante est signalé par `CONFLIT_OCCUPATION_SUIVANTE`, **avec son heure et les chambres libres de la même catégorie**. Un séjour terminé n'est pas prolongeable : `SEJOUR_CLOS`, dont la phrase **dit la règle, pas l'état** — *« On ne prolonge pas un séjour terminé »*, ce qui évite qu'Adjoua cherche comment « rouvrir » le séjour. **Classe B** : le geste disparaît hors ligne. *Fin : le geste est atteignable depuis `/note/:sejour` en clair et en sombre ; les deux refus s'affichent avec leurs paramètres ; hors ligne, le geste est **absent du HTML**.*
- [ ] **T036b** [US5] Livrer le **changement de chambre** sur `R6` — écrire `changerUnite` : ⚠️ **deux intervalles, et l'historique conservé** — jamais une occupation modifiée en place, *sinon le séjour ne sait plus dire où le client a dormi la première nuit*. Le refus est `UNITE_CIBLE_OCCUPEE`, **distinct** de `UNITE_DEJA_OCCUPEE` : celui-ci porte sur **ce qui reste du séjour**, celui-là sur une période demandée. **Classe B.** *Fin : après un changement, le planning montre **deux barres** sur le même séjour ; le refus distinct s'affiche ; hors ligne, le geste est absent.*
- [ ] **T036c** [US5] Livrer le **départ anticipé** — recalcul du compte et **régularisation tracée** : la ligne d'origine **reste visible**, comme au rebascule de palier. ⚠️ **La taxe se fige sur les nuitées réellement dues**, pas sur celles qui étaient prévues. **Classe B.** *Fin : le jeu « départ anticipé » produit la ligne de régularisation, visible à `/depart`, et le constat de taxe porte le bon nombre de nuitées.*

---

## Phase 7 · US8 — le dépassement de durée

- [ ] **T037** [US8] Livrer la **rebascule de palier** : la durée réelle vient de **l'horodatage d'autorité** ; la note porte **une ligne distincte avec son motif en clair** — « Durée dépassée : passé au tarif 4 h » — et **l'ancienne ligne reste visible**. *Fin : le jeu « passage dépassé » produit la ligne, visible à `/depart`.*
- [ ] **T038** [US8] Livrer la **bascule en nuitée** : au-delà du seuil de l'établissement (**480 min**, lu au catalogue), l'écran **annonce le changement AVANT de l'appliquer**, avec **le montant résultant**, et **attend une confirmation** — `BASCULE_FORMULE_NON_CONFIRMEE`. ⚠️ **La phrase est à valider à l'atelier terrain** : trop sèche, elle ressemble à un refus ; trop douce, elle passe inaperçue. *Fin : le jeu « au-delà du seuil » déclenche l'annonce, et rien n'est appliqué sans confirmation.*
- [ ] **T039** [US8] Livrer la **dérive d'horloge** : au-delà de **300 s** en **valeur absolue**, la phrase du sens correspondant — retard **ou** avance — **suivie de** « Les durées et les montants restent calculés sur l'heure du serveur. » ⚠️ **La seconde phrase est obligatoire** : sans elle, l'exploitant croira ses passages mal facturés. *Fin : les deux sens sont exercés depuis `/_scenarios`.*

---

## Phase 8 · US7 — hors ligne, vérifié de bout en bout

**Objectif** : *« le check-in est de classe B et le restera »* — l'écran l'annonce **avant** la tentative.

- [ ] **T040** [US7] Vérifier que **toute opération de classe B** — donner une chambre, garder une chambre, arrêter une note, faire partir un client, **prolonger, changer de chambre, faire partir plus tôt** *(phase 6 bis — d'où la dépendance)* — est **ABSENTE du HTML rendu** hors ligne, avec la phrase exacte du lexique « **Cette action nécessite internet.** » et **ce qu'on peut faire à la place**. ⚠️ **La garde vit dans la fonction d'appel, pas dans le composant** ; ⚠️ **le test porte sur le HTML rendu, jamais sur `disabled`**. ⚠️ **Le bandeau de `R4-passage-hors-ligne.html` dit le contraire et il a tort** — arbitrage A de la spécification, note déjà posée à `derivation.md`. *Fin : `tests/unite/hors-ligne-reception.spec.ts` + P-04 ; aucune action de classe B n'est trouvable dans le HTML hors ligne.*
- [ ] **T041** [US7] Vérifier la **séparation des classes** : la **fiche client** est de **classe C** et son refus **n'est pas confondu** avec celui d'une classe B ; **accompagnant**, **statut ménage** et **note interne** sont de **classe A** et **entrent dans la file**. ⚠️ **Deux classes sur une même entité** — la fiche est C, ses préférences sont A : la couture les sépare **par opération**, jamais par table. *Fin : le levier hors ligne accepte les trois écritures A et refuse la C, avec deux messages distincts.*
- [ ] **T042** [US7] Vérifier que **les lectures restent disponibles** hors ligne — planning, note, fiche client — **avec leur fraîcheur affichée**, et que **les lettres de classe n'atteignent jamais l'écran**. *Fin : hors ligne, les trois écrans restent lisibles ; le HTML ne contient pas le mot « classe » suivi d'une lettre.*

---

## Phase 9 · US9 — la fiche client et sa recherche *(récit P3)*

- [ ] **T043** [US9] Livrer **`R5` Fiche client et recherche** — `app/pages/clients.vue`, route `/clients`. **Écran dérivé** : `derivation.md`, *« liste + fiche, **pas de total** »* ; ouvrir `R7-note-depart.html` et en respecter la grammaire. Composants **08** · **16** · **11** · **13**. ⚠️ **`PiedTotal` volontairement absent** : *additionner les séjours d'un client afficherait un chiffre qui **ressemble à un solde**, et l'exploitant y chercherait ce que le client doit.* *Fin : `/clients` s'ouvre dans les deux thèmes avec ses quatre états, et **aucun montant cumulé** n'y figure.*
- [ ] **T044** [US9] Livrer l'**historique des séjours** depuis la fiche, et la **recherche sans geste de validation** sur le jeu de **10 000 fiches**. ⚠️ **Le seuil est chiffré, pas apprécié** : `SEJ-01` exige **moins de 300 ms sur 10 000 fiches** (SC-019). *« Sans attente perceptible » est un adjectif ; 300 ms est un test.* *Fin : `tests/unite/recherche-volumetrie.spec.ts` mesure sous 300 ms sur le jeu de 10 000, et la femme de ménage ne remonte pas sur « Kouamé ».*
- [ ] **T045** [US9] Inscrire `R5` à l'index et à `derivation.md`. *Fin : `--porte p04` VERT sur **14 écrans construits** — les sept du cycle sont livrés.*

---

## Phase 10 · Les portes, et le compte des gestes

- [ ] **T046** Écrire `tests/navigateur/gestes.ts` — le **compteur d'interactions** de [contracts/parcours-et-gestes.md §3](./contracts/parcours-et-gestes.md), et `app/core/reception/gestes.ts`, **le barème geste → seconde, en un seul endroit**. ⚠️ **Ce fichier n'est pas du produit** : il est lu par les tests et le rapport de cycle, jamais par un écran. *Fin : le compteur enveloppe la page Playwright et rend taps et frappes.*
- [ ] **T047** Ajouter la **règle ESLint** qui interdit `page.click` et `page.fill` **hors du compteur**, portée `tests/navigateur/`. ⚠️ *Sans elle, le budget se contournerait par distraction, et le test resterait vert en ne testant plus rien.* *Fin : `pnpm lint` rougit sur un appel direct.*
- [ ] **T048** Écrire `tests/navigateur/reception.spec.ts` — **les huit parcours** de [contracts/parcours-et-gestes.md §2](./contracts/parcours-et-gestes.md), sur **deux moteurs** et **deux thèmes**. Les budgets assertés sont **les taps et les frappes**, pas les secondes. ⚠️ **P5 est asserté différemment** : ce n'est pas un budget de gestes mais une **absence d'état intermédiaire** — le total est lu **au premier rendu utile**, avant tout clic, et aucun bouton portant une action de calcul n'existe. *Fin : les huit parcours passent sur les quatre suites.*
- [ ] **T049** Écrire le **test négatif de l'extension de P-04** : dans une **copie de travail**, ajouter un bouton « Confirmer » entre la durée et l'enregistrement. La porte **doit rougir en nommant P1 et son budget** ; sinon, sortie en **code 4 — porte aveugle**. Empreinte du dépôt relevée avant et après. *Fin : `scripts/verifier.sh --test-negatif p04` est VERT.*
- [ ] **T050** Inscrire les **~100 entrées nouvelles** à `docs/points-entree.md`, chacune « **branché** » ou « **dû** », avec sa valeur d'exercice — *unité* pour les calculs purs, *navigateur* pour les écrans. **Relever les trois planchers de P-06** : les cibles ont doublé, et un plancher figé cesserait de prouver la non-vacuité. *Fin : `--porte p06` VERT, planchers atteints des trois côtés.*

---

## Phase 11 · Ce qui est P1, et la finition

*Les tâches de source **P1** au sens `docs/user-stories-v1.md` sont ici, après tout le cœur P0.*

- [ ] **T051** [P] **HEB-06, P1** — le **statut ménage** : « à nettoyer / propre / maintenance », librement modifiable, **classe A**, dernier-écrit-gagne autorisé, modifiable depuis la grille de `R4` et depuis `/planning`. ⚠️ **Le statut d'OCCUPATION reste dérivé** et n'est jamais posé à la main : *les confondre produit des doubles attributions.* *Fin : le changement de statut fonctionne **hors ligne** et entre dans la file.*
- [ ] **T052** [P] Vérifier la **parité stricte fr/en** des clés ajoutées — les onze refus compris — et l'**absence de toute chaîne en dur**. *Fin : le test de parité et `@intlify/vue-i18n/no-raw-text` passent.*
- [ ] **T053** [P] Vérifier qu'**aucun montant, aucune durée, aucune plage, aucun seuil et aucun taux** n'est écrit dans un composant : le HTML rendu ne contient **aucun montant absent du jeu**. **Et vérifier globalement les onze mots proscrits de SC-009** — « conflit », « chevauchement », « occupation », « intervalle », « palier », « check-in », « check-out », « certification », « FNE », « rejeu », « classe B » — **sur les sept écrans ET dans les deux catalogues i18n**. ⚠️ *Les tâches d'écran ne les vérifiaient que localement — quatre mots sur `R4`, le vocabulaire fiscal sur `R7` : un mot introduit sur un cinquième écran serait passé.* *Fin : `tests/unite/aucune-valeur-en-dur.spec.ts` et `tests/unite/mots-proscrits.spec.ts` passent sur les sept écrans et les deux langues.*
- [ ] **T053a** Dérouler **[quickstart.md](./quickstart.md) à la main**, sections A à I, sur les **deux thèmes** — et consigner **ce que les portes ne voient pas** : la lisibilité d'une barre de 3 h sur un écran délavé, la fluidité perçue d'un tap, le temps réel d'un parcours fait par une main humaine. ⚠️ *Le cycle F1 avait cette tâche, et c'est elle qui a trouvé ce qu'aucun test ne trouve. SC-017 l'exige, et aucune tâche ne la portait.* *Fin : les neuf sections sont cochées, et les constats entrent au rapport de cycle (T054).*
- [ ] **T054** Écrire `specs/005-reception-passage-note-planning/rapport-de-cycle.md` — **ce qu'aucune porte ne voit** : la lisibilité d'une barre de 3 h sur un écran délavé par le soleil, la fluidité perçue d'un tap, **le compte réel des huit parcours**, et **la durée de la commande unique** *(219 s au dernier passage, avant les 28 passages ajoutés)*. ⚠️ **Consigner le dépassement du repère, jamais raccourcir une suite pour tenir un chiffre.** *Fin : le rapport existe et porte les quatre points.*
- [ ] **T055** **Revue de la Definition of Done** (`docs/user-stories-v1.md` §0.4), point par point, **les sans-objet déclarés comme tels et jamais cochés en silence** :

| # | Point | Attendu pour ce cycle |
|---|---|---|
| 1 | Critères couverts par des tests | ✅ dû |
| 2, 3, 6, 13 | utoipa · migration sqlx · outbox · simulations supprimées | **sans objet — phase 3** |
| 4, 11 | RLS et test d'isolation · `{schema}.sql` à jour | **sans objet — aucune table créée**, le miroir est déjà exact |
| 5 | Classe hors-ligne déclarée | ✅ **rien à écrire** : les neuf entités sont au registre depuis D2. *Le vérifier était le travail ; ne rien écrire est le résultat* |
| 7 | Clés fr et en, aucune chaîne en dur | ✅ dû — T052 |
| 8 | Écran vérifié **en navigateur réel**, clair et sombre, **Chromium et WebKit** | ✅ dû — P-04, sept écrans |
| 9 | Paramètres exposés à la configuration | ⚠️ **partiellement sans objet** : l'écran de configuration est du cycle **F7**. Les paramètres consommés ici sont **lus** au référentiel, jamais réécrits |
| 10 | Documents imprimés au gabarit | **sans objet — cycle F6 (IMP)** |
| 12 | Jeu simulé à la forme du modèle | ✅ dû — T001 |
| 14 | `scripts/verifier.sh` passe **en une commande**, et toute porte ajoutée a **son test négatif** | ✅ dû — T049 |

*Fin : la revue est écrite au rapport de cycle, et **`scripts/verifier.sh` est TOUT VERT**.*

---

## Dépendances

```text
Phase 1 (T001→T006)  ── fondations, bloquantes pour tout
        │
        ├─► Phase 2 (T007→T014)  US1 + US3 · R2, R4        ◄── LE MVP
        │        │
        │        ├─► Phase 3 (T015→T017)  US2 · R4 connu, R3
        │        └─► Phase 4 (T018→T022)  US6 · V1          [P] avec la phase 3
        │
        ├─► Phase 5 (T023→T029)  US4 · document à lignes, impression, R7, R6
        │        └─► Phase 6 (T030→T036)     US5 · les trois issues
        │                 └─► Phase 6 bis (T036a→c)  SEJ-04 · prolonger, changer, partir plus tôt
        │
        ├─► Phase 7 (T037→T039)  US8 · dépassement     [P] après la phase 5
        ├─► Phase 8 (T040→T042)  US7 · hors ligne      [P] après la phase 6 bis
        └─► Phase 9 (T043→T045)  US9 · R5              [P] après la phase 5

Phase 10 (T046→T050)  ── exige que les sept écrans existent
Phase 11 (T051→T055)  ── finition, P1 différé, revue
```

⚠️ **La phase 8 dépend de la phase 6 bis, pas de la phase 6** : les trois gestes de SEJ-04 sont de **classe B**, et T040 vérifie qu'**aucune** opération de classe B n'est atteignable hors ligne. La lancer avant laisserait trois gestes hors du balayage.

**Parallélisation** : les phases **3 et 4** sont indépendantes ; les phases **7 et 9** le sont aussi une fois la phase 5 close. À l'intérieur des phases, les tâches marquées **[P]** touchent des fichiers différents.

**MVP** : **phases 1 et 2** — `R2` et `R4`, le passage en trois taps et le refus qui nomme le conflit. C'est déjà démontrable au comptoir, et c'est le geste dont dépend l'adoption du produit.
