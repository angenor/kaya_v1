# Modèle de données de Kaya — index

*Le SQL de référence, écrit avant tout code. Ce répertoire est **le livrable** du cycle D1 et la
source de vérité du modèle (constitution, principe 1b).*

---

## Ordre d'application

**L'ordre est porté par le préfixe numérique du nom de fichier**, par pas de dix. L'ordre
lexicographique **est** l'ordre de dépendance : `scripts/verifier.sh` applique
`docs/modele-donnees/*.sql` **trié**, sans liste interne. Il n'existe donc pas de liste d'ordre
ailleurs, donc pas de liste qui puisse diverger du répertoire.

| Ordre | Fichier | Ce qu'il pose |
|---|---|---|
| 1 | `00-conventions.sql` | Rôles, extension, domaines partagés, patron RLS, pièges de migration |
| 2 | `10-etablissements.sql` | Tenant, établissement, modules, capacités, points de vente, paramètres |
| 3 | `20-comptes.sql` | Personnes, comptes, rôles, appareils, journal d'audit |
| 4 | `30-caisse.sql` | Caisses, shifts, encaissements, comptages, clôtures |
| 5 | `40-fiscalite.sql` | Paramétrage fiscal, clés FNE, documents fiscaux, certification |
| 6 | `50-documents.sql` | Documents opérationnels, numérotation, modèles |
| 7 | `60-synchronisation.sql` | Outbox, publication, réconciliation |
| 8 | `70-pilotage.sql` | Alertes configurables |
| 9 | `80-editeur.sql` | Plans, abonnements, télémétrie du parc |
| 10 | `90-metriques.sql` | Événements de métrique, agrégats |
| 11 | `95-comptabilite.sql` | Provisions comptables |

---

## Schémas déclarés

*Cette liste est **opposable** : la porte P-01 compare les schémas trouvés dans la base à ceux
déclarés ci-dessous. Un schéma présent dans la base et absent d'ici, ou l'inverse, est un échec.
`00-conventions.sql` ne crée aucun schéma — il pose des objets partagés au niveau du cluster et de
la base ; `public`, qui n'accueille que ces objets partagés, est hors périmètre.*

> **Cette liste dit ce que le modèle CONTIENT, jamais ce qu'il contiendra.** Elle grandit dans le
> même changement que le fichier qui crée le schéma — c'est la règle de tenue appliquée à
> elle-même. Le tableau de l'ordre d'application, lui, énumère les onze fichiers attendus au terme
> du cycle : ce sont deux listes de nature différente, et les confondre rendrait la porte P-01
> soit aveugle, soit rouge en permanence.

- `etablissements`
- `comptes`
- `caisse`
- `fiscalite`
- `documents`
- `synchronisation`
- `pilotage`
- `editeur`
