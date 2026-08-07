# Spécification : F2 — Entrée (connexion, accueil composé, sélecteur de contexte, coquille)

**Dossier de cycle** : `specs/004-entree-accueil/`

**Créée le** : 2026-08-07

**Statut** : brouillon

**Cycle** : phase 2, **F2 — Entrée** (2ᵉ des sept cycles de phase 2)

**Stories lues** : `CPT-01`, `CPT-02`, `CPT-03`, `ETB-06` de `docs/user-stories-v1.md`

**Écrans du produit visés** : `R1` (maquetté, quatre variantes) · `R0` (dérivé de `G2`, états de `S3`)

**Entrée** : *« Connexion, accueil composé, sélecteur de contexte, coquille de navigation — en données
simulées. R1 est l'écran qui pose le motif de onze autres, et son test de vérité est écrit :
l'accueil d'un maquis doit avoir l'air conçu pour lui, pas d'un hôtel amputé. »*

---

## Ce que ce cycle décide pour les six suivants

> Ce cycle est **le premier qui produit des écrans du produit**. Ce qu'il fixe, F3 à F7 le
> reprendront sans le rejuger : l'en-tête permanent, la manière d'atteindre un écran et d'en
> revenir, le rythme des titres et des espacements, et la règle de ce qui s'affiche ou non selon
> qui regarde et depuis où. **Une grammaire posée de travers ici se paie six fois.**

**Ce qui est décidé ailleurs et n'est pas rouvert** : les couleurs, corps et espacements
(`docs/design/tokens.md`), les seize composants (`docs/design/composants.md`), les mots visibles
(`docs/design/lexique.md`), les durées et courbes (`docs/design/mouvement.md`). Ce cycle **assemble**
ce vocabulaire ; il n'en invente aucun terme.

---

## Périmètre

### Dans le périmètre

1. **`R0` — la connexion**, en simulation : identifiant téléphone E.164 ou adresse e-mail, mot de
   passe, message d'échec unique, et l'annonce de ce que devient la session à la fermeture de
   l'application.
2. **`R1` — l'accueil composé**, dans ses **quatre variantes maquettées** : générique (Adjoua,
   gérante + caisse + réception), propriétaire (M. Koffi, deux établissements, lecture seule),
   serveuse (Aminata, service en salle), maquis (Yao, restauration seule, le soir).
3. **`ETB-06` — le sélecteur de contexte permanent** : établissement actif, poste actif, témoin
   d'envoi, heure et date, identité de la personne et de ce qu'elle fait.
4. **La coquille de navigation** : ce qui entoure tout écran du produit, comment on va d'un écran à
   l'autre, comment on revient, où se posent le titre et l'action principale.
5. **La bascule de compte et d'établissement depuis le panneau Scénarios** (instrument du cycle F1),
   qui rend les quatre variantes atteignables sans recompiler.
6. **Le jeu de données « Chez Tantie Adjo »** — un maquis à module unique, sans lequel la quatrième
   variante n'a rien à afficher.

### Hors périmètre

- **Toute authentification réelle** : aucun secret vérifié, aucun hachage, aucune limitation de
  débit, aucun mot de passe stocké ni comparé.
- **Tout jeton** : ni jeton d'accès, ni jeton de rafraîchissement, ni révocation, ni liste
  d'appareils connectés. Ces objets n'existent qu'en phase 3.
- **Tout appel réseau** : la couche de données reste simulée, derrière les interfaces de domaine
  posées au cycle F1.
- **Les écrans que les tuiles et les actions désignent** : `R2`, `R3`, `R4`, `R7`, `P1`, `P2`, `C4`,
  `G4`… Ce cycle pose les **portes** ; les cycles F3 à F7 posent ce qu'il y a derrière.
- **`A1` et `S1`**, lus pour la grammaire seulement — la lecture de leur ligne de dérivation informe
  la coquille (où vit un écran de consultation, comment se nomme une route visible) ; **ni l'un ni
  l'autre n'est construit ici**.
- **Le chargement paresseux par module** de `CPT-03` : c'est une propriété du découpage de paquets,
  qui n'a de sens qu'avec des modules à charger. Reporté au cycle qui en aura plus d'un.

---

## Scénarios utilisateur et vérification *(obligatoire)*

### User Story 1 — Entrer dans l'application (Priorité : P1)

Adjoua ouvre l'application au poste de réception à 9 h. Elle voit un écran de connexion sobre : un
champ pour son numéro de téléphone ou son adresse e-mail, un champ pour son mot de passe, un bouton.
Elle se trompe de mot de passe : l'écran lui dit **« Identifiant ou mot de passe incorrect »**, sans
lui apprendre si le compte existe. Elle recommence, entre, et arrive à son accueil.

Avant même de tenter sa chance, l'écran lui a dit ce qui l'attend : soit **« Vous resterez connectée
sur cet appareil »**, soit — si le navigateur ne garantit pas de garder ce qu'on lui confie — que la
prochaine ouverture lui redemandera son identifiant. **Elle le sait avant, pas une heure plus tard
devant un écran de connexion qu'elle n'a pas demandé.**

**Pourquoi cette priorité** : c'est la porte. Sans elle, aucun des trois autres récits n'a de point
de départ, et `R1` ne peut pas savoir qui regarde.

**Test indépendant** : ouvrir l'application sans session, saisir un identifiant connu et un mot de
passe quelconque, constater l'entrée ; saisir un identifiant inconnu, constater **la même phrase**
que pour un mot de passe faux ; recharger la page et constater que le comportement observé est
**celui que l'écran avait annoncé**.

**Scénarios d'acceptation** :

1. **Étant donné** une application ouverte sans session mémorisée, **quand** on demande n'importe
   quelle route du produit, **alors** la connexion s'affiche, et l'adresse demandée est retenue pour
   y revenir après l'entrée.
2. **Étant donné** l'écran de connexion, **quand** on soumet un identifiant qui ne correspond à aucun
   compte du jeu, **alors** le message est **exactement le même** que pour un compte connu avec un
   mot de passe faux, et le délai avant réponse est **indiscernable** entre les deux cas.
3. **Étant donné** l'écran de connexion, **quand** on soumet un champ identifiant vide, **alors**
   l'écran répond « Indiquez un numéro de téléphone ou une adresse e-mail. » — un défaut de saisie
   n'emprunte pas la phrase d'échec de connexion.
4. **Étant donné** un numéro saisi sans indicatif (`07 08 09 10 11`), **quand** il est soumis,
   **alors** il est compris comme le numéro ivoirien correspondant, l'indicatif par défaut de
   l'établissement étant `+225`.
5. **Étant donné** que le stockage durable n'est pas accordé par le moteur, **quand** l'écran de
   connexion s'affiche, **alors** il **annonce** que la session ne survivra pas à la fermeture —
   avant toute saisie, jamais après une déconnexion constatée.
6. **Étant donné** une session ouverte, **quand** on recharge l'application, **alors** on revient
   là où on était sans repasser par la connexion — si et seulement si l'écran l'avait annoncé.

---

### User Story 2 — Un accueil qui ressemble à ce qu'on fait (Priorité : P1)

Adjoua voit, en haut de son accueil, **la seule chose qui compte maintenant** : la chambre 204 dont
le départ est à 11 h, avec le bouton qui l'encaisse. En dessous, ce qui vient ensuite dans l'ordre de
l'heure. À droite, ce qui est à régler et les chiffres du jour. En bas, ses activités — hébergement,
restaurant, bar, pressing, salle de réunion.

Yao, au maquis, voit **un autre écran** : sa salle de neuf tables, ses trois ardoises, sa caisse du
soir. Pas de chambres vides, pas de rubrique « hébergement » barrée, **pas un hôtel amputé** : un
écran qui a l'air d'avoir été conçu pour un maquis.

Aminata voit ses quatre tables et rien d'autre. M. Koffi voit ses deux maisons côte à côte et ne peut
rien saisir.

**Pourquoi cette priorité** : `R1` est le motif dont onze écrans hériteront (`R2`, `M1`, et par
transitivité `P1`, `M3`…). Et c'est là que se prouve la règle la plus facile à trahir du produit :
**absent, jamais grisé**.

**Test indépendant** : basculer de compte et d'établissement au panneau Scénarios et constater que
les quatre variantes s'obtiennent, chacune sans reste — aucune section vide, aucun libellé d'un
service absent, aucun élément inerte.

**Scénarios d'acceptation** :

1. **Étant donné** le compte d'Adjoua sur Hôtel Deloria, **quand** l'accueil s'affiche, **alors** on
   y lit les cinq activités actives de l'établissement, et **rien** d'un module qui n'y est pas.
2. **Étant donné** le compte de Yao sur Chez Tantie Adjo — restauration seule —, **quand** l'accueil
   s'affiche, **alors** le HTML rendu **ne contient pas** les mots « Hébergement », « Pressing » ni
   « Salle de réunion » : ni en texte, ni en attribut, ni sous un élément masqué.
3. **Étant donné** le compte d'Aminata, qui n'a pas le droit d'encaisser, **quand** l'accueil
   s'affiche, **alors** aucune action d'encaissement n'existe dans le document — et il n'y a **aucun
   attribut `disabled`** sur une action absente, puisqu'il n'y a pas d'élément.
4. **Étant donné** un compte qui a le droit d'appliquer une remise mais un établissement sans
   restauration, **quand** l'accueil s'affiche, **alors** l'action est absente : **les deux
   conditions se cumulent**, avoir le droit ne suffit pas si le service n'existe pas ici.
5. **Étant donné** le compte de M. Koffi, **quand** l'accueil s'affiche, **alors** il porte les deux
   établissements et **aucune action ne modifie une caisse** ; la mention de lecture seule est
   présente.
6. **Étant donné** un établissement où **une seule** activité est active, **quand** l'accueil
   s'affiche, **alors** la rubrique « Vos activités » **disparaît entièrement** — une liste à un
   élément qui ne mène nulle part est un reste de mise en page, pas une information.
7. **Étant donné** n'importe laquelle des quatre variantes, **quand** l'accueil s'affiche, **alors**
   il porte **une seule action principale** — celle du bloc de tête — et pas deux.
8. **Étant donné** un accueil dont une source de données est en cours de lecture, **quand** on
   l'observe avant réponse, **alors** un squelette occupe la place exacte de ce qui viendra, et non
   un vide qui fera sauter la mise en page.
9. **Étant donné** une surface dont l'écran cible n'est pas construit — « Encaisser le départ »,
   « Préparer », « Voir les 3 ardoises » —, **quand** l'accueil s'affiche, **alors** elle a
   **l'apparence exacte** d'une surface aboutie : aucune atténuation, aucun badge, aucun attribut
   `disabled`, aucune classe distinctive. **Seul l'appui diffère**, et il nomme l'écran attendu.
10. **Étant donné** que l'index des écrans passe un écran à « construit », **quand** l'accueil
    s'affiche à nouveau, **alors** la mention a disparu **sans que `R1` ait été retouché**.

---

### User Story 3 — Savoir où l'on est, et en changer en deux taps (Priorité : P1)

M. Koffi consulte Deloria, puis veut voir le maquis. Il touche le nom de l'établissement en haut à
gauche : la liste s'ouvre. Il touche « Chez Tantie Adjo » : il y est. **Deux gestes, aucune
reconnexion**, et son accueil s'est refait selon ce que le maquis propose et ce qu'il a le droit d'y
faire.

Pendant tout ce temps, la barre du haut ne bouge pas : le même repère, au même endroit, sur tous les
écrans du produit — l'établissement actif, le poste, l'état de ses envois, l'heure, et lui.

**Pourquoi cette priorité** : `ETB-06` est le seul élément visible sur **tous** les écrans. Un repère
qui se déplace n'est plus un repère, et un changement de contexte non demandé fait saisir une
consommation sur le mauvais site.

**Test indépendant** : sur un compte à plusieurs établissements, compter les gestes entre deux
accueils différents — il en faut exactement deux — et vérifier que la personne connectée n'a pas
changé.

**Scénarios d'acceptation** :

1. **Étant donné** un compte rattaché à plus d'un établissement, **quand** on touche le sélecteur
   puis un autre établissement, **alors** le contexte a changé en **deux** interactions, sans
   repasser par la connexion.
2. **Étant donné** ce changement, **quand** il aboutit, **alors** les permissions affichées sont
   celles du compte **sur le nouvel établissement**, recalculées — un droit détenu ailleurs ne suit
   pas la personne.
3. **Étant donné** un compte rattaché à **un seul** établissement, **quand** l'en-tête s'affiche,
   **alors** le sélecteur n'est **pas un bouton** et ne porte pas de chevron : il ne s'ouvre pas.
4. **Étant donné** un établissement autre que le courant qui remonte une alerte, **quand** l'en-tête
   s'affiche, **alors** la pastille d'alerte est visible sur le sélecteur fermé — et **le contexte ne
   change pas tout seul** pour autant.
5. **Étant donné** n'importe quel écran du produit, **quand** il s'affiche, **alors** l'en-tête est
   présent, à la même place, avec les mêmes éléments dans le même ordre.
6. **Étant donné** le témoin d'envoi, **quand** il s'affiche, **alors** il emploie les libellés du
   lexique — « Enregistré », « En attente d'envoi (n) », « Connexion faible », « Hors connexion » —
   et **jamais** les mots « connecté », « dégradé », « hors ligne » ni « synchronisation ».
7. **Étant donné** un changement d'établissement, **quand** il aboutit, **alors** il est **persisté**
   : rouvrir l'application ramène au dernier établissement choisi, pas au premier de la liste.
8. **Étant donné** un compte rattaché à **un seul** poste — Aminata en salle —, **quand** l'en-tête
   s'affiche, **alors** le poste se lit en second segment sous le nom de l'établissement.
9. **Étant donné** un compte rattaché à **quatre** postes — Adjoua, réception, caisse, gérance et
   restauration —, **quand** l'en-tête s'affiche, **alors** il porte l'établissement **seul** : pas
   de second segment, pas de poste choisi par défaut, pas de mention « plusieurs postes ». Le manque
   se voit à l'écran plutôt que d'être comblé par une affirmation fausse.

---

### User Story 4 — La grammaire que les six cycles suivants reprennent (Priorité : P2)

Un écran du produit s'ouvre : l'en-tête est là, le titre est à la même hauteur qu'hier, l'action
principale au même endroit, le retour au même endroit. Personne ne réapprend rien d'un écran à
l'autre. Et le développeur du cycle F4 n'a **aucune décision de mise en page à reprendre** : il
compose.

**Pourquoi cette priorité** : c'est ce qui rend les six cycles suivants mécaniques. Ce n'est pas P1
parce qu'aucun utilisateur ne la demande — mais la dette qu'elle évite est celle qui coûte le plus.

**Test indépendant** : deux écrans du produit construits par ce cycle (`R0` et `R1`) et une page
témoin partagent la même coquille ; un test constate que l'en-tête n'est écrit **qu'une fois** dans
le dépôt, et qu'aucun écran ne le recopie.

**Scénarios d'acceptation** :

1. **Étant donné** un écran du produit, **quand** il est rendu, **alors** sa racine est **un seul
   élément** — jamais un `v-if`/`v-else` de premier niveau.
2. **Étant donné** la coquille, **quand** on cherche l'en-tête dans le dépôt, **alors** il est défini
   **à un seul endroit**, et aucun écran ne le réécrit.
3. **Étant donné** l'écran de connexion, **quand** il s'affiche, **alors** il **ne porte pas**
   l'en-tête de contexte : il n'y a pas encore de contexte, et un sélecteur d'établissement vide y
   serait un mensonge.
4. **Étant donné** un écran atteint depuis l'accueil, **quand** on demande le retour, **alors** on
   revient à l'accueil de l'établissement courant — et non à l'écran précédent de l'historique, qui
   pourrait appartenir à un autre établissement.
5. **Étant donné** le geste de rendre le poste au suivant, **quand** on l'actionne, **alors** il
   s'appelle **« Passer la main »** et son effet annoncé est « La personne suivante devra entrer son
   identifiant. » — jamais « se déconnecter ».
6. **Étant donné** des enregistrements en attente d'envoi, **quand** on tente de passer la main,
   **alors** le refus est **immédiat** et dit : « Des enregistrements ne sont pas encore partis.
   Attendez le retour du réseau avant de passer la main. »
7. **Étant donné** n'importe quel écran de ce cycle, **quand** on l'affiche en français puis en
   anglais, **alors** aucune chaîne visible n'est en dur et les deux catalogues sont à parité.
8. **Étant donné** n'importe quel écran de ce cycle, **quand** on l'affiche en clair puis en sombre,
   **alors** la bascule se fait par la variante `dark:` et les jetons, sans seconde palette.

---

### User Story 5 — Atteindre les quatre variantes sans recompiler (Priorité : P2)

Un relecteur ouvre le panneau Scénarios, choisit « Yao » et « Chez Tantie Adjo », revient à
l'accueil : c'est l'accueil du maquis. Il choisit « Aminata » : c'est celui de la serveuse. Il choisit
« M. Koffi » : c'est celui du propriétaire. **Sans build, sans fichier à éditer, sans redémarrage.**

**Pourquoi cette priorité** : c'est ce qui rend la promesse de l'US2 **vérifiable** — par un test
automatique comme par un œil humain. Sans elle, « les quatre variantes existent » est une affirmation
qu'on croit sur parole.

**Test indépendant** : depuis un seul démarrage de l'application, produire les quatre accueils en ne
touchant que le panneau Scénarios.

**Scénarios d'acceptation** :

1. **Étant donné** le panneau Scénarios, **quand** on l'ouvre, **alors** on peut choisir le compte
   actif parmi les personnes du jeu, et l'établissement actif parmi ceux où ce compte a des droits.
2. **Étant donné** un compte choisi, **quand** on liste les établissements, **alors** ceux où le
   compte n'a aucun droit **ne sont pas proposés** — les proposer et refuser ensuite serait un grisé
   déguisé.
3. **Étant donné** un changement de compte au panneau, **quand** on revient à l'accueil, **alors**
   il est **entièrement** refait : bloc de tête, listes, activités, chiffres.
4. **Étant donné** les leviers du cycle F1 (hors ligne, latence, jeu vide, échec réseau), **quand**
   on les actionne, **alors** l'accueil et la connexion réagissent — chargement, état vide illustré,
   erreur — **sans qu'aucun composant ne sache qu'un scénario existe**.
5. **Étant donné** le panneau Scénarios, **quand** il est atteint, **alors** sa route porte le trait
   bas de l'instrument (`/_scenarios`) : ce n'est pas le produit.
6. **Étant donné** le panneau Scénarios, **quand** on choisit successivement un compte rattaché à un
   seul poste puis un compte rattaché à quatre, **alors** on obtient **les deux formes d'en-tête** —
   avec second segment, et sans.

---

### User Story 6 — L'accueil quand rien ne va (Priorité : P3)

Le réseau est coupé, ou la lecture échoue, ou l'établissement vient d'être créé et n'a rien. Adjoua
ne voit ni page blanche, ni tourniquet éternel, ni message d'ingénieur : elle voit ce qui est
disponible, et une phrase qui dit ce qui manque et ce qu'elle peut faire.

**Pourquoi cette priorité** : ce sont les états de `S3`, dont `R0` hérite explicitement, et sans
lesquels un écran de production n'est pas fini. P3 parce qu'ils se posent après que le chemin nominal
tient.

**Test indépendant** : actionner chaque levier du panneau Scénarios, et constater sur `R0` puis `R1`
un état nommé, jamais un vide.

**Scénarios d'acceptation** :

1. **Étant donné** le levier « jeu vide », **quand** l'accueil s'affiche, **alors** chaque rubrique
   sans donnée porte un **état vide illustré** qui dit ce qui viendra s'y loger, et non un cadre
   nu.
2. **Étant donné** le levier « échec réseau », **quand** une rubrique échoue, **alors** **les autres
   restent affichées** — un accueil est composé de sources indépendantes, et l'une qui tombe n'en
   emporte pas cinq.
3. **Étant donné** le levier « hors ligne » et aucune session mémorisée, **quand** la connexion
   s'affiche, **alors** elle dit qu'elle ne peut pas aboutir maintenant, **avant** la saisie — jamais
   après un envoi qui échoue.
4. **Étant donné** le levier « latence », **quand** l'accueil charge, **alors** chaque rubrique porte
   son squelette pendant l'attente, à la place et à la taille de ce qui viendra.

---

### Cas limites

- **Un compte sans aucun établissement** (l'administrateur éditeur, dont le rattachement est
  `null`) : l'accueil ne peut pas se composer sur un établissement. Il voit un accueil qui le dit et
  ne propose que ce qui a un sens sans site — jamais un accueil vide, jamais une erreur.
- **Un compte à un seul établissement** : le sélecteur perd son chevron et cesse d'être un bouton.
- **Un compte à plus de deux établissements** : la maquette du propriétaire en montre deux. La liste
  défile ; le motif ne change pas.
- **Un établissement dont *aucun* module n'est actif** : l'accueil ne montre aucune activité et le
  dit — c'est le cas d'un établissement fraîchement provisionné, pas une anomalie.
- **Un compte dont l'état n'est pas `ACTIF`** (suspendu, révoqué) : la connexion rend **la même
  phrase** que pour un mot de passe faux. Un message distinct publierait la liste des comptes.
- **Le stockage refusé en cours de session** (quota, mode privé) : la session tenue en mémoire
  continue de fonctionner, et l'application le signale **au moment où elle le découvre**.
- **Un changement d'établissement pendant qu'une rubrique charge** : la réponse tardive appartient à
  l'établissement précédent et **ne s'affiche pas** — sinon Deloria montre les chiffres du maquis.
- **Deux onglets ouverts sur deux établissements différents** : chaque onglet garde son contexte ;
  le dernier changement fait est celui qui est repris à la prochaine ouverture.
- **Un identifiant qui ressemble à un e-mail *et* à un numéro** (`0708091011@…`) : la forme e-mail
  l'emporte dès qu'un `@` est présent.
- **Le retour depuis l'accueil lui-même** : il n'y en a pas — l'accueil est la racine du produit.

---

## Exigences *(obligatoire)*

### La connexion — `R0`

- **FR-001** : L'écran de connexion DOIT accepter un identifiant sous **deux formes** : un numéro de
  téléphone au format E.164 et une adresse e-mail. Le champ est unique ; la forme est déduite de ce
  qui est saisi.
- **FR-002** : Un numéro saisi sans indicatif DOIT être complété par **l'indicatif par défaut de
  l'établissement** (`+225` en Côte d'Ivoire), lu de la configuration et **jamais écrit en dur**.
- **FR-003** : Le système DOIT rendre **une seule et même phrase** — « Identifiant ou mot de passe
  incorrect » — pour le compte inconnu, le mot de passe faux, le compte suspendu et le compte
  révoqué.
- **FR-004** : Le délai de réponse DOIT être **indiscernable** entre le cas « compte inconnu » et le
  cas « mot de passe faux ». En simulation, cela signifie un délai identique sur les deux chemins,
  vérifié par comparaison de médianes.
- **FR-005** : Un identifiant vide DOIT rendre « Indiquez un numéro de téléphone ou une adresse
  e-mail. » — un défaut de saisie n'emprunte jamais la phrase d'échec de connexion.
- **FR-006** : L'écran DOIT **annoncer, avant toute saisie**, si la session survivra à la fermeture
  de l'application, en interrogeant la capacité de stockage durable **avant** de s'en servir.
- **FR-007** : Quand le stockage durable n'est pas accordé, l'annonce DOIT dire ce qui se passera et
  ce qui reste possible — jamais un avertissement technique, jamais un simple constat d'échec.
- **FR-008** : Le système NE DOIT porter **aucun secret** : le mot de passe saisi n'est ni conservé,
  ni comparé à quoi que ce soit, ni envoyé nulle part. **N'importe quel mot de passe non vide entre**
  dès lors que l'identifiant correspond à un compte du jeu.
- **FR-009** : L'écran de connexion NE DOIT PAS porter l'en-tête de contexte.
- **FR-010** : Une demande de route du produit sans session DOIT conduire à la connexion, et
  l'adresse demandée DOIT être reprise après l'entrée.
- **FR-011** : Le mot « session » et les mots « jeton », « rafraîchissement », « JWT » NE DOIVENT
  apparaître nulle part dans le visible.
- **FR-012** : Hors ligne et sans session mémorisée, l'écran DOIT dire **avant la saisie** qu'il ne
  peut pas aboutir.

### L'accueil — `R1`

- **FR-013** : L'accueil DOIT composer ses surfaces à partir de **deux conditions cumulées** : la
  permission détenue par le compte **sur l'établissement courant**, et l'activité du module concerné
  **sur cet établissement**.
- **FR-014** : Une surface non autorisée ou d'un module inactif DOIT être **absente du HTML rendu**.
  Ni grisée, ni masquée en CSS, ni porteuse d'un attribut `disabled`. Le test porte sur le document.
- **FR-015** : Une rubrique dont **toutes** les surfaces sont absentes DOIT disparaître avec son
  titre — un intitulé sans contenu est un reste de mise en page.
- **FR-016** : L'accueil DOIT porter **une seule action principale**, dans le bloc de tête, et elle
  DOIT nommer ce qui attend maintenant.
- **FR-017** : Les quatre variantes maquettées DOIVENT être atteignables : générique, propriétaire,
  serveuse, maquis.
- **FR-018** : Sur un établissement à **module unique**, l'accueil NE DOIT contenir aucune mention
  d'un service absent — ni intitulé, ni compteur à zéro, ni emplacement réservé.
- **FR-019** : Pour un compte en lecture seule, **aucune** surface qui modifie une caisse ne DOIT
  exister, et la portée de sa consultation DOIT être dite en clair.
- **FR-020** : Les montants DOIVENT s'afficher en unités majeures de la devise de l'établissement, en
  chiffres tabulaires, **calculés depuis des entiers en unités mineures**.
- **FR-021** : Chaque rubrique de l'accueil DOIT porter ses **quatre états** : chargement (squelette
  à la place exacte du contenu), vide (illustré et nommé), en erreur, et nominal.
- **FR-022** : L'échec d'une rubrique NE DOIT PAS emporter les autres.
- **FR-023** : Une réponse qui arrive après un changement d'établissement NE DOIT PAS s'afficher.
- **FR-024** : L'accueil DOIT s'afficher aussi bien pour un compte **sans aucun établissement** — il
  dit alors ce qui manque.

### Le sélecteur de contexte — `ETB-06`

- **FR-025** : Un en-tête permanent DOIT être présent sur tous les écrans du produit **atteints avec
  une session**, à la même place, avec les mêmes éléments dans le même ordre : marque ·
  établissement actif et poste · témoin d'envoi · heure et date · personne et ce qu'elle fait.

  > **La restriction n'est pas une échappatoire, c'est ce qui rend FR-009 possible.** `R0` est l'un
  > des écrans du produit, et il n'a pas d'en-tête : avant l'entrée, il n'y a ni établissement, ni
  > poste, ni personne à afficher. Un « tous » sans réserve rendrait les deux exigences
  > contradictoires, et c'est la plus faible qui aurait cédé à l'implémentation.
- **FR-026** : Le changement d'établissement DOIT s'obtenir en **deux interactions** et **sans
  reconnexion**.
- **FR-027** : Après un changement d'établissement, les permissions DOIVENT être **recalculées pour
  ce site** — un droit détenu ailleurs ne suit pas la personne.
- **FR-028** : Avec **un seul** établissement, le sélecteur NE DOIT PAS être un bouton et NE DOIT PAS
  porter de chevron.
- **FR-029** : Une alerte d'un **autre** établissement DOIT être visible sur le sélecteur fermé, et
  le contexte NE DOIT **jamais** changer de lui-même.
- **FR-030** : Le poste actif DOIT être **affiché, jamais choisi** : il est dérivé du rattachement du
  compte sur l'établissement courant. Aucun sélecteur de poste n'existe.
- **FR-030a** : Quand le rattachement désigne **un seul** poste, l'en-tête DOIT l'afficher en second
  segment, sous le nom de l'établissement — « Yopougon · réception ».
- **FR-030b** : Quand le rattachement en désigne **plusieurs**, l'en-tête DOIT afficher
  l'établissement **seul, sans second segment**. Il NE DOIT PAS choisir un poste par défaut, ni en
  afficher la liste, ni écrire « plusieurs postes ».

  > **Pourquoi ne rien écrire plutôt qu'écrire quelque chose.** Le second segment **affirme un
  > fait** : « Adjoua est à la réception ». Quand le système ne le sait pas — et il ne le sait pas,
  > Adjoua cumule réception, caisse et gérance —, l'affirmer est un mensonge que les cycles F3 à F7
  > hériteraient sans le rejuger. Ne rien afficher **rend le manque visible à l'écran**, ce qui est
  > l'objet même de la phase 2 : découvrir ce qui manque avant d'écrire le backend qui le fournira.

- **FR-030c** : Le panneau Scénarios DOIT permettre d'obtenir **les deux en-têtes** : un compte
  rattaché à un seul poste, et un compte rattaché à quatre. Les deux DOIVENT être observables à la
  fin du cycle.
- **FR-031** : Le témoin d'envoi DOIT employer les libellés de `docs/design/lexique.md` :
  « Enregistré », « En attente d'envoi (n) », « Connexion faible », « Hors connexion ». Le décompte
  est **exact**, jamais un pourcentage.
- **FR-032** : L'établissement actif DOIT être **persisté** et repris à l'ouverture suivante.
- **FR-033** : Les mots « rôle », « permission », « synchronisation » et « session » NE DOIVENT
  apparaître nulle part dans le visible.

### La coquille et la grammaire

- **FR-034** : L'en-tête, le thème, la reprise de session et le cadre de page DOIVENT vivre dans les
  couches partagées de l'application — **jamais recopiés écran par écran**.
- **FR-035** : Tout écran du produit DOIT avoir **une seule racine, qui est un élément** — jamais un
  `v-if`/`v-else` de premier niveau.
- **FR-036** : Le retour depuis un écran atteint depuis l'accueil DOIT ramener à **l'accueil de
  l'établissement courant**, jamais à l'entrée précédente de l'historique.
- **FR-037** : Le geste de rendre le poste DOIT s'appeler **« Passer la main »**, et son effet
  annoncé DOIT être « La personne suivante devra entrer son identifiant. »
- **FR-038** : « Passer la main » DOIT être **refusé immédiatement** tant que des enregistrements
  attendent d'être envoyés, avec la phrase du lexique — jamais un échec constaté après coup.
- **FR-039** : Aucune chaîne visible NE DOIT être en dur ; les catalogues **fr** et **en** DOIVENT
  être à **parité stricte**, fr par défaut.
- **FR-040** : Aucune couleur, espacement, rayon, durée ou courbe littéral NE DOIT exister hors des
  jetons de `@theme`. Le mode sombre passe par la variante `dark:` **uniquement**.
- **FR-041** : Les deux écrans construits DOIVENT s'atteindre sous **Chromium et WebKit**, en **clair
  et en sombre** — c'est ce que la porte P-04 exige de tout écran marqué `CONSTRUIT`.
- **FR-042** : L'index des écrans DOIT être mis à jour dans **le même changement** : `R0` et `R1`
  passent à `CONSTRUIT` avec leur route, et la racine `/` cesse de rediriger vers l'instrument pour
  servir `R1`.
- **FR-043** : Les routes visibles DOIVENT respecter le lexique : le nom du fichier de page décide de
  la route, et une URL est vue.

### Le jeu de données et le panneau Scénarios

- **FR-044** : Le jeu simulé DOIT porter un **maquis** — « Chez Tantie Adjo », Abobo, restauration
  seule, neuf tables et un comptoir — sans lequel la quatrième variante n'a rien à afficher.
- **FR-045** : Le jeu DOIT porter les rattachements qui rendent les quatre variantes vraies : Adjoua
  cumulant trois rôles sur Deloria, Aminata en salle, Yao au maquis, M. Koffi propriétaire sur deux
  sites en lecture seule.
- **FR-046** : Le panneau Scénarios DOIT permettre de choisir le **compte actif** et
  l'**établissement actif**, et NE DOIT proposer que les établissements où le compte a des droits.
- **FR-047** : Les choix du panneau DOIVENT être **persistés** : un réglage qui ne survit pas au
  rechargement cesse d'être employé.
- **FR-048** : Les leviers de scénario NE DOIVENT s'appliquer **que** dans la couche de simulation.
  Aucun composant d'écran ne sait qu'un scénario existe.
- **FR-049** : Toute donnée nouvelle du jeu DOIT porter **les mêmes noms de champs et les mêmes
  valeurs d'énumération** que le fichier SQL du schéma correspondant.

### Ce que le cycle ne fait pas, et le dit

- **FR-050** : Aucune vérification de mot de passe, aucun hachage, aucune limitation de débit ne DOIT
  être implémentée. Les paramètres de `CPT-01` (durées de jeton, fenêtre de tentatives, longueur
  minimale) sont **de la phase 3**.
- **FR-051** : Aucun appel réseau ne DOIT être émis.
- **FR-052** : Une surface dont l'écran cible n'est pas encore construit DOIT être **présente et
  normale** — même apparence, même place, même poids visuel qu'une surface aboutie —, et **dire à
  l'appui** que l'écran vient d'un cycle ultérieur, en nommant l'écran attendu.
- **FR-052a** : La surface DOIT avoir **l'apparence exacte qu'elle aura au cycle F7** : ni atténuée,
  ni assombrie, ni **badgée**, sans attribut `disabled`, sans classe ni marque qui la distingue d'une
  surface aboutie. **Seul l'appui diffère.**

  > **Un badge « bientôt » réintroduirait le grisé par la porte de derrière**, et `R1` cesserait
  > d'être comparable à sa maquette — ce qui était la raison même de ce choix.



  > **Ce n'est pas une entorse à « absent, jamais grisé », c'est son contraire exact.** La règle
  > protège l'utilisateur d'une action *qu'il n'a pas le droit de faire* ou *d'un service qui
  > n'existe pas ici* — ces deux-là restent absents, sans exception (FR-014). Ici l'action existe,
  > la personne y a droit, le service est actif : ce qui manque est **de notre côté**, et le dire
  > est honnête. L'effacer donnerait de `R1` une image fausse au moment précis où onze écrans
  > doivent en hériter le motif.

- **FR-052b** : La mention DOIT **lire son état dans l'index des écrans du cycle F1**, qui porte déjà
  l'avancement de chacun des quarante-six. Elle NE DOIT PAS être une chaîne écrite à la main dans
  `R1`, ni une liste tenue à côté.

  > **Une mention écrite à la main dérive, et il faudrait la retoucher onze fois.** Adossée à
  > l'index, elle **disparaît d'elle-même** à mesure que les cycles livrent : `R1` n'est jamais
  > rouvert, et la source qui dit ce qui est construit reste unique — celle que la porte P-04 lit
  > déjà.

### Documents à mettre à jour dans le même changement

- **FR-053** : `docs/design/html/R1-accueil*.html` (quatre fichiers) DOIVENT être corrigés là où ils
  affichent « À jour · il y a 1 min » au témoin d'envoi : **le lexique fait foi**, et ce libellé n'est
  pas l'un des quatre qu'il autorise. Une maquette qui ment est pire qu'une maquette absente.
- **FR-054** : `docs/design/derivation.md` DOIT recevoir toute route décidée ici qui n'y figure pas,
  et tout écran découvert à l'implémentation, avec sa mention.
- **FR-055** : `app/core/ecrans/index.ts` DOIT refléter l'avancement réel — la source est unique, et
  c'est elle que la porte lit.

---

## Entités clés

- **Compte** — l'identité qui porte les rattachements. Distincte de la **personne** (identité civile)
  et de l'**employé** (contrat, provision vide). Un compte a un identifiant (téléphone ou e-mail) et
  un état.
- **Personne** — nom et prénoms, ce qui s'affiche dans l'en-tête. Jamais « utilisateur ».
- **Rattachement** — ce qui lie un compte à ce qu'il peut faire **sur un établissement donné**. Un
  compte en porte plusieurs ; ce qu'il peut faire est leur **union**. Ni le mot « rôle » ni le mot
  « permission » n'atteint l'écran.
- **Établissement** — le site : nom, commune, devise, indicatif par défaut, modules actifs.
- **Module d'activité** — hébergement, restauration, bar, pressing, salle de réunion. Un module
  **absent de la liste des actifs est inactif** — l'interface ne reçoit jamais un module inactif
  accompagné d'un drapeau, précisément pour qu'aucun écran n'ait à décider d'en griser un.
- **Poste** — le point de vente ou l'emplacement depuis lequel on travaille : réception, bar,
  restaurant, comptoir. L'absence de tables **est** le comptoir.
- **Contexte actif** — le triplet (compte, établissement, poste) que l'en-tête affiche et que la
  coquille reprend à chaque ouverture.
- **Surface d'accueil** — un élément composable de `R1` : bloc de tête, ligne de suite, tuile
  d'activité, carte à régler, carte de chiffre. Chacune déclare la permission et le module qu'elle
  suppose ; c'est ce qui la rend filtrable sans que l'écran ne juge.

---

## Critères de succès *(obligatoire)*

### Résultats mesurables

- **SC-001** : Les **quatre** accueils maquettés s'obtiennent depuis un **seul** démarrage de
  l'application, sans recompiler ni éditer un fichier.
- **SC-002** : Le changement d'établissement se fait en **deux** interactions, et la personne
  connectée n'a pas changé.
- **SC-003** : Sur l'accueil du maquis, le document rendu **ne contient aucune** occurrence des
  services absents — mesuré sur le HTML, pas sur un attribut.
- **SC-004** : Sur l'accueil de la serveuse, **aucun** élément d'encaissement n'existe dans le
  document, et **aucun** élément de l'accueil ne porte l'attribut `disabled`.
- **SC-005** : Le message d'échec de connexion est **identique** dans les quatre cas d'échec, et
  l'écart de médiane de temps de réponse entre « compte inconnu » et « mot de passe faux » reste
  **inférieur à 10 %**.
- **SC-006** : Avant toute saisie, l'écran de connexion dit ce que deviendra la session — vérifié
  dans les deux cas, stockage accordé et stockage refusé.
- **SC-007** : Les deux écrans construits s'atteignent sous **Chromium et WebKit**, en **clair et en
  sombre** : quatre passages, quatre verts.
- **SC-008** : Un relecteur qui n'a jamais vu le produit trouve l'établissement actif, l'état de ses
  envois et son identité **sans les chercher** — ils sont au même endroit sur chaque écran.
- **SC-009** : Chaque rubrique de l'accueil montre ses quatre états sous les leviers du panneau
  Scénarios : chargement, vide, erreur, nominal.
- **SC-010** : Les catalogues **fr** et **en** sont à parité stricte : aucune clé d'un côté sans son
  équivalent de l'autre.
- **SC-011** : Aucune valeur littérale de couleur, d'espacement, de rayon ou de durée n'existe hors
  des jetons.
- **SC-012** : `scripts/verifier.sh` est **vert** — les préalables et les six portes.
- **SC-013** : Les **deux** formes d'en-tête s'obtiennent depuis le panneau Scénarios : poste unique
  affiché en second segment, postes multiples sans second segment.
- **SC-014** : Aucune surface de `R1` ne se distingue visuellement d'une autre selon que son écran
  cible est construit ou non — vérifié sur le document rendu : ni opacité, ni classe, ni attribut,
  ni texte supplémentaire.

---

## Hypothèses

- **Le mot de passe n'est pas vérifié.** Il n'existe pas de secret côté client (aucun n'est servi au
  navigateur, `CPT-01`), et il n'y a pas de serveur en phase 2. La connexion **simule** : elle
  reconnaît l'identifiant dans le jeu, accepte tout mot de passe non vide, et rend la phrase d'échec
  autrement. Ce qui est construit ici, c'est **l'écran, ses états et sa grammaire d'erreur** — la
  vérification arrivera en phase 3 sans que l'écran change.
- **La variante « propriétaire » est un état de `R1`, pas l'écran `M4`.** Le fichier de maquette
  porte le code `R1` ; son sélecteur affiche « Mes 2 établissements » au lieu d'un site. On le traite
  donc comme un **troisième état du sélecteur d'établissement** — « tous » — que le contexte actif
  sait porter. `M4` reste l'écran mobile du cycle F7.
- **« Chez Tantie Adjo » s'ajoute au jeu ; « Résidence Test » reste.** Le premier sert la variante
  maquis (restauration seule, neuf tables) ; le second sert le cas « module unique hébergement » posé
  au cycle F1. Les deux appartiennent au tenant de M. Koffi, ce que la maquette du propriétaire
  suppose déjà.
- **Le témoin d'envoi de ce cycle n'a rien de réel à afficher.** Il n'y a ni file véritable ni
  serveur : il rend l'état que les leviers du panneau Scénarios lui donnent. La forme est définitive,
  la source ne l'est pas.
- **Le poste actif est lu du rattachement, jamais choisi** (FR-030, tranché). Et quand le
  rattachement en désigne plusieurs, **rien ne s'affiche** : le second segment affirme un fait, et
  affirmer ce qu'on ne sait pas est un mensonge que six cycles hériteraient. Ce que ce cycle laisse
  **volontairement** ouvert est donc la question « d'où le système saura-t-il à quel poste on est ? »
  — elle appartient au cycle qui aura plusieurs points de vente à départager (F4).
- **L'heure et la date de l'en-tête viennent de l'appareil**, et sont rendues au fuseau de
  l'établissement. Elles ne portent **aucune règle** : `cree_le` fait autorité pour tout, et ce qui
  s'affiche ici relève de l'exemption « rendu de l'instant perçu ».
- **La navigation de ce cycle passe par les surfaces de l'accueil**, sans barre latérale ni barre
  basse : aucune des onze maquettes n'en montre. Si un cycle ultérieur en exige une, elle s'inscrira
  à `docs/design/derivation.md` comme un ajout à la coquille, jamais comme une seconde grammaire.
- **Le retour est un motif de la coquille, pas un composant nouveau.** Les seize composants
  canoniques suffisent ; ce cycle décide seulement **où** il se pose et **où** il mène.
- **La mention « cet écran arrive au cycle Fn » n'est pas un composant dix-septième.** C'est un
  message bref, rendu au motif déjà posé pour l'annonce d'une capacité absente au cycle F1 — même
  forme, même place, autre motif. Elle lit l'index des écrans et disparaît d'elle-même.
- **Aucun écran de création ou de récupération de compte** : `CPT-01` ne les demande pas au MVP, et
  un exploitant reçoit son accès de son gérant.

---

## Dépendances

- **Le cycle F1 (`specs/003-coquille-application/`)** est clos et fournit : la coquille et son cycle
  de vie, le thème clair/sombre, les seize composants, le panneau Scénarios et ses leviers, les
  interfaces de domaine simulées, le registre des capacités de plateforme, la file locale, l'index
  des écrans et les six portes.
- **La phase 1** fournit le modèle : `docs/modele-donnees/10-etablissements.sql` et
  `20-comptes.sql` donnent les noms de champs et les valeurs d'énumération dont ce cycle ne s'écarte
  pas.
- **Aucune dépendance à un service externe, un réseau ou un serveur.**
