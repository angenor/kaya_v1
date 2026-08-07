# Checklist de qualité de la spécification : La coquille de l'application (cycle F1)

**Objet** : valider la complétude et la qualité de la spécification avant de passer à la planification
**Créée le** : 2026-08-07
**Fonctionnalité** : [spec.md](../spec.md)

> **Re-validée le 2026-08-07**, après la séance de clarification. Les quatre items non cochés portaient auparavant la marque `[~]`, qui n'est **pas** une case de liste de tâches valide : ils étaient donc invisibles à toute re-validation mécanique. Ils sont ramenés à `[ ]`, et leur motif reste aux notes. *Une case inventée est indistinguable d'une case absente.*

## Qualité du contenu

- [ ] Aucun détail d'implémentation (langages, cadriciels, API) — **écart assumé, motivé plus bas**
- [x] Centrée sur la valeur utilisateur et le besoin métier
- [ ] Rédigée pour une partie prenante non technique — **partiel, motivé plus bas**
- [x] Toutes les sections obligatoires sont remplies — plus la section `## Clarifications` ajoutée par la séance

## Complétude des exigences

- [x] Aucun marqueur `[NEEDS CLARIFICATION]` ne subsiste — trois arbitrages tranchés avant rédaction, deux questions tranchées à la clarification, **vingt décisions prises sur documents cités**
- [x] Les exigences sont testables et sans ambiguïté — **97 exigences, FR-001 à FR-097, continue, aucun doublon, aucune référence orpheline**
- [x] Les critères de succès sont mesurables — **25 critères**, chacun portant un nombre, un quantificateur total (« chaque », « toute ») ou un zéro
- [ ] Les critères de succès sont indépendants de la technologie — **écart assumé, motivé plus bas**
- [x] Tous les scénarios d'acceptation sont définis — 12 récits, **84 scénarios** en *Étant donné / quand / alors*
- [x] Les cas limites sont identifiés — 5 familles : le build et la maquette · la coquille · les données et la session · la file et les classes · les portes
- [x] Le périmètre est clairement borné — section « Hors périmètre », plus la table « Ce que ce cycle produit, et ce qu'il ne produit pas »
- [x] Dépendances et hypothèses identifiées — **8 hypothèses** (quatre sont devenues des exigences à la clarification) et **20 décisions**, chacune avec le document qui la tranche

## Aptitude à la planification

- [x] Chaque exigence fonctionnelle a un critère d'acceptation clair — les 97 exigences se rattachent aux 12 récits par leurs groupes A à N
- [x] Les récits couvrent les parcours principaux — les 13 livrables de l'entrée du cycle sont couverts, chacun par au moins un récit
- [x] La fonctionnalité satisfait les résultats mesurables définis — SC-020 rejoue littéralement le critère de fin du cycle F1 de `docs/user-stories-v1.md` §0.5
- [ ] Aucun détail d'implémentation ne fuit dans la spécification — **même écart, même motif**

## Notes

### Les trois écarts, et pourquoi ils ne se corrigent pas

Les trois items marqués `[~]` portent la **même** cause. Les corriger appauvrirait la spécification au lieu de l'améliorer, et la mettrait en contradiction avec la constitution du dépôt.

**1. La fonctionnalité *est* de l'infrastructure.** Ce cycle ne livre aucun écran métier : son produit est la coquille elle-même — le cycle de vie de l'application, la couche de données simulées, l'adaptateur de plateforme, la commande de vérification. Une spécification d'infrastructure dont on retirerait les artefacts n'aurait plus d'objet.

**2. Les artefacts nommés sont normatifs, pas choisis ici.** `scripts/verifier.sh`, `PlatformAdapter`, la variante `dark:`, l'UUID v7 client, le contrôle sur **Chromium et WebKit**, `docs/design/theme.css` comme seul fichier copié : tous sont **imposés par `.specify/memory/constitution.md`** (principes 6, 7, 8, 12 et 13). Les paraphraser en termes neutres produirait une seconde formulation d'une règle qui en a déjà une — exactement ce que le principe 1 interdit, puisque deux formulations divergent.

**3. Les chemins viennent de l'entrée du cycle.** `app/core/donnees/`, l'adresse de l'index des écrans, la copie de `theme.css` dans les ressources de l'application : l'utilisateur les a écrits littéralement. Les retirer réduirait le périmètre demandé, ce qui n'est pas au choix de la spécification.

**4. Le lecteur direct n'est pas une partie prenante non technique.** Le dépôt est celui d'un **développeur solo** (constitution, « Contexte produit »). Les personas métier — Adjoua, Yao, Aminata, M. Koffi — sont présents dans ce cycle comme **comptes du jeu Deloria** et comme **jeux de permissions**, pas comme lecteurs. La spécification le dit en tête des scénarios plutôt que de le laisser deviner.

### Ce que la spécification a délibérément évité de nommer

Pour que l'écart reste borné au nécessaire, la spécification **ne nomme aucun cadriciel, aucune bibliothèque et aucune version** : elle dit « une SPA sans rendu serveur », « les jetons », « les catalogues », « la commande unique ». Le choix des briques et leur épinglage appartiennent à la planification et à `docs/versions-reference.md`, où **FR-081** les renvoie.

### Vérifié mécaniquement

| Contrôle | Résultat |
|---|---|
| Numérotation des exigences | **FR-001 à FR-097**, **continue**, sans doublon. Les numéros de la clarification closent le groupe où ils appartiennent plutôt que d'imposer une renumérotation générale |
| Références croisées | **0 orpheline** — toute `FR-xxx` et toute `D-xx` citée est définie |
| Numérotation des critères | **SC-001 à SC-025**, continue, sans doublon |
| Marqueurs `[NEEDS CLARIFICATION]` restants | **0** |
| Récits · scénarios d'acceptation | **12** récits · **84** scénarios |
| Décisions consignées avec leur source | **20** (D-01 à D-20) |
| Livrables de l'entrée du cycle couverts | **13 sur 13** (0 à 12), plus le point d'attention branché/dû |

### Ce que la séance de clarification a corrigé

Elle n'a pas seulement comblé des trous : elle a **contredit deux énoncés de la première rédaction**, et c'est sa contribution la plus utile.

| Ce que la spécification disait | Ce que le document opposable dit | Coût si l'écart avait survécu |
|---|---|---|
| Le témoin porte « connecté / dégradé / hors ligne » | **Ces trois mots ne doivent jamais atteindre l'écran** ; les libellés sont « Enregistré », « En attente d'envoi (n) », « Connexion faible », « Hors connexion » (`lexique.md`) | Le composant 10 est **sur chaque écran du produit**. Les six cycles suivants auraient hérité des mauvais libellés — et le lexique **documente que `app/core/i18n` avait déjà fait cette faute exacte** |
| P-04 exige que **chaque** entrée de l'index soit atteignable | L'index porte **46 écrans**, dont 43 non commencés (`derivation.md`) | La porte aurait été **rouge dès son premier jour**, et désactivée sous trois semaines |

### Prêt pour la suite

La spécification est **prête pour `/speckit-plan`**.

**Trois points appellent une décision *à la planification*, pas une clarification** — ils portent sur le *comment*, que la spécification n'a pas à trancher :

1. **Comment le contrôle des points d'entrée constate un appelant** (FR-076, FR-077). C'est le contrôle le plus délicat du cycle : son second versant est ce qui empêche le premier d'être muet, et il n'est utile que s'il ne produit aucun faux négatif.
2. **Comment P-04 tient sa cible non vide sur un cycle sans écran métier** (FR-069, FR-071). Le périmètre est court par construction ; la porte doit prouver qu'elle a regardé quelque chose.
3. **Comment le prérequis de conteneur devient local à ses portes** (FR-085, SC-021). Constaté à la rédaction : le script actuel exige le démon **avant d'exécuter quoi que ce soit**, alors que le lint, le build, P-03 et P-04 n'en ont aucun besoin. Sans réglage, la propriété « aucun conteneur » se retourne contre la démonstration d'Abengourou, où **rien** ne serait vérifiable — pas même ce qui ne dépend de rien.
