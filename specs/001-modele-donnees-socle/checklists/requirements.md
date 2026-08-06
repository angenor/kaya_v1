# Liste de contrôle qualité de la spécification : Modèle de données du socle (cycle D1)

**Objet** : valider la complétude et la qualité de la spécification avant de passer à la planification
**Créée le** : 2026-08-06
**Fonctionnalité** : [spec.md](../spec.md)

## Qualité du contenu

- [x] Pas de détail d'implémentation (langages, cadriciels, API) — *voir note 1*
- [x] Centrée sur la valeur et le besoin
- [x] Rédigée pour un lecteur non implémenteur — *voir note 1*
- [x] Toutes les sections obligatoires sont remplies

## Complétude des exigences

- [x] Aucun marqueur [NEEDS CLARIFICATION] ne subsiste
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

1. **Les quatre points marqués relèvent d'une exception assumée, pas d'un écart.** Le livrable de ce
   cycle **est** le modèle de données en SQL PostgreSQL (constitution, principe 0 ; cadrage §13.0).
   Nommer `FORCE ROW LEVEL SECURITY`, `pg_policies`, `NUMERIC` ou `GRANT` n'est pas une fuite
   d'implémentation : c'est **l'objet même** de la spécification. La règle qui s'applique ici est
   celle du principe 1b — le modèle de données est une source de vérité au même titre que le contrat
   OpenAPI. La ligne à ne pas franchir a été tenue : la spécification ne contient **aucun `CREATE
   TABLE`, aucune colonne typée, aucune expression de politique** — elle dit ce que chaque fichier
   doit prouver, pas comment l'écrire.
2. Un seul écart délibéré à la liste de fichiers de l'entrée : l'ajout de `comptabilite.sql`
   (hypothèse 1). Il est signalé comme tel et réversible.
3. Trois arbitrages ont été rendus sans question bloquante, parce que la constitution les tranchait :
   le `tenant_id` de `partenaire` (cas limite 1 et FR-027), les référentiels partagés entre tenants
   (hypothèse 4) et l'immuabilité de l'outbox face au marquage « publié » (hypothèse 7).
4. Les éléments incomplets exigeraient une reprise de la spécification avant `/speckit-clarify` ou
   `/speckit-plan`. Aucun ne l'est.
