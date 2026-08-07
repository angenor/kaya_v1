# Modèle de données de Kaya — index

*Le SQL de référence, écrit avant tout code. Ce répertoire est **le livrable** du cycle D1 et la
source de vérité du modèle (constitution, principe 1b).*

**71 tables · 11 fichiers · 10 schémas PostgreSQL · dont 14 provisions.**

Pour tout appliquer et tout vérifier, une seule commande :

```sh
scripts/verifier.sh
```

---

## La règle de tenue — à lire avant d'écrire la première migration

> **Toute migration de phase 3 met à jour le fichier de son schéma DANS LE MÊME CHANGEMENT, et un
> test compare le schéma réel aux fichiers de ce répertoire et échoue sur tout écart.**

**Pourquoi cette règle existe.** Une source de vérité périmée est **pire que pas de source du tout,
parce qu'on continue de la croire**. Un développeur qui lit `30-caisse.sql` pour savoir ce que porte
`encaissement` ne se demande pas si le fichier est à jour — il le lit, et il code contre ce qu'il a
lu. Le jour où le fichier ment, l'erreur ne se voit pas à la relecture : elle se voit en production.

**« Dans le même changement » n'est pas une préférence de style.** Une mise à jour différée d'un
jour est une mise à jour qui n'arrivera pas : la migration sera relue, approuvée, déployée, et le
fichier restera tel quel. Le seul moment où la mise à jour coûte zéro est celui où l'on a la
migration sous les yeux.

**Le test qui compare est ce qui rend la règle opposable** — une règle sans contrôle est un vœu. Ce
test n'existe pas encore, aucune migration n'existant, et c'est précisément pourquoi la règle
s'écrit **avant** la première : c'est le seul moment où elle est gratuite. Le cycle qui écrira la
première migration écrira le test avec elle.

---

## Ordre d'application

**L'ordre est porté par le préfixe numérique du nom de fichier**, par pas de dix. L'ordre
lexicographique **est** l'ordre de dépendance : `scripts/verifier.sh` applique
`docs/modele-donnees/*.sql` **trié**, sans liste interne. Il n'existe donc pas de liste d'ordre
ailleurs, donc pas de liste qui puisse diverger du répertoire.

> **Ce que le préfixe achète, et ce qu'il coûte.** Il achète l'impossibilité d'un désaccord entre
> le script et le répertoire. Il coûte le renommage d'un fichier si un schéma devait s'intercaler —
> d'où les pas de dix, qui laissent neuf places libres entre chaque.

| Ordre | Fichier | Schéma | Famille de crate | Tables | Dont provisions |
|---|---|---|---|---|---|
| 1 | `00-conventions.sql` | *(aucun — rôles, extension, domaines, patrons)* | — | — | — |
| 2 | `10-etablissements.sql` | `etablissements` | `socle/` | 19 | 6 |
| 3 | `20-comptes.sql` | `comptes` | `socle/` | 11 | 1 |
| 4 | `30-caisse.sql` | `caisse` | `socle/` | 12 | 3 |
| 5 | `40-fiscalite.sql` | `fiscalite` | `socle/` | 10 | 2 |
| 6 | `50-documents.sql` | `documents` | `socle/` | 3 | — |
| 7 | `55-ventes.sql` | `ventes` | `socle/` | 11 | 1 |
| 8 | `60-synchronisation.sql` | `synchronisation` | `socle/` | 3 | — |
| 9 | `70-pilotage.sql` | `pilotage` | `socle/` | 1 | — |
| 10 | `80-editeur.sql` | `editeur` | `socle/` | 8 | — |
| 11 | `90-metriques.sql` | `metriques` | `socle/` | 2 | — |
| 12 | `95-comptabilite.sql` | `comptabilite` | `socle/` | 2 | 2 |
| 13 | `96-stocks.sql` | `stocks` | `capacites/` | 7 | — |
| 14 | `97-hebergement.sql` | `hebergement` | `verticales/` | 26 | 5 |
| 15 | `98-pressing.sql` | `pressing` | `verticales/` | 3 | — |
| | | | **Total** | **118** | **20** |

> **Ce tableau ÉNUMÈRE LES FICHIERS et peut annoncer ce qui vient ; la liste `## Schémas déclarés`
> ci-dessous est OPPOSABLE et ne dit que ce qui existe.** Les deux listes ne sont pas de même
> nature, et les confondre rendrait P-01 soit aveugle, soit rouge en permanence. Chaque schéma
> entre à la liste opposable **dans le changement qui crée son fichier**.

> **`ventes` s'intercale à `55-`, hors du pas de dix, et c'est ce que les pas de dix achètent.**
> `ventes` est un crate de **`socle/`** : le placer à `99-`, avec les verticales, dirait le
> contraire à qui lit le répertoire. L'ordre lexicographique n'est **aucunement** une contrainte
> technique — aucune clé étrangère ne traverse un schéma, PostgreSQL accepterait n'importe quel
> ordre. Il est **purement documentaire**, et c'est précisément pourquoi il doit dire la
> hiérarchie de dépendance : c'est la seule information qu'il porte.

---

## Schémas déclarés

*Cette liste est **opposable** : la porte P-01 compare les schémas trouvés dans la base à ceux
déclarés ci-dessous. Un schéma présent dans la base et absent d'ici, ou l'inverse, est un échec.
`00-conventions.sql` ne crée aucun schéma — il pose des objets partagés au niveau du cluster et de
la base ; `public`, qui n'accueille que ces objets partagés, est hors périmètre.*

> **Cette liste dit ce que le modèle CONTIENT, jamais ce qu'il contiendra.** Elle grandit dans le
> même changement que le fichier qui crée le schéma — c'est la règle de tenue appliquée à
> elle-même. Le tableau de l'ordre d'application, lui, énumère les fichiers du modèle : ce sont
> deux listes de nature différente, et les confondre rendrait P-01 soit aveugle, soit rouge en
> permanence.

- `etablissements`
- `comptes`
- `caisse`
- `fiscalite`
- `documents`
- `synchronisation`
- `pilotage`
- `editeur`
- `metriques`
- `comptabilite`
- `stocks`
- `hebergement`

---

## Les relations principales, en texte

**Aucune flèche ne traverse un schéma de module.** C'est la propriété la plus importante de ce
diagramme, et elle n'est pas décorative : à l'intérieur d'un schéma, les clés étrangères sont
normales et souhaitables ; **entre deux schémas de modules, il n'y en a aucune**, même quand la
table cible existe. Les rattachements inter-modules sont des colonnes d'identifiant **nues**, et
chacune porte un commentaire qui le dit — sans quoi le cycle suivant prendrait l'absence de
`REFERENCES` pour un oubli et l'ajouterait.

```
etablissements                              comptes
──────────────                              ───────
tenant                                      personne
  └─ etablissement                            ├─ compte
       ├─ etablissement_module                │    ├─ compte_role ····> etablissement
       ├─ point_de_vente ····> caisse         │    └─ appareil_enrole
       │    └─ table_pdv                      │         └─ releve_position
       ├─ note_etablissement ····> compte     └─ employe              (provision)
       ├─ partenaire            (provision)  journal_audit ····> etablissement, compte
       │    ├─ demande_partenaire
       │    └─ compte_compensation           caisse
       │         └─ mouvement_compensation   ──────
       ├─ convention_inter_etablissements    caisse ····> etablissement
       └─ dispositif           (provision)     └─ shift ····> compte
                                                    ├─ encaissement ····> (note, addition…)
module_activite ─┐                                  ├─ sortie_de_caisse
                 ├─ module_capacite ─ profil_stock  └─ comptage
capacite ────────┘                                       ├─ coupure_comptee
                                                         └─ ecart_de_caisse
parametre_catalogue                           cloture_shift ── shift
  └─ parametre_configuration                  cloture_journaliere ····> etablissement
branding                                      compte_client ─┬─ encours
                                                             └─ condition_reglement
                                                                        (provisions)

fiscalite                                   documents
─────────                                   ─────────
parametrage_fiscal        ····> etab.       document_operationnel ····> etab., (cible)
cle_fne                   ····> etab.       numerotation_document ····> etab.
document_fiscal           ····> etab.       modele_document
  ├─ item_certifie
  ├─ avoir ── document_fiscal               synchronisation
  └─ file_certification                     ───────────────
compteur_stickers         ····> etab.       evenement_outbox ····> etab.
etat_reversement_communal ····> etab.         └─ publication_outbox
devis ── document_commercial                reconciliation_orpheline ····> (origine, cible)
             (provisions)

editeur                             metriques           pilotage           comptabilite
───────                             ─────────           ────────           ────────────
plan ── palier                      evenement_metrique  alerte_configurable  mapping_comptable
abonnement ── plan                  agregat_quotidien                        exercice_comptable
  └─ encaissement_abonnement                                                     (provisions)
unite_facturable   ····> tenant abonné
telemetrie_parc    ····> tenant observé
bundle_diagnostic
evenement_webhook_paiement

──── clé étrangère, à l'intérieur d'un schéma
····> rattachement NU, sans REFERENCES : inter-modules
```

---

## Les 71 tables et leur classe hors-ligne

*Les classes sont reprises de [docs/registre-classes-offline.md](../registre-classes-offline.md),
qui **fait foi**. **★** marque les entités **nommées par le cycle D1**. Une table qui porte deux
classes selon l'opération les déclare toutes les deux — c'est le cas normal, pas l'exception.*

### `etablissements` — 19 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `tenant` | **C · C2** | Le client de l'éditeur, racine de toute isolation |
| `etablissement` | **C · C2** | Un lieu d'exploitation, unité fiscale |
| `module_activite` | **C · C2** | La verticale — ce que fait l'établissement |
| `capacite` | **C · C2** | Le transverse — ce dont il a besoin pour le faire |
| `profil_stock` | **C · C2** | `AUCUN` · `SIMPLE` · `VALORISE` · `DETAILLE` |
| `module_capacite` | **C · C2** | Quel module consomme quelle capacité, sous quel profil de stock |
| `etablissement_module` | **C · C2** | Activation d'un module sur un lieu |
| `point_de_vente` | **C · C2** | Où l'on vend, rattaché à un module |
| `table_pdv` | **C · C2** | Les tables d'un point de vente qui en a |
| `parametre_catalogue` | **C · C2** | Le référentiel des clés de configuration |
| `parametre_configuration` | **C · C2** | Une valeur, à une portée donnée |
| `branding` | **C · C2** | Logo, couleurs, en-têtes de documents |
| `note_etablissement` | **A · A4** | Un mot laissé sur l'établissement — le patron du module doré |
| `partenaire` *(provision)* | **C · C2** | Un tiers avec qui l'établissement travaille |
| `demande_partenaire` *(provision)* | **C · C2** | Ce qu'on lui demande |
| `compte_compensation` *(provision)* | **B · B3** | Le solde tenu avec lui |
| `mouvement_compensation` *(provision)* | **B · B3** | Ce qui fait bouger ce solde |
| `convention_inter_etablissements` *(provision)* | **C · C2** | La voie **non retenue** — aucun `GRANT`, pas même `SELECT` |
| `dispositif` *(provision)* | **A · A4** | Contrôle d'accès physique — canal hors ligne obligatoire |

### `comptes` — 11 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `personne` | **C · C2** | L'identité, partagée entre les établissements du tenant |
| `compte` | **C · C2** | L'identité d'authentification |
| `methode_authentification` | **C · C2** | Mot de passe, OTP par SMS |
| `role` | **C · C2** | Gérant, serveuse, réceptionniste, propriétaire |
| `permission` | **C · C2** | Une action nommée |
| `role_permission` | **C · C2** | Ce qu'un rôle permet |
| `compte_role` | **C · C2** | Quel rôle, **sur quel établissement** |
| `appareil_enrole` | **C · C2** | Un terminal reconnu, et son attestation d'intégrité |
| `journal_audit` | **A · A4** | Ce qui a été fait, et par qui — immuable par privilège |
| ★ `releve_position` | **A · A4** | Le géorepérage souple — on relève, on n'interdit pas |
| `employe` *(provision)* | **C · C2** | Le contrat de travail, jamais confondu avec le compte |

### `caisse` — 12 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `caisse` | **C · C2** | Un tiroir, physique ou non |
| `shift` | **B · B3** | Un utilisateur, une caisse, une période |
| `encaissement` | **B · B3** *(espèces, virement, à crédit)* · **D · D1** *(Mobile Money, carte)* | De l'argent reçu, contre quelque chose |
| `sortie_de_caisse` | **B · B3** | Une dépense, une avance, un prélèvement |
| `comptage` | **B · B3** | Ce qu'on a compté, à trois moments |
| ★ `coupure_comptee` | **B · B3** | Le détail par coupure — ce qui se recompte |
| `ecart_de_caisse` | **B · B3** | La différence entre l'attendu et le constaté |
| `cloture_shift` | **B · B3** | Le shift est arrêté, son récapitulatif est figé |
| `cloture_journaliere` | **B · B3** | Une seule par établissement et par jour — atomique |
| `compte_client` *(provision)* | **B · B3** | Le client à qui l'on fait crédit |
| `encours` *(provision)* | **B · B3** | Ce qu'il doit, à un instant arrêté |
| `condition_reglement` *(provision)* | **B · B3** | Sous quel délai, par quel moyen |

### `fiscalite` — 10 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `parametrage_fiscal` | **C · C2** | Des paramètres datés, jamais un calcul |
| `cle_fne` | **C · C2** | Le coffre, chiffré par tenant |
| `document_fiscal` | **D · D1** | La facture certifiée, numérotée par la DGI |
| `item_certifie` | **D · D1** | Les lignes, et **leurs identifiants DGI** — sans eux, aucun avoir |
| `avoir` | **D · D1** | L'annulation, par quantité |
| `file_certification` | **D · D1** | Cinq états, `INDETERMINEE` comprise — jamais rejouée |
| `compteur_stickers` | **D · D1** | Un compteur en table, jamais une `SEQUENCE` |
| `etat_reversement_communal` | **A · A4** | Ce qui est dû à la commune — dérivé, recalculable |
| `devis` *(provision)* | **B · B3** | Une proposition chiffrée |
| `document_commercial` *(provision)* | **B · B3** | Bon de commande, bon de livraison |

### `documents` — 3 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `document_operationnel` | **A · A4** *(brouillon)* · **B · B3** *(émission numérotée)* | Ce qu'on imprime quand ce n'est pas fiscal |
| `numerotation_document` | **B · B3** | Un compteur en table à verrou de ligne |
| `modele_document` | **C · C2** | En-tête, pied, mentions obligatoires, gabarit |

### `synchronisation` — 3 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `evenement_outbox` | **A · A4** | Le grand livre permanent — rétention illimitée, immuable |
| ★ `publication_outbox` | **A · A4** | La publication comme **fait ajouté**, jamais une mutation |
| `reconciliation_orpheline` | **A · A4** *(création)* · **B · B3** *(résolution non implémentée)* | L'écriture arrivée trop tard |

### `pilotage` — 1 table

| Table | Classe | À quoi elle sert |
|---|---|---|
| `alerte_configurable` | **C · C2** | À partir de quand on prévient, et qui |

*Tableaux de bord, KPI, recettes par service, rapports périodiques et consultation du journal
d'audit sont **dérivés** et n'ont délibérément aucune table — le fichier le dit en tête.*

### `editeur` — 8 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `plan` | **C · C2** | Forfait par palier, ou compteur |
| `palier` | **C · C2** | De tant à tant d'unités, tel montant |
| `abonnement` | **C · C2** | Ce qu'un client a souscrit |
| `unite_facturable` | **C · C2** | Une **métrique abstraite**, jamais « chambre » en dur |
| `telemetrie_parc` | **A · A4** | Version, santé, erreurs d'un client |
| `bundle_diagnostic` | **A · A4** | Un export d'assistance, à la demande |
| ★ `encaissement_abonnement` | **D · D1** | Le client paie son abonnement |
| ★ `evenement_webhook_paiement` | **D · D1** | L'idempotence portée par une contrainte, jamais par du code |

### `metriques` — 2 tables

| Table | Classe | À quoi elle sert |
|---|---|---|
| `evenement_metrique` | **A · A4** | Un usage constaté — idempotent par UUID client |
| `agregat_quotidien` | **A · A4** | Un indicateur, un jour, une valeur — un recalcul est une nouvelle ligne |

### `comptabilite` — 2 tables, provisions seules

| Table | Classe | À quoi elle sert |
|---|---|---|
| `mapping_comptable` *(provision)* | **C · C2** | Quel événement donne quelle écriture |
| `exercice_comptable` *(provision)* | **C · C2** | Une période, ouverte ou close |

---

## Ce que ce répertoire ne contient pas, et où c'est

| Ce qu'on pourrait y chercher | Où c'est |
|---|---|
| Les schémas `hebergement`, `ventes`, `pressing`, `stocks` | Cycle **D2** — hors périmètre du socle |
| La classe hors-ligne d'une entité | [docs/registre-classes-offline.md](../registre-classes-offline.md), qui **fait foi** |
| Le contrat que chaque fichier honore | [contracts/conventions-sql.md](../../specs/001-modele-donnees-socle/contracts/conventions-sql.md) |
| Le détail colonne par colonne, et les motifs | [data-model.md](../../specs/001-modele-donnees-socle/data-model.md) |
| Les sessions, jetons, verrous, files locales | Nulle part en base : **éphémères reconstructibles** (registre §9) |
| Les tableaux de bord et les KPI | Nulle part en base : **dérivés** (voir `70-pilotage.sql`) |
