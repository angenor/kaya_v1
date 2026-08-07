# Kaya — Registre des classes hors-ligne

*Source de vérité de la classe A/B/C/D de chaque entité et de chaque opération.
Référencé par le principe VI de `.specify/memory/constitution.md` et par le point 5 de la
Definition of Done (`docs/user-stories-v1.md` §0.4).*

> ### CE REGISTRE EST L'ENTRÉE DIRECTE DU CYCLE D1
>
> **1. Il est consommé en PHASE 1, avant tout code.** Le cycle D1 produit
> `docs/modele-donnees/{schema}.sql`, et **les privilèges y prouvent la classe** : une entité de
> classe A append-only reçoit `SELECT, INSERT` et jamais `UPDATE` ni `DELETE` ; une provision reçoit
> `SELECT` seul, ou rien du tout quand rien n'a de raison de la lire. Le commentaire d'en-tête de
> chaque table porte sa classe et sa branche. **Quand ce registre décrit une table sans la nommer**
> — « plages de demi-journée », « liste d'articles déposés » —, c'est le cycle D1 ou D2 qui pose le
> nom, et qui l'inscrit ici.
>
> **2. Les classes gouvernent l'interface dès la PHASE 2, sur données simulées.** C'est le point
> qu'on écrirait mal : une simulation peut techniquement tout accepter, donc la tentation est
> d'ignorer les classes tant que rien n'est branché. **Elle produit un écran qui ment** — il accepte
> en phase 2 ce que le serveur refusera en phase 3, et le mensonge ne se découvre qu'au branchement,
> quand l'écran est à refaire. La règle d'interface du cadrage §11.1 s'applique donc telle quelle
> aux mocks : *une action indisponible faute de réseau le dit immédiatement et explicitement, avant
> que l'utilisateur ne la tente*.

---

## 1. Objet et autorité

Ce registre est **normatif**. Toute entité et toute opération qui écrit en base porte ici une
classe. La règle absolue du cadrage §11.1 s'applique sans exception :

> **Une opération B, C ou D atteignable depuis un chemin de code exécutable hors ligne FAIT
> ÉCHOUER LE BUILD.** Invariante vérifiée par test (SYN-01), pas par convention.

Ce fichier fait foi sur toute supposition de code. En cas de contradiction avec le classement
de référence de `docs/cadrage-v1.md` §11.3, **le cadrage prime** et ce registre est corrigé dans
le même changement.

**Une entité absente de ce registre est une entité non implémentable.** La déclarer ici fait
partie de la story qui l'introduit, pas d'un travail ultérieur.

## 2. Les quatre classes

| Classe | Critère | Autorité | Écriture hors ligne |
|---|---|---|---|
| **A** | Append-only, commutatif, sans contrainte d'unicité, sans effet monétaire | Aucune | **Oui** |
| **B** | Sérialisation requise, à l'échelle d'un établissement | Nœud de site (mode C) ou cloud | **Mode C seulement** |
| **C** | Référentiel partagé entre établissements, ou relation éditeur–client | Cloud | **Non** |
| **D** | Dépend d'un tiers (DGI, agrégateur de paiement) | Externe | **Non** |

## 3. Arbre de décision

S'arrêter à la première réponse « oui ». Les codes de branche (`D1`, `C2`, `B3`, `A4`) sont
employés comme justification dans tout le registre.

| Code | Question | Classe |
|---|---|---|
| **D1** | Dépend d'un tiers externe ? | **D** |
| **C2** | Modifie du référentiel partagé entre établissements, ou la relation éditeur–client ? | **C** |
| **B3** | Peut produire un conflit si deux utilisateurs du même établissement l'exécutent simultanément — ressource unique, numérotation, décrément, effet monétaire ? | **B** |
| **A4** | Sinon | **A** |

**En cas de doute, classer plus strictement.** Une entité indûment classée A produit des
incohérences silencieuses découvertes trois mois plus tard en pleine clôture ; une entité
indûment classée B produit une frustration immédiate, visible et corrigeable.

## 4. Comment déclarer une entité

1. Dérouler l'arbre du §3 et noter le **code de branche**, pas seulement la lettre.
2. Ajouter une ligne dans le tableau du crate propriétaire (§5 à §9).
3. Écrire les tests exigés par la classe (§11).
4. Si l'entité est une **provision** — table sans logique —, la déclarer au §10 et non au §5-9.
5. Consigner l'ajout au §13 (journal des modifications).

**Une même table peut porter deux classes selon l'opération.** C'est le cas normal, pas une
exception : `encaissement` est B en espèces et D en Mobile Money ; `ligne_commande` est A à la
saisie et B à l'annulation après envoi. Le registre classe **l'opération**, et la colonne
« Entité ou opération » le dit explicitement.

---

## 5. `socle/` — noyau agnostique

### 5.1 `socle/etablissements`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `tenant` — création, modification | **C** | C2 — relation éditeur–client | ETB-01 |
| `etablissement` — création, modification | **C** | C2 — référentiel | ETB-01 |
| `etablissement.classement` (étoiles / non classé) | **C** | C2 — détermine le barème de nuitée | ETB-01, §11.3 |
| `etablissement.commune`, `.fuseau_horaire`, `.devise`, `.ncc` | **C** | C2 — référentiel fiscal | ETB-01 |
| `module_activite` — référentiel | **C** | C2 — référentiel partagé | ETB-02 |
| `etablissement_module` — activation, désactivation | **C** | C2 — modules activés | ETB-02, §11.3 |
| `capacite` — référentiel | **C** | C2 — référentiel partagé | ETB-02b |
| `profil_stock` — référentiel | **C** | C2 — référentiel partagé | ETB-02b |
| `module_capacite` — déclaration de consommation, `profil_stock` | **C** | C2 — référentiel | ETB-02b |
| `parametre_catalogue` — référentiel des clés de configuration | **C** | C2 — référentiel partagé | ETB-04 |
| `point_de_vente` — création, modification | **C** | C2 — référentiel | ETB-03 |
| `table_pdv` — création, modification du référentiel de tables | **C** | C2 — référentiel | ETB-03 |
| `parametre_configuration` — toute valeur de la chaîne d'héritage | **C** | C2 — référentiel de paramètres | ETB-04 |
| `branding` — logo, couleurs, en-têtes de documents | **C** | C2 — référentiel | ETB-05 |
| `note_etablissement` — création | **A** | A4 — append-only, commutative, sans effet monétaire | TRX-01 |
| Sélection d'établissement actif (contexte local) | **A** | A4 — préférence locale, sans effet | ETB-06 |
| **Lecture en cache** de tout référentiel et de tout paramètre ci-dessus | **A** | A4 — lecture seule, avec **fraîcheur affichée** | ETB-02, ETB-04 |

> **L'écriture et la lecture d'un référentiel ne sont pas de la même classe, et il faut le dire.**
>
> Toutes les écritures ci-dessus sont en **C** : aucun référentiel ne se modifie hors ligne. Mais
> leur **lecture** doit rester possible sans connexion, avec la date de dernière synchronisation
> affichée — sinon le produit devient inutilisable dès la première coupure. Une serveuse qui ne
> peut pas lire la liste des services de son établissement ne peut rien faire du tout, alors même
> qu'elle n'a rien à y modifier.
>
> C'est la même dualité que `encaissement`, **B** en espèces et **D** en Mobile Money (§5.3) : le
> registre classe des **opérations**, pas des tables. Sans cette ligne, un cycle ultérieur
> trancherait dans un sens ou dans l'autre sans que la décision soit visible — et le sens le plus
> probable serait « tout est C, donc rien ne se lit hors ligne ».
>
> **Le mécanisme de cache et le témoin de fraîcheur ne sont pas livrés par ETB** : ils relèvent de
> SYN-01/02 et d'ETB-06. Ce qui est arrêté ici est la **classe**, pour que le cycle qui écrira le
> cache n'ait pas à la deviner.

### 5.2 `socle/comptes`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `personne` — création, modification | **C** | C2 — identité partagée entre établissements | CPT-00 |
| `compte` — création, modification, changement d'état, changement de mot de passe | **C** | C2 — identité d'authentification | CPT-01 |
| `methode_authentification` — référentiel | **C** | C2 — référentiel | CPT-01 |
| `compte_role` — **attribution ou retrait de rôle** | **C** | C2 — explicitement C au cadrage §11.3 | CPT-02 |
| `role`, `permission`, `role_permission` — référentiels | **C** | C2 — référentiel | CPT-02 |
| Élévation de privilège | **C** | C2 — **aucune élévation hors ligne, jamais** | CPT-02 |
| `appareil_enrole` — enrôlement, révocation | **C** | C2 — explicitement C au cadrage §11.3 | CPT-05 |
| Attestation d'intégrité — vérification | **C** | C2 — vérifiée côté serveur | CPT-06 |
| `releve_position` — relevé de position (géorepérage souple) | **A** | A4 — signal d'audit, jamais bloquant | CPT-06 |
| `journal_audit` — écriture d'une entrée | **A** | A4 — append-only, immuable, sans effet propre | CPT-04 |

> **`journal_audit` est A, l'opération qu'il trace garde sa propre classe.** Tracer une remise
> hors ligne est A ; appliquer la remise est B. Les deux ne voyagent pas ensemble.

> **Les sessions ne figurent PAS à ce registre, et c'est une décision.** Elles vivent en Redis
> (research R-01), sont *éphémères reconstructibles* au sens du principe II, et ne sont donc ni
> une entité durable, ni une opération dont on puisse demander « est-ce possible hors ligne ? ».
> La réponse y serait d'ailleurs sans objet : une session ne s'ouvre que contre un serveur.
> Redis vidé, tout le monde se reconnecte et aucune donnée métier ne manque.

> **Point de vigilance — client inconnu en mode C.** `personne` est C, donc un check-in
> (classe B, autorisé hors ligne en mode C) portant un **client jamais vu** exige le cloud pour
> créer sa fiche. **Tranché le 2026-08-03 — option (a), la classe C est maintenue** ; la friction
> résiduelle est décrite au §12, sous la décision O-01 close.

### 5.3 `socle/caisse`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `caisse` — création, rattachement | **C** | C2 — référentiel | ETB-03 |
| `shift` — **ouverture**, fond de caisse déclaré | **B** | B3 — un utilisateur, une caisse, une période | CAI-01, §11.3 |
| `shift` — passation, comptage contradictoire | **B** | B3 — effet monétaire | CAI-01 |
| `encaissement` — **espèces** | **B** | B3 — irréversible, effet monétaire | CAI-02, §11.3 |
| `encaissement` — **virement**, **à crédit** | **B** | B3 — effet monétaire, constaté sans tiers en ligne | CAI-02 |
| `encaissement` — **Mobile Money**, **carte** | **D** | D1 — agrégateur de paiement | CAI-02, §11.3 |
| Règlement fractionné multi-modes | **classe de chaque part** | — | CAI-02 |
| `sortie_de_caisse` — dépense, avance, prélèvement | **B** | B3 — effet monétaire | CAI-03, §11.3 |
| `comptage`, `ecart_de_caisse` | **B** | B3 — effet monétaire, tracé | CAI-04, §11.3 |
| `coupure_comptee` — détail d'un comptage par coupure | **B** | B3 — effet monétaire, tracé ; suit son `comptage` | CAI-04 |
| `cloture_shift` | **B** | B3 — sérialisation par caisse | CAI-05 |
| `cloture_journaliere` | **B** | B3 — **atomique**, explicitement B au cadrage §11.3 | CAI-06 |
| Ouverture de tiroir-caisse (tracée) | **A** | A4 — explicitement A au cadrage §11.3 | IMP-01, §11.3 |

### 5.4 `socle/fiscalite`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `parametrage_fiscal` — taux, barèmes de taxe | **C** | C2 — référentiel fiscal | FIS-03, §11.3 |
| `cle_fne` — saisie, rotation (coffre chiffré par tenant) | **C** | C2 — explicitement C au cadrage §11.3 | FIS-04 |
| **Calcul** de la taxe de nuitée, de la TVA, de la taxe touristique | **A** | A4 — déterministe et local | §11.3 cas particulier |
| **Inscription** d'une taxe sur un document fiscal | **D** | D1 — passe par la certification | §11.3 cas particulier |
| `document_fiscal` (facture FNE) — émission | **D** | D1 — numérotation attribuée par la DGI | FIS-02 |
| `avoir` — émission | **D** | D1 — API DGI, débit d'un sticker | FIS-06, §11.3 |
| `item_certifie` — persistance des `id` d'items retournés | **D** | D1 — produit par l'API de certification | FIS-06 |
| `file_certification` — transition `EN_ATTENTE → SOUMISE → CERTIFIEE` | **D** | D1 — autorité externe | FIS-05 |
| `file_certification` — état `INDETERMINEE` | **D** | D1 — **jamais rejoué automatiquement** | FIS-05 |
| Rapprochement manuel d'un `INDETERMINEE` | **D** | D1 — décision humaine sur état externe | FIS-05 |
| `compteur_stickers` — décrément, seuil | **D** | D1 — décrément côté DGI | FIS-07 |
| `etat_reversement_communal` — génération | **A** | A4 — rapport dérivé, recalculable | FIS-08 |
| Export comptable | **A** | A4 — dérivé, recalculable | FIS-09 |

> **Aucun document fiscal n'est jamais généré hors ligne.** Le mode dégradé produit un document
> **opérationnel** (§5.5) portant la mention « Document non fiscal — ne tient pas lieu de
> facture », et place l'opération en file de régularisation.

### 5.5 `socle/documents`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `document_operationnel` — brouillon non numéroté | **A** | A4 — sans unicité, sans effet | FIS-02 |
| `document_operationnel` — **émission avec numéro interne** | **B** | B3 — **numérotation**, explicitement B au cadrage §11.3 | FIS-02, §11.3 |
| `numerotation_document` — allocation d'un numéro de séquence | **B** | B3 — ressource unique par établissement | §11.3 |
| Ticket de commande, bon de préparation, reçu — impression | **A** | A4 — rendu local, file d'impression avec reprise | IMP-01 |
| Note provisoire — génération | **A** | A4 — dérivée de la note, mention non fiscale obligatoire | IMP-02 |
| `modele_document` — en-tête, pied, mentions | **C** | C2 — référentiel de branding | IMP-04 |

### 5.6 `socle/synchronisation`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `evenement_outbox` — écriture dans la transaction métier | **A** | A4 — append-only, immuable, **rétention illimitée** | TRX-02 |
| `publication_outbox` — marquage « publié », **fait ajouté** jamais mutation | **A** | A4 — append-only ; l'événement étant immuable, la publication est une ligne, pas un `UPDATE` | TRX-02 |
| `reconciliation_orpheline` — création de l'élément en file | **A** | A4 — constat append-only | SYN-03 |
| `reconciliation_orpheline` — **résolution** (avoir, prise en charge, rattachement) | **B** | B3 — effet monétaire, **résolution humaine obligatoire** | SYN-03 |
| Horodatage d'autorité — attribution | **serveur uniquement** | — | SYN-04 |
| Horodatage client — enregistrement indicatif | **A** | A4 — ordre d'affichage local, jamais de logique métier | SYN-04 |

> **La file d'actions locale du terminal n'est pas une entité de ce registre** : c'est
> l'infrastructure qui transporte les écritures A. Elle **ne contient jamais** de donnée B, C
> ou D en cache d'écriture (cadrage §11.5 règle 4).

> ⚠️ **`reconciliation_orpheline` porte DEUX classes, et son `GRANT` le dit.** Création en **A**,
> résolution en **B** : tant que la résolution n'est pas implémentée, `kaya_app` reçoit `SELECT` et
> `INSERT`, jamais `UPDATE`. **Le privilège absent est ce qui PROUVE la provision** — un test
> l'inspecte, là où un commentaire ne prouverait rien.

> ⚠️ **« Horodatage d'autorité — attribution : serveur uniquement » n'est pas une convention, c'est
> une porte.** Elle refuse tout calcul métier, fiscal, de clôture ou de durée appuyé sur
> `horodatage_client`, sur un périmètre **découvert** et non énuméré. La ligne « Horodatage client —
> enregistrement indicatif : A » est ce qui la rend applicable : la colonne s'écrit, se relit et
> s'affiche — **elle ne décide de rien**.

### 5.7 `socle/pilotage`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| Tableaux de bord, KPI, rapports périodiques | **A** | A4 — lecture dérivée, **fraîcheur affichée** | DIR-01, DIR-02, DIR-05 |
| Consultation du journal d'audit | **A** | A4 — lecture | DIR-04 |
| `alerte_configurable` — seuils de remise, d'écart, de rebascule | **C** | C2 — paramétrage | DIR-04 |

### 5.8 `socle/editeur`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| Provisionnement de tenant, seeds fiscaux, comptes initiaux | **C** | C2 — relation éditeur–client | ADM-01 |
| `plan`, `palier`, seuils et montants d'abonnement | **C** | C2 — relation éditeur–client | ADM-03 |
| `abonnement` — souscription, gratuité, remise commerciale | **C** | C2 — relation éditeur–client | ADM-03 |
| `unite_facturable` — comptage par la verticale | **C** | C2 — dérivé du référentiel | ADM-03 |
| `encaissement_abonnement` — encaissement d'abonnement | **D** | D1 — explicitement D au cadrage §11.3 | ADM-04 |
| `evenement_webhook_paiement` — webhook de paiement, validation HMAC, idempotence | **D** | D1 — agrégateur ; l'idempotence est portée par une **contrainte d'unicité**, jamais par du code | ADM-04 |
| Suspension pour impayé | **C** | C2 — relation éditeur–client | ADM-04 |
| `telemetrie_parc` — version, santé, erreurs | **A** | A4 — append-only | TRX-07, ADM-02 |
| `bundle_diagnostic` — export | **A** | A4 — dérivé | TRX-07, ADM-05 |

### 5.9 `socle/metriques`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `evenement_metrique` — ingestion par lots | **A** | A4 — append-only, **idempotent par UUID** | MET-02 |
| `agregat_quotidien` | **A** | A4 — dérivé, recalculable | MET-03 |

> La **taxonomie d'événements** (MET-01) est versionnée dans le dépôt, pas en table : elle
> relève du contrat de code, non de ce registre.

---

## 6. `capacites/` — transverses

### 6.1 `capacites/stocks`

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `article_stock` — création, `seuil_alerte`, `unite_mesure` | **C** | C2 — référentiel | STK-01 |
| `point_de_stock` — cave, cuisine, bar | **C** | C2 — référentiel | STK-01 |
| `article_stock_catalogue` — liaison article de catalogue → article de stock | **C** | C2 — référentiel | STK-01 |
| `mouvement_stock` — entrée, sortie sur vente, ajustement, transfert, casse | **B** ⚠️ | B3 — décrément d'une quantité partagée | STK-02, §11.3 |
| `inventaire` — saisie, écart | **B** | B3 — effet sur les quantités | STK-03 |
| `ligne_inventaire` — quantité comptée et écart, une ligne par article compté | **B** | B3 — porte l'écart de l'inventaire, effet sur les quantités | STK-03 |
| `alerte_seuil` — déclenchement, notification | **A** | A4 — explicitement A au cadrage §11.3 | STK-04 |
| Consultation du stock hors ligne | **A** | A4 — lecture, **toujours affichée comme indicative** | STK-02 |

> ⚠️ **`mouvement_stock` est B par décision par défaut, décision B-05 non tranchée.** Si le
> pilote confirme que le stock sert à **détecter le vol**, il reste B et sérialisé ; s'il ne sert
> qu'à **réapprovisionner**, il peut passer en A. Voir §12, O-02.
> `quantite` est en **`NUMERIC`**, jamais en entier ; `cout_unitaire` est nullable et **jamais
> renseigné au MVP**.

---

## 7. `verticales/hebergement`

### 7.1 Référentiel

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `categorie` — nom, capacité d'accueil, temps de remise en état par formule | **C** | C2 — référentiel | HEB-01, §11.3 |
| `temps_remise_en_etat` — durée par catégorie **et par formule** | **C** | C2 — sur le régime de sa catégorie | HEB-01, §11.3 |
| `unite` (spécialisation de `ressource_reservable`) — code, étage | **C** | C2 — référentiel | HEB-01, §11.3 |
| `formule` — type, contraintes, `assujettie_taxe_nuitee`, `regle_conversion_taxe` | **C** | C2 — référentiel fiscal | HEB-03, §11.3 |
| `bareme_palier` — paliers de passage, heure supplémentaire | **C** | C2 — référentiel tarifaire | HEB-04, §11.3 |
| `calendrier_tarifaire` — date d'effet, date de fin | **C** | C2 — référentiel tarifaire | HEB-07 |
| Plages de demi-journée — table `plage_demi_journee` | **C** | C2 — référentiel | HEB-05 |

> **`prestation_incluse` n'est PAS redéclarée ici** : elle figure au **§10** des provisions, avec sa
> classe **C** et sa branche C2. La redéclarer lui donnerait deux entrées, donc un jour deux
> classes. **Une entité se déclare à un seul endroit** — c'est aussi ce qui écarte `employe` du
> §5.2.
>
> **`temps_remise_en_etat` est une table, pas un attribut de `categorie`.** La durée varie par
> catégorie **et** par formule, ce qu'une colonne ne porte pas. Sa classe est celle de sa
> catégorie : une durée de ménage ne se modifie pas hors ligne, elle se lit.

### 7.2 Occupation et disponibilité

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `occupation` — **attribution d'unité** sur un `tstzrange` | **B** | B3 — ressource unique, contrainte d'exclusion GiST | HEB-02, §11.3 |
| Intervalle de remise en état | **B** | B3 — intégré à l'intervalle d'indisponibilité | HEB-02 |
| `unite.statut_occupation` (libre / occupée / réservée) | **dérivé** | — | HEB-06 |
| `unite.statut_menage` (à nettoyer / propre / maintenance) | **A** | A4 — **dernier-écrit-gagne autorisé, seul cas** | HEB-06, §11.3 |
| **Mise hors service** d'une unité | **B** | B3 — retire une ressource de la disponibilité | HEB-06, §11.3 |
| Forçage de disponibilité (tracé au journal d'audit) | **B** | B3 — contourne une ressource unique | CPT-04 |

> **`unite.statut_occupation` n'est jamais posé à la main.** Il est calculé depuis les
> occupations. Le confondre avec `statut_menage` produit des doubles attributions
> (cadrage §11.4).

### 7.3 Séjour

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `client` — création, modification de fiche | **C** | C2 — partagé entre les établissements du tenant | SEJ-01 |
| `client.preferences`, note interne, photo | **A** | A4 — explicitement A au cadrage §11.3 | SEJ-01, §11.3 |
| `preference_personne` — enregistrement d'une préférence | **A** | A4 — append-only, commutative, sans effet monétaire | SEJ-01 |
| Extraction OCR d'une pièce d'identité | **A** | A4 — explicitement A ; **entièrement dégradable** | SEJ-06, §11.3 |
| `sejour` — **check-in**, attribution d'unité | **B** | B3 — ressource unique | SEJ-02, §11.3 |
| `accompagnant` — ajout | **A** | A4 — explicitement A au cadrage §11.3 | SEJ-02, §11.3 |
| `fiche_police` — génération | **B** | B3 — dérivée du check-in, numérotée | SEJ-02 |
| `numerotation_fiche_police` — incrément du compteur par établissement | **B** | B3 — numérotation continue, sérialisée par verrou de ligne | SEJ-02 |
| `note_sejour` — ouverture, arrêt de la note | **B** | B3 — effet monétaire, clôt avec le séjour | SEJ-02, SEJ-04 |
| `ligne_sejour` — hébergement, extras | **B** | B3 — effet monétaire sur la note | SEJ-03 |
| `ligne_sejour` — consommation venue d'un point de vente | **classe de la ligne d'origine** | — | §8 |
| **Transfert de charges** entre séjours | **B** | B3 — effet monétaire, tracé | SEJ-03, §11.3 |
| Remise sur la note | **B** | B3 — effet monétaire, journal d'audit | SEJ-03, §11.3 |
| `sejour` — **check-out**, taxe de nuitée **figée** | **B** | B3 — clôt la note, déclenche le document fiscal | SEJ-04, §11.3 |
| `taxe_sejour_constat` — figeage du constat au départ | **B** | B3 — clôt la note ; **immuable par privilège** (`SELECT, INSERT` seuls) | SEJ-04 |
| **Prolongation** | **B** | B3 — étend l'intervalle, conflit possible | SEJ-04, §11.3 |
| **Départ anticipé** — recalcul, régularisation | **B** | B3 — effet monétaire | SEJ-04, §11.3 |
| **Changement d'unité** en cours de séjour | **B** | B3 — deux intervalles, ressource unique | SEJ-04, §11.3 |
| **Rebascule de palier de passage** | **B** | B3 — effet monétaire, journal d'audit | HEB-04, §11.3 |
| Bascule passage → nuitée au-delà du seuil | **B** | B3 — effet monétaire | HEB-04 |
| Vente à un **client extérieur** (sans hébergement) | **B** | B3 — encaissement immédiat | SEJ-05 |

> **Le calcul de durée de passage s'appuie exclusivement sur l'horodatage d'autorité.** En mode
> C, le nœud de site fait autorité ; **jamais le terminal** (cadrage §11.4).

### 7.4 Réservation

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `reservation` — création, modification | **B** | B3 — ressource unique sur un intervalle | RSV-01, §11.3 |
| `reservation` — expiration d'une provisoire | **B** | B3 — libère une ressource | RSV-01 |
| `arrhes` — encaissement | **classe du mode** (§5.3) | — | RSV-03, §11.3 |
| Politique d'annulation — paramètres | **C** | C2 — paramétrage | RSV-03 |
| **Annulation** — libération de l'intervalle | **B** | B3 — ressource unique, effet monétaire | RSV-04, §11.3 |
| **No-show** — facturation selon politique | **B** | B3 — effet monétaire | RSV-04, §11.3 |
| Conversion réservation → séjour | **B** | B3 — attribution d'unité | RSV-05 |

### 7.5 Maintenance et salle de réunion

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `incident_maintenance` — signalement | **A** | A4 — explicitement A au cadrage §11.3 | §11.3 |
| `intervention` — compte rendu | **A** | A4 — explicitement A au cadrage §11.3 | §11.3 |
| Réservation de salle de réunion | **B** | B3 — `SALLE_REUNION` est une spécialisation d'hébergement | PDV-08, HEB-05 |

---

## 8. `socle/ventes` et `verticales/pressing`

> **Le tronc commun de la vente vit dans `socle/ventes`, pas dans une verticale** — catalogue,
> commande, ligne, table, envoi, remise, division. Le pressing garde ce qui lui est propre : le bon
> de dépôt. `verticales/restauration` et `verticales/bar` **sont des coquilles vides**, et ce
> registre le dit plutôt que de leur inventer un contenu (principe X).

### 8.1 Catalogue

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `article` — nom, prix, `taux_tva`, `unite_mesure`, `suivi_stock` | **C** | C2 — catalogue et prix, explicitement C au cadrage §11.3 | PDV-01, §11.3 |
| `article.code_barre`, `.article_parent_id` | **C** | C2 — référentiel (nullables, **non utilisés au MVP**) | PDV-01 |
| `categorie_article` — catégorie d'affichage, ordre | **C** | C2 — référentiel | PDV-01 |
| `destination_preparation` — cuisine, bar, pressing | **C** | C2 — référentiel **par établissement** : la cuisine sert plusieurs points de vente | PDV-04 |
| Modification de tarif | **C** | C2 — référentiel, journal d'audit | PDV-01, CPT-04 |

> **Le prix est verrouillé à la création de la ligne de commande.** Une modification de tarif
> ultérieure ne modifie aucune commande existante.
>
> **`destination_preparation` est une TABLE, pas une énumération.** « Cuisine » et « bar » ne sont
> pas les mêmes chez tous les exploitants, et une valeur en dur imposerait une migration au premier
> client qui a deux cuisines. La destination est **facultative** sur l'article : à défaut, l'envoi
> suit celle du point de vente, pour qu'aucun bon ne manque.

### 8.2 Commande — le cœur du besoin hors-ligne

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `commande` — ouverture | **A** | A4 — sans unicité tant qu'elle n'est pas numérotée | PDV-03 |
| `ligne_commande` — **ajout**, quantité (`NUMERIC`), commentaire | **A** | A4 — explicitement A au cadrage §11.3 | PDV-03, §11.3 |
| `ligne_commande` — modification **avant envoi** | **A** | A4 — purement locale, **jamais synchronisée avant envoi** | PDV-03, §11.3 |
| **Envoi en préparation** — `lot_envoi`, un par destination | **A** | A4 — explicitement A au cadrage §11.3. **Immuable** : `GRANT SELECT, INSERT` seuls, un second envoi crée un second lot | PDV-04, §11.3 |
| Marquage « servi », marquage « prêt » | **A** | A4 — explicitement A au cadrage §11.3 | PDV-04, §11.3 |
| **Annulation d'une ligne envoyée** | **B** | B3 — motif obligatoire, journal d'audit | PDV-03, §11.3 |
| `remise` — sur une ligne ou une addition | **B** | B3 — effet monétaire, permission, audit | PDV-03, §11.3 |
| Cible de facturation (`table`/`sejour`/`comptoir`/`emporter`) | **attribut de la commande** | — | PDV-02 |
| `numerotation_reference` — référence de retrait « emporter » | **B** | B3 — compteur par établissement, **verrou de ligne**, jamais une `SEQUENCE` | PDV-02 |
| **Report d'une charge sur la note d'un séjour** | **B** | B3 — effet monétaire sur la note d'un autre module ; **saga à compensation explicite**, jamais une transaction | PDV-02, §11.4 |

> **Le report est une saga, et son cas orphelin est le chemin nominal.** La commande vit dans
> `ventes`, la note dans `hebergement` : aucune transaction ne couvre les deux (principe II). Si la
> note est arrêtée, l'écriture part en **file de réconciliation à résolution humaine** — jamais un
> rejet silencieux, jamais un ajout d'office (cadrage §11.4).

### 8.3 Addition de table

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| **Ouverture** d'une table | **B** | B3 — ressource unique, explicitement B au cadrage §11.3 | PDV-02, §11.3 |
| **Fermeture** d'une table | **B** | B3 — effet monétaire | PDV-02, §11.3 |
| **Transfert** entre tables, **fusion** | **B** | B3 — ressource unique | PDV-02, §11.3 |
| **Division d'addition** — `part_addition`, par ligne ou par montant | **B** | B3 — effet monétaire, cibles multiples | PDV-05, §11.3 |

### 8.4 Pressing

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `bon_depot` — création avec **numéro de retrait** | **B** | B3 — numérotation, ressource unique | PDV-06 |
| `piece_deposee` — pièces déposées, état constaté | **A** | A4 — append-only, rattaché au bon | PDV-06 |
| `numerotation_retrait` — compteur du numéro de retrait | **B** | B3 — **verrou de ligne**, jamais une `SEQUENCE` : un trou est une pièce de linge dont personne ne sait si elle a existé | PDV-06 |
| Transition `depose → en_traitement → pret` | **A** | A4 — sans effet monétaire, sans unicité | PDV-06 |
| Transition `pret → retire` (avec règlement) | **B** | B3 — effet monétaire, clôt le bon | PDV-06 |
| Rattachement d'un bon au séjour d'un client logé | **B** | B3 — effet monétaire sur la note | PDV-06 |

### 8.5 Commande par QR

*Crate d'accueil à confirmer — voir §12, O-03.*

| Entité ou opération | Classe | Branche | Réf. |
|---|---|---|---|
| `jeton_table` — génération, **révocation** | **C** | C2 — explicitement C au cadrage §11.3 | QRC-01, §11.3 |
| Panier client sur la page publique | **hors registre** | — surface web publique, hors application | QRC-02 |
| **Réception** d'une commande QR en état `À_CONFIRMER` | **A** | A4 — explicitement A au cadrage §11.3 | QRC-03, §11.3 |
| **Validation par le personnel** | **B** | B3 — explicitement B au cadrage §11.3 | QRC-03, §11.3 |
| Limitation de débit par jeton | **éphémère** | — compteur Redis, reconstructible | QRC-04 |

---

## 9. Ce qui n'est pas classé

| Élément | Pourquoi |
|---|---|
| Sessions, JWT, refresh | Éphémère Redis reconstructible (constitution, principe II) |
| File de certification FNE en Redis | Éphémère ; l'état durable vit en Postgres (§5.4) |
| Verrous distribués, limitation de débit, cache de catalogue | Éphémère reconstructible |
| File d'actions locale du terminal | Infrastructure de transport, jamais un cache d'écriture B/C/D |
| Taxonomie d'événements, registre des traitements ARTCI | Versionnés dans le dépôt, pas en table |
| Panier de la page publique QR | Surface web publique hors application |

---

## 10. Provisions — tables sans logique au MVP

Ces entités ont une **classe déclarée d'avance** afin qu'aucune implémentation future ne
reparte d'une page blanche. **Aucune UI, aucune logique au MVP** (constitution, principe X).

| Entité | Classe prévue | Branche | Réf. |
|---|---|---|---|
| `mapping_comptable`, `exercice_comptable` | **C** | C2 — référentiel comptable du tenant | TRX-02b |
| `employe` | **C** | C2 — référentiel RH ; **jamais confondu avec `compte`** | CPT-00 |
| `partenaire` (`tenant_id` **nullable**), `demande_partenaire` | **C** | C2 — référentiel, éventuellement inter-tenant | ETB-07 |
| `compte_compensation`, `mouvement_compensation` | **B** | B3 — effet monétaire | ETB-07 |
| `convention_inter_etablissements` | **C** | C2 — relation entre deux tenants | cadrage §4.3 |
| Modules additionnels (`SPA`, `BOULANGERIE`, `SUPERETTE`, `QUINCAILLERIE`, `EXCURSION`, `MARCHE`, `PHARMACIE`, `DEPOT_GAZ`) | **C** | C2 — référentiel | ETB-08 |
| Capacités non implémentées (`LIVRAISON`, `PRODUCTION`, `COMMERCE_EN_LIGNE`, `CANAL_VENTE_EXTERNE`, `FIDELITE`, `DEVIS`, `COMPTES_CLIENTS`) | **C** | C2 — référentiel ; **refus explicite au MVP** | ETB-02b |
| Profils de stock `VALORISE`, `DETAILLE` | **C** | C2 — référentiel ; **refus explicite au MVP** | ETB-02b |
| `mouvement_stock.cout_unitaire` | **B** | B3 — suit `mouvement_stock` ; **jamais renseigné au MVP** | STK-02 |
| `conversion_unite_mesure` | **C** | C2 — référentiel d'unités. **AUCUN `GRANT` à `kaya_app`, pas même `SELECT`** : rien du produit n'a de raison de la lire, et c'est ce qui la prouve provision | PDV-01, cadrage §14.7 |
| `contrat_location`, `caution`, `charge_locative`, `etat_des_lieux` | **C** | C2 — référentiel contractuel | HEB-08 |
| `prestation_incluse` | **C** | C2 — référentiel attaché à la formule | HEB-09 |
| Décompte d'une prestation incluse *(incrément 2)* | **B** | B3 — décrément d'un quota | HEB-09 |
| `devis`, `document_commercial` | **B** | B3 — numérotation propre | FIS-11 |
| `EmissionChannel::Terne`, `ligne_facture.rne_ref` | **D** | D1 — canal fiscal externe | FIS-10 |
| `compte_client`, `encours`, `condition_reglement` | **B** | B3 — effet monétaire par établissement | CAI-07 |
| `dispositif`, `AccessController` | **A** | A4 — **canal hors ligne obligatoire** : code à usage unique validable sans réseau | cadrage §14.21 |

> **La contrainte du contrôle d'accès est à respecter dès maintenant** : tout mécanisme
> d'ouverture d'unité devra disposer d'un canal hors ligne. Une porte qui ne s'ouvre pas parce
> que le réseau est tombé est un incident grave.

---

## 11. Tests obligatoires par classe

Repris de `docs/user-stories-v1.md` §0.7. Ces tests font partie de la story qui introduit
l'entité, pas d'un lot de rattrapage.

| Classe | Tests exigés |
|---|---|
| **A** | **Rejeu** — la même écriture envoyée trois fois produit un seul enregistrement. **Désordre** — trois écritures appliquées dans les six ordres possibles produisent le même état final. |
| **B** | Test qui **échoue si l'opération est atteignable depuis un chemin de code exécutable hors ligne**. Test de concurrence : deux exécutions simultanées, une seule réussit. |
| **C** | Test qui **échoue si l'opération est atteignable depuis un chemin de code exécutable hors ligne**. Test d'isolation multi-tenant sur l'endpoint. |
| **D** | Test qui **échoue si l'opération est atteignable depuis un chemin de code exécutable hors ligne**. Test de **double soumission au retour du réseau**. |
| **Toute entité rattachée à un séjour** | Test du **scénario orphelin** (SYN-03). |

**Deux tests transverses permanents :**

- **Réseau coupé puis rétabli** au milieu d'une journée d'exploitation simulée — la clôture
  journalière tombe **au franc près** (SYN-04).
- **Agnosticité du socle** — un établissement portant un module fictif minimal, sans aucune
  capacité, va de la création à la clôture journalière (ETB-02c).

### Ces tests s'INSTANCIENT — ils ne se recopient pas

**Recopier le rejeu triple et les six ordres du désordre une fois par entité produit trois
formulations, trois messages d'échec, et trois occasions d'en couvrir un peu moins que la
précédente.** Ils existent donc sous forme d'**outillage** :

| Où | Ce qu'il engendre |
|---|---|
| Macros de test backend | `tester_classe_a!` — le rejeu triple (une ligne, **un** événement outbox) et le désordre sur les **six** ordres, en six tests **nommés** · `tester_classe_bcd!` — l'inatteignabilité hors ligne, plus la concurrence pour B · `tester_classe_d!` — la double soumission au retour du réseau |
| Utilitaires de test front | Le versant application : la marque de classe, le refus d'enfilement, l'annonce **avant** la saisie |
| **Le contrôle qui empêche l'oubli** | Il parcourt ce registre, en extrait toute entité ayant une table réelle, et échoue si elle n'a aucune instanciation correspondant à sa classe |

Couvrir une entité nouvelle coûte donc **une déclaration** :

```rust
tester_classe_a!(note_etablissement, schema = "etablissements", creer = fabrique::note);
```

**Six tests nommés, jamais un test générique.** Un test unique dirait « un des six ordres a
échoué » sans dire lequel — et c'est ce qu'on lit en intégration continue à vingt-trois heures.

**Deux contrôles, et ils sont complémentaires** : l'un vérifie qu'une classe a été **déclarée** ici,
l'autre qu'elle a été **exercée** par un test. Ensemble ils ferment ce que ni l'un ni l'autre ne
ferme seul.

⚠️ **Ce qu'aucun des deux ne vérifie : la JUSTESSE de la classe.** Aucune lecture du schéma ne
retrouve qu'un encaissement est B en espèces et D en Mobile Money. C'est le seul point de ce
document qui demande un jugement humain, et c'est pourquoi l'arbre du §3 est court et ses branches
nommées.

---

## 12. Cas pièges et décisions ouvertes

### Cas pièges traités explicitement

1. **Le statut d'unité n'est pas une donnée libre.** « Occupée » et « réservée » sont **dérivés**
   des occupations. Seul `statut_menage` est librement modifiable, en A. Les confondre produit
   des doubles attributions.
2. **L'écriture orpheline est le conflit le plus fréquent.** Une consommation saisie hors ligne
   arrive sur un séjour clos et facturé → **file de réconciliation à résolution humaine
   obligatoire**, jamais de rejet silencieux ni d'ajout d'office. Aggravé par l'avoir FNE par
   quantité. **Écran testé en priorité.**
3. **Les horloges des terminaux ne sont pas fiables.** Horodatage client indicatif, horodatage
   d'autorité pour **toute** logique métier, fiscale, de clôture et de durée de passage. Alerte
   au-delà de 5 minutes de dérive.
4. **Le passage aggrave la sensibilité à l'horloge.** Le début d'occupation est posé par le
   serveur au check-in ; en mode C, par le nœud de site. **Jamais par le terminal.**
5. **iOS n'a pas de synchronisation en arrière-plan.** La file se vide **au retour au premier
   plan par défaut** sur toutes les plateformes.

### Décisions ouvertes

| # | Décision | Effet si tranchée autrement | Échéance |
|---|---|---|---|
| ~~**O-01**~~ | ✅ **TRANCHÉE le 2026-08-03 — option (a)** : `client` reste en **C**, le réseau est exigé pour créer une fiche nouvelle. Les options (b) et (c) achetaient une friction de comptoir au prix de doublons inter-établissements ou d'un mécanisme de promotion — **trop cher pour un cas que le MVP ne produit pas** (voir la friction résiduelle ci-dessous). | — | **CLOSE — 2026-08-03** |
| **O-02** | **`mouvement_stock` en A ou en B** — décision B-05 du cadrage. Si le stock sert à détecter le vol, il reste B ; s'il ne sert qu'à réapprovisionner, il passe en A. | A = saisie hors ligne possible, tout se simplifie ; B = sérialisation stricte | S4, avec le pilote (avant tranche T5) |
| **O-03** | **Crate d'accueil de la surface QR.** Le principe II de la constitution ne liste que `hebergement`, `restauration`, `bar`, `pressing` dans `verticales/`. La commande QR est transverse à `restauration` et `bar`. | Un crate `capacites/` dédié, ou un partage entre les deux verticales | Avant QRC-01 (tranche T4) |

> Les décisions ouvertes n'autorisent aucun contournement : jusqu'à leur arbitrage, **la classe
> inscrite dans ce registre s'applique** — c'est toujours la plus stricte des options.

> **⚠️ La friction résiduelle d'O-01, écrite plutôt que tue.** L'option (a) n'est pas sans coût, et
> le taire ferait redécouvrir le problème au mauvais moment.
>
> **Au MVP, la décision est sans effet visible** : l'arrivée elle-même (`sejour` — check-in) est de
> **classe B**, donc déjà inatteignable hors ligne. Un client inconnu et un client connu sont
> logés à la même enseigne — le réseau est requis dans les deux cas, et personne ne remarquera que
> `client` est plus strict que `sejour`.
>
> **En mode nœud de site (incrément 3), l'écart devient réel et visible.** Une opération de
> classe B redevient possible en coupure, le nœud faisant autorité : Yao pourra **enregistrer une
> arrivée** hors du cloud, mais **pas créer la fiche** d'un client jamais vu, `client` étant en C.
> Le parcours du passage l'absorbe — la pièce d'identité vient **après** la clé (SEJ-02, FR-023),
> et la fiche de police naît légitimement `complete = false`. Le parcours long de l'arrivée, lui,
> devra dire à Yao ce qu'il peut faire quand même. **C'est ce que l'incrément 3 aura à traiter**,
> et c'est un travail d'interface, pas un changement de classe.

---

## 13. Journal des modifications

*Une ligne par ajout ou changement de classe, avec sa date et son motif. Ce journal enregistre des
**décisions de classe et de nommage**, pas l'avancement d'un chantier.*

**Ce qui mérite d'y figurer** : le nom retenu quand deux étaient possibles et pourquoi ; une classe
qui change et ce qui l'a fait changer ; une table que le registre décrivait sans la nommer et à
laquelle un cycle donne son nom. **Ce qui n'y a pas sa place** : les décomptes de tables, les
numéros de tâche, l'état d'avancement.

| Version | Date | Modification |
|---|---|---|
| D1 | 2026-08-06 | **`releve_position`** (§5.2, **A · A4**) — le registre décrivait « Relevé de position (géorepérage souple) » sans nommer sa table. Nom retenu contre `position_relevee` et `trace_geolocalisation` : le relevé est un **fait daté**, pas une trace continue, et le nom devait dire qu'on en pose un à un instant donné plutôt qu'on en suit un en continu. Le géorepérage reste **souple** — on relève, on n'interdit jamais. |
| D1 | 2026-08-06 | **`coupure_comptee`** (§5.3, **B · B3**) — le registre décrivait « Comptage par coupure » (CAI-04) sans nommer la table qui le porte. Nom retenu contre `detail_comptage` : ce qu'on enregistre est **une coupure et son nombre**, pas un détail générique, et un nom qui dit « détail » finit par accueillir autre chose. |
| D1 | 2026-08-06 | **`publication_outbox`** (§5.6, **A · A4**) — table **née d'une contrainte**, pas d'un besoin nouveau. `evenement_outbox` est immuable par privilège ; le marquage « publié » ne pouvait donc pas être une colonne mise à jour. La publication est un **fait ajouté**, et l'existence d'une ligne vaut publication. La ligne « `evenement_outbox` — marquage publié » du §5.6 est remplacée par celle-ci : elle décrivait une opération dont on sait maintenant qu'elle n'est pas une mutation. |
| D1 | 2026-08-06 | **`encaissement_abonnement`** et **`evenement_webhook_paiement`** (§5.8, **D · D1**) — le registre décrivait les deux opérations sans nommer leurs tables. Le webhook a sa table **distincte** de l'encaissement, parce qu'un webhook arrive parfois sans encaissement connu, et qu'il faut pouvoir l'enregistrer quand même pour le relire. |
| D1 | 2026-08-06 | **L'attestation d'intégrité N'A PAS de table** (§5.2). Son résultat est **l'état courant** de l'appareil enrôlé — deux colonnes sur `appareil_enrole` —, et CPT-06 ne demande aucun historique. Une table d'historique qu'on ne relit jamais est une table qu'on purge un jour sans savoir ce qu'on perd. Décision réversible : le jour où un historique est demandé, la table naîtra avec sa classe. |
| D1 | 2026-08-06 | **L'ouverture de tiroir-caisse N'A PAS de table** (§5.3). C'est une **entrée du journal d'audit**, famille `ouverture_tiroir`, que la taxonomie liste explicitement (CPT-04). Lui donner une table propre créerait un second journal — et deux journaux se contredisent le jour où l'un des deux n'est plus écrit. |
| D1 | 2026-08-06 | **La sélection d'établissement actif N'A PAS de table** (§5.1). C'est une **préférence locale du terminal**, hors base : elle n'a ni à voyager, ni à survivre à un changement d'appareil. |
| D2 | 2026-08-07 | **`ligne_inventaire`** (§6.1, **B · B3**) — le registre décrivait « `inventaire` — saisie, écart » sans nommer la table qui porte la saisie ligne à ligne. Nom retenu contre `comptage_article` et `ligne_comptage` : **`comptage` est déjà pris au socle** par `caisse.comptage`, et la porte P-02 compare sur le **nom nu**, jamais sur `schema.table` — deux homonymes dans deux schémas passeraient avec une seule déclaration au registre, et l'un des deux serait non déclaré sans que rien ne le dise. Le nom devait donc être libre à l'échelle du modèle entier, pas seulement à celle de son schéma. |
| D2 | 2026-08-07 | **`article_stock_catalogue`** (§6.1, **C · C2**) — le registre décrivait « Liaison article de catalogue → article de stock » sans nommer la table. Nom retenu contre `liaison_article_stock` : la table **est** le catalogue de stock d'un article vendu, et un nom qui commence par « liaison » range une table par sa mécanique plutôt que par ce qu'elle porte. **Cette ligne n'était pas prévue** : le plan du cycle annonçait `ligne_inventaire` comme la seule entité à nommer, et l'écriture du fichier a montré qu'il y en avait deux — la seconde décrite en toutes lettres, mais sans nom. |
| D2 | 2026-08-07 | **O-02 et O-03 NE SONT PAS TRANCHÉES, et c'est la décision.** `mouvement_stock` reste donc en **B** et la surface QR garde `ventes` pour schéma — dans les deux cas **l'option la plus stricte**, comme le §12 l'impose. Ce ne sont pas des questions de modèle : O-02 demande au **pilote** si le stock sert à détecter le vol ou à réapprovisionner, O-03 demande au **cycle du crate QR** où loger un besoin transverse à deux verticales. Les trancher ici aurait demandé au développeur d'arbitrer aujourd'hui ce que le terrain arbitrera à son échéance. **Conséquence écrite dans `96-stocks.sql`** : `mouvement_stock` porte `SELECT, INSERT` seuls, ce qui reste valide si la classe passe en A — un privilège plus strict ne devient jamais faux. **Et O-03 ne coûtera aucune migration de données** : l'arbitrage porte sur le **crate**, pas sur le schéma. |
