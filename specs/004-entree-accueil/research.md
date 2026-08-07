# F2 — Entrée · Recherche (phase 0)

*Ce que ce cycle a dû trancher avant d'écrire une ligne. Chaque entrée porte **la décision**, **le
motif**, et **ce qui a été écarté**. Les constats sont datés du **2026-08-07**.*

> **Ce document ne rejuge rien de ce que F1 a posé.** La coquille, les seize composants, la file, le
> panneau Scénarios, les interfaces de domaine et les six portes sont acquis. Ce cycle **compose**.

---

## 1. Versions — deux familles ouvertes, une dépendance ajoutée

`docs/versions-reference.md` §1 fait foi : **la dernière stable, sauf conflit constaté**. Les valeurs
déjà inscrites sont reprises **sans revérification** (consigne de cycle). Ce qui suit ne concerne que
ce qui manquait.

### 1.1 Numéros de téléphone — famille **ouverte**, retenu : `libphonenumber-js`

**Décision** : ajouter `libphonenumber-js` **1.13.10**, exact.
**Registre interrogé** : `https://registry.npmjs.org/libphonenumber-js/latest`, **le 2026-08-07**.
**Constaté** : MIT · **aucune dépendance** · **aucune `peerDependency`**. Rien à résoudre en plus,
rien à contraindre.

**Pourquoi ce qui est déjà là ne suffit pas.** FR-001 et FR-002 demandent d'accepter un numéro sous
la forme que l'exploitant tape — `07 08 09 10 11`, `+225 07 08 09 10 11`, `0708091011` — et d'en
faire un E.164 comparable à l'identifiant du jeu. Aucune dépendance présente ne connaît un plan de
numérotation : ni Nuxt, ni `uuid`, ni `idb`. Et l'écrire à la main, c'est réimplémenter le plan
ivoirien — dont les numéros mobiles sont **passés à dix chiffres en 2021**, ce qu'une expression
régulière écrite aujourd'hui figera sans le dire. Le produit vise en outre **un second pays**
(incrément 3, second adaptateur de juridiction) : la table de plans ne serait pas une exception mais
une dette annoncée.

**Le sous-ensemble retenu est `libphonenumber-js/min`** — métadonnées réduites, suffisantes pour
analyser et formater un numéro dont le pays est connu. C'est notre cas : l'indicatif par défaut vient
de la configuration de l'établissement (`indicatif_telephonique_defaut`, `+225`), jamais deviné.

**Écartés** — inscrits au §3.4 pour que la question ne se repose pas :

| Écarté | Motif du constat |
|---|---|
| `google-libphonenumber` | Portage du code Java par Closure Compiler : ~550 ko, et il embarque son propre système de modules. Le paquet livré à l'Android 2 Go d'Aminata n'a pas cette place. |
| `awesome-phonenumber` | Enveloppe du précédent — même poids, une indirection de plus. |
| **Une validation maison** | Ce sont les soixante lignes qu'on écrit pour éviter une bibliothèque, et elles ne diraient rien du second pays. |

### 1.2 Date et heure côté JavaScript — famille **ouverte**, retenu : **`Intl` natif, aucune dépendance**

L'en-tête affiche « 09 h 40 » et « Mardi 14 juillet », **au fuseau de l'établissement**
(`fuseauHoraire`, colonne du modèle). La famille « date et heure (JS) » est absente du §3.4 : ce
cycle l'ouvre et **tranche pour tout le dépôt**.

**Décision** : `Intl.DateTimeFormat` avec l'option `timeZone`, enveloppé dans **une seule fonction**
de `app/core/format/`, à côté de `montant.ts` — qui a déjà posé le motif « une seule fonction écrit
ce format, partout ».

**Motif.** Le besoin réel tient en trois lignes : une heure, une date longue, et une durée relative
(« il y a 1 min »). `Intl` fait les deux premières **avec le fuseau**, ce qui est précisément le point
dur — et il est natif dans les deux moteurs de la porte P-04. La règle 4 du §1 écarte elle-même
l'ajout quand ce qui est présent suffit.

**Le seul écart au natif est assumé et local** : `fr-FR` rend `09:40`, la maquette écrit `09 h 40`.
La substitution du séparateur se fait dans la fonction d'enveloppe, **une fois**, et non à chaque
appel — exactement comme `montant.ts` impose son U+202F.

**Écartés** : `date-fns` (arbre de plusieurs centaines de modules pour trois formats, et son support
des fuseaux exige un second paquet `date-fns-tz`), `dayjs` (fuseaux par greffon, donc deux briques),
`luxon` (embarque ses propres données de locale, redondantes avec `Intl`), `moment` (en maintenance
close par ses auteurs).

### 1.3 Rien à monter

Le cycle F1 s'est clos **le 2026-08-07**, jour de ce plan. Toutes les versions du manifeste ont été
vérifiées au registre à cette date. **Aucune montée n'est faite ici** : elle serait un changement
sans constat.

---

## 2. Le poste actif — le modèle ne le porte pas, et c'est le fait qui décide

**Constat, vérifié dans le SQL** : `docs/modele-donnees/20-comptes.sql` **ne contient aucune
référence à un point de vente**. `compte_role` lie un compte à un rôle **et à un établissement** — et
s'arrête là. Il n'existe, dans tout le modèle de phase 1, **aucun lien `compte → point_de_vente`**.

C'est le fait qui rend la décision de FR-030b juste plutôt que prudente : **le système ne sait pas à
quel poste on est**, et il ne pourra pas le savoir tant qu'un cycle n'aura pas décidé d'où l'info
vient. Afficher « réception » serait une affirmation sans source.

### 2.1 Ce qui est dérivable, et ce qui ne l'est pas

Ce qui **est** dérivable sans rien ajouter au modèle :

```
compte ─(compte_role, sur cet établissement)→ rôles
      ─(role_permission)→ permissions
      ─(permission.module_activite_code)→ modules
      ─(point_de_vente.module_activite_id)→ postes candidats
```

**Décision** : le poste affiché est ce chemin, **et seulement quand il rend exactement un poste**.

| Compte | Modules atteints sur le site | Postes candidats | En-tête |
|---|---|---|---|
| **Yao**, Chez Tantie Adjo | `RESTAURATION` | **1** — La salle | « Abobo · La salle » |
| **Aminata**, Deloria | `RESTAURATION`, `BAR` | **2** | « Yopougon » — pas de second segment |
| **Adjoua**, Deloria | `HEBERGEMENT`, `RESTAURATION`, caisse, gérance | **4** | « Yopougon » — pas de second segment |
| **M. Koffi**, vue d'ensemble | — (lecture seule, deux sites) | 0 | « Abidjan » |

Les **deux formes d'en-tête** exigées par FR-030c sont donc obtenues par deux comptes du jeu, sans
levier ni réglage : Yao pour la forme longue, Adjoua pour la courte.

### 2.2 Ce que le second segment porte, et ce qu'il ne porte plus

Les onze maquettes emploient cet emplacement pour **deux choses différentes** : un poste (`R4` :
« Yopougon · réception » ; `R7` : « Réception · Grand-Bassam ») et un volume d'établissement
(`R1` : « Yopougon · 20 chambres », « Abobo · 9 tables »). Le cycle qui pose la grammaire ne peut pas
laisser deux sens au même emplacement.

**Décision, opposable aux six cycles suivants** :

- le **détail** du composant 09 porte **la commune**, toujours — c'est ce qui oriente en multi-sites ;
- le **poste** est un **second segment distinct**, affiché **seulement s'il est unique** ;
- **« 20 chambres » et « 9 tables » sortent de l'en-tête**. Ce sont des informations de contenu, pas
  d'orientation : elles vivent dans le corps de l'accueil, où elles sont déjà.

**Conséquence assumée** : les quatre maquettes `R1` sont corrigées dans le même changement (voir §7).

---

## 3. La connexion simulée — trois points durs

### 3.1 Le délai indiscernable, sans horloge à truquer

`CPT-01` est explicite : *« un refus en 2 ms sur compte inexistant contre 90 ms sur mot de passe faux
publie la liste des comptes »*. En phase 3 c'est un hachage factice ; en phase 2 il n'y a **rien à
hacher**.

**Décision** : les deux chemins d'échec traversent **la même fonction**, qui attend le délai de
scénario **avant** de décider — comme `lireSimule` le fait déjà pour les lectures : hors ligne,
échec réseau, **puis** latence, **puis** production du résultat. Le verdict est calculé **après**
l'attente, jamais avant.

**Ce que le test mesure** : la médiane de vingt tentatives sur chaque chemin, écart **< 10 %**
(SC-005). Un test de temps est fragile par nature ; celui-ci ne l'est pas, parce que l'attente est
**déterministe** — c'est le levier de latence du panneau Scénarios, pas une horloge réelle.

**Écarté** : mesurer en test de navigateur. Le bruit du moteur dépasserait l'écart qu'on cherche à
prouver. C'est un test d'unité sur la fonction de domaine.

### 3.2 La persistance annoncée — `STOCKAGE_DURABLE` est **réservée**, pas absente

**Constaté** dans `specs/003-coquille-application/contracts/platform-adapter.md` §5 :
`STOCKAGE_DURABLE` vaut ⚠️ **purgeable après inactivité** sur Chromium, ⚠️ **purge plus agressive**
sur WebKit, ✅ adossé au matériel sous Capacitor. Le registre de capacités du cycle F1 la classe
`reservee` sur les deux moteurs web — **ni présente, ni absente : conditionnelle**.

**Décision** : l'écran de connexion interroge le registre **avant d'afficher**, et rend l'une de deux
phrases — jamais un troisième cas silencieux. La condition levée est
`navigator.storage.persist()`, qui **demande** la durabilité au moteur ; la réponse est un fait, pas
une promesse.

| Réponse du moteur | Ce que l'écran dit, avant toute saisie |
|---|---|
| durabilité accordée | « Vous resterez connectée sur cet appareil. » |
| refusée ou indisponible | « Cet appareil peut vous redemander votre identifiant. » + ce qui reste possible |

**Ce que cela ferme** : la découverte d'une déconnexion une heure plus tard, devant un écran qu'on
n'a pas demandé. C'est le motif exact du prompt de cycle.

**Piège relevé** : `navigator.storage.persist()` est **asynchrone** et peut ouvrir une invite du
navigateur. Il est appelé **une fois**, au premier affichage de `R0`, et son verdict est mémorisé
pour la durée de la session — le rappeler à chaque rendu ferait clignoter l'annonce.

### 3.3 Le mot de passe qui n'est comparé à rien

**Décision** : la fonction de domaine reçoit l'identifiant **et** le mot de passe, et **n'emploie que
le premier**. Le second est nommé, typé, et ignoré — avec le commentaire qui dit pourquoi.

**Motif.** Le supprimer de la signature ferait de la phase 3 une **rupture d'interface** : l'écran
devrait changer le jour où l'authentification arrive. Le garder rend le branchement mécanique — c'est
toute la raison d'être de la couture (`app/core/donnees/`). Et il n'est **ni stocké, ni journalisé,
ni comparé** : aucun secret n'existe côté client (`CPT-01`, cadrage §12.1).

---

## 4. La mention « cet écran arrive au cycle Fn », adossée à l'index

FR-052b exige qu'elle **lise l'index des écrans** et disparaisse d'elle-même. L'index de F1 porte
déjà, pour chacun des quarante-six, un `code`, une `route` et un `avancement`
(`CONSTRUIT` | `PAS_COMMENCE`).

**Décision** : une surface d'accueil déclare **le code de l'écran qu'elle ouvre** — `'R7'`, `'R3'`,
`'C4'` — et rien d'autre. Au clic, une fonction unique interroge l'index :

- l'écran est `CONSTRUIT` et porte une route → on y navigue ;
- sinon → la mention s'affiche, **avec le titre de l'écran lu à l'index**, jamais une chaîne écrite
  dans `R1`.

**Ce que cela ferme, et qui est le vrai risque** : onze écrans hériteront du motif de `R1`. Une
mention écrite à la main y serait recopiée onze fois, dériverait, et il faudrait rouvrir onze
fichiers à chaque livraison. Adossée à l'index, **elle s'éteint toute seule** — et la source qui dit
ce qui est construit reste unique, celle que la porte P-04 lit déjà.

**Ce qui reste à écrire à la main** : le **cycle** attendu (« F3 », « F5 »). L'index ne le porte pas.
Il entre donc **à l'index**, comme un champ nouveau — pas dans `R1`.

**Écarté** : une liste de routes « à venir » tenue à côté. Ce serait une seconde vérité, et la porte
P-04 ne la lirait pas.

---

## 5. « Passer la main » — un conflit constaté entre deux documents opposables

`docs/module-dore.md`, huitième couche, place la **sortie de session au pied de la coquille**, et
justifie : *« C'est un pied et non un en-tête parce que `R1` et `G1` portent déjà deux `<header>`
différents et que `G3`/`G4` n'en ont aucun — se poser au-dessus les rouvrirait tous les trois. »*

**Ce motif ne tient plus, et le fait est vérifiable** : depuis le cycle F1,
`app/layouts/defaut.vue` **porte l'en-tête pour tous les écrans**, et le composant 09 comme le
composant 10 y sont « présents partout » (`docs/Kaya_Design.md` §13). `R1` n'écrira donc **pas** son
propre `<header>` : il hérite de celui du gabarit. Les trois écrans que le motif protégeait n'ont
plus rien à rouvrir.

**Décision** : « Passer la main » vit **dans l'en-tête**, avec l'identité de la personne — là où les
quatre maquettes `R1` placent déjà le nom et ce que la personne fait. Un geste de sortie au pied
d'une page qui défile serait hors de vue sur l'écran où l'on passe la journée.

**Et le document perdant est corrigé dans le même changement** (constitution, préséance) :
`docs/module-dore.md` reçoit la note qui dit que le motif du pied appartenait à l'état du dépôt
**d'avant F1**, et ce qui l'a remplacé. Un conflit constaté n'est jamais tranché en silence.

**Le refus est immédiat, pas un échec après coup.** Le lexique l'impose : tant que la file n'est pas
vide, l'action rend « Des enregistrements ne sont pas encore partis. Attendez le retour du réseau
avant de passer la main. » La file de F1 (`useFile`) expose déjà `enAttente` — la garde est
**synchrone**, avant l'action, jamais dans un `catch`.

---

## 6. La vue « tous mes établissements » — un troisième état du sélecteur

La maquette `R1-accueil-proprietaire.html` remplace le nom du site par **« Mes 2 établissements »** et
présente les deux côte à côte. Elle porte le code `R1`.

**Décision** : c'est un **troisième état du composant 09** — fermé (un seul) · fermé (plusieurs) ·
**fermé sur « tous »** —, et le contexte actif le porte comme une valeur nommée, jamais comme
`etablissementId: null`.

**Motif du refus de `null`.** `null` signifie déjà **« aucun choix fait »** dans la session de F1, et
c'est ce qui déclenche la reprise. Réutiliser la même valeur pour « tous les sites » rendrait ces
deux états indiscernables — et l'accueil d'un compte fraîchement connecté afficherait la vue
d'ensemble d'un propriétaire. Le bogue serait silencieux et arriverait au pire moment.

**Conséquence sur le filtrage** : sous « tous », il n'y a **pas** de modules actifs communs à
calculer. Les surfaces d'action sont donc absentes — ce qui est exactement ce que la maquette montre
(« Vous ne pouvez rien saisir depuis cet écran »), et ce que FR-019 exige.

**`M4` n'est pas construit ici.** C'est l'écran **mobile** « Mes établissements », du cycle F7 ; il
héritera de cet état, il ne le remplace pas.

---

## 7. Les maquettes que ce cycle corrige — deux constats, pas des préférences

`docs/design/tokens.md`, `composants.md` et `lexique.md` **font foi toujours** ; la disposition d'un
écran est **une proposition** (constitution, principe 12). Deux écarts sont constatés :

| Constat | Ce que dit le document qui fait foi | Correction |
|---|---|---|
| Les quatre `R1` affichent **« À jour · il y a 1 min »** au témoin | `lexique.md` : les libellés sont « Enregistré », « En attente d'envoi (n) », « Connexion faible », « Hors connexion », et **ces trois-là font foi** | Les quatre fichiers portent « Enregistré ». Le composant 10 de F1 était **déjà** conforme : c'est la maquette qui a dérivé. |
| Le second segment de l'en-tête porte tantôt un poste, tantôt un volume | La grammaire ne peut pas donner deux sens au même emplacement (§2.2) | Commune seule, ou commune · poste quand il est unique. « 20 chambres » et « 9 tables » restent dans le corps. |

**Une maquette qui ment est pire qu'une maquette absente : la suivante s'appuiera dessus.** `R4` et
`R7` portent le même emplacement et seront alignés par le cycle F3 — c'est noté, pas fait ici :
corriger un écran qu'on ne construit pas revient à décider sans voir.

---

## 8. Les routes — ce que la barre d'adresse montre

| Écran | Route | Motif |
|---|---|---|
| `R1` L'accueil | **`/`** | C'est la racine du produit. FR-042 : la redirection vers `/_ecrans` posée par F1 disparaît — elle disait explicitement « F2 y posera `R1` ». |
| `R0` Connexion | **`/connexion`** | Mot du lexique, visible, sans ambiguïté. Le nom du fichier de page décide de la route. |

**Aucun mot proscrit n'entre par la porte du nom de fichier** — c'est la règle que `S1`
(`/mes-envois`, jamais `/synchronisation`) a posée.

**L'instrument `/_ecrans` reste atteignable** : il ne devient pas inaccessible parce que la racine
change, et il est déjà accroché depuis le gabarit.

---

## 9. Aucune porte nouvelle — et pourquoi

*Le noyau grossit **à la demande**, jamais par anticipation (constitution, principe 13). Une porte
nouvelle se justifie par une erreur réelle ou un coût manifeste.*

Ce cycle n'en demande **aucune**. Ce qu'il introduit est couvert :

| Ce que ce cycle ajoute | Ce qui le vérifie déjà |
|---|---|
| Deux écrans du produit | **P-04**, qui les exige aux quatre passages dès qu'ils sont `CONSTRUIT` |
| Des points d'entrée neufs | **P-06**, dans les deux sens — « branché » ou « dû », et tout branché exercé |
| Une dépendance de plus | **P-03** — épinglage exact, lockfile, et `versions-reference.md` d'accord dans les deux sens |
| Des données de jeu neuves | **P-02** *(table → registre)* et le test d'unité `conformite-modele.spec.ts`, qui **lit le SQL** |
| L'absence au HTML rendu | `rbac-absence-html.spec.ts`, posé par F1 — étendu, pas remplacé |
| La racine unique d'une page | `racine-unique.spec.ts` + la règle ESLint `vue/no-root-v-if` |

**Le seul candidat sérieux a été examiné et écarté** : une porte « aucun écran ne recopie l'en-tête ».
Elle n'a pas de coût manifeste à couvrir — la recopie ne fuit rien entre clients et ne migre aucune
ligne. Un **test d'unité** qui compte les `<header>` du dépôt le dit aussi bien, et il vit là où il
sera lu. **Une porte sans erreur constatée est une décoration.**

---

## 10. Ce que ce cycle laisse volontairement ouvert

- **D'où le système saura à quel poste on est.** Le modèle ne le porte pas (§2). La question
  appartient au cycle qui aura plusieurs points de vente à départager — **F4**. Ce cycle rend le
  manque **visible à l'écran** plutôt que de le combler par une valeur par défaut.
- **Le chargement paresseux par module** (`CPT-03`). C'est une propriété du découpage de paquets, et
  il n'y a qu'un module d'écrans à charger. L'anticiper serait construire sans besoin.
- **La liste des appareils connectés et la déconnexion à distance** (`CPT-01`). Sans serveur, il n'y
  a pas d'appareil à lister.
- **L'alignement de `R4` et `R7`** sur la grammaire d'en-tête (§7).
