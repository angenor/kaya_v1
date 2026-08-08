# Quickstart — dérouler le cycle F3 à la main

**Ce que ce document prouve** : *« enregistrer un passage de 4 h en moins de 30 s, ouvrir une note,
voir le planning à granularité horaire, faire un départ »* — la démonstration de fin de cycle
(`docs/user-stories-v1.md` §0.5).

**Ce qu'il ne remplace pas** : la porte **P-04**, qui exécute les mêmes parcours sur **deux moteurs**
et **deux thèmes**, et qui compte les gestes. Ce document sert à **voir**, la porte sert à **prouver**.

---

## Prérequis

```sh
pnpm install
pnpm dev            # http://localhost:3000
```

**Aucun conteneur, aucun service distant, aucune base.** Si l'un des trois est nécessaire pour
dérouler ce document, c'est un défaut du cycle, pas de la machine.

---

## A · Le passage en trois taps — l'objectif des 30 secondes

1. Ouvrir **`/`**. L'accueil de Yao s'affiche.
2. Toucher l'activité **« Hébergement »** → **`/jour`**, la vue du jour.
3. Toucher **« Donner une chambre »** → **`/passage`**.
4. L'écran demande **une seule chose** : *« Combien de temps ? »*. Quatre boutons, **le prix sur
   chacun**, l'heure de fin dessous. Une chambre est **déjà proposée**.
5. Toucher **« 2 h »**.

**Ce qu'on doit voir** — et si l'un des sept manque, le parcours est faux :

- [ ] La chambre et **l'heure de fin en très grand** — les deux plus gros éléments de la page.
- [ ] **« encaissé en espèces »** : le tap a donné la chambre **et** pris l'argent.
- [ ] Un **bandeau d'annulation en surimpression**, **8 secondes**, jamais dans le flux.
- [ ] La mention **« Pièce à compléter avant la fermeture de la caisse »**.
- [ ] La chambre **passe à « Donnée » dans la grille de droite**, sans rechargement.
- [ ] **Aucun bouton de soumission** nulle part dans le parcours.
- [ ] **Aucune ligne de taxe de séjour** — le passage n'y est pas assujetti.

**Compter** : **3 taps, 0 frappe**. C'est le budget, et P-04 le vérifie.

> Toucher **« Annuler »** dans les 8 s : la chambre **redevient libre**, l'encaissement est défait,
> le séjour et la note disparaissent. **Les cinq effets, pas un seul.**

---

## B · Le client reconnu — l'objectif des 60 secondes

1. Depuis `/passage`, toucher **« Saisir · téléphone »**, taper `0708441290`.
2. La fiche remonte **sans validation** : *« M. Bakayoko — 7ᵉ passage »*, sa pièce **déjà
   enregistrée**, et **sa chambre habituelle proposée** avec le motif.
3. Toucher **« 3 h »**.

- [ ] **Rien n'a été ressaisi.**
- [ ] **« Ce n'est pas lui »** défait la reconnaissance **en un tap**.

**Compter** : **5 taps, 10 frappes**.

---

## C · Le refus de disponibilité — il doit nommer le conflit

1. Aller à **`/planning`**, repérer la **chambre 111**, prise de 15 h à 12 h le lendemain.
2. Revenir à `/passage`, choisir **111** dans la grille, demander **14 h → 17 h**.

- [ ] Le refus dit **« Cette chambre est déjà prise sur cette période. »**
- [ ] Il **nomme la période qui bloque**.
- [ ] Il **liste les chambres libres de la même catégorie**.
- [ ] **Aucune occupation n'a été créée** — vérifiable en revenant au planning.
- [ ] Les mots *conflit*, *chevauchement*, *occupation*, *intervalle* **n'apparaissent nulle part**.

3. Recommencer sur une chambre **qui vient de se libérer**, dans sa **demi-heure de ménage**.

- [ ] Le refus le nomme : **« Chambre indisponible 30 min (ménage) »** — c'est le refus qu'on
      oublie, parce que la chambre *paraît* libre.

---

## D · Le planning horaire — ce qui le distingue de tout planning hôtelier

Aller à **`/planning`**.

- [ ] Un **passage de 3 h** et une **nuitée** du même jour sur la même chambre sont **tous deux
      lisibles** — le passage n'est pas absorbé par la case du jour.
- [ ] Une **demi-journée** se lit de 8 h à 13 h.
- [ ] Les **temps de remise en état** sont visibles, hachurés, entre deux occupations.
- [ ] Un **trait rouge** marque *maintenant*.
- [ ] Les **heures occupées sont plus larges** que les nuits mortes ; les jours lointains sont
      repliés.

Basculer sur la **semaine dense** *(levier de `/_scenarios`)* : **34 occupations**.

- [ ] Même largeur, et **aucune barre muette** sans être signalée.
- [ ] En **mode sombre** : les quatre familles restent distinguables **par la forme**, pas seulement
      par la teinte.

Toucher une barre → la note ou le séjour s'ouvre, **sans écran intermédiaire**.

---

## E · Le total provisoire — instantané, littéralement

Depuis l'accueil, toucher **« Encaisser le départ »** → **`/depart`**.

- [ ] Le **total est déjà là**, au premier rendu. **Aucun bouton « calculer » n'existe.**
- [ ] Faire défiler les 13 lignes : **le total reste visible** — pied épinglé.
- [ ] Les lignes sont **groupées par service**, chacune avec **son sous-total**.
- [ ] La **taxe de séjour est une ligne distincte**, et elle vaut **500 F** pour 4 nuits et
      2 personnes. ⚠️ **La maquette affiche 4 000 F : c'est la valeur d'avant la décision B-10, et
      elle est fausse.**
- [ ] La mention **« Document non fiscal — ne tient pas lieu de facture »** est au pied.

Ouvrir **`/clients`**, puis une fiche :

- [ ] L'historique des séjours est là, et **aucun total** — un cumul ressemblerait à un solde.

---

## F · Le départ, et les trois issues — le client est debout

Depuis `/depart`, toucher **« Faire partir le client »**.

1. **Succès** *(réglage par défaut)*
   - [ ] Pendant l'attente, l'écran dit **combien de temps cela prend** et **ce qui est déjà acquis**
         — argent encaissé, note arrêtée, chambre libérée.
   - [ ] Le numéro officiel revient ; **la mention « document non fiscal » disparaît**.

2. **Échec** *(`/_scenarios` → issue de l'envoi fiscal → échec)*
   - [ ] **Le motif est en clair** — le numéro de contribuable a douze chiffres au lieu de treize.
   - [ ] Le détail technique est **en second plan**, jamais la phrase principale.
   - [ ] **Deux issues praticables** : corriger et renvoyer, ou émettre sans le numéro.

3. **Indéterminé** *(même levier, troisième position — butée à 10 s)*
   - [ ] *« Nous ne savons pas si les impôts ont reçu cette facture »*.
   - [ ] **Aucun renvoi automatique**, et **aucun bouton « réessayer »** — l'absence est le contrat.
   - [ ] Le rapprochement manuel est **nommé**, sans être ouvert : il est du cycle F6.

Dans les trois cas :

- [ ] **« La note est arrêtée »** et l'état du règlement sont **deux phrases distinctes**.
- [ ] **« Laisser partir le client »** est possible sans attendre le numéro.

---

## G · Hors ligne — l'action est absente, pas grisée

`/_scenarios` → levier **hors ligne**.

- [ ] Le témoin passe à **« Hors connexion »**, **instantanément, sans transition**.
- [ ] **Avant tout geste**, l'écran a changé : **« Donner une chambre » n'est plus dans le HTML**.
- [ ] La phrase est celle du lexique : **« Cette action nécessite internet. »** — et elle dit **ce
      qu'on peut faire à la place**.
- [ ] `/planning`, `/depart` et `/clients` **restent consultables**, avec **leur fraîcheur affichée**.
- [ ] Ajouter un **accompagnant** ou changer un **statut ménage** : **accepté**, entre dans la file.
- [ ] Créer une **fiche client** : **refusée**, pour un motif **qui n'est pas celui d'une classe B**.
- [ ] **Rien n'est grisé. Rien n'est mis en file « au cas où ».**

---

## H · Le dépassement de durée — le tarif suit tout seul

`/_scenarios` → jeu « passage dépassé » → ouvrir le départ du passage concerné.

- [ ] La note porte **la ligne de rebascule avec son motif** : « Durée dépassée : passé au tarif 4 h ».
- [ ] **L'ancienne ligne reste visible.**
- [ ] Au-delà du **seuil de 480 min**, l'écran **annonce la bascule en nuitée avant de l'appliquer**,
      avec le montant, et **attend une confirmation**.

---

## I · Les états, sur chaque écran du cycle

| État | Levier | Ce qu'on doit voir |
|---|---|---|
| **Vide** | jeu vide | Composant **11**, motif de contreforts ocre, **une phrase et l'action qui démarre** — jamais une impasse |
| **Tout est pris** | jeu « complet » | **Ce qui se libère et quand**, et **« Garder la chambre »**, tenue **15 min**, relâchée seule |
| **Chargement** | latence | Composant **13**, à la **forme exacte** du contenu — le planning montre ses lignes, pas une roue |
| **Erreur** | échec réseau | Composant **07** : ce qui s'est passé, pourquoi, l'action suivante. **Jamais deux bandeaux empilés** |
| **Hors ligne** | hors ligne | §G ci-dessus |

---

## J · Enfin, la seule commande qui valide

```sh
scripts/verifier.sh
```

⚠️ **Ce document ne remplace pas cette commande, et la commande ne remplace pas ce document.**
Le script prouve ; ce document montre. Ce qu'il montre et que la porte ne voit pas — la lisibilité
d'une barre de trois heures sur un écran délavé par le soleil, la fluidité perçue d'un tap — se
consigne au **rapport de cycle**, jamais dans un commentaire de code.
