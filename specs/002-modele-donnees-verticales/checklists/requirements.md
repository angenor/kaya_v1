# Liste de contrôle qualité de la spécification : Modèle de données des capacités et des verticales (cycle D2)

**Objet** : valider la complétude et la qualité de la spécification avant de passer à la planification
**Créée le** : 2026-08-07
**Fonctionnalité** : [spec.md](../spec.md)

## Qualité du contenu

- [x] Pas de détail d'implémentation (langages, cadriciels, API) — *voir note 1*
- [x] Centrée sur la valeur et le besoin
- [x] Rédigée pour un lecteur non implémenteur — *voir note 1*
- [x] Toutes les sections obligatoires sont remplies

## Complétude des exigences

- [x] Aucun marqueur [NEEDS CLARIFICATION] ne subsiste — *voir note 3*
- [x] Les exigences sont vérifiables et non ambiguës
- [x] Les critères de réussite sont mesurables
- [x] Les critères de réussite sont indépendants de la mise en œuvre — *voir note 1*
- [x] Tous les scénarios d'acceptation sont définis
- [x] Les cas limites sont identifiés
- [x] Le périmètre est clairement borné
- [x] Les dépendances et les hypothèses sont identifiées

## Aptitude à la mise en œuvre

- [x] Chaque exigence fonctionnelle a un critère d'acceptation clair
- [x] Les récits couvrent les parcours principaux
- [x] La fonctionnalité satisfait les résultats mesurables des critères de réussite
- [x] Aucun détail d'implémentation ne déborde dans la spécification — *voir note 1*

## Notes

1. **Les quatre points marqués relèvent de la même exception assumée qu'au cycle D1, pas d'un écart.**
   Le livrable de ce cycle **est** le modèle de données en SQL PostgreSQL (constitution, principe 0 ;
   cadrage §13.0). Nommer `tstzrange`, `EXCLUDE USING gist`, `NUMERIC` ou `GRANT SELECT, INSERT`
   n'est pas une fuite d'implémentation : c'est **l'objet même** de la spécification, et l'entrée du
   cycle nomme littéralement la contrainte d'exclusion comme la décision la plus structurante du
   produit. La ligne à ne pas franchir est la même qu'au D1 et elle est tenue : la spécification ne
   contient **aucun `CREATE TABLE`, aucune colonne typée, aucune définition de table** — elle dit ce
   que chaque fichier doit **prouver**, pas comment l'écrire.
2. **Aucun écart à la liste de fichiers de l'entrée.** Les quatre fichiers demandés sont les quatre
   fichiers spécifiés. La seule décision de forme ajoutée est l'**emplacement de `ventes` dans la
   plage numérique du socle** (hypothèse 1), qui découle de la constitution — `ventes` est un crate
   de `socle/` — et non d'une préférence.
3. **Quatre arbitrages ont été rendus sans question bloquante**, parce que les documents de référence
   les tranchaient : `client` comme spécialisation de `comptes.personne` plutôt que duplication de la
   fiche d'identité (hypothèse 2, la purge TRX-06 aurait eu deux cibles) ; l'addition d'une table
   comme commande de cible `table` plutôt qu'entité distincte (hypothèse 4) ; les deux périodes de
   l'occupation, l'une facturée, l'autre indisponible (hypothèse 5, FR-009) ; la mise hors service
   d'une unité comme occupation de motif « maintenance » plutôt que colonne du référentiel
   (hypothèse 6, seule lecture conciliant une opération de classe B avec un référentiel de classe C).
4. **Deux décisions ouvertes ne sont pas tranchées et ne devaient pas l'être** : O-02 (classe de
   `mouvement_stock`) et O-03 (crate d'accueil de la surface QR). Le registre est formel — jusqu'à
   l'arbitrage, la classe inscrite s'applique, et c'est toujours la plus stricte des options
   (FR-040). Les inscrire comme clarifications aurait demandé au développeur d'arbitrer aujourd'hui
   ce que le pilote arbitrera au terrain.
5. **Amendement du 2026-08-07, après planification — la porte P-05.** La spécification disait
   « aucune porte nouvelle » (FR-044, SC-013, hors périmètre). La planification a établi que le
   **plan du cycle D1 avait explicitement désigné celui-ci** comme le moment où la porte « aucune
   clé étrangère entre deux schémas » serait justifiée — cible non vide à l'appui —, et que le coût
   de son absence est manifeste et **silencieux**. FR-044 est reformulé, **FR-046 et FR-047 sont
   ajoutés**, SC-012 et SC-013 sont corrigés, et la section « Hors périmètre » nomme les deux
   candidates réexaminées puis écartées. La checklist reste **verte sur les seize points** : la
   spécification amendée est toujours complète, testable et bornée. Motifs :
   [research.md D-23](../research.md), [contracts/verifier-p05.md](../contracts/verifier-p05.md).
6. **Corrections du 2026-08-07, après `/speckit-analyze`.** L'analyse croisée a relevé douze écarts,
   tous corrigés. Trois touchaient la spécification et **trois exigences ont été ajoutées** :
   **FR-048** (les provisions du registre §10 relevant de ces schémas — le cycle D1 avait un FR
   équivalent, celui-ci ne l'avait pas), **FR-049** (le décompte d'une prestation incluse ne reçoit
   aucune table), **FR-050** (l'idempotence des deux reports est portée par un **index UNIQUE
   partiel**, jamais par une lecture préalable — un index ordinaire *retrouve* un doublon sans le
   **refuser**, et un événement rejoué produirait une double facturation). **SC-007** a été précisé :
   les tables à double classe sont **six**, et non sept — `mouvement_stock` et `inventaire` portent
   une seule classe avec un privilège plus strict, ce qui est une décision de forme, pas une seconde
   classe. La checklist reste **verte sur les seize points**.
7. Les éléments incomplets exigeraient une reprise de la spécification avant `/speckit-clarify` ou
   `/speckit-implement`. Aucun ne l'est.
