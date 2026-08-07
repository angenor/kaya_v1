# Contrat — Les surfaces de `R1`

*`R1` n'est pas une page : c'est **un motif**. `R2`, `M1`, et par transitivité `P1` et `M3`, en
hériteront. Ce document dit **ce qu'une surface déclare**, et surtout **ce qu'elle ne décide pas**.*

---

## 1. La règle unique

> **Une surface déclare ce qu'elle suppose. Elle ne décide de rien.**

Elle ne sait pas si elle sera rendue, ni où elle mène, ni ce qu'il faut dire quand l'écran cible
n'existe pas. Trois fonctions le savent à sa place : `useAutorisation.retenir()` (posée par F1,
**inchangée**), `composerAccueil()` et `useEcranCible()`.

**C'est ce qui rend `R1` héritable.** Un écran qui décide lui-même n'est pas un motif : c'est un cas
particulier que le suivant recopiera de travers.

---

## 2. La déclaration

```ts
export interface SurfaceAccueil extends ActionAutorisable {
  readonly permission: string          // ← ActionAutorisable, de F1
  readonly moduleCode: string | null   // ← null = transverse
  readonly ecranCible: string | null   // le CODE d'écran : 'R7', 'C4', 'R3'
  readonly famille: FamilleSurface
  readonly titreCle: string            // clé i18n — jamais une chaîne
  readonly detailCle?: string
}

type FamilleSurface = 'tete' | 'suite' | 'aRegler' | 'activite' | 'chiffre'
```

| Champ | Ce qu'il ne contient jamais | Pourquoi |
|---|---|---|
| `ecranCible` | **une route** | La route vient de l'index des écrans. Deux sources se contrediraient au troisième cycle |
| — | **un libellé de mention** | Il vient de l'index aussi. Écrit ici, il serait recopié onze fois |
| — | **une condition d'affichage** | C'est `composerAccueil` qui filtre. Une surface qui se juge elle-même n'est plus filtrable |
| `titreCle` | **une chaîne visible** | Aucune chaîne en dur. fr/en à parité stricte |

---

## 3. Les cinq familles

| Famille | Maquette | Composants | Règle propre |
|---|---|---|---|
| **`tete`** | « À faire maintenant » · « Votre service » · « Le service » | **01** bouton principal · **03** bouton discret | **Une seule par écran.** C'est l'action principale — trois actions faute d'avoir tranché violent la règle |
| **`suite`** | « Ensuite, dans l'ordre de l'heure » · « Vos tables » · « La salle » | **08** ligne de liste · **02** bouton secondaire · **04** pastille | Ordonnée par **l'heure**, pas par importance supposée |
| **`aRegler`** | « À régler » · « Avant de fermer » · « Cette semaine » | **07** bandeau d'alerte | Trois niveaux : danger · alerte · info. **Jamais plus de trois cartes** |
| **`activite`** | « Vos activités » | **05** tuile d'action | **Disparaît avec son titre** si l'établissement n'a qu'une activité — une liste à un élément qui ne mène nulle part est un reste de mise en page |
| **`chiffre`** | « Aujourd'hui » · « Ce soir » · « Les deux ensemble » | **06** carte de chiffre | Montants par `format/montant.ts`, chiffres tabulaires |

---

## 4. Le filtrage — deux conditions cumulées

```ts
composerAccueil(surfaces) → surfaces retenues
  = useAutorisation.retenir(surfaces)
  = surfaces.filter(s => aLaPermission(s.permission) && serviceEstActif(s.moduleCode))
```

**`useAutorisation` n'est pas modifiée.** Elle suffisait déjà — c'est le meilleur signe que F1 a
posé la bonne abstraction.

| Condition | Effet quand elle manque |
|---|---|
| la permission | **absente du HTML** |
| le module actif ici | **absente du HTML** |

> **Avoir le droit ne suffit pas si le service n'existe pas ici.** Adjoua a le droit d'appliquer une
> remise, et il n'y a pas de restaurant à Résidence Test. Les deux conditions **se cumulent**.

**Un module absent de `listerModulesActifs` est inactif.** L'interface de domaine ne rend **jamais**
un module inactif accompagné d'un drapeau — précisément pour qu'aucun écran n'ait à décider, et n'en
grise un.

**Une rubrique dont toutes les surfaces sont retirées disparaît avec son titre** (FR-015).

---

## 5. L'appui — naviguer, ou dire

```ts
useEcranCible(code) →
  | { etat: 'construit',  route }              → navigation
  | { etat: 'aVenir',     titre, cycle }       → la mention
  | { etat: 'inconnu' }                        → jamais rendu : le code n'est pas à l'index
```

**Le titre et le cycle sont lus à `app/core/ecrans/index.ts`**, jamais écrits dans `R1`.

L'index reçoit un champ nouveau : **le cycle attendu** de chaque écran non construit. Il ne le
portait pas ; c'est là qu'il entre, pas dans la surface.

| Propriété | Vérification |
|---|---|
| La surface a **l'apparence exacte** d'une surface aboutie | SC-014 — **aucune** différence sur le document rendu : ni opacité, ni classe, ni attribut, ni texte |
| Aucun badge, aucune atténuation, aucun `disabled` | idem. *Un badge « bientôt » réintroduirait le grisé par la porte de derrière* |
| La mention **disparaît d'elle-même** | `accueil-composition.spec.ts` — passer un écran à `CONSTRUIT` à l'index suffit, **`R1` n'est pas retouché** |

> **Pourquoi cette exception, et pourquoi elle n'en est pas une.** « Absent, jamais grisé » protège
> l'utilisateur d'une action *qu'il n'a pas le droit de faire* ou *d'un service qui n'existe pas
> ici* — ces deux-là restent absentes, sans exception. Ici l'action existe, la personne y a droit,
> le service est actif : **ce qui manque est de notre côté**, et le dire est honnête. L'effacer
> donnerait de `R1` une image fausse au moment précis où onze écrans doivent en hériter le motif.

---

## 6. Les quatre variantes — obtenues par le contexte, jamais par un drapeau

**Il n'existe aucun `if (variante === 'maquis')`.** Les quatre accueils maquettés sont **le même
code** rendant des ensembles de surfaces différents.

| Variante | Compte × site | Ce qui la produit |
|---|---|---|
| **générique** | Adjoua × Deloria | 5 modules actifs · permissions de gérante + caisse + réception |
| **serveuse** | Aminata × Deloria | 1 permission (`ventes.commande.prendre`) · 2 modules atteints → ni caisse, ni chiffres d'hôtel |
| **maquis** | Yao × Chez Tantie Adjo | **1 seul module actif** → la rubrique « Vos activités » disparaît entièrement |
| **propriétaire** | M. Koffi × portée « tous » | `pilotage.lire` seul → **aucune surface qui modifie une caisse** |

> **C'est le test de vérité du cycle.** Si une variante exigeait une branche dans le code, l'accueil
> d'un maquis serait un hôtel amputé — et les onze écrans qui héritent du motif hériteraient de la
> branche.

**Test** : `tests/unite/accueil-absence-html.spec.ts` — sur le maquis, le document rendu ne contient
**aucune** occurrence de « Hébergement », « Pressing », « Salle de réunion ». Ni en texte, ni en
attribut, ni sous un élément masqué.

---

## 7. Les états, et l'indépendance des sources

Chaque rubrique lit **sa propre** source de domaine et porte **ses quatre états** : chargement
(squelette à la place exacte), vide (illustré), erreur, nominal.

| Règle | Motif |
|---|---|
| **Une rubrique qui échoue n'en emporte pas cinq** (FR-022) | Un accueil est composé de sources indépendantes |
| **Une réponse tardive après bascule ne s'affiche pas** (FR-023) | Sinon Deloria montre les chiffres du maquis |

**Aucun composant ne sait qu'un scénario existe.** Les leviers — hors ligne, latence, jeu vide, échec
réseau — s'appliquent **dans la couche de simulation**, et nulle part ailleurs. Un composant qui les
connaîtrait serait un composant à réécrire en phase 3.

---

## 8. Ce que ce contrat n'inclut pas

- **Les écrans derrière les surfaces.** `R1` pose les **portes** ; F3 à F7 posent ce qu'il y a
  derrière.
- **Le régime mobile de `R1`** — c'est `M1`, cycle F7.
- **La vue du jour** `R2`, qui hérite de `R1` + composant 14 — cycle F3.
