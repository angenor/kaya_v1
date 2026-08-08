# Contrat — les parcours, leur budget de gestes, et comment il rougit

**Cycle** : F3 · **Exigences** : FR-070 à FR-073 · **Porte** : **P-04**, aucune porte nouvelle

> ⚠️ **Un objectif qu'aucune porte ne mesure est un souhait.** Les trois objectifs du cahier des
> charges — 30 s pour un passage, 60 s pour un client connu, un total provisoire instantané — sont
> ici des **assertions de test**, exactement comme l'isolation multi-tenant ou la parité des
> catalogues.

---

## 1. Le barème de conversion — déclaré une fois, en un seul endroit

`app/core/reception/gestes.ts` porte ces cinq valeurs, et **rien ne les recopie** :

| Unité | Durée | Motif |
|---|---|---|
| `TAP` | **1 200 ms** | pointage + appui sur une cible ≥ 44 px, debout, une main occupée par une clé |
| `FRAPPE` | **500 ms** | saisie à un doigt au clavier tactile, chiffres et lettres confondus |
| `DECISION` | **1 200 ms** | choix devant plus de deux options — la durée, la chambre, le mode |
| `LECTURE` | **1 000 ms** | orientation devant un écran nouveau, avant le premier geste |
| `ATTENTE` | comptée **à part** | ce n'est pas un geste — et c'est ce qui la rend traitable séparément |

⚠️ **La parole échangée avec le client n'est pas dans le modèle.** Elle est incompressible et se
superpose aux gestes ; l'y inclure ferait dépendre le budget d'un facteur que le produit ne pilote
pas.

⚠️ **Ce fichier n'est pas du produit.** Il est lu par les tests et par le rapport de cycle, jamais
par un écran. Il s'inscrit à `docs/points-entree.md` comme **exercé par le navigateur**.

---

## 2. Les huit budgets, tels que le test les assert

| # | Parcours | Taps | Frappes | Déc. | Lect. | Gestes | Attente | Cible |
|---|---|---|---|---|---|---|---|---|
| **P1** | Passage anonyme, chambre proposée | **3** | **0** | 1 | 2 | 6,8 s | — | **30 s** |
| **P1b** | Passage, chambre changée d'un tap | 4 | 0 | 2 | 2 | 9,2 s | — | 30 s |
| **P2** | Passage, client reconnu au téléphone | 5 | 10 | 1 | 2 | 14,2 s | — | **60 s** |
| **P3** | Arrivée nuitée, **client connu** | 7 | 10 | 3 | 1 | 18,0 s | — | **60 s** |
| **P4** | Arrivée nuitée, **client inconnu** | 13 | 50 | 4 | 1 | 46,4 s | — | *aucune* |
| **P5** | Ouvrir une note, lire le **total** | **1** | 0 | 0 | 1 | 2,2 s | **0** | *instantané* |
| **P6** | Départ, issue **succès** | 5 | 0 | 1 | 1 | 7,0 s | 5–10 s | — |
| **P7** | Départ, issue **échec**, corrigé | 7 | 13 | 1 | 2 | 16,0 s | 10–20 s | — |
| **P8** | Départ, issue **indéterminée** | 6 | 0 | 2 | 2 | 11,6 s | 10 s | — |

**Les budgets assertés sont les taps et les frappes**, pas les secondes : les décisions et les
lectures sont des propriétés de l'humain, pas de l'écran, et un test ne peut pas les compter. Les
secondes s'en déduisent par le barème, et servent le rapport.

---

## 3. Comment le compteur fonctionne

`tests/navigateur/gestes.ts` enveloppe la page Playwright et compte **ses propres actions** :

```text
compteur.tap(cible)        → +1 tap,     puis page.click(cible)
compteur.frapper(sel, txt) → +N frappes, puis page.fill(sel, txt)   (N = txt.length)
compteur.attendre(cond)    → +0 geste,   chronométré à part
compteur.verifier(budget)  → assertion : taps ≤ budget.taps ET frappes ≤ budget.frappes
```

⚠️ **Le test ne peut pas tricher en agissant sans passer par le compteur** : un appel direct à
`page.click` échoue au lint — la règle ESLint existante *« aucune API de plateforme hors
`PlatformAdapter` »* a son pendant ici, une règle qui interdit `page.click` et `page.fill` hors du
compteur dans `tests/navigateur/`. *Sans elle, le budget se contournerait par distraction, et le
test resterait vert en ne testant plus rien.*

⚠️ **Le compteur ne mesure pas le temps de la machine.** Un poste rapide masquerait un parcours
long, un poste lent ferait rougir sans défaut. **Ce qui est compté est ce que l'utilisateur fait**,
et c'est la seule grandeur qui se transporte du poste de développement au comptoir d'Abengourou.

---

## 4. Ce qui fait rougir P-04, nommément

| Cause | Message attendu |
|---|---|
| Un tap ajouté au parcours du passage | `P1 : 4 taps pour un budget de 3 — le geste ajouté est …` |
| Un champ rendu obligatoire avant la clé | `P1 : 20 frappes pour un budget de 0` |
| Un bouton de soumission ajouté à `R4` ou `R3` | même effet, **et c'est voulu** : l'interdiction de FR-001 devient mesurable au lieu d'être une consigne |
| Le total absent du premier rendu | `P5 : total absent après 0 geste` — assertion distincte, **avant** tout clic |

⚠️ **P5 est asserté différemment des sept autres** : ce n'est pas un budget de gestes mais une
**absence d'état intermédiaire**. Le test lit le DOM **au premier rendu utile** et exige le total ;
il vérifie aussi qu'aucun bouton portant une action de calcul n'existe dans la page.

---

## 5. Pourquoi aucune porte nouvelle

Le principe 13 veut que le noyau grossisse **à la demande, pas par anticipation**. Ce contrôle a
besoin d'un navigateur réel, sur deux moteurs, avec l'application démarrée — **exactement le
périmètre de P-04**, qui paie déjà ce démarrage. Une porte « ergonomie » dupliquerait ce coût pour
trois assertions, et le temps de la commande unique est déjà au-delà de son repère.

**Ce que P-04 gagne, et qui reste dans son périmètre déclaré** : huit parcours comptés, en
**Chromium et WebKit**, en clair **et** en sombre — les mêmes quatre suites, avec des assertions de
plus.

**Test négatif de l'extension** *(la porte en a déjà un ; celui-ci couvre ce que ce cycle ajoute)* :
**ajouter un tap** au parcours du passage dans une copie de travail — un bouton « Confirmer » entre
la durée et l'enregistrement — **doit faire rougir P-04 en nommant P1 et le budget dépassé**. Si la
porte reste verte, c'est la porte qui a tort, pas le modèle : code de sortie **4**.
