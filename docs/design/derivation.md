# Kaya — Matrice de dérivation des écrans

*Source de vérité de l'héritage visuel des écrans non maquettés. `docs/Kaya_Design.md` y renvoie.*

> **★ DÉRIVER D'UN COMPOSÉ EST INTERDIT ; S'EN RÉCLAMER COMME PRÉCÉDENT NE L'EST PAS.** La
> distinction est fine et elle se pose souvent. Un écran composé n'est **pas un motif de
> dérivation** : il n'a aucune maquette à ouvrir, aucune valeur exacte à respecter, et l'inscrire
> parmi les dérivés serait faux — on n'hérite pas d'un assemblage.
>
> Mais un composé **fait précédent de composition** : dire d'un écran qu'il reprend « une liste et
> un formulaire, motif posé par `G5` » signifie que l'assemblage a déjà été jugé acceptable sur
> cette forme-là. **Ce qui se transmet est le jugement sur l'assemblage, jamais un dessin.** C'est
> pourquoi la mention « à valider à l'atelier terrain » reste due à chaque composé : personne ne
> l'a dessiné, c'est une proposition.

---

## Les 46 écrans du produit

| Catégorie | Nombre | Référence |
|---|---|---|
| **Écrans maquettés** | **11** codes, **29 fichiers d'états** | `docs/design/html/{code}-{nom}[-{etat}].html` |
| **Écrans dérivés** | **32** | la matrice ci-dessous |
| **Écrans composés** | **3** | le tableau « Les écrans composés », ci-dessous |

Codes maquettés : `C4` `F2` `G2` `M4` `P2` `Q1` `R1` `R4` `R7` `S2` `V1`.

---

## Les écrans COMPOSÉS

*Troisième cas de `docs/Kaya_Design.md` §2. Un écran composé n'hérite d'aucun motif : il est
assemblé **uniquement** à partir des seize composants canoniques de `docs/design/composants.md`.*

**Les quatre conditions doivent être remplies, toutes**, et la vérification s'écrit dans la ligne :

1. liste, formulaire ou fiche suivant un motif déjà posé ;
2. conception **entièrement** issue de la bibliothèque — vérifiée composant par composant ;
3. consulté rarement, par un utilisateur formé ;
4. personne n'a de doute sur ce à quoi il ressemble.

Et une cinquième, qui n'est pas une condition mais une conséquence : **zone de charme uniquement**.
Un écran de comptoir se maquette toujours — l'utilisateur y est debout, pressé, avec un client en
face et de l'argent en jeu, et c'est là que le dessin décide de la vitesse.

| Écran | Composants employés | Mention | Vérification |
|---|---|---|---|
| `G5` Chambres et types de chambre | **08** ligne de liste · **16** champ de saisie (dont l'état « choix fermé ») · **01 · 02 · 03** actions · **11** état vide illustré · **13** squelette de chargement | **composé** · **à valider à l'atelier terrain** | Une liste et deux formulaires ; couverture par la bibliothèque vérifiée motif par motif ; Adjoua règle son parc à l'ouverture puis y revient à la marge ; zone de charme |
| **Notes internes** (`/notes`) | **08** ligne de liste (dont l'état « en attente d'envoi ») · **16** champ de saisie · **01** bouton principal · **11** état vide illustré · **13** squelette de chargement | **composé** · **à valider à l'atelier terrain** | **(1)** une liste et un formulaire, motif posé par `G5` · **(2)** conception entièrement issue de la bibliothèque, vérifiée composant par composant — aucun élément n'est hors des seize · **(3)** une note interne se consulte rarement, par un utilisateur formé : c'est ce que l'équipe se laisse d'un service à l'autre · **(4)** personne n'a de doute sur son apparence — une liste de textes horodatés et un champ. **Zone de charme** : ni client en face, ni argent en jeu |
| **Les articles** (`/articles`) | **08** ligne de liste · **16** champ de saisie (dont l'état « choix fermé » pour la catégorie et la destination) · **04** pastille d'état (disponible / indisponible) · **01 · 02 · 03** actions · **11** état vide illustré · **13** squelette de chargement | **composé** · **à valider à l'atelier terrain** | **(1)** une liste d'articles et deux formulaires — **motif de composition posé par `G5`**, dont c'est la forme exacte · **(2)** conception entièrement issue de la bibliothèque, vérifiée composant par composant — aucun élément n'est hors des seize · **(3)** Adjoua règle sa carte à l'ouverture puis y revient à la marge : exactement le régime de `G5` · **(4)** personne n'a de doute sur son apparence — une liste de lignes avec prix et pastille, et un formulaire. **Zone de charme** : référentiel et configuration, ni client en face, ni argent en jeu |

> **Pourquoi le choix du type de chambre emploie le composant 16 et non le 12.** La règle du
> composant 12 (contrôle segmenté) est explicite : « au-delà de quatre options c'est une liste, pas
> un segment ». Deloria a **six** types de chambre, salle de réunion comprise, et un segmenté à six
> options ne tient pas sur 372 px. C'est l'état « choix fermé » du composant 16 qui sert.
>
> **La mention « à valider à l'atelier terrain » n'est pas une formalité.** Un écran composé n'a
> aucune maquette contre laquelle comparer son rendu : le contrôle mécanique — jetons, thème sombre,
> parcours réel — le couvre, le jugement d'usage non. La mention dit ce qui reste dû.
>
> **Le réordonnancement des catégories n'invente aucun composant, et cela a été vérifié avant de
> conclure.** Aucun composant de glisser-déposer n'existe parmi les seize, et **on ne l'improvise
> pas** : le troisième cas exige une conception *entièrement* issue de la bibliothèque, et un motif
> inventé pour l'occasion disqualifierait l'écran du cas composé. L'ordre se règle donc par les
> **actions de bord au survol** de la ligne de liste — composant 08, règle explicite : « les actions
> de bord n'apparaissent qu'au survol » — en boutons discrets (composant 03). Aucun motif ne
> manque, donc l'écran se code.
>
> **La route est `/articles`, jamais `/catalogue`.** *Le nom du fichier de page décide de la route,
> et une URL est visible* — c'est ce qui fait que `S1` s'appelle `/mes-envois` et non
> `/synchronisation`. La maquette `P2` emploie « article » comme mot visible (« Chercher un
> article », « 7 articles dans Bières ») ; « catalogue » est le mot de la table.
>
> **Le sous-écran des destinations de préparation n'ouvre pas de route propre** : il relève du même
> motif composé, et une destination n'a de sens qu'au regard des articles qui l'emploient.
>
> **Ce que l'écran de notes ajoute au composant 08, et qui n'est pas un état nouveau.** La ligne
> « en attente d'envoi » **figure déjà** dans les états du composant 08 (`composants.md` §08 :
> « repos · survol · sélectionnée · **en attente d'envoi** · annulée · ligne de total »). Le premier
> écran qui écrit en classe A l'emploie — il ne l'invente pas.

---

## Les 32 écrans DÉRIVÉS

C'est le tableau qui rend sûr le fait de coder directement : chaque écran déclare de quel motif il hérite. **Un écran qui n'hérite d'aucun motif se code quand même, mais il s'inscrit ici** — quatrième cas de la règle opposable, en fin de document.

| Écran | Hérite de | Ce qui change |
|---|---|---|
| `R0` Connexion — **route `/connexion`**, construit au cycle **F2** | `G2` | Formulaire minimal ; états d'erreur et vides de `S3`. ⚠️ **Le seul écran du produit SANS en-tête de contexte** (FR-009) : avant l'entrée, il n'y a ni établissement, ni poste, ni personne — un sélecteur vide y serait un mensonge. Il emploie le gabarit `vierge`, qui porte le `<main>` et le bandeau de coquille, et **aucun second `<header>`** |
| `R2` Vue du jour — **codé au cycle F3**, route `/jour` | `R1` + composant 14 | Grille d'unités au lieu de tuiles. ⚠️ **Le composant 14 arrive avec le statut de ménage (HEB-06, phase 11)** : un bandeau d'annulation n'a de sens que derrière une écriture, et la seule écriture de cet écran est de classe A. L'inscrire avant qu'il existe aurait fait mentir ce document |
| `R3` Arrivée — **terme du lexique, « check-in » est écarté** ; route `/arrivee` | `R4` | Parcours long : plus de champs, même grammaire |
| `R5` Fiche client et recherche — route `/clients` | `R7` | Liste + fiche, pas de total |
| `R6` Note temps réel | `R7` | Sans l'action finale |
| `P1` Plan de salle | `R2` | Tables au lieu d'unités |
| `P3` Addition et division | `R7` | Le fractionnement est le seul motif neuf — **à valider dans `R7`** |
| `P4` Bon de dépôt pressing | `R7` | Cycle d'état en plus |
| `C1` Ouverture de shift | `G2` | Formulaire simple |
| `C2` Encaissement multi-modes | `R7` + `P3` | Fractionnement entre modes |
| `C3` Comptage et écart | `R7` + `F2` | Saisie par coupure, registre sobre |
| `F1` File de certification | `R5` | Liste filtrable, badges de `F2` |
| `F3` Avoir | `F2` | Registre sobre, manipulation guidée |
| `F4` État de reversement | `R7` | Document à lignes, export |
| `G1` Établissement et modules | `G2` | Configuration |
| `G3` Utilisateurs et rôles | `G2` | Configuration |
| `G4` Journal d'audit | `R5` + `F2` | Liste filtrable, registre sobre |
| `A1` À propos | `G2` | Configuration en **lecture seule** |
| `S1` Panneau de synchronisation — **titre « Mes envois », route `/mes-envois`** | **Composant 10** — témoin de synchronisation | Développement du composant : le témoin dit l'état d'un coup d'œil, le panneau détaille ce qui attend et permet d'agir. **Le nom du fichier de page décide de la route, et une URL est visible** : `/synchronisation` aurait fait entrer par cette porte un mot que le lexique proscrit du visible |
| `S3` États vides et erreurs | Famille d'illustrations | Couvert par la fondation |
| `M1` Accueil mobile | `R1` + `M4` | Composition en régime mobile |
| `M2` Commande mobile | `P2` | C'est déjà la cible mobile de `P2` |
| `M3` Commandes QR à confirmer | `M4` + `P2` | Liste d'actions à un tap |
| `M5` Enregistrement OCR | `R3` | Étape caméra + chemin dégradé obligatoire |
| `V2` Création de réservation | `R3` | Même parcours, sans arrivée immédiate |
| `Q2` `Q3` États de la surface QR | `Q1` | États de `Q1` |
| `E1` Parc de tenants | `R5` | Liste filtrable |
| `E2` Provisionnement | `G2` | Configuration guidée |
| `E3` Abonnement | `G2` + `R7` | Paramètres + calcul |
| `E4` Diagnostic à distance | `F1` | Liste technique |
| `E5` Registre des paramètres | `G2` | Lecture seule |
| `STK` Écrans de stock | `R5` + `G2` | Liste + formulaire |

**Règle de conduite** : au moment de coder un écran dérivé, ouvrir la maquette dont il hérite et la respecter. Si l'écran a besoin d'un **motif** absent de la matrice, il relève du quatrième cas — on le code et on l'inscrit. S'il a besoin d'un **composant** absent de la bibliothèque, **on s'arrête et on le signale**.

**Note sur `A1` — inscrit avant d'être demandé.** Aucune story ne l'appelle aujourd'hui, et il ne
se construit donc pas (principe X, « prêt ≠ construit ») : cette ligne le rend *codable* le jour
où une story l'appellera, elle ne l'autorise pas à être bâti maintenant. Il existera de toute
façon — **ADM-02** y logera la version déployée et **TRX-07** le bundle de diagnostic. En
attendant, les mentions de licence des polices et icônes embarquées vivent dans `G1`, faute
d'écran d'accueil : cohérent en motif, bancal sur le fond, puisque les licences du produit ne sont
pas un réglage d'établissement. **Elles migreront vers `A1`.**

**Note sur `R0` — l'écran par lequel tout le monde entre.** Il n'apparaît pas parmi les onze codes
maquettés. Il hérite de **`G2`** pour la structure — en-tête, carte centrée, formulaire, action unique — et de
**`S3`** pour ses états d'erreur et ses états vides, qui sont la moitié de cet écran : hors ligne,
identifiants refusés, serveur injoignable. Deux contraintes propres, qui viennent de CPT-01 et non
du motif : **les deux échecs d'authentification rendent la même phrase** (FR-012), et le refus
hors ligne est annoncé **avant** toute tentative.

**Note du cycle F2 — `R1` est RESPONSIVE, et c'est une décision de produit.** Les quatre maquettes
de `R1` sont dessinées pour un poste : deux colonnes, une latérale de `w-84`. Sur un téléphone de
390 px, cette latérale prenait **336 px et laissait 54 px au contenu** — l'écran était inutilisable,
et l'en-tête débordait de 313 px. *Mesuré, pas supposé.*

**Le motif de la décision est produit, pas technique** : *« on ne veut pas les obliger à avoir un
ordinateur, cela ne doit pas être un handicap »*. `R1` bascule donc en **une seule colonne sous
`lg`** — ce qu'on fait, puis ce qu'on surveille —, l'en-tête a son **ordre de dégradation** écrit,
et la barre « Vos activités » se **fixe au bas de l'écran** avec ses services en flux horizontal.

⚠️ **Cela ne supprime pas `M1` « Accueil mobile », et la question reste ouverte.** `M1` était prévu
comme un écran dérivé de `R1` + `M4` au cycle F7. Un `R1` utilisable sur téléphone en réduit
l'urgence, il ne le remplace pas d'office : `M1` pourrait porter une disposition **pensée pour une
main** — actions au pouce, moins de lecture — que l'adaptation d'un écran de poste n'atteint pas.
**Le trancher demande l'atelier terrain**, pas une décision d'implémentation.

⚠️ **Et rien de tout cela n'est maquetté.** Les dispositions mobiles décrites ici sont **composées à
partir des seize composants**, sans référence dessinée : elles portent donc la mention **« à valider
avant le pilote »**, comme tout écran composé en zone de vitesse.

**Note du cycle F2 — aucun écran découvert à l'implémentation, et c'est vérifié plutôt que
supposé.** Le cycle a construit **deux** écrans, `R0` et `R1`, tous deux inscrits ci-dessus avec
leur route au moment de leur construction. Le quatrième cas de la règle — *« découvert à
l'implémentation »* — **n'a pas servi** : aucun parcours du cycle ne s'est arrêté faute d'écran.

⚠️ **Un état n'est pas un écran, et la distinction se dit** parce qu'elle serait tentante à
franchir. `R1` a gagné au cycle un rendu que les quatre maquettes ne montrent pas : celui d'un
compte **sans aucun établissement** (FR-024) — une seule colonne, l'état vide illustré **11**, et
la phrase du lexique. C'est un **état de `R1`**, servi par la même route, composé des mêmes
composants, et non un écran de plus : lui donner un code l'aurait fait entrer au décompte des 46
pour un cas qui n'a ni parcours propre ni navigation vers lui.

---

## Règle opposable — les quatre cas

Un écran se code dans **quatre cas** :

1. **il est maquetté** — la référence est le fichier d'état exact de `docs/design/html/` ;
2. **il est dérivé** — la référence est sa ligne de la matrice ci-dessus, et on ouvre la
   maquette dont il hérite pour la respecter ;
3. **il est composé** — assemblé **uniquement** à partir des seize composants canoniques, aux
   quatre conditions cumulatives ci-dessus, et **en zone de charme seulement** ;
4. **il est découvert à l'implémentation** — les documents ne l'avaient pas prévu, et sans lui un
   parcours ne se termine pas.

### La catégorie « instrument de développement » — amendée le 2026-08-07 par le cycle F1

**Motif de l'amendement, et pourquoi une entrée de tableau n'aurait pas suffi.** Le cycle F1
livre trois écrans qui ne sont pas le produit : le **guide de style**, l'**index des écrans** et
le **panneau de scénarios**. Les inscrire comme *composés* était le réflexe — et l'analyse a
établi que **le guide de style échoue à la condition 1** du test d'un écran composé, *« liste,
formulaire ou fiche suivant un motif déjà posé »*. `/_ecrans` (une liste) et `/_scenarios` (un
formulaire) la satisfont ; lui non : il ne suit aucun motif, **il les montre**.

*La condition 1 existe pour empêcher qu'un écran invente un motif. Le guide de style n'en invente
aucun. La substance est respectée, la lettre ne l'est pas — et un écart constaté ne se tranche
jamais en silence.*

**La règle gagne donc une catégorie explicite**, plutôt que d'introduire par une entrée de tableau
une cinquième catégorie que la constitution ne connaît pas :

> **Instrument de développement** — assemblé **uniquement** à partir des seize composants
> canoniques, **en zone de charme**, **consulté par le développeur et non par l'exploitant**,
> **hors du décompte des écrans du produit**, et **sans code de préfixe**. Sa route porte un
> **trait bas** — c'est ce qui le distingue à l'œil dans une barre d'adresse.

⚠️ **Le décompte des 46 reste INCHANGÉ**, et `docs/Kaya_Design.md` §3 **n'est pas amendé** : les
instruments n'ont pas de code, donc ils n'ajoutent aucun préfixe aux onze existants.

| Instrument | Route | Composants employés | Zone |
|---|---|---|---|
| **Guide de style** | `/_guide-de-style` | **les seize**, chacun dans tous ses états, importés **explicitement** — c'est ce qui les « branche » (porte P-06) | charme |
| **Écrans** | `/_ecrans` | **08** ligne de liste · **04** pastille d'état · **12** sélecteur segmenté | charme |
| **Scénarios** | `/_scenarios` | **16** champ de saisie (dont « choix fermé ») · **12** sélecteur segmenté · **01 · 02** actions · **07** bandeau d'alerte · **08** ligne de liste · **10** témoin · **11** état vide | charme |

> **Le bandeau de la coquille n'est pas un écran, et il est visible sur tous.** Il vit dans le
> gabarit par défaut, entre la barre et le `<main>`, et porte les deux annonces que la coquille
> doit faire : **une version nouvelle attend** (FR-017) et **l'application n'est pas installée**
> (FR-015). Il emploie le **composant 07** et rien d'autre. ⚠️ **Un seul à la fois** : une version
> en attente prime sur une invitation à installer — *deux bandeaux en font lire zéro*, et un
> correctif qui ne part pas coûte plus cher qu'une installation remise à demain.

### Le quatrième cas, et ce qu'il exige

> **Les documents ne peuvent pas avoir tout prévu** : c'est en construisant un parcours qu'on
> découvre l'écran qui lui manque pour se terminer. Arrêter le cycle à cet endroit-là reviendrait à
> arrêter le travail pour produire un document, sur un écran souvent évident.

**Le cycle ne s'arrête pas. L'écran se code, à trois conditions :**

1. il n'emploie que les **composants, tokens et termes du lexique existants** ;
2. s'il tombe en **zone de vitesse** — utilisateur debout, pressé, client en face, argent en jeu —
   il se code quand même mais il est **signalé « à maquetter avant le pilote »** ;
3. **il s'inscrit au tableau ci-dessous DANS LE MÊME CHANGEMENT**, avec ses composants et la
   mention « à valider ».

**Ce qu'on refuse n'est pas d'inventer un écran, c'est de l'inventer EN SILENCE.** La dérive ne
vient pas de l'écran ajouté ; elle vient des trente écrans que personne n'a inscrits nulle part.

### Les écrans DÉCOUVERTS À L'IMPLÉMENTATION

*Quatrième cas. Aucun n'a été dessiné : ce sont des propositions, toutes marquées « à valider ».*

| Écran | Cycle qui l'a découvert | Pourquoi il manquait | Composants employés | Zone |
|---|---|---|---|---|
| *(aucun à ce jour)* | | | | |

**Une seule chose arrête encore un cycle : un COMPOSANT qui manque à la bibliothèque.** Un écran
s'assemble, un composant se dessine. La frontière porte sur le vocabulaire, pas sur les phrases
qu'on en fait.

Rappel : **le HTML de maquette n'est jamais copié vers `app/`.** C'est une cible, pas une
source — autonome, non sémantique, sans i18n, sans mode sombre câblé, sans RBAC. On lit ses
valeurs, on réimplémente. Seule exception : `docs/design/theme.css`, copié tel quel dans
`app/assets/css/`.

---

## Notes de conception sur quatre écrans de la réception

`R4` **Le passage** est **codé au cycle F3**, route `/passage`. Il est maquetté, dans ses cinq états. Il est en **zone de vitesse** et ne se
compose jamais : `docs/Kaya_Design.md` §1 est formel, et `R4` porte une intention dessinée qu'un
assemblage ne retrouverait pas — les tailles de la durée et de l'heure de fin, la place du prix sur
le bouton.

⚠️ **Un point où la maquette dit le contraire du cadrage, et où c'est le cadrage qui gagne.**
`R4-passage-hors-ligne.html` écrit en bandeau : *« Donner une chambre ne demande pas le réseau. »*
Le cadrage §11.3 classe l'attribution d'unité et le check-in en **classe B**, et §11.1 ne les
autorise hors ligne **qu'en mode C, avec un nœud de site** — qui n'existe pas avant l'incrément 3.
Hors ligne, en mode terminal, l'action est donc **absente du HTML rendu**, remplacée par la phrase
du lexique « **Cette action nécessite internet.** », annoncée **avant** que l'utilisateur s'en
approche. Ce que la maquette dessine redeviendra vrai le jour où un nœud de site existe : il faudra
alors le rendre **conditionnel au mode de déploiement**, pas inconditionnel comme elle le laisse
croire. *Sans cette note, le premier écran codé recopierait le bandeau et rendrait atteignable hors
ligne une opération de classe B — ce que la constitution §6 fait échouer au build.*
(Constaté au cycle F3, `specs/005-reception-passage-note-planning/spec.md`, arbitrage A.)

`R3` **Arrivée** est **dérivé** de `R4` — *« parcours long : plus de champs, même grammaire »*. Les
champs s'ajoutent sans que l'écran devienne un formulaire : le dernier geste reste le **tap sur la
chambre**, et il n'existe aucun bouton de soumission.

`R7` **La note et le départ** est **maquetté**, et il faudra trancher ce que la maquette montre et
que le produit ne sert pas encore : les sections de note non couvertes se rendent **en creux,
nommées**, plutôt que d'être supprimées. ⚠️ **Un point que la maquette ne dit pas et que l'écran
doit dire** : la note se ferme **arrêtée et non réglée**. Sans cette phrase, l'écran laisse croire
au paiement, et le trou se découvre au comptage de caisse sans qu'on sache à quel séjour il se
rattache.

⚠️ **`R7` calcule la taxe de séjour d'une façon que le cadrage a corrigée depuis — ne pas recopier
la ligne.** La maquette affiche *« 500 F par personne et par nuit · 2 personnes × 4 nuits »* =
4 000 F. Le cadrage §9.6 a été corrigé le **2026-08-03** par la décision **B-10, close** : la taxe
est due **par nuitée et par séjour, jamais par personne** — *un couple en chambre double paie une
taxe, pas deux*. Avec la règle seed `une_nuitee_par_occupation`, la bonne valeur de cette note est
**500 F**, et son total **282 860 F**. Le nombre de personnes reste au constat **à titre
indicatif** et n'entre dans aucun calcul. La maquette est **antérieure à l'arbitrage** : elle reste
la référence pour le **dessin** de la ligne — sa place, sa typographie, sa phrase d'assiette —, et
elle n'est **pas** une référence pour le **montant**. *Sans cette note, le premier écran codé
recopierait une multiplication par les personnes, et le trop-perçu ne se verrait sur aucun écran.*
(Cycle F3, `specs/005-reception-passage-note-planning/spec.md`, D-05a.)

⚠️ **`R7` a un quatrième état, et il n'est pas maquetté : l'issue INDÉTERMINÉE.** La maquette en
porte trois — note en cours, envoi en cours, échec. L'envoi aux impôts a une quatrième fin
possible, le timeout, et la constitution §5 lui interdit tout rejeu automatique : un second envoi
créerait une seconde facture réelle chez l'administration, et elle ne s'annule pas côté client.
L'état s'inscrit donc ici, comme **écran inventé à l'implémentation** — ce que ce document autorise
— avec la phrase du lexique : « **Nous ne savons pas si les impôts ont reçu cette facture** ».
Le rapprochement manuel qui le résout appartient au cycle F6 ; `R7` le **nomme** sans l'ouvrir.
(Cycle F3, `specs/005-reception-passage-note-planning/spec.md`, D-14.)

`R5` **Fiche client et recherche** est **dérivé** de `R7` — *« liste + fiche, pas de total »* — et
l'absence du bloc de total est le point qui se paierait si on l'oubliait : additionner les séjours
d'un client afficherait un chiffre qui **ressemble à un solde**, et l'exploitant y chercherait ce
que le client doit.

### Ce que le cycle F3 a trouvé en codant `R4`, et qui n'était écrit nulle part

**La grille montre TOUTES les chambres, et le tarif suit la chambre.** Une première implémentation
ne retenait **qu'une** formule de passage — donc **une seule catégorie**, donc **trois chambres sur
dix-sept**. La maquette en dessine douze ; *constaté sur une capture*, et corrigé : c'est **la
chambre qui décide de la formule**, jamais l'inverse. Une réceptionniste à qui l'on refuserait
quatorze chambres sur dix-sept reprendrait son cahier.

**La garde de chambre court à partir de la LIBÉRATION, pas de maintenant.** Posée à l'instant
courant, elle se heurtait à l'occupation en cours — c'est-à-dire à celle qui la rend nécessaire —,
et se refusait elle-même **sur le seul écran où elle sert**. *Trouvé à l'écran, pas dans le code.*

**L'heure de fin ne se coupe pas.** À 88 px, « 18 h 55 » se cassait après le `h` : le nombre qu'on
dit à voix haute devenait deux nombres. `whitespace-nowrap`, et le corps suit la largeur disponible
entre deux jetons existants — aucune valeur intermédiaire n'est inventée.

**La navigation latérale se range par VERTICALE, et son premier classement était un mot d'hôtel.**
Elle est née d'un constat d'usage — sur `/jour`, on ne pouvait plus revenir à l'accueil — et son
premier découpage rangeait par moment de travail : « Aujourd'hui », « La réception », « Les
services ». *Relu par l'exploitant* : ces trois intitulés n'ont de sens que dans un hôtel, et « les
services » désigne, vu de l'hôtel, tout ce qui n'est pas l'hébergement. Le classement retenu est
donc **une rubrique par module d'activité** — celui-là même que porte déjà la base, à un schéma
PostgreSQL par module. Trois défauts sont sortis du seul fait de le coder, et **aucun d'une
relecture** :

- sur l'accueil, qui n'appartient à aucune verticale, la barre s'ouvrait avec **deux entrées sur
  douze** et quatre intitulés fermés ;
- **rail replié, l'accueil disparaissait** — la sortie de secours s'effaçait exactement quand la
  barre se réduit à l'essentiel ;
- l'écran courant n'était marqué **nulle part** dès que sa verticale était refermée, par le repli du
  rail comme à la main. La règle n'est pas « le rail est-il replié ? » mais « l'entrée courante
  est-elle visible ? » — la première version posait la mauvaise question et laissait passer un cas
  sur deux.

**Et le pressing exigeait la permission du restaurant.** `ventes.commande.prendre` appartient au
module `RESTAURATION` ; l'accueil comme la navigation s'en servaient pour le pressing. Chez un
exploitant qui a un pressing et **pas** de restaurant, le pressing disparaissait de l'écran —
silencieusement, exactement comme si l'établissement ne l'offrait pas. Rien ne rougissait, parce que
le jeu de données de référence a les deux modules : le défaut ne serait apparu qu'au premier client
mono-service, c'est-à-dire en production. C'est **le classement par verticale qui l'a rendu
visible**, et un test de cohérence qui l'a nommé.

⚠️ **Une ligne de ce document ne se marque « codé » que dans le changement qui livre l'écran.**
Ce fichier est **opposable** : il autorise un écran sans maquette. Y inscrire « codé » sur un écran
qui n'existe pas ferait mentir le seul document qui dise ce qui a le droit d'être codé — et le
mensonge serait invisible, puisque rien ne relit un tableau de dérivation contre le système de
fichiers.

## Voir aussi

- `docs/Kaya_Design.md` §2 bis — les quatre cas, et ce qui fait foi (la grammaire, pas le dessin)
- `docs/design/lexique.md` — le vocabulaire utilisateur, opposable au même titre
- `docs/design/composants.md` + `styleguide.html` — les composants canoniques dans tous leurs états
- `docs/design/tokens.md` — les valeurs curées, qui priment sur tout export
