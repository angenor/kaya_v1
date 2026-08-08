# Liste de contrôle qualité de la spécification : Le cœur métier de la réception (cycle F3)

**Objet** : valider la complétude et la qualité de la spécification avant de planifier
**Créée** : 2026-08-08
**Fonctionnalité** : [spec.md](../spec.md)

## Qualité du contenu

- [X] Aucun détail d'implémentation (langages, cadriciels, API)
- [X] Centrée sur la valeur d'usage et le besoin métier
- [X] Écrite pour un lecteur non technique
- [X] Toutes les sections obligatoires sont remplies

## Complétude des exigences

- [X] Aucun marqueur [NEEDS CLARIFICATION] ne subsiste
- [X] Les exigences sont vérifiables et sans ambiguïté
- [X] Les critères de succès sont mesurables
- [X] Les critères de succès sont indépendants de la technique
- [X] Tous les scénarios d'acceptation sont définis
- [X] Les cas limites sont identifiés
- [X] Le périmètre est borné explicitement
- [X] Les dépendances et hypothèses sont identifiées

## Aptitude au développement

- [X] Chaque exigence fonctionnelle porte un critère d'acceptation clair
- [X] Les récits couvrent les parcours principaux
- [X] La fonctionnalité satisfait les résultats mesurables des critères de succès
- [X] Aucun détail d'implémentation ne fuit dans la spécification

## Contrôles propres à ce dépôt

- [X] **Le compte des gestes est écrit**, parcours par parcours, avec son barème de conversion
      déclaré — et **ce qui dépasse est nommé** (section « Ce qui dépasse — nommément », quatre
      points)
- [X] **Le conflit constaté est tranché, pas tu** : `R4-passage-hors-ligne.html` contre le cadrage
      §11.3 → arbitrage A, et FR-074 ordonne la correction du document perdant **dans le même
      changement**
- [X] **La classe hors-ligne de chaque opération est déclarée** et rattachée au registre
      (occupation/séjour/note/fiche de police → B · client → C · préférences/ménage → A)
- [X] **Le vocabulaire vient du lexique**, et les mots proscrits sont vérifiés par un critère de
      succès portant sur le **HTML rendu** (SC-009)
- [X] **Aucune valeur métier en dur** : barème, plages, durées de remise en état, seuil de bascule et
      taux de taxe viennent du référentiel (FR-068, SC-013)
- [X] **L'écran inventé est déclaré** : la quatrième issue de `R7` s'inscrit à `derivation.md`
      (D-14, FR-074b, FR-077)
- [X] **Les objectifs mesurés sont des portes**, pas des souhaits : FR-070 à FR-073 les rattachent à
      P-04 et exigent que le dépassement rougisse
- [X] **Chaque seuil, délai et montant est rattaché au « Récapitulatif des paramètres
      d'établissement »** — ou déclaré comme décidé ici quand il n'y figure pas (butée d'attente
      D-22, seuils de recherche, délai d'annulation, durée de garde)
- [X] **Chaque entité est alignée sur `docs/modele-donnees/97-hebergement.sql`** : deux périodes sur
      l'occupation, client facultatif sur le séjour, total-cache sur la note, constat immuable —
      avec leurs valeurs d'énumération exactes (DoD 12)
- [X] **L'assiette fiscale est celle du cadrage §9.6 après B-10**, pas celle de la maquette :
      par nuitée et par séjour, jamais par personne (D-05a, FR-013, FR-027a, SC-015a)

## Analyse de cohérence — 2026-08-08

*Treize écarts trouvés entre spec, plan, tâches et constitution ; **tous corrigés dans le même changement**.*

- [X] **`SEJ-04` est P0 et sa seconde moitié n'existait nulle part** — prolongation, changement de
      chambre, départ anticipé n'apparaissaient qu'en cas limites, sans exigence ni tâche, **alors
      que le contrat déclarait déjà `prolongerSejour` et `changerUnite`**. Corrigé : **FR-041a →
      FR-041d**, **SC-020**, phase de tâches **6 bis** (T036a→c), et `R6` désigné comme l'écran qui
      les porte
- [X] **Un contrôle affirmé et coché sans exister** : le plan disait deux fois que `Date.now()` dans
      un composant est « interdit par le lint ». Corrigé : tâche **T006a**, en phase 1 — *le calcul
      de durée d'un passage est facturé, et une horloge de terminal se règle à la main*
- [X] **Deux boutons d'impression dans les maquettes, dans aucune tâche** — ils auraient été livrés
      morts, ou branchés sur `window.print()` depuis un composant. Corrigé : **FR-029a**, tâche
      **T025a** ; le gabarit thermique reste au cycle F6
- [X] **Le compteur de fiche de police sans trou** était exigé par le plan et le modèle, testé par
      aucune tâche. Corrigé : assertion ajoutée à **T010**
- [X] **Un critère mesurable devenu un adjectif** : `SEJ-01` chiffre 300 ms sur 10 000 fiches, la
      spec disait « sans attente perceptible ». Corrigé : **SC-019** et **T044**
- [X] **Un délai en passe de devenir une constante** : les 15 min de la garde de chambre ne
      figuraient nulle part comme paramètre. Corrigé : `heb.duree_garde_comptoir_minutes` **inscrite
      au « Récapitulatif des paramètres d'établissement »**, avec la distinction d'avec l'expiration
      d'une réservation
- [X] **Les onze mots proscrits n'étaient vérifiés que localement** — quatre sur `R4`, le
      vocabulaire fiscal sur `R7`. Corrigé : balayage global des sept écrans et des deux catalogues,
      **T053**
- [X] **Aucune tâche ne déroulait le quickstart**, que `SC-017` exige. Corrigé : **T053a**
- [X] **`R2` portait deux noms** — « Vue du jour » à l'index et dans `derivation.md`, « Le jour »
      proposé au lexique. Tranché **en faveur des documents opposables** : le titre ne change pas,
      seule la route `/jour` est décidée
- [X] Cas limite des **deux réceptionnistes à la même seconde** (T012), **levier « conflit de
      disponibilité »** (T032), **chambre proposée / grille / pièce après la clé** (T009),
      **numérotation de `SC-018`** — tous corrigés

## Notes

- **Trois documents opposables ont été corrigés dans le même changement**, comme `CLAUDE.md`
  l'exige : `docs/design/derivation.md` porte la note qui tranche le conflit de
  `R4-passage-hors-ligne.html` **et** l'inscription du quatrième état de `R7` ;
  `docs/design/lexique.md` voit ses deux renvois `FR-070`/`FR-073` — qui pointaient vers des
  numéros du cycle **F1** portant un tout autre objet — corrigés en `FR-017` et `FR-021b`,
  **qualifiés par leur dossier** (FR-076).
- **Deux décisions ont été tranchées par défaut plutôt que par question**, et sont réversibles :
  le règlement limité aux espèces (D-15), et le point d'entrée du passage laissé à `R2` sans
  nouvelle surface d'accueil (hypothèse 3). Les deux sont écrites, mesurées, et localisées dans un
  seul fichier chacune.
- **Session de clarification du 2026-08-08** : trois questions posées, trois répondues — le passage
  encaisse au tap (D-19), SEJ-05 sort du périmètre, la garde de chambre est une occupation courte
  (D-20). Quatre autres ambiguïtés ont été **tranchées par les documents sans question**, dont **une
  erreur fiscale** que la première rédaction avait recopiée de la maquette `R7` (D-05a).
- **Un terme entre dans le produit sans figurer au lexique** : « **Garder la chambre** » /
  « **Tenue jusqu'à {heure}** ». Formulation proposée et validée le 2026-08-08 ; elle **doit entrer
  au lexique dans le changement qui livre l'écran**, avec l'interdiction de « réserver ».
