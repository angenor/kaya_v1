# Quickstart — valider la coquille, de bout en bout

**Cycle** : F1 — Fondations · **Plan** : [plan.md](./plan.md) · **Spécification** : [spec.md](./spec.md)

Ce document est le **parcours de validation**. Il ne contient aucun code d'implémentation : il dit ce qu'on lance, ce qu'on doit voir, et **quelle exigence chaque constat satisfait**.

> **Les quatorze pas ci-dessous sont exactement ceux que P-04 rejoue**, sur Chromium **et** sur WebKit, en clair **et** en sombre. Ce que vous faites à la main, la porte le refait à chaque exécution.

---

## Prérequis

| Ce qu'il faut | Ce qu'il ne faut PAS |
|---|---|
| **Node 24.18.1** (`.nvmrc`) et **pnpm 11.18.0** | ❌ aucun conteneur en cours d'exécution |
| Les navigateurs de Playwright, installés une fois sur le poste | ❌ aucune base de données |
| | ❌ aucun service distant, aucun réseau après le premier chargement |

> ⭐ **C'est la propriété du cycle, et elle se vérifie en l'éprouvant : arrêtez votre démon de conteneurs avant de commencer.** Si quelque chose refuse de démarrer, la propriété est perdue — et c'est elle qui rend la démonstration possible à Abengourou.

---

## Démarrer — une commande

```sh
pnpm install --frozen-lockfile
pnpm dev
```

**Attendu** : l'application répond en local. **Aucun conteneur n'a été démarré.** *(FR-001, FR-002, SC-001)*

---

## Le parcours, en quatorze pas

### 1 · La racine mène à l'index

Ouvrir `/`.

**Attendu** — redirection vers **`/_ecrans`**, titré « **Écrans** ».

> `/` est une redirection **pour ce cycle seulement** : le cycle F2 y posera `R1`, l'accueil composé.

### 2 · L'index porte deux sections

**Attendu** : *(FR-064, SC-023)*

| Section | Contenu |
|---|---|
| **Le produit** | **46 entrées**, chacune avec son **code** (`R1`, `R4`, `C4`…), son **état d'avancement** et un lien. **43 sont « pas commencé »** |
| **Les instruments** | **3 entrées, sans code** : Guide de style · Écrans · Scénarios |

**Vérifier aussi** : `docs/design/derivation.md` porte les trois instruments comme **écrans composés**, entrée distincte, **hors du décompte des 46** ; et `docs/Kaya_Design.md` §3 compte **toujours onze préfixes**. *(FR-089, D-12)*

### 3 · Les seize composants, dans les deux thèmes

Ouvrir **`/_guide-de-style`**.

**Attendu** : *(FR-018, FR-019, SC-004)*

- **Seize** sections numérotées — le décompte est celui de `docs/design/composants.md`, jamais un nombre écrit ailleurs ;
- chaque composant dans **tous** les états que ce fichier lui prête ;
- **le composant 15** (barre de proportion) présent, et `composants.md` **mis à jour dans le même changement** pour acter son entrée au canon. *(FR-025)*

Basculer le thème depuis la barre.

**Attendu** : les seize rendus dans les deux thèmes, **aucun illisible**. *(FR-007, FR-008)*

**Trois contrôles à faire à l'œil, que la porte fait au style calculé** : *(FR-020, SC-005)*

| Vérifier | Contre |
|---|---|
| Une cible cliquable fait **au moins 44 px** | `tokens.md` §3 — *« plancher tactile, jamais moins »* |
| Un état porte **une forme**, pas seulement une couleur | `composants.md` §04 — le vocabulaire de formes |
| Un montant porte l'**espace fine insécable U+202F** | `tokens.md` §2 — `12 500 F`, produit par **une seule fonction** |

### 4 · L'anglais, sans une clé brute

Basculer la langue.

**Attendu** : **tout** passe en anglais. **Aucune clé brute** n'apparaît, sur aucun écran. *(FR-027, FR-028, SC-006)*

Rebasculer en français — **c'est la langue par défaut**.

### 5 · Hors ligne, instantanément

Ouvrir **`/_scenarios`**, actionner le levier **hors ligne**.

**Attendu** : *(FR-062, FR-063, FR-086, D-01)*

- le témoin passe à « **Hors connexion** », **sans transition** — *un état grave n'a pas de transition, il est déjà là* ;
- ⚠️ **les mots « connecté », « dégradé » et « hors ligne » n'apparaissent nulle part** à l'écran. Ce sont des noms d'état **internes**. *(SC-022)*

### 6 · Une écriture de classe A entre dans la file

Au panneau **Scénarios**, actionner le **levier d'essai d'écriture**, classe **A**.

**Attendu** : l'écriture est **acceptée** · le témoin affiche « **En attente d'envoi (1)** » · l'élément porte un **UUID v7**. *(FR-057, FR-062, SC-010)*

### 7 · Une écriture de classe C est refusée — **c'est la propriété qu'on teste**

Même levier, classe **C**.

**Attendu** : *(FR-059, FR-060, SC-010)*

- le refus est annoncé **AVANT** la tentative, jamais après un échec ;
- la phrase est celle du lexique : « **Cette action nécessite internet.** » ;
- **elle est suivie de ce qui reste possible** — *toute interdiction a un versant positif* ;
- **la lettre « C » n'apparaît nulle part** : la classe est une mécanique interne. *(D-04)*

> **En phase 2, la file n'envoie rien. Ce refus est la propriété qu'on teste, pas l'envoi.** Un écran qui accepterait ici ce que le serveur refusera en phase 3 est un écran à refaire, et le mensonge ne se découvrirait qu'au branchement.

### 8 · La file survit au rechargement

Recharger la page.

**Attendu** : la file est **intacte**, le décompte dit toujours « **En attente d'envoi (1)** ». *(FR-058, SC-014)*

### 9 · Une action interdite est ABSENTE du HTML

Au panneau, passer le compte actif d'**Adjoua** — gérante, caissière, réceptionniste — à **Aminata** — serveuse.

**Attendu** : *(FR-050, SC-009)*

- une action qu'une serveuse n'a pas le droit d'exercer **disparaît** ;
- **ouvrir l'inspecteur** : elle **n'est pas dans le HTML rendu**. Ni grisée, ni cachée en CSS, ni désactivée — **absente**.

> **Le test se fait sur le HTML, pas sur un attribut de désactivation.** Griser dit à l'utilisateur que l'action existe et qu'il n'y a pas droit — et laisse dans le document une cible que rien n'empêche d'actionner autrement.

### 10 · Un service absent est absent — le pendant d'ETB-02c

Basculer l'établissement de **Deloria** vers **Résidence Test** *(un seul service : hébergement, aucun point de vente)*.

**Attendu** : les surfaces des services absents **disparaissent** — ni grisées, ni mentionnées. *(FR-051, FR-043)*

> ⚠️ **C'est le pas le plus révélateur du parcours.** Toute surface de la coquille qui supposerait une chambre, un article, un tarif ou une table **se casse ici**. C'est le moment le moins cher pour le découvrir : en phase 3, il coûterait un écran à refaire.

### 11 · Le vide propose une porte de sortie

Actionner le levier **jeu vide**.

**Attendu** : chaque surface qui listerait quelque chose montre son **état vide illustré** — motif de contreforts **ocre**, **une phrase qui dit ce qui apparaîtra**, **l'action qui démarre**. *(FR-044, SC-008)*

> *Un écran vide sans action est une impasse.* Jamais une page blanche, jamais une illustration de personnage.

### 12 · La latence produit des squelettes, puis « Connexion faible »

Régler la latence à **4 000 ms** — au-delà du seuil de **3 000 ms**.

**Attendu** : *(FR-087, D-02)*

- pendant l'attente : le **squelette**, à la **forme exacte** du contenu à venir — jamais une roue, qui est réservée à une attente réseau **indéterminée** ;
- puis le témoin affiche « **Connexion faible** », et **non** « Enregistré ».

*Le seuil vient de la configuration d'établissement (`sync.latence_degradee_seuil_ms`), jamais d'une constante.*

### 13 · Une capacité absente le dit, et propose l'alternative

Demander une **impression**, **sur WebKit**.

**Attendu** : *(FR-055, SC-013, D-09)*

> « **cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception** »

Refaire sur **Chromium** : le message **n'apparaît pas**.

> **C'est un fait à afficher, pas un bogue à corriger.** WebUSB et Web Bluetooth sont absents de Safari ; en phase 2 ces messages sont fréquents et c'est normal ; **Capacitor les fera disparaître.** Le recensement complet est à [contracts/platform-adapter.md §5](./contracts/platform-adapter.md).

### 14 · Installée, hors ligne, sans éclair — **la propriété la plus difficile à rétrofitter**

1. Régler le **système** en thème **sombre**, sans choix explicite dans l'application.
2. **Installer** l'application.
   - **Chromium** : l'invite s'affiche.
   - **WebKit** : ⚠️ **aucune bannière ne se déclenche** — l'écran doit **expliquer le menu de partage**, et dire que sans installation l'appareil ne recevra pas les alertes. *(FR-015)*
3. **Couper le réseau.** Fermer entièrement l'application.
4. **Rouvrir** depuis l'icône installée.

**Attendu** : *(FR-014, FR-009, SC-002, SC-003)*

- l'application **s'ouvre et s'affiche** — jamais la page d'erreur du navigateur ;
- ⚠️ **aucune image du démarrage ne présente le fond clair.** Le script du `<head>` a posé la classe **avant le premier pixel** ; un greffon serait arrivé trop tard.

> ⚠️ **CE PAS N'EST REJOUÉ DE BOUT EN BOUT QUE SUR CHROMIUM, et il faut le dire.** Playwright ne sait pas couper le réseau pour une **navigation** sur WebKit — `setOffline` lève « WebKit encountered an internal error », l'interception répond « Blocked by Web Inspector », toutes deux **avant** que le service worker ne voie la requête. Sur les **deux** moteurs, la porte prouve en revanche que le service worker **contrôle la racine** et que **son précache porte le document et les icônes**. Le détail est au [rapport de cycle](./rapport-de-cycle.md) §2.1.

---

## La commande unique

```sh
scripts/verifier.sh
```

**Enchaîne, dans cet ordre, avec arrêt au premier contrôle rouge** : lint → **types** → build →
tests d'unité **avec couverture** → **P-01** → **P-02** → **P-05** → **P-03** → **P-04** → **P-06**.

⚠️ **La construction se fait avec `KAYA_PAGE_TEMOIN=1`** : sans le drapeau, les deux pages témoin
n'entrent pas au routeur et la suite `cycle-de-vie` **échoue** — elle échoue, elle ne se saute pas.

### Sur un poste sans conteneur

```sh
scripts/verifier.sh --sans-conteneur
```

**Exécute** lint, build, tests, **P-03**, **P-04**, **P-06**. **Saute et NOMME** P-01, P-02, P-05. Imprime « **VERT SOUS RÉSERVE** », **jamais « TOUT VERT »**. *(FR-085, SC-021)*

> **Sans le drapeau et sans démon, le script sort en code 3, comme aujourd'hui.** Un poste de développement sans conteneur est une anomalie, pas un mode : le saut doit être une **intention déclarée**, sinon un vert partiel se lirait comme un vert.

### Les tests négatifs — **cinq mutations pour trois portes**

```sh
scripts/verifier.sh --test-negatif p03   # un « ^ » introduit → P-03 DOIT rougir
scripts/verifier.sh --test-negatif p04   # DEUX mutations, une par sens
scripts/verifier.sh --test-negatif p06   # DEUX mutations, une par sens
```

| Porte | Mutation | Ce qu'elle prouve |
|---|---|---|
| **P-03** | `@nuxtjs/i18n` passe à `^10.6.0` | l'intervalle est vu, **et le paquet est nommé** |
| **P-04** A | `/_scenarios` retirée de l'index, route servie | le **premier sens** — une route non déclarée |
| **P-04** B | `/_guide-de-style` rendue inatteignable, marquée construite | le **second sens** — une entrée qui ne mène nulle part |
| **P-06** A | un appelant **ajouté** à une entrée « dû » | le sens « a acquis un appelant » |
| **P-06** B | l'import d'un composant **retiré** du guide de style | le sens « a perdu son dernier appelant » — **celui qu'on oublie d'écrire** |

> **Chaque porte a deux mutations quand elle a deux sens.** Une seule ne prouverait qu'une moitié — et c'est précisément la moitié manquante qui rendrait le contrôle muet.
>
> **Toutes opèrent sur une COPIE DE TRAVAIL.** L'empreinte du dépôt est relevée avant et après : une porte ne modifie pas ce qu'elle inspecte, et ce n'est pas une promesse — c'est constaté.

**Si un test négatif laisse sa porte verte** : sortie en code **4 — porte aveugle**, distinct du code 1. *Une porte rouge signale un défaut du produit ; une porte qui refuse d'être rouge signale un défaut de la porte.*

---

## Ce que ce parcours ne prouve pas

*À dire au pilote, et à consigner au rapport de cycle.*

- **Ni la conformité fiscale**, ni la justesse d'un calcul : **rien n'est calculé** dans ce cycle.
- **Ni la résistance aux coupures réelles** : le hors-ligne est un **levier**, pas une coupure.
- **Ni les performances sur le matériel visé** — Android 2 Go, poste 1366 × 768 en plein soleil. Les mesures faites sur le poste de développement ne les prédisent pas.
- **Ni la lisibilité en conditions réelles.** Les deux questions ouvertes de `tokens.md` §2.1 — l'étiquette de 11 px et le corps de 13,5 px — **ne se tranchent pas au bureau** : elles partent à la journée d'observation d'Abengourou, et leurs retours iront dans `docs/design/notes-terrain.md`.
