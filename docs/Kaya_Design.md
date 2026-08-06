# Kaya — Design (référence)

> ### 🔄 Trois changements du 2026-08-06
>
> **1. La doctrine d'écran est assouplie — voir §2 bis.** La règle « un écran qui n'hérite d'aucun
> motif ne se code pas » est remplacée par **quatre cas**, dont le quatrième autorise l'écran
> découvert à l'implémentation, à condition qu'il s'inscrive à la matrice dans le même changement.
> Un cycle ne s'arrête plus sur un écran manquant ; il ne s'arrête plus que sur un **composant**
> manquant.
>
> **2. L'interface se construit AVANT le backend, sur des données simulées** (cadrage §13.0). Ce
> document ne change pas de statut pour autant : il reste ce qui est opposable à l'implémentation,
> et c'est même maintenant qu'il sert le plus.
>
> **3. La cible est une PWA, plus une coquille Tauri** (cadrage §13.3). Les contraintes de la
> partie III sont **inchangées** — le matériel visé, le contraste, les cibles tactiles et le budget
> d'animation ne dépendent pas de la technologie de la coquille.
>
> ✅ **Ce qui ne change pas du tout : les maquettes produites.** `docs/design/` est complet et fait
> foi. Rien n'est à refaire.

> 📦 **Allégé le 2026-08-06 : les prompts de maquettage ont été retirés.**
> La maquette est produite et déposée dans `docs/design/` — les prompts qui ont servi à
> l'obtenir n'avaient plus de lecteur. Ce fichier ne garde que ce qui reste **opposable au
> développement** : principes, spécification de simplicité, contraintes de fondation, zones,
> motifs posés, validation et garde-fous. Les valeurs exactes sont dans les fichiers produits,
> qui font foi (`tokens.md`, `mouvement.md`, `composants.md`, `lexique.md`, `derivation.md`).

> ⚠️ **Décompte de composants : ce fichier disait « 14 », et c'était vrai au maquettage.**
> Il y en a **seize** au 2026-08-02 — le n° 15 (barre de proportion) et le n° 16 (champ de
> saisie, composé depuis les tokens faute de maquette). `docs/design/composants.md` **fait foi**
> sur le nombre ; les mentions « 14 » subsistantes sont des constats d'époque.

*Compagnon du Cadrage v1 et des User Stories v1.*
*Version 2.1 — Remplace `Kaya_Prompts_Design.md`, `Kaya_Design_Personnalite_Mouvement.md` et `Kaya_Design_Plan_Resserre.md`, qui peuvent être archivés.*

---

# PARTIE I — PRINCIPES

## 1. Le principe des deux zones

Ce produit a deux régimes, et les confondre est la seule vraie erreur possible.

| | **Zone de charme** | **Zone de vitesse** |
|---|---|---|
| Écrans | Accueil, tableau de bord propriétaire, états vides, réussites, onboarding, planning, configuration | Check-in passage, prise de commande, encaissement, clôture bloquée, écrans fiscaux, réconciliation |
| Objectif | Créer l'attachement, donner envie d'ouvrir l'application | Ne jamais faire perdre une seconde ni une attention |
| Mouvement | Généreux, expressif, illustré | Instantané, fonctionnel, discret |
| Ton | Chaleureux, complice, vivant | Direct, clair, respectueux |

**La règle qui tranche** : si l'utilisateur est debout, pressé, avec un client en face de lui ou de l'argent en jeu — zone de vitesse. Sinon — zone de charme.

Une animation en zone de vitesse n'est pas interdite ; elle doit être **décorative et jamais bloquante**. L'état change instantanément, l'animation habille le changement déjà fait. Jamais l'inverse.

## 2. Ce qu'on maquette, et pourquoi

On ne maquette pas un écran parce qu'il est important. **On maquette un écran parce qu'il pose un motif que d'autres reprendront, ou parce que sa conception n'est pas résolue.**

| On maquette si… | On code directement si… |
|---|---|
| L'interaction n'est pas résolue — il y a un vrai problème à trancher | C'est une liste, un formulaire ou une fiche suivant un motif déjà posé |
| L'écran est copié par cinq autres | Sa conception découle entièrement de la bibliothèque de composants |
| Il décide de l'adoption (fréquence ou enjeu) | Il est consulté rarement, par un utilisateur formé |
| Il doit être confronté au terrain | Personne n'a de doute sur ce à quoi il ressemble |

**La maquette est produite** — la fondation, 11 écrans maquettés en 29 fichiers d'états, les prototypes animés, les documents imprimés. Elle est dans `docs/design/` et **elle ne se refait pas** : c'est l'entrée du développement de l'interface, pas son livrable.

Le risque de coder sans maquette n'est pas la laideur, c'est la **dérive** : trente écrans inventés un par un finissent par ne plus se ressembler. La matrice de dérivation est ce qui l'évite.

### 2 bis. Les quatre cas où un écran se code *(assoupli le 2026-08-06)*

> ⚠️ **Ce paragraphe remplace une règle qui disait « un écran qui n'hérite d'aucun motif ne se
> code pas ». Elle était fausse, et coûteuse.**
>
> Elle supposait que les documents avaient tout prévu. Ils n'ont pas tout prévu, et ils ne le
> peuvent pas : c'est en construisant un parcours qu'on découvre qu'il manque un écran pour le
> terminer — la table fermée d'un QR scanné, la confirmation d'une action irréversible, la reprise
> après une erreur. **Arrêter le cycle à cet endroit-là, c'est arrêter le travail pour produire un
> document, alors que l'écran manquant est souvent évident.**

| Cas | Ce que c'est | Référence citée |
|---|---|---|
| **a — Maquetté** | L'un des 11 écrans dessinés | le fichier d'état exact de `docs/design/html/` |
| **b — Dérivé** | Il hérite d'un motif maquetté | sa ligne de `docs/design/derivation.md` |
| **c — Composé** | Assemblé **uniquement** à partir des seize composants canoniques, en **zone de charme** | sa ligne de `derivation.md`, avec les composants employés |
| **d — Découvert à l'implémentation** | Les documents ne l'avaient pas prévu, et sans lui un parcours ne se termine pas | **son inscription à `derivation.md`, faite dans le même changement** |

**Le quatrième cas est autorisé et n'arrête pas le cycle.** Trois obligations, qui tiennent en une
tâche :

1. il n'emploie que les **composants, tokens et termes du lexique existants** ;
2. s'il tombe en **zone de vitesse** (§1), il se code quand même mais il est **signalé « à
   maquetter avant le pilote »** — un écran de comptoir porte une intention dessinée qu'un
   assemblage ne retrouve pas ;
3. il **s'inscrit à `docs/design/derivation.md` dans le même changement**, avec la mention
   « découvert à l'implémentation, à valider » et la liste des composants employés.

> **Ce qu'on refuse n'est pas d'inventer un écran, c'est de l'inventer EN SILENCE.** La dérive ne
> vient pas de l'écran manquant qu'on ajoute ; elle vient des trente écrans que personne n'a
> inscrits nulle part et qui, six mois plus tard, ne se ressemblent plus. L'inscription coûte deux
> lignes ; l'arrêt du cycle coûtait une demi-journée et une décision différée.

**Une seule chose arrête encore un cycle : un COMPOSANT qui manque à la bibliothèque.** Un écran
s'assemble, un composant se dessine. Si un motif d'interaction nouveau est requis — un contrôle
qu'aucun des seize ne sait rendre —, le cycle s'arrête et le signale. C'est la frontière juste :
elle porte sur le vocabulaire, pas sur les phrases qu'on en fait.

## 3. Conventions

Les prompts Spec Kit référencent `docs/design/html/{code}`. Le code est **stable et ne change jamais** — il apparaît dans les tâches, les commits et les revues.

| Préfixe | Domaine |
|---|---|
| `R` | Réception et hébergement |
| `P` | Point de vente |
| `C` | Caisse |
| `F` | Fiscalité et documents |
| `G` | Configuration et administration établissement |
| `S` | États système |
| `M` | Mobile |
| `Q` | Surface publique QR |
| `V` | Réservations et planning |
| `E` | Console éditeur |
| `D` | Documents imprimés |

Export par écran : `html/{code}-{nom-lisible}.html` (référence), plus les captures dans `png/` (revue). États suffixés : `R4-passage-hors-ligne.html`, `C4-cloture-bloquee.html`.

**Le préfixe de code est obligatoire** — c'est lui que référencent les prompts Spec Kit, la matrice de dérivation et les tâches. Le nom lisible suit, pour l'humain. Correspondance complète avec les maquettes produites : §30 bis.

**Format d'export — le HTML est la référence normative.**

L'export HTML est ce que lit l'agent d'implémentation : il y trouve les **valeurs exactes** (couleurs, espacements, tailles, rayons, durées d'animation) et la **hiérarchie DOM**, au lieu de les estimer depuis une image. Sur les prototypes animés, les courbes et durées se lisent directement dans le CSS.

Le PNG reste produit, pour l'humain : revue rapide, impression A3 de l'atelier terrain d'Abengourou, comparaison visuelle avant/après.

| Fichier | Pour qui | Statut |
|---|---|---|
| `html/{code}.html` | **L'agent d'implémentation** | **Référence normative** |
| `png/` (captures d'écran des HTML) | L'humain — impression A3 de l'atelier | Confort de revue, produit à la demande |

> ### ⚠️ Trois règles, sans lesquelles le HTML se retourne contre toi
>
> **0. Tailwind d'abord, CSS en dernier recours.** La maquette cible un projet Nuxt 4 + Tailwind 4 : plus elle est écrite en utilitaires Tailwind, plus la transposition est directe. Voir §3 bis.
>
> **1. Le HTML de maquette n'est JAMAIS copié dans `app/` — à une exception près : `theme.css`.** Le bloc `@theme` est précisément fait pour être transplanté ; c'est lui qui porte les tokens. Tout le reste (markup, styles d'écran) est une *cible*, pas une *source*. L'export est autonome, non sémantique, sans i18n, sans gestion de rôles, sans mode sombre câblé, avec des styles en ligne. Le copier produit des composants inmaintenables qui divergeront au premier changement. **On le lit, on ne le colle pas.**
>
> **2. `tokens.md` est extrait UNE SEULE FOIS du HTML, puis prime sur lui.** Sans cette règle, chaque composant re-dérive ses valeurs depuis un fichier différent et tu obtiens quatorze nuances de gris. En cas de divergence entre un export et `tokens.md`, `tokens.md` gagne — et l'export est corrigé.
>
> **3. Un état = un fichier.** `R4.html`, `R4-hors-ligne.html`, `R4-erreur.html`. Un HTML montre naturellement un seul état ; ce que le PNG rendait évident par la multiplication des images doit rester explicite ici.

---

## 3 bis. Tailwind d'abord — règles d'écriture

La maquette n'est pas un exercice de style libre : c'est la **spécification d'une implémentation Nuxt 4 + Tailwind 4**. Chaque écart entre son vocabulaire et celui du projet est du travail de traduction, donc une occasion de divergence.

| Ordre de préférence | Quoi | Exemple |
|---|---|---|
| **1. Utilitaires Tailwind du noyau** | Tout ce qui est exprimable ainsi | `bg-surface p-4 rounded-lg text-sm` |
| **2. Tokens déclarés en `@theme`** | Couleurs, espacements, rayons, polices du produit | `--color-surface: #…` → `bg-surface` |
| **3. Variantes Tailwind** | Mode sombre, états, points de rupture | `dark:bg-surface-dark hover:… md:…` |
| **4. CSS explicite** | Uniquement ce que Tailwind n'exprime pas | `@keyframes`, styles d'impression thermique, grilles complexes |

**Les quatre règles :**

1. **Le mode sombre passe par la variante `dark:`**, jamais par une seconde feuille de style ni une palette dupliquée. C'est ce qui rend la transposition mécanique.
2. **Les valeurs arbitraires (`w-[347px]`, `text-[#3a3a3a]`) sont un signal, pas une solution.** Elles veulent dire qu'une valeur manque à l'échelle de tokens. Tolérées en maquette, elles doivent être **listées** pour qu'on décide : soit la valeur entre dans `@theme`, soit on s'aligne sur l'échelle existante.
3. **Aucun nom de classe personnalisé** qui exigerait une feuille de style séparée en production. Si un composant se répète, c'est un composant Nuxt, pas une classe CSS.
4. **Le CSS résiduel est regroupé et commenté**, jamais dispersé en styles en ligne. On doit pouvoir répondre en dix secondes à : « qu'est-ce qui n'a pas pu se faire en Tailwind, et pourquoi ? »

> ⚠️ **Un piège à connaître** : la maquette charge Tailwind par CDN, qui génère les utilitaires à la volée. Le build Nuxt, lui, ne compile que ce qu'il trouve dans les sources. Une classe qui fonctionne dans la maquette peut donc être absente en production si elle vient d'un plugin ou d'une version différente. **S'en tenir au noyau Tailwind 4**, et vérifier au cycle 1 que le styleguide s'affiche à l'identique dans le projet réel.

**Livrables :**

```
docs/design/                        ← ÉTAT RÉEL DU DÉPÔT
├── theme.css          # bloc @theme Tailwind 4 — SEUL fichier copié dans app/
├── tokens.md          # valeurs curées, clair ET sombre — PRIME sur tout export
├── composants.md      # les composants canoniques et leurs états — FAIT FOI
├── mouvement.md       # durées, courbes, sept patrons
├── styleguide.html    # les composants dans tous leurs états, clair + sombre
├── README.md          # ce qui se copie, ce qui se lit, valeurs arbitraires en attente
├── lexique.md         # ✅ vocabulaire utilisateur — NORMATIF
├── derivation.md      # ✅ quel écran hérite de quel motif — NORMATIF
├── html/              # 29 fichiers — RÉFÉRENCE NORMATIVE, un par écran ET par état
│                      #   Nommage : {code}-{nom-lisible}[-{etat}].html
│                      #   Lu par l'agent, JAMAIS copié dans app/
├── fondation/         # fondation-directions, -mouvement, -plaisir, -difficiles,
│                      #   -illustrations
├── documents/         # D1-D5-tickets-thermiques, D6-note-provisoire,
│                      #   D7-facture-fiscale
├── proto/             # proto-0-sommaire à proto-6-indicateur-sync
└── notes-terrain.md   # ⚠️ à remplir à l'atelier d'Abengourou
```

## 4. Séquencement

| Phase | Contenu | Quand |
|---|---|---|
| Fondation | Directions visuelles, palettes, typographie, composants, mouvement | Phase 0, S1 — ✅ fait |
| Les 10 cibles | Production groupée par familles | Phase 0, S1–S2 — ✅ fait |
| Illustrations | Famille d'états vides et d'onboarding | Phase 0, S2 — ✅ fait |
| Prototypes animés | Les 6 de la partie VI | Phase 0, S2 — ✅ fait |
| **Validation terrain** | **Atelier d'Abengourou, protocole partie VIII** | **à faire — et le jalon J0 du cadrage §16 en est le bon moment** : l'application entière tourne alors sur données simulées, donc les tests chronométrés se font sur le produit réel plutôt que sur des impressions A3 |
| Corrections | Reprise des cibles selon les retours | Phase 0, S3 |
| Documents imprimés | Les 7 modèles | Produits ; à confronter au matériel avant le cycle IMP |

---

# PARTIE II — SPÉCIFICATION DE SIMPLICITÉ

> Cette partie a le même statut normatif que le cadrage. Un écran qui viole une de ces règles ne passe pas la revue, qu'il soit maquetté ou codé directement.

## 5. Les neuf règles

**1. Une action principale par écran.** Un seul bouton porte le poids visuel dominant. S'il y en a deux, l'écran fait deux choses et doit être scindé. S'il n'y en a aucun, c'est un écran de consultation et il doit l'assumer.

**2. Trois décisions maximum sur un écran fréquent.** Le check-in passage demande : quelle durée, quelle chambre, on valide. Trois. Tout ajout doit justifier son coût. Sur un écran rare — la configuration — la limite ne s'applique pas.

**3. Reconnaître plutôt que se souvenir.** L'utilisateur ne mémorise jamais un code, un numéro de chambre, un tarif, un état. Tout ce dont il a besoin est visible au moment où il en a besoin. Corollaire : aucun champ ne demande une information déjà présente dans le système.

**4. Des valeurs par défaut justes neuf fois sur dix.** Une chambre est proposée automatiquement. La formule la plus vendue est présélectionnée. La date est aujourd'hui. L'établissement est celui de la dernière session. Un défaut juste supprime une décision ; un défaut faux en crée deux.

**5. Annuler plutôt que confirmer.** Une modale de confirmation est un aveu : le produit ne sait pas revenir en arrière. Sur les actions réversibles — supprimer une ligne non envoyée, changer de chambre, modifier une quantité — l'action se fait immédiatement, avec une possibilité d'annuler pendant quelques secondes. La confirmation reste réservée à l'irréversible : certification fiscale, clôture, avoir, encaissement.

**6. Zéro jargon.** Voir `docs/design/lexique.md`. Aucun terme technique, aucun sigle non expliqué, aucun mot que la gérante d'un maquis ne dirait pas spontanément. Le vocabulaire fiscal officiel apparaît uniquement sur les documents légaux, jamais dans les boutons ni les messages.

**7. Une erreur dit toujours quoi faire ensuite.** Trois éléments obligatoires : ce qui s'est passé, pourquoi, l'action suivante. Une erreur sans porte de sortie est un défaut de conception, pas un message à réécrire. Et elle n'accuse jamais l'utilisateur.

**8. Rien d'indispensable derrière un geste non découvrable.** Pas de balayage secret, pas d'appui long comme unique accès, pas de menu contextuel obligatoire. Les raccourcis existent, ils ne sont jamais le seul chemin.

**9. Un écran vide propose toujours une porte de sortie.** Aucune réservation aujourd'hui → « créer une réservation ». Aucun document en attente → un mot rassurant. Un écran vide sans action est une impasse.

## 6. Lexique — ce que l'utilisateur lit

> 📦 **Déplacé le 2026-07-30 vers `docs/design/lexique.md`, qui fait désormais foi.**
> Le tableau n'est pas dupliqué ici, pour la même raison qu'en partie V.

Le produit manipule des concepts fiscaux et techniques réels. **L'utilisateur ne doit jamais
les rencontrer sous leur nom d'origine.** Les 15 correspondances — « certification FNE » →
« envoi aux impôts », état `INDETERMINEE` → « nous ne savons pas si les impôts ont reçu cette
facture » — sont dans `docs/design/lexique.md`, avec la procédure d'ajout d'une entrée.

## 7. Les cinq tests

À faire passer à chaque cible maquettée, et à chaque écran dérivé avant sa fusion.

| Test | Protocole | Échec si |
|---|---|---|
| **Cinq secondes** | Montrer l'écran cinq secondes, le masquer, demander : à quoi sert-il ? quelle est l'action principale ? | La personne ne sait pas répondre |
| **Première fois sans formation** | Donner une tâche à quelqu'un qui n'a jamais vu le produit, sans un mot d'explication | Il faut intervenir |
| **Chronomètre** | Mesurer la tâche sur les écrans fréquents | Passage > 45 s · commande de 6 lignes > 60 s · clôture > 20 min |
| **Le cahier** | Adjoua fait la même tâche sur le logiciel et sur son cahier | Le cahier gagne |
| **Huit heures** | Faire tourner les animations répétitives en boucle dix minutes | On veut les couper |

**Le test du cahier est le juge de paix.** Ce produit ne concurrence pas un autre logiciel, il concurrence un objet en papier que le personnel maîtrise parfaitement depuis des années. Tant qu'une tâche est plus rapide sur le cahier, elle est mal conçue — quelle que soit la beauté de l'écran.

---

# PARTIE III — FONDATION

> Les prompts qui ont produit cette fondation sont retirés. Ce qui suit est ce qui reste
> opposable : les contraintes qui gouvernent aussi le code, pas seulement la maquette.
> Les valeurs sont dans `tokens.md`, `mouvement.md` et `composants.md`.

## 8. Contraintes non négociables

Elles ont gouverné la fondation et gouvernent toujours l'implémentation.

1. **Mode sombre dès maintenant.** Deux palettes complètes, pas une palette et un filtre. Le sombre sert le bar le soir, le clair sert la réception le jour.
2. **Français par défaut, anglais prévu.** Dessiner avec les libellés français, les plus longs. Aucun bouton dont la largeur est calée sur son texte.
3. **Montants en franc CFA** : entiers, jamais de décimale, séparateur de milliers par espace fine, de 500 à 500 000. Typographie tabulaire pour l'alignement des colonnes.
4. **Contraste** : la réception est en plein soleil. WCAG AA minimum, AAA sur les montants et les statuts. Aucune information portée par la seule couleur.
5. **Cibles tactiles** : 48 px minimum sur mobile, 40 px sur desktop tactile.
6. **Performance** : Android d'entrée de gamme. Tout le mouvement en `transform` et `opacity` uniquement, jamais en propriétés déclenchant un recalcul de mise en page. Budget : 60 images/s tenues sur un appareil à 2 Go de RAM.
7. **Simplicité** : les neuf règles de la partie II.

**Matériel réel visé** : poste de réception Windows d'entrée de gamme, 1366×768, souvent en plein soleil ; Android d'entrée de gamme 5,5" pour la serveuse, utilisé debout, à une main, en lumière faible.

**Direction visuelle retenue** : ancrage ouest-africain **structurel** — rythme, proportions, saturation — jamais décoratif ni folklorique. Voir `fondation/fondation-directions.html`.

**Composants canoniques** : `docs/design/composants.md` fait foi (16 au 2026-08-02), et `styleguide.html` les montre dans tous leurs états, clair et sombre. Quatre méritent une vigilance particulière parce qu'ils sont vus des centaines de fois par jour ou portent une règle produit : le **sélecteur de durée** (le geste le plus répété), l'**indicateur de synchronisation** (permanent à l'écran), le **sélecteur de contexte** (établissement et poste actifs, bascule en deux taps) et la **navigation composable** (les modules absents n'existent pas, ils ne sont pas grisés).

## 9. Système de mouvement

Défini une fois, appliqué partout. Valeurs exactes dans `docs/design/mouvement.md` ; sensation dans `proto/`.

**Les sept patrons** — apparition d'une liste (décalage progressif **plafonné**) · transition entre écrans (direction porteuse de sens) · ouverture du panneau latéral · changement de valeur d'un montant (le geste le plus répété : perceptible et satisfaisant) · retour tactile sur un bouton · changement d'état d'un badge · état de chargement (squelettes plutôt que roues, sauf attente réseau réellement indéterminée).

**Le réglage d'intensité** : le même patron s'exprime généreusement en zone de charme et réduit au minimum perceptible en zone de vitesse.

**Règles d'accessibilité et de performance :**
- La préférence système « réduire les animations » est respectée : tout devient instantané, rien ne casse, rien ne manque.
- Aucune animation ne bloque une saisie. On peut toujours taper pendant une transition.
- Aucune animation ne dépasse 400 ms sur un chemin fréquent.
- `transform` et `opacity` uniquement.

## 10. Les huit moments de plaisir

Numérotés — les autres parties y renvoient par leur numéro. Conception : `fondation/fondation-plaisir.html`.

| N° | Moment | Ce qu'il doit produire |
|---|---|---|
| **1** | **La clôture réussie** | Le sommet émotionnel de la journée d'Adjoua, et l'animation la plus importante du produit : « c'est bouclé, c'est propre, tu peux rentrer chez toi » |
| 2 | Le passage enregistré en moins de 30 s | Micro-célébration très brève : la chambre s'allume, l'heure de fin s'inscrit |
| **3** | **La facture certifiée** | L'arrivée du sceau officiel et du QR code, traitée comme un petit événement — la conformité est acquise |
| 4 | Le retour du réseau | Le compteur d'éléments en attente qui descend jusqu'à zéro : visiblement rassurant |
| 5 | Les états vides | Une vingtaine d'occasions gratuites de personnalité, illustrées, jamais condescendantes |
| 6 | Le premier lancement | Le basculement du papier au logiciel mérite d'être marqué |
| **7** | **Le tableau de bord du propriétaire** | La vitrine : chiffres qui montent, indicateurs qui prennent vie, comparaison qui s'anime |
| 8 | L'indicateur de synchronisation | Le pouls du produit : respiration discrète en connecté, rythme différent en dégradé |

**Contrainte absolue** : aucun de ces moments ne rallonge une action. Ils habillent un état déjà atteint. Si l'animation de la clôture dure deux secondes, Adjoua peut partir au bout de zéro seconde — l'animation continue derrière elle.

## 11. Le registre sobre — où le plaisir est interdit

**La règle** : quand quelqu'un perd de l'argent, risque une sanction fiscale, ou est fatigué à 22 h devant un blocage — l'enjouement se lit comme du mépris.

Les écrans concernés : **clôture bloquée** · **document fiscal indéterminé** · **réconciliation d'une écriture orpheline** · **écart de caisse** · **journal d'audit** (outil de contrôle du propriétaire : vocabulaire neutre, aucune connotation policière) · **perte de données ou échec de synchronisation irrécupérable**.

Ces écrans restent **visuellement cohérents** avec le reste — même typographie, même palette, mêmes composants — en changeant seulement de registre : c'est un exercice de retenue, pas d'appauvrissement. Ni illustration amusante, ni personnage désolé ; de la clarté et de l'aide. Traitement : `fondation/fondation-difficiles.html`.

## 12. Illustrations

Famille produite dans `fondation/fondation-illustrations.html` : une vingtaine d'états vides, six écrans d'onboarding, quatre moments de réussite, trois erreurs non critiques.

Contraintes maintenues pour toute illustration ajoutée : vectoriel simple lisible en petit, fonctionnant en clair et en sombre, poids maîtrisé pour les connexions faibles, vocabulaire de formes et palette restreinte communs. **Représentation juste** — si des personnes apparaissent, ce sont des Africains de l'Ouest dans un environnement crédible (comptoir de réception, bar, buanderie de pressing), sans illustration internationale interchangeable ni cliché exotique. Les utilisateurs doivent se reconnaître.

---

# PARTIE IV — LES 10 CIBLES

## 13. Contrat d'écran

Ce qui était rappelé dans chaque prompt reste la grille de revue de tout écran, maquetté ou dérivé :

- **La zone** (charme ou vitesse) est déclarée, et le réglage d'intensité de mouvement en découle.
- **Les composants viennent de `composants.md`.** Un nouveau composant doit dire pourquoi les existants ne suffisent pas.
- **Les neuf règles de simplicité** (§5) s'appliquent intégralement, lexique compris.
- **Les états produits systématiquement** : clair et sombre · chargé nominal · vide **illustré** · erreur · **hors ligne** quand l'écran comporte une action indisponible sans réseau — annoncée **avant** que l'utilisateur tente l'action, jamais après · « animations réduites » si le mouvement est structurant.
- **Le sélecteur de contexte et l'indicateur de synchronisation sont présents partout** (sauf sur la surface publique `Q1`).
- **Libellés en français, montants en FCFA entiers.**
- **Test des cinq secondes** avant de considérer l'écran fini.

## 14. Zone de chaque cible

| Cible | Zone | Traitement |
|---|---|---|
| `R1` Accueil | **Charme** | Générosité assumée, apparition en cascade, tuiles vivantes |
| `R4` Check-in passage | **Vitesse** | Instantané. Micro-célébration de 200 ms non bloquante |
| `P2` Prise de commande | **Vitesse** | Instantané. Le total qui monte est le seul mouvement |
| `R7` Note et check-out | **Vitesse** | Sobre pendant la certification, moment de plaisir n°3 à la réussite |
| `C4` Clôture | **Les deux** | Sobre en vérification et blocage, moment de plaisir n°1 à la réussite |
| `V1` Planning | **Charme** | Visualisation soignée, transitions amples |
| `M4` Tableau de bord propriétaire | **Charme** | Vitrine du produit, moment de plaisir n°7 |
| `F2` / `S2` Moments difficiles | **Registre sobre** | Le §11 s'applique intégralement |
| `Q1` Page publique QR | **Charme** | Seule surface vue par un client final |
| `G2` Formules et barèmes | **Charme** | Configuration soignée, mais paramètre fiscal sensible |

## 15–24. Les dix cibles, et le motif que chacune pose

Les maquettes font foi (`docs/design/html/`). Ce tableau garde **l'intention** : pourquoi l'écran existe, et ce dont trente autres écrans héritent.

| Code | Écran et persona | Ce qui commande la conception | Motif posé |
|---|---|---|---|
| `R1` | **Accueil composé** — après connexion | Ce n'est pas un menu figé : des tuiles filtrées par les permissions **et** par les modules actifs. Un module inactif est **absent**, jamais grisé. Les rôles sont cumulables et c'est la norme. **Le test de vérité : l'accueil d'un maquis doit avoir l'air conçu pour lui**, pas d'un hôtel amputé | Composition par permissions et modules — 11 écrans en héritent |
| `R4` | **Check-in passage** — Yao, réceptionniste, client pressé au comptoir | **Moins de 30 s** de l'accueil à la chambre attribuée ; au-delà de 90 s le personnel revient au cahier. Durée choisie en **un geste**, prix visible **sur** le bouton, chambre proposée automatiquement, heure de fin affichée en grand, identité réduite au strict nécessaire légal | Le parcours court — décision unique, confirmation immédiate |
| `P2` | **Prise de commande** — Aminata, serveuse, Android 5,5" debout, à une main, bruit, réseau instable | Ajout d'un article en **deux taps**, quantité modifiée sans modale, **fonctionnement intégralement hors ligne** ni invisible ni alarmant, cible de facturation choisie à l'ouverture, total courant toujours visible. Sans module hébergement, la cible « chambre » n'existe pas | La saisie répétitive hors ligne, à une main |
| `R7` | **Note de séjour et check-out** | Le total provisoire doit être visible **instantanément** (un des cinq problèmes du pilote). Taxe de séjour **en ligne distincte** (obligation légale), TVA, taxe de développement touristique. L'envoi aux impôts prend quelques secondes et peut échouer — **le client est debout devant le comptoir** pendant ce temps | Le document à lignes : lignes, sous-totaux, taxes, total, action finale — 6 écrans en héritent |
| `C4` | **Clôture journalière** — Adjoua, tous les soirs | Une heure sur le cahier, **objectif : moins de 15 minutes**. Recettes par service, ventilation de l'hébergement **par formule** (nuitées, passages, demi-journées). La clôture est **refusée** tant que quatre conditions ne sont pas réunies : rien en attente d'envoi, aucune facture en attente ou refusée, aucun terminal déconnecté depuis plus de 15 min, aucune addition ouverte. **Le refus est constructif** : ce qui bloque, combien, et l'action possible depuis cet écran | La vérification préalable et le blocage constructif |
| `V1` | **Planning horaire** | **Granularité horaire** — ce qui le distingue de tout planning hôtelier existant : passages de 1 à 4 h et demi-journées lisibles, pas écrasés dans une case de journée. Temps de remise en état bloquants entre deux occupations (30 min après un passage, 2 h après une nuitée) | La visualisation temporelle à granularité fine |
| `M4` | **Tableau de bord propriétaire mobile** — M. Koffi, deux établissements | Demande explicite du persona : voir en temps réel sans se déplacer. 8 à 10 indicateurs, comparaison entre établissements, alertes. **Lecture seule**, consulté en 20 s plusieurs fois par jour | La consultation mobile et le régime de charme |
| `F2` | **Document fiscal indéterminé** | Sur un timeout, il est **impossible** de savoir si la facture a été validée ; la renvoyer produirait une double validation et un jeton payant consommé deux fois. Aucune solution automatique : un humain vérifie et tranche. Expliquer sans jargon à Adjoua, avec deux issues bien différenciées et **aucun bouton « réessayer » atteignable par réflexe** | Registre sobre (avec `S2`) — 5 écrans en héritent |
| `S2` | **Réconciliation d'une écriture orpheline** | Une bière servie hors ligne arrive sur un séjour déjà facturé. Le conflit le plus fréquent en exploitation réelle, sans solution automatique. Trois issues : avoir et refacturation (l'avoir fiscal se fait **par quantité**, donc ligne entière annulée) · prise en charge par l'établissement · rattachement au prochain séjour. **Aider à décider** : la bonne réponse dépend du montant et de la relation client | idem `F2` |
| `Q1` | **Page publique de commande** — client final, son propre téléphone | Pas d'application à installer, pas de compte, **aucune donnée personnelle demandée**. Catalogue, panier, validation, puis attente de confirmation par le serveur — rien ne part en cuisine avant qu'Aminata ait constaté la présence du client. **Seule surface vue par un client final** : ni sélecteur de contexte, ni indicateur de synchronisation, ni navigation composable | La surface client — règles entièrement distinctes du produit interne |
| `G2` | **Formules et barèmes** | Quatre familles : nuitée, **passage horaire à paliers dégressifs** (1 h : 1 500, 2 h : 2 800, 3 h : 4 000, 4 h : 5 000, heure supplémentaire : +1 200, plus une règle de bascule en nuitée), demi-journée en plages fixes, mensuel. Chaque formule porte son traitement de taxe de séjour — **paramètre sensible** : mal réglé, il met le client en infraction | La configuration structurée avec paramètre sensible — 7 écrans en héritent |

---

# PARTIE V — MATRICE DE DÉRIVATION

## 25. Les 30 écrans codés sans maquette

> 📦 **Déplacé le 2026-07-30 vers `docs/design/derivation.md`, qui fait désormais foi.**
> Le tableau n'est pas dupliqué ici : deux copies divergeraient, ce que le principe I de la
> constitution interdit. `derivation.md` est le chemin que citent les prompts Spec Kit, la
> Definition of Done et la porte P-19.

**Ce que le fichier contient** : les écrans non maquettés, chacun avec le motif dont il hérite et
ce qui change ; le décompte des écrans du produit (11 maquettés en 29 fichiers d'états, plus les
dérivés et les composés) ; et **la liste tenue à jour des écrans découverts à l'implémentation**
(§2 bis, quatrième cas), chacun portant la mention « à valider » et les composants employés.

⚠️ **Le décompte se lit dans `derivation.md`, jamais ici.** Il change à chaque cycle de la phase 2,
par construction : c'est le propre du quatrième cas.

---

# PARTIE VI — PROTOTYPES ANIMÉS

## 26. Les six prototypes

Les cibles sont statiques ; pour juger une **sensation**, il faut du HTML animé. Tous fonctionnent en clair et en sombre, respectent la préférence « animations réduites », et déclarent leurs durées et courbes en variables CSS nommées — c'est de là que sort `mouvement.md`.

| Fichier | Ce qu'il permet de juger |
|---|---|
| `proto-0-sommaire.html` | Index des prototypes |
| `proto-1-sept-patrons.html` | Les sept patrons, avec un curseur de vitesse pour évaluer les durées |
| `proto-2-selecteur-duree.html` | Le geste le plus répété du produit : retour tactile et inscription de l'heure de fin |
| `proto-3-ajout-consommation.html` | Le total qui monte, **enchaîné cinq fois** — reste-t-il agréable ? |
| `proto-4-cloture-reussie.html` | Le moment de plaisir n°1 dans son intégralité |
| `proto-5-retour-reseau.html` | La vidange de la file d'attente, compteur de 23 à 0 |
| `proto-6-indicateur-sync.html` | Les trois états en boucle — fatigue-t-il après huit heures ? |

---

# PARTIE VII — DOCUMENTS IMPRIMÉS

## 27. Les sept modèles

Ce ne sont pas des écrans mais des spécifications de mise en page. Produits ; à confronter au matériel réel avant le cycle IMP.

**Contrainte thermique (D1 à D5)** — 80 mm de large, environ 42 caractères par ligne, **pas de couleur**, pas de nuance de gris fiable, pas d'image autre qu'un logo monochrome simple. Les caractères accentués français doivent rester lisibles. La coupe papier est prévue. Fichier : `documents/D1-D5-tickets-thermiques.html`.

| Code | Document |
|---|---|
| `D1` | Ticket de commande client (point de vente) |
| `D2` | Bon de préparation cuisine ou bar |
| `D3` | Bon de dépôt pressing, avec numéro de retrait bien visible |
| `D4` | Reçu d'encaissement |
| `D5` | Rapport de fin de shift |

**Contrainte PDF A4 :**

- **`D6` — Note provisoire de séjour** (`documents/D6-note-provisoire.html`). Mention obligatoire et **visible** : « Document non fiscal — ne tient pas lieu de facture ». Cette mention protège juridiquement le client ; elle n'est pas en petits caractères en bas de page.
- **`D7` — Facture fiscale** (`documents/D7-facture-fiscale.html`). Le document le plus contraint du produit : identification complète de l'établissement et du client, désignation détaillée des prestations, prix hors taxes, TVA à 18 %, **taxe communale de nuitée en ligne distincte** du hors-taxes et de la TVA (obligation légale), taxe de développement touristique, total. Plus les éléments renvoyés par l'administration après validation : numéro normalisé, visuel officiel, QR code de vérification et sceau électronique — dont l'emplacement est **dimensionné et réservé**, à confronter aux spécimens exacts dès leur réception.

Tous les documents portent le branding de l'établissement : logo, coordonnées, mentions légales, paramétrables par client.

---

# PARTIE VIII — VALIDATION ET GARDE-FOUS

## 28. Protocole de validation terrain

À faire à l'atelier d'Abengourou, en phase 0. Les maquettes ne valent que confrontées au réel.

| Étape | Méthode |
|---|---|
| **Préparation** | Imprimer les 10 cibles en A3, et les charger sur le matériel réel — poste de réception, Android d'entrée de gamme |
| **Direction visuelle** | Montrer les deux planches d'ambiance à Adjoua, Yao et Aminata. Leur préférence prime sur la mienne |
| **Test du passage (`R4`)** | Yao simule trois enregistrements. **Chronométrer.** Si le troisième dépasse 45 s, l'écran est à refaire |
| **Test de la clôture (`C4`)** | Adjoua déroule sa clôture d'hier sur la maquette. Noter chaque hésitation |
| **Test du blocage** | Lui montrer la clôture bloquée sans explication préalable. Comprend-elle quoi faire ? |
| **Test du maquis (`R1`)** | Montrer la quatrième variante à quelqu'un qui n'est pas hôtelier. A-t-il l'impression d'un produit conçu pour lui ? |
| **Test de la commande (`P2`)** | Aminata saisit six lignes debout, à une main. Chronométrer |
| **Test des écrans difficiles (`F2`, `S2`)** | Les montrer sans contexte. Sait-elle quoi faire ? Sinon c'est le TEXTE qu'il faut reprendre, pas la mise en page |
| **Test du cahier** | Sur trois tâches courantes, comparer logiciel et cahier. Le cahier ne doit jamais gagner |
| **Test des huit heures** | Prototypes 2, 3 et 6 en boucle dix minutes |

Tout retour va dans `docs/design/notes-terrain.md`. **Un retour qui contredit le cadrage modifie le cadrage**, pas l'inverse — c'est exactement pour ça qu'on maquette avant de coder.

## 29. Garde-fous

- **Le budget d'animation est celui d'un Android à 2 Go de RAM.** Toute animation qui ne tient pas en `transform` et `opacity` est refusée. À vérifier sur le matériel réel, pas sur un émulateur.
- **Aucune animation ne conditionne un état.** L'état change, l'animation suit. Si le rendu est interrompu, la donnée est déjà juste.
- **Aucune animation sur un chemin fréquent ne dépasse 400 ms.**
- **La préférence « réduire les animations » est respectée partout.** Dans ce mode, rien ne casse et rien ne manque.
- **Le test des huit heures avant validation.** L'indicateur de synchronisation, les squelettes et les micro-interactions du sélecteur de durée sont vus des centaines de fois par jour. Ce qui charme à la dixième vue peut exaspérer à la trois-centième.
- **Le jugement final revient au terrain**, pas au designer ni au fondateur.

## 30. Règles de conduite

- **Tout écran cite sa référence, dans l'un des quatre cas du §2 bis** — maquetté, dérivé, composé, ou découvert à l'implémentation et **inscrit à `docs/design/derivation.md` dans le même changement**. *(Cette règle disait « un écran sans maquette ni motif d'héritage déclaré n'est pas codé » jusqu'au 2026-08-06 ; elle arrêtait le cycle sur un écran que les documents n'avaient pas prévu, ce qui coûtait une demi-journée pour un écran souvent évident. Ce qui est refusé désormais est l'écran inventé **sans trace**, pas l'écran inventé.)*
- **Un composant qui manque, en revanche, arrête le cycle.** Un écran s'assemble, un composant se dessine.
- **Le HTML de `docs/design/html/` ne migre jamais vers `app/`.** Aucun `git mv`, aucun copier-coller de bloc. On lit les valeurs, on réimplémente en composants Nuxt avec i18n, mode sombre, RBAC et chargement paresseux — toutes choses que l'export ne contient pas.
- **Une seule extraction de tokens.** `tokens.md` est produit au moment de la fondation, à partir de `styleguide.html`. Ensuite il prime : un export qui diverge est corrigé, pas suivi.
- **Le code stable prime sur le nom.** `R4` restera `R4` même refait trois fois.
- **Si une maquette révèle une contradiction avec le cadrage**, mettre à jour `docs/cadrage-v1.md` ou `docs/user-stories-v1.md` d'abord, puis la maquette.
- **`tokens.md` est la seule source des valeurs visuelles.** Aucune couleur ni espacement littéral ailleurs, ni dans les maquettes ni dans le code.
- **`lexique.md` est la seule source du vocabulaire utilisateur.** Tout nouveau terme y entre avant d'être codé.
- **Ne pas maquetter au-delà du besoin.** Un écran maquetté six mois avant d'être codé sera refait.

---

# PARTIE IX — EXPORT VERS LE PROJET

## 30 bis. Correspondance avec les maquettes produites

Les maquettes ont été nommées selon la logique de l'outil de design. Les codes de ce document restent la référence des prompts Spec Kit et de la matrice de dérivation. **Convention retenue : `{code}-{nom-lisible}[-{etat}].html`** — le code pour la référence stable, le nom pour la lecture humaine.

### Écrans du produit

| Maquette produite | Code | Ce qu'elle pose |
|---|---|---|
| Kaya — Accueil | `R1` | Composition par permissions et modules |
| Kaya — Mes établissements | `M4` | Consultation mobile, zone de charme |
| Kaya — Le planning | `V1` | Visualisation temporelle à granularité fine |
| Kaya — Passage | `R4` | Parcours court, décision unique |
| Kaya — L'offre d'hébergement | `G2` | Configuration structurée, paramètre sensible |
| Kaya — La page du client | `Q1` | Surface client, règles distinctes |
| Kaya — Saisie de commande | `P2` | Saisie répétitive hors ligne, une main |
| Kaya — La note et le départ | `R7` | Document à lignes : lignes, taxes, total, action finale |
| Kaya — Clôture de la journée | `C4` | Vérification préalable et blocage constructif |
| Kaya — Registre grave | `F2` + `S2` | Registre sobre des moments difficiles (livrés en deux fichiers distincts) |

### Fondations, prototypes, documents

| Maquette produite | Rôle | Fichier |
|---|---|---|
| Kaya — Directions visuelles | Identité, palettes, typographie | `fondation/fondation-directions.html` |
| Kaya — Système de mouvement | Source de `mouvement.md` | `fondation/fondation-mouvement.html` |
| Kaya — Moments de plaisir | Les 8 moments expressifs | `fondation/fondation-plaisir.html` |
| Kaya — Moments difficiles | Le registre sobre | `fondation/fondation-difficiles.html` |
| Kaya — Illustrations | États vides, onboarding | `fondation/fondation-illustrations.html` |
| Styleguide | Les composants canoniques, tous états, clair + sombre | `styleguide.html` |
| Prototypes animés | Sensation de mouvement | `proto/proto-0-sommaire.html` … `proto-6-indicateur-sync.html` |
| D1-D5 — Tickets thermiques | Impression 80 mm | `documents/D1-D5-tickets-thermiques.html` |
| D6 — Note provisoire | Document non fiscal | `documents/D6-note-provisoire.html` |
| D7 — Facture fiscale | Document légal | `documents/D7-facture-fiscale.html` |

## 31. Ce que l'export a laissé au projet

L'archive de design est décompressée dans `docs/design/`. Trois questions, dont `README.md` porte les réponses détaillées :

- **Qu'est-ce qui se copie dans le projet ?** `theme.css`, et rien d'autre. Il est autosuffisant : copié dans le projet Nuxt, il fonctionne sans retouche. Il rejoint `app/assets/css/` **au cycle F1** (phase 2), quand `app/` naît.
- **Qu'est-ce qui se lit sans jamais se copier ?** Tout le HTML — écrans, fondation, prototypes, documents.
- **Quelles décisions restent à prendre ?** Les valeurs arbitraires listées dans `README.md` : chacune entre dans `@theme` ou s'aligne sur l'échelle existante.

## 32. Checklist avant le cycle 1

### Bloquant — ✅ les trois actions sont faites au 2026-07-30

| # | Action | État |
|---|---|---|
| 1 | `docs/design/derivation.md` — les 30 écrans et le motif dont chacun hérite | ✅ **fait** — la partie V y a été **déplacée**, pas recopiée : une seule source |
| 2 | `docs/design/lexique.md` — la traduction des concepts techniques | ✅ **fait** — le §6 y a été **déplacé**, pas recopié |
| 3 | `docs/Kaya_Design.md` déposé au dépôt | ✅ **fait** — allégé des prompts de maquettage le 2026-08-06, doctrine d'écran assouplie le même jour (§2 bis) |

> Les deux tableaux ont été **déplacés et non dupliqués** : le document annonçait « recopier »,
> mais deux copies divergeraient, ce que le principe I de la constitution interdit. Ce fichier
> renvoie désormais vers eux (§6 et partie V).

### Non bloquant, mais à faire tôt

| # | Action | Pourquoi |
|---|---|---|
| 4 | **Vérifier `styleguide.html` dans un projet Nuxt 4 réel**, avec `theme.css` importé | Si un utilitaire manque, il venait du CDN et pas du noyau Tailwind 4. Le découvrir au cycle **F1** coûte une heure, le découvrir plus tard coûte une refonte. **C'est un livrable du cycle F1**, pas une action séparée |
| 5 | **Trancher les valeurs arbitraires** listées dans `README.md` | Chacune entre dans `@theme` ou s'aligne sur l'échelle. Les laisser dispersées, c'est quarante valeurs uniques à la fin de la phase 2. **À faire au cycle F1** |
| 6 | ~~**Produire `Q1-page-client-ferme.html`**~~ — table fermée ou QR expiré | ✅ **Cette action tombe avec l'assouplissement du §2 bis.** L'état est réel et spécifié — c'est ce que voit quelqu'un qui scanne un QR arraché — mais il n'a plus besoin d'être maquetté d'avance : le cycle **F4** le code au titre du quatrième cas et l'inscrit à la matrice. C'est exactement la situation que la règle stricte rendait bloquante pour rien |

### À l'atelier d'Abengourou

Capturer les 10 écrans principaux en PNG pour l'impression A3 — les HTML ne se montrent pas à Adjoua sur un écran de portable. Créer `docs/design/notes-terrain.md` et y consigner tous les retours.
