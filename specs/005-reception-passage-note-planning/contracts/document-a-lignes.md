# Contrat — le document à lignes, dont six écrans héritent

**Cycle** : F3 · **Exigences** : FR-023 à FR-033 · **Emplacement** : `app/core/document-a-lignes/`
· **Référence visuelle** : `docs/design/html/R7-note-depart.html`

> ⚠️ **Ce n'est pas un dix-septième composant.** Le canon est fermé — *« les seize composants, et
> rien d'autre »*. Un document à lignes n'est pas un composant, c'est un **assemblage de trois
> pièces** que `R7` pose et que six écrans de quatre cycles reprennent. Il vit donc dans `core/`, au
> même rang que `format/` ou `file/`, et **jamais** dans `design-system/`.

---

## 1. Les six héritiers, et ce que chacun change

| Écran | Cycle | Ce qu'il garde | Ce qu'il change |
|---|---|---|---|
| **`R7`** La note et le départ | **F3** | tout | *(c'est lui qui pose le motif)* |
| **`R6`** Note temps réel | **F3** | tout | **sans l'action finale** |
| **`R5`** Fiche client | **F3** | les lignes | ⚠️ **aucun bloc de total** — voir §4 |
| `P3` Addition et division | F4 | tout | le **fractionnement** est le seul motif neuf |
| `P4` Bon de dépôt pressing | F4 | tout | un **cycle d'état** en plus |
| `C2` Encaissement multi-modes | F5 | tout | le fractionnement **entre modes** |
| `C3` Comptage et écart | F5 | la structure | saisie **par coupure** |
| `F4` État de reversement | F6 | tout | **export** |

---

## 2. Les trois pièces

| Pièce | Ce qu'elle rend | Ce qu'elle ne fait jamais |
|---|---|---|
| **`LigneDocument`** | un libellé, un détail secondaire, une quantité *(vide si 1)*, un montant à droite en tabulaire | Elle ne calcule rien. **Elle ne formate pas un montant** : `app/core/format/montant.ts` est la seule fonction qui écrit un montant |
| **`SousTotalSection`** | un titre de section, sa mention libre, et son sous-total | Elle n'additionne pas : le total lui est donné |
| **`PiedTotal`** | l'étiquette, la mention explicative, **le total en grand**, et la mention « Document non fiscal » | ⚠️ **Il ne défile jamais.** C'est une propriété du pied, pas de l'écran qui l'emploie |

**Corps typographiques** — lus à `docs/design/tokens.md`, qui **prime sur la maquette** :
`--text-total` (44 px) pour le total d'un document · `--text-lead` pour les montants de ligne ·
`font-mono` **partout où il y a un nombre**, jamais ailleurs.

---

## 3. Les invariants que les six héritiers reçoivent

1. **Le total est présent au premier rendu.** Il n'existe aucun état où les lignes sont visibles et
   le total absent. *Un total qu'il faut demander est un total qu'on ne regarde pas.*
2. **Le total ne défile pas.** Pied épinglé, toujours.
3. **Chaque taxe est une ligne**, jamais un champ du total. `ligne_sejour.type = 'TAXE'` en est la
   forme dans la donnée.
4. **La mention « Document non fiscal — ne tient pas lieu de facture » est portée par le pied**, et
   elle est **imprimée sur chaque copie remise au client**. Elle disparaît uniquement quand le
   document **est** fiscal et **certifié**.
5. **Une section non servie se rend en creux, nommée** — jamais supprimée. *Supprimer une section
   fait croire qu'elle n'existe pas ; la montrer vide dit qu'elle viendra.*
6. **L'action finale est optionnelle** — c'est la seule différence entre `R7` et `R6`.

---

## 4. Le piège que `R5` désamorce

`R5` **Fiche client** hérite des lignes et **rejette le bloc de total**. Ce n'est pas une
simplification : additionner les séjours d'un client afficherait un chiffre qui **ressemble à un
solde**, et l'exploitant y chercherait ce que le client doit.

⚠️ **Conséquence pour le contrat** : `PiedTotal` est **une pièce séparée**, pas une partie du corps.
Un document à lignes qui aurait son total intégré rendrait ce rejet impossible sans réécriture — et
la réécriture aurait lieu six mois plus tard, dans un autre cycle, par quelqu'un qui ne saurait pas
pourquoi.

---

## 5. Le point que la maquette ne dit pas, et que le document doit dire

**La note se ferme *arrêtée*, pas *réglée*.** Les deux faits sont indépendants et portent chacun sa
phrase :

| Fait | Phrase (lexique) |
|---|---|
| La note est arrêtée | « **La note est arrêtée : plus rien ne peut s'y ajouter** » |
| Le règlement | « encaissé en espèces » — ou **le solde restant, dit en clair** |

*Sans cette séparation, l'écran laisse croire au paiement, et le trou se découvre au comptage de
caisse sans qu'on sache à quel séjour il se rattache.*

---

## 6. Le point que la maquette dit **faux**, et qu'il ne faut pas recopier

`R7-note-depart.html` affiche *« Taxe de séjour · 500 F par personne et par nuit · 2 personnes ×
4 nuits · 4 000 F »*.

⚠️ **La maquette est antérieure à la clôture de la décision B-10** (cadrage §9.6, corrigé le
2026-08-03). La taxe est due **par nuitée et par séjour, jamais par personne** : avec la règle seed
`une_nuitee_par_occupation`, la bonne valeur est **500 F**, et le total de cette note **282 860 F**.

**La maquette reste la référence pour le dessin de la ligne** — sa place, sa typographie, sa phrase
d'assiette. **Elle n'est pas une référence pour le montant.** Le calcul vient de
`app/core/reception/taxe-sejour.ts`, et `SC-015a` refuse la valeur de la maquette.
