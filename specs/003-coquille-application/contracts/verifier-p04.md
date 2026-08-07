# Contrat — porte **P-04** · les écrans

**Cycle** : F1 · **Exigences** : FR-069, FR-070, FR-071, FR-072 · **Constitution** : principe 13, porte nommée par le noyau, *« phase 2 »* ; principe 8

> **La famille de défauts la plus coûteuse de la phase 2 : un écran inatteignable pendant que tous les tests sont verts.** Un test qui monte un composant contourne le routeur, la suspension, les gabarits et les greffons. *« Tout cycle qui produit des écrans est vérifié en navigateur réel, sur les deux moteurs. »*

---

## 1. Périmètre inspecté *(point 1)*

| Source | Ce qu'elle fournit | Pourquoi elle et pas une autre |
|---|---|---|
| **Le manifeste de routes du build** | l'inventaire des routes **réellement servies** | Une liste écrite à la main peut être vidée par accident, et la porte inspecterait zéro route en restant verte |
| **`app/core/ecrans/index.ts`** | les entrées de l'index et leur **état d'avancement** | **La page `/_ecrans` rend ce module, et la porte lit ce module.** Une seule source : il n'y a pas de seconde liste, donc rien qui puisse diverger |

**Matrice d'exécution** : `routes construites × { clair, sombre } × { Chromium, WebKit }`.

**Aucun conteneur.** La porte construit l'application et sert le build localement. *C'est ce qui la rend exécutable sur le poste d'Abengourou, où P-01, P-02 et P-05 ne le sont pas.*

---

## 2. Les quatre contrôles

### C1 · L'application démarre

Le build réussit, le serveur local répond, et la première page rend son gabarit. **Un échec ici arrête la porte** : inspecter des routes sur une application qui ne démarre pas donnerait un second message sans second diagnostic.

### C2 · Toute route atteignable est déclarée à l'index — *premier sens (FR-070a)*

```
routes(build) \ index  =  ∅
```

Une route qu'aucune entrée d'index ne déclare **fait échouer**, en la nommant. *C'est le sens qui empêche un écran d'exister sans que personne le sache — la dérive que l'index existe pour refuser.*

### C3 · Toute entrée marquée construite est atteignable — *second sens, borné (FR-070b)*

```
{ entrées d'index dont l'avancement = CONSTRUIT } \ routes(build)  =  ∅
```

> ⚠️ **La borne est le point du contrat.** L'index porte **46 écrans du produit**, dont **43 « pas commencé »**. Exiger l'atteignabilité de *toutes* les entrées rendrait la porte rouge **dès son premier jour**, et on la désactiverait sous trois semaines. **Seul l'état `CONSTRUIT` est exigible** — et c'est ce qui fait de l'index un plan de charge autant qu'un contrôle.

### C4 · Chaque écran construit rend, dans les deux thèmes, sur les deux moteurs

Pour chaque passage :

| Vérifié | Comment |
|---|---|
| La page **rend** | le gabarit est présent, **un seul `<main>`** dans le document (FR-032) |
| Le **thème** est appliqué | la classe est posée sur la racine **avant le premier rendu** ; le fond calculé est celui du jeton `--color-bg` du thème demandé |
| Le **contraste** | AA sur l'ensemble, **AAA sur les montants et les statuts** (FR-095) |
| Les **valeurs de jetons** | style **calculé** lu dans le navigateur — fond, hauteur, rayon, corps — comparé à `docs/design/tokens.md`. **C'est le contrôle qui attrape l'utilitaire venu du CDN** (FR-020, SC-005) |
| La **console** | aucune erreur non attendue |
| Le **témoin** | les mots « connecté », « dégradé », « hors ligne » **n'apparaissent pas** dans le HTML rendu (SC-022) |

**Et deux parcours complets, rejoués sur les deux moteurs** :

1. **Le parcours de bout en bout** de [quickstart.md](../quickstart.md) — les quatorze pas, dont l'ouverture hors ligne et l'installation.
2. **Le même, sur « Résidence Test »** — un seul service actif, aucun point de vente. *Pendant en phase 2 du test d'agnosticité **ETB-02c** : c'est le moment le moins cher pour découvrir qu'une surface suppose une chambre.*

---

## 3. Non-vacuité — le plancher est **dérivé du routeur**, jamais une constante *(point 4)*

```
plancher : routes(build) ≠ ∅        et        CONSTRUIT ≠ ∅
passages : |routes construites| × 2 thèmes × 2 moteurs   — imprimé
```

> **C'est un meilleur plancher que ceux de P-01, P-02 et P-05, et il vaut d'être dit.** Les trois autres portent une **constante** qu'un cycle doit penser à relever — le cycle D2 a dû relever les trois. Celui-ci **croît tout seul** avec l'application, parce que sa source est le routeur. Le seul cas qu'il ne couvre pas est celui d'un routeur vide, et c'est exactement ce que la non-vacuité attrape.

**Sortie type, à la fin de ce cycle** :

```
── P-04 · l'application démarre et chaque écran construit s'atteint
   Périmètre : 4 route(s) au routeur · 49 entrée(s) d'index (46 produit + 3 instruments)
               dont 4 CONSTRUIT — 45 « pas commencé », non exigibles
   Plancher  : routeur non vide · au moins un écran construit — atteint
   Passages  : 4 × 2 thèmes × 2 moteurs = 16
   ✓ routes ⊆ index                     4/4      (premier sens)
   ✓ index[CONSTRUIT] ⊆ routes          4/4      (second sens)
   ✓ rendu, thème, jetons, contraste   16/16
   ✓ parcours de bout en bout           2/2      (Deloria · Résidence Test)
   VERT
```

---

## 4. Les tests négatifs — **deux, un par sens**

```sh
scripts/verifier.sh --test-negatif p04
```

Une seule mutation ne prouverait qu'une moitié de la porte.

### Négatif A — le premier sens

**Mutation** : dans une copie de travail, l'entrée `/_scenarios` est **retirée de l'index**, la route restant servie.

**Exigences** : P-04 rougit · elle **nomme `/_scenarios`** · elle dit que c'est le **premier sens** — une route atteignable non déclarée · l'empreinte du dépôt est inchangée.

### Négatif B — le second sens

**Mutation** : dans une copie de travail, la page `/_guide-de-style` est rendue **inatteignable**, son entrée d'index restant marquée `CONSTRUIT`.

**Exigences** : P-04 rougit · elle **nomme `/_guide-de-style`** · elle dit que c'est le **second sens** · l'empreinte est inchangée.

> **Et un troisième constat, qui n'est pas une mutation** : une entrée marquée **« pas commencé »** et inatteignable **NE DOIT PAS** faire rougir. Sans lui, on aurait prouvé que la porte échoue — pas qu'elle échoue **au bon endroit**. *C'est la borne du C3, et elle se vérifie comme le reste.*

**Si l'une des deux mutations laisse la porte verte** : sortie en code **4 — porte aveugle**, distinct du code 1. *Une porte rouge signale un défaut du produit ; une porte qui refuse d'être rouge signale un défaut de la porte, et les deux ne se réparent pas au même endroit.*
