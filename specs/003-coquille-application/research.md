# Recherche — cycle F1, la coquille de l'application

**Cycle** : F1 — Fondations · **Phase** : 2 · **Date** : 2026-08-07
**Spécification** : [spec.md](./spec.md) · **Plan** : [plan.md](./plan.md)

Ce document porte les décisions de la phase 0 : les **versions vérifiées**, les **familles exclusives que ce cycle tranche pour tout le dépôt**, et les **trois questions que la clarification avait renvoyées à la planification**.

---

## 1. Versions — six ajouts, un écartement sur conflit constaté

**Toutes les valeurs déjà inscrites à `docs/versions-reference.md` sont reprises telles quelles, sans revérification** — c'est la consigne du cycle. Ce qui suit ne porte que sur **ce qui manquait**, chaque ligne interrogée sur son registre officiel **le 2026-08-07**.

### 1.1 `@vite-pwa/nuxt` — ÉCARTÉ, conflit constaté

`docs/versions-reference.md` §3.2 porte la ligne suivante :

> `@vite-pwa/nuxt` — **à vérifier au cycle qui l'ajoute** — Service worker, manifeste d'application, invite d'installation […] Vérifier `peerDependencies` contre Nuxt 4.5.1 et le Vite qu'il embarque.

**C'est ce cycle. La vérification est faite, et elle est négative.**

| Interrogé | `https://registry.npmjs.org/@vite-pwa/nuxt` — 2026-08-07 |
|---|---|
| `dist-tags.latest` | **1.1.1** |
| `description` | « Zero-config PWA for **Nuxt 3** » |
| `dependencies["@nuxt/kit"]` | **`^3.9.0`** |
| Portée du constat | Les **huit dernières versions** publiées (1.1.1, 1.1.0, 1.0.0, 0.8.1, 0.8.0, 0.7.0, 0.6.0, 0.5.0) portent **toutes** `@nuxt/kit ^3.9.0` |

`^3.9.0` **ne satisfait pas** le `@nuxt/kit` 4.x de Nuxt 4.5.1. Le module installerait un **second `@nuxt/kit`** en 3.x à côté de celui de Nuxt — deux membres d'une même famille dans le même arbre, ce que la règle 7 du §1 refuse. Et un module qui annonce « Nuxt 3 » sur sa dernière version est du terrain non défriché pour un développeur seul, ce qui est le critère d'arbitrage du §2.

**C'est l'application littérale de la règle 1** : la dernière stable, **sauf conflit constaté**. Le conflit est constaté, pas supposé.

### 1.2 `vite-plugin-pwa` — RETENU à sa place

| Interrogé | `https://registry.npmjs.org/vite-plugin-pwa/latest` — 2026-08-07 |
|---|---|
| `version` | **1.3.0** |
| `peerDependencies.vite` | `^3.1.0 \|\| ^4.0.0 \|\| ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| `dependencies` | `workbox-build ^7.4.1`, `workbox-window ^7.4.1`, `debug`, `tinyglobby`, `pretty-bytes` |
| `peerDependenciesMeta` | `@vite-pwa/assets-generator` : **optionnel** |

**Décision.** La coquille PWA passe par **`vite-plugin-pwa` branché directement dans `vite.plugins` de `nuxt.config`**, sans l'enveloppe Nuxt.

**Motif.** Trois raisons, dans cet ordre :

1. **Aucun conflit** : la plage de pair sur Vite est ouverte de 3 à 8, donc satisfaite quel que soit le Vite qu'embarque Nuxt 4.5.1. Aucune dépendance sur `@nuxt/kit`.
2. **Une dépendance au lieu de deux.** `@vite-pwa/nuxt` est une enveloppe mince autour de `vite-plugin-pwa` ; c'est le second qui fait le travail — manifeste, service worker, précache Workbox.
3. **C'est exactement ce que la spécification demande de la coquille** : « une couche mince et remplaçable », « rien de métier dans le service worker » (FR-016). Une enveloppe de cadriciel autour d'une enveloppe de cadriciel va dans l'autre sens, et Capacitor la rendra caduque.

**Ce qu'on perd, et pourquoi ça ne coûte rien ici** : l'enveloppe Nuxt apporte des auto-imports (`useNuxtApp().$pwa`) et une intégration aux devtools. La coquille n'expose **aucune** de ses fonctions aux composants — tout passe par `PlatformAdapter` (FR-054) et par un composable de mise à jour. Il n'y a donc rien à auto-importer.

### 1.3 `uuid` — RETENU

| Interrogé | `https://registry.npmjs.org/uuid/latest` — 2026-08-07 |
|---|---|
| `version` | **14.0.1** |
| `description` | « RFC9562 UUIDs » |
| `dependencies` | **aucune** |
| Présence de la v7 | **`dist/v7.js`** (2 129 o) et **`dist/v7.d.ts`** (444 o) — vérifié sur `https://data.jsdelivr.com/v1/packages/npm/uuid@14.0.1`, 2026-08-07 |

**Pourquoi ce qui est déjà là ne suffit pas.** `crypto.randomUUID()` existe nativement dans les deux moteurs et rend un **UUID v4** — aléatoire, **non ordonnable dans le temps**. Le cadrage §11.5 point 1 et FR-057 exigent un **v7**, dont les 48 bits de tête portent l'horodatage : c'est ce qui rend la file rejouable dans l'ordre et le dédoublonnage serveur inoffensif. Aucune dépendance présente n'en produit.

**Pourquoi une bibliothèque plutôt que quinze lignes.** RFC 9562 impose plus que « du temps puis de l'aléa » : les bits de version et de variante à leur place, et la **monotonicité à l'intérieur d'une même milliseconde** — deux écritures produites dans le même tick doivent rester ordonnées. C'est précisément ce qu'une implémentation maison rate, et le défaut ne se voit qu'au rejeu, en phase 3, sur un séjour dont les lignes se réordonnent.

### 1.4 `idb` — RETENU

| Interrogé | `https://registry.npmjs.org/idb/latest` — 2026-08-07 |
|---|---|
| `version` | **8.0.3** |
| `description` | « A small wrapper that makes IndexedDB usable » |
| `dependencies` | **aucune** |
| Taille décompressée | 82 779 octets *(source, types et build CJS+ESM compris ; la part expédiée est une fraction)* |

**Pourquoi ce qui est déjà là ne suffit pas.** La file hors-ligne doit être **persistante** (FR-058) et survivre au rechargement comme à la relance. Les deux candidats natifs :

- **`localStorage`** est **synchrone** et bloque le fil principal à chaque lecture et à chaque écriture. La persona Aminata travaille sur un **Android d'entrée de gamme à 2 Go**, et le budget est de **60 images/s** (FR-096). Une file de cinquante écritures relue au démarrage bloquerait le premier rendu — exactement l'inverse de FR-009.
- **IndexedDB brut** est asynchrone mais son API est fondée sur des événements ; l'envelopper en promesses est le genre de code qu'on écrit une fois et qu'on relit mal.

`idb` est cette enveloppe, sans dépendance. **Et le choix porte au-delà de ce cycle** : PWA-05 range la clé d'appareil non extractible en IndexedDB — c'est le même magasin, choisi une fois.

### 1.5 `knip` — RETENU, pour la porte P-06

| Interrogé | `https://registry.npmjs.org/knip/latest` — 2026-08-07 |
|---|---|
| `version` | **6.32.0** |
| `description` | « Find and fix unused dependencies, exports and files in your TypeScript and JavaScript projects » |
| `engines.node` | `^20.19.0 \|\| >=22.12.0` — **satisfait par Node 24.18.1** (§3.3) |
| `peerDependencies` | **aucune** |

**Pourquoi ce qui est déjà là ne suffit pas.** Aucune dépendance du dépôt ne sait répondre à la question de FR-076 et FR-077 : *ce symbole exporté a-t-il un appelant ?* ESLint juge un fichier à la fois ; TypeScript compile sans se prononcer ; Vitest exécute ce qu'on lui donne. `knip` construit le graphe du projet entier et rend les exports **sans référence**.

**Le risque, et ce qui le neutralise.** L'auto-import de Nuxt supprime les instructions `import` : un composant employé dans un gabarit n'est référencé nulle part explicitement, et une analyse statique naïve le déclarerait mort. **Un faux positif systématique ferait désactiver la porte en trois semaines.** La parade est structurelle, et elle sert aussi la spécification : **le guide de style importe les seize composants explicitement**, un par un. Les références deviennent réelles, l'analyse cesse de reposer sur une heuristique, et c'est le guide de style qui « branche » les composants — ce qui est exactement son rôle déclaré (« la page que j'ouvre pour voir si le design system tient »).

**Alternatives écartées** : `ts-prune` (abandonné, ne lit pas les SFC), `depcheck` (dépendances seulement, pas les exports), `unimported` (fichiers seulement). Et une analyse maison par l'API TypeScript : elle ne voit **pas** les références venues d'un gabarit `.vue`, donc elle produirait un faux « dû » sur tout composant employé — le pire mode de défaillance pour cette porte.

### 1.6 `@vitest/coverage-v8` — RETENU, pour la seconde propriété de P-06

| Interrogé | `https://registry.npmjs.org/@vitest/coverage-v8/latest` — 2026-08-07 |
|---|---|
| `version` | **4.1.10** |
| `peerDependencies` | `vitest: 4.1.10` · `@vitest/browser: 4.1.10` |

Le pair sur `vitest` est **exact et satisfait** : `vitest 4.1.10` est déjà au §3.2.

**Pourquoi ce qui est déjà là ne suffit pas.** FR-079 exige que tout point d'entrée déclaré « branché » soit **exercé par au moins un test**. `vitest` seul exécute les tests sans dire ce qu'ils ont touché. Le rapport `json` du fournisseur v8 porte la couverture **par fonction**, ce qui permet de vérifier le point d'entrée lui-même plutôt que le fichier qui le contient — la différence entre « ce fichier est testé » et « cette méthode est appelée par un test ».

> ⚠️ **Une constatation à faire à l'installation, pas à supposer.** `@vitest/browser` figure aux `peerDependencies` et le document du registre ne dit pas s'il est marqué optionnel. S'il est exigé alors qu'aucune exécution en navigateur n'est demandée à Vitest — c'est Playwright qui tient ce rôle —, la tâche d'installation le constate et tranche : soit `peerDependenciesMeta` le déclare optionnel et il n'y a rien à faire, soit il faut l'ajouter, **avec sa version vérifiée**. Une version supposée serait une version inconnue (§1, règle 2).

### 1.7 `@intlify/eslint-plugin-vue-i18n` — RETENU, pour FR-029

| Interrogé | `https://registry.npmjs.org/@intlify/eslint-plugin-vue-i18n/latest` — 2026-08-07 |
|---|---|
| `version` | **4.5.1** |
| `peerDependencies.eslint` | `^8.0.0 \|\| ^9.0.0-0 \|\| **^10.0.0**` — **satisfait par eslint 10.8.0** (§3.2) |
| Autres pairs | `vue-eslint-parser ^10.0.0` · `yaml-eslint-parser` · `jsonc-eslint-parser` |

**Pourquoi ce qui est déjà là ne suffit pas.** `eslint-plugin-vue 10.10.0` n'a **aucune règle de texte brut**. FR-029 demande un contrôle qui échoue **en nommant le fichier et la ligne** sur toute chaîne visible écrite en dur ; c'est la règle `@intlify/vue-i18n/no-raw-text`, et rien d'autre dans le dépôt ne sait la rendre.

> **Les trois pairs de parseurs sont à résoudre à l'installation, pas ici.** `vue-eslint-parser` arrive avec `eslint-plugin-vue`. `yaml-eslint-parser` et `jsonc-eslint-parser` ne servent qu'aux règles portant sur les **fichiers de catalogue** ; les catalogues de ce cycle sont en TypeScript. Si le gestionnaire de paquets les signale non satisfaits, la tâche les ajoute **avec leur version vérifiée sur le registre** — c'est le même régime que celui appliqué ici à `@vite-pwa/nuxt`, et surtout pas un numéro écrit de mémoire.

---

## 2. Familles exclusives — six lignes, dont une que ce cycle DEVAIT trancher

Le §3.4 est explicite : *« Une famille absente de ce tableau n'est pas une famille libre : c'est une famille non encore rencontrée. Le cycle qui l'ouvre choisit pour tout le dépôt et inscrit sa ligne. »*

### 2.1 Données simulées du front — la ligne que le document nous adressait

Le §3.4 porte déjà l'entrée, en attente de son cycle :

> **Données simulées du front** *(phase 2)* — **à trancher au premier cycle d'écran** — Une seule mécanique de mocks pour toute l'application — pas un module qui invente des objets littéraux et un autre qui charge un JSON.

**Décision : aucune bibliothèque.** La couche de simulation **implémente les interfaces de domaine**, en mémoire, sans passer par le réseau. La couture est l'**interface de domaine**, pas la requête HTTP.

**Motif — trois raisons, et la première est un conflit technique dur :**

1. **MSW occuperait le seul emplacement de service worker, que la PWA détient déjà.** Mock Service Worker intercepte au niveau du *service worker* du navigateur. Ce cycle en installe un — celui de la coquille, qui rend l'ouverture hors ligne possible (FR-014). Deux service workers pour une même portée, c'est un conflit d'enregistrement, pas un inconvénient de style. **Et le service worker de la coquille ne doit rien porter de métier** (FR-016) : y loger la simulation le violerait de face.
2. **La règle de branchement de la constitution suppose cette couture-là.** *« Aucune donnée simulée ne survit à la mise en service de l'endpoint qui la remplace […] endpoint par endpoint. »* Un remplacement endpoint par endpoint se fait **derrière une interface de domaine** : on change l'implémentation liée, les composants ne voient rien. Derrière une interception réseau, il faudrait retirer des gestionnaires un à un dans un fichier partagé — la simulation et le vrai code cohabiteraient dans le même endroit.
3. **Le client de phase 3 implémentera ces interfaces, pas une API HTTP nue.** Le §3.2 retient `openapi-typescript` (types) + `openapi-fetch` (client). L'adaptateur de phase 3 est donc une classe qui implémente `DonneesHebergement` en appelant `openapi-fetch`. La simulation d'aujourd'hui et le client de demain sont **deux implémentations de la même interface**, ce qui est la définition d'un branchement mécanique.

**Alternatives écartées** : **MSW** (motif 1, dirimant) · **MirageJS** (serveur simulé en mémoire avec son propre ORM — un second modèle de données à tenir en regard de `docs/modele-donnees/`, donc deux vérités) · **json-server** (un **service distant**, ce que le livrable 0 interdit).

### 2.2 Les cinq autres familles que ce cycle ouvre

| Famille | Retenu | Écartés — ne pas introduire | Motif en une phrase |
|---|---|---|---|
| **Outillage de coquille PWA** | **`vite-plugin-pwa`** | `@vite-pwa/nuxt` — conflit `@nuxt/kit ^3.9.0` constaté le 2026-08-07 ; tout service worker écrit à la main | §1.1 et §1.2 ci-dessus |
| **Stockage local persistant du front** | **`idb`** | `dexie`, `localforage`, et `localStorage` **brut** pour toute donnée de file | `localStorage` est synchrone et bloque le premier rendu sur un Android 2 Go |
| **Identifiants générés côté client** | **`uuid`** (fonction `v7`) | `nanoid`, `ulid`, `cuid`, et toute implémentation maison | RFC 9562 exige la monotonicité intra-milliseconde, qu'une implémentation maison rate en silence |
| **État partagé du front** | **`useState` de Nuxt + composables** *(intégré, aucune dépendance)* | **Pinia**, Vuex, et tout magasin tiers | Voir l'encadré ci-dessous |
| **Analyse des exports sans appelant** | **`knip`** | `ts-prune`, `depcheck`, `unimported` | Seul à lire les SFC Vue ; les autres produiraient un faux « dû » sur chaque composant |

> #### Pourquoi PAS Pinia — le seul arbitrage de cette liste qui aurait pu aller dans l'autre sens
>
> Pinia est le magasin de référence de l'écosystème et il aurait été le choix réflexe. Il est écarté par **la règle 4 du §1 elle-même** : le commentaire d'un ajout doit dire *pourquoi les dépendances déjà présentes ne suffisent pas*. Or **`useState` de Nuxt suffit** — c'est un état réactif partagé, fourni par le cadriciel, sans installation. Les quatre états de ce cycle — session, thème, scénarios, file — sont chacun **un composable qui possède son `useState` et sa persistance `idb`**.
>
> Ce qu'on renonce à avoir : les outils de développement de Pinia et sa convention d'actions. Ce qu'on évite : une dépendance de plus dans le paquet servi à un Android d'entrée de gamme, et une convention que **six cycles** devraient suivre sans l'avoir choisie.
>
> **Et la marche arrière est mécanique** : un composable qui expose un état et des fonctions se transpose en magasin Pinia sans toucher un seul appelant. C'est l'inverse qui serait coûteux.

---

## 3. Les trois questions que la clarification a renvoyées à la planification

Elles sont listées à [checklists/requirements.md](./checklists/requirements.md). Chacune reçoit ici sa réponse.

### 3.1 Comment le contrôle constate qu'un point d'entrée a un appelant (FR-076, FR-077)

**Mécanisme.** `knip` produit un rapport JSON des **exports sans référence**. Le contrôle confronte cet ensemble à `docs/points-entree.md`, **dans les deux sens** :

| Constat | Attendu | Verdict si l'inverse |
|---|---|---|
| Symbole déclaré **« dû »** | présent dans l'ensemble « sans référence » de knip | **ROUGE** — il a acquis un appelant, l'état doit passer à « branché » |
| Symbole déclaré **« branché »** | absent de cet ensemble | **ROUGE** — il a perdu son dernier appelant |
| Export absent du registre | — | **ROUGE** — une unité hors registre échappe aux deux sens (FR-078) |

**Ce qui rend le mécanisme fiable — et ce n'est pas knip, c'est une décision de conception.** Le guide de style **importe les seize composants explicitement**, un par un, plutôt que de s'en remettre à l'auto-import de Nuxt. Les références deviennent réelles et l'analyse cesse de dépendre d'une heuristique de résolution. C'est aussi ce qui donne son sens produit à la page : **c'est le guide de style qui branche le design system**, et un composant qu'il ne montre pas est, à juste titre, « dû ».

**La seconde propriété — « testé » — a son mécanisme propre**, et il est distinct : `@vitest/coverage-v8` rend la couverture **par fonction** ; tout point d'entrée déclaré « branché » dont la fonction porte **zéro passage** fait échouer. *Une unité écrite n'est ni testée ni branchée par défaut, et les deux contrôles ne se remplacent pas : un point d'entrée peut avoir un appelant qu'aucun test n'exécute.*

### 3.2 Comment P-04 tient sa cible non vide sur trois écrans construits (FR-069, FR-071)

Le problème est réel : l'index déclare **46 écrans du produit**, dont **43 « pas commencé »**, plus les instruments. Un plancher constant serait ridicule aujourd'hui et faux dans six cycles.

**Décision : le plancher de P-04 n'est pas une constante, il est DÉRIVÉ du routeur.**

1. La porte lit l'inventaire des routes **depuis l'application construite** — le manifeste de routes que produit le build —, jamais depuis une liste écrite à la main. *Une liste à la main peut être vidée par accident et la porte inspecterait zéro route en restant verte.*
2. Elle exige que cet inventaire soit **non vide**, et que chaque route en soit **déclarée à l'index** (premier sens, FR-070a).
3. Elle exige que chaque entrée d'index **marquée construite** soit atteinte (second sens, FR-070b) — les entrées « pas commencé » ne sont pas exigibles.
4. Elle **déclare son périmètre inspecté** en clair : *n* routes × 2 thèmes × 2 moteurs = *4n* passages, et le nombre imprimé.

**C'est un meilleur plancher que ceux de P-01, P-02 et P-05**, et il vaut d'être dit : les trois autres portent une constante qu'un cycle doit penser à relever — le cycle D2 a dû relever les trois. Celui-ci **croît tout seul** avec l'application, parce que sa source est le routeur et non un nombre. Le seul cas qu'il ne couvre pas est celui d'un routeur vide, et c'est exactement ce que l'exigence de non-vacuité attrape.

### 3.3 Comment le prérequis de conteneur devient local à ses portes (FR-085, SC-021)

**Le défaut, tel qu'il est aujourd'hui.** `scripts/verifier.sh` appelle `exiger_prerequis` dans `main()`, **avant toute exécution**. Sur un poste sans démon de conteneurs — celui d'Abengourou —, le script sort en code 3 et **rien** ne s'exécute : ni le lint, ni le build, ni P-03, ni P-04, dont aucun n'a besoin de conteneur.

**Décision : le prérequis descend dans `preparer_base()`, et le saut est DÉCLARÉ, jamais toléré.**

| Invocation | Démon présent | Comportement |
|---|---|---|
| `scripts/verifier.sh` | oui | tout s'exécute — **inchangé** |
| `scripts/verifier.sh` | **non** | **code 3**, comme aujourd'hui. *Un poste de développement sans conteneur est une anomalie, pas un mode* |
| `scripts/verifier.sh --sans-conteneur` | indifférent | lint, build, **P-03**, **P-04**, **P-06** s'exécutent ; **P-01, P-02 et P-05 sont SAUTÉES et NOMMÉES** ; le verdict final dit lesquelles ; **code 0** |

**Pourquoi un drapeau plutôt qu'une détection automatique.** Une détection silencieuse rendrait vert un sous-ensemble que personne n'a demandé, et la phrase « TOUT VERT » cesserait de vouloir dire quelque chose — c'est précisément ce que SC-021 refuse. Le drapeau fait du saut une **intention déclarée** : on sait ce qu'on n'a pas vérifié parce qu'on l'a écrit sur la ligne de commande. Le verdict imprime alors **« VERT SOUS RÉSERVE — P-01, P-02, P-05 sautées (prérequis déclaré absent) »**, jamais « TOUT VERT ».

---

## 4. Deux pièges techniques identifiés, et leur parade

### 4.1 L'utilitaire qui venait du CDN — comment on le voit plutôt que de le supposer

La maquette charge Tailwind par CDN, qui génère les utilitaires à la volée ; le build ne compile que ce qu'il trouve dans les sources. **Un utilitaire manquant ne lève aucune erreur — il ne s'affiche pas.**

**Ce que `theme.css` protège déjà, et qu'il ne faut pas défaire** : le fichier déclare `@theme static { … }`, et son commentaire dit pourquoi — *« sans lui, Tailwind 4 élague toute variable de `@theme` qu'aucun utilitaire n'emploie dans le fichier compilé »*. Le fichier étant **copié tel quel** (FR-005), cette protection arrive intacte.

**Ce qui reste à vérifier, et qui ne se vérifie pas à l'œil** : la parade est un test qui compare des **valeurs calculées**, pas des captures d'écran. Le guide de style porte, pour chaque composant, un jeu de propriétés attendues tirées de `tokens.md` — couleur de fond, hauteur, rayon, corps — et le test lit le style calculé dans le navigateur réel. Un utilitaire absent rend une valeur par défaut du navigateur, qui ne coïncide avec aucun jeton : **l'écart est signalé au lieu d'être silencieux** (FR-020, SC-005).

### 4.2 Le trait bas d'un nom de fichier de page — une sémantique que je n'affirme pas

Les trois instruments vivent à `/_guide-de-style`, `/_ecrans` et `/_scenarios` (FR-088). La question — *un fichier de page nommé `_guide-de-style.vue` produit-il la route `/_guide-de-style`, ou le scanner l'ignore-t-il ?* — dépend d'une convention de découverte que **je n'ai pas vérifiée contre la version installée**, et une supposition ici produirait trois écrans introuvables.

**Parade, qui supprime la question au lieu d'y répondre** : le nom de fichier **ne porte pas le trait bas**, et la route est déclarée explicitement par `definePageMeta({ path: '/_guide-de-style' })`. La route est alors indépendante de toute sémantique de scanner — et **P-04 la vérifie de toute façon**, puisqu'elle atteint chaque entrée de l'index dans un navigateur réel.

*La règle du lexique — « le nom du fichier de page décide de la route, et une URL est visible » — reste respectée dans son intention : ce qui est proscrit est qu'un mot arrive dans une URL sans que personne l'ait décidé. Ici, la route est écrite.*

---

## 5. Ce que la phase 0 laisse ouvert, et à quel moment ça se ferme

| Point ouvert | Qui le ferme | Pourquoi il n'est pas fermé ici |
|---|---|---|
| `@vitest/browser` est-il un pair **exigé** de `@vitest/coverage-v8` ? | la tâche d'installation, sur constat du gestionnaire de paquets | Le document du registre ne porte pas `peerDependenciesMeta` ; répondre de mémoire violerait la règle 2 |
| `yaml-eslint-parser` et `jsonc-eslint-parser` sont-ils exigés ? | idem | Même motif. Les catalogues sont en TypeScript, donc ils sont probablement inutiles — **probablement** n'est pas une version vérifiée |
| L'identifiant exact de la règle qui refuse une racine `v-if`/`v-else` (FR-036) | la tâche qui configure le lint, contre le greffon installé | Citer un identifiant de règle de mémoire produirait une configuration qui ne charge pas |
| Le seuil de latence rendra-t-il « connexion faible » testable en navigateur ? | la tâche P-04, en réglant le levier de latence au-delà de 3 000 ms | C'est une vérification, pas une décision |
