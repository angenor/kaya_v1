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
| `R0` Connexion | `G2` | Formulaire minimal ; états d'erreur et vides de `S3` |
| `R2` Vue du jour | `R1` + composant 14 | Grille d'unités au lieu de tuiles |
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

`R4` **Le passage** est maquetté, dans ses cinq états. Il est en **zone de vitesse** et ne se
compose jamais : `docs/Kaya_Design.md` §1 est formel, et `R4` porte une intention dessinée qu'un
assemblage ne retrouverait pas — les tailles de la durée et de l'heure de fin, la place du prix sur
le bouton.

`R3` **Arrivée** est **dérivé** de `R4` — *« parcours long : plus de champs, même grammaire »*. Les
champs s'ajoutent sans que l'écran devienne un formulaire : le dernier geste reste le **tap sur la
chambre**, et il n'existe aucun bouton de soumission.

`R7` **La note et le départ** est **maquetté**, et il faudra trancher ce que la maquette montre et
que le produit ne sert pas encore : les sections de note non couvertes se rendent **en creux,
nommées**, plutôt que d'être supprimées. ⚠️ **Un point que la maquette ne dit pas et que l'écran
doit dire** : la note se ferme **arrêtée et non réglée**. Sans cette phrase, l'écran laisse croire
au paiement, et le trou se découvre au comptage de caisse sans qu'on sache à quel séjour il se
rattache.

`R5` **Fiche client et recherche** est **dérivé** de `R7` — *« liste + fiche, pas de total »* — et
l'absence du bloc de total est le point qui se paierait si on l'oubliait : additionner les séjours
d'un client afficherait un chiffre qui **ressemble à un solde**, et l'exploitant y chercherait ce
que le client doit.

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
