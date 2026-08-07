# Modèle de données de Kaya — index

*Le SQL de référence, écrit avant tout code. Ce répertoire est **le livrable** du cycle D1 et la
source de vérité du modèle (constitution, principe 1b).*

**118 tables · 15 fichiers · 14 schémas PostgreSQL · dont 20 provisions.**

*Cycle **D1** — le socle : 71 tables sur 11 fichiers. Cycle **D2** — les capacités et les
verticales : 47 tables de plus. **La phase 1 du produit est close.***

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
- `ventes`
- `synchronisation`
- `pilotage`
- `editeur`
- `metriques`
- `comptabilite`
- `stocks`
- `hebergement`
- `pressing`

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

ventes  (socle/)                            stocks  (capacites/)
──────                                      ──────
categorie_article  ····> point_de_vente     point_de_stock ····> etablissement
destination_preparation ····> ETABLISSEMENT article_stock  ····> etablissement
  └─ article ····> point_de_vente             └─ article_stock_catalogue
       ├─ article  (parent, provision)             ····> ventes.article
       └─ ligne_commande                   mouvement_stock ─┬─ article_stock
jeton_table ····> table_pdv                                 └─ point_de_stock
  └─ commande ····> point_de_vente         inventaire ─ point_de_stock
       │      ····> (cible OPAQUE)           │        ····> compte
       ├─ lot_envoi ─ destination_prep.      └─ ligne_inventaire ─ article_stock
       │    └─ ligne_commande               alerte_seuil ─┬─ article_stock
       ├─ remise ─ ligne_commande                         └─ point_de_stock
       └─ part_addition ····> (OPAQUE)
numerotation_reference ····> etablissement
conversion_unite_mesure  (provision, AUCUN GRANT)

hebergement  (verticales/)                  pressing  (verticales/)
───────────                                 ────────
categorie ····> etablissement               numerotation_retrait ····> etab.
  ├─ unite                                  bon_depot ····> point_de_vente
  │    ├─ occupation  ⟵ EXCLUDE gist          │       ····> etablissement
  │    │    └─ intervention                   │       ····> comptes.personne
  │    ├─ sejour      ····> etablissement     │       ┄┄┄> hebergement.sejour
  │    ├─ reservation ····> etablissement     └─ piece_deposee
  │    └─ incident_maintenance ····> compte
  └─ formule                                ⚠️ pressing ne dépend JAMAIS
       ├─ temps_remise_en_etat ─ categorie     d'hebergement : bon_depot pointe
       ├─ bareme_palier                        sur comptes.personne, DU SOCLE.
       ├─ plage_demi_journee                   Un pressing seul est un
       ├─ calendrier_tarifaire                 établissement valide.
       └─ prestation_incluse   (provision)

client ····> comptes.personne
  ├─ sejour ─┬─ accompagnant
  │          ├─ fiche_police ····> etablissement
  │          ├─ note_sejour
  │          │    └─ ligne_sejour ┄┄┄> ventes.ligne_commande
  │          │                    ┄┄┄> pressing.bon_depot
  │          │                    ──── sejour  (transfert de charges)
  │          └─ taxe_sejour_constat
  ├─ reservation ─ arrhes ····> caisse.encaissement
  └─ contrat_location ─┬─ caution
                       ├─ charge_locative      (provisions)
                       └─ etat_des_lieux
preference_personne       ····> comptes.personne
numerotation_fiche_police ····> etablissement

──── clé étrangère, à l'intérieur d'un schéma
····> rattachement NU, sans REFERENCES : inter-modules
┄┄┄> SAGA à compensation explicite — le CAS ORPHELIN est le chemin NOMINAL
⟵    contrainte d'exclusion GiST — le chevauchement est refusé par la BASE
```

> **Aucune flèche pleine ne traverse un schéma, et ce n'est plus une promesse : c'est une porte.**
> La règle est vérifiée mécaniquement par **P-05** depuis le cycle D2, sur les **98 clés étrangères
> internes** du modèle. Avant elle, le seul rempart était le commentaire de colonne — *et un
> commentaire ne refuse rien*.

> **Les deux flèches `┄┄┄>` sont les deux SAGAS, et leur cas orphelin est le chemin NOMINAL.**
> Une consommation prise hors ligne arrive régulièrement sur une note **déjà arrêtée** ; un bon de
> pressing survit régulièrement au départ de son client. Dans les deux cas l'écriture est
> **acceptée, constatée, et part en réconciliation** — `synchronisation.reconciliation_orpheline`,
> créée au cycle D1, **la seule file du modèle**. Une clé étrangère ferait échouer en base
> l'écriture que le produit doit accepter.

### ⚠️ Le piège du préfixe à trois chiffres — pour le cycle qui voudra un seizième fichier

**En tri lexicographique, `100-` vient AVANT `20-`** — donc avant tout le socle. Un fichier
`100-nouveau.sql` s'appliquerait **en premier**, avant `00-conventions.sql` lui-même, et échouerait
sur des rôles et des domaines qui n'existent pas encore. **L'erreur accuserait le fichier ; la faute
serait dans son nom.**

`scripts/verifier.sh` applique `docs/modele-donnees/*.sql` **trié**, sans liste interne — c'est ce
qui garantit qu'aucune liste ne peut diverger du répertoire, et c'est aussi ce qui rend ce piège
possible.

**Il reste de la place à deux chiffres** : `56-` à `59-`, `61-` à `69-`, `71-` à `79-`, `81-` à
`89-`, `91-` à `94-`, et `99-`. Le jour où elle manquera vraiment, le passage à trois chiffres
imposera de **renommer les quinze fichiers d'un coup** — `010-`, `020-`, … — et non d'en ajouter un
seul. C'est un changement à faire en connaissance de cause, dans un commit qui ne fait que cela.

---

## Les 118 tables et leur classe hors-ligne

*Les classes sont reprises de [docs/registre-classes-offline.md](../registre-classes-offline.md),
qui **fait foi**. **★** marque les entités **nommées par un cycle** — D1 ou D2 — parce que le
registre les décrivait sans les nommer. Une table qui porte deux classes selon l'opération les
déclare toutes les deux — c'est le cas normal, pas l'exception.*

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

### `ventes` — 11 tables, dont 1 provision

*Le tronc commun de la vente, dans **`socle/`**. `verticales/restauration` et `verticales/bar` sont
des **coquilles vides** : tout ce qu'elles feraient est ici.*

| Table | Classe | À quoi elle sert |
|---|---|---|
| `categorie_article` | **C · C2** | Le regroupement d'affichage de la carte, par point de vente |
| `destination_preparation` | **C · C2** | Où part le bon d'envoi — **par établissement** : une cuisine sert plusieurs points de vente |
| `article` | **C · C2** | Ce qui se vend. Destination **facultative**, avec repli sur le point de vente |
| `conversion_unite_mesure` *(provision)* | **C · C2** | **Aucun `GRANT`, pas même `SELECT`** — l'absence est ce qui la prouve provision |
| `commande` | **A · A4** *(ouverture, réception QR)* · **B · B3** *(validation QR, addition de table)* | Ce qu'on sert, et à qui on le facture. Cible **opaque** |
| `ligne_commande` | **A · A4** *(saisie, modification avant envoi)* · **B · B3** *(annulation après envoi)* | Prix **verrouillé à la création** |
| `lot_envoi` | **A · A4** | Ce qui est parti en préparation — **immuable par privilège** |
| `remise` | **B · B3** | Un geste commercial, son motif, et qui l'a autorisé |
| `part_addition` | **B · B3** | L'addition divisée, part par part |
| `numerotation_reference` | **B · B3** | Un compteur en table à verrou de ligne, jamais une `SEQUENCE` |
| `jeton_table` | **C · C2** | Le QR de la table — **empreinte seule**, jamais le jeton |

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

### `stocks` — 7 tables

*Une **capacité**, pas un module : le stock sert la restauration, le bar et le pressing sans
appartenir à aucun. Seul le profil `SIMPLE` est implémenté.*

| Table | Classe | À quoi elle sert |
|---|---|---|
| `point_de_stock` | **C · C2** | Cave, cuisine, bar — **distinct du point de vente** |
| `article_stock` | **C · C2** | Ce qu'on suit en quantité — un fût, pas une bière pression |
| ★ `article_stock_catalogue` | **C · C2** | Combien un article vendu consomme — la liaison qui rend le décrément possible |
| `mouvement_stock` | **B · B3** | Ce qui fait bouger une quantité. **Privilège plus strict que la classe** : une correction est une contre-passation |
| `inventaire` | **B · B3** | On compte ce qu'il y a réellement — **même régime** |
| ★ `ligne_inventaire` | **B · B3** | Un article compté, et son écart — un **constat daté** |
| `alerte_seuil` | **A · A4** | Le stock est passé sous le seuil — un fait, pas un état qu'on acquitte |

### `hebergement` — 26 tables, dont 5 provisions

*Tout le spécifique hôtelier, et **nulle part ailleurs**. La salle de réunion est une **unité d'une
catégorie dédiée**, pas une entité nouvelle.*

| Table | Classe | À quoi elle sert |
|---|---|---|
| `categorie` | **C · C2** | Une classe d'unités, et sa capacité d'accueil |
| `unite` | **C · C2** *(référentiel)* · **A · A4** *(`statut_menage` — dernier-écrit-gagne, **seul cas du produit**)* | Une chambre, une salle. **Aucune colonne de statut d'occupation** : il est dérivé |
| `formule` | **C · C2** | Nuitée, passage, demi-journée, salle. Porte les **entrées** du calcul fiscal, jamais la règle |
| `temps_remise_en_etat` | **C · C2** | La durée de blocage après départ — **unique sur le COUPLE catégorie + formule** |
| `bareme_palier` | **C · C2** | Le tarif du passage, par palier de durée |
| `plage_demi_journee` | **C · C2** | Les créneaux d'une formule demi-journée |
| `calendrier_tarifaire` | **C · C2** | Le prix change selon la saison — daté, et superposable par priorité |
| **`occupation`** | **B · B3** | **La table la plus structurante du produit.** Deux `tstzrange`, un `CHECK` d'inclusion, et une **contrainte d'exclusion GiST partielle** |
| `client` | **C · C2** | **Aucune donnée d'identité dupliquée**, **aucun `etablissement_id`** — partagé entre les établissements du tenant |
| `preference_personne` | **A · A4** | « Chambre calme, étage bas » — **sur la personne**, pas sur le client |
| `sejour` | **B · B3** | Du check-in au check-out. **`occupation_id` obligatoire** |
| `accompagnant` | **A · A4** | Qui d'autre dort là — la base du calcul de taxe |
| `note_sejour` | **B · B3** | Ce que le séjour doit. Son état `ARRETEE` **déclenche le cas orphelin** |
| `ligne_sejour` | **B · B3** · **classe de la ligne d'origine** *(consommation venue d'un point de vente)* | Une ligne de la note. Deux **index UNIQUE partiels** portent l'idempotence des deux reports |
| `fiche_police` | **B · B3** | L'obligation déclarative, numérotée par établissement et par année |
| `numerotation_fiche_police` | **B · B3** | Son compteur en table |
| `taxe_sejour_constat` | **B · B3** | Le constat **figé au départ** — immuable par privilège |
| `reservation` | **B · B3** | Une unité promise. On réserve une **catégorie** sur un `tstzrange`, l'unité vient plus tard — **aucune exclusion ici** : le blocage naît de l'`occupation` |
| `arrhes` | **B · B3** *(espèces, virement)* · **D · D1** *(Mobile Money, carte)* | L'imputation de ce qui a été versé d'avance |
| `incident_maintenance` | **A · A4** | « Le climatiseur de la 12 » — **signaler n'est pas mettre hors service** |
| `intervention` | **A · A4** | Ce qui a été fait, et quand |
| `prestation_incluse` *(provision)* | **C · C2** | Ce que la formule comprend. **Son décompte n'a pas de table** |
| `contrat_location` *(provision)* | **C · C2** | La location meublée — l'occupation restera une `occupation` |
| `caution` *(provision)* | **C · C2** | Le dépôt de garantie |
| `charge_locative` *(provision)* | **C · C2** | Eau, électricité, charges |
| `etat_des_lieux` *(provision)* | **C · C2** | L'entrée et la sortie — une pièce contradictoire |

### `pressing` — 3 tables

*Dépôt, délai, retrait. **Il ne suppose jamais que l'établissement possède de l'hébergement** : un
pressing seul est un établissement valide.*

| Table | Classe | À quoi elle sert |
|---|---|---|
| `numerotation_retrait` | **B · B3** | Le compteur du numéro de retrait — *un trou est une pièce de linge dont personne ne sait si elle a existé* |
| `bon_depot` | **B · B3** *(création, `pret → retire`)* · **A · A4** *(transitions intermédiaires)* | `personne_id` vers **`comptes.personne`**, jamais vers `hebergement.client`. `moment_reglement` **figé à la création** |
| `piece_deposee` | **A · A4** | Ce qu'il y a dans le sac, et **l'état constaté au dépôt** |

---

## Ce que ce répertoire ne contient pas, et où c'est

| Ce qu'on pourrait y chercher | Où c'est |
|---|---|
| La classe hors-ligne d'une entité | [docs/registre-classes-offline.md](../registre-classes-offline.md), qui **fait foi** |
| Le contrat que chaque fichier honore | [contracts/conventions-sql.md](../../specs/001-modele-donnees-socle/contracts/conventions-sql.md) |
| Le détail colonne par colonne, et les motifs — **socle** | [data-model.md du cycle D1](../../specs/001-modele-donnees-socle/data-model.md) |
| Le détail colonne par colonne, et les motifs — **capacités et verticales** | [data-model.md du cycle D2](../../specs/002-modele-donnees-verticales/data-model.md) |
| Ce que la base garantit sur la **disponibilité**, et ce qu'elle laisse au `domain` | [contracts/disponibilite.md](../../specs/002-modele-donnees-verticales/contracts/disponibilite.md) |
| Ce que la phase 3 doit faire du **cas orphelin** des deux sagas | [contracts/sagas-inter-modules.md](../../specs/002-modele-donnees-verticales/contracts/sagas-inter-modules.md) |
| Les sessions, jetons, verrous, files locales | Nulle part en base : **éphémères reconstructibles** (registre §9) |
| Les tableaux de bord et les KPI | Nulle part en base : **dérivés** (voir `70-pilotage.sql`) |
