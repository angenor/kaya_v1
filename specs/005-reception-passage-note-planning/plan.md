# Plan d'implémentation : Le cœur métier de la réception (cycle F3)

**Dossier** : `specs/005-reception-passage-note-planning` | **Date** : 2026-08-08 |
**Spécification** : [spec.md](./spec.md)

**Phase du produit** : **2** — l'application entière en données simulées. **Aucune migration, aucun
endpoint, aucun conteneur exigé par l'application.**

**Cycle** : F3 sur 7 · **Stories** : HEB-01→06, SEJ-01→05 *(sauf SEJ-05, sorti à la clarification)*

---

## Résumé

Ce cycle livre **les sept écrans de la réception** et **la couture du mouvement hôtelier** :
occupation, séjour, note, ligne de note, client, accompagnant, fiche de police, constat de taxe. Il
transforme trois objectifs du cahier des charges en **assertions de test** — 3 taps pour un passage,
5 taps et 10 frappes pour un client connu, un total provisoire présent au premier rendu — et il pose
deux motifs dont d'autres cycles hériteront : **le document à lignes** (six écrans) et **le ruban
élastique à granularité horaire** (le planning).

**Il n'ajoute aucune dépendance.** Il **ouvre et tranche une famille** au §3.4 de
`docs/versions-reference.md` — le planning horaire — pour l'écarter, motif à l'appui. Il **ne crée
aucune porte** : le compte des gestes entre dans **P-04**, qui paie déjà le démarrage du navigateur.

---

## Contexte technique

| | |
|---|---|
| **Langage** | TypeScript **5.9.3** — dernière 5.x, contrainte d'`openapi-typescript` (§3.2) |
| **Runtime** | Node **24.18.1** (`.nvmrc`), pnpm **11.18.0** |
| **Cadriciel** | Nuxt **4.5.1**, `ssr: false`, `srcDir: app/` — **une seule application** |
| **Style** | Tailwind **4.3.3** + `@theme` de `app/assets/css/theme.css` — copie conforme de `docs/design/theme.css` |
| **Stockage** | **Aucun** côté serveur. `idb` **8.0.3** pour la file et les scénarios, en IndexedDB |
| **Tests** | Vitest **4.1.10** *(unité, composants, tests dorés)* · Playwright **1.62.1** *(P-04, chromium + webkit)* |
| **Cible** | Navigateur — poste de comptoir 1 366 × 768 et Android 2 Go. **PWA installable** |
| **Type de projet** | Application à page unique, hors ligne d'abord |
| **Objectifs de performance** | **3 taps / 0 frappe** pour un passage · **total au premier rendu** · recherche **sous 300 ms sur 10 000 fiches** (SEJ-01) |
| **Contraintes** | Aucun réseau, aucun conteneur pour l'application · classes hors-ligne opposables · fr/en à parité · clair et sombre |
| **Périmètre** | **7 écrans**, **9 types de mouvement**, **~14 opérations de couture**, **11 codes de refus** |

**Aucun point en attente de clarification.** Les trois questions ouvertes ont été tranchées le
2026-08-08 (spec, §Clarifications) ; les quatre ambiguïtés restantes l'ont été **par les documents**.

---

## Contrôle de constitution

*Porte : à passer avant la recherche de phase 0, et **re-contrôlée après la conception**.*

### Principes dont ce cycle relève directement

| Principe | Ce que ce cycle doit tenir | Où c'est tenu |
|---|---|---|
| **0 · Ordre des trois phases** | Aucun backend, aucune migration, aucun endpoint. La phase 1 est close, la phase 3 n'est pas anticipée | Toute écriture passe par la couture simulée ; aucun `fetch` n'existe |
| **2 · Architecture** | **Aucune surface ne suppose que l'établissement a de l'hébergement.** Le socle ne connaît que `article_vendable` et `ressource_reservable` | « Résidence Test » ne voit **aucune** surface de ce cycle — pas une liste vide, **rien** |
| **4 · Temps et disponibilité** | Intervalle `[début, fin)` horodaté · **remise en état intégrée** · **durée calculée sur l'horodatage d'autorité** | `data-model.md` §2.1 — **deux périodes** · `app/core/reception/disponibilite.ts` · l'horloge de la couture, jamais `Date.now()` dans un composant |
| **5 · Argent et fiscalité** | Entiers en unités mineures · quantités décimales · **aucune règle fiscale hors adaptateur** · **test doré sur jeu figé** · mention « document non fiscal » | `taxe-sejour.ts` est **l'ancêtre front du `JurisdictionAdapter`**, sans valeur écrite, **supprimé** au cycle qui livre l'adaptateur |
| **6 · Hors ligne** | Classe déclarée au registre · **B/C/D inatteignable hors ligne** · UUID v7 client · aucune donnée B/C/D en cache d'écriture | Garde **dans la fonction d'appel** (`contracts/interfaces-domaine-reception.md` §3) · test sur le **HTML rendu** |
| **8 · Qualité et interface** | **Absent, jamais grisé** · aucune chaîne en dur · aucune valeur littérale hors jetons · **une seule racine, et c'est un élément** | Lint + tests d'unité + P-04, mécanismes déjà en place au cycle F1 |
| **10 · Périmètre** | **Aucune provision exposée** | `prestation_incluse`, `contrat_location`, `caution`, `charge_locative`, `etat_des_lieux` ne sont **ni lues ni typées** |
| **11 · Versions** | Épinglage exact, lockfile commité, **famille tranchée avant d'être ouverte** | **Zéro ajout** · une **famille ouverte pour être écartée** (research §1.2) |
| **12 · Référence visuelle** | La **grammaire** fait foi, pas le dessin. Un écran inventé s'inscrit à `derivation.md` | ⚠️ **Trois points où la maquette a tort**, tranchés et inscrits — le hors-ligne de `R4`, la taxe de `R7`, et **la barre de progression de l'envoi**, écartée au profit de la roue et du compte à rebours chiffré |
| **13 · Vérification** | Une commande · toute porte touchée dit **comment** elle vérifie · pas de porte par anticipation | §« Les portes » ci-dessous · **aucune porte nouvelle**, et le motif est écrit |

### Principes sans objet pour ce cycle — déclarés, jamais cochés en silence

| Principe | Pourquoi sans objet |
|---|---|
| **1 · Sources de vérité** *(partie SQL)* | Aucun fichier de `docs/modele-donnees/` n'est touché : **les tables existent depuis D2**. Le miroir est déjà exact |
| **3 · Multi-tenant** | Ni RLS ni `current_setting` en phase 2 : il n'y a pas de base. L'isolation est **prouvée par P-01**, sur le modèle |
| **7 · Application unique** | La coquille, le `PlatformAdapter` et les deux implémentations sont posés au cycle F1. Ce cycle **consomme l'impression** — deux gestes, sur `R4` et `R7` — **à travers l'adaptateur**, avec l'annonce d'alternative quand la capacité est absente (**FR-029a**, tâche **T025a**). ⚠️ **Il ne dessine pas le ticket** : le gabarit thermique est du cycle F6 |
| **9 · Sécurité** | Aucune authentification, aucun jeton, aucun enrôlement n'est touché. ⚠️ **Sauf un point qui l'est** : le numéro de pièce est une **donnée sensible** — voir « Ce que ce cycle ne fait pas » |

### Écarts à justifier

**Aucun.** Un point mérite d'être nommé sans être un écart : le cycle **encaisse de l'argent sans
qu'un shift soit ouvert** (CAI-01, cycle F5). Les règlements sont rattachés à un **shift simulé
implicite**, et c'est écrit aux hypothèses de la spécification plutôt que découvert au premier
comptage de caisse.

---

## Structure du projet

### Documentation de cette fonctionnalité

```text
specs/005-reception-passage-note-planning/
├── plan.md                                   # ce fichier
├── spec.md                                   # la spécification, clarifiée le 2026-08-08
├── research.md                               # phase 0 — versions, familles, emplacements
├── data-model.md                             # les 9 types de mouvement, miroir du SQL
├── quickstart.md                             # le parcours déroulé à la main, de A à J
├── contracts/
│   ├── interfaces-domaine-reception.md       # la couture — lectures, écritures, classes
│   ├── document-a-lignes.md                  # le motif dont SIX écrans héritent
│   └── parcours-et-gestes.md                 # les 8 budgets, et comment ils rougissent
├── checklists/requirements.md                # 29/29, dont l'analyse de cohérence du 2026-08-08
└── tasks.md                                  # produit par /speckit-tasks — PAS par ce plan
```

### Code source (racine du dépôt)

```text
app/
├── core/
│   ├── donnees/hebergement/
│   │   ├── types.ts              # ÉTENDU — 9 types de mouvement + 11 codes de refus
│   │   │                         # ⚠️ l'avertissement « ce cycle porte le référentiel,
│   │   │                         #    pas le mouvement » est LEVÉ ici, pas laissé à mentir
│   │   ├── interface.ts          # ÉTENDU — DonneesReception + EcrituresReception
│   │   └── simulation.ts         # ÉTENDU — déduplique, refuse, et sait échouer
│   ├── donnees/jeux/deloria.ts   # ÉTENDU — 12 jeux de cas, TOUS datés relativement
│   ├── donnees/contrat.ts        # ÉTENDU — CodeEchec + paramètres admettant une liste
│   ├── reception/                # NOUVEAU — les calculs purs, hors de tout composant
│   │   ├── bareme.ts             #   prix, palier, rebascule, bascule en nuitée
│   │   ├── disponibilite.ts      #   chevauchement, chambres libres, prochaine libération
│   │   ├── taxe-sejour.ts        #   ⚠️ ancêtre front du JurisdictionAdapter — SUPPRIMÉ en phase 3
│   │   └── gestes.ts             #   le barème geste → seconde, en UN SEUL endroit
│   ├── document-a-lignes/        # NOUVEAU — le motif des six écrans (research §2)
│   │   ├── LigneDocument.vue
│   │   ├── SousTotalSection.vue
│   │   └── PiedTotal.vue         #   ⚠️ pièce SÉPARÉE — c'est ce qui permet à R5 de la rejeter
│   ├── planning/ruban.ts         # NOUVEAU — le calcul élastique, fonction pure
│   ├── design-system/            # INCHANGÉ — les seize, et rien d'autre
│   ├── format/{montant,instant}.ts # INCHANGÉ — les seules fonctions qui écrivent un nombre
│   └── i18n/{fr.ts,en.ts}        # ÉTENDU — parité stricte, les 11 refus compris
├── pages/
│   ├── passage.vue               # R4  /passage      ⚠️ ne se compose pas
│   ├── arrivee.vue               # R3  /arrivee
│   ├── depart.vue                # R7  /depart
│   ├── planning.vue              # V1  /planning     (route décidée — research §6)
│   ├── jour.vue                  # R2  /jour         (idem)
│   ├── note.vue                  # R6  /note/:sejour (idem — ⚠️ /notes est PRIS par F7)
│   └── clients.vue               # R5  /clients
├── core/ecrans/index.ts          # ÉTENDU — 7 écrans passent à CONSTRUIT, avec leur route
tests/
├── unite/                        # calculs dorés · conformité au modèle · classes · i18n · absence
└── navigateur/
    ├── gestes.ts                 # NOUVEAU — le compteur d'interactions (P-04)
    └── reception.spec.ts         # les 8 parcours × 2 thèmes × 2 moteurs
docs/
├── design/derivation.md          # 3 notes déjà posées + 7 lignes passées à « codé »
├── design/lexique.md             # + « Garder la chambre » / « Tenue jusqu'à {heure} »
├── versions-reference.md         # §3.4 — la famille « planning horaire », ouverte pour être écartée
└── points-entree.md              # ~100 entrées nouvelles, « branché » ou « dû »
```

**Décision de structure.** Trois dossiers nouveaux sous `app/core/`, aucun sous `app/modules/` —
**qui n'existe pas** : le dépôt place la logique d'écran dans `app/core/{domaine}/` depuis le cycle
F2 (`app/core/accueil/`). Le découpage suit la portée réelle : `reception/` est **du cycle**,
`document-a-lignes/` et `planning/` sont **partagés** — six écrans de quatre cycles héritent du
premier. Les mettre dans `reception/` obligerait le cycle F4 à importer « la réception » pour
afficher une addition de bar.

---

## Les écrans de ce cycle — référence visuelle, composants, zone

*Livrable de phase 2.*

| Écran | Route | Cas | Référence visuelle | Composants employés | Zone |
|---|---|---|---|---|---|
| **`R4`** Le passage | `/passage` | **maquetté** | `R4-passage.html` + 4 états | ⚠️ **ne se compose pas** — ses blocs de décision sont **propres à l'écran** (`derivation.md` L261 : *« une intention dessinée qu'un assemblage ne retrouverait pas »*). Emprunte **07** bandeau d'alerte · **14** bandeau d'annulation · **11** état vide *(tout est pris)* · **04** pastille *(grille des chambres)* | **vitesse** |
| **`R3`** Arrivée | `/arrivee` | dérivé de `R4` | *« plus de champs, même grammaire »* | **16** champ de saisie · **04** · **07** · **11** — et **aucun bouton de soumission** | **vitesse** |
| **`R7`** La note et le départ | `/depart` | **maquetté** | `R7-note-depart.html` + 2 états **+ 1 inventé** | **document à lignes** *(3 pièces)* · **01** bouton principal · **02** · **07** · **13** squelette | charme |
| **`R6`** Note temps réel | `/note/:sejour` | dérivé de `R7` | *« sans l'action finale »* | idem `R7`, **sans 01** — ⚠️ **et c'est lui qui porte les trois gestes de SEJ-04** : prolonger, changer de chambre, faire partir plus tôt (**FR-041a→c**). Ils vivent sur la note du séjour **en cours**, pas sur l'écran de départ | charme |
| **`R5`** Fiche client | `/clients` | dérivé de `R7` | *« liste + fiche, **pas de total** »* | **08** ligne de liste · **16** recherche · **11** · **13** — ⚠️ **`PiedTotal` volontairement absent** | charme |
| **`V1`** Le planning | `/planning` | **maquetté** | `V1-planning.html` + `-dense` | **12** sélecteur segmenté *(semaine / jour)* · **03** bouton discret · **01** *(« Donner une chambre »)* · **11** · **13** — le ruban est **propre à l'écran** | charme |
| **`R2`** Vue du jour | `/jour` | dérivé de `R1` | `R1` + composant 14 | **05** tuile d'action · **08** · **06** carte chiffre · **04** · **11** | charme |

**Les cinq états, produits systématiquement** — les quatre du cycle F1, **plus un propre à ce
cycle** :

| État | Déclenchement | Ce qu'il montre |
|---|---|---|
| **Vide** | levier « jeu vide » | Composant **11**, une phrase et **l'action qui démarre** |
| **Tout est pris** ⚠️ | jeu « complet » | *Propre à `R4`* : **ce qui se libère et quand**, et **« Garder la chambre »**, tenue 15 min, relâchée seule. Ce n'est **pas** un état vide — la maison est pleine, ce n'est pas une panne |
| **Chargement** | levier « latence » | Composant **13**, **forme exacte** du contenu à venir. Le planning montre **ses lignes**, jamais une roue |
| **Erreur** | levier « échec réseau » | Composant **07**. **Jamais deux bandeaux empilés** |
| **Hors ligne** | levier « hors ligne » | L'action **absente du HTML**, phrase du lexique, **avant** la tentative |

---

## Le parcours cliquable, de bout en bout

*Déroulé pas à pas dans [quickstart.md](./quickstart.md), exécuté par P-04.*

1. `/` → **« Hébergement »** → `/jour` → **« Donner une chambre »** → `/passage`.
2. **Un tap sur « 2 h »** → chambre donnée, **argent encaissé**, heure de fin en très grand,
   **8 s pour annuler**. *(3 taps, 0 frappe)*
3. Téléphone `0708441290` → **client reconnu sans validation**, chambre habituelle proposée →
   **« 3 h »**. *(5 taps, 10 frappes)*
4. Chambre **111 déjà prise** → refus **nommant la période** et **listant les chambres libres**.
5. Chambre **en remise en état** → refus **le nommant** — celui qu'on oublie.
6. `/planning` → passage de 3 h **et** nuitée du même jour, **tous deux lisibles** · hachures ·
   trait de *maintenant* · semaine **dense** dans la même largeur.
7. `/depart` → **total déjà là**, pied épinglé, **taxe de séjour à 500 F** *(pas 4 000)*.
8. **« Faire partir le client »** → succès · échec **avec deux issues** · **indéterminé sans aucun
   bouton de renvoi**.
9. `/clients` → recherche **sans validation**, fiche **sans total**.
10. Levier **hors ligne** → **« Donner une chambre » disparaît du HTML** ; le planning, la note et
    les fiches **restent lisibles avec leur fraîcheur**.
11. **Accompagnant** et **statut ménage** hors ligne → **acceptés**, en file. **Fiche client** →
    **refusée**, pour un motif distinct.
12. Passage **dépassé** → ligne de rebascule **avec son motif** ; au-delà de **480 min**, la bascule
    en nuitée **s'annonce avant de s'appliquer**.

---

## Les portes — ce que ce cycle touche, et par quel test

*Le principe 13 exige que chaque porte déclare son périmètre, vérifie sa complétude, ne modifie
rien, **prouve que sa cible n'est pas vide**, et ait **son test négatif**.*

| Porte | État | Ce qu'elle prouve ici | Non-vacuité | Test négatif |
|---|---|---|---|---|
| **P-01** | **inchangée** | *Aucune table n'est créée* — elles existent depuis D2. Le modèle reste prouvé tel quel | plancher 110 tables | existant |
| **P-02** | **inchangée** | Les neuf entités de mouvement **sont déjà au registre** (§7.2, §7.3). C'est le résultat attendu, pas une chance | planchers 110 / 170 | existant |
| **P-05** | **inchangée** | Les rattachements inter-modules **restent nus** : `sejour.etablissement_id`, `fiche_police.etablissement_id`, `ligne_sejour.ligne_commande_id`, `client.personne_id`. **Ce cycle ne peut pas les casser** — il n'écrit pas de SQL | plancher 90 FK | existant |
| **P-03** | **verte sans changement** | **Zéro dépendance ajoutée.** Le §3.4 gagne une ligne de **famille** — un arbitrage, pas un manifeste : hors du périmètre des deux sens de P-03 | plancher dérivé des manifestes | existant |
| **P-04** | **ÉTENDUE** | *(a)* **7 écrans passent à `CONSTRUIT`** → **14 entrées atteignables**, ×2 thèmes ×2 moteurs = **56 passages** · *(b)* **les 8 budgets de gestes** · *(c)* **le total au premier rendu** · *(d)* **l'absence du HTML** hors ligne et sans permission | dérivée du routeur — jamais une constante | ⚠️ **nouveau, propre à l'extension** : **ajouter un tap** au parcours du passage — un bouton « Confirmer » — **doit rougir en nommant P1 et son budget**. Si la porte reste verte, code **4** |
| **P-06** | **ÉTENDUE** | ~100 entrées nouvelles au registre, chacune **« branché » ou « dû »**, dans les deux sens · les calculs purs **exercés par un test d'unité** | planchers **relevés** : les cibles ont doublé, un plancher figé cesserait de prouver la non-vacuité | existant, les deux mutations |

**Ce que le script enchaîne, toujours en une commande** :
`lint → types → construction → tests d'unité → P-01 → P-02 → P-05 → P-03 → P-04 → P-06`.

⚠️ **La commande dépasse déjà son repère de 180 s** *(219 s au dernier passage)*. Ce cycle ajoute
**28 passages de navigateur** — il faut s'attendre à la voir croître, et **le consigner au rapport
de cycle** plutôt que de raccourcir une suite pour tenir un chiffre.

### Aucune porte nouvelle — et voici pourquoi

Le candidat évident était une porte « ergonomie » pour le compte des gestes. **Elle est écartée** :
le contrôle a besoin d'un navigateur réel, sur deux moteurs, avec l'application démarrée —
**exactement le périmètre de P-04**, qui paie déjà ce démarrage. Une porte de plus dupliquerait ce
coût pour trois assertions, et *le noyau grossit à la demande, pas par anticipation*.

### Les contrôles qui ne sont pas des portes

| Contrôle | Exigence | Mécanisme | Où |
|---|---|---|---|
| Conformité des 9 types au SQL | FR-064 | Test d'unité, **champ par champ** contre `97-hebergement.sql` | unité |
| **Le test doré du calcul** — barème, rebascule, bascule, taxe | FR-067, SC-015 | Jeu de cas **figés**, hors composant | unité |
| **La taxe ne se multiplie pas par les personnes** | FR-013, SC-015a | Cas doré : 4 nuits × 2 personnes = **500 F**, et 1 personne donne **le même montant** | unité |
| Aucun montant écrit en dur | SC-013 | Le HTML rendu ne contient **aucun montant absent du jeu** | unité + P-04 |
| `periodeIndisponibilite ⊇ periode` | FR-015 | Invariante testée sur chaque écriture simulée | unité |
| Compteur de fiche **sans trou** | data-model §2.8 | N fiches → numéros 1..N | unité |
| Constat de taxe **immuable** | FR-027b | La simulation **refuse** l'écriture, elle ne l'ignore pas | unité |
| Déduplication par UUID v7 | FR-065 | Trois envois de la même écriture → **un seul** enregistrement | unité |
| Classe B/C/D inatteignable hors ligne | FR-056, FR-060 | Garde **dans la fonction d'appel** + absence du **HTML rendu** | unité + P-04 |
| Les mots proscrits | SC-009 | Recherche dans le HTML rendu **et** les deux catalogues | unité + P-04 |
| Parité fr/en, aucune chaîne en dur | FR-078 | Test de parité + `@intlify/vue-i18n/no-raw-text` | unité + lint |
| Une seule racine, et c'est un élément | constitution 8 | `vue/no-root-v-if` | lint |
| ⚠️ **Aucun `page.click` hors du compteur** | `contracts/parcours-et-gestes.md` §3 | **Règle ESLint nouvelle**, portée `tests/navigateur/` | lint |
| ⚠️ **Aucune horloge lue dans un composant** | constitution 4, FR-021a | **Règle ESLint nouvelle** — `Date.now`, `new Date()`, `performance.now` interdits sous `app/pages/` et `app/core/**/[A-Z]*.vue` ; l'horloge vient de la couture | lint |
| Impression à travers l'adaptateur, alternative annoncée | FR-029a | La règle F1 *« aucune API de plateforme hors `PlatformAdapter` »* la couvre **déjà** — ce cycle n'ajoute que les deux appels | lint + P-04 |
| Recherche client **sous 300 ms** sur 10 000 fiches | SC-019 | Mesure dans un test d'unité, sur le jeu de volumétrie | unité |
| Compteur de fiche **sans trou** | data-model §2.8 | N fiches → numéros 1..N — **assertion de T010** | unité |

---

## Ce que ce cycle met à jour dans le même changement que le code

*Sans exception — un document mis à jour « juste après » ne l'est jamais.*

| Document | Ce qui y entre | Exigence |
|---|---|---|
| `docs/design/derivation.md` | ✅ **3 notes déjà posées** *(hors-ligne de `R4`, 4ᵉ état de `R7`, taxe de `R7`)* · **7 lignes à passer à « codé »** — **dans le changement qui livre l'écran, jamais avant** | FR-074 |
| `docs/design/lexique.md` | ✅ **2 renvois corrigés** · ⚠️ **à ajouter** : « **Garder la chambre** » / « **Tenue jusqu'à {heure}** », avec l'interdiction de « réserver » | FR-076, clarification |
| `docs/versions-reference.md` | **§3.4** : la famille **« Planning à granularité horaire (front) »**, ouverte pour être **écartée**. **§3.1 et §3.2 inchangés** — zéro ajout | consigne du cycle |
| `app/core/ecrans/index.ts` | **7 écrans → `CONSTRUIT`**, avec leur route. C'est ce qui fait disparaître les mentions « à venir · cycle F3 » de l'accueil **sans que `R1` soit retouché** | FR-075 |
| `docs/points-entree.md` | ~100 entrées, chacune **« branché » ou « dû »**, avec sa valeur d'exercice | FR-070, P-06 |
| `docs/registre-classes-offline.md` | **Rien.** Les neuf entités y sont déjà — le cycle D2 les a déclarées avec les tables. *Le vérifier était le travail ; ne rien écrire est le résultat* | DoD 5 |
| `docs/modele-donnees/97-hebergement.sql` | **Rien.** Aucune table créée, aucune migration. Le miroir est déjà exact | DoD 11 |
| `specs/005-…/rapport-de-cycle.md` | Ce qu'aucune porte ne voit : la **lisibilité d'une barre de 3 h au soleil**, la **fluidité perçue** d'un tap, et **la durée de la commande unique** | DoD 14 |

---

## Contrôle de constitution — après la conception de phase 1

**Re-contrôlé le 2026-08-08, après `research.md`, `data-model.md`, `contracts/` et `quickstart.md`.**

| Point | Verdict |
|---|---|
| Aucune phase sautée, aucun backend introduit | ✅ Aucune migration, aucun endpoint, aucun conteneur exigé par l'application |
| La couture permet le branchement **endpoint par endpoint** | ✅ 14 opérations derrière l'interface de domaine ; le client généré en sera la seconde implémentation |
| Aucune surface ne suppose l'hébergement | ✅ « Résidence Test » ne voit **rien** de ce cycle — pas une liste vide |
| Aucune provision exposée | ✅ Les cinq tables de provision de `hebergement` ne sont **ni lues ni typées** |
| Aucune règle fiscale hors adaptateur | ✅ `taxe-sejour.ts` **ne porte aucune valeur** et sera **supprimé** en phase 3, jamais dupliqué |
| Montants entiers, quantités décimales | ✅ `prixUnitaire: number` entier · `quantite: number` décimal — les deux types sont **distincts dans le modèle** |
| Disponibilité par intervalle, remise en état intégrée | ✅ **Deux périodes**, et le refus porte sur la seconde |
| Durée calculée sur l'horodatage d'autorité | ✅ Horloge de la couture ; `Date.now()`, `new Date()` et `performance.now()` dans un composant sont **interdits par une règle ESLint que la tâche T006a écrit**. ⚠️ *L'analyse de cohérence a trouvé cette affirmation **cochée sans tâche** : un contrôle affirmé et absent fait cocher une case, ce qui est pire que son absence* |
| Toute entité a sa classe au registre | ✅ Neuf entités, **déjà déclarées** — la couture **lit** la classe, elle ne la recopie pas |
| Épinglage exact, lockfile, familles | ✅ **Zéro ajout** · une famille **ouverte et tranchée** |
| Une commande, portes avec test négatif | ✅ Deux portes étendues, **un test négatif nouveau** pour l'extension de P-04 |
| Absent, jamais grisé | ✅ Testé sur le **HTML rendu**, jamais sur `disabled` |
| Aucun workflow GitHub Actions | ✅ |

---

## Ce que ce cycle ne fait pas, et qu'il faut savoir en sortant

- **Il n'ouvre pas la question de la rétention des pièces d'identité.** Le numéro de pièce est une
  donnée sensible (TRX-06 : chiffrement au repos, rétention 90 j, journal d'accès). En phase 2, il
  vit dans un jeu simulé sur un poste de développement. **La purge porte sur deux tables, pas une**
  — `comptes.personne` **et** `hebergement.accompagnant` — et c'est le cycle qui livre TRX-06 qui
  devra le tenir.
- **Il n'ouvre pas le shift de caisse**, alors qu'il encaisse. Nommé aux hypothèses.
- **Il ne construit pas la réconciliation orpheline**, mais la couture **refuse déjà** d'écrire sur
  une note arrêtée — le minimum qui empêche de mentir au branchement.
- **Il ne prouve pas les 30 secondes au comptoir.** Il prouve **3 taps et 0 frappe**. La mesure
  terrain est au jalon J0.
- **Il laisse une dette de fuseau nommée** : l'arithmétique en instants absolus est exacte pour
  `Africa/Abidjan` (UTC+0 toute l'année) et devra être rouverte au second pays de l'incrément 3
  (research §1.3).
