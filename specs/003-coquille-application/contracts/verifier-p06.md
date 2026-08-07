# Contrat — porte **P-06** · les points d'entrée

**Cycle** : F1 · **Exigences** : FR-074 à FR-080 · **Porte NOUVELLE**, hors du noyau de quatre

---

## 1. Pourquoi cette porte existe — l'erreur réelle, citée

Le principe 13 n'autorise l'ajout d'une porte que sur **une erreur réelle** ou un **coût manifeste** — *« jamais parce qu'elle figurerait bien dans une liste »*. L'erreur réelle est **documentée dans le dépôt**, à `docs/design/lexique.md`, version 1.3.0 :

> *« `fermerSession()` existait depuis le cycle CPT **sans aucun appelant** — il n'y avait, littéralement, **aucun moyen de sortir de sa session**. »*

Une fonction écrite, compilée, passant le lint et les tests, **et que rien n'appelait**. Le défaut ne s'est pas vu à la compilation ; il s'est vu quand quelqu'un a cherché comment passer la main sur un terminal partagé.

**Et ce cycle aggrave le risque**, ce qui en fait le bon moment : `PlatformAdapter` livre une vingtaine de méthodes dont **la moitié n'aura d'appelant qu'en phase 3**. Sans la porte, cette moitié est indistinguable de code mort — et **personne ne saura laquelle**.

**C'est pourquoi il faut DEUX états et non un.** Un contrôle « aucun export sans appelant » rendrait rouge toute méthode légitimement en attente. C'est **« dû »** qui rend la porte tenable, et **c'est le second sens qui l'empêche d'être muette** : *sans lui, tout déclarer « branché » suffirait à la faire taire.*

---

## 2. Le registre — `docs/points-entree.md`

Créé par ce cycle. Une ligne par point d'entrée.

```markdown
| Point d'entrée                              | État    | Qui l'appelle / qui l'attend        |
|---------------------------------------------|---------|-------------------------------------|
| app/core/plateforme/web/Impression#imprimerTicket | dû   | cycle IMP (T2)                      |
| app/core/plateforme/web/Reseau#etat          | branché | app/core/file/temoin.ts             |
| app/core/donnees/hebergement#listerUnites    | dû      | cycle F3 — réception                |
| app/core/design-system/ChampSaisie.vue       | branché | pages/guide-de-style.vue            |
| app/core/format/montant#formaterMontant      | branché | CarteChiffre.vue · LigneListe.vue   |
```

**Périmètre** *(FR-075, tranché à la clarification)* — les **surfaces publiques de la coquille** :

| Inclus | Exclu, et pourquoi |
|---|---|
| méthodes de `PlatformAdapter` et de ses implémentations | **les types et les interfaces** — un type n'a pas d'« appelant », la propriété n'y aurait pas de sens uniforme |
| méthodes des interfaces de domaine | ~~**les constantes** — même motif~~ **→ AMENDÉ, voir ci-dessous** |
| composables exportés | **les fonctions internes** non exportées — elles ne sont la surface de personne |
| composants du design system | **`app/core/donnees/jeux/`** — le jeu disparaît au branchement de la phase 3 |
| gabarits, intergiciels, greffons | |

> ### ⚠️ AMENDÉ À L'IMPLÉMENTATION — **les constantes entrent au périmètre**
>
> **Le motif est opposable, et il n'est pas un confort** : `knip` ne distingue pas une constante
> d'une fonction dans son rapport. Un périmètre qui les exclurait **ne serait pas calculable par la
> porte** — il faudrait deviner la nature de chaque export en lisant sa déclaration, et la
> devinette dériverait au premier `export const` écrit autrement, **sans que rien ne le dise**.
>
> Les **types**, eux, restent exclus : `knip` les rend dans un champ séparé, donc l'exclusion se
> calcule au lieu de se supposer. *La règle retenue : ce que la porte ne peut pas calculer, elle ne
> l'exclut pas.*
>
> Conséquence chiffrée : **121 entrées au registre** au lieu de la soixantaine que le contrat
> laissait attendre — dont **30 « dû »**.

---

## 3. Les deux propriétés — et pourquoi il en faut deux

> **Une unité écrite n'est ni testée ni branchée par défaut, et il faut un contrôle pour chacune des deux.** Elles ne se remplacent pas : *un point d'entrée peut avoir un appelant qu'aucun test n'exécute.*

### 3.1 Propriété « branché » — `knip`, dans les deux sens

`knip` construit le graphe du projet entier et rend, en JSON, les **exports sans référence**.

| Constat | Attendu | Verdict si l'inverse |
|---|---|---|
| Entrée **« dû »** | présente dans l'ensemble « sans référence » | **ROUGE** — elle a **acquis** un appelant ; l'état passe à « branché » dans le même changement |
| Entrée **« branché »** | absente de cet ensemble | **ROUGE** — elle a **perdu** son dernier appelant |
| Export **absent du registre** | — | **ROUGE** — une unité hors registre échappe aux deux sens (FR-078) |

> ### ⚠️ Ce qui rend la porte fiable n'est pas `knip` — c'est une décision de conception
>
> L'auto-import de Nuxt supprime les instructions `import` : un composant employé dans un gabarit n'est référencé nulle part explicitement, et **toute analyse statique le déclarerait mort**. Un faux positif systématique ferait désactiver la porte en trois semaines.
>
> **La parade est structurelle : le guide de style importe les seize composants EXPLICITEMENT, un par un.** Les références deviennent réelles et l'analyse cesse de reposer sur une heuristique de résolution.
>
> Et cette contrainte sert la spécification au lieu de la contrarier : **c'est le guide de style qui branche le design system**, ce qui est exactement son rôle déclaré — *« la page que j'ouvre pour voir si le design system tient »*. Un composant qu'il ne montre pas est, à juste titre, « dû ».

### 3.2 Propriété « testé » — la couverture, **par fonction**

`@vitest/coverage-v8` rend un rapport JSON portant la couverture **par fonction**, et non seulement par fichier.

> **La différence compte.** « Ce fichier est testé » et « cette méthode est appelée par un test » ne sont pas la même affirmation : un fichier de vingt méthodes dont une seule est exercée passerait un seuil par fichier.

| Constat | Verdict |
|---|---|
| Entrée **« branché · unité »** dont la fonction porte **zéro passage** | **ROUGE**, en la nommant |
| Entrée **« branché · navigateur »** | **hors couverture** — sa preuve est **P-04**, voir ci-dessous |
| Entrée **« dû »** non couverte | **normal** — rien ne l'appelle, donc aucun test ne l'exerce |

> ### ⚠️ AMENDÉ À L'IMPLÉMENTATION — le registre déclare **comment** l'entrée est exercée
>
> **Le contrat supposait que « exercé » voulait dire « couvert par un test d'unité ». Le constat
> l'a démenti** : `@vitest/coverage-v8` ne mesure que ce que **Vitest** exécute. Un composant du
> design system rendu par Chromium **et** par WebKit, dans les deux thèmes, **quatre fois par
> écran**, y porte **zéro passage**. Appliquer la règle telle qu'écrite aurait rendu la porte rouge
> sur **les seize composants, les quatre pages et le gabarit** — c'est-à-dire sur tout ce que ce
> cycle a livré et vérifié à l'écran.
>
> Le registre porte donc une colonne **« exercé par »** — `unité`, `navigateur`, ou `—` —, et la
> porte applique la couverture **à la première seulement**. ⚠️ **Ce n'est pas une échappatoire, et
> le plancher l'empêche d'en devenir une** : P-06 exige **au moins 8 entrées réellement couvertes
> par les tests d'unité**. Tout déclarer « navigateur » ferait tomber ce plancher, et la porte
> rougirait.
>
> *La preuve n'a pas disparu : elle est ailleurs, dans une porte qui tourne dans la même commande.*

---

## 4. Complétude et non-vacuité *(points 2 et 4)*

**Complétude** : la porte déclare le nombre d'exports que `knip` a examinés **et** le nombre d'entrées du registre, et signale tout export hors registre.

**Non-vacuité — deux planchers, des deux côtés** :

```
plancher_registre  : nombre d'entrées ≥ PLANCHER_ENTREES
plancher_analyse   : nombre d'exports examinés par knip ≥ PLANCHER_EXPORTS
```

> **Le second est le plus important, et pour la même raison que celui de P-02** : un rapport `knip` devenu illisible — configuration cassée, chemin changé — rendrait un ensemble vide, **tout « dû » deviendrait faux et tout « branché » deviendrait vrai**, et la porte passerait au vert **en ne comparant plus rien**. C'est exactement le mode de défaillance qu'un plancher existe pour refuser.
>
> Les deux valeurs sont posées **juste sous le réel** à la fin du cycle — *un plancher se règle juste sous la valeur réelle, jamais loin en dessous.*

---

## 5. Les tests négatifs — **deux mutations, une par sens**

```sh
scripts/verifier.sh --test-negatif p06
```

Une seule mutation ne prouverait qu'une moitié — et c'est précisément la moitié manquante qui rendrait la porte muette.

> ### ⚠️ AMENDÉ À L'IMPLÉMENTATION — **la mutation porte sur L'ENTRÉE de la porte**
>
> `knip` analyse **le dépôt**, jamais une copie de travail : il n'a pas d'option « analyse ce
> répertoire-ci comme s'il était la racine » utilisable ici. Ajouter un appelant dans une copie
> n'aurait donc **rien changé à ce que knip rapporte**, et la mutation serait restée sans effet —
> un test négatif qui ne mute rien est pire qu'aucun test négatif.
>
> `porte_p06` accepte donc un **second argument** : le fichier d'où lire l'ensemble « sans
> référence ». Les deux mutations écrivent cet ensemble dans la copie de travail — A **retire** une
> entrée « dû » (ce que knip rapporterait le jour où quelqu'un l'appelle), B **ajoute** le composant
> (ce que knip rapporterait le jour où son import disparaît) et **retire l'import du guide dans la
> copie**, pour que les deux gestes que la réalité fait ensemble soient faits ensemble.
>
> *La porte confronte deux ensembles ; on lui en donne un faux, et elle doit le voir.*

### Négatif A — un « dû » qui acquiert un appelant

**Mutation** : dans une copie de travail, un appel à une méthode déclarée **« dû »** est ajouté dans une page.

**Exigences** : P-06 rougit · elle **nomme la méthode** · elle dit qu'il s'agit du sens **« dû → a acquis un appelant »**.

### Négatif B — un « branché » qui perd le sien

**Mutation** : dans une copie de travail, l'import explicite d'un composant du design system est **retiré du guide de style**, son entrée restant **« branché »**.

**Exigences** : P-06 rougit · elle **nomme le composant** · elle dit qu'il s'agit du sens **« branché → a perdu son dernier appelant »**.

> **Le négatif B est celui qui compte le plus**, et il faut dire pourquoi : c'est le versant qu'on oublie d'écrire. *Sans lui, tout déclarer « branché » rendrait le contrôle muet* — la porte resterait verte pour toujours sur un registre entièrement faux.

### Un troisième constat, qui n'est pas une mutation

Un point d'entrée **« dû »** et sans appelant **NE DOIT PAS** faire rougir. Sans lui, on aurait prouvé que la porte échoue — pas qu'elle échoue **au bon endroit**. *C'est ce qui distingue P-06 d'un contrôle « aucun code mort », qui serait rouge dès la première méthode en attente de la phase 3.*

**Si l'une des deux mutations laisse la porte verte** : code **4 — porte aveugle**.

---

## 6. Sortie type

```
── P-06 · tout point d'entrée est branché ou dû, et tout branché est testé
   Périmètre : 74 entrée(s) au registre · 74 export(s) examiné(s) par knip
   Planchers : 60 entrée(s) · 60 export(s) — atteints des deux côtés
   ✓ « dû » sans appelant               31/31   (premier sens)
   ✓ « branché » avec appelant          43/43   (second sens)
   ✓ aucun export hors registre         74/74
   ✓ « branché » exercé par un test     43/43   (couverture par fonction)
   VERT
```

---

## 7. Ce que P-06 ne prouve pas

*À consigner au rapport de cycle plutôt qu'à laisser croire.*

- **Qu'un appelant est un BON appelant.** Une méthode appelée une fois depuis un endroit absurde est « branchée ». La porte compte les références ; elle ne les juge pas.
- **Qu'un test est un BON test.** Un test qui appelle une méthode sans rien vérifier la rend « testée ». *La couverture mesure le passage, pas l'assertion.*
- **Que le registre décrit la bonne intention.** Déclarer « dû » une méthode qu'on aurait dû brancher est cohérent, donc vert. C'est le seul jugement que la porte laisse à l'humain — et il est visible, puisque le registre est un fichier qu'on relit.
