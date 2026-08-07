# Spécification de fonctionnalité : La coquille de l'application (cycle F1 — Fondations)

**Répertoire de fonctionnalité** : `specs/003-coquille-application`

**Branche** : `main` *(aucune branche dédiée créée — aucune extension `before_specify` n'est enregistrée dans ce dépôt)*

**Créée le** : 2026-08-07

**Statut** : Brouillon

**Phase** : 2 — l'application entière en données simulées (constitution, principe 0). **Premier cycle de la phase.**

**Entrée** : description utilisateur du cycle F1 — « la coquille de l'application : PWA Nuxt 4, design system, thème, i18n, couche de données simulées », treize livrables numérotés de 0 à 12.

**Documents lus** : `docs/Kaya_Design.md` parties I à III · `docs/design/tokens.md` · `docs/design/composants.md` · `docs/design/mouvement.md` · `docs/design/styleguide.html` · `docs/design/lexique.md` · `docs/user-stories-v1.md` TRX-08, SYN-01/02, PWA-01→07, CPT-01→03, ETB-02/02b/02c, TRX-05a/05b · `docs/registre-classes-offline.md` · `docs/versions-reference.md` · `docs/modele-donnees/` · `.specify/memory/constitution.md`.

---

## Ce que ce cycle produit, et ce qu'il ne produit pas

| Produit | Non produit |
|---|---|
| Le projet applicatif en SPA, démarré par **une seule commande**, sans conteneur ni service distant | **Aucun écran métier** — ni accueil, ni check-in, ni commande, ni caisse, ni document |
| La coquille installable : manifeste, service worker, stratégie de cache, ouverture **hors ligne** | Aucun appel réseau réel, aucun endpoint, aucune migration |
| Les **seize composants canoniques** dans tous leurs états, plus le **styleguide interne** | Aucun composant nouveau hors des seize (un composant qui manquerait arrête le cycle) |
| Le thème clair et sombre par la variante `dark:` seule, appliqué **avant le premier pixel** | Aucune seconde palette, aucune feuille de style parallèle |
| Les catalogues **fr et en** à parité stricte | Aucune troisième langue |
| Le cycle de vie : **un** layout par défaut, **un** middleware global de session, **un** plugin de thème | Aucun écran de connexion — CPT-01 appartient au cycle F2 |
| La couche de données simulées `app/core/donnees/`, portant le **jeu de Deloria** et la **mécanique de scénarios** | Aucune donnée pour les domaines qu'aucun cycle n'a encore ouverts |
| **`PlatformAdapter`** — l'interface complète, avec son implémentation web et le recensement des capacités absentes par moteur | Aucune implémentation Capacitor |
| Le **RBAC côté client** : une action interdite est **absente du HTML rendu** | Aucune authentification, aucun jeton, aucune révocation |
| La **file hors-ligne** et son témoin, qui accumule, affiche et **refuse** les classes B, C et D | Aucun envoi — la file n'expédie rien en phase 2 |
| L'**index des écrans** à `/_ecrans` — les **46 écrans du produit** avec leur code et leur état d'avancement, plus les **instruments sans code** | Aucun **douzième préfixe** de code : `Kaya_Design.md` §3 n'est pas amendé |
| **`scripts/verifier.sh` étendu** de **P-03** et **P-04**, chacune avec son test négatif | **Aucun workflow GitHub Actions** (le serveur de CI vient en phase 3) |
| La **liste des points d'entrée** — « branché » et « dû » — vérifiée dans les deux sens | Aucune porte au-delà de P-03 et P-04 |

**La propriété à préserver, énoncée une fois pour tout le cycle et pour les six suivants.** Cette phase tourne **seule sur le poste**. Aucun conteneur, aucun service distant, aucune base. C'est elle qui rendra la démonstration possible à Abengourou, où il n'y a ni réseau fiable ni temps pour démarrer une infrastructure. *Si un cycle de phase 2 se met à exiger PostgreSQL, quelque chose a été branché trop tôt.*

> ⚠️ **La propriété porte sur l'APPLICATION, pas sur la commande de vérification — et les deux se rencontrent à ce cycle.** `scripts/verifier.sh` exige aujourd'hui un démon de conteneurs : P-01, P-02 et P-05 montent une base PostgreSQL jetable pour inspecter le modèle, et le script **sort en prérequis manquant dès l'entrée** quand le démon est absent. Les deux portes nouvelles, elles, n'en ont aucun besoin. Sans réglage, la propriété se retourne : **sur le poste de démonstration, le lint, le build et P-04 deviendraient inatteignables faute d'un conteneur qui ne les concerne pas.** Le prérequis doit donc devenir **local à la porte qui l'exige**, jamais global au script — voir **FR-085**, et la ligne correspondante des cas limites.

> ⚠️ **La coquille PWA est celle de la phase 2 et de la démonstration, pas celle de la production.** Capacitor prend le relais sur mobile (cadrage §13.3, constitution principe 7). La coquille s'écrit donc comme **une couche mince et remplaçable** : rien de métier dans le service worker, aucune logique dans le manifeste.

---

## Trois arbitrages tranchés à la spécification

Ils sont écrits ici parce qu'ils fixent le périmètre, et qu'un périmètre tranché en silence se rouvre à chaque tâche.

| Question | Réponse retenue | Ce qu'elle écarte |
|---|---|---|
| **Quels domaines la couche de données simulées couvre-t-elle ?** | **Les seuls domaines que le jeu Deloria peuple** — établissements et modules, comptes et rôles, hébergement (unités, catégories, formules, barèmes), ventes (articles) — **plus le patron** qui rend l'ajout d'un domaine mécanique pour F2 à F7 | Écrire quatorze interfaces dont onze n'auraient aucun appelant : elles seraient la matière première d'une liste « dû » qui ne prouverait rien |
| **D'où vient la session, sans écran de connexion ?** | **Une session par défaut** reprise du stockage local, dont le **compte actif se choisit parmi les cinq comptes Deloria depuis le panneau de scénarios** — c'est le levier « permissions restreintes ». F2 posera l'écran de connexion et **remplacera la source, pas le middleware** | Poser un écran de choix de compte, que ce cycle a déclaré ne pas produire ; et laisser la session vide, ce qui rendrait invérifiables le RBAC et le levier « permissions restreintes », tous deux livrables de ce cycle |
| **Qu'est-ce qu'un « point d'entrée » dans la liste branché/dû ?** | **Les surfaces publiques de la coquille** : méthodes de `PlatformAdapter`, méthodes des interfaces de domaine, composables exportés, composants du design system, middlewares et plugins | Tout membre exporté — un type n'a pas d'« appelant », et la propriété « branché » n'y aurait pas de sens uniforme ; et les deux seules frontières de la phase 3, qui laisseraient hors contrôle un composant écrit et jamais monté |

---

## Clarifications

### Session 2026-08-07

- Q: Le lexique ne porte aucune entrée pour les sept termes que ce cycle rend visibles. Quelle famille de formulations retenir ? → A: **Les trois instruments suivent la règle de nommage de l'écran `S1`** — titre français, route qui suit le titre, préfixe `_` qui marque l'instrument : « **Guide de style** » → `/_guide-de-style`, « **Écrans** » → `/_ecrans`, « **Scénarios** » → `/_scenarios`. **Fixés une fois dans ce cycle, ils vivent dans l'index des écrans, pas au lexique.** Seuls entrent au lexique les termes que l'exploitant voit vraiment dans le produit : **thème, sombre, langue, installer l'application, recharger pour la nouvelle version**. *Motif : le lexique protège l'utilisateur du jargon ; il n'est pas le registre des noms d'outils, et l'y transformer le rendrait inconsultable pour ce à quoi il sert.*
- Q: Aucun des onze préfixes de code de `Kaya_Design.md` §3 ne couvre les instruments, or l'index doit porter un code par entrée. Que fait-on ? → A: **Aucun code pour les instruments.** L'index porte **deux sections** : les **46 écrans du produit** avec leur code, et les **instruments sans code**. `Kaya_Design.md` §3 n'est pas amendé et le décompte des 46 reste intact.

### Amendements du 2026-08-07 — issus de l'analyse de cohérence

*Un conflit constaté n'est jamais tranché en silence (constitution, gouvernance). Trois exigences sont amendées, et l'analyse qui les a produites est tracée ici plutôt que dissoute dans le texte.*

| Exigence | Ce qui a changé | Ce que l'analyse avait trouvé |
|---|---|---|
| **FR-089** | La règle opposable de `derivation.md` **est amendée dans le même changement**, pour définir la catégorie « instrument de développement » | Le **guide de style échouait à la condition 1** d'un écran composé. Les artefacts introduisaient une catégorie que ni `Kaya_Design.md` §2 bis ni `derivation.md` ne définissent, alors que le principe 12 en fixe **quatre** |
| **FR-073** | **P-03 vérifie** l'absence de `.github/workflows/` | L'interdiction n'était **couverte par aucune porte ni aucune tâche** — elle reposait sur le fait que personne n'avait encore écrit le fichier |
| **FR-008** | *(inchangée)* — mais sa vérification est désormais **explicitement** portée par la tâche de copie de `theme.css` | La copie conforme prouvait l'égalité à la source, **pas la symétrie clair/sombre** : un jeton oublié sous `.dark` ne levait aucune erreur |

### Décisions prises sans question — et le document qui les tranche

*Consignées ici parce qu'elles ont été **choisies**, faute d'être dites. Aucune n'a demandé d'arbitrage : chacune était déjà écrite quelque part, et il suffisait d'aller la lire.*

| N° | Ce qui était ambigu | Ce qui a été décidé | Où c'était écrit |
|---|---|---|---|
| **D-01** | Les libellés visibles du témoin de synchronisation | « **Enregistré** » · « **En attente d'envoi (n)** » · « **Connexion faible** » · « **Hors connexion** ». Les mots *connecté*, *dégradé* et *hors ligne* restent des **noms d'état internes** et **n'atteignent jamais l'écran** | `lexique.md`, entrées « Synchronisation » et « Réseau dégradé » — qui **documentent que `app/core/i18n` avait dérivé sur ces trois libellés exacts** et que le lexique prime |
| **D-02** | Le seuil qui sépare « connecté » de « connexion faible » | **3 000 ms**, clé `sync.latence_degradee_seuil_ms`, portée la plus basse **ÉTABLISSEMENT** — sans lui l'état ne serait pas testable | `user-stories-v1.md`, *Récapitulatif des paramètres d'établissement*, ligne SYN-02 |
| **D-03** | La formulation du refus hors ligne | « **Cette action nécessite internet.** » / *This action requires an internet connection.*, annoncée **avant** la saisie, jamais après un échec | `lexique.md`, « Refus hors ligne d'une opération de classe C » — réemploi exact d'ETB-02 |
| **D-04** | La classe A/B/C/D est-elle visible ? | **Jamais.** L'utilisateur lit « disponible hors connexion » ou « nécessite internet » | `lexique.md`, « Classe hors-ligne A/B/C/D » |
| **D-05** | Le mot pour « module d'activité » | « **Vos services** » ; l'ajout dit « **Ajouter un service** », le retrait dit « **Retirer** ». Jamais « module », jamais « activer » ni « désactiver » | `lexique.md`, « Module d'activité » et « Activation d'un module » |
| **D-06** | Le mot pour le RBAC | « **Ce que chacun peut faire** ». **Les mots « rôle » et « permission » n'atteignent jamais l'interface** : on montre ce qui est possible, pas la mécanique qui l'autorise | `lexique.md`, « `role`, `compte_role`, `permission` » |
| **D-07** | Ce que l'index des écrans liste | **Les 46 écrans du produit** — 11 maquettés, 32 dérivés, 3 composés —, chacun avec son code et son état d'avancement, **plus** les instruments, dans une seconde section sans code | `derivation.md`, « Les 46 écrans du produit » |
| **D-08** | Ce que P-04 exige d'un écran déclaré mais pas construit | **Rien.** P-04 n'exige l'atteignabilité que des entrées **marquées construites**. *Sans cette borne, la porte serait rouge dès son premier jour sur 43 écrans non commencés — et on la désactiverait sous trois semaines* | conséquence de D-07 |
| **D-09** | Le message d'impression indisponible | « **cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception** » | `user-stories-v1.md`, PWA-04 |
| **D-10** | La stratégie de cache | **Préchargement de la coquille** — l'application s'ouvre hors ligne **dès le premier écran** — et **révision au rechargement**, l'invite explicite tranchant. Un correctif de calcul de taxe part le jour même | `user-stories-v1.md`, PWA-01 |
| **D-11** | La zone des trois instruments | **Charme.** Un écran composé est en zone de charme **uniquement** — un écran de comptoir se maquette toujours | `derivation.md`, « Les écrans composés », cinquième condition |
| **D-12** | Les instruments comptent-ils parmi les 46 ? | **Non.** Ils s'inscrivent à `derivation.md` comme **composés**, dans une entrée distincte marquée « instrument de développement », et le décompte des 46 est **inchangé** | `derivation.md` + la réponse à la question 2 ci-dessus |
| **D-13** | Le contraste | **WCAG AA au minimum, AAA sur les montants et les statuts.** Aucune information portée par la seule couleur — la réception est en plein soleil | `Kaya_Design.md` §8, contrainte 4 |
| **D-14** | Le budget de performance | **60 images/s tenues sur un appareil à 2 Go** · `transform` et `opacity` **uniquement** · **six éléments animés simultanément au maximum** | `Kaya_Design.md` §8, contrainte 6 ; `mouvement.md` §5 |
| **D-15** | Un budget de **démarrage** | **Il n'en existe aucun**, ni au cadrage ni aux stories — et on n'en invente pas. Ce qui se mesure est le budget de mouvement ci-dessus | constat : aucune occurrence dans `cadrage-v1.md` ni `user-stories-v1.md` |
| **D-16** | Le chiffrement au repos de la file | **Hors périmètre de F1.** PWA-05 est en tranche **T4** ; ce cycle livre l'**accès** au stockage sécurisé par `PlatformAdapter`, pas le chiffrement | `user-stories-v1.md` §0.5 — « PWA en T4, **sauf PWA-02 dû en phase 2** » |
| **D-17** | Ce que le paquet servi au navigateur peut porter | **Aucun secret.** Le code servi au navigateur est lisible : les données simulées ne portent ni clé, ni jeton, ni identifiant réel | `cadrage-v1.md` §12.1 |
| **D-18** | Ce qui alimente la file en F1, sans écran métier | Le panneau **Scénarios** porte un **levier d'essai d'écriture** dont on choisit la classe. Il exerce **l'acceptation (A) et le refus (B, C, D)** | **décision** — aucun document ne la tranche. *Motif : sans elle, FR-057 et FR-059 seraient écrits sans jamais être exercés, et une unité écrite n'est ni testée ni branchée par défaut* |
| **D-19** | L'UUID v7 porte-t-il sur toutes les classes ? | **Oui, classes A et D comprises**, sur toute écriture. C'est ce qui rend le rejeu inoffensif | `cadrage-v1.md` §11.5, point 1 |
| **D-20** | Le cache d'écriture des classes B, C et D | **Aucune donnée B, C ou D en cache d'écriture sur un terminal** : ces entités sont en **lecture seule** côté client | `cadrage-v1.md` §11.5, point 4 |

---

## Scénarios utilisateur et vérification *(obligatoire)*

> **Personas : tous, indirectement.** Aucun d'eux n'ouvre un écran de ce cycle — il n'y en a pas. Adjoua, Yao, Aminata et M. Koffi sont présents comme **comptes du jeu Deloria** et comme **jeux de permissions** : c'est sur eux que se vérifie qu'une action interdite est absente du HTML. L'acteur direct est le **développeur solo**, et le bénéficiaire immédiat est **la démonstration d'Abengourou**.
>
> **Sur les priorités.** Les treize livrables sont tous dus au même cycle : P1, P2 et P3 disent l'**ordre de construction** et le coût d'un manque, pas ce qu'on pourrait couper. Un P3 non livré laisse le cycle inachevé au même titre qu'un P1.

### Récit 1 — Une commande, et l'application s'ouvre hors ligne dans le bon thème (Priorité : P1)

Le développeur arrive sur un poste où **rien ne tourne** : pas de conteneur, pas de base, pas de réseau. Il lance la commande unique documentée au README. L'application démarre. Il l'installe depuis son navigateur, coupe le réseau, ferme tout, rouvre l'application installée : **elle s'ouvre et s'affiche**, même si elle n'a presque rien à montrer. Son système est en thème sombre ; **il ne voit aucun éclair clair** — la première image est déjà sombre.

**Pourquoi cette priorité** : l'ouverture hors ligne est la propriété la plus difficile à rétrofitter, et l'éclair clair au démarrage est le défaut qu'un plugin arrive toujours trop tard pour corriger. Les deux se posent au premier cycle ou coûtent une reprise de la coquille entière. C'est aussi la condition matérielle de la démonstration : à Abengourou, il n'y a ni réseau fiable ni temps pour démarrer une infrastructure.

**Vérification indépendante** : sur un poste où le démon de conteneurs est arrêté, la commande unique démarre l'application ; l'installation puis la coupure du réseau suffisent au reste. Testable sans aucun autre livrable du cycle.

**Scénarios d'acceptation** :

1. **Étant donné** un poste sans conteneur en cours d'exécution et sans accès réseau après le premier chargement, **quand** la commande unique du README est lancée, **alors** l'application démarre et sa première page s'affiche.
2. **Étant donné** l'application installée depuis Chromium, **quand** le réseau est coupé et l'application rouverte, **alors** elle s'ouvre et affiche sa page d'accueil de coquille — jamais la page d'erreur du navigateur.
3. **Étant donné** l'application ouverte dans WebKit, **quand** l'utilisateur cherche à l'installer, **alors** l'interface **explique le menu de partage** et dit qu'aucune bannière ne se déclenchera — parce qu'iOS n'en propose pas, et que c'est la moitié du parc.
4. **Étant donné** un système réglé en thème sombre et aucun choix explicite enregistré, **quand** l'application s'ouvre, **alors** **aucune image du démarrage** ne présente le fond clair.
5. **Étant donné** un choix explicite de thème clair enregistré et un système en thème sombre, **quand** l'application s'ouvre, **alors** le choix explicite l'emporte, et là encore sans éclair.
6. **Étant donné** une version périmée servie par le cache, **quand** une version nouvelle est disponible, **alors** l'interface **propose explicitement de recharger** — elle ne recharge pas d'office et ne se tait pas.
7. **Étant donné** le service worker et le manifeste, **quand** on les inspecte, **alors** **aucune règle métier** ne s'y trouve : ni tarif, ni permission, ni classe hors-ligne, ni nom de domaine fonctionnel.

---

### Récit 2 — Le styleguide interne, et le design system tient (Priorité : P1)

Le développeur ouvre **une seule page** de l'application, à une adresse fixe. Il y voit **les seize composants canoniques**, chacun dans **tous les états** que `composants.md` lui prête, **en clair et en sombre**. Il compare avec `docs/design/styleguide.html` : c'est le même rendu. Aucun utilitaire n'a disparu au passage du CDN de la maquette au build du projet.

**Pourquoi cette priorité** : c'est la page qu'on ouvre pour voir si le design system tient — ce n'est pas un livrable de confort. Les six cycles suivants y prennent leur vocabulaire ; si elle ment, ils mentent tous. Et le piège est **silencieux par nature** : la maquette charge Tailwind par CDN, qui génère les utilitaires à la volée ; le build ne compile que ce qu'il trouve dans les sources. Un utilitaire absent ne lève aucune erreur — il ne s'affiche simplement pas.

**Vérification indépendante** : ouvrir la page, la comparer à la maquette de référence sur les deux thèmes. Testable dès que le thème et les composants existent, sans données simulées ni session.

**Scénarios d'acceptation** :

1. **Étant donné** le styleguide interne, **quand** on le parcourt, **alors** les **seize** composants y sont, et le décompte est celui des sections numérotées de `composants.md` — jamais un nombre écrit ailleurs.
2. **Étant donné** un composant de `composants.md` déclarant N états, **quand** on ouvre sa section du styleguide, **alors** les N états y sont rendus, nommés.
3. **Étant donné** le styleguide, **quand** on bascule de thème, **alors** **chaque** composant est rendu dans les deux thèmes, et aucun n'est illisible dans l'un des deux.
4. **Étant donné** la maquette `docs/design/styleguide.html` et le styleguide interne côte à côte, **quand** on les compare sur les valeurs de `tokens.md` — couleurs, hauteurs, rayons, corps —, **alors** elles coïncident ; **tout écart est signalé, jamais silencieux**.
5. **Étant donné** un composant cliquable, **quand** on mesure sa zone de touche, **alors** elle fait **au moins 44 px**, y compris pour une icône seule.
6. **Étant donné** un composant portant un état, **quand** on le rend en niveaux de gris, **alors** l'état reste lisible : **il porte une forme, pas seulement une couleur**.
7. **Étant donné** un montant affiché par un composant, **quand** on inspecte sa chaîne, **alors** elle porte l'**espace fine insécable U+202F** entre les milliers et avant le F, et une **seule fonction** du code la produit.
8. **Étant donné** le composant 15 (barre de proportion), déclaré « hors série, à valider » par `composants.md`, **quand** ce cycle le rend dans tous ses états, **alors** **`composants.md` est mis à jour dans le même changement** pour acter son entrée au canon (constitution, principe 12).

---

### Récit 3 — Une page nouvelle ne peut pas oublier le cycle de vie (Priorité : P1)

Le développeur crée une page vide. Sans écrire une ligne de plus, elle porte la racine stable du layout, son unique `<main>`, la session reprise et le thème appliqué. Il tente d'écrire une page dont la racine est un `v-if` / `v-else` de premier niveau : **le contrôle la refuse**.

**Pourquoi cette priorité** : c'est le livrable dont les six cycles suivants héritent sans y penser. Un cycle de phase 2 qui oublierait le middleware produirait un écran atteignable sans session, et le défaut ne se verrait qu'au branchement. L'héritage doit être **impossible à oublier**, pas recommandé.

**Vérification indépendante** : ajouter une page nulle et constater ce qu'elle porte. Testable avec le seul layout et le seul middleware.

**Scénarios d'acceptation** :

1. **Étant donné** une page nouvelle sans configuration, **quand** elle est atteinte, **alors** elle est rendue dans le layout par défaut, avec **un seul** `<main>` dans le document.
2. **Étant donné** une navigation quelconque, **y compris la toute première**, **quand** elle se produit, **alors** le middleware global a repris la session **avant** le rendu.
3. **Étant donné** une page dont le premier niveau de gabarit est un `v-if` / `v-else`, **quand** le contrôle s'exécute, **alors** **il échoue en nommant la page** : une page a une seule racine, et c'est un élément.
4. **Étant donné** deux pages différentes, **quand** on navigue de l'une à l'autre, **alors** la racine du layout **ne se démonte pas** : le témoin de synchronisation et le sélecteur d'établissement ne clignotent pas.
5. **Étant donné** le plugin de thème, **quand** il s'exécute, **alors** il **n'applique pas** la classe de thème — le script en ligne du `head` l'a déjà fait ; le plugin ne fait qu'assurer la suite.

---

### Récit 4 — Les données simulées ont la forme du modèle, et c'est Deloria (Priorité : P1)

Le développeur ouvre la couche de données simulées. Il y trouve **Deloria** : 17 unités en 5 catégories aux tarifs réels, la salle de réunion, les barèmes de passage et de demi-journée, une trentaine d'articles de catalogue, cinq comptes aux rôles cumulés. Et un second établissement, **« Résidence Test »**, à 4 unités, avec le seul module `HEBERGEMENT`. Il compare chaque champ à `docs/modele-donnees/` : **mêmes noms, mêmes types, mêmes valeurs d'énumération**.

**Pourquoi cette priorité** : c'est ce qui rendra le branchement de la phase 3 mécanique plutôt qu'une traduction. Un jeu de données qui s'écarte du modèle transforme chaque endpoint livré en réécriture d'écran. Et le second établissement est le **pendant en phase 2 du test d'agnosticité du socle** (ETB-02c) : c'est le moment le moins cher pour découvrir que la coquille suppose une chambre — ou un point de vente.

**Vérification indépendante** : confronter les jeux aux fichiers SQL du modèle, champ par champ. Testable sans écran.

**Scénarios d'acceptation** :

1. **Étant donné** un jeu de données simulées, **quand** on compare ses champs à la table correspondante de `docs/modele-donnees/`, **alors** les noms, les types et les valeurs d'énumération coïncident — **tout écart fait échouer**.
2. **Étant donné** le tenant Deloria, **quand** on l'inspecte, **alors** il porte l'établissement d'Abengourou avec ses modules `HEBERGEMENT`, `RESTAURATION`, `BAR`, `PRESSING` et `SALLE_REUNION` activés, **17 unités en 5 catégories aux tarifs réels**, la salle de réunion, les barèmes de passage et de demi-journée, une trentaine d'articles et cinq comptes aux **rôles cumulés**.
3. **Étant donné** l'établissement « Résidence Test », **quand** on l'active, **alors** il porte **4 unités** et le **seul module `HEBERGEMENT`** — et **aucune surface de la coquille ne suppose l'existence d'un point de vente**.
4. **Étant donné** un composant qui affiche une donnée, **quand** on inspecte son code, **alors** **il ne connaît pas la provenance** : il consomme une interface de domaine, jamais un jeu de données ni un appel.
5. **Étant donné** l'interface d'un domaine, **quand** on la lit, **alors** c'est **celle que le client généré implémentera en phase 3** — mêmes opérations, mêmes formes d'entrée et de sortie.
6. **Étant donné** un domaine qu'aucun cycle n'a encore ouvert, **quand** on cherche son interface, **alors** **elle n'existe pas** — et le patron qui permet de l'ajouter, lui, existe et est documenté.

---

### Récit 5 — Les catalogues fr et en, à parité, sans une chaîne en dur (Priorité : P1)

Le développeur bascule l'application en anglais. **Rien ne reste en français**, et aucune clé brute n'apparaît. Il ajoute une chaîne visible en dur dans un composant : **le contrôle la refuse**. Il ajoute une clé au catalogue français seulement : **le contrôle la refuse aussi**.

**Pourquoi cette priorité** : une i18n rétrofitée touche chaque fichier une seconde fois (constitution, principe 8). Et le vocabulaire n'est pas libre : `docs/design/lexique.md` fait foi sur ce que l'utilisateur lit, y compris dans les URL — le nom d'un fichier de page décide de la route, et une route est visible.

**Vérification indépendante** : basculer de langue et parcourir le styleguide et l'index. Testable sans données simulées.

**Scénarios d'acceptation** :

1. **Étant donné** l'application au premier démarrage, **quand** aucune langue n'est choisie, **alors** elle est en **français**.
2. **Étant donné** le catalogue français et le catalogue anglais, **quand** on les compare, **alors** l'ensemble des clés est **identique dans les deux sens** — aucune clé orpheline d'un côté ni de l'autre.
3. **Étant donné** une chaîne visible écrite en dur dans un composant ou une page, **quand** le contrôle s'exécute, **alors** il échoue **en nommant le fichier et la ligne**.
4. **Étant donné** un terme du lexique, **quand** il apparaît dans un catalogue, **alors** il porte la formulation du lexique — **`lexique.md` prime sur le catalogue**, et un écart se corrige dans le catalogue.
5. **Étant donné** une adresse de page, **quand** on la lit, **alors** elle n'emploie **aucun mot proscrit par le lexique** — une URL est visible.
6. **Étant donné** un composant du design system, **quand** il reçoit un libellé, **alors** il reçoit une **clé**, jamais du texte : une chaîne passée en prop afficherait la clé brute au premier rendu.

---

### Récit 6 — La commande unique gagne deux portes, chacune avec son test négatif (Priorité : P1)

Le développeur lance `scripts/verifier.sh`. Le script enchaîne, **dans une seule commande**, le lint, le build, les quatre portes existantes et les **deux nouvelles** : **P-03**, aucune dépendance en intervalle ; **P-04**, l'application démarre et **chaque écran s'atteint**, en clair et en sombre, sur **Chromium et sur WebKit**. Il casse chacune volontairement : **chacune rougit**, et **nomme l'objet fautif**.

**Pourquoi cette priorité** : la vérification est le seul contrôle qui ait de la valeur pour un développeur seul (constitution, principe 13). P-04 attrape la famille de défauts la plus coûteuse de la phase 2 — un écran inatteignable pendant que tous les tests sont verts —, parce qu'un test qui monte un composant contourne le routeur, la suspension, les layouts et les plugins.

**Vérification indépendante** : lancer la commande, puis chaque test négatif. Testable dès que l'index des écrans et un manifeste de dépendances existent.

**Scénarios d'acceptation** :

1. **Étant donné** un manifeste portant une version en intervalle, **quand** P-03 s'exécute, **alors** elle échoue **en nommant le paquet et la contrainte fautive**.
2. **Étant donné** un lockfile absent, périmé ou non commité, **quand** P-03 s'exécute, **alors** elle échoue en le nommant.
3. **Étant donné** une dépendance absente de `docs/versions-reference.md`, **quand** P-03 s'exécute, **alors** elle échoue en la nommant — et **le sens inverse compte aussi** : une entrée du document qu'aucun manifeste ne porte échoue également.
4. **Étant donné** l'index des écrans, **quand** P-04 s'exécute, **alors** **chaque écran déclaré est atteint**, en clair **et** en sombre, sur Chromium **et** sur WebKit, **dans un navigateur réel** — et une erreur de console non attendue fait échouer.
5. **Étant donné** une route atteignable absente de l'index — ou une entrée d'index qu'aucune route ne sert —, **quand** P-04 s'exécute, **alors** elle échoue : **la comparaison se fait dans les deux sens**.
6. **Étant donné** P-04, **quand** elle s'exécute, **alors** elle **déclare son périmètre inspecté** et son **plancher de non-vacuité** — une porte qui atteindrait zéro écran passerait au vert sans rien prouver.
7. **Étant donné** un écran rendu inatteignable volontairement, **quand** le test négatif de P-04 s'exécute, **alors** **la porte rougit** et le test le constate ; si elle reste verte, le script sort sur le **code « porte aveugle »**, distinct du code d'échec ordinaire.
8. **Étant donné** l'ensemble du dépôt, **quand** on le parcourt, **alors** **aucun workflow GitHub Actions n'existe** — le serveur de CI vient en phase 3, et le script ne changera pas ce jour-là.
9. **Étant donné** une porte quelconque, **quand** elle s'exécute, **alors** elle respecte les **cinq points du contrat de porte** : périmètre déclaré, complétude vérifiée, rien de modifié, cible non vide prouvée, test négatif existant.

---

### Récit 7 — Je bascule l'application dans un état dégradé depuis l'interface (Priorité : P2)

Le développeur ouvre « **Scénarios** » (`/_scenarios`) depuis **n'importe quel écran**. Il règle la latence, provoque un échec réseau, passe hors ligne, vide le jeu de données, restreint les permissions en changeant de compte actif, et produit une écriture d'essai dont il choisit la classe. **L'application change d'état sans recompilation**, et le réglage survit à un rechargement.

**Pourquoi cette priorité** : sans un levier accessible depuis l'interface, les états dégradés ne seront jamais regardés — ils resteront un paragraphe de spécification. Or ce sont eux que le pilote rencontrera à Abengourou : c'est l'état nominal du terrain, pas l'exception.

**Vérification indépendante** : ouvrir le panneau, actionner chaque levier, constater l'effet. Testable dès que la couche de données simulées existe.

**Scénarios d'acceptation** :

1. **Étant donné** n'importe quel écran de l'application, **quand** l'utilisateur actionne l'accroche permanente, **alors** le panneau « **Scénarios** » s'ouvre — et il a **aussi** son adresse fixe `/_scenarios`, déclarée à l'index des écrans.
2. **Étant donné** une latence réglée à une valeur donnée, **quand** une lecture est demandée, **alors** l'écran montre son **squelette à la forme exacte du contenu à venir** pendant ce délai — jamais une roue, sauf attente réseau réellement indéterminée.
3. **Étant donné** le levier « échec réseau », **quand** une lecture est demandée, **alors** l'erreur dit **ce qui s'est passé, pourquoi, et l'action suivante** — une erreur sans porte de sortie est un défaut de conception.
4. **Étant donné** le levier « hors ligne », **quand** il est actionné, **alors** le témoin de synchronisation passe hors ligne **instantanément, sans transition**, et l'application reste utilisable pour tout ce qui l'est hors ligne.
5. **Étant donné** le levier « jeu vide », **quand** il est actionné, **alors** chaque surface qui listerait quelque chose montre son **état vide illustré**, avec **la phrase qui dit ce qui apparaîtra et l'action qui démarre** — jamais une impasse.
6. **Étant donné** le levier de compte actif, **quand** le développeur passe d'Adjoua à Aminata, **alors** les permissions changent **à la navigation suivante comme à la page courante**, sans rechargement manuel.
7. **Étant donné** un réglage de scénario, **quand** la page est rechargée, **alors** **le réglage est toujours actif** — sinon on le repose à chaque essai et on cesse de s'en servir.

---

### Récit 8 — Une capacité de plateforme absente le dit, et propose l'alternative (Priorité : P2)

Le développeur ouvre l'application dans WebKit et demande une impression thermique. L'application **ne se tait pas et n'échoue pas après coup** : elle dit que cet appareil ne peut pas imprimer directement, et **propose l'alternative** — le ticket part sur l'imprimante de la réception. Il lit la note qui recense, moteur par moteur, ce que le web ne sait pas faire.

**Pourquoi cette priorité** : c'est la règle `PlatformAdapter`, et elle seule, qui rendra le passage à Capacitor mécanique plutôt qu'une réécriture (constitution, principe 7). Et les capacités absentes sont **des faits à afficher, pas des bogues à corriger** : en phase 2 ces messages sont fréquents et c'est normal ; Capacitor les fera disparaître.

**Vérification indépendante** : appeler chaque capacité sur les deux moteurs et lire ce que l'interface dit. Testable sans matériel réel.

**Scénarios d'acceptation** :

1. **Étant donné** l'interface `PlatformAdapter`, **quand** on la lit, **alors** elle couvre **impression, scan, caméra et OCR, stockage sécurisé, notifications, géolocalisation et état réseau** — et **une seule** implémentation est livrée : `web`.
2. **Étant donné** une méthode de l'interface, **quand** on examine sa signature, **alors** elle est **servable par un plugin natif** : une signature qui ne le serait pas est une méthode mal dessinée, et elle est corrigée avant d'être écrite.
3. **Étant donné** un composant quelconque, **quand** le contrôle s'exécute, **alors** **aucune API de plateforme n'y est appelée directement** — le contrôle échoue en nommant le fichier.
4. **Étant donné** une capacité absente du moteur courant, **quand** elle est sollicitée, **alors** l'application l'annonce **avant** que l'utilisateur ne tente l'action, **explique pourquoi** et **propose l'alternative** — jamais un grisé silencieux, jamais un échec après coup.
5. **Étant donné** WebKit, **quand** on inspecte le recensement, **alors** y figurent au moins : **WebUSB et Web Bluetooth absents** — donc **pas d'impression thermique directe sur iPhone** —, **notifications conditionnées à l'installation**, **pas d'accès au système de fichiers**.
6. **Étant donné** le recensement, **quand** on le cherche, **alors** il existe **dans le code** — interrogeable par l'application — **et dans une note** lisible par un humain, et les deux disent la même chose.
7. **Étant donné** l'attestation d'intégrité, **quand** on la cherche, **alors** l'interface **dit explicitement qu'elle n'existe pas sur le web** : c'est une limite assumée et écrite, pas un manque à combler.

---

### Récit 9 — Une action interdite est absente du HTML rendu (Priorité : P2)

Le développeur bascule le compte actif sur Aminata, serveuse. Les actions qu'un serveur n'a pas le droit de faire **ne sont pas grisées : elles ne sont pas là**. Il ouvre le HTML rendu : **elles n'y sont pas non plus**. Il bascule sur « Résidence Test », qui n'a que l'hébergement : les surfaces des autres modules **sont absentes**, pas désactivées.

**Pourquoi cette priorité** : « absente, jamais grisée » vaut pour la permission comme pour le module inactif (constitution, principe 7). Une action grisée dit à l'utilisateur qu'elle existe et qu'il n'y a pas droit — et elle laisse dans le document une cible que rien n'empêche d'actionner autrement.

**Vérification indépendante** : rendre la même page sous deux comptes et comparer les deux documents. Testable dès que la session et les données simulées existent.

**Scénarios d'acceptation** :

1. **Étant donné** un compte dépourvu d'une permission, **quand** une surface portant l'action correspondante est rendue, **alors** **le HTML rendu ne contient pas cette action** — le test le vérifie **sur le HTML**, pas sur un attribut de désactivation.
2. **Étant donné** un compte portant plusieurs rôles, **quand** ses permissions sont calculées, **alors** elles sont **l'union** des permissions de ses rôles — c'est la norme, pas l'exception.
3. **Étant donné** un établissement dont un module d'activité est inactif, **quand** une surface de ce module serait rendue, **alors** **elle est absente** : ni grisée, ni mentionnée.
4. **Étant donné** un attribut de désactivation posé sur une action interdite, **quand** le contrôle s'exécute, **alors** **il échoue** : griser au lieu de retirer est le défaut que ce récit refuse.
5. **Étant donné** la session, **quand** on cherche l'origine des permissions, **alors** **elles en viennent** — aucune permission n'est déduite d'un nom de rôle écrit en dur dans un composant.

---

### Récit 10 — La file accumule, affiche, et refuse ce qu'elle doit refuser (Priorité : P2)

Le développeur passe hors ligne. Il déclenche une écriture de classe A : elle **entre dans la file**, avec son identifiant généré côté client, et **le témoin affiche le nombre en attente**. Il déclenche une opération de classe B : **la file la refuse**, et l'interface **dit pourquoi et quoi faire à la place**. Il recharge la page : **la file est toujours là**.

**Pourquoi cette priorité** : en phase 2 la file n'envoie rien — **le refus est la propriété qu'on teste, pas l'envoi**. Un écran qui accepte en phase 2 ce que le serveur refusera en phase 3 est un écran à refaire, et le mensonge ne se découvre qu'au branchement.

**Vérification indépendante** : passer hors ligne par le panneau de scénarios, déclencher une écriture de chaque classe, recharger. Testable sans backend, par construction.

**Scénarios d'acceptation** :

1. **Étant donné** une écriture quelconque, **quand** elle est produite, **alors** elle porte un **identifiant UUID v7 généré côté client** et un horodatage local.
2. **Étant donné** une écriture de **classe A** hors ligne, **quand** elle est produite, **alors** elle est **acceptée** et entre dans la file locale.
3. **Étant donné** une opération de **classe B, C ou D** hors ligne, **quand** l'utilisateur s'en approche, **alors** l'interface **l'annonce indisponible avant qu'il ne la tente** par la phrase du lexique — « **Cette action nécessite internet.** » —, la file **la refuse**, et le message **dit ce qu'on peut faire à la place**.
4. **Étant donné** la classe d'une opération, **quand** on cherche d'où elle vient, **alors** elle vient de **`docs/registre-classes-offline.md`** — jamais d'une valeur recopiée dans un composant — et **la lettre de la classe n'apparaît nulle part à l'écran**.
5. **Étant donné** une file non vide, **quand** la page est rechargée ou l'application relancée, **alors** **la file est intacte** : elle est persistante localement.
6. **Étant donné** le témoin de synchronisation, **quand** on le lit, **alors** il porte **trois états internes seulement** — connecté, dégradé, hors ligne —, chacun avec **sa forme et sa phrase**, et **un nombre d'éléments en attente**, **jamais un pourcentage**.
7. **Étant donné** le HTML rendu du témoin, **quand** on y cherche les mots « connecté », « dégradé » et « hors ligne », **alors** **aucun des trois ne s'y trouve** : les libellés visibles sont « **Enregistré** », « **En attente d'envoi (n)** », « **Connexion faible** » et « **Hors connexion** ».
8. **Étant donné** une latence supérieure au seuil paramétré — **3 000 ms** au départ —, **quand** le témoin s'évalue, **alors** il affiche « **Connexion faible** » et non « Enregistré » : c'est ce seuil, et lui seul, qui sépare les deux états.
9. **Étant donné** la phase 2, **quand** le réseau revient, **alors** **la file n'envoie rien** : elle accumule et elle affiche. L'envoi appartient à la phase 3.
10. **Étant donné** le témoin, **quand** l'état passe hors ligne, **alors** le passage est **instantané, sans transition** — un état grave n'a pas de transition, il est déjà là.
11. **Étant donné** le panneau **Scénarios**, **quand** on y cherche de quoi produire une écriture, **alors** le **levier d'essai** y est, et il permet de **choisir la classe** — sans lui, rien dans ce cycle n'exercerait le refus.

---

### Récit 11 — L'index des écrans, à une adresse fixe (Priorité : P3)

Le développeur ouvre **`/_ecrans`**, titré « **Écrans** ». Il y voit **les 46 écrans du produit** — les 11 maquettés, les 32 dérivés, les 3 composés —, chacun avec son **code**, son **état d'avancement** et un **lien direct** ; puis, dans une **seconde section sans code**, les **instruments de développement**. Aujourd'hui trois entrées sont construites et quarante-trois sont « pas commencé ». À chaque cycle de phase 2, des entrées **changent d'état** — elles n'apparaissent pas.

**Pourquoi cette priorité** : c'est par cette page que le produit se regarde. Sans elle, personne ne sait ce qui existe — ni le développeur au cycle suivant, ni le pilote à la démonstration. Et c'est elle qui donne à **P-04** son périmètre : la porte prouve que chaque entrée s'atteint.

**Vérification indépendante** : ouvrir l'adresse et suivre chaque lien. Testable dès que deux écrans existent.

**Scénarios d'acceptation** :

1. **Étant donné** la section « le produit » de l'index, **quand** on la compte, **alors** elle porte **46 entrées**, celles que `docs/design/derivation.md` décompte, chacune avec son **code** (préfixe de `Kaya_Design.md` §3), son **état d'avancement** et un **lien direct**.
2. **Étant donné** la section « les instruments », **quand** on la lit, **alors** elle porte **« Guide de style », « Écrans » et « Scénarios »**, **sans code** — `Kaya_Design.md` §3 n'est pas amendé et le décompte des 46 est intact.
3. **Étant donné** une route atteignable de l'application, **quand** on la cherche à l'index, **alors** **elle y est**.
4. **Étant donné** une entrée d'index **marquée construite**, **quand** on suit son lien, **alors** **il aboutit**. Une entrée « pas commencé » n'est **pas** exigible — sinon la porte serait rouge dès son premier jour sur 43 écrans.
5. **Étant donné** l'index, **quand** P-04 s'exécute, **alors** **les entrées marquées construites sont le périmètre déclaré de la porte**, et leur nombre est son plancher de non-vacuité.
6. **Étant donné** un écran découvert à l'implémentation, **quand** il est ajouté, **alors** il est inscrit **à l'index et à `docs/design/derivation.md` dans le même changement**, avec la mention « découvert à l'implémentation, à valider » et les composants employés.
7. **Étant donné** les trois instruments, **quand** on les cherche à `docs/design/derivation.md`, **alors** ils y sont, **comme écrans composés**, dans une **entrée distincte marquée « instrument de développement »**, en **zone de charme**.

---

### Récit 12 — Les points d'entrée : « branché » et « dû », dans les deux sens (Priorité : P3)

Le développeur ouvre la liste des points d'entrée de la coquille. Chacun porte l'un de **deux états** : **branché** — il a au moins un appelant —, ou **dû** — il est écrit et attend le cycle qui l'emploiera. Il branche une méthode déclarée « dû » : **le build échoue**. Il retire le dernier appelant d'une méthode déclarée « branché » : **le build échoue aussi**.

**Pourquoi cette priorité** : une unité écrite n'est **ni testée ni branchée par défaut**, et il faut un contrôle pour chacune des deux propriétés. Le second versant est ce qui rend le premier utile : **sans lui, tout déclarer « branché » rendrait le contrôle muet**. C'est aussi la seule chose qui empêche `PlatformAdapter` — dont la moitié des méthodes n'aura d'appelant qu'en phase 3 — de devenir un mur de code mort qu'on cesse de lire.

**Vérification indépendante** : muter la liste dans un sens puis dans l'autre et constater les deux échecs. Testable dès que `PlatformAdapter` et une interface de domaine existent.

**Scénarios d'acceptation** :

1. **Étant donné** la liste des points d'entrée, **quand** on la lit, **alors** elle couvre **les surfaces publiques de la coquille** : méthodes de `PlatformAdapter`, méthodes des interfaces de domaine, composables exportés, composants du design system, middlewares et plugins.
2. **Étant donné** un point d'entrée déclaré **« dû »**, **quand** un appelant lui est ajouté, **alors** **le contrôle échoue en le nommant** — l'état doit passer à « branché » dans le même changement.
3. **Étant donné** un point d'entrée déclaré **« branché »**, **quand** son dernier appelant disparaît, **alors** **le contrôle échoue en le nommant** — le second versant, sans lequel le premier serait muet.
4. **Étant donné** une surface publique nouvelle, **quand** elle est ajoutée sans être inscrite à la liste, **alors** **le contrôle échoue** : une unité absente de la liste échappe aux deux sens.
5. **Étant donné** un point d'entrée déclaré **« branché »**, **quand** on cherche ce qui l'exerce, **alors** **au moins un test le fait** — c'est le contrôle de la seconde propriété, distinct du premier.
6. **Étant donné** le contrôle, **quand** il s'exécute, **alors** il est **dans `scripts/verifier.sh`** — jamais dans un script à part qu'on lancerait de mémoire.

---

### Cas limites

**Le build et la maquette**

- **Un utilitaire qui venait du CDN.** La maquette charge Tailwind par CDN, qui génère à la volée ; le build ne compile que ce qu'il trouve dans les sources. Une classe présente dans `styleguide.html` et absente du projet **ne lève aucune erreur** — elle ne s'affiche simplement pas. Que se passe-t-il ?
- **Un jeton présent dans un thème et absent de l'autre.** Les noms sont identiques et seules les valeurs changent : un jeton défini en clair et oublié en sombre rend un composant illisible sur la moitié du parc, sans erreur.
- **Une valeur arbitraire (`w-[347px]`, `text-[#3a3a3a]`).** Elle signale une valeur manquante à l'échelle. Est-elle listée, ou passe-t-elle ?

**La coquille**

- **Le service worker sert une version périmée.** Un correctif de calcul de taxe part le jour même, mais le cache peut le retenir. Que voit l'utilisateur ?
- **iOS n'affiche aucune bannière d'installation**, et les notifications y sont conditionnées à l'installation. Un utilisateur qui n'installe pas ne recevra jamais rien — le sait-il ?
- **Le navigateur purge le stockage après une longue inactivité.** La file locale et la session disparaissent. Que se passe-t-il au retour ?
- **La première image avant l'hydratation.** En SPA, le document initial est presque vide : le script en ligne du `head` est la **seule** chose qui puisse porter le thème avant le premier pixel.

**Les données et la session**

- **Le jeu vide sur un écran qui n'a pas d'état vide.** Le levier « jeu vide » doit produire une porte de sortie partout, pas une page blanche.
- **« Résidence Test » n'a pas de point de vente.** Une surface de la coquille qui supposerait un article, un tarif ou une table le découvrirait ici — et c'est le moment le moins cher pour le découvrir.
- **Une permission retirée en cours de session.** L'écran courant porte une action que le compte n'a plus le droit d'exercer. Disparaît-elle, ou attend-elle la navigation suivante ?
- **La session absente du stockage local à la toute première navigation.** Le middleware doit avoir un comportement défini, et le même à chaque navigation.

**La file et les classes**

- **Une écriture de classe A produite hors ligne pendant que le compte actif change.** À qui appartient-elle ?
- **Une opération dont la classe n'est pas déclarée au registre.** Elle est **non implémentable** — le contrôle doit le dire, pas la laisser passer.
- **Une écriture de classe B atteignable par un chemin qui, lui, est exécutable hors ligne.** C'est exactement le défaut que l'invariante refuse, et il se cache dans un chemin, pas dans une opération.

**Les portes**

- **P-04 sur un cycle sans écran métier.** Le périmètre est court par construction : la porte doit prouver que sa cible n'est pas vide, sinon son vert ne dit rien.
- **Un écran atteignable qu'aucune entrée d'index ne déclare.** Il passerait P-04 sans être vu — d'où la comparaison dans les deux sens.
- **P-03 et le fichier `compose.yml` existant.** Il porte déjà des tags d'image exacts ; P-03 l'absorbe avec le reste, et c'est la fin de l'écart consigné au rapport du cycle D1.
- **Le poste de démonstration n'a pas de démon de conteneurs.** Le script exige aujourd'hui ce démon **avant d'exécuter quoi que ce soit**, alors que le lint, le build, P-03 et P-04 n'en ont aucun besoin. Sur ce poste, **rien** ne serait vérifiable — pas même ce qui ne dépend de rien. Que se passe-t-il, et lequel des deux codes de sortie s'applique : « prérequis manquant » pour tout le script, ou pour les seules portes qui l'exigent ?

---

## Exigences *(obligatoire)*

### Exigences fonctionnelles

**A · Autonomie et démarrage**

- **FR-001** : Le dépôt **DOIT** démarrer l'application par **une seule commande**, documentée au README.
- **FR-002** : Le démarrage et l'exercice de **tout** écran du produit **NE DOIVENT EXIGER** ni conteneur, ni base de données, ni service distant.
- **FR-003** : Le système **DOIT** rester exerçable sans accès réseau après le premier chargement — c'est la condition de la démonstration d'Abengourou.

**B · Projet, thème et jetons**

- **FR-004** : L'application **DOIT** être une SPA sans rendu serveur, servie par un seul build.
- **FR-005** : `docs/design/theme.css` **DOIT** être copié **tel quel** dans les ressources de l'application, et **DOIT** être le **seul** fichier de `docs/design/` copié. Tout écart entre la copie et la source **DOIT** faire échouer la vérification.
- **FR-006** : Aucune couleur, aucun espacement, aucun rayon, aucune ombre, aucune durée et aucune courbe **NE DOIT** apparaître en valeur littérale hors des jetons de `docs/design/tokens.md`.
- **FR-007** : Le thème clair et le thème sombre **DOIVENT** passer par la **variante `dark:` uniquement** — jamais par une seconde palette ni une seconde feuille de style.
- **FR-008** : Les **noms** de jetons **DOIVENT** être identiques dans les deux thèmes ; seules les **valeurs** changent. Un jeton présent dans un thème et absent de l'autre **DOIT** faire échouer la vérification.
- **FR-009** : Un **script en ligne dans le `head`** **DOIT** appliquer la classe de thème **avant le premier pixel**. Aucun plugin ni composant **NE DOIT** en être responsable.
- **FR-010** : En l'absence de choix explicite, le thème **DOIT** suivre la préférence système ; un choix explicite **DOIT** primer et **DOIT** survivre à la fermeture de l'application.
- **FR-011** : Toute valeur arbitraire employée **DOIT** être listée avec sa justification, pour décider si elle entre à l'échelle des jetons ou si elle s'aligne dessus.

**C · Coquille installable**

- **FR-012** : L'application **DOIT** porter un manifeste déclarant **nom, icônes, couleur de thème, orientation et affichage autonome**.
- **FR-013** : L'application **DOIT** porter un service worker et une **stratégie de cache déclarée** dont les deux propriétés sont fixées : **préchargement de la coquille** — l'application s'ouvre hors ligne **dès le premier écran** — et **révision au rechargement**, l'invite explicite de FR-017 tranchant. *Un correctif de calcul de taxe doit pouvoir partir le jour même.* **(D-10)**
- **FR-014** : L'application **DOIT** **s'ouvrir et s'afficher sans réseau**, dès sa première page, y compris relancée depuis l'état installé.
- **FR-015** : L'installation **DOIT** être vérifiée sur **Chromium et sur WebKit**. Sur WebKit, l'interface **DOIT** expliquer l'installation par le menu de partage et l'absence de bannière automatique.
- **FR-016** : Le service worker **NE DOIT PORTER AUCUNE** règle métier ; le manifeste **NE DOIT PORTER AUCUNE** logique. La coquille est **mince et remplaçable** — Capacitor prendra le relais.
- **FR-017** : Quand une version nouvelle est disponible, l'interface **DOIT** proposer explicitement de recharger — ni rechargement d'office, ni silence.

**D · Les seize composants et le styleguide interne**

- **FR-018** : Le système **DOIT** livrer les **seize composants canoniques** de `docs/design/composants.md`, chacun dans **tous les états** que ce fichier lui prête. Le décompte fait foi par les **sections numérotées** du fichier.
- **FR-019** : L'application **DOIT** porter un **styleguide interne** à une adresse fixe, montrant les seize composants dans tous leurs états, **en clair et en sombre**.
- **FR-020** : Le rendu du styleguide interne **DOIT** coïncider avec `docs/design/styleguide.html` sur les valeurs de `tokens.md`. Tout écart **DOIT** être signalé, jamais silencieux.
- **FR-021** : Toute cible cliquable **DOIT** offrir au moins **44 px** de zone de touche, y compris une icône seule ; **48 px** au comptoir.
- **FR-022** : Aucun état **NE DOIT** être porté par la couleur seule : il porte **aussi une forme**, selon le vocabulaire fixe de `composants.md` §04.
- **FR-023** : Tout montant **DOIT** s'écrire avec l'**espace fine insécable U+202F** entre les milliers et avant le F, produite par **une seule fonction** du code, et porter `whitespace-nowrap`.
- **FR-024** : Le mouvement **DOIT** respecter `docs/design/mouvement.md` : durées, courbes, sept patrons, plafond de décalage, réglage d'intensité par zone, et la préférence « réduire les animations », le retour tactile excepté.
- **FR-025** : Le composant 15 entrant au canon par ce cycle, `docs/design/composants.md` **DOIT** être mis à jour **dans le même changement**.
- **FR-026** : Tout composant du design system **DOIT** recevoir des **clés i18n**, jamais du texte.
- **FR-095** : Tout rendu **DOIT** atteindre **WCAG AA au minimum**, et **AAA sur les montants et les statuts**. Aucune information **NE DOIT** être portée par la seule couleur. *La réception de Deloria est en plein soleil sur un 1366 × 768 délavé.* **(D-13)**
- **FR-096** : Le mouvement **DOIT** tenir **60 images/s sur un appareil à 2 Go de RAM**, n'employer que **`transform` et `opacity`**, et n'animer **jamais plus de six éléments simultanément** — au-delà, on anime le conteneur, pas ses enfants. **(D-14)** *Aucun budget de **démarrage** n'existe au cadrage ni aux stories, et ce cycle n'en invente pas* **(D-15)**.

**E · Internationalisation**

- **FR-027** : Le système **DOIT** porter deux catalogues, **fr** et **en**, le **français par défaut**.
- **FR-028** : Les deux catalogues **DOIVENT** être à **parité stricte** ; une clé orpheline **dans l'un ou l'autre sens** **DOIT** faire échouer la vérification.
- **FR-029** : **Aucune chaîne visible NE DOIT** être écrite en dur. Le contrôle **DOIT** échouer en nommant le fichier et la ligne.
- **FR-030** : `docs/design/lexique.md` **DOIT** primer sur les catalogues ; un écart se corrige **dans le catalogue**.
- **FR-031** : Aucune adresse de page **NE DOIT** employer un mot proscrit par le lexique — une adresse est visible.
- **FR-097** : Ce cycle **DOIT** ajouter à `docs/design/lexique.md`, **dans le même changement que le code**, les **cinq termes que l'exploitant voit vraiment** et qui n'y figurent pas : le **thème** et ses valeurs (clair, sombre, comme l'appareil), la **langue**, l'**installation de l'application** — **avec son cas WebKit**, où rien ne se déclenche automatiquement et où l'absence d'installation prive l'appareil des alertes —, et le **rechargement pour une nouvelle version**. **Les noms des trois instruments N'Y ENTRENT PAS** (FR-088).

**F · Cycle de vie de l'application**

- **FR-032** : Le système **DOIT** porter **un** layout par défaut, portant une **racine stable** et **un seul** `<main>`.
- **FR-033** : Le système **DOIT** porter **un middleware global** qui reprend la session à **chaque navigation, la première comprise**.
- **FR-034** : Le système **DOIT** porter **un plugin de thème**, qui assure la suite sans être responsable de la première application.
- **FR-035** : Une page nouvelle **DOIT** hériter du layout, du middleware et du plugin **sans rien écrire**, et **NE DOIT PAS POUVOIR** l'oublier.
- **FR-036** : Une page **DOIT** avoir **une seule racine**, et cette racine **DOIT** être un élément — **jamais** un `v-if` / `v-else` de premier niveau. Le contrôle **DOIT** échouer en nommant la page.
- **FR-037** : La navigation entre deux pages **NE DOIT PAS** démonter la racine du layout.

**G · Couche de données simulées**

- **FR-038** : Le système **DOIT** porter la couche de données simulées dans `app/core/donnees/`, avec **une interface par domaine** — **la même** que le client généré implémentera en phase 3.
- **FR-039** : Aucun composant **NE DOIT** connaître la provenance des données : il consomme une interface de domaine, jamais un jeu ni un appel.
- **FR-040** : Les jeux de données **DOIVENT** être conformes à `docs/modele-donnees/` — **mêmes noms de champs, mêmes types, mêmes valeurs d'énumération**. Tout écart **DOIT** faire échouer la vérification.
- **FR-041** : La couverture livrée **DOIT** être celle des **domaines que le jeu Deloria peuple** — établissements et modules, comptes et rôles, hébergement, ventes — **plus le patron documenté** qui rend l'ajout d'un domaine mécanique.
- **FR-042** : Le jeu **DOIT** porter le tenant **Deloria** : établissement d'Abengourou, ses cinq modules d'activité activés, **17 unités en 5 catégories aux tarifs réels**, la **salle de réunion**, les **barèmes de passage et de demi-journée**, une **trentaine d'articles de catalogue**, **cinq comptes aux rôles cumulés**.
- **FR-043** : Le jeu **DOIT** porter un second établissement **« Résidence Test »**, à **4 unités**, avec le **seul module `HEBERGEMENT`** ; aucune surface de la coquille **NE DOIT** supposer l'existence d'un point de vente ni d'un hébergement.
- **FR-044** : Le système **DOIT** porter une **mécanique de scénarios** à cinq leviers : **latence réglable, échec réseau, mode hors ligne, jeu vide, permissions restreintes**.
- **FR-045** : Chaque levier **DOIT** être actionnable **depuis l'interface, sans recompilation**, depuis n'importe quel écran, et **DOIT** survivre à un rechargement.
- **FR-046** : Le panneau **DOIT** être titré « **Scénarios** » et vivre à l'adresse fixe **`/_scenarios`**, déclarée à l'index des écrans.
- **FR-093** : Le panneau **Scénarios DOIT** porter un **levier d'essai d'écriture** permettant de produire une écriture **dont on choisit la classe hors-ligne**, afin d'exercer **l'acceptation d'une classe A et le refus d'une classe B, C ou D**. *Sans lui, FR-057 et FR-059 seraient écrits sans jamais être exercés — et ce cycle ne produit aucun écran métier qui pourrait les exercer.* **(D-18)**
- **FR-094** : Les données simulées **NE DOIVENT PORTER AUCUN SECRET** — ni clé, ni jeton, ni identifiant réel. Le code servi au navigateur est lisible, et aucune coquille ne relâche cette règle. **(D-17)**

**H · Session et RBAC côté client**

- **FR-047** : La session **DOIT** être reprise du stockage local ; son **compte actif** se choisit parmi les cinq comptes Deloria depuis le panneau de scénarios. Ce cycle **NE LIVRE AUCUN** écran de connexion.
- **FR-048** : Les permissions **DOIVENT** venir de la session. Aucune permission **NE DOIT** être déduite d'un nom de rôle écrit en dur dans un composant.
- **FR-049** : Les rôles **DOIVENT** être cumulables ; les permissions d'un compte sont l'**union** de celles de ses rôles.
- **FR-050** : Une action qu'une permission interdit **DOIT ÊTRE ABSENTE DU HTML RENDU**, jamais grisée. Le test **DOIT** le vérifier **sur le HTML**, pas sur un attribut de désactivation. *Le lexique le confirme par la négative : la phrase de `permission_absente` « ne devrait jamais s'afficher ».*
- **FR-051** : Une surface d'un module d'activité inactif **DOIT ÊTRE ABSENTE**, jamais grisée ni mentionnée.
- **FR-090** : ⚠️ **Les mots de la mécanique NE DOIVENT JAMAIS atteindre l'interface.** Un module d'activité se dit « **vos services** » — l'ajout dit « **Ajouter un service** », le retrait dit « **Retirer** », jamais « activer » ni « désactiver ». Le RBAC se dit « **ce que chacun peut faire** » — **« rôle » et « permission » n'atteignent jamais l'écran** : on montre ce qui est possible, pas la mécanique qui l'autorise. **(D-05, D-06)**

**I · `PlatformAdapter`**

- **FR-052** : Le système **DOIT** porter l'interface **complète** `PlatformAdapter`, couvrant **impression, scan, caméra et OCR, stockage sécurisé, notifications, géolocalisation, état réseau**, et **DOIT** livrer son implémentation **web**.
- **FR-053** : L'interface **DOIT** être écrite **en pensant aux deux implémentations** — web aujourd'hui, capacitor en production. Une méthode dont la signature ne peut pas être servie par un plugin natif **DOIT** être redessinée avant d'être écrite.
- **FR-054** : **Aucun composant NE DOIT** appeler une API de plateforme directement. Le contrôle **DOIT** échouer en nommant le fichier.
- **FR-055** : Une capacité absente **DOIT** le dire **explicitement à l'utilisateur, avant qu'il ne tente l'action**, et **DOIT** proposer l'alternative. Le cas de l'impression a sa formulation écrite : « **cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception** ». **(D-09)**
- **FR-056** : Le système **DOIT** recenser, **dans le code et dans une note**, ce que le web ne sait pas faire **par moteur** — au minimum : WebUSB et Web Bluetooth absents de WebKit, donc pas d'impression thermique directe sur iPhone ; notifications conditionnées à l'installation sur iOS ; pas d'accès au système de fichiers sur iOS ; attestation d'intégrité inexistante sur le web. **Ce sont des faits à afficher, pas des bogues à corriger.**
- **FR-092** : `PlatformAdapter` **DOIT** exposer l'accès au **stockage sécurisé** ; le **chiffrement au repos et la purge à la déconnexion sont HORS PÉRIMÈTRE de ce cycle** — PWA-05 relève de la tranche T4. Ce cycle livre le point d'articulation, pas la protection. **(D-16)**

**J · File hors-ligne et témoin**

- **FR-057** : Toute écriture **DOIT** porter un **UUID v7 généré côté client** et un horodatage local.
- **FR-058** : La file **DOIT** être **locale et persistante** : elle survit au rechargement et à la relance de l'application.
- **FR-059** : La file **DOIT REFUSER** toute opération de **classe B, C ou D** hors ligne, **avec son explication et ce qu'on peut faire à la place**, annoncée **avant** la tentative. La formulation est celle du lexique : « **Cette action nécessite internet.** » / *This action requires an internet connection.* **(D-03)**
- **FR-060** : La classe d'une opération **DOIT** venir de `docs/registre-classes-offline.md` ; aucune valeur de classe **NE DOIT** être recopiée dans un composant, et **la lettre de la classe NE DOIT JAMAIS atteindre l'écran** : l'utilisateur lit « disponible hors connexion » ou « nécessite internet ». **(D-04)**
- **FR-061** : En phase 2, la file **N'ENVOIE RIEN** : elle accumule et elle affiche. **Aucune donnée de classe B, C ou D NE DOIT** se trouver en cache d'écriture sur le terminal — ces entités sont en **lecture seule** côté client. **(D-20)**
- **FR-062** : Le témoin de synchronisation **DOIT** être **permanent** et porter **trois états internes** — connecté, dégradé, hors ligne — avec, pour chacun, **sa forme et sa phrase**, plus le **nombre d'éléments en attente**. **Jamais de pourcentage.**
- **FR-063** : Le passage hors ligne **DOIT** être **instantané, sans transition**.
- **FR-086** : ⚠️ **Les trois noms d'état internes NE DOIVENT JAMAIS atteindre l'écran.** Les libellés visibles sont ceux que le lexique déclare faire foi : « **Enregistré** » / *Saved* · « **En attente d'envoi (n)** » / *Pending send (n)* · « **Connexion faible** » / *Weak connection* · « **Hors connexion** » / *No connection*. *`app/core/i18n` avait précisément dérivé sur « Connecté », « Hors ligne » et « {n} éléments en attente », qui décrivent le réseau au lieu de dire ce qui compte pour Aminata : son travail est-il en sécurité.* **(D-01)**
- **FR-087** : L'état « connexion faible » **DOIT** se distinguer de « connecté » par un **seuil de latence paramétrable**, de valeur initiale **3 000 ms** (`sync.latence_degradee_seuil_ms`, portée la plus basse **ÉTABLISSEMENT**). Sans ce seuil, l'état ne serait pas testable et aucune porte ne pourrait séparer les deux. **(D-02)**

**K · Index des écrans**

- **FR-064** : L'application **DOIT** porter un **index des écrans** à l'adresse fixe **`/_ecrans`**, titré « **Écrans** », et cet index **DOIT** porter **deux sections** : **(a)** les **46 écrans du produit** — 11 maquettés, 32 dérivés, 3 composés, tels que `docs/design/derivation.md` les décompte —, chacun avec son **code**, son **état d'avancement** et un **lien direct** ; **(b)** les **instruments de développement**, **sans code**. **(D-07)**
- **FR-065** : L'index **DOIT** être tenu à jour par **chaque cycle de phase 2**, dans le même changement que les écrans qu'il ajoute — un écran passe d'un état d'avancement à l'autre, il n'apparaît pas.
- **FR-066** : Un écran découvert à l'implémentation **DOIT** être inscrit à l'index **et à `docs/design/derivation.md`** dans le même changement, avec la mention « découvert à l'implémentation, à valider » et les composants employés.
- **FR-088** : Les **trois instruments** portent des noms et des adresses **fixés par ce cycle** et **stables ensuite** : « **Guide de style** » → `/_guide-de-style` · « **Écrans** » → `/_ecrans` · « **Scénarios** » → `/_scenarios`. La **route suit le titre**, comme l'exige le lexique pour l'écran `S1`, et le préfixe `_` marque l'instrument. **Ces trois noms NE DOIVENT PAS entrer au lexique** : le lexique protège l'utilisateur du jargon, il n'est pas le registre des noms d'outils, et l'y transformer le rendrait inconsultable pour ce à quoi il sert. **Ils vivent à l'index des écrans.**
- **FR-089** : Les trois instruments **DOIVENT** s'inscrire à `docs/design/derivation.md`, en **zone de charme**, et le **décompte des 46 écrans du produit reste inchangé**. ⚠️ **Le même changement DOIT amender la règle opposable de `derivation.md`** pour y définir la catégorie **« instrument de développement »** — *assemblé uniquement à partir des seize composants, en zone de charme, consulté par le développeur et non par l'exploitant, hors du décompte des écrans du produit, sans code de préfixe*. **Motif** : le **guide de style échoue à la condition 1** d'un écran composé — *« liste, formulaire ou fiche suivant un motif déjà posé »* — alors qu'il satisfait les trois autres ; `/_ecrans` et `/_scenarios` la satisfont, lui non. *La condition 1 existe pour empêcher qu'un écran invente un motif ; le guide de style n'en invente aucun, il les montre. La substance est respectée, la lettre ne l'est pas — et un écart constaté ne se tranche jamais en silence.* **(D-11, D-12, amendement du 2026-08-07)**

**L · Vérification — la commande unique**

- **FR-067** : `scripts/verifier.sh` **DOIT** rester **une seule commande**, documentée au README, et **DOIT** désormais inclure le **lint** et le **build**.
- **FR-068** : Le script **DOIT** gagner la porte **P-03** : aucune dépendance en intervalle, **lockfiles commités et à jour**, et **chaque version inscrite à `docs/versions-reference.md`** — la comparaison se faisant **dans les deux sens**.
- **FR-069** : Le script **DOIT** gagner la porte **P-04** : l'application **démarre** et **chaque écran s'atteint**, **en clair et en sombre**, sur **Chromium et sur WebKit**, **dans un navigateur réel**.
- **FR-070** : P-04 **DOIT** comparer les routes réelles et les entrées de l'index **dans les deux sens**, **en bornant le second sens à l'état d'avancement** : **(a)** toute route atteignable **DOIT** figurer à l'index, quel que soit son état ; **(b)** toute entrée **marquée construite DOIT** être atteignable. Une entrée « pas commencé » n'est **pas** exigible. *Sans cette borne, la porte serait rouge dès son premier jour sur les 43 écrans que ce cycle ne construit pas — et on la désactiverait sous trois semaines.* **(D-08)**
- **FR-071** : Chaque porte nouvelle **DOIT** respecter les **cinq points du contrat de porte** : périmètre déclaré, complétude vérifiée, rien de modifié, **cible non vide prouvée par un plancher déclaré**, **test négatif** existant.
- **FR-072** : Chaque porte nouvelle **DOIT** avoir son **test négatif**, qui casse la porte volontairement et **exige qu'elle échoue** ; un test négatif qui passerait au vert **DOIT** produire le code de sortie « porte aveugle », distinct du code d'échec ordinaire.
- **FR-073** : Le dépôt **NE DOIT CONTENIR AUCUN** workflow GitHub Actions, et **P-03 DOIT le vérifier** — l'absence de `.github/workflows/` est un contrôle de répertoire, de coût nul. *Sans lui, l'interdiction ne reposait que sur le fait que personne n'avait encore écrit le fichier.* **(amendement du 2026-08-07)**
- **FR-085** : Le prérequis d'un démon de conteneurs **DOIT** devenir **local aux portes qui l'exigent** (P-01, P-02, P-05), jamais global au script. Sur un poste dépourvu de ce démon, le **lint, le build, P-03 et P-04 DOIVENT s'exécuter**, et le script **DOIT** déclarer explicitement les portes qu'il a **sautées faute de prérequis** — une porte sautée n'est ni verte ni rouge, et un vert global sur un sous-ensemble non déclaré ne prouverait rien.

**M · Points d'entrée — les deux propriétés**

- **FR-074** : Le dépôt **DOIT** tenir une **liste des points d'entrée** de la coquille, chacun portant l'un de **deux états** : **« branché »** ou **« dû »**.
- **FR-075** : Le périmètre de la liste **DOIT** être les **surfaces publiques de la coquille** : méthodes de `PlatformAdapter`, méthodes des interfaces de domaine, composables exportés, composants du design system, middlewares et plugins.
- **FR-076** : Un point d'entrée déclaré **« dû »** qui **acquiert** un appelant **DOIT** faire échouer la vérification.
- **FR-077** : Un point d'entrée déclaré **« branché »** qui **perd** son dernier appelant **DOIT** faire échouer la vérification. *Sans ce second versant, tout déclarer « branché » rendrait le contrôle muet.*
- **FR-078** : Une surface publique nouvelle **absente** de la liste **DOIT** faire échouer la vérification.
- **FR-079** : Tout point d'entrée déclaré **« branché »** **DOIT** être exercé par au moins un test — c'est le contrôle de la **seconde** propriété, distinct du premier. *Une unité écrite n'est ni testée ni branchée par défaut.*
- **FR-080** : Ces contrôles **DOIVENT** vivre dans `scripts/verifier.sh` — jamais dans un script à part.

**N · Documents mis à jour dans le même changement**

- **FR-081** : `docs/versions-reference.md` **DOIT** être mis à jour dans le même changement que chaque dépendance ajoutée ou montée.
- **FR-082** : `docs/design/composants.md` **DOIT** être mis à jour pour l'entrée du composant 15 au canon.
- **FR-091** : `docs/design/lexique.md` **DOIT** recevoir les **cinq entrées** de FR-097, et `docs/design/derivation.md` l'**entrée distincte** des trois instruments de FR-089 — les deux **dans le même changement que le code**. *Un document mis à jour « juste après » ne l'est jamais.*
- **FR-083** : Le **README** **DOIT** documenter la commande de démarrage, la commande unique de vérification, les deux portes nouvelles et leurs tests négatifs.
- **FR-084** : Le cycle **DOIT** produire un **rapport de cycle** consignant ce qu'aucune porte ne couvre — au premier chef les constats faits à la main sur les deux moteurs.

### Entités clés

- **Établissement** — l'entité centrale. Porte sa juridiction, son classement, sa commune, son fuseau, sa devise, et les **modules d'activité** qu'il active. Deux exemplaires au jeu simulé : Deloria (cinq modules) et Résidence Test (`HEBERGEMENT` seul).
- **Module d'activité** — la verticale : `HEBERGEMENT`, `RESTAURATION`, `BAR`, `PRESSING`, `SALLE_REUNION`. **Un module inactif est absent de l'interface, jamais grisé.**
- **Compte** — l'identité d'authentification, porteuse des **rôles cumulables**. Cinq exemplaires au jeu simulé, chacun avec ses rôles et donc son jeu de permissions.
- **Session** — le compte actif, l'établissement actif et les permissions résolues. Reprise à **chaque** navigation par le middleware global.
- **Permission** — granulaire, attachée aux modules. **L'union des permissions des rôles.** Une action non permise est absente du HTML.
- **Unité et catégorie** — les 17 unités de Deloria en 5 catégories aux tarifs réels, plus la salle de réunion ; les 4 de Résidence Test.
- **Formule et barème** — nuitée, passage horaire à paliers, demi-journée, mensuel ; chaque formule portant son traitement de taxe.
- **Article** — la trentaine d'articles de catalogue répartis sur les points de vente.
- **Interface de domaine** — le contrat qu'un composant consomme et que le client généré implémentera en phase 3. Le composant ne connaît jamais la provenance.
- **Scénario de simulation** — les cinq leviers : latence, échec réseau, hors ligne, jeu vide, permissions restreintes. Réglables depuis l'interface, persistants.
- **Élément de file** — une écriture en attente, portant son **UUID v7 client**, son horodatage local et sa **classe hors-ligne**. La file accumule, affiche, et refuse les classes B, C et D.
- **Capacité de plateforme** — impression, scan, caméra et OCR, stockage sécurisé, notifications, géolocalisation, état réseau. Chacune porte, par moteur, sa **disponibilité** et son **alternative**.
- **Écran** — une entrée de l'index. Deux familles, qui ne se mélangent pas : les **46 écrans du produit**, chacun avec son **code** et son **état d'avancement** ; et les **instruments de développement**, **sans code**. Seules les entrées **marquées construites** sont le périmètre exigible de P-04.
- **Point d'entrée** — une surface publique de la coquille, portant l'état « branché » ou « dû », vérifié dans les deux sens.

---

## Critères de succès *(obligatoire)*

### Résultats mesurables

- **SC-001** : **Une seule commande**, documentée au README, démarre l'application sur un poste **sans conteneur en cours d'exécution** et **sans base de données** — vérifié en arrêtant le démon de conteneurs avant de la lancer.
- **SC-002** : L'application **installée s'ouvre et affiche sa première page sans réseau**, sur **Chromium et sur WebKit** — deux moteurs, deux constats.
- **SC-003** : Au démarrage en thème sombre, **aucune image capturée avant la première interaction** ne présente le fond clair.
- **SC-004** : **16 composants sur 16** sont rendus au styleguide interne, chacun dans **la totalité** des états que lui prête `composants.md`, **en clair et en sombre**.
- **SC-005** : L'écart entre le styleguide interne et `docs/design/styleguide.html`, mesuré sur les valeurs de `tokens.md`, est **nul** — et un utilitaire manquant est **signalé**, jamais silencieux.
- **SC-006** : **100 %** des chaînes visibles proviennent d'un catalogue, et les catalogues fr et en ont **zéro clé orpheline dans chacun des deux sens**.
- **SC-007** : **Chaque entrée de l'index marquée construite s'atteint**, en clair **et** en sombre, sur Chromium **et** sur WebKit — soit **quatre passages par écran**, dans un navigateur réel. Une entrée « pas commencé » n'est pas exigible ; **aucune route atteignable n'est absente de l'index**.
- **SC-008** : Les **cinq leviers de scénario** se règlent depuis l'interface **sans recompilation**, et **survivent à un rechargement** — cinq sur cinq.
- **SC-009** : Sous un compte dépourvu d'une permission, l'action correspondante apparaît **zéro fois** dans le HTML rendu — mesuré sur le document, pas sur un attribut.
- **SC-010** : **Toute** opération de classe B, C ou D est refusée hors ligne **avec son explication**, **avant** que l'utilisateur ne la tente ; et **toute** opération de classe A est acceptée et mise en file.
- **SC-011** : Le jeu Deloria porte **17 unités en 5 catégories**, la salle de réunion, les barèmes de passage et de demi-journée, **≥ 30 articles**, **5 comptes aux rôles cumulés**, et un second établissement à **4 unités** au **seul module `HEBERGEMENT`**.
- **SC-012** : **Chaque champ** de **chaque** jeu de données simulées coïncide avec la table correspondante de `docs/modele-donnees/` sur son nom, son type et ses valeurs d'énumération — **zéro écart**.
- **SC-013** : **Chaque** capacité de `PlatformAdapter` absente du moteur courant affiche son message **et** son alternative — aucune absence silencieuse, aucun échec après coup.
- **SC-014** : Le témoin affiche le **nombre exact** d'éléments en attente, **jamais un pourcentage**, et la file **survit à un rechargement** avec le même décompte.
- **SC-015** : Sur un poste pourvu de tous les prérequis, la commande unique passe **P-01, P-02, P-05, P-03 et P-04** en une seule invocation, **lint et build compris**, et **sort en échec au premier contrôle rouge**.
- **SC-021** : Sur un poste **dépourvu de démon de conteneurs**, la commande unique exécute quand même le **lint, le build, P-03 et P-04**, et **nomme les trois portes qu'elle a sautées** faute de prérequis. Aucun vert global n'est imprimé sur un sous-ensemble non déclaré.
- **SC-016** : Les **deux tests négatifs nouveaux** font rougir leur porte, **en nommant l'objet fautif** ; un test négatif qui passerait au vert produit le code de sortie **« porte aveugle »**.
- **SC-017** : La commande unique **imprime sa durée**, et celle-ci reste **sous cinq minutes** sur le poste de développement. Le franchissement des **trois minutes** est consigné au README comme approche du déclencheur documenté du passage au serveur d'intégration (constitution, principe 13).
- **SC-018** : La liste des points d'entrée fait échouer la vérification **dans les deux sens** — un « dû » qui gagne un appelant, un « branché » qui perd le sien —, constaté par **deux mutations distinctes**.
- **SC-019** : **Zéro** workflow GitHub Actions dans le dépôt.
- **SC-020** : La démonstration de fin de cycle est exécutable de bout en bout : *ouvrir l'application installée, hors ligne, en clair et en sombre ; voir le styleguide ; basculer l'application en mode dégradé depuis l'interface* (`docs/user-stories-v1.md` §0.5, cycle F1).
- **SC-022** : Les mots « **connecté** », « **dégradé** » et « **hors ligne** » apparaissent **zéro fois** dans le HTML rendu et **zéro fois** dans les catalogues i18n — dans les deux langues. Les quatre libellés du lexique y sont, eux, tous les quatre.
- **SC-023** : L'index porte **46 entrées codées** dans sa section « le produit » — le décompte de `docs/design/derivation.md` — et **3 entrées sans code** dans sa section « les instruments ». **`Kaya_Design.md` §3 compte toujours onze préfixes.**
- **SC-024** : Le contraste atteint **WCAG AA sur la totalité** des rendus du guide de style, **et AAA sur les montants et les statuts**, mesuré dans les deux thèmes.
- **SC-025** : Les **cinq entrées de lexique** dues par ce cycle — thème, sombre, langue, installer l'application, recharger pour la nouvelle version — sont dans `docs/design/lexique.md`, **dans le même changement que le code**, et **aucun nom d'instrument ne s'y est glissé**.

---

## Hypothèses

Elles sont écrites parce qu'elles ont été **choisies**, faute d'être dites. Chacune peut être renversée ; aucune ne l'est en silence.

> **Quatre hypothèses de la première rédaction ont cessé d'en être** et sont devenues des exigences, à la séance de clarification du 2026-08-07 : les **adresses des trois instruments** (FR-088), l'**accroche permanente du panneau** (FR-046), le **levier d'essai d'écriture** (FR-093) et le **contenu de l'index** (FR-064). Elles ne figurent plus ici — une hypothèse tranchée qui resterait dans cette liste serait lue comme encore ouverte.

1. **Les surfaces internes sont présentes dans le build de phase 2 et de démonstration.** Leur sort en production se tranchera en phase 3 — c'est là que la question se pose, et pas avant. Le critère de fin du cycle F1 l'impose d'ailleurs : *basculer l'application en mode dégradé depuis l'interface* suppose que le panneau soit là le jour de la démonstration.
2. **Le thème suit la préférence système en l'absence de choix explicite.** `theme.css` laisse le projet trancher ; l'éclair clair à l'ouverture d'un utilisateur en sombre, cité par l'entrée du cycle, suppose que la préférence système compte.
3. **La session est reprise du stockage local, sans écran de connexion.** F2 posera l'écran (CPT-01) et remplacera la source ; le middleware, lui, ne changera pas.
4. **La durée de la commande unique franchira le repère de deux minutes**, parce que P-04 lance deux moteurs de navigateur. Le repère constitutionnel porte sur le moment où *on cesse de lancer le script*, pas sur une limite dure : la durée est donc **imprimée et suivie**, et le franchissement des trois minutes est consigné.
5. **Le composant 15 entre au canon.** `composants.md` laissait la décision ouverte ; l'entrée du cycle demande « les seize composants dans tous leurs états », ce qui la tranche. Le document est corrigé dans le même changement.
6. **Les polices et les glyphes d'icônes sont embarqués localement.** L'ouverture hors ligne l'impose : une police chargée depuis un service distant manquerait précisément le jour de la démonstration.
7. **Aucun contrôle de ce cycle ne dépend du réseau.** La comparaison des versions se fait entre les manifestes et `docs/versions-reference.md`, deux fichiers du dépôt — jamais contre un registre distant.
8. **Les 46 entrées de l'index se reprennent de `docs/design/derivation.md` sans les rejuger.** Ce cycle recopie un décompte qui fait foi ailleurs ; si le décompte bouge, il bouge dans `derivation.md` d'abord.

---

## Hors périmètre

- **Tout écran métier.** Ni accueil, ni check-in, ni prise de commande, ni note, ni caisse, ni clôture, ni document, ni planning, ni configuration. Ils appartiennent aux cycles F2 à F7.
- **Tout appel réseau réel.** Aucun endpoint, aucun backend, aucune base, aucune migration, aucun conteneur.
- **L'écran de connexion et l'authentification** — CPT-01, cycle F2.
- **L'implémentation Capacitor de `PlatformAdapter`.** L'interface est écrite pour deux ; une seule est livrée.
- **L'envoi de la file.** La file accumule, affiche et refuse ; elle n'expédie rien avant la phase 3.
- **Toute porte au-delà de P-03 et P-04.** Les numéros s'attribuent dans l'ordre d'apparition ; une porte s'ajoute quand une erreur réelle s'est produite, jamais parce qu'elle figurerait bien dans une liste.
- **Tout workflow d'intégration continue.** Le serveur vient en phase 3, et le script ne changera pas ce jour-là.
- **Les interfaces des domaines qu'aucun cycle n'a encore ouverts** — caisse, fiscalité, documents, synchronisation, pilotage, éditeur, métriques, stocks, pressing. Le **patron** qui permet de les ajouter existe ; les interfaces arrivent avec le cycle qui les emploie.
- **Les provisions du cadrage §14.** Elles existent en phase 1 et nulle part ailleurs : une provision qui apparaîtrait dans un écran de phase 2 n'est plus une provision.

---

## Ce que ce cycle ne prouve pas

À dire au pilote, et à consigner au rapport de cycle — c'est la clause de la constitution sur ce que la phase 2 ne démontre pas :

- **Ni la conformité fiscale**, ni la justesse d'un calcul de taxe : rien n'est calculé pour de vrai.
- **Ni la résistance aux coupures réelles** : le mode hors ligne est un levier, pas une coupure.
- **Ni les performances sur le matériel visé** — un Android d'entrée de gamme à 2 Go, un poste 1366 × 768 en plein soleil. Les mesures faites sur le poste de développement ne les prédisent pas.
- **Ni la lisibilité en conditions réelles.** Les deux questions ouvertes de `tokens.md` §2.1 — le corps de 11 px de l'étiquette et le 13,5 px du texte — **ne se tranchent pas au bureau** : elles partent à la journée d'observation d'Abengourou, et leurs retours iront dans `docs/design/notes-terrain.md`.
