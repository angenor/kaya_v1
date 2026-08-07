# F2 — Entrée · Le parcours à dérouler

*Ce qu'on fait, dans l'ordre, pour **croire** au cycle. Le script prouve ce qui est mécanique ; ce
document couvre ce qu'aucune porte ne regarde — **un accueil de maquis a-t-il l'air conçu pour un
maquis ?***

---

## 0. Prérequis

```sh
node --version      # 24.18.1  (.nvmrc)
pnpm --version      # 11.18.0
pnpm install        # le lockfile fait foi
```

**Ni Docker ni base** pour ce cycle : P-01, P-02 et P-05 ne sont pas touchées. Le parcours complet
s'exécute sur un poste hors ligne — c'est délibéré, et c'est ce qui le rend faisable à Abengourou.

---

## 1. La commande unique — la seule qui valide

```sh
scripts/verifier.sh
```

`lint → types → construction → tests d'unité → P-01 → P-02 → P-05 → P-03 → P-04 → P-06`.

**Vert attendu.** Codes de sortie : `0` vert · `1` porte rouge (défaut du **modèle**) · `2` usage ·
`3` prérequis manquant · `4` un test négatif n'a pas échoué (défaut de la **porte**).

Sans Docker :

```sh
scripts/verifier.sh --sans-conteneur   # saute et NOMME P-01/P-02/P-05 — « VERT SOUS RÉSERVE »
```

⚠️ **Ne jamais lancer un contrôle à la main *en plus* du script.** Ce qui compte est dedans, ou
n'existe pas. Les formes ci-dessous servent à **travailler**, jamais à valider.

### Les portes que ce cycle touche

```sh
scripts/verifier.sh --porte p03   # libphonenumber-js exact · versions-reference.md dans les deux sens
scripts/verifier.sh --porte p04   # R0 et R1 atteints · Chromium × WebKit × clair × sombre
scripts/verifier.sh --porte p06   # branché ou dû · quatre « dû » de F1 deviennent « branché »
```

**Aucune porte nouvelle**, donc **aucun test négatif à ajouter**. `scripts/verifier.sh` est
**inchangé** — c'est la meilleure preuve que le cycle n'a rien contourné.

---

## 2. Le parcours humain — ce qu'aucune porte ne regarde

```sh
pnpm dev        # http://localhost:3000
```

### 2.1 Entrer — `R0`

| # | Geste | Attendu |
|---|---|---|
| 1 | Ouvrir `/` sans session | On arrive à **`/connexion`**, et l'adresse demandée est retenue |
| 2 | **Lire avant de taper** | Une phrase dit ce que deviendra la session : *« Vous resterez connectée sur cet appareil »* **ou** *« Cet appareil peut vous redemander votre identifiant »* |
| 3 | Saisir `0708091011` + n'importe quel mot de passe | On entre. Le numéro est compris avec **+225**, sans qu'on l'ait tapé |
| 4 | Ressortir, saisir `+22500000000` | « **Identifiant ou mot de passe incorrect** » |
| 5 | Saisir l'identifiant d'Adjoua + un autre mot de passe | **La même phrase, mot pour mot** — et le délai ne se distingue pas |
| 6 | Vider le champ identifiant, soumettre | « **Indiquez un numéro de téléphone ou une adresse e-mail.** » — pas la phrase d'échec |
| 7 | Recharger la page | On revient là où on était — **si et seulement si l'écran l'avait annoncé** |

**Le point 5 est celui qui compte.** Un message différent publierait la liste des comptes.

### 2.2 Les quatre accueils — `R1`

**Depuis `/_scenarios`**, sans recompiler, sans éditer un fichier :

| Compte × site | Ce qu'on doit voir | Ce qu'on ne doit **pas** voir |
|---|---|---|
| **Adjoua** × Deloria | Le départ de la chambre 204 en tête · les cinq activités · les chiffres du jour | — |
| **Aminata** × Deloria | Ses quatre tables · le total de ses tables | **Aucune** action d'encaissement · aucun chiffre d'hôtel |
| **Yao** × Chez Tantie Adjo | La salle de neuf tables · les trois ardoises · la caisse du soir | **Ni « Hébergement », ni « Pressing », ni « Salle de réunion »** — nulle part, sous aucune forme · **pas de rubrique « Vos activités »** |
| **M. Koffi** × tous | Les deux maisons côte à côte · la mention de lecture seule | **Aucune** surface qui modifie une caisse |

> **Le test de vérité.** Regardez l'accueil de Yao et posez la question : *cet écran a-t-il l'air
> conçu pour un maquis, ou d'un hôtel amputé ?* Une rubrique vide, un compteur à zéro, un intitulé
> orphelin — n'importe lequel des trois, et la réponse est non.

### 2.3 L'en-tête — les deux formes

| Compte | Attendu | Pourquoi |
|---|---|---|
| **Yao** × maquis | `Abobo · La salle` | Un seul poste dérivable |
| **Adjoua** × Deloria | `Abengourou` — **rien de plus** | Quatre postes : le système ne sait pas lequel, **et ne l'invente pas** |

**Les deux doivent être vues.** C'est FR-030c, et c'est ce que le manque rend visible.

### 2.4 Deux taps — `ETB-06`

Avec **M. Koffi** : toucher le sélecteur → toucher « Chez Tantie Adjo ».

- **Deux gestes.** Pas trois.
- **Aucune reconnexion.**
- L'accueil s'est **entièrement** refait.
- Recharger : on revient **au maquis**, pas au premier de la liste.

Puis avec **Aminata**, qui n'a qu'un site : le sélecteur **n'est pas un bouton** et n'a pas de
chevron. *Un bouton qui n'ouvre rien apprend à ne plus cliquer.*

### 2.5 Une porte qui ne mène pas encore

Toucher « **Encaisser le départ** » sur l'accueil d'Adjoua.

| Attendu | À refuser |
|---|---|
| La tuile a **l'apparence exacte** des autres | Une atténuation, un badge « bientôt », un `disabled` |
| L'appui dit l'écran et le cycle | Une page blanche, un message d'ingénieur |

**Puis** : passer `R7` à `CONSTRUIT` à `app/core/ecrans/index.ts`, recharger. La mention a disparu —
**et `R1` n'a pas été touché**.

### 2.6 Passer la main

| Situation | Attendu |
|---|---|
| File vide | Retour à `/connexion`. L'effet annoncé : *« La personne suivante devra entrer son identifiant. »* |
| File non vide *(levier hors ligne + une écriture)* | **Refus immédiat** — *« Des enregistrements ne sont pas encore partis. Attendez le retour du réseau avant de passer la main. »* Jamais un échec après coup |

Le libellé est **« Passer la main »**. Jamais « Se déconnecter ».

### 2.7 Les quatre états

Depuis `/_scenarios`, un levier à la fois :

| Levier | `R1` | `R0` |
|---|---|---|
| **latence** | Chaque rubrique porte son squelette, **à la place et à la taille** du contenu | Le bouton passe en attente |
| **jeu vide** | Chaque rubrique porte son **état vide illustré**, disant ce qui viendra s'y loger | — |
| **échec réseau** | La rubrique seule porte son message — **les autres restent affichées** | Phrase générique |
| **hors ligne** | Les surfaces de classe B/C/D **disparaissent**, un bandeau dit pourquoi | L'action **disparaît**, annoncé **avant** la saisie |

**Le point dur est « échec réseau »** : si tout l'accueil tombe, l'indépendance des sources n'est pas
tenue.

### 2.8 Sombre, clair, et les deux moteurs

Basculer le thème depuis l'en-tête, sur chacun des quatre accueils. Puis :

```sh
pnpm test:navigateur              # les deux moteurs — ce que P-04 pilote
```

**Rien ne doit changer sauf les couleurs** : la bascule passe par la variante `dark:` et les jetons,
jamais par une seconde palette.

---

## 3. Formes de travail — jamais de validation

```sh
pnpm test -- tests/unite/accueil-composition.spec.ts   # un fichier
pnpm test:couverture                                    # la propriété « exercé » de P-06
pnpm knip                                               # la propriété « branché » de P-06
pnpm lint · pnpm typecheck · pnpm build
```

⚠️ **Un contrôle lancé à la main *en plus* du script est un contrôle qu'on oubliera.**

---

## 4. Ce qui reste dû à la fin du cycle

*À reprendre au `rapport-de-cycle.md`, qui dit **ce que les portes ne couvrent pas**.*

| Point | Pourquoi il n'est pas couvert |
|---|---|
| **L'accueil d'un maquis a-t-il l'air conçu pour lui ?** | Le contrôle mécanique prouve l'absence des mots, **jamais le jugement d'usage**. C'est l'atelier terrain qui tranche |
| **D'où le système saura à quel poste on est** | Le modèle ne le porte pas. Cycle **F4** |
| **`R4` et `R7` alignés sur la grammaire d'en-tête** | Corriger un écran qu'on ne construit pas revient à décider sans voir. Cycle **F3** |
| **Le régime mobile de l'en-tête** | Aucun écran mobile ici. Cycle **F4** |
| **L'application ouverte sur un appareil réel** | Les deux moteurs tournent sur le poste de développement, pas sur l'Android 2 Go d'Aminata |
