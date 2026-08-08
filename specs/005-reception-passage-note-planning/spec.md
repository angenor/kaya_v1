# Spécification de fonctionnalité : Le cœur métier de la réception — passage, note, planning (cycle F3)

**Dossier de cycle** : `specs/005-reception-passage-note-planning`

**Créée** : 2026-08-08

**Statut** : Brouillon

**Phase** : 2 — l'application entière en données simulées. **Aucun backend, aucun endpoint, aucune
migration.**

**Stories lues** : `docs/user-stories-v1.md` HEB-01 → HEB-06, SEJ-01 → SEJ-05 ·
`docs/cadrage-v1.md` §5 (et §9.6, §11.3 pour ce qu'elles imposent ici)

**Maquettes lues** : `R4-passage*.html` (cinq états) · `R7-note-depart*.html` (trois états) ·
`V1-planning*.html` (deux états)

**Écrans du cycle**, tels que `app/core/ecrans/index.ts` les affecte à F3 :

| Code | Titre | Route | Cas | Référence |
|---|---|---|---|---|
| `R4` | Le passage | `/passage` | maquetté | `R4-passage*.html` — cinq états |
| `R7` | La note et le départ | `/depart` | maquetté | `R7-note-depart*.html` — trois états |
| `V1` | Le planning | à décider au plan | maquetté | `V1-planning*.html` — deux états |
| `R3` | Arrivée | `/arrivee` | dérivé de `R4` | *« parcours long : plus de champs, même grammaire »* |
| `R5` | Fiche client et recherche | `/clients` | dérivé de `R7` | *« liste + fiche, **pas de total** »* |
| `R6` | Note temps réel | à décider au plan | dérivé de `R7` | *« sans l'action finale »* |
| `R2` | Vue du jour | à décider au plan | dérivé de `R1` | hérite de `R1` + composant 14 |

---

## Clarifications

### Session 2026-08-08

- Q: Au passage, le tap sur le bouton de durée encaisse-t-il l'argent, ou faut-il un geste de
  règlement en plus ? → A: **Le tap encaisse.** Un seul geste donne la chambre **et** encaisse en
  espèces le montant affiché sur le bouton ; la note du passage s'ouvre et s'arrête dans le même
  mouvement. Le bandeau d'annulation devient **la seule protection** contre l'effet monétaire d'un
  tap accidentel — il est donc **obligatoire, pas décoratif**.
- Q: SEJ-05 — la vente à un client sans hébergement — entre-t-elle dans ce cycle ? → A: **Non,
  renvoyée aux cycles F4/F5.** Les documents se contredisaient : §0.5 liste SEJ-01→05 pour F3, mais
  §0.6 et les tranches placent SEJ-05 en **T2 avec PDV et CAI**, et `derivation.md` en fait un écran
  de point de vente (`P3`, `C2`). Ce cycle porte l'hébergement.
- Q: Quand tout est pris, garde-t-on le bouton « Garder la 101 pour ce client » ? → A: **Oui, comme
  une occupation de motif `RESERVATION`** de courte durée, relâchée automatiquement. Aucune entité
  nouvelle — la table sait déjà le faire — et aucun écran de réservation n'est construit.
  **Vocabulaire proposé, absent du lexique** : « **Garder la chambre** » pour le bouton, « **Tenue
  jusqu'à 16 h 25** » pour l'état. ⛔ Jamais « réserver », qui promet un engagement que quinze
  minutes ne portent pas.

### Corrections tranchées par les documents — sans question

Ces quatre points étaient ambigus dans la première rédaction ; les documents opposables les
tranchaient déjà. Ils sont corrigés, et le premier évitait une **erreur fiscale**.

1. ⚠️ **La maquette `R7` calcule la taxe de séjour d'une façon que le cadrage a corrigée.** Elle
   affiche *« 500 F par personne et par nuit · 2 personnes × 4 nuits »* = **4 000 F**. Le cadrage
   §9.6, **corrigé le 2026-08-03 par la décision B-10 close**, dit : la taxe est due **par nuitée et
   par séjour, jamais par personne** — *« un couple en chambre double paie une taxe, pas deux »*. Et
   la règle seed de la formule nuitée est `une_nuitee_par_occupation` (`user-stories-v1.md`,
   récapitulatif) : **500 F pour tout le séjour**, quelle qu'en soit la durée. Le bon montant sur
   cette note est donc **500 F**, et son total **282 860 F**. Le `nombre_personnes` est enregistré
   au constat **à titre purement indicatif** — il documente le séjour et **n'entre dans aucun
   calcul**.
2. **Le passage et la demi-journée ne sont PAS assujettis à la taxe de séjour** — tranché au terrain
   le 2026-08-02, drapeau `assujettie_taxe_nuitee` éditable (`user-stories-v1.md`, récapitulatif).
   `R4` n'affiche donc **aucune** ligne de taxe de séjour.
3. **Une occupation porte DEUX périodes, pas une** (`97-hebergement.sql` L553) : `periode` — ce que
   le client occupe **et ce qui se facture** — et `periode_indisponibilite` — `periode` + le temps
   de remise en état. **C'est la seconde que la contrainte d'exclusion protège**, et c'est le
   domaine qui la pose, pas la base.
4. **Le total provisoire d'une note est un CACHE de lecture** recalculé depuis les lignes
   (`97-hebergement.sql` L907) : *« Le total OPPOSABLE est celui du document fiscal certifié — jamais
   celui-ci. »*

---

## Ce que ce cycle produit, et ce qu'il ne produit pas

| Il produit | Il ne produit pas |
|---|---|
| Les **sept écrans** ci-dessus, atteignables, en clair **et** en sombre, sous Chromium **et** WebKit | Aucun écran de réservation (`V2`, cycle F7), aucun écran d'OCR (`M5`, cycle F4) |
| La **couture de domaine** du mouvement hôtelier : occupation, séjour, note, ligne de note, client, fiche de police — interface + implémentation simulée | Aucun appel réseau réel, aucun contrat HTTP, aucune migration |
| Le **refus de disponibilité** : deux occupations qui se chevauchent sont impossibles à créer, et le refus **nomme le conflit** | La contrainte d'exclusion GiST elle-même — c'est la phase 3 qui la posera. Ici, l'écran sait déjà le dire |
| Les **trois issues de l'envoi aux impôts** — succès, échec, indéterminé — **simulées et pilotables** depuis le panneau `/_scenarios` du cycle F1 | Aucune certification réelle, aucune clé FNE, aucun intégrateur |
| Le **barème dégressif du passage**, la **demi-journée**, le **temps de remise en état**, la **taxe de séjour en ligne distincte** | Le calendrier tarifaire (HEB-07), les contrats et cautions (HEB-08), les prestations incluses (HEB-09) — provisions |
| Le **compte des gestes** de chaque parcours, mesuré et **vérifié par la porte P-04** | Aucune mesure de temps réseau : la phase 2 mesure les gestes, pas la latence |
| Un **règlement simple** — un seul mode, l'espèce : **au tap de la durée** pour le passage, **à la sortie** pour la nuitée | L'encaissement multi-modes, l'ouverture de shift, le comptage et la clôture : cycle F5 · **la vente à un client sans hébergement** (SEJ-05) : cycles F4/F5 |

---

## Le compte des gestes — les trois objectifs, traités comme des critères d'acceptation

Les trois objectifs du cahier des charges se mesurent **dès la phase 2**, parce qu'ils dépendent du
nombre de gestes bien plus que du réseau. Un objectif qu'aucune porte ne mesure est un souhait ; ces
trois-là sont **comptés, écrits, et vérifiés**.

### Le barème de conversion — déclaré, donc reproductible

Un test compte des **gestes**, pas des secondes. Les secondes s'en déduisent par un barème déclaré
une fois, dérivé du modèle Keystroke-Level appliqué à un écran tactile de comptoir :

| Unité | Durée retenue | Motif |
|---|---|---|
| **tap** sur une cible ≥ 44 px | **1,2 s** | pointage + appui, debout, une main occupée par une clé |
| **frappe** d'un caractère au clavier tactile | **0,5 s** | saisie à un doigt, chiffres et lettres confondus |
| **décision** devant plus de deux choix | **1,2 s** | choix de la durée, choix de la chambre, choix du mode |
| **lecture** d'un écran nouveau | **1,0 s** | orientation avant le premier geste |
| **attente machine** | comptée **à part** | ce n'est pas un geste — et c'est ce qui la rend traitable |

⚠️ **La parole échangée avec le client n'est pas dans le modèle.** Elle est incompressible et elle se
superpose aux gestes ; l'y inclure ferait dépendre le budget d'un facteur que le produit ne pilote
pas.

### Les huit parcours comptés

| # | Parcours | Taps | Frappes | Décisions | Lectures | **Gestes** | Attente | Cible | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| **P1** | Passage anonyme, chambre proposée | 3 | 0 | 1 | 2 | **6,8 s** | — | 30 s | ✅ |
| **P1b** | Passage, chambre changée d'un tap | 4 | 0 | 2 | 2 | **9,2 s** | — | 30 s | ✅ |
| **P2** | Passage, client reconnu au téléphone | 5 | 10 | 1 | 2 | **14,2 s** | — | 60 s | ✅ |
| **P3** | Arrivée nuitée, **client connu** | 7 | 10 | 3 | 1 | **18,0 s** | — | 60 s | ✅ |
| **P4** | Arrivée nuitée, **client inconnu** | 13 | 50 | 4 | 1 | **46,4 s** | — | *aucune* | ⚠️ frôle |
| **P5** | Ouvrir une note et lire le **total provisoire** | 1 | 0 | 0 | 1 | **2,2 s** | 0 | *instantané* | ✅ |
| **P6** | Départ complet, issue **succès** | 5 | 0 | 1 | 1 | **7,0 s** | 5–10 s | — | ✅ |
| **P7** | Départ, issue **échec**, numéro corrigé | 7 | 13 | 1 | 2 | **16,0 s** | 10–20 s | — | ✅ |
| **P8** | Départ, issue **indéterminée** | 6 | 0 | 2 | 2 | **11,6 s** | 10 s (butée) | — | ✅ |

### Ce qui dépasse — nommément

1. **Le passage avec l'identité complète exigée AVANT la clé : ≈ 41 s. Il dépasse.** Nom, prénoms,
   numéro de pièce, nationalité et date de naissance coûtent à eux seuls ≈ 50 frappes et 6 taps —
   soit ≈ 34 s ajoutées aux 6,8 s du parcours nu. **C'est la mesure qui justifie la conception de la
   maquette** : *« Pièce d'identité : après la clé, pas avant »*. Si un exploitant exige la pièce
   avant la remise de la clé, la cible des 30 s est perdue, et le produit sera contourné (cadrage
   §5.6). La spécification **interdit** donc ce parcours comme parcours nominal.
2. **L'arrivée d'un client inconnu : ≈ 46 s, sous la barre des 60 s mais sans marge.** Trois champs
   de plus et l'objectif tombe. Aucune cible n'est officiellement posée sur ce parcours — SEJ-02 ne
   chiffre que le client **connu** — mais il est compté ici parce que c'est lui qui se dégradera en
   premier. C'est aussi exactement le parcours que SEJ-06 (OCR, cycle F4) existe pour ramener sous
   la barre : *l'agent corrige, il ne saisit pas.*
3. **Deux taps sont consommés avant la première décision du passage.** Aucune surface de l'accueil ne
   cible `R4` : `app/core/accueil/surfaces.ts:108` fait pointer l'activité « Hébergement » vers `R2`,
   et c'est `R2` qui mène à `R4`. Le budget tient (6,8 s pour 30 s), mais **c'est le seul geste
   compressible du parcours le plus fréquent de l'établissement** : si un jour il faut gagner du
   temps, il se gagne là, et nulle part ailleurs.
4. **Le départ n'est pas limité par ses gestes, mais par l'attente.** Sept secondes de gestes, cinq à
   dix secondes d'attente de l'administration fiscale, **pendant que le client est debout**. Aucun
   budget de gestes ne protège ce moment : seule la conception de l'attente le fait — dire ce qui est
   **déjà acquis**, et permettre de laisser partir le client sans attendre le numéro officiel.

---

## Trois arbitrages tranchés à la spécification

### A · La maquette `R4-passage-hors-ligne.html` est en conflit avec le cadrage — et c'est le cadrage qui gagne

La maquette écrit, en bandeau : *« Donner une chambre ne demande pas le réseau : ce passage
s'enregistre normalement, le prix est le bon. »*

Le cadrage §11.3 classe **l'attribution d'unité et le check-in en classe B**, et §11.1 précise qu'une
écriture de classe B n'est possible hors ligne **qu'en mode C — avec un nœud de site**. Le registre
`docs/registre-classes-offline.md` le redit ligne par ligne (`occupation` → B, `sejour` → B,
`note_sejour` → B, `fiche_police` → B). **Il n'y a pas de nœud de site en phase 2.**

L'ordre de préséance est écrit (`CLAUDE.md`, `constitution.md` §1) : **constitution → cadrage →
user stories → le reste**, et le HTML de maquette est **une cible, jamais une source**. Donc :

> **Hors ligne, en mode terminal, l'action « donner une chambre » est ABSENTE de l'écran**, remplacée
> par la phrase du lexique — « **Cette action nécessite internet.** » —, annoncée **avant** que
> l'utilisateur ne s'en approche, jamais après un échec. Ce que la maquette dessine reste vrai le
> jour où un nœud de site existe (incrément 3) ; ce jour-là, il faudra le rendre **conditionnel au
> mode de déploiement**, pas inconditionnel comme la maquette le laisse croire.

⚠️ Le conflit n'est pas tranché en silence : `docs/design/derivation.md` porte la note de conception
correspondante, ajoutée dans le même changement que cette spécification.

### B · Le passage ne dérive pas de l'arrivée — c'est l'inverse, et le sens compte

`docs/design/derivation.md` L92 est explicite : `R3` **Arrivée** dérive de `R4`, *« parcours long :
plus de champs, même grammaire »*. Le parcours du passage n'est donc **pas** le parcours de nuitée
avec des champs en moins, ni le parcours de nuitée avec des champs en plus : c'est le **parcours
court qui fait loi**, et le long qui s'y conforme. Conséquences tenues par ce cycle :

- `R4` est en **zone de vitesse** (`data-zone="vitesse"`) ; `R3` l'est également.
- Sur les deux écrans, **le dernier geste est le tap sur la chambre ou sur la durée** — il n'existe
  **aucun bouton de soumission**. Un « Enregistrer » ajouterait un tap au parcours le plus fréquent
  de l'établissement.
- `R4` **ne se compose pas** de composants canoniques génériques : ses trois corps de caractère
  propres au comptoir (`--text-geste` 46 px, `--text-annonce` 68 px, `--text-annonce-l` 88 px)
  portent une intention qu'un assemblage ne retrouverait pas (`derivation.md` L261).

### C · La note se ferme **arrêtée**, pas **réglée** — et l'écran doit le dire

`derivation.md` L272 porte le point que la maquette ne dit pas : *« la note se ferme arrêtée et non
réglée. Sans cette phrase, l'écran laisse croire au paiement, et le trou se découvre au comptage de
caisse sans qu'on sache à quel séjour il se rattache. »*

Ce cycle le tient en séparant **trois faits distincts**, chacun avec sa phrase, jamais fondus dans un
« départ effectué » :

1. **la note est arrêtée** — plus rien ne peut s'y ajouter (chaîne exacte du lexique) ;
2. **le règlement est encaissé** — ou il ne l'est pas, et le solde restant est dit ;
3. **le document est parti aux impôts** — ou il a échoué, ou on ne sait pas.

Les trois sont indépendants. C'est ce qui rend l'échec fiscal supportable : *« Déjà fait — l'argent
est en sécurité. »*

---

## Décisions prises sans question — et le document qui les tranche

| # | Question | Décision | Ce qui la tranche |
|---|---|---|---|
| **D-01** | Le passage est-il disponible hors ligne ? | **Non.** Absent de l'écran, annoncé avant. Voir l'arbitrage A | `cadrage-v1.md` §11.1 et §11.3 · `registre-classes-offline.md` L313, L332 · `constitution.md` §6 |
| **D-02** | Le vocabulaire des écrans | « **Arrivée** », « **Départ** », « **Séjour** », « **Formule** », « **Type de chambre** », « **Client** », « **Accompagnant** », « **Fiche de police** ». ⛔ *check-in*, *check-out*, *occupation*, *intervalle*, *palier*, *exclusion*, *conflit*, *chevauchement* n'atteignent **ni l'écran ni une route** | `lexique.md` L152, L161→L167 |
| **D-03** | La phrase du refus de disponibilité | « **Cette chambre est déjà prise sur cette période.** » — et **jamais** « conflit » ni « chevauchement » | `lexique.md` L153 (`unite_deja_occupee`) |
| **D-04** | La phrase du conflit avec l'occupation **suivante** | « **Cette chambre est réservée à partir de {heure}.** » **suivie des chambres libres de la même catégorie**. L'heure vient de l'occupation suivante, jamais d'une constante | `lexique.md` L172 (`conflit_occupation_suivante`) |
| **D-05** | La taxe de séjour sur la note | **Ligne distincte**, jamais fondue dans le prix. Le jeu simulé encode la forme **conforme** — le pilote intègre aujourd'hui 500 F au tarif, ce qui le place en infraction | `cadrage-v1.md` §2.1 et §9.6 · `app/core/donnees/hebergement/types.ts` L45-56 |
| **D-05a** | L'assiette de la taxe de séjour | **Par nuitée et par séjour — JAMAIS par personne.** Un couple en chambre double paie **une** taxe, pas deux. Le nombre de personnes est enregistré au constat **à titre indicatif** et **n'entre dans aucun calcul**. Règle seed de la nuitée : `une_nuitee_par_occupation` → **500 F pour tout le séjour**. ⚠️ *La maquette `R7` dit le contraire ; elle a été dessinée avant la clôture de B-10* | `cadrage-v1.md` §9.6 (B-10, close le 2026-08-03) · `user-stories-v1.md`, récapitulatif · `lexique.md` L160 |
| **D-05b** | La taxe de séjour sur le passage et la demi-journée | **Non assujettis** — tranché au terrain le 2026-08-02, drapeau éditable. `R4` n'affiche **aucune** ligne de taxe de séjour | `user-stories-v1.md`, récapitulatif (FIS-03) |
| **D-19** | Le passage est-il encaissé au tap ? | **Oui.** Le tap sur la durée **donne la chambre et encaisse en espèces** le montant du bouton ; la note s'ouvre et s'arrête dans le même mouvement. Le **bandeau d'annulation devient la seule protection** contre l'effet monétaire d'un tap accidentel : il est **obligatoire**. Défaut : **8 s**, valeur de la maquette | Clarification 2026-08-08 · `R4-passage-enregistre.html` · `cadrage-v1.md` §5.6 |
| **D-20** | La chambre « gardée » quand tout est pris | **Une occupation de motif `RESERVATION`** de courte durée, **relâchée automatiquement**. Défaut : **15 min**, valeur de la maquette. Aucun écran de réservation n'est construit. Vocabulaire **proposé, absent du lexique** : « **Garder la chambre** », « **Tenue jusqu'à {heure}** ». ⛔ Jamais « réserver » | Clarification 2026-08-08 · `R4-passage-complet.html` · `97-hebergement.sql` L553 (`ck_occupation_motif`) |
| **D-21** | Combien de périodes porte une occupation ? | **Deux.** `periode` — ce qui est occupé **et facturé** — et `periode_indisponibilite` = `periode` + remise en état. **C'est la seconde que la contrainte d'exclusion protège**, et c'est le domaine qui la pose | `docs/modele-donnees/97-hebergement.sql` L553 |
| **D-22** | La butée avant l'issue « indéterminée » | **10 s**, réglable au panneau de scénarios. **Aucun document ne la fixe** — c'est un paramètre de simulation, pas une règle métier, et le timeout réel viendra de l'intégrateur en phase 3 | décidé ici · `cadrage-v1.md` §9.3 |
| **D-06** | Le barème du passage | **Table de paliers lue au jeu de données** (`BaremePalier`), jamais une constante. Seeds : 1 h 1 500 · 2 h 2 800 · 3 h 4 000 · 4 h 5 000 · h. suppl. +1 200 | HEB-04 · `cadrage-v1.md` §5.3 |
| **D-07** | Le calcul de durée du passage | Sur l'**horodatage d'autorité**. En phase 2, une **horloge de la couture** en tient lieu — jamais `Date.now()` lu dans un composant | `constitution.md` §4 · `cadrage-v1.md` §11.4 |
| **D-08** | Les montants | **Entiers en unités mineures** + `XOF`. Les quantités sont décimales | `constitution.md` §5 |
| **D-09** | L'identifiant des écritures | **UUID v7 généré côté client** (`uuid.v7()`), sur toute écriture — y compris simulée | `constitution.md` §6 · `CLAUDE.md` |
| **D-10** | Le temps de remise en état | **Intégré à l'intervalle d'indisponibilité**, jamais géré à part, et **visible au planning**. Défauts : passage 30 min · nuitée 2 h · demi-journée 1 h — lus au référentiel | HEB-02 · `cadrage-v1.md` §5.4 |
| **D-11** | La granularité du planning | **Ruban élastique à largeur calculée par heure** — les heures occupées s'étirent, les nuits mortes et les jours lointains se replient. Les `left`/`w` sont des **données calculées**, jamais des décisions | `V1-planning.html` note de fin · HEB-02 |
| **D-12** | La demi-journée | **Plages fixes non fractionnables**, lues au référentiel. Refus : « **Une demi-journée se loue en entier : 8 h – 12 h ou 13 h – 16 h.** » — les plages viennent de l'établissement | HEB-05 · `lexique.md` L155 |
| **D-13** | La fiche de police du passage | Elle **existe et est numérotée** dès la remise de la clé, avec « **Identité à compléter** ». Jamais « incomplète » seul : c'est le parcours **normal** du passage, pas un défaut de saisie | `lexique.md` L167 · SEJ-02 |
| **D-14** | Le quatrième état de `R7` — l'issue **indéterminée** | **Écran inventé à l'implémentation** : la maquette n'a que trois états. Autorisé, à condition d'être inscrit à `derivation.md` **dans le même changement**. Phrase : « **Nous ne savons pas si les impôts ont reçu cette facture** » | `lexique.md` L99 · `derivation.md` L282 · `constitution.md` §5 (jamais de rejeu automatique) |
| **D-15** | Le règlement au départ | **Un seul mode — l'espèce**, sans shift ni tiroir. Assez pour arrêter la note et déclencher l'envoi ; le multi-modes, le comptage et la clôture sont du cycle F5 | `user-stories-v1.md` §0.5 (F3 : *« faire un départ »* ; F5 : *« encaisser en deux modes »*) |
| **D-16** | La classe hors-ligne visible à l'écran | **Jamais.** L'utilisateur lit « nécessite internet », jamais « classe B » | `lexique.md` L104 · spec F1, D-04 |
| **D-17** | Le statut d'occupation d'une chambre | **Dérivé** des occupations, jamais posé à la main. Seul le **sous-statut ménage** est modifiable, et il est de classe A | HEB-06 · `cadrage-v1.md` §11.4 |
| **D-18** | Le dépassement de durée d'un passage | **Rebascule automatique sur le palier supérieur**, la différence ajoutée à la note et tracée. Au-delà du seuil de l'établissement (480 min par défaut), **bascule en nuitée annoncée AVANT de s'appliquer** | HEB-04 · `lexique.md` L174 |

---

## Scénarios utilisateur et vérification *(obligatoire)*

### Récit 1 — Yao donne une chambre pour deux heures, en trois taps (Priorité : P1)

Il est 15 h 30 au comptoir de Deloria. Un client demande une chambre pour l'après-midi. Yao touche
« Hébergement », puis « Donner une chambre » : l'écran demande **une seule chose** — *« Combien de
temps ? »* — et propose quatre boutons, **le prix écrit sur chacun** et l'heure de fin dessous. La
chambre 103 est **déjà mise de côté** ; la grille de droite permet d'en changer d'un tap, rien de
plus. Yao touche « 2 h ». C'est fini : la chambre est donnée, **les 2 800 F sont encaissés en
espèces**, **17 h 30** s'affiche en très grand pour être dit à voix haute, et un bandeau propose
d'annuler pendant huit secondes. La pièce d'identité **attend** : elle se complétera avant la
fermeture de la caisse.

⚠️ **Un tap produit ici un effet monétaire irréversible.** C'est le prix des 30 secondes, et c'est
ce qui rend le bandeau d'annulation obligatoire plutôt que confortable : il est la **seule**
protection contre le tap accidentel. Le passage n'ayant **aucune taxe de séjour** (D-05b), le montant
du bouton est le montant encaissé — rien ne s'y ajoute au départ, sauf dépassement de durée.

**Pourquoi cette priorité** : c'est le geste le plus fréquent de l'établissement, celui que le
personnel contourne s'il est lent, et celui qui décide si le logiciel remplace le cahier
(cadrage §5.6).

**Vérification indépendante** : ouvrir `/passage` avec le jeu Deloria, compter les interactions
jusqu'à l'écran de confirmation. Testable sans backend, par construction.

**Scénarios d'acceptation** :

1. **Étant donné** l'écran du passage et une chambre libre, **quand** Yao touche un bouton de durée,
   **alors** l'occupation est créée **sans autre geste** — aucun bouton de soumission n'existe à
   l'écran.
2. **Étant donné** les quatre boutons de durée, **quand** on les lit, **alors** chacun porte **sa
   durée, son prix et son heure de fin**, et les trois viennent du **barème du jeu de données** — le
   HTML rendu ne contient aucun montant écrit en dur.
3. **Étant donné** l'écran de confirmation, **quand** on le lit, **alors** le **numéro de chambre**
   et l'**heure de fin** y sont les deux plus grands éléments de la page.
4. **Étant donné** l'enregistrement, **quand** il vient de se produire, **alors** un bandeau
   d'annulation reste **en surimpression** — jamais en flux — pendant un délai borné, et l'annulation
   libère l'occupation.
5. **Étant donné** un passage enregistré, **quand** on inspecte l'écriture, **alors** elle porte un
   **UUID v7 généré côté client** et un montant **entier en unités mineures** avec `XOF`.
6. **Étant donné** le parcours complet, **quand** le test le compte, **alors** il tient en **3 taps
   et 0 frappe**, et le test **échoue** au-delà.

---

### Récit 2 — Le client est reconnu à son numéro, et il n'y a rien à ressaisir (Priorité : P1)

Le client donne son numéro. Yao le saisit ; **au septième chiffre**, la fiche remonte : *« M.
Bakayoko — 7ᵉ passage. Reconnu au 07 08 44 12 90. Pièce enregistrée le 2 juin — rien à ressaisir. Il
prend la 111 depuis quatre fois : elle vous est proposée. »* Un bouton « Ce n'est pas lui » permet de
refuser la reconnaissance en un tap. Le reste du parcours est **identique** au passage anonyme.

**Pourquoi cette priorité** : c'est l'objectif des 60 secondes de SEJ-02, et c'est ce qui fait la
différence entre un fichier client qui sert et un fichier client qu'on remplit sans jamais le lire.

**Scénarios d'acceptation** :

1. **Étant donné** une recherche par téléphone, nom ou numéro de pièce, **quand** la saisie atteint
   le seuil de déclenchement, **alors** les résultats s'affichent **sans geste de validation**.
2. **Étant donné** un client reconnu, **quand** l'écran l'annonce, **alors** il dit **ce qui est déjà
   connu et ne sera pas redemandé** — la pièce et sa date de capture —, et il propose **la chambre
   habituelle** avec le motif de la proposition.
3. **Étant donné** la reconnaissance, **quand** elle est fausse, **alors** « **Ce n'est pas lui** »
   la défait **en un tap** et rend le parcours anonyme.
4. **Étant donné** le parcours complet d'un client connu, **quand** le test le compte, **alors** il
   tient en **5 taps et 10 frappes**, et le test échoue au-delà.

---

### Récit 3 — Deux occupations ne peuvent pas se chevaucher, et le refus nomme le conflit (Priorité : P1)

Adjoua tente de donner la chambre 111 de 14 h à 17 h alors qu'elle est déjà prise de 15 h à 12 h le
lendemain. **L'écran refuse**, et il ne dit pas « erreur » : il dit « **Cette chambre est déjà prise
sur cette période.** », **nomme l'occupation qui l'occupe** et **propose les chambres libres de la
même catégorie**. Quand le conflit porte sur ce qui vient **après** — une prolongation qui mordrait
sur la nuit suivante —, la phrase change : « **Cette chambre est réservée à partir de 15 h 00.** »

**Pourquoi cette priorité** : en phase 3, la contrainte d'exclusion de la base le garantira ; en
phase 2, **c'est l'écran qui doit déjà savoir le dire**. Un écran qui accepte en phase 2 ce que le
serveur refusera en phase 3 est un écran à refaire, et le mensonge ne se découvre qu'au branchement
(`user-stories-v1.md` §0.7).

**Vérification indépendante** : depuis `/_scenarios`, charger un jeu où deux occupations se
chevauchent, tenter la création, lire le HTML rendu.

**Scénarios d'acceptation** :

1. **Étant donné** une chambre occupée sur `[15 h, 12 h+1)`, **quand** on tente `[14 h, 17 h)`,
   **alors** la création est **refusée**, et **aucune occupation n'est créée**.
2. **Étant donné** ce refus, **quand** on lit le message, **alors** il **nomme la période qui
   bloque** et **liste les chambres libres de la même catégorie**. *Un message générique est un
   défaut : c'est la différence entre un refus qu'Adjoua peut expliquer au client et un refus qu'elle
   contournera.*
3. **Étant donné** le **temps de remise en état**, **quand** une occupation se termine, **alors** la
   chambre reste **indisponible** pendant la durée lue au référentiel, et une tentative sur ce
   créneau est refusée **en le nommant** — « Chambre indisponible 30 min (ménage) ».
4. **Étant donné** une demi-journée, **quand** on tente de n'en louer qu'une partie, **alors** le
   refus dit « **Une demi-journée se loue en entier : 8 h – 12 h ou 13 h – 16 h** », **avec les
   plages de l'établissement**, jamais des heures écrites en dur.
5. **Étant donné** le HTML rendu de n'importe quel refus, **quand** on y cherche les mots
   « conflit », « chevauchement », « occupation », « intervalle » et « contrainte », **alors**
   **aucun ne s'y trouve**.

---

### Récit 4 — Le total provisoire est là avant qu'on l'ait demandé (Priorité : P1)

Adjoua ouvre la note de la chambre 204. Les lignes sont groupées par service — Hébergement,
Restaurant, Bar, Autres frais — chacune avec **son sous-total**. En bas, dans un **pied épinglé qui
ne défile jamais**, le **total provisoire** : 286 360 F, toutes taxes comprises, à l'instant, avec la
mention de l'avance déjà versée et de ce qui resterait à payer aujourd'hui. **Aucun bouton
« calculer » n'existe.**

**Pourquoi cette priorité** : c'est l'un des cinq problèmes explicites du cahier des charges du
pilote (SEJ-03). Un total qu'il faut demander est un total qu'on ne regarde pas.

**Scénarios d'acceptation** :

1. **Étant donné** l'ouverture de la note, **quand** le **premier rendu** apparaît, **alors** le
   total y est **déjà présent** : il n'existe **aucun état de l'écran où les lignes sont visibles et
   le total absent**.
2. **Étant donné** une liste de lignes plus haute que l'écran, **quand** on fait défiler, **alors**
   le total **reste visible** — il est dans un pied épinglé, jamais en fin de liste.
3. **Étant donné** une ligne portée sur la note, **quand** elle s'ajoute, **alors** le total se
   recalcule **sans rechargement et sans geste**.
4. **Étant donné** le pied de la note, **quand** on le lit, **alors** il porte la mention
   « **Document non fiscal — ne tient pas lieu de facture** », et cette mention est **imprimée sur
   chaque copie remise au client**.
5. **Étant donné** le bloc des taxes, **quand** on le lit, **alors** la **taxe de séjour est une
   ligne distincte**, avec son assiette en clair, et elle **n'est jamais fondue dans le prix de la
   chambre**. ⚠️ **Son assiette est le séjour, pas la personne** : avec la règle seed
   `une_nuitee_par_occupation`, la note de la chambre 204 porte **500 F pour les quatre nuits et les
   deux personnes**, et son total est **282 860 F**. *La maquette affiche 4 000 F et « par personne
   et par nuit » : elle a été dessinée avant la clôture de la décision B-10, et le test doit refuser
   sa valeur.* **(D-05a)**
6. **Étant donné** une note de **passage** ou de **demi-journée**, **quand** on lit son bloc de
   taxes, **alors** **aucune ligne de taxe de séjour n'y figure** — ces deux formules ne sont pas
   assujetties. **(D-05b)**
7. **Étant donné** `R6` **Note temps réel**, **quand** on la compare à `R7`, **alors** elle porte les
   mêmes lignes, les mêmes sous-totaux et le même total, **sans l'action finale**.
8. **Étant donné** `R5` **Fiche client**, **quand** on l'ouvre, **alors** elle **ne porte aucun bloc
   de total** : additionner les séjours d'un client afficherait un chiffre qui **ressemble à un
   solde**, et l'exploitant y chercherait ce que le client doit.

---

### Récit 5 — Le client part, les impôts répondent — ou pas (Priorité : P1)

Adjoua touche « Faire partir le client ». Le compte final s'affiche, la taxe de séjour est **figée à
cet instant**, elle encaisse en espèces, et l'envoi part. Trois choses peuvent arriver **pendant que
le client est debout devant le comptoir** :

- **Succès** — le numéro officiel revient en cinq à dix secondes.
- **Échec** — *« Les impôts ont refusé la facture »*, avec **le motif en clair** : le numéro de
  contribuable a douze chiffres au lieu de treize. Deux issues sont offertes : corriger et renvoyer,
  ou **émettre sans numéro de contribuable** — la facture sera valide, le client ne pourra
  simplement pas la déduire.
- **Indéterminé** — au-delà de la butée d'attente, *« Nous ne savons pas si les impôts ont reçu cette
  facture »*. **Aucun renvoi automatique** : un second envoi créerait une seconde facture réelle chez
  l'administration, et elle ne s'annule pas côté client.

Dans les trois cas, le même bloc dit ce qui est **déjà acquis** : l'argent est encaissé, la note est
arrêtée, la chambre est libérée pour le ménage. Et dans les trois cas, Adjoua peut **laisser partir
le client** — il recevra sa facture dès qu'elle arrive.

**Pourquoi cette priorité** : c'est le moment où le produit se casse ou tient. Une erreur technique
affichée devant un client debout est une erreur qui se règle en espèces et hors du logiciel.

**Vérification indépendante** : les trois issues sont **pilotables depuis `/_scenarios`** — le
panneau du cycle F1 gagne un levier « issue de l'envoi fiscal ». Aucun réseau, aucune clé.

**Scénarios d'acceptation** :

1. **Étant donné** un départ, **quand** l'envoi est en cours, **alors** l'écran dit **combien de
   temps cela prend** et **ce qui ne dépend pas de l'attente** — les trois faits déjà acquis, chacun
   avec sa coche.
2. **Étant donné** l'issue **succès**, **quand** elle arrive, **alors** le document porte son numéro
   officiel, et la mention « document non fiscal » **disparaît**.
3. **Étant donné** l'issue **échec**, **quand** elle arrive, **alors** l'écran affiche **le motif en
   clair** — jamais un code seul —, **le détail technique en petit** en dessous, et **deux issues
   praticables**.
4. **Étant donné** l'issue **indéterminée**, **quand** elle arrive, **alors** **aucun renvoi
   automatique n'est déclenché**, l'écran dit qu'on ne sait pas, et il dit **ce qu'on peut faire**
   — le rapprochement manuel est du cycle F6, et l'écran le nomme sans l'ouvrir.
5. **Étant donné** l'un quelconque des trois cas, **quand** on lit l'écran, **alors** on y trouve
   séparément « **la note est arrêtée** » et l'état du règlement : **arrêtée n'est pas réglée**.
6. **Étant donné** le HTML rendu, **quand** on y cherche « certification », « FNE », « idempotence »,
   « rejeu » et « file d'attente », **alors** **aucun ne s'y trouve**.

---

### Récit 6 — Le planning montre des heures, pas des cases de journée (Priorité : P2)

Adjoua ouvre le planning de la semaine. Chaque chambre est une ligne, le temps est un **ruban
horizontal à granularité horaire** : un passage de 3 h se lit comme un bloc de 3 h, une demi-journée
comme une plage de 8 h à 13 h, une nuitée comme une barre qui traverse la nuit. Entre deux
occupations, une **hachure** montre le temps de remise en état. Un trait rouge marque **maintenant**.
Le ruban est **élastique** : les heures occupées s'étirent, les nuits mortes et les jours lointains
se replient — c'est ce qui permet d'afficher **34 occupations sur une semaine** sans que le passage
de 14 h à 17 h devienne invisible.

**Pourquoi cette priorité** : c'est ce qui distingue ce planning de tout planning hôtelier existant.
Un planning à la journée écrase la formule qui fait le volume du marché.

**Scénarios d'acceptation** :

1. **Étant donné** un passage de 1 h et une nuitée sur la même chambre le même jour, **quand** on lit
   le planning, **alors** les deux sont **distincts et lisibles**, et le passage n'est pas absorbé
   par la case du jour.
2. **Étant donné** deux occupations consécutives, **quand** on regarde entre elles, **alors** le
   **temps de remise en état est visible**, hachuré, avec sa durée à l'infobulle.
3. **Étant donné** les largeurs des barres, **quand** on les inspecte, **alors** elles sont
   **calculées depuis les intervalles**, jamais écrites : un jeu de données changé déplace les barres
   sans qu'une valeur soit retouchée.
4. **Étant donné** la semaine dense — 34 occupations, passages et nuits mêlés —, **quand** on la
   compare à la semaine calme — 9 occupations —, **alors** les deux tiennent dans la même largeur, et
   **aucune barre ne descend sous le seuil de lisibilité** sans être signalée.
5. **Étant donné** les quatre familles de formules, **quand** on lit la légende, **alors** nuitée,
   passage, demi-journée et remise en état sont **distinguées par la forme autant que par la
   couleur** — le mode sombre ne doit rien perdre.
6. **Étant donné** une barre du planning, **quand** on la touche, **alors** elle ouvre la note ou le
   séjour correspondant, sans écran intermédiaire.

---

### Récit 7 — Hors ligne, le passage n'est pas grisé : il est absent, et l'écran dit pourquoi (Priorité : P2)

Yao passe hors ligne — le levier du panneau `/_scenarios`, posé au cycle F1. **Avant même qu'il
touche quoi que ce soit**, l'écran a changé : le bouton « Donner une chambre » **n'est plus dans le
HTML**, et un bandeau dit « **Cette action nécessite internet.** » avec ce qui reste possible — lire
le planning, lire une note, consulter une fiche client. Rien n'est grisé. Rien n'est mis en file
« au cas où ».

**Pourquoi cette priorité** : c'est l'invariante la plus coûteuse à rétrofitter, et c'est le point
d'attention explicite de ce cycle. Une opération de classe B atteignable depuis un chemin exécutable
hors ligne **fait échouer le build** (constitution §6).

**Vérification indépendante** : basculer hors ligne depuis `/_scenarios`, chercher l'action dans le
HTML rendu. Le test porte sur **le HTML rendu**, pas sur un attribut `disabled`.

**Scénarios d'acceptation** :

1. **Étant donné** l'état hors ligne, **quand** on cherche dans le HTML rendu l'action de donner une
   chambre, d'arrêter une note ou de faire partir un client, **alors** **aucune des trois n'y est**.
2. **Étant donné** cette absence, **quand** on lit l'écran, **alors** il porte la phrase exacte du
   lexique — « **Cette action nécessite internet.** » / *This action requires an internet
   connection.* — et **ce qu'on peut faire à la place**.
3. **Étant donné** la garde, **quand** on regarde où elle vit, **alors** elle est **dans la fonction
   d'appel de la couture, pas dans le composant** : un second composant qui appellerait la même
   fonction serait couvert sans le savoir.
4. **Étant donné** les lectures — planning, note, fiche client, catalogue —, **quand** on est hors
   ligne, **alors** elles **restent disponibles**, avec leur **fraîcheur affichée**.
5. **Étant donné** une **création de fiche client** hors ligne, **quand** l'utilisateur s'en approche,
   **alors** elle est **refusée avant la saisie** : `client` est de **classe C**, et non B.
6. **Étant donné** le HTML rendu de tout l'écran, **quand** on y cherche « classe B », « classe C » ou
   le mot « classe » suivi d'une lettre, **alors** **rien**.

---

### Récit 8 — Un passage dépasse son heure, et le tarif suit tout seul (Priorité : P2)

Un client est parti à 19 h alors qu'il avait pris 2 h à 15 h 30. Au départ, la durée réelle est
calculée **sur l'horodatage d'autorité**, le palier supérieur s'applique, la différence s'ajoute à la
note **et la ligne dit pourquoi** : « Durée dépassée : passé au tarif 4 h ». Au-delà du seuil de
l'établissement, l'écran **annonce la bascule en nuitée avant de l'appliquer**, avec le montant
résultant, et demande confirmation.

**Scénarios d'acceptation** :

1. **Étant donné** un passage dont la durée réelle franchit un palier, **quand** on ouvre le départ,
   **alors** la note porte **la ligne de rebascule avec son motif en clair**, et l'ancienne ligne
   **reste visible**.
2. **Étant donné** un dépassement au-delà du seuil de bascule, **quand** on ouvre le départ,
   **alors** l'écran **annonce le changement de tarif avant qu'il ne s'applique**, avec le montant,
   et **attend une confirmation** — le seuil vient de la formule, jamais d'une constante.
3. **Étant donné** le calcul de durée, **quand** on l'inspecte, **alors** il lit **l'horloge de la
   couture**, jamais `Date.now()` dans un composant.
4. **Étant donné** une **dérive d'horloge** simulée au-delà du seuil, **quand** elle est détectée,
   **alors** l'écran affiche la phrase du sens correspondant **suivie de** « Les durées et les
   montants restent calculés sur l'heure du serveur. » — la seconde phrase est **obligatoire**.

---

### Récit 9 — Adjoua cherche un client et lit son historique (Priorité : P3)

Adjoua tape trois lettres. La liste des clients se filtre — par nom, par téléphone ou par numéro de
pièce. Elle ouvre une fiche : identité, préférences, **historique des séjours**, et **aucun total**.

**Scénarios d'acceptation** :

1. **Étant donné** 10 000 fiches simulées, **quand** on saisit un critère, **alors** les résultats
   s'affichent **sans geste de validation** et **en moins de 300 ms** — le seuil est celui de
   SEJ-01, et il est mesuré, jamais apprécié.
2. **Étant donné** une fiche ouverte, **quand** on la lit, **alors** l'historique des séjours y est,
   et **aucun montant cumulé** n'y figure.
3. **Étant donné** la recherche, **quand** on cherche « Kouamé », **alors** **la femme de ménage
   n'apparaît pas** : un client est une **personne qualifiée cliente**, et la fiche client n'est pas
   la fiche personne.

---

### Cas limites

- **Tout est pris.** Douze chambres sur douze occupées à 15 h 30. L'écran n'est pas vide : il dit
  « Les 12 chambres sont prises », **ce qui se libère et quand**, et propose de **tenir la première
  qui se libère** pendant un délai borné, relâchée toute seule ensuite.
- **Le client refuse la chambre proposée alors que l'occupation vient d'être créée.** Le bandeau
  d'annulation couvre ce cas ; au-delà du délai, l'annulation devient un geste tracé.
- **Une consommation arrive du bar pendant que la note est en cours d'arrêt.** Le cas nominal du
  §11.4 : l'écriture orpheline. Ce cycle **ne construit pas** l'écran de réconciliation (cycle F6),
  mais la couture **doit déjà refuser d'ajouter une ligne à une note arrêtée**, avec la phrase
  correspondante.
- **Un séjour déjà terminé.** « Ce séjour est déjà terminé. » — et à la prolongation, « On ne
  prolonge pas un séjour terminé. » La phrase dit **la règle**, pas l'état.
- **Une prolongation qui mord sur l'occupation suivante.** Refus nommé, avec l'heure et les chambres
  libres de la même catégorie.
- **Un changement de chambre en cours de séjour.** Deux intervalles, historique conservé, et refus
  distinct si la chambre cible n'est pas libre **sur la période restante**.
- **Une durée de passage inférieure au minimum ou supérieure au maximum de la formule.** « Cette
  formule se loue de 1 h à 8 h » — les deux bornes viennent de la formule.
- **Une fin d'intervalle antérieure à son début.** « La fin doit être après le début. »
- **Une formule qui ne s'applique pas à la catégorie de la chambre.** « Cette formule ne s'applique
  pas à cette chambre. »
- **Le jeu de données vide** (levier du cycle F1). Le planning, la note et le passage ont chacun leur
  état vide **illustré et nommé**, jamais une page blanche.
- **Le passage d'un client sans aucune identité, à la fermeture de la caisse.** La fiche de police
  existe, numérotée, en « Identité à compléter » — et la caisse doit pouvoir dire combien il en
  reste. Le blocage de clôture est du cycle F5 ; ici, le compte doit être lisible.
- **Deux réceptionnistes sur deux postes donnent la même chambre à la même seconde.** En phase 2, un
  seul poste existe : le cas est **simulé** par un jeu où l'occupation apparaît entre l'affichage et
  le tap. L'écran doit refuser au moment du tap, pas au moment de l'affichage.
- **Un mode sombre sur le planning dense.** Les quatre familles doivent rester distinguables sans
  s'appuyer sur la seule teinte.

---

## Exigences *(obligatoire)*

### Exigences fonctionnelles

**A · Le passage — `R4`, cinq états**

- **FR-001** : L'écran du passage **DOIT** poser **une seule question** — la durée — et la résoudre
  **en un geste**. Aucun bouton de soumission **NE DOIT** exister. **(arbitrage B)**
- **FR-002** : Chaque bouton de durée **DOIT** porter **sa durée, son prix et son heure de fin**, les
  trois **lus au barème du jeu de données**. Aucun montant **NE DOIT** être écrit dans le balisage.
  **(D-06)**
- **FR-003** : Une chambre libre **DOIT** être **proposée automatiquement**, avec le motif de la
  proposition quand il existe (chambre habituelle du client reconnu). La grille des chambres **DOIT**
  permettre d'en changer **en un tap**, et seules les chambres réellement disponibles **DOIVENT**
  être touchables.
- **FR-004** : L'écran de confirmation **DOIT** afficher le **numéro de chambre** et l'**heure de
  fin** comme les deux plus grands éléments de la page — c'est ce qu'on dit à voix haute au client.
- **FR-005** : L'identité **DOIT** être réduite au strict nécessaire légal et **DOIT** pouvoir être
  complétée **après la remise de la clé**. L'écran **DOIT** le dire : *« Pièce d'identité : après la
  clé, pas avant. »* **(voir « ce qui dépasse », point 1)**
- **FR-006** : Une **fiche de police DOIT** être créée et **numérotée** dès la remise de la clé, en
  état « **Identité à compléter** ». **(D-13)**
- **FR-006a** : Le tap sur la durée **DOIT** produire, **en un seul geste** : l'occupation, le
  séjour, la note **ouverte puis arrêtée**, l'**encaissement en espèces** du montant du bouton, et la
  fiche de police à compléter. **(D-19)**
- **FR-007** : Un **bandeau d'annulation DOIT** rester disponible **8 secondes** après
  l'enregistrement, **en surimpression dans l'écran, jamais en flux**, et son annulation **DOIT**
  libérer l'occupation **et défaire l'encaissement**. *Il n'est pas un confort : un tap produisant
  ici un effet monétaire irréversible, il en est la **seule** protection.* **(D-19)**
- **FR-008** : L'état « **tout est pris** » **DOIT** afficher **ce qui se libère et quand**, et
  proposer de **garder** la première chambre libérée. La garde **DOIT** être une **occupation de
  motif `RESERVATION`** d'une durée bornée — **15 min** par défaut — **relâchée automatiquement**, et
  **DOIT** donc être **soumise au même refus de chevauchement** que toute autre occupation. Libellés :
  « **Garder la chambre** », « **Tenue jusqu'à {heure}** ». ⛔ Jamais « réserver ». **(D-20)**
- **FR-009** : L'écran **DOIT** porter `data-zone="vitesse"` : durées réduites, décalage de liste
  supprimé, élastique remplacé par un déplacement. **(`theme.css`, régime de mouvement)**

**B · L'arrivée longue — `R3`**

- **FR-010** : `R3` **DOIT** hériter de la grammaire de `R4` : même zone, **dernier geste = le tap
  sur la chambre**, **aucun bouton de soumission**. **(arbitrage B)**
- **FR-011** : Un **client connu DOIT** être **pré-rempli intégralement** — aucune ressaisie. **(SEJ-02)**
- **FR-012** : Les **accompagnants DOIVENT** pouvoir être ajoutés **par un nom seul**. Exiger une
  pièce par accompagnant coûterait la cible des 60 secondes. **(`lexique.md` L165)**
- **FR-013** : Le nombre d'accompagnants **NE DOIT ENTRER DANS AUCUN CALCUL DE TAXE**. Il est
  enregistré au constat (`nombre_personnes`) **à titre indicatif** : il documente le séjour. *La
  taxe est due **par nuitée et par séjour** — un couple en chambre double paie une taxe, pas deux
  (décision B-10, close le 2026-08-03). Multiplier par les personnes est l'erreur que la maquette
  `R7` porte encore, et elle se paierait en trop-perçu sur chaque note.* **(D-05a)**
- **FR-014** : Le **numéro de pièce** et le **type de pièce** de l'accompagnant **DOIVENT** être
  portés par l'accompagnant lui-même, **jamais par une fiche client créée pour l'occasion** — lui en
  créer une ferait entrer au fichier des personnes qui n'ont rien demandé.

**C · La disponibilité et son refus**

- **FR-015** : Une occupation **DOIT** porter **deux intervalles `[début, fin)` horodatés**, jamais
  une paire de dates : `periode` — ce qui est occupé **et facturé** — et `periode_indisponibilite` =
  `periode` + le temps de remise en état, avec `periode_indisponibilite ⊇ periode`. **(constitution
  §4, D-21)**
- **FR-016** : Deux occupations dont les **`periode_indisponibilite` se chevauchent** sur la même
  chambre **DOIVENT** être **impossibles à créer** — c'est sur cette période-là que porte le refus,
  pas sur la période facturée. En phase 2, la couture **DOIT** refuser ; en phase 3, la contrainte
  d'exclusion le garantira. Une occupation **annulée NE DOIT PAS** bloquer. **(D-21)**
- **FR-017** : Le refus **DOIT** nommer le conflit : la **période qui bloque** et **les chambres
  libres de la même catégorie**. Un message générique **EST un défaut**. **(D-03, D-04)**
- **FR-018** : Le **temps de remise en état DOIT** être **posé par le domaine** dans
  `periode_indisponibilite` — `periode.fin + durée lue au référentiel` — et **DOIT** être **visible**,
  au planning comme dans le refus. **(D-10, D-21)**
- **FR-019** : Les **plages de demi-journée DOIVENT** être **non fractionnables**, et le refus
  correspondant **DOIT** recevoir les plages de l'établissement. **(D-12)**
- **FR-020** : Le **statut d'occupation** d'une chambre **DOIT** être **dérivé** des occupations.
  Seul le **sous-statut ménage DOIT** être modifiable directement. **(D-17)**
- **FR-021** : Les refus de disponibilité **DOIVENT** couvrir les six cas nommés au lexique :
  chambre déjà prise · occupation suivante · chambre cible occupée · demi-journée fractionnée ·
  intervalle invalide · durée hors contrainte de la formule.
- **FR-021a** : Un passage dont la durée réelle franchit un palier **DOIT rebasculer automatiquement
  sur le palier supérieur**, la différence portée à la note **comme une ligne distincte avec son
  motif en clair** — « Durée dépassée : passé au tarif 4 h » —, **l'ancienne ligne restant visible**.
  La durée réelle **DOIT** venir de l'horodatage d'autorité. **(HEB-04, D-18)**
- **FR-021b** : Au-delà du **seuil de bascule en nuitée**, l'écran **DOIT annoncer le changement de
  tarif AVANT qu'il ne s'applique**, avec le **montant résultant**, et **DOIT attendre une
  confirmation**. Le seuil vient de la formule, **jamais d'une constante**. *C'est la raison d'être
  de la phrase : trop sèche, elle ressemble à un refus ; trop douce, elle passe inaperçue.*
  **(`lexique.md`, `bascule_formule_non_confirmee`)**
- **FR-022** : Le vocabulaire de la mécanique — occupation, intervalle, palier, exclusion, conflit,
  chevauchement — **NE DOIT** apparaître **ni à l'écran, ni dans une route, ni dans une clé i18n
  visible**. **(D-02)**

**D · La note — `R6` et `R7`, le motif du document à lignes**

- **FR-023** : La note **DOIT** grouper ses lignes **par service**, chaque groupe avec **son
  sous-total**, puis un bloc de taxes, puis un **total**.
- **FR-024** : Le **total DOIT** être présent **dans le premier rendu de l'écran**. Il **NE DOIT
  EXISTER AUCUN** état où les lignes sont visibles et le total absent, et **aucun geste NE DOIT** le
  précéder. Il est un **cache de lecture recalculé depuis les lignes** : le total **opposable** est
  celui du document fiscal certifié, **jamais celui-ci**, et l'écran ne **DOIT** jamais le présenter
  comme définitif tant que la note est ouverte. **(SEJ-03, correction 4)**
- **FR-025** : Le total **DOIT** être dans un **pied épinglé** qui ne défile jamais.
- **FR-026** : Le total **DOIT** se recalculer **sans rechargement ni geste** à l'ajout d'une ligne.
- **FR-027** : La **taxe de séjour DOIT** être une **ligne distincte**, avec **son assiette en
  clair**, et **NE DOIT JAMAIS** être fondue dans le prix de la chambre. **(D-05)**
- **FR-027a** : Son assiette **DOIT** être **la nuitée et le séjour, jamais la personne**, et le
  montant **DOIT** venir de la **règle de conversion de la formule** — `une_nuitee_par_occupation`
  ou `au_prorata` —, jamais d'une multiplication écrite dans un composant. Les formules **non
  assujetties — passage et demi-journée par défaut — NE DOIVENT produire aucune ligne**. Le test
  doré **DOIT** couvrir les deux règles **et** le cas non assujetti. **(D-05a, D-05b)**
- **FR-027b** : Le **constat de taxe DOIT** enregistrer, en plus du montant, les **nuitées
  assujetties**, le **nombre de personnes à titre indicatif** et **l'identifiant de la règle
  appliquée** — c'est ce qui permet de relire **pourquoi** ce montant sans rejouer un calcul dont les
  paramètres ont changé. Il est **figé au départ** et **jamais modifié ensuite**. **(§9.6, SEJ-04)**
- **FR-028** : La **TVA** et la **taxe de développement touristique DOIVENT** être des lignes
  distinctes elles aussi, et leurs taux **DOIVENT** venir du paramétrage, jamais d'une constante.
- **FR-029** : Tout document opérationnel — note, fiche de police — **DOIT** porter la mention
  « **Document non fiscal — ne tient pas lieu de facture** », **imprimée sur chaque copie**.
  **(constitution §5)**
- **FR-029a** : Les deux gestes d'impression que portent les maquettes — « **Imprimer le reçu** »
  sur `R4` et « **Imprimer la note** » sur `R7` — **DOIVENT** passer par le `PlatformAdapter`, et
  **DOIVENT annoncer l'alternative** quand la capacité est absente, avec la phrase déjà livrée au
  cycle F1. **Aucun composant NE DOIT** appeler une API d'impression directement. ⚠️ **Le rendu du
  document au gabarit thermique reste du cycle F6** : ce cycle **branche le geste**, il ne dessine
  pas le ticket. *Sans cette exigence, les deux boutons de la maquette seraient livrés morts — ou,
  pire, appelleraient `window.print()` depuis un composant.*
- **FR-030** : Les sections de note que le produit **ne sert pas encore DOIVENT** se rendre **en
  creux, nommées**, plutôt que d'être supprimées. **(`derivation.md` L271)**
- **FR-031** : `R6` **DOIT** être `R7` **sans l'action finale**. `R5` **NE DOIT PORTER AUCUN bloc de
  total**. **(`derivation.md` L93, L96, L277)**
- **FR-032** : Une ligne **NE DOIT PAS** pouvoir s'ajouter à une note **arrêtée**, et le refus
  **DOIT** employer la phrase du lexique.
- **FR-033** : Tout montant **DOIT** être un **entier en unités mineures** accompagné de son code
  devise ; toute quantité **DOIT** être décimale. **(D-08)**

**E · Le départ et les trois issues**

- **FR-034** : Le départ **DOIT** afficher le **compte final avant tout encaissement**, et l'écran
  **DOIT** le dire : *« vous verrez le compte final avant d'encaisser quoi que ce soit. Rien n'est
  envoyé aux impôts d'ici là. »*
- **FR-035** : La **taxe de séjour DOIT** être **figée à l'instant du départ**. **(SEJ-04)**
- **FR-036** : L'écran **DOIT** distinguer **trois faits** avec trois phrases : la **note est
  arrêtée**, le **règlement est encaissé** (ou son solde restant), le **document est parti**.
  **Arrêtée n'est pas réglée.** **(arbitrage C)**
- **FR-037** : Les **trois issues** de l'envoi — **succès, échec, indéterminé** — **DOIVENT** être
  simulées et **pilotables depuis `/_scenarios`**.
- **FR-038** : Pendant l'attente, l'écran **DOIT** dire **combien de temps cela prend** et **lister ce
  qui est déjà acquis et ne dépend pas de l'attente**.
- **FR-039** : L'échec **DOIT** afficher **le motif en clair**, le détail technique **en second plan**,
  et **au moins deux issues praticables** — corriger et renvoyer, ou émettre sans le numéro manquant.
- **FR-040** : L'issue **indéterminée NE DOIT JAMAIS** déclencher de **renvoi automatique**. L'écran
  **DOIT** dire qu'on ne sait pas, et nommer le rapprochement manuel sans l'ouvrir — il est du cycle
  F6. **(constitution §5)**
- **FR-041** : Dans les trois cas, l'utilisateur **DOIT** pouvoir **laisser partir le client** sans
  attendre le numéro officiel.
- **FR-041a** : Le séjour en cours **DOIT** pouvoir être **prolongé** depuis la note : la
  disponibilité est vérifiée **sur l'intervalle étendu**, et le conflit avec l'occupation suivante
  est **signalé explicitement**, avec **son heure et les chambres libres de la même catégorie**. Un
  séjour terminé **NE DOIT PAS** être prolongeable, et le refus **DIT LA RÈGLE, pas l'état** — « On
  ne prolonge pas un séjour terminé. » **(SEJ-04)**
- **FR-041b** : La **chambre DOIT** pouvoir être changée en cours de séjour. Le changement **DOIT**
  produire **deux intervalles**, et **l'historique DOIT être conservé** — jamais une occupation
  modifiée en place. Le refus porte sur **ce qui reste du séjour**, et sa phrase est **distincte** de
  celle d'une période demandée : « Cette chambre n'est pas libre sur la période restante. »
  **(SEJ-04)**
- **FR-041c** : Un **départ anticipé DOIT** recalculer le compte et **tracer la régularisation** —
  la ligne d'origine **reste visible**, comme au rebascule de palier. **(SEJ-04)**
- **FR-041d** : Les trois opérations ci-dessus sont de **classe B** et **DOIVENT** donc disparaître
  hors ligne, au même titre que l'arrivée et le départ. *Elles portent chacune un effet sur la
  disponibilité : les laisser atteignables ferait promettre une chambre que le serveur refusera.*
- **FR-042** : Le départ **DOIT** permettre un **règlement en espèces uniquement**. Le multi-modes,
  le shift, le tiroir et le comptage **NE SONT PAS** de ce cycle. **(D-15)**
- **FR-043** : Le vocabulaire fiscal interne — certification, FNE, idempotence, rejeu, file d'attente
  — **NE DOIT** atteindre **ni l'écran ni une clé i18n visible**.

**F · Le planning — `V1`, deux états**

- **FR-044** : Le planning **DOIT** avoir une **granularité horaire** : un passage de 1 h à 4 h et une
  demi-journée **DOIVENT** être lisibles comme tels, jamais écrasés dans une case de journée.
- **FR-045** : Les **temps de remise en état DOIVENT** être visibles **entre deux occupations**, avec
  leur durée.
- **FR-046** : Les positions et largeurs des barres **DOIVENT** être **calculées depuis les
  intervalles**. Aucune position **NE DOIT** être écrite dans le balisage. **(D-11)**
- **FR-047** : Le planning **DOIT** tenir **la semaine dense** — 34 occupations, passages et nuits
  mêlés — dans la même largeur que la semaine calme, et **DOIT signaler** toute barre passée sous le
  seuil de lisibilité plutôt que de la rendre muette.
- **FR-048** : Les quatre familles — nuitée, passage, demi-journée, remise en état — **DOIVENT** être
  distinguées **par la forme autant que par la couleur**, en clair **et** en sombre.
- **FR-049** : Un trait **DOIT** marquer **maintenant**, et il **DOIT** venir de l'horloge de la
  couture. **(D-07)**
- **FR-050** : Toucher une barre **DOIT** ouvrir le séjour ou la note correspondante, **sans écran
  intermédiaire**.
- **FR-051** : Le planning **DOIT** être **consultable hors ligne**, avec **sa fraîcheur affichée**
  — c'est une lecture, donc de classe A.

**G · La vue du jour et la fiche client — `R2`, `R5`**

- **FR-052** : `R2` **DOIT** porter le point d'entrée du passage et celui de l'arrivée, et **DOIT**
  compter les gestes qu'il ajoute au parcours P1.
- **FR-053** : La recherche client **DOIT** porter sur **le nom, le téléphone et le numéro de pièce**,
  et **DOIT** rendre ses résultats **sans geste de validation**.
- **FR-054** : La fiche client **DOIT** montrer **l'historique des séjours** et **aucun cumul
  monétaire**. **(FR-031)**
- **FR-055** : La recherche client **NE DOIT JAMAIS** faire remonter une **personne non qualifiée
  cliente** — le personnel n'est pas dans le fichier client. **(`lexique.md` L164)**

**H · Hors ligne et classes**

- **FR-056** : Toute opération de **classe B — donner une chambre, arrêter une note, faire partir un
  client, prolonger, changer de chambre, mettre une chambre hors service — DOIT** être **ABSENTE du
  HTML rendu** hors ligne, jamais grisée, jamais mise en file. **(D-01, constitution §6)**
- **FR-057** : Le refus **DOIT** employer la phrase exacte du lexique — « **Cette action nécessite
  internet.** » / *This action requires an internet connection.* — annoncée **avant** la tentative, et
  **DOIT** dire **ce qu'on peut faire à la place**.
- **FR-058** : La **création ou modification d'une fiche client** est de **classe C** : elle **DOIT**
  être refusée hors ligne au même titre, et son refus **NE DOIT PAS** être confondu avec celui d'une
  classe B.
- **FR-059** : Les **préférences client, la note interne, la photo et le statut ménage** sont de
  **classe A** : ils **DOIVENT** rester possibles hors ligne et entrer dans la file.
- **FR-060** : La garde **DOIT** vivre **dans la fonction d'appel de la couture**, pas dans le
  composant. **(`CLAUDE.md`)**
- **FR-061** : Le test **DOIT** porter sur le **HTML rendu**, jamais sur un attribut `disabled`.
- **FR-062** : Les lettres de classe **NE DOIVENT JAMAIS** atteindre l'écran. **(D-16)**

**I · La couture de données et le jeu simulé**

- **FR-063** : Le cycle **DOIT** étendre `app/core/donnees/hebergement/` du **mouvement** :
  occupation, séjour, note, ligne de note, client, accompagnant, fiche de police — **une interface de
  domaine, une implémentation simulée**. La couture est **l'interface de domaine, jamais la requête
  HTTP**.
- **FR-064** : Le jeu simulé **DOIT** avoir **la forme du modèle** : mêmes noms de champs, mêmes
  types, mêmes valeurs d'énumération que `docs/modele-donnees/97-hebergement.sql`. **(DoD 12)**
- **FR-065** : Toute écriture **DOIT** porter un **UUID v7 généré côté client**. **(D-09)**
- **FR-066** : Le jeu **DOIT** couvrir les **dix états maquettés** — cinq de `R4`, trois de `R7`, deux
  de `V1` — **plus** l'issue indéterminée, **plus** la semaine dense.
- **FR-067** : Le calcul de durée, de prix et de taxe **DOIT** être **pur et testé sur un jeu de cas
  figés**, hors de tout composant. **(constitution §5)**
- **FR-068** : Le barème, les plages, les durées de remise en état, le seuil de bascule et les taux de
  taxe **DOIVENT** être lus au **référentiel du cycle F1**, jamais réécrits.
- **FR-069** : Le panneau `/_scenarios` **DOIT** gagner un levier **« issue de l'envoi fiscal »** à
  trois positions, un levier **« conflit de disponibilité »**, et un réglage de la **butée d'attente**
  — 10 s par défaut. **(D-22)**

**J · Le compte des gestes, et sa vérification**

- **FR-070** : Les **huit parcours** comptés dans ce document **DOIVENT** être exercés par des tests
  de navigateur, **sous la porte P-04**, qui **comptent les interactions**.
- **FR-071** : Un parcours qui **dépasse son budget de gestes DOIT** faire **échouer** la
  vérification. *Un objectif qu'aucune porte ne mesure est un souhait ; c'est précisément ce que ce
  cycle refuse.*
- **FR-072** : Le **barème de conversion** geste → seconde **DOIT** être déclaré **dans le dépôt, en
  un seul endroit**, et le rapport de cycle **DOIT** publier le compte réel de chaque parcours.
- **FR-073** : Le total provisoire **DOIT** être vérifié comme **présent au premier rendu** — le test
  **DOIT échouer** s'il existe un instant où les lignes sont là et le total absent.

**K · Documents mis à jour dans le même changement**

- **FR-074** : `docs/design/derivation.md` **DOIT** porter (a) la note de conception qui tranche le
  conflit de `R4-passage-hors-ligne.html`, (b) l'inscription du **quatrième état de `R7`** — l'issue
  indéterminée —, (c) **l'avertissement fiscal sur la ligne de taxe de `R7`**, et (d) le passage à
  « codé » des sept écrans, **dans le changement qui les livre**, jamais avant. *(a), (b) et (c) sont
  faits dans le même changement que cette spécification.*
- **FR-075** : `app/core/ecrans/index.ts` **DOIT** passer les sept écrans à `CONSTRUIT` avec leur
  route, **dans le changement qui les livre** — c'est ce qui fait disparaître les mentions « à venir ·
  cycle F3 » de l'accueil, sans que `R1` soit retouché.
- **FR-076** : ✅ **fait dans le même changement que cette spécification.**
  `docs/design/lexique.md` renvoyait à `FR-070` et `FR-073` — deux numéros qui appartiennent au
  **cycle F1** et y portent un tout autre objet (la porte P-04, l'absence de workflows GitHub). Les
  deux renvois désignent désormais **FR-017** et **FR-021b** de ce cycle, **qualifiés par leur
  dossier**. *Une référence croisée non qualifiée entre deux documents à numérotations
  indépendantes vieillit mal, et son erreur est invisible : rien ne relit un lexique contre une
  spécification.*
- **FR-077** : Tout écran inventé à l'implémentation **DOIT** être inscrit à `derivation.md` dans le
  même changement. Ce qu'on refuse, c'est de l'inventer en silence.
- **FR-078** : Les catalogues **fr et en DOIVENT** rester à **parité stricte**, et aucune chaîne
  visible **NE DOIT** être en dur. **(DoD 7)**

---

### Entités clés

- **Occupation** — **deux** intervalles `[début, fin)` sur une chambre : `periode` (occupée et
  facturée) et `periode_indisponibilite` (`periode` + remise en état), **c'est la seconde dont le
  chevauchement est impossible**. Motif : `SEJOUR` · `RESERVATION` · `MAINTENANCE` · `BLOCAGE` —
  la **garde de chambre** est un `RESERVATION` court. Statut : `ACTIVE` · `TERMINEE` · `ANNULEE`,
  une occupation annulée ne bloquant plus. Classe **B**.
- **Séjour** — le passage d'un client dans l'établissement, **quelle qu'en soit la durée** : deux
  heures de passage sont un séjour autant que trois nuits. Porte l'unité, la formule, l'occupation,
  les accompagnants et la note. **Son client est facultatif** — c'est ce qui rend le passage anonyme
  représentable. État : `EN_COURS` · `TERMINE` · `ANNULE`. Classe **B**.
- **Note de séjour** — le document à lignes, **une seule par séjour**. État : `OUVERTE` ·
  `ARRETEE` — et `ARRETEE` **déclenche le cas orphelin** : une consommation qui arrive après ne
  s'ajoute pas d'office. Son total est un **cache**, jamais l'opposable. Classe **B**.
- **Ligne de note** — hébergement, consommation, extra, remise, **rebascule de palier**. Porte son
  service d'origine, sa quantité décimale et son montant entier. Classe **B** — ou **la classe de la
  ligne d'origine** quand elle vient d'un point de vente.
- **Client** — la personne qui séjourne, **qualifiée cliente**, partagée entre les établissements du
  tenant. Classe **C** — c'est ce qui la distingue du séjour hors ligne.
- **Accompagnant** — une personne qui séjourne **avec** le client, **sans fiche à elle**, portant
  elle-même son numéro de pièce.
- **Fiche de police** — numérotée dès la remise de la clé, **complète ou à compléter**. Classe **B**.
- **Constat de taxe de séjour** — l'assiette **figée au départ**, **immuable par privilège** : ni
  modification ni suppression, parce qu'un changement de paramétrage ne doit pas réécrire une taxe
  déjà déclarée. Porte les **nuitées assujetties**, le **nombre de personnes à titre indicatif**, le
  montant, et **l'identifiant de la règle appliquée ce jour-là**.
- **Formule, barème de paliers, plage de demi-journée, temps de remise en état** — **référentiel déjà
  posé au cycle F1**, lu et jamais réécrit ici.
- **Issue d'envoi fiscal** — trois valeurs : **succès, échec, indéterminé**. Simulée, pilotable, et
  **jamais rejouée automatiquement** dans le troisième cas.

---

## Critères de succès *(obligatoire)*

### Résultats mesurables

- **SC-001** : Un **passage s'enregistre en 3 taps et 0 frappe** depuis la vue du jour, soit **6,8 s**
  au barème déclaré — **sous les 30 s** exigées, avec un facteur 4 de marge.
- **SC-002** : Un **client connu** s'enregistre en **5 taps et 10 frappes** au passage (**14,2 s**) et
  **7 taps et 10 frappes** à l'arrivée longue (**18,0 s**) — **sous les 60 s** exigées.
- **SC-003** : **Aucun parcours nominal ne dépasse son budget**, et un dépassement **fait rougir la
  vérification**.
- **SC-004** : Le **total provisoire est présent dans le premier rendu** de la note. Il n'existe
  **aucun** état de l'écran où les lignes sont visibles et le total absent.
- **SC-005** : Deux occupations chevauchantes sont **impossibles à créer** sur **100 %** des tentatives
  du jeu de conflits, et **100 %** des refus **nomment la période qui bloque et proposent une
  alternative**.
- **SC-006** : Les **trois issues** de l'envoi fiscal sont **atteignables depuis le panneau de
  scénarios**, et chacune a **son écran**, **sa phrase** et **ses issues praticables**.
- **SC-007** : L'issue indéterminée déclenche **zéro renvoi automatique**.
- **SC-008** : **Toute** opération de classe B ou C est **absente du HTML rendu** hors ligne, et
  **toute** lecture reste disponible avec sa fraîcheur.
- **SC-009** : Les mots « conflit », « chevauchement », « occupation », « intervalle », « palier »,
  « check-in », « check-out », « certification », « FNE », « rejeu » et « classe B » apparaissent
  **zéro fois** dans le HTML rendu **et** dans les catalogues i18n, **dans les deux langues**.
- **SC-010** : Les **sept écrans** sont atteignables en **clair et en sombre**, sous **Chromium et
  WebKit** — quatre suites, sous la porte P-04.
- **SC-011** : Un passage de 1 h et une nuitée du même jour sur la même chambre sont **tous deux
  lisibles** au planning ; le temps de remise en état l'est aussi.
- **SC-012** : La **semaine dense** — 34 occupations — s'affiche dans la même largeur que la semaine
  calme, sans qu'aucune barre devienne muette sans être signalée.
- **SC-013** : **Aucun montant, aucune durée, aucune plage et aucun taux** n'est écrit en dur dans un
  composant : tous viennent du référentiel ou du jeu.
- **SC-014** : **100 %** des écritures portent un **UUID v7 client**, et **100 %** des montants sont
  des **entiers en unités mineures** avec leur devise.
- **SC-015** : Le calcul de prix, de durée et de taxe passe un **test doré sur jeu de cas figés**,
  incluant le rebascule de palier, la bascule en nuitée, **les deux règles de conversion de la taxe**
  et **le cas non assujetti**.
- **SC-015a** : La taxe de séjour d'un séjour de **4 nuits à 2 personnes** vaut **500 F** sous la
  règle seed, et **le nombre de personnes ne la change pas** : le même séjour à 1 personne donne le
  même montant. *C'est le test qui refuse la valeur de la maquette.*
- **SC-018** : Le passage s'enregistre **et s'encaisse** en **un seul geste**, et son **annulation
  dans les 8 secondes défait les deux** — l'occupation et l'encaissement.
- **SC-016** : `scripts/verifier.sh` **passe en une commande**, portes comprises, **sans aucun
  contrôle lancé à la main en plus**.
- **SC-017** : La démonstration de fin de cycle est exécutable de bout en bout : *enregistrer un
  passage de 4 h en moins de 30 s, ouvrir une note, voir le planning à granularité horaire, faire un
  départ* (`user-stories-v1.md` §0.5, cycle F3).
- **SC-019** : La recherche client rend ses résultats **en moins de 300 ms sur 10 000 fiches**
  (SEJ-01) — **mesuré, jamais apprécié**.
- **SC-020** : **Prolongation, changement de chambre et départ anticipé** conservent
  **l'historique** — deux intervalles, jamais une occupation modifiée en place — et leurs refus sont
  **trois phrases distinctes**, jamais un message générique.

---

## Hypothèses

- **Le référentiel du cycle F1 suffit.** Catégories, unités, formules, barèmes, plages et temps de
  remise en état existent déjà dans `app/core/donnees/hebergement/` à la forme du modèle. Ce cycle les
  **lit** et ajoute le **mouvement**. Aucun écran de configuration n'est construit ici — c'est le
  cycle F7.
- **Le règlement se fait en espèces, et rien d'autre** — au tap de la durée pour le passage, à la
  sortie pour la nuitée. L'ouverture de shift, le multi-modes, le comptage et la clôture sont du
  cycle F5. La DoD de F3 exige de *« faire un départ »*, pas de tenir une caisse. **(D-15, D-19)**
- **Aucun shift n'est ouvert en phase 2**, alors que l'encaissement en suppose un en phase 3. Les
  règlements de ce cycle sont donc rattachés à un **shift simulé implicite**, et c'est le cycle F5
  qui les rattachera pour de bon. *Ce raccourci est nommé ici parce qu'il se découvrirait autrement
  au premier comptage de caisse.*
- **Le point d'entrée du passage passe par `R2`.** Aucune surface de l'accueil ne cible `R4`
  aujourd'hui ; le budget de gestes tient avec les deux taps que cela coûte, et ce cycle **ne modifie
  pas** les surfaces de l'accueil. Si la mesure terrain montrait que ces deux taps comptent, le cycle
  F7 pourra ajouter une surface — la décision est réversible, elle vit dans un seul fichier.
- **L'issue « indéterminée » se déclenche sur butée d'attente**, fixée par défaut à **10 s** et
  réglable au panneau de scénarios. Aucun document ne la chiffre : c'est un **paramètre de
  simulation**, pas une règle métier, et le vrai délai viendra de l'intégrateur en phase 3. **(D-22)**
- **La recherche client se déclenche à la saisie** : **3 caractères** pour un nom, **4 chiffres**
  pour un numéro de téléphone ou de pièce. Aucun document ne fixe ces seuils ; ils sont des
  paramètres, et la mesure terrain les ajustera.
- **La reconnaissance d'un client se déclenche à la saisie**, sans geste de validation, et son seuil
  est un paramètre.
- **La fiche de police simulée est numérotée par un compteur d'établissement** dont la continuité est
  vérifiée par test — un numéro manquant est une fiche dont personne ne sait si elle a existé.
- **Les 10 000 fiches de la recherche sont générées, pas écrites.** Le jeu nominal reste Deloria ;
  la volumétrie est un jeu à part, servant la seule mesure de la recherche.
- **Aucun écran de réconciliation n'est construit**, mais la couture refuse déjà d'écrire sur une note
  arrêtée — c'est le minimum qui empêche de mentir au branchement.

---

## Hors périmètre

- **Les réservations** — `RSV-01` à `RSV-05`, écran `V2` : cycle **F7**. Le planning de ce cycle
  affiche des **occupations**, pas des réservations. *Seule exception, et elle ne construit aucun
  écran* : la **garde de chambre** de l'état « tout est pris » est une occupation de motif
  `RESERVATION` de quinze minutes (D-20). Arrhes, statuts, expiration paramétrable et politique
  d'annulation restent entièrement hors périmètre.
- **La vente à un client sans hébergement** — `SEJ-05` : cycles **F4/F5**. §0.5 la listait dans les
  stories lues par F3, mais §0.6 et les tranches la placent en **T2 avec PDV et CAI**, et son écran
  est une **addition de point de vente** (`P3`, `C2`), pas un écran de réception. **(clarification
  du 2026-08-08)**
- **L'OCR de la pièce d'identité** — `SEJ-06`, écran `M5` : cycle **F4**. La saisie manuelle suffit
  ici, et c'est elle qui est mesurée.
- **La certification fiscale réelle** — aucune clé, aucun intégrateur, aucun appel. Trois issues
  simulées.
- **La caisse** — ouverture de shift, encaissement multi-modes, comptage, clôture : cycle **F5**.
- **La réconciliation d'une écriture orpheline** et **les cinq états d'un document fiscal** : cycle
  **F6**.
- **La configuration** — formules, barèmes, types de chambre, calendrier tarifaire : cycle **F7**.
- **Les provisions** — contrats et cautions (HEB-08), prestations incluses (HEB-09) : **tables de la
  phase 1 et nulle part ailleurs**.
- **L'impression thermique réelle** — en phase 2, l'équivalent est l'aperçu à l'écran au gabarit
  exact ; il appartient au cycle **F6** (IMP).

---

## Ce que ce cycle ne prouve pas

- **Ni que la contrainte de base tient.** Le refus de chevauchement est ici une décision de la
  couture. La garantie forte — `EXCLUDE USING gist` — est posée en phase 3, et c'est elle seule qui
  résiste à deux écritures concurrentes.
- **Ni que les 30 secondes tiennent au comptoir.** Le budget de gestes est mesuré, pas le geste réel
  d'un réceptionniste debout qui parle à un client. La mesure terrain est au jalon J0.
- **Ni que le barème est le bon.** Les seeds Deloria sont **à confirmer à l'atelier terrain**
  (décision B-07). Ce qui est prouvé, c'est qu'aucun montant n'est écrit en dur — donc qu'un barème
  changé ne coûte rien.
- **Ni que la taxe de séjour est calculée juste.** La règle de conversion pour le passage et la
  demi-journée attend l'avis du fiscaliste (décision B-02). Ce qui est prouvé, c'est que la règle est
  **un paramètre** et la taxe **une ligne distincte**.
- **Ni que l'attente de la DGI est supportable.** Cinq à dix secondes simulées ne sont pas cinq à dix
  secondes réelles devant un client. Ce qui est prouvé, c'est que **rien d'important ne dépend de
  l'attente**.
- **Ni la résistance aux coupures réelles** : le mode hors ligne reste un levier, pas une coupure.
