# Contrat — La grammaire de coquille

**Opposable aux cycles F3 à F7.** Ce que ce document fixe, les six cycles suivants le reprennent
**sans le rejuger**. Un écran qui s'en écarte n'est pas un écran plus libre : c'est un écran que
l'exploitant devra réapprendre.

> **Ce qui se transmet est la grammaire, jamais le dessin** (constitution, principe 12). Un écran
> reste juste tant qu'il **parle la même langue**. La dérive vient du vocabulaire, pas de la mise en
> page.

---

## 1. L'en-tête — un seul, dans le gabarit, jamais dans une page

**Défini une fois**, à `app/core/coquille/EnTeteContexte.vue`, monté par `app/layouts/defaut.vue`.
**Aucune page n'écrit de `<header>`.** Un test le vérifie (`entete-unique.spec.ts`) : le dépôt en
contient exactement un.

### Ordre des éléments — il ne change jamais

```
┌──────────────────────────────────────────────────────────────────────────┐
│ K   [Établissement ▾]        ● Enregistré    09 h 40    AK Adjoua Kouassi │
│     [Abengourou · poste]                     Mardi 14   Gérante · Caisse  │
└──────────────────────────────────────────────────────────────────────────┘
  1          2                      3            4              5
```

| # | Élément | Règle |
|---|---|---|
| 1 | **Marque** | Ocre, jamais indigo. *L'indigo est un signal : ce qui est indigo se touche.* La marque ne se touche pas. |
| 2 | **Sélecteur d'établissement** — composant **09** | **Toujours en haut à gauche, il ne bouge jamais de place.** Un repère qui se déplace n'en est plus un. |
| 3 | **Témoin d'envoi** — composant **10** | Le composant le plus important du produit. Libellés du lexique, décompte **exact**. |
| 4 | **Heure et date** | Au **fuseau de l'établissement**. Ne porte **aucune règle** — exemption « rendu de l'instant perçu ». |
| 5 | **Identité** | Nom, ce que la personne fait, et **« Passer la main »**. |

### Le second segment — ce qu'il affirme

Le détail du composant 09 porte **la commune, toujours**. Le **poste** est un segment distinct,
**affiché seulement s'il est unique**.

| Cas | Ce qui s'affiche |
|---|---|
| Un poste dérivable | `Abobo · La salle` |
| Plusieurs postes | `Abobo` — **rien de plus** |
| Aucun | `Abobo` |

> **Interdit : combler.** Ni « plusieurs postes », ni un poste choisi par défaut, ni une liste. Le
> second segment **affirme un fait** ; quand le système ne le sait pas, l'affirmer est un mensonge
> que six cycles hériteraient. **Ne rien afficher rend le manque visible**, ce qui est l'objet de la
> phase 2.

### Les trois états du sélecteur d'établissement

| État | Rendu | Règle |
|---|---|---|
| **un seul** | ni bouton, ni chevron | *Un bouton qui n'ouvre rien apprend à ne plus cliquer.* |
| **plusieurs** | bouton + chevron, liste au clic | **Deux taps** pour changer, jamais trois |
| **tous** | « Mes N établissements » | Vue d'ensemble. **Aucune surface qui modifie une caisse** |

**Le contexte ne change jamais tout seul.** Une alerte d'un autre site remonte en pastille sur le
sélecteur fermé — elle ne bascule rien. *Un changement de contexte non demandé fait saisir une
consommation sur le mauvais site.*

---

## 2. Le corps d'un écran — titre, action, retour

| Élément | Où | Règle |
|---|---|---|
| **Titre** | premier enfant du `<main>` | Un `<h1>` par écran. Le titre est **celui de l'index des écrans**, jamais une seconde chaîne |
| **Action principale** | bloc de tête, à droite | **Une seule par écran.** Ajouter trois actions faute d'avoir tranché laquelle compte viole la règle |
| **Retour** | à gauche du titre | Ramène à **l'accueil de l'établissement courant**, jamais à l'entrée précédente de l'historique |
| **`<main>`** | le gabarit le porte | **Un seul dans le document.** Une page n'en écrit jamais un second |

> **Pourquoi le retour ne suit pas l'historique.** L'entrée précédente peut appartenir à un **autre
> établissement** — M. Koffi vient de basculer. Un retour qui y ramène rouvre un site qu'on venait de
> quitter, sans le dire.

**L'accueil n'a pas de retour** : c'est la racine du produit.

---

## 3. La racine d'une page

**Une page a une seule racine, et c'est un élément.** Jamais un `v-if`/`v-else` de premier niveau.

> Une racine multiple compile en *fragment* ; un fragment dont la branche active devient un composant
> paresseux non résolu a un `el` **nul**, et Vue appelle `hostParentNode(prevTree.el)` au rendu
> suivant → `TypeError … parentNode`. **Les trois conditions doivent être réunies** ; une racine
> unique suffit à l'éliminer, **et le chargement paresseux reste intact**.

Vérifié deux fois : `tests/unite/racine-unique.spec.ts` et la règle ESLint `vue/no-root-v-if`.

---

## 4. Ce qui est absent, ce qui est présent

| Situation | Rendu | Motif |
|---|---|---|
| **Pas la permission** | **absent du HTML** | Griser donne une leçon d'organigramme sur un écran de travail, et laisse une cible actionnable autrement |
| **Service inactif ici** | **absent du HTML** | Les deux conditions se cumulent : avoir le droit ne suffit pas si le service n'existe pas ici |
| **Capacité de plateforme manquante** | **absente** + un bandeau qui dit **pourquoi** et **l'alternative** | Annoncé **avant** l'action, jamais après un échec |
| **Opération de classe B/C/D hors ligne** | **absente** + bandeau | Ni grisée, ni mise en file « au cas où ». La garde vit dans la **fonction d'appel** |
| **Écran cible non construit** | **présente, apparence exacte de F7** — l'appui dit l'écran et le cycle | Ce qui manque est **de notre côté** : l'effacer donnerait de l'écran une image fausse |

**Le test porte sur le HTML rendu, jamais sur un attribut `disabled`.**

> **La dernière ligne n'est pas une entorse aux quatre premières : c'en est le contraire exact.** Les
> quatre protègent l'utilisateur d'une action *qu'il n'a pas le droit de faire* ou *d'un service qui
> n'existe pas ici*. La cinquième couvre le cas où l'action existe, la personne y a droit, le service
> est actif — et où **c'est nous qui n'avons pas fini**. Un badge « bientôt » réintroduirait le grisé
> par la porte de derrière.

---

## 5. Le vocabulaire — ce qui n'atteint jamais l'écran

| Jamais visible | Ce qu'on écrit à la place |
|---|---|
| rôle, permission | ce qui est **possible** — l'action nommée dans les mots de l'exploitant |
| session, jeton, JWT, rafraîchissement | « appareil connecté » |
| synchronisation, file, idempotence, rejeu | « Enregistré » · « En attente d'envoi (n) » · « Connexion faible » · « Hors connexion » |
| classe hors-ligne A/B/C/D | « disponible hors connexion » · « nécessite internet » |
| dégradé | « connexion faible » |
| se déconnecter | **« Passer la main »** — *« La personne suivante devra entrer son identifiant. »* |
| code d'erreur, message de diagnostic | la clé i18n branchée sur le **code**, jamais sur le `message` |

**Aucune chaîne visible en dur.** Catalogues **fr et en à parité stricte**, fr par défaut.

**Le nom du fichier de page décide de la route, et une URL est visible** : un mot proscrit ne s'y
invite pas par la porte du nom de fichier.

---

## 6. Les valeurs — aucune littérale

Couleur, espacement, rayon, durée, courbe : **uniquement** les jetons de `@theme`. Mode sombre par la
variante `dark:`, **jamais** une seconde palette. Tailwind 4 d'abord ; CSS explicite en dernier
recours (`@keyframes`, impression thermique), regroupé.

**Deux zones de mouvement** : `charme` par défaut ; `data-zone="vitesse"` sur un écran de comptoir —
durées à 45 %, plafond 160 ms, décalage de liste supprimé, élastique remplacé par un déplacement.

**Les montants** : `format/montant.ts`, la seule fonction qui écrit un montant. **Les heures** :
`format/instant.ts`, la seule qui écrit une heure ou une date, au fuseau de l'établissement.

---

## 7. Les quatre états — dus à toute rubrique

| État | Rendu |
|---|---|
| **chargement** | squelette **à la place et à la taille exactes** du contenu à venir |
| **vide** | état vide **illustré**, disant ce qui viendra s'y loger |
| **erreur** | la rubrique seule porte son message — **les autres restent affichées** |
| **nominal** | — |

**Une rubrique qui échoue n'en emporte pas cinq.** Un accueil est composé de sources indépendantes.

**Une réponse qui arrive après un changement d'établissement ne s'affiche pas** — sinon un site
montre les chiffres de l'autre.

---

## 8. Ce que ce contrat ne fixe pas

- **La navigation transverse.** Aucune des onze maquettes ne montre de barre latérale ni de barre
  basse : la navigation passe par les surfaces de l'accueil. Si un cycle en exige une, elle s'inscrit
  à `docs/design/derivation.md` comme un **ajout à la coquille**, jamais comme une seconde grammaire.
- **Le régime mobile.** `P2` et `M4` montrent un en-tête compact avec un retour à gauche. Il sera
  fixé par le cycle qui construit un écran mobile — **F4**.
- **D'où vient le poste quand il y en a plusieurs.** Le modèle ne le porte pas. **F4**.
