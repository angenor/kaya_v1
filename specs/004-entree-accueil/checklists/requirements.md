# Contrôle de qualité de la spécification : F2 — Entrée

**Objet** : vérifier que la spécification est complète et exploitable avant la planification
**Créée le** : 2026-08-07
**Cycle** : [spec.md](../spec.md)

## Qualité du contenu

- [x] Aucun détail d'implémentation (langage, cadriciel, API)
- [x] Centrée sur la valeur d'usage et le besoin métier
- [x] Lisible par un lecteur non technicien
- [x] Toutes les sections obligatoires sont remplies

## Complétude des exigences

- [x] Aucun marqueur [NEEDS CLARIFICATION] ne subsiste — les deux ont été tranchés
- [x] Les exigences sont vérifiables et non ambiguës
- [x] Les critères de succès sont mesurables
- [x] Les critères de succès sont indépendants de la technique
- [x] Tous les scénarios d'acceptation sont écrits
- [x] Les cas limites sont recensés
- [x] Le périmètre est borné, dans les deux sens (dedans / dehors)
- [x] Les dépendances et les hypothèses sont déclarées

## Aptitude à la planification

- [x] Chaque exigence fonctionnelle a un critère d'acceptation clair
- [x] Les récits couvrent les parcours principaux
- [x] La fonctionnalité satisfait les résultats mesurables des critères de succès
- [x] Aucun détail d'implémentation ne fuit dans la spécification

## Notes

**Les deux clarifications ont été tranchées** :

1. **FR-030 — le poste actif** : *affiché, jamais choisi*, dérivé du rattachement. Un seul poste →
   second segment ; **plusieurs postes → aucun second segment**, parce qu'affirmer un poste que le
   système ne connaît pas est un mensonge que six cycles hériteraient. Les deux formes d'en-tête
   doivent être observables au panneau Scénarios (FR-030a/b/c, SC-013).
2. **FR-052 — les surfaces qui mènent ailleurs** : *présentes, apparence exacte de F7, et le disent
   à l'appui*. Ni atténuation, ni badge, ni `disabled` — un badge « bientôt » réintroduirait le
   grisé par la porte de derrière. La mention **lit l'index des écrans du cycle F1** et disparaît
   d'elle-même sans que `R1` soit rouvert (FR-052a/b, SC-014).

**Écarts assumés, relevés et déclarés, non bloquants** :

- Les quatre maquettes `R1` affichent « À jour · il y a 1 min » au témoin d'envoi, ce que le lexique
  n'autorise pas (FR-053). Le lexique prime ; les maquettes sont corrigées dans le même changement.
- La variante « propriétaire » est traitée comme un état de `R1` et non comme `M4` — le fichier de
  maquette porte le code `R1`.
