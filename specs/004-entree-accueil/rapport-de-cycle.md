# Rapport du cycle F2 — l'entrée et l'accueil

**Phase** : 2 · **Date** : 2026-08-08 · **Plan** : [plan.md](./plan.md) · **Spécification** :
[spec.md](./spec.md)

> **Ce document dit ce que les portes NE COUVRENT PAS.** Le reste — ce qui est vert — se lit dans la
> sortie de `scripts/verifier.sh`. Ici on écrit les constats faits **à l'écran**, les écarts
> assumés, les **écarts de libellé avec les maquettes**, et **ce qui reste dû**.

---

## 1. L'état à la clôture, sans arrondi

| Contrôle | Résultat |
|---|---|
| `scripts/verifier.sh` | **TOUT VERT — 6 portes — 162 s** (préalables · P-01 · P-02 · P-05 · P-03 · P-04 · P-06), Docker actif |
| Tests d'unité | **201 cas**, 16 fichiers, exécutés **avec la couverture** |
| Suites de navigateur | **202 passages** — Chromium **et** WebKit, clair **et** sombre |
| Points d'entrée | **153 entrées** au registre — 125 « branché », 28 « dû » |

**Aucune porte nouvelle, donc aucun test négatif nouveau.** `scripts/verifier.sh` est **inchangé**
par ce cycle, et c'est la meilleure preuve qu'il n'a rien contourné : les deux écrans neufs entrent
dans P-04 par l'index, sans une ligne de script à toucher.

### Ce que le cycle livre

| Livrable | État |
|---|---|
| `R0` — la connexion, route `/connexion` | **CONSTRUIT**, quatre passages |
| `R1` — l'accueil, route `/`, **quatre variantes** | **CONSTRUIT**, quatre passages, sans une seule branche de code |
| La grammaire d'en-tête — un `<header>` dans tout le dépôt | posée, testée, **opposable** |
| Le panneau Scénarios — les quatre variantes atteignables sans recompiler | complété (US5) |

### Ce qui N'EST PAS livré, et qui reste dû

*Écrit en tête, jamais en note de bas de page.*

| Ce qui manque | Où c'est écrit | Cycle |
|---|---|---|
| **Le jugement d'usage sur le maquis n'est pas tranché par une porte** | §2.1 | atelier terrain |
| **D'où viendra le poste quand il y en a plusieurs** | §5.1 | **F4** |
| **`R4` et `R7` alignés sur la grammaire d'en-tête** | §5.2 | **F3** |
| **Le régime mobile de l'en-tête et de l'accueil** | §5.3 | **F4** |
| **Aucun essai sur appareil réel** | §5.4 | dès qu'un appareil est là |
| **Le nom du site disparaît de l'en-tête sous coupure** | §2.6 | **F4** (cache des données de référence) |
| 44 des 46 écrans du produit sont « pas commencé » | c'est le plan de charge des cinq cycles suivants, et P-04 ne les exige pas | F3 → F7 |

---

## 2. Les écarts assumés, avec leur mesure

### 2.1 Le jugement d'usage sur le maquis — **rendu à l'œil, pas par une porte**

`quickstart.md` §2.2 pose la question de vérité : *l'accueil de Yao a-t-il l'air conçu pour un
maquis, ou d'un hôtel amputé ?* Le contrôle mécanique prouve l'**absence des mots** — « Hébergement »,
« Pressing », « Salle de réunion » n'existent nulle part dans le document rendu, ni en texte, ni en
attribut, ni sous un élément masqué. **Il ne prouve pas que l'écran ait l'air d'un maquis.**

**Le déroulé manuel a été fait, à l'écran, en clair et en sombre.** Verdict : **oui** — l'action
première est « Ouvrir une table », la salle se lit d'un coup d'œil en neuf tuiles, et le vocabulaire
est celui du lieu : *ardoises*, *comptoir*, *casiers de bière*, *poisson braisé*, *« 5 personnes
debout »*. Aucune rubrique vide, aucun compteur à zéro, aucun intitulé orphelin — « Vos activités »
disparaît **avec son titre**, ce qui est exactement le comportement attendu d'un établissement à
service unique.

⚠️ **Ce verdict est celui de l'équipe, pas celui d'un exploitant.** Il ne remplace pas l'atelier
terrain : ce que personne ici ne peut trancher, c'est si « 6 tables occupées sur 9 » est ce qu'un
gérant de maquis regarde en premier à 20 h 50, ou s'il regarde d'abord ses ardoises.

### 2.2 Les deux écarts de libellé avec la maquette du maquis — **assumés et nommés**

| Emplacement | La maquette dit | L'écran dit | Pourquoi l'écart |
|---|---|---|---|
| Titre du bloc de chiffres | « **Ce soir** » | « **Aujourd'hui** » | le titre vient de la **surface** `chiffre.recette`, qui sert les quatre variantes |
| Titre de la grille de tables | « **La salle** » | « **Vos tables** » | le titre vient de la surface `suite.tables`, partagée avec la variante serveuse |

**Le motif est le même dans les deux cas, et c'est le cœur du cycle** : un titre par variante
demanderait une condition sur la variante — c'est-à-dire exactement le `if (variante === 'maquis')`
que tout l'écran existe pour éviter. Le prix payé est deux mots moins justes sur une variante ; le
prix évité est une branche que **onze écrans** auraient héritée.

⚠️ **Ce n'est pas définitif.** Le jour où une surface devra porter deux titres selon le contexte, ce
sera **une propriété de la surface** — jamais une condition dans la page. `docs/design/lexique.md`
tranchera le vocabulaire ; l'atelier terrain dira si « Ce soir » vaut le mécanisme.

### 2.3 La maquette du maquis affirme « 9 tables » et n'en dessine que **8**

`R1-accueil-maquis.html` écrit « **6 tables occupées sur 9** » en tête et dessine **huit** tuiles
(sept tables numérotées plus le comptoir). L'écart est dans la maquette, pas dans le décompte.

**Ce que le cycle a fait** : `data-model.md` §3.3 porte **neuf** `table_pdv` — codes `1` à `7`, la
table 6 nommée, plus `COMPTOIR` — et le jeu de données les rend toutes. **Le décompte fait foi** :
c'est la phrase de tête qui dit un fait d'exploitation, et une tuile oubliée au dessin n'en retire
pas une de la salle. La maquette n'a **pas** été corrigée sur ce point — elle reste une cible, et
son décompte de tuiles n'est pas un contrat.

### 2.4 Trois ajouts au jeu de données, décidés en cours de cycle

*Aucun n'est une commodité de test : chacun ferme une règle que rien n'exerçait.*

| Ajout | Motif |
|---|---|
| **Le compte SUSPENDU de Mariam** (`compte-mariam`) | FR-003 exige qu'un compte suspendu rende **exactement la même phrase** qu'un compte inconnu. Sans compte non `ACTIF` au jeu, **cette branche n'était exercée par rien** — et une règle que rien n'exerce est une règle qu'on croit tenue |
| **La permission `ventes.commande.prendre.bar`** | le catalogue ne portait **aucune permission de bar**, alors que Deloria en a un et qu'Aminata y sert. Le défaut rendait le calcul du poste **faux** — un seul point de vente atteignable pour tout le monde, donc **jamais** la forme courte de l'en-tête, donc FR-030c intenable *et invérifiable* |
| **`ventes.commande.prendre` ajoutée au rôle `gerant`** | le rôle portait « appliquer une remise » **sans** « prendre une commande » : le droit de corriger une commande sans celui d'en ouvrir une. Le manque ne se voyait pas tant qu'aucun écran ne composait par permission ; il rendait l'accueil du maquis **vide pour Yao**, qui en est le gérant |

### 2.5 Les modules actifs ont changé de place — **le défaut que la phase 8 a trouvé**

`composerAccueil` lisait les modules actifs **avant** de filtrer, à chaque composition. Quand cette
lecture échouait — réseau coupé, panne —, `serviceEstActif` répondait « non » à tout : les rubriques
d'un service **disparaissaient avec leurs titres, sans un mot**. Une panne ressemblait à une
configuration, et l'accueil d'une serveuse devenait une page blanche hors ligne.

**Aucun test d'unité ne l'aurait vu**, et aucun test de composant non plus : chacun montait la
composition avec des modules déjà connus. C'est la comparaison **nominal / dégradé en navigateur
réel** — les mêmes rubriques doivent être là avant et après le levier — qui l'a fait rougir.

**Le correctif est structurel** : les modules actifs sont désormais **résolus avec le contexte** et
portés par la session, comme les permissions et le poste, et les **trois** chemins qui posent un
contexte (entrée, bascule de site, panneau) passent par une seule fonction, `resoudreContexte`.
Trois copies auraient divergé, et la troisième aurait oublié la lecture neuve.

### 2.6 Sous coupure, l'en-tête perd le **nom** du site — constaté, non corrigé

Le sélecteur d'établissement tient sa liste d'une lecture (`etablissementsDe`). Au **rechargement**
sous levier « hors ligne » ou « échec réseau », cette lecture ne rend rien : le composant **09**
retombe sur son initiale de repli et affiche un « K » muet, là où l'exploitant attend le nom de sa
maison. La session, elle, sait parfaitement **quel** établissement est actif — elle n'en porte que
l'identifiant.

**Ce n'est pas corrigé dans ce cycle, et le motif est de périmètre** : le remède est le **cache des
données de référence** (nom, commune, fuseau) — le même chantier que le régime hors-ligne des
listes, qui appartient à **F4**. Le corriger ici aurait demandé de porter trois champs d'affichage
en session, sans le cadre qui dira comment ils se rafraîchissent.

⚠️ **Ce qui tient malgré tout** : la structure de l'accueil, elle, ne bouge plus (§2.5), et le témoin
de l'en-tête dit « Hors connexion » dans les mots du lexique.

### 2.7 Le harnais de navigateur passe à **60 s par test**

Les deux parcours de bout en bout durent **24 s chacun** lancés seuls : treize pas, deux moteurs,
des leviers posés et repris. Sous la matrice complète — cinq passages se disputant la même machine —
la marge de 30 s tombait, et le test rougissait sur la **charge du poste**, jamais sur un défaut du
produit. *Un délai qu'on frôle est un délai qui ment un jour sur deux.*

⚠️ **Ce n'est pas une indulgence sur la lenteur du produit** : aucune attente de ces suites n'est un
délai fixe. Ce qui prend du temps, ce sont les navigations réelles et les latences que le panneau
impose volontairement.

### 2.8 Le coût de l'enchaînement — **le repère de 180 s a été franchi une fois (SC-017)**

Deux exécutions complètes, Docker actif, à la clôture du cycle :

| Exécution | Durée | Verdict |
|---|---|---|
| première | **187 s** | au-delà du repère — le script **demande la consignation**, la voici |
| seconde | **162 s** | sous le repère |

L'écart entre les deux tient à la charge du poste, pas au contenu. Ce qui a réellement grossi, ce
sont les **passages de navigateur : 202 contre 102 au cycle F1** — le double, pour deux écrans du
produit qui n'existaient pas.

Le script imprime sa durée et **ne rougit pas** au-delà du repère.

*Faire rougir le script parce qu'il a mis trois minutes punirait le cycle qui ajoute un contrôle
utile, et l'on retirerait le contrôle plutôt que la lenteur.*

---

## 3. Ce que L'ÉCRAN a trouvé et que les tests n'auraient pas vu

1. **`R1` était entièrement aplati.** La première version empilait les cinq rubriques en une
   colonne, là où les quatre maquettes posent **deux colonnes**. Tous les contrôles étaient verts :
   ils vérifiaient la présence, l'absence et les titres — jamais qu'une rubrique se tienne **à
   droite** d'une autre. La suite porte désormais la géométrie.
2. **La colonne latérale s'arrêtait au milieu de l'écran**, à une position **différente selon la
   variante** : la page, enfant flex du `<main>`, se dimensionnait sur son contenu. *Une barre
   latérale dont la position dépend du contenu n'est pas une barre latérale.*
3. **Le nom des tables se coupait en deux.** Constaté en déroulant `quickstart.md` §2.2 : à
   `min-w-38`, « Table 6 » passait sur deux lignes dès que sa pastille portait « À régler ». Un
   repère qui se casse cesse d'être lu d'un coup d'œil — or c'est tout ce qu'on demande à une grille
   de salle.
4. **La neuvième table s'étirait sur toute la largeur.** Seule sur sa rangée dans un flux enroulé,
   elle ne ressemblait plus aux huit autres. *Une salle se lit parce que ses tables se ressemblent.*
   La tuile est maintenant bornée **des deux côtés**.
5. **Le panneau Scénarios mentait sur ce qu'il avait fait.** Choisir l'administrateur éditeur — sans
   aucun établissement — laissait la session sur le compte précédent : l'en-tête continuait
   d'afficher Adjoua. Le panneau pose désormais un contexte sans site, et retire le sélecteur au
   lieu d'ouvrir un choix sur rien.
6. **La page entière défilait, et emportait ce qu'on surveille.** Descendre dans la salle du maquis
   faisait sortir de l'écran la caisse du soir et les ardoises — c'est-à-dire précisément ce que la
   colonne latérale existe pour tenir sous le regard, pendant qu'on travaille à gauche. La fenêtre
   ne défile plus : chaque colonne porte son propre défilement, et l'en-tête n'a plus besoin d'un
   `sticky` pour rester en place.
7. **« Vos activités » a été détachée du flux.** Elle flotte désormais au bas de la colonne
   principale, sur un voile en dégradé qui **dit que la liste continue dessous**, et elle se replie
   quand un service en cours mérite toute la hauteur. Deux constats de capture au passage : le titre
   de la barre se lisait par-dessus la liste tant que le dégradé servait de fond au bloc entier, et
   la dernière carte finissait **sous** la barre — visible, touchable, sans effet. Le voile est
   maintenant une bande à part, et le contenu porte une réserve de bas de colonne.
8. **Une colonne flex qui défile comprime ses enfants au lieu de déborder.** Le défilement ne
   fonctionnait tout simplement pas : `scrollHeight` valait `clientHeight`, les sections s'étant
   écrasées pour tenir. `shrink-0` sur chaque rubrique le ferme — et rien, à la lecture du code,
   ne l'aurait signalé.
9. **Le contexte ne se résolvait qu'au CHANGEMENT.** Sur un appareil neuf, les réglages portaient
   déjà un compte et un site alors que la session était vide : la surface des actions montrait son
   état vide à une gérante qui a huit droits. Constaté en déroulant le pas 9 du quickstart.

---

## 4. Ce qui a été constaté à l'écran, et qui est conforme

*Déroulé de `quickstart.md` §2, à la main, sur le build servi — pas en développement.*

| Pas | Constat |
|---|---|
| §2.1 | `/` sans session mène à `/connexion?vers=/` — l'adresse demandée est retenue |
| §2.2 | les **quatre** accueils, obtenus par le contexte seul, sans recompiler |
| §2.3 | les **deux formes d'en-tête** : `Abobo · La salle` pour Yao, `Abengourou` **seul** pour Adjoua — quatre postes, et le système **ne l'invente pas** |
| §2.4 | deux gestes, sans reconnexion ; rechargement → **on revient au maquis**, pas au premier de la liste |
| §2.5 | l'appui d'une porte non construite dit *« La note et le départ n'est pas encore construit »* et *« Cet écran arrive au cycle F3 »* — titre et cycle **lus à l'index** |
| §2.6 | file vide → retour à `/connexion` ; file non vide → **refus immédiat**, avec la phrase du lexique, et l'on ne quitte pas l'écran |
| §2.7 | squelettes à la place du contenu · états vides illustrés · erreurs **par rubrique** · hors ligne annoncé **avant** la saisie |
| §2.8 | la bascule de thème ne change **que les couleurs** — variante `dark:` et jetons |

---

## 5. Les points laissés ouverts, avec leur cycle

### 5.1 D'où viendra le poste quand il y en a plusieurs — **F4**

Le modèle ne porte **aucun lien `compte → point_de_vente`** (vérifié dans `20-comptes.sql`) : le
poste est un **calcul** — rôles → permissions → modules → points de vente —, et il ne rend un
résultat que **lorsqu'il est sans ambiguïté**. Yao au maquis obtient « La salle » ; Adjoua à Deloria
n'obtient rien, parce qu'elle atteint quatre points de vente.

**Ce que le produit ne sait pas encore** : à quel poste une personne travaille **ce soir**. Cela
suppose soit une affectation (une table de plus), soit un choix à l'ouverture de service — deux
décisions qui appartiennent au cycle qui construira le service en salle, **F4**. *Le second segment
de l'en-tête affirme un fait ; l'affirmer sans le savoir est un mensonge que six cycles
hériteraient.*

### 5.2 `R4` et `R7` ne sont pas alignés sur la grammaire d'en-tête — **F3**

Les deux maquettes portent des en-têtes antérieurs à la grammaire posée ici. **Elles n'ont pas été
corrigées**, et c'est délibéré : corriger un écran qu'on ne construit pas revient à décider sans
voir. Les quatre `R1-accueil*.html`, elles, **ont** été corrigées dans le cycle (le témoin passe à
« Enregistré », le second segment porte la commune ou commune · poste) parce que ce sont les
maquettes de l'écran construit.

⚠️ **La dette est nommée** : F3 construit `R7` et devra reprendre son en-tête au gabarit, sans le
rédiger.

### 5.3 Le régime mobile — **F4**

Aucun écran mobile n'est construit ici. L'en-tête masque son bloc d'identité sous `md:`, et le bloc
d'instant sous `sm:` — ce sont des **replis**, pas un régime mobile pensé. `M1` (accueil mobile) et
`M2` héritent de `R1` : c'est là que la question se tranchera.

### 5.4 Aucun essai sur appareil réel

Les deux moteurs tournent sur le poste de développement. **Rien n'a été ouvert sur l'Android 2 Go
d'Aminata**, ni sur un iPhone. Ce qui reste donc non observé : le budget d'images par seconde sur un
appareil d'entrée de gamme, la cible tactile réelle au comptoir, et le comportement du service
worker de WebKit lors d'une coupure (déjà consigné au rapport F1, §2.1).

---

## 6. Revue de la Definition of Done — les quatorze points

*`docs/user-stories-v1.md` §0.4. Les points sans objet pour la phase 2 sont **déclarés**, jamais
cochés en silence.*

| # | Le point, tel que §0.4 l'écrit | État |
|---|---|---|
| **1** | Critères d'acceptation couverts par des tests | **tenu** — 201 cas d'unité et 202 passages de navigateur ; les transitions d'état du cycle (les cinq états de rubrique, les quatre verdicts de connexion, la bascule de contexte) sont exercées des deux côtés |
| **2** | *(phase 3)* utoipa à jour, client TypeScript régénéré | **sans objet** — il n'y a **aucun** serveur dans ce cycle. La couture est l'interface de domaine, pas la requête HTTP |
| **3** | *(phase 3)* migration sqlx, `cargo sqlx prepare`, seeds | **sans objet** — aucune migration, aucun `Cargo.toml` : P-03 le dit et le nomme |
| **4** | *(phases 1 et 3)* RLS activée et forcée sur toute table neuve | **sans objet** — ce cycle n'ajoute **aucune table**. Les 118 existantes restent vertes en P-01, avec `ENABLE` **et** `FORCE` |
| **5** | *(phases 1 et 3)* classe hors-ligne déclarée pour toute entité neuve | **sans objet** — aucune entité neuve. Le registre est **inchangé**, et P-02 le confronte aux 118 tables |
| **6** | *(phase 3)* événement outbox pour tout changement d'état métier | **sans objet** — aucune écriture serveur |
| **7** | Clés i18n fr **et** en externalisées, aucune chaîne en dur | **tenu** — le lint refuse la chaîne en dur (y compris en `aria-label`) ; `i18n-parite.spec.ts` vérifie la parité **dans les deux sens** et, depuis ce cycle, l'absence des **mots de mécanique** |
| **8** | *(phase 2)* écran vérifié **clair et sombre, en navigateur réel, Chromium et WebKit** | **tenu** — c'est P-04 : 7 routes × 2 thèmes × 2 moteurs, et les suites de `R0`, `R1`, du contexte et des états dégradés dans la même porte |
| **9** | Paramètres exposés en configuration quand la story dit « paramétrable » | **tenu** — `identite.indicatif_telephonique_defaut` est **lu**, jamais écrit dans le code ; le seuil de latence dégradée reste une clé, pas une constante |
| **10** | *(phase 3, cycle IMP)* document imprimé vérifié sur imprimante thermique | **sans objet** — ce cycle n'imprime rien. L'équivalent phase 2 — l'aperçu au gabarit 80 mm — n'a pas d'objet non plus, faute de document à imprimer |
| **11** | `docs/modele-donnees/{schema}.sql` à jour | **tenu, sans changement** — le cycle ne touche à aucun fichier SQL ; P-01 et P-02 le vérifient sur une base vierge à chaque exécution |
| **12** | *(phase 2)* le jeu simulé a **la forme du modèle** | **tenu** — les trois ajouts du §2.4 reprennent les noms de champs, les types et les valeurs d'énumération des tables (`compte.etat`, `permission.module_activite_code`, `role_permission`) |
| **13** | *(phase 3)* les données simulées des endpoints livrés sont supprimées | **sans objet** — aucun endpoint livré ; les simulations sont **le livrable** de la phase 2 |
| **14** | `scripts/verifier.sh` passe **en une commande**, test négatif pour toute porte ajoutée | **tenu** — six portes vertes, **aucune porte ajoutée**, donc aucun test négatif à écrire ; aucun contrôle lancé à la main en plus du script |

---

## 7. Ce que ce cycle NE PROUVE PAS

*Écrit pour qu'aucune relecture future ne prenne le vert du script pour davantage qu'il ne dit.*

1. **Que l'accueil du maquis soit le bon accueil.** Il prouve qu'aucun mot d'un autre service ne
   l'atteint, pas qu'un gérant y trouve ce qu'il cherche en premier.
2. **Que l'indépendance des cinq sources tienne source par source en navigateur.** Le levier « échec
   réseau » est **global** : il fait tomber les cinq. Ce que la suite prouve en navigateur, c'est
   que **chaque rubrique porte sa propre erreur** et que l'écran garde ses rubriques ; le cas
   « l'une tombe, les autres restent nominales » est prouvé **en unité**, où une seule source peut
   être mise en échec.
3. **Que le produit tienne sur un appareil d'entrée de gamme.** §5.4.
4. **Que la phrase de refus soit comprise.** Elle est celle du lexique, mot pour mot ; personne
   n'a encore observé quelqu'un la lire au comptoir.
5. **Que les quatre variantes couvrent le parc.** Elles couvrent les **quatre maquettes**. Un
   établissement à deux services sans restauration, un compte sans aucun droit sur un site où il en
   a ailleurs — ces cas existent au modèle et n'ont pas d'écran de référence.
