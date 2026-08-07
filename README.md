# Kaya

*Logiciel de gestion pour les établissements d'Afrique de l'Ouest — hébergement, restauration,
bar, pressing. Multi-tenant, hors-ligne d'abord, conforme à la facturation normalisée ivoirienne.*

**Phase 1 — le modèle de données : CLOSE.** 118 tables · 15 fichiers · 14 schémas · 20 provisions.
**Phase 2 — l'application en données simulées : EN COURS**, cycle F1 (la coquille).

---

## Démarrer — une commande

```sh
pnpm install --frozen-lockfile
pnpm dev
```

**L'application répond sur `http://localhost:3000`. Aucun conteneur n'a été démarré, aucune base,
aucun service distant.** C'est la propriété du cycle, et elle se vérifie en l'éprouvant : arrêtez
votre démon de conteneurs avant de commencer.

**Prérequis** : Node **24.18.1** (`.nvmrc`) et pnpm **11.18.0** — le champ `packageManager` du
manifeste l'installe tout seul.

### Les trois écrans à ouvrir

| Écran | Route | Ce qu'on y voit |
|---|---|---|
| **Écrans** | [`/_ecrans`](http://localhost:3000/_ecrans) | **L'index** : les 46 écrans du produit avec leur état d'avancement, et les 3 instruments. `/` y redirige |
| **Guide de style** | [`/_guide-de-style`](http://localhost:3000/_guide-de-style) | **Les seize composants**, chacun dans tous ses états, avec la bascule de thème et celle de zone de mouvement |
| **Scénarios** | [`/_scenarios`](http://localhost:3000/_scenarios) | **Les leviers** : latence, échec réseau, hors connexion, jeu vide, compte et établissement actifs — plus l'essai d'écriture, qui exerce le refus |

> **Le trait bas marque les INSTRUMENTS.** Les 46 écrans du produit n'en portent pas — `/passage`,
> `/arrivee`, `/articles`. Un exploitant qui verrait `/_ecrans` dans sa barre d'adresse saurait
> qu'il n'est pas au bon endroit.

### Le parcours de démonstration, en quatre gestes

1. **`/_ecrans`** → basculer entre « Le produit » et « Les instruments », suivre un lien.
2. **`/_guide-de-style`** → basculer **Clair / Sombre / Comme l'appareil**, puis **Français /
   English**. Tout suit, y compris les seize composants.
3. **`/_scenarios`** → **Lancer l'essai** sur « Note interne » : accepté, et le témoin de la barre
   passe à « **En attente d'envoi (1)** ».
4. Passer **Hors connexion** sur **Actif**, choisir « **Réglage d'établissement** », relancer :
   refusé, avec « **Cette action nécessite internet.** » **et ce qui reste possible**. Recharger :
   la file est intacte.

---

## La commande unique

```sh
scripts/verifier.sh
```

**Une seule commande, qui enchaîne tout ce qui doit passer et sort en échec au premier contrôle
rouge.** Pas dix scripts qu'on lance de mémoire, dont on oublie le troisième.

**Prérequis : `docker` et le greffon `compose`** pour P-01, P-02 et P-05 ; **rien** pour P-03.

Elle enchaîne, dans cet ordre :

```
lint → types → construction → tests d'unité → P-01 → P-02 → P-05 → P-03
```

### Les préalables — avant les portes, parce qu'ils sont les moins chers

```sh
scripts/verifier.sh --prealables   # les quatre, et rien d'autre
```

| Préalable | Ce qu'il lance | Ce qu'il refuse |
|---|---|---|
| **lint** | `eslint .` | les quatre règles opposables, et **aucune chaîne visible en dur** |
| **types** | `nuxt typecheck` | un type faux que la construction ne regarde pas |
| **construction** | `nuxt build`, **avec `KAYA_PAGE_TEMOIN=1`** | une application qui ne se construit pas |
| **tests d'unité** | `vitest run` | 128 cas |

> ⚠️ **Le drapeau `KAYA_PAGE_TEMOIN=1` n'est pas un réglage de confort.** Sans lui, les deux pages
> témoin n'entrent pas au routeur et la suite `cycle-de-vie` **échoue** — elle échoue, elle ne se
> saute pas. *Un test silencieusement absent est un test qu'on croit vert.*

**Les quatre suites de navigateur ne sont pas ici** : elles s'exécutent **dans la porte P-04**, qui
monte déjà l'application et pilote les deux moteurs. *Ce qui compte est dedans, ou n'existe pas.*

### Ce que chaque porte vérifie

| Porte | Ce qu'elle prouve | Conteneur ? |
|---|---|---|
| **P-01** | Le modèle de [`docs/modele-donnees/`](docs/modele-donnees/) s'applique **dans l'ordre, sans erreur, sur une base vierge** — et chaque table porte `tenant_id` non nul, `ENABLE` **et** `FORCE ROW LEVEL SECURITY`, la politique `isolation_tenant` en `USING` **et** `WITH CHECK`, et la politique `administration_editeur` | oui |
| **P-02** | Toute table du modèle a une **classe hors-ligne déclarée** dans [`docs/registre-classes-offline.md`](docs/registre-classes-offline.md). Sens : **table → registre** | oui |
| **P-03** | **Aucune dépendance en intervalle**, lockfile commité et couvrant, tags d'image exacts, environnement cohérent en trois écritures, et `docs/versions-reference.md` d'accord avec les manifestes **dans les deux sens**. Plus : **aucun `.github/workflows/`** — le serveur d'intégration vient en phase 3 | **non** |
| **P-04** | **L'application démarre**, et chaque écran marqué **construit** à [`app/core/ecrans/index.ts`](app/core/ecrans/index.ts) s'atteint — sur **Chromium et WebKit**, en **clair et en sombre**. **Deux sens** : toute route servie est déclarée à l'index ; toute entrée construite est servie. Une entrée « pas commencé » **n'est pas exigible**. C'est ici que **les quatre suites de navigateur** s'exécutent | **non** |
| **P-05** | **Aucune clé étrangère entre deux schémas** — les rattachements inter-modules sont des colonnes nues, et le cas orphelin est le **chemin nominal** d'une saga | oui |

Chaque porte déclare son **périmètre inspecté**, vérifie sa **complétude**, ne **modifie pas** ce
qu'elle inspecte, et prouve que sa **cible n'est pas vide** par un plancher déclaré.

> **Les planchers de P-03 et P-04 sont DÉRIVÉS, pas constants.** Celui de P-03 est le nombre de
> dépendances que les manifestes déclarent ; celui de P-04 vient **du routeur** — l'inventaire des
> routes est écrit par la construction, jamais tenu à la main. Un `package.json` vidé ou un routeur
> vide fait tomber le plancher **en même temps** que la cible, et la porte rougit.
>
> C'est un meilleur plancher que ceux de P-01, P-02 et P-05, qui portent une **constante** qu'un
> cycle doit penser à relever — le cycle D2 a dû relever les trois. Celui de P-04 **croît tout seul**
> avec l'application.

### Une porte seule

```sh
scripts/verifier.sh --porte p01
scripts/verifier.sh --porte p02
scripts/verifier.sh --porte p03   # ni conteneur ni réseau
scripts/verifier.sh --porte p04   # ni conteneur ni réseau — construit et sert l'application
scripts/verifier.sh --porte p05
```

### Les tests négatifs — la preuve qu'une porte SAIT échouer

```sh
scripts/verifier.sh --test-negatif p01   # retire une politique RLS
scripts/verifier.sh --test-negatif p02   # ajoute une table non déclarée au registre
scripts/verifier.sh --test-negatif p03   # introduit un « ^ » dans une version
scripts/verifier.sh --test-negatif p05   # ajoute une clé étrangère inter-schémas
scripts/verifier.sh --test-negatif       # les quatre
```

> **`--test-negatif` n'est pas un mode de débogage, c'est une preuve.** *Une porte qui ne trouve
> jamais rien est indistinguable d'une porte qui n'a rien à trouver.* Le mode opère sur une **copie
> de travail**, et l'empreinte de ce qui est inspecté est relevée **avant et après**.

Chaque test négatif se déroule **en deux temps au moins** : les portes qui ne sont pas visées
doivent rester **vertes**. Sans cette précaution, on croirait avoir prouvé P-02 alors qu'on aurait
prouvé P-01 une seconde fois.

### Codes de sortie

| Code | Signification |
|---|---|
| `0` | Toutes les portes demandées passent |
| `1` | Une porte a échoué — la sortie nomme la porte, la cause et **l'objet fautif** |
| `2` | Erreur d'usage |
| `3` | Prérequis manquant — `docker compose` indisponible |
| `4` | **Un test négatif n'a pas échoué — la porte est aveugle** |

> Le code `4` mérite d'être distinct du `1` : une porte rouge signale un défaut du **produit** ;
> une porte qui refuse d'être rouge signale un défaut **de la porte**.

---

## Les contrôles, un par un

**Ils sont tous appelés par la commande unique** — ces formes-ci servent à travailler, jamais à
valider. *Valider, c'est `scripts/verifier.sh`.*

```sh
pnpm lint                # les quatre règles opposables + aucune chaîne visible en dur
pnpm typecheck           # nuxt typecheck (vue-tsc)
pnpm build               # la construction, avec la coquille PWA
pnpm test                # les tests d'unité
pnpm test:navigateur     # Chromium ET WebKit, clair ET sombre — dans P-04
```

### Les quatre règles opposables du lint

| Règle | Ce qu'elle refuse |
|---|---|
| **(a)** | Toute API de plateforme hors de `app/core/plateforme/` et `app/core/file/` — c'est elle, et elle seule, qui rendra le passage à Capacitor mécanique |
| **(b)** | Tout import d'une simulation ou d'un jeu de données par un composant — il ne connaît jamais la provenance |
| **(c)** | Toute valeur littérale de couleur, espacement, rayon, durée ou courbe hors des jetons |
| **(d)** | Une page à plusieurs racines, ou dont la racine est un `v-if`/`v-else` — elle se démonterait, et le témoin clignoterait à chaque navigation |

> ⚠️ **(d) est écrite à la main, et le constat vaut d'être dit.** `vue/no-root-v-if` ne signale que
> le `v-if` de racine **sans** `v-else` ; `vue/no-multiple-template-root` compte une chaîne
> `v-if`/`v-else` comme **une** racine. Le cas exact les traverse toutes les deux sans un mot. Les
> deux règles amont restent activées pour les cas voisins, et un test **exige** qu'elles laissent
> passer celui-ci — le jour où une montée le couvrirait, ce test le dirait.

### Les artefacts engendrés et commités

```sh
node scripts/polices/sous-regler-icones.mjs --verifier    # les glyphes d'icônes
node scripts/icones/engendrer-icones.mjs --verifier       # les icônes du manifeste
node scripts/classes/extraire-registre.mjs --verifier     # les classes hors-ligne
```

Chacun compare **à l'octet** et échoue si le commité diffère de ce que la source engendre.

---

## Où lire quoi

| Ce que vous cherchez | Où |
|---|---|
| Le modèle de données, table par table | [`docs/modele-donnees/README.md`](docs/modele-donnees/README.md) |
| La classe hors-ligne d'une entité — **fait foi** | [`docs/registre-classes-offline.md`](docs/registre-classes-offline.md) |
| Les principes non négociables | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Les jetons, les seize composants, le lexique, le mouvement | [`docs/design/`](docs/design/) |
| De quel motif hérite chaque écran | [`docs/design/derivation.md`](docs/design/derivation.md) |
| Les versions épinglées et leur journal | [`docs/versions-reference.md`](docs/versions-reference.md) |
| La conception du cycle **F1** — la coquille | [`specs/003-coquille-application/`](specs/003-coquille-application/) |
| **Ce que les portes ne prouvent pas**, constaté à la main | les `rapport-de-cycle.md` de chaque cycle |
