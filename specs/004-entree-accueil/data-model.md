# F2 — Entrée · Modèle de données (phase 1 du plan)

*Ce cycle est de **phase 2**. Il ne crée **aucune table**, ne modifie **aucun fichier** de
`docs/modele-donnees/`, n'écrit **aucune migration**. Ce document dit donc deux choses : **les
structures que le front manipule**, et **le jeu simulé qu'il ajoute**, avec sa conformité au modèle —
table par table, champ par champ.*

> **La règle qui rend ce document vérifiable par une machine plutôt que par un œil** :
> `tests/unite/conformite-modele.spec.ts` **lit les fichiers SQL** et applique
> `snake_case → camelCase` avant de comparer. Il n'y a donc **pas de seconde liste à tenir**, et elle
> ne peut pas diverger. Ce document explique ; le test décide.

---

## 1. Ce que ce cycle n'ajoute pas

| Livrable de phase 1 | État |
|---|---|
| Fichier SQL créé | **aucun** |
| Fichier SQL modifié | **aucun** |
| Table nouvelle | **aucune** |
| Politique RLS, privilège, contrainte, index | **aucun** — rien n'est touché |
| Entrée au `docs/registre-classes-offline.md` | **aucune** — toute table peuplée y est **déjà déclarée** |

**Motif.** Une connexion et un accueil se composent entièrement des **118 tables** arrêtées en phase
1. Ouvrir un fichier SQL pour ce cycle serait rouvrir une phase close (constitution, principe 0).

---

## 2. Les tables que le jeu peuple — et leur classe, déjà déclarée

*Sens de lecture : **table → registre**. Chacune est déjà au registre des classes hors-ligne ; ce
cycle ne fait qu'en instancier des lignes simulées.*

| Table | Schéma | Classe | Ce que le cycle en instancie |
|---|---|---|---|
| `tenant` | `etablissements` | **C** | — *(le maquis rejoint le tenant existant)* |
| `etablissement` | `etablissements` | **C** | **1 nouveau** — Chez Tantie Adjo |
| `module_activite` | `etablissements` | **C** | — *(référentiel existant : `RESTAURATION`)* |
| `etablissement_module` | `etablissements` | **C** | **1** — restauration active, et **rien d'autre** |
| `point_de_vente` | `etablissements` | **C** | **1** — « La salle », avec tables |
| `table_pdv` | `etablissements` | **C** | **9** — les neuf tables, plus le comptoir |
| `personne` | `comptes` | **C** | — *(les quatre personnes existent déjà)* |
| `compte` | `comptes` | **C** | — *(les quatre comptes existent déjà)* |
| `compte_role` | `comptes` | **C** | **2** — Yao au maquis, M. Koffi propriétaire du maquis |
| `permission` | `comptes` | **C** | **1** — `caisse.encaisser` était déjà là ; rien de neuf |

**Aucune entité de classe A, B ou D n'est touchée.** La connexion elle-même est **de classe C**
(`compte` — identité d'authentification, branche C2 du registre), ce qui commande FR-012 : hors
ligne, l'action **disparaît** et un bandeau dit pourquoi.

---

## 3. Le jeu « Chez Tantie Adjo » — le maquis

*Sans lui, la quatrième variante de `R1` n'a rien à afficher, et l'accueil du propriétaire non plus.*

### 3.1 Où il se rattache, et pourquoi pas ailleurs

**Décision : Chez Tantie Adjo est le SECOND ÉTABLISSEMENT du tenant `deloria`.**

C'est exactement ce que le modèle prévoit — un `tenant` porte plusieurs `etablissement` — et ce que
la maquette du propriétaire suppose : M. Koffi voit ses deux maisons côte à côte, sous une même vue
d'ensemble.

**Écarté : un tenant propre.** Il faudrait alors un `compte_role` d'un tenant pointant l'établissement
d'un autre, ce que le jeu ne fait qu'**une fois** et **pour un motif nommé** — `cr-koffi-test` vers
Résidence Test, qui existe pour éprouver l'agnosticité du socle (ETB-02c). Reproduire l'exception
pour un cas ordinaire la banaliserait.

**Résidence Test reste intacte** : un tenant distinct, un module unique d'hébergement, aucun point de
vente, aucun article, aucune formule. C'est le cas qui fait découvrir toute surface supposant une
chambre ou un tarif. Le maquis ne le remplace pas — il en est le pendant côté restauration.

### 3.2 Un écart de contenu, relevé et non corrigé

Les maquettes situent Deloria à **Yopougon** ; le jeu de F1 le situe à **Abengourou**, sous le code
`DELORIA_ABENGOUROU` — conformément au cadrage, où Abengourou est le site pilote et le lieu du
**jalon J0**.

**Le jeu fait foi sur les données ; la maquette fait foi sur le dessin.** Un nom de commune dans une
maquette est une donnée d'illustration, pas une valeur de référence au sens de `tokens.md`. **Aucune
correction de maquette n'est due de ce chef** — à ne pas confondre avec les deux écarts de
`research.md` §7, qui portent sur des **libellés opposables** et sur **la grammaire**, et qui, eux,
se corrigent.

Le maquis est donc à **Abobo**, comme la maquette. Les deux sites de M. Koffi sont distants de trois
heures de route : le multi-établissement en est plus vrai, pas moins.

### 3.3 Les lignes, champ par champ

*Noms et types repris de `docs/modele-donnees/10-etablissements.sql` et `20-comptes.sql`, à la
transformation `snake_case → camelCase` près — la seule autorisée.*

**`etablissement`** — une ligne

| Champ | Valeur | Contrainte du SQL |
|---|---|---|
| `id` | `tantie-adjo-etablissement` | `UUID` en base ; **chaîne stable** en simulation, comme tout le jeu de F1 |
| `tenantId` | `deloria` | le tenant existant |
| `code` | `TANTIE_ADJO_ABOBO` | même forme que `DELORIA_ABENGOUROU` |
| `nom` | `Chez Tantie Adjo` | le nom de la maquette |
| `juridictionCode` | `CI` | — |
| `classement` | `NON_CLASSE` | **chaîne, jamais une union fermée** — le commentaire du SQL dit pourquoi |
| `commune` | `Abobo` | — |
| `fuseauHoraire` | `Africa/Abidjan` | **lu par l'en-tête** — c'est ce champ qui décide de l'heure affichée |
| `devise` | `XOF` | — |
| `adresse` | `Abobo, Côte d'Ivoire` | — |
| `ncc` | `null` | un maquis n'a pas de NCC — **et c'est le cas normal**, pas un vide à combler |

**`etablissement_module`** — **une seule ligne**, et c'est tout l'intérêt

| Champ | Valeur |
|---|---|
| `id` | `tantie-adjo-actif-restauration` |
| `moduleActiviteId` | `module-restauration` |
| `actif` | `true` |
| `activeLe` · `desactiveLe` | date d'ouverture · `null` |

> **Ce que cette unique ligne prouve.** Sur ce site, `HEBERGEMENT`, `BAR`, `PRESSING` et
> `SALLE_REUNION` sont **absents de la liste des actifs** — et `listerModulesActifs` ne rend **que**
> les actifs, jamais un module inactif accompagné d'un drapeau. Aucun écran n'a donc à décider d'en
> griser un : il ne le reçoit pas. C'est la mécanique qui rend SC-003 vérifiable sur le HTML rendu.

**`point_de_vente`** — une ligne

| Champ | Valeur | Note |
|---|---|---|
| `nom` | `La salle` | **le poste unique de Yao** — c'est lui que l'en-tête affiche |
| `avecTables` | `true` | neuf tables |
| `caisseId` | `null` | colonne **nue, sans `REFERENCES`** — `socle/caisse` est un autre module, et c'est délibéré (principe 2). La simulation ne la remplit pas |

**`table_pdv`** — neuf lignes

`code` de `1` à `7`, plus `COMPTOIR`, plus la table 6 nommée. `libelle` reste `null` sauf pour le
comptoir. **Le comptoir est un `table_pdv` de code `COMPTOIR`, pas un point de vente séparé** —
« l'absence de tables **est** le comptoir » vaut pour un point de vente entier ; ici la salle a des
tables **et** un comptoir, ce que la maquette montre.

**`compte_role`** — deux lignes

| `id` | `compteId` | `roleId` | `etablissementId` | Ce que ça produit |
|---|---|---|---|---|
| `cr-yao-tantie-adjo-gerant` | `compte-yao` | `role-gerant` | maquis | Yao **gérant** du maquis |
| `cr-yao-tantie-adjo-caissier` | `compte-yao` | `role-caissier` | maquis | et **caissier** — « Gérant · Caisse » de la maquette |
| `cr-koffi-tantie-adjo` | `compte-koffi` | `role-proprietaire` | maquis | M. Koffi, **deuxième site**, lecture seule |

> **Yao reste réceptionniste à Deloria** (`cr-yao-reception`, posé par F1) : c'est **la même personne
> avec des rôles différents selon le site**, et c'est précisément ce que FR-027 exige de prouver —
> un droit détenu ailleurs ne suit pas la personne.

---

## 4. Le poste — dérivé, jamais stocké

**Constat vérifié dans le SQL** : `20-comptes.sql` **ne contient aucune référence à
`point_de_vente`**. Il n'existe, dans tout le modèle de phase 1, **aucun lien
`compte → point_de_vente`**.

Le poste n'est donc **pas une donnée** : c'est un **calcul**, et il ne rend un résultat que
lorsqu'il est sans ambiguïté.

```
compte ─(compte_role · etablissementId)→ rôles
       ─(permissionsParRole)→ permissions
       ─(permission.moduleActiviteCode, non nul)→ modules
       ─(point_de_vente.moduleActiviteId)→ postes candidats
```

| Compte | Site | Modules atteints | Postes | En-tête |
|---|---|---|---|---|
| **Yao** | Chez Tantie Adjo | `RESTAURATION` | **1** — La salle | `Abobo · La salle` |
| **Aminata** | Deloria | `RESTAURATION`, `BAR` | **2** | `Abengourou` |
| **Adjoua** | Deloria | `HEBERGEMENT`, `RESTAURATION` + caisse + gérance | **4** | `Abengourou` |
| **M. Koffi** | vue « tous » | — | **0** | *(commune de la vue d'ensemble)* |

**Les deux formes d'en-tête exigées par FR-030c sont obtenues par deux comptes du jeu** — Yao pour la
forme longue, Adjoua pour la courte —, sans levier ni réglage à inventer.

**Ce qui reste ouvert, et le reste sciemment** : d'où le système saura à quel poste on est quand il
y en a plusieurs. La réponse appartient au cycle **F4**. Ne rien afficher **rend le manque visible à
l'écran**, ce qui est l'objet même de la phase 2.

---

## 5. Les structures que le front ajoute

*Aucune ne correspond à une table : ce sont des **vues de composition**, propres à l'interface.
Elles vivent dans `app/core/`, jamais dans `donnees/*/types.ts`, qui est réservé au miroir du SQL.*

### 5.1 `Session` — ce que l'en-tête affirme

> ⚠️ **Le nom est celui du code, pas un nom neuf.** `Session` est la structure posée par F1 à
> `app/core/session/useSession.ts` ; ce cycle **l'étend**, il n'en introduit pas une seconde. Un
> `ContexteActif` parallèle aurait donné deux noms pour une chose — et les six cycles suivants
> auraient hérité de l'hésitation.

| Champ | Type | Ce qu'il porte |
|---|---|---|
| `compteId` | `string \| null` | **inchangé depuis F1** |
| `portee` | `{ type: 'etablissement', id } \| { type: 'tous' }` | ★ **le troisième état du sélecteur** |
| `permissions` | `readonly string[]` | l'union, **recalculée** à chaque changement de site |
| `posteUnique` | `string \| null` | **le nom du poste, ou `null`** — jamais « plusieurs » |

> **Pourquoi `portee` et non `etablissementId: null` pour la vue d'ensemble.** `null` signifie déjà
> **« aucun choix fait »** dans la session de F1, et c'est ce qui déclenche la reprise. Réutiliser la
> même valeur pour « tous les sites » rendrait les deux états indiscernables : l'accueil d'un compte
> fraîchement connecté afficherait la vue d'ensemble d'un propriétaire. Le bogue serait silencieux et
> arriverait au pire moment.

### 5.2 `SurfaceAccueil` — ce qu'une surface déclare, et ce qu'elle ne décide pas

| Champ | Type | Rôle |
|---|---|---|
| `permission` | `string` | le code exigé — **`ActionAutorisable` de F1, réemployé tel quel** |
| `moduleCode` | `string \| null` | `null` = transverse : encaisser, consulter, régler |
| `ecranCible` | `string \| null` | **le code d'écran**, `'R7'`, `'C4'` — jamais une route en dur |
| `famille` | `'tete' \| 'suite' \| 'aRegler' \| 'activite' \| 'chiffre'` | quelle des cinq formes elle prend |

**Une surface ne porte ni route, ni libellé de mention, ni condition d'affichage.** Les deux premiers
viennent de l'index des écrans ; la troisième est calculée par `composerAccueil`, qui appelle
`useAutorisation.retenir()` — **la fonction de F1, inchangée : elle suffisait déjà**.

### 5.3 `ResultatIdentification` — le retour de `R0`

| Cas | Ce que le domaine rend | Ce que l'écran affiche |
|---|---|---|
| reconnu | `reussite(contexte)` | on entre |
| identifiant inconnu | `echec('IDENTIFIANTS_INVALIDES')` | « Identifiant ou mot de passe incorrect » |
| compte non `ACTIF` | `echec('IDENTIFIANTS_INVALIDES')` | **la même phrase** |
| identifiant vide | `echec('IDENTIFIANT_ABSENT')` | « Indiquez un numéro de téléphone ou une adresse e-mail. » |
| hors ligne | `echec('HORS_LIGNE')` | annoncé **avant** la saisie |

> **Quatre cas d'échec, deux phrases — et ce n'est pas une simplification.** Le compte inconnu, le
> mot de passe faux, le compte suspendu et le compte révoqué rendent **le même code**. Les
> distinguer publierait la liste des comptes existants. Le défaut de saisie, lui, a sa propre phrase :
> ce n'est pas un échec de connexion, et l'utilisateur doit savoir quoi corriger.

**`ETATS_COMPTE` est lu ici** — `ACTIF`, `SUSPENDU`, `REVOQUE`. Il était déclaré **« dû · cycle G3 »**
au registre des points d'entrée ; ce cycle le **branche**, et le registre est corrigé dans le même
changement.

---

## 6. Conformité — comment elle est prouvée

| Propriété | Le test qui la prouve |
|---|---|
| Les champs du jeu ont les noms et types du SQL | `tests/unite/conformite-modele.spec.ts` — il **lit les `.sql`**, applique `snake_case → camelCase`, compare. Étendu au maquis |
| Aucune valeur d'énumération inventée | même test — `classement` reste une **chaîne**, `typeIdentifiant` reste dans `TYPES_IDENTIFIANT` |
| Un module absent des actifs est inactif | `tests/unite/accueil-composition.spec.ts` — sur le maquis, quatre modules ne sont **pas** rendus |
| Le poste dérivé est juste | `tests/unite/poste-derive.spec.ts` — quatre comptes, quatre attentes, dont **deux** formes d'en-tête |
| Aucun mot d'un service absent au HTML | `tests/unite/accueil-absence-html.spec.ts` — sur le **document rendu**, jamais sur un attribut |
| Les montants sont des entiers d'unité mineure | `tests/unite/montant.spec.ts`, existant — le jeu du maquis n'introduit **aucun flottant** |
