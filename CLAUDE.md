# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Tout ce dépôt est en français** — code, commentaires, noms de fichiers, noms de tables, messages de
commit. Un identifiant anglais dans du code nouveau est une anomalie, pas une préférence.

---

## La commande unique

```sh
scripts/verifier.sh                    # les préalables PUIS les portes, arrêt au premier rouge
scripts/verifier.sh --sans-conteneur   # saute et NOMME P-01/P-02/P-05 — « VERT SOUS RÉSERVE »
scripts/verifier.sh --prealables       # lint, types, construction, tests d'unité — et rien d'autre
scripts/verifier.sh --porte p01        # une porte seule (p01, p02, p03, p04, p05, p06)
scripts/verifier.sh --test-negatif     # casse chaque porte et EXIGE qu'elle rougisse
scripts/verifier.sh --test-negatif p05 # un seul test négatif
scripts/verifier.sh --aide
```

L'enchaînement complet : `lint → types → construction → tests d'unité → P-01 → P-02 → P-05 → P-03
→ P-04 → P-06`. Les tests d'unité s'exécutent **avec la couverture** — P-06 la lit.
La construction se fait **avec `KAYA_PAGE_TEMOIN=1`** — sans le drapeau, les deux pages témoin
n'entrent pas au routeur et la suite `cycle-de-vie` **échoue** (elle échoue, elle ne se saute pas).

**Chaque tâche se termine par `scripts/verifier.sh`.** Ne jamais rapporter une tâche comme terminée
si le script est rouge, et **ne jamais lancer un contrôle à la main en plus du script** : ce qui
compte est dedans, ou n'existe pas. Prérequis : `docker` + greffon `compose` uniquement (le client
`psql` vient de l'image `postgres:18.4`).

Codes de sortie : `0` vert · `1` porte rouge (défaut du **modèle**) · `2` usage · `3` prérequis
manquant · **`4` un test négatif n'a pas échoué — défaut de la **porte**, pas du modèle.**

### Les portes

| Porte | Ce qu'elle prouve | État |
|---|---|---|
| **P-01** | le modèle SQL s'applique dans l'ordre sur une base **vierge**, et chaque table porte `ENABLE` + `FORCE ROW LEVEL SECURITY`, `isolation_tenant` (`USING` **et** `WITH CHECK`) et `administration_editeur` | existante |
| **P-02** | toute table du modèle a une classe hors-ligne au registre. Sens : **table → registre**. Une entité déclarée sans table est normale, une table non déclarée est l'erreur | existante |
| **P-05** | **aucune clé étrangère entre deux schémas** — deux rattachements sont des sagas dont le cas orphelin est le chemin **nominal** | existante |
| **P-03** | **aucune dépendance en intervalle**, lockfile couvrant, tags d'image exacts, et `docs/versions-reference.md` d'accord avec les manifestes **dans les deux sens**. Ni conteneur ni réseau | existante |
| **P-04** | **l'application démarre**, et chaque écran marqué `CONSTRUIT` à `app/core/ecrans/index.ts` s'atteint — Chromium **et** WebKit, clair **et** sombre. **Deux sens**, borné à `CONSTRUIT`. Inventaire des routes lu **depuis le build**. Les quatre suites de navigateur s'exécutent ici | existante |
| **P-06** | tout point d'entrée est **« branché » ou « dû »**, et tout branché est exercé. `docs/points-entree.md` déclare l'intention, `knip` dit le fait, et les deux se confrontent **dans les deux sens**. Ni conteneur ni réseau | existante |

Toute porte ajoutée respecte cinq règles : elle déclare son périmètre, vérifie sa complétude, **ne
modifie rien** de ce qu'elle inspecte, **prouve que sa cible n'est pas vide** (plancher déclaré), et
a **son test négatif** — une porte sans test négatif est une décoration.

## Commandes Node

Node **24.18.1** (`.nvmrc`), pnpm **11.18.0**. `pnpm install` puis :

```sh
pnpm dev              # Nuxt en SPA
pnpm build            # sortie statique
pnpm lint             # eslint .
pnpm typecheck        # nuxt typecheck
pnpm test             # vitest run
pnpm test -- chemin/du/fichier.spec.ts   # un seul fichier
pnpm test:couverture  # vitest + coverage v8 (propriété « exercé » de P-06)
pnpm test:navigateur  # playwright (P-04)
pnpm knip             # exports sans appelant (propriété « branché » de P-06)
```

⚠️ **Ces formes-ci servent à travailler, jamais à valider.** Valider, c'est `scripts/verifier.sh`,
qui les appelle toutes — `lint`, `typecheck`, `build` et `test` comme préalables,
`test:navigateur` dans la porte P-04. Un contrôle lancé à la main **en plus** du script est un
contrôle qu'on oubliera.

---

## Où en est le produit

**Trois phases, jamais sautées** (constitution, principe 0) :

| Phase | Livrable | État |
|---|---|---|
| **1** | tout le MVP en SQL dans `docs/modele-donnees/`, un fichier par schéma | **CLOSE** — 118 tables · 15 fichiers · 14 schémas · 20 provisions |
| **2** | l'application entière **en données simulées** — tous les écrans, aucun backend | **en cours**, cycle **F1** (fondations) sur 7 |
| **3** | le backend Rust/Actix, qui remplace les simulations **endpoint par endpoint** | à venir |

La spécification active est nommée par `.specify/feature.json`. Un cycle de phase 3 **peut** revenir
corriger un écran de phase 2 : c'est le cas normal.

## Documents opposables — à lire avant de supposer

Ordre de préséance en conflit : **constitution → `docs/cadrage-v1.md` → `docs/user-stories-v1.md` →
le reste**. Un conflit constaté n'est jamais tranché en silence : le document perdant est corrigé
**dans le même changement**.

| Question | Document qui fait foi |
|---|---|
| Les principes non négociables | [.specify/memory/constitution.md](.specify/memory/constitution.md) |
| Le schéma SQL de référence | [docs/modele-donnees/](docs/modele-donnees/) (index : [README.md](docs/modele-donnees/README.md)) |
| La classe hors-ligne d'une entité | [docs/registre-classes-offline.md](docs/registre-classes-offline.md) |
| Le patron des neuf couches, table → écran | [docs/module-dore.md](docs/module-dore.md) |
| Couleurs, espacements, typographie | [docs/design/tokens.md](docs/design/tokens.md) — **prime sur tout export** |
| Les seize composants canoniques | [docs/design/composants.md](docs/design/composants.md) |
| Le vocabulaire vu par l'utilisateur | [docs/design/lexique.md](docs/design/lexique.md) |
| Les 46 écrans et leur dérivation | [docs/design/derivation.md](docs/design/derivation.md) |
| Les versions épinglées et leur régime | [docs/versions-reference.md](docs/versions-reference.md) |
| Le prompt de chaque cycle, D1 → T5 | [docs/Kaya_Prompts_SpecKit.md](docs/Kaya_Prompts_SpecKit.md) §3 |

Le HTML de `docs/design/html/` est une **cible, jamais une source** : on lit ses valeurs, on
réimplémente. **Seule exception** : `docs/design/theme.css` se copie tel quel dans `app/assets/css/`.

## Architecture

**Une seule application Nuxt 4 en SPA (`ssr: false`) à la racine**, pas de `frontend/` ni d'espaces de
travail. `app/` est le `srcDir`. La structure cible du cycle F1 est décrite dans
[specs/003-coquille-application/plan.md](specs/003-coquille-application/plan.md#L105) — l'essentiel :

- `app/core/donnees/` — **la couture**. Une interface par domaine, une implémentation simulée
  aujourd'hui, le client généré en phase 3. **La couture est l'interface de domaine, jamais la
  requête HTTP** : c'est ce qui rend le branchement de la phase 3 mécanique.
- `app/core/plateforme/PlatformAdapter.ts` — **toute** capacité de plateforme (impression, scan,
  caméra, stockage sécurisé, notifications, réseau) y passe. Aucun composant n'appelle jamais une API
  de plateforme directement ; deux implémentations sont prévues d'emblée (`web`, `capacitor`).
- `app/core/design-system/` — les seize composants, et rien d'autre.
- Le cycle de vie (thème, session, coquille) vit dans `plugins/`, `middleware/` et `layouts/`, jamais
  recopié page par page — voir la « huitième couche » de `docs/module-dore.md`, qui documente le
  défaut réel que ce découpage ferme.

Backend (phase 3, pas encore écrit) : monolithe modulaire Rust, **un schéma PostgreSQL par module**,
trois familles à dépendance stricte — `socle/` → `capacites/` → `verticales/`. Le socle connaît
`article_vendable` et `ressource_reservable`, **jamais « chambre » ni « séjour »**.

---

## Les règles qui font échouer le build si on les ignore

Elles ne se devinent pas et leur violation est silencieuse jusqu'au contrôle.

**Modèle et base**

- **Aucune clé étrangère vers un autre schéma** — même quand la table cible existe. L'intégrité
  inter-modules passe par un trait exposé. Une `REFERENCES` ajoutée « pour corriger un oubli » fait
  échouer en base l'écriture orpheline que le produit doit accepter puis réconcilier (P-05).
- **Aucune migration n'écrit de données sur une table en `FORCE ROW LEVEL SECURITY`** : l'`INSERT`
  réussit **en n'écrivant rien, sans erreur**. Formes qui marchent : `ADD COLUMN … NOT NULL DEFAULT`,
  ou `CREATE TABLE` → `INSERT` → `ENABLE`/`FORCE` → `CREATE POLICY` dans cet ordre.
- Le `true` de `current_setting('app.current_tenant', true)` n'est pas décoratif : sans lui une
  transaction sans contexte lève une erreur (rattrapable par un `catch`) au lieu de ne rien voir.
- Toute nouvelle table est déclarée au registre des classes hors-ligne **dans le même changement**.
- `cree_le` (`DEFAULT now()`) fait autorité pour **tout** ; `horodatage_client` ne porte **aucune**
  règle hors trois exemptions closes (ordre d'affichage local, détection de dérive, rendu de
  l'instant perçu).

**Argent, temps, hors-ligne**

- Montants : **entiers en unités mineures** + code ISO 4217. Quantités : **`NUMERIC`, jamais entier**.
- Occupation : intervalle `[début, fin)` en `timestamptz`, **jamais une paire de dates** ;
  disponibilité garantie par `EXCLUDE USING gist`, jamais par un verrou applicatif.
- Toute écriture porte un **UUID v7 généré côté client** (`uuid.v7()`, pas `crypto.randomUUID()` qui
  rend un v4 non ordonnable). Le serveur déduplique, le rejeu renvoie `200`, **le serveur fait foi**.
- Une opération de classe **B, C ou D atteignable hors ligne fait échouer le build** — y compris en
  phase 2 sur données simulées. Hors ligne, l'action **disparaît et un bandeau dit pourquoi** : ni
  grisé, ni mise en file « au cas où ». La garde vit dans la fonction d'appel, pas dans le composant.

**Interface**

- **Absent, jamais grisé** — module inactif comme action interdite par permission. Le test porte sur
  le **HTML rendu**, pas sur un attribut `disabled`.
- Aucune chaîne visible en dur : clés i18n **fr et en à parité stricte**, fr par défaut.
- Aucune couleur, espacement, rayon, durée ou courbe littéral hors des jetons de `@theme`. Mode
  sombre par la variante `dark:` **uniquement**, jamais une seconde palette.
- **Une page a une seule racine, et c'est un élément** — jamais un `v-if`/`v-else` de premier niveau
  (fragment + composant paresseux + bascule après montage = `TypeError … parentNode`).
- Tailwind 4 d'abord, CSS explicite en dernier recours (`@keyframes`, impression thermique).
- Un écran inventé à l'implémentation est **autorisé** — il s'inscrit à `docs/design/derivation.md`
  dans le même changement. Ce qu'on refuse, c'est de l'inventer en silence.

**Versions**

- **Dernière stable, sauf conflit constaté** (peerDependency non satisfaite, API rompue). Descendre
  **au minimum**, et écrire la contrainte **et sa condition de levée**.
- **Épinglage exact obligatoire**, jamais `^` ni `~`, lockfile commité. Seule règle sans exception.
- **Ne jamais citer un numéro de version de mémoire** : URL du registre + date de vérification.
  `package.json` porte ces justifications dans `versionsJustification` (le JSON n'admet pas de
  commentaire ; l'écart est déclaré, pas tu).
- Ajouter et monter sont **libres en cours de cycle**, à condition que la suite passe et que
  `docs/versions-reference.md` soit mis à jour **dans le même changement**.

**Provisions** — les 20 tables de provision existent **en phase 1 et nulle part ailleurs**. Une
provision qui apparaît dans un écran ou un endpoint est du périmètre entré par la porte de service.

---

## Flux de travail

Le dépôt suit **Spec Kit** (`.specify/`, skills `speckit-*`). Un cycle = un dossier `specs/NNN-nom/`
avec `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `tasks.md`, puis
`rapport-de-cycle.md` en clôture. Les prompts de chaque cycle sont déjà écrits dans
`docs/Kaya_Prompts_SpecKit.md` §3 — les coller tels quels plutôt que les reformuler.

Le cycle est terminé quand la *Definition of Done* de `docs/user-stories-v1.md` §0.4 est satisfaite.
Les points sans objet pour la phase courante se déclarent **« sans objet », jamais cochés en silence**.

**Aucun workflow GitHub Actions.** Le serveur de CI vient en phase 3, et il lancera
`scripts/verifier.sh` **sans le modifier**.

Commits : `type(portée): Txxx description en français` — par exemple
`feat(coquille): T001 le projet Nuxt 4 en SPA, versions exactes et lockfile commité`. La portée est
le domaine du cycle (`modele-donnees`, `verification`, `registre`, `coquille`).

Documents à mettre à jour **dans le même changement que le code**, sans exception : le fichier SQL du
schéma touché · le registre des classes · `docs/versions-reference.md` · la maquette concernée ·
`docs/design/derivation.md` · le test négatif de toute porte ajoutée.
