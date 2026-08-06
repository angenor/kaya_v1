# Phase 1 — Modèle de données du socle, table par table

*Soixante et onze tables, onze fichiers. Pour chacune : sa classe hors-ligne et son code de branche, la story qui l'introduit, ses colonnes propres, ses contraintes nommées, les privilèges de `kaya_app` — **qui prouvent sa classe** — et ses index, chacun justifié par une recherche nommée.*

> **Les classes sont reprises de [docs/registre-classes-offline.md](../../docs/registre-classes-offline.md), qui fait foi.** Les entités marquées **★** sont **nommées par ce cycle** et y sont inscrites dans le même changement.

---

## 0 · Ce que toute table porte, et qui n'est pas répété ensuite

### Deux troncs communs

**Tronc « écriture »** — toute table qu'un terminal alimente (classes A, B, D) :

| Colonne | Type | Règle |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | **Fourni par le client**, UUID v7. **Aucun `DEFAULT`** — c'est ce qui rend le rejeu inoffensif |
| `tenant_id` | `UUID NOT NULL` | Porte l'isolation. Jamais nullable, jamais dérivé |
| `horodatage_client` | `TIMESTAMPTZ NULL` | **Indicatif.** Aucune règle métier, fiscale, de clôture ou de durée ne s'y appuie |
| `cree_le` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | **AUTORITÉ SERVEUR.** Tout s'y appuie |

**Tronc « référentiel »** — toute table de classe C, écrite par le serveur seul : `id`, `tenant_id`, `cree_le`, plus `modifie_le TIMESTAMPTZ NOT NULL DEFAULT now()`. **Pas de `horodatage_client`** : aucun terminal ne l'écrit, et une colonne qu'on n'écrit jamais finit par être écrite.

### Trois éléments RLS, sur chaque table sans exception

```sql
ALTER TABLE <schema>.<table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <schema>.<table> FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON <schema>.<table>
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON <schema>.<table>
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);
```

La seconde politique est posée **à la création** : c'est elle qui rendra possible un `INSERT` de migration ultérieure, sans quoi la migration réussirait **en n'écrivant rien** (`docs/module-dore.md`, couche 1).

### Les privilèges disent la classe

| Classe et forme | `kaya_app` reçoit |
|---|---|
| **A** append-only | `SELECT, INSERT` — **jamais** `UPDATE` ni `DELETE` |
| **B** ou **D** avec cycle de vie | `SELECT, INSERT, UPDATE` — `DELETE` seulement si une story l'exige |
| **C** référentiel | `SELECT, INSERT, UPDATE` |
| **Provision** | `SELECT` seul — ou **rien du tout** quand rien n'a de raison de la lire |

Le détail complet est dans [contracts/conventions-sql.md](./contracts/conventions-sql.md) §3.

### Trois domaines partagés

`montant_mineur` (`BIGINT`) · `code_devise` (`CHAR(3)`, `~ '^[A-Z]{3}$'`) · `quantite` (`NUMERIC`). **Aucun flottant sur un montant ni sur une quantité.**

---

## 1 · `00-conventions.sql`

Aucune table. Contenu :

| Bloc | Contenu |
|---|---|
| **Rôles** | `kaya_owner` (propriétaire des tables) et `kaya_app` (rôle applicatif, **distinct**), créés en forme idempotente pour s'appliquer sur un cluster neuf comme sur un cluster déjà pourvu |
| **Extensions** | `btree_gist` — requise par la contrainte d'exclusion du cycle D2 (`unite_id WITH =`, `periode WITH &&`). `pgcrypto` **n'est pas créée** : le chiffrement du coffre est applicatif (`aes-gcm`), une clé qui transite par la base apparaîtrait dans `pg_stat_statements` |
| **Domaines** | `montant_mineur`, `code_devise`, `quantite` |
| **Patron RLS** | Le bloc ci-dessus, en commentaire, avec les trois motifs (`FORCE`, `WITH CHECK`, second argument `true`) |
| **Conventions de nommage** | `pk_<table>` · `fk_<table>_<cible>` · `uq_<table>_<colonnes>` · `ck_<table>_<regle>` · `ix_<table>_<usage>` · politiques `isolation_tenant` et `administration_editeur` |
| **Trois pièges de migration** | (a) l'écriture silencieusement vide sous `FORCE` et les trois formes qui marchent ; (b) la contrainte d'exclusion qui se pose **à la création** ; (c) la `SEQUENCE` non transactionnelle, **proscrite** pour toute numérotation continue |
| **Trois conventions opposables au cycle D2** | `unite_mesure` obligatoire sur `article`, défaut `unite`, et `conversion_unite_mesure` créée **sans aucun `GRANT`** (A3) · `cout_unitaire` nullable sur `mouvement_stock`, **jamais renseigné au MVP** (A4) · `code_barre` et `article_parent_id` nullables sur `article` (A5) |

---

## 2 · `10-etablissements.sql` — 19 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `tenant` | **C · C2** | ETB-01 | `code`, `raison_sociale`, `statut`, `est_editeur` | `pk_tenant` · `ck_tenant_auto_reference` (`tenant_id = id`) · `uq_tenant_code` | `SELECT, INSERT, UPDATE` | — |
| `etablissement` | **C · C2** | ETB-01 | `code`, `nom`, `juridiction_code`, `classement`, `commune`, `fuseau_horaire`, `devise` (`code_devise`), `adresse`, `ncc` | `fk_etablissement_tenant` · `uq_etablissement_code` (par tenant) — **aucune contrainte d'énumération sur `classement`** | `SELECT, INSERT, UPDATE` | `ix_etablissement_tenant` |
| `module_activite` | **C · C2** | ETB-02, ETB-08 | `code`, `libelle`, `implemente_au_mvp` | `uq_module_activite_code` (par tenant) | `SELECT, INSERT, UPDATE` | — |
| `capacite` | **C · C2** | ETB-02b | `code`, `libelle`, `implementee_au_mvp` | `uq_capacite_code` (par tenant) | `SELECT, INSERT, UPDATE` | — |
| `profil_stock` | **C · C2** | ETB-02b | `code`, `libelle`, `implemente_au_mvp` — valeurs semées : `AUCUN`, `SIMPLE`, `VALORISE`, `DETAILLE` | `uq_profil_stock_code` — **aucune contrainte d'énumération** | `SELECT, INSERT, UPDATE` | — |
| `module_capacite` | **C · C2** | ETB-02b | `module_activite_id`, `capacite_id`, `profil_stock_code` (nullable, requis pour `STOCK`) | `fk_module_capacite_module` · `fk_module_capacite_capacite` · `fk_module_capacite_profil` · `uq_module_capacite` | `SELECT, INSERT, UPDATE` | — |
| `etablissement_module` | **C · C2** | ETB-02 | `etablissement_id`, `module_activite_id`, `actif`, `active_le`, `desactive_le` | `fk_etablissement_module_etab` · `fk_etablissement_module_module` · `uq_etablissement_module` | `SELECT, INSERT, UPDATE` | `ix_etablissement_module_actif` |
| `point_de_vente` | **C · C2** | ETB-03 | `etablissement_id`, `module_activite_id`, `nom`, `avec_tables`, `caisse_id` **(sans FK — autre module)** | `fk_point_de_vente_etab` · `fk_point_de_vente_module` | `SELECT, INSERT, UPDATE` | `ix_point_de_vente_etab` |
| `table_pdv` | **C · C2** | ETB-03 | `point_de_vente_id`, `code`, `libelle` | `fk_table_pdv_pdv` · `uq_table_pdv_code` | `SELECT, INSERT, UPDATE` | — |
| `parametre_catalogue` | **C · C2** | ETB-04, ADM-06 | `cle`, `libelle`, `type_valeur`, `portee_la_plus_basse`, `valeur_defaut` | `uq_parametre_catalogue_cle` · `ck_parametre_catalogue_portee` | `SELECT, INSERT, UPDATE` | — |
| `parametre_configuration` | **C · C2** | ETB-04 | `cle`, `portee` ∈ {`TENANT`,`ETABLISSEMENT`,`MODULE`,`POINT_DE_VENTE`}, `portee_id`, `valeur` (`JSONB`) | `fk_parametre_configuration_cle` · `uq_parametre_configuration_portee` · `ck_parametre_configuration_portee` | `SELECT, INSERT, UPDATE` | `ix_parametre_configuration_resolution` (`cle`, `portee`, `portee_id`) — **la chaîne d'héritage se résout en une requête** |
| `branding` | **C · C2** | ETB-05 | `portee`, `portee_id`, `logo_uri`, `couleur_primaire`, `entete_document`, `pied_document`, `mentions_legales` | `uq_branding_portee` · `ck_branding_portee` | `SELECT, INSERT, UPDATE` | — |
| `note_etablissement` | **A · A4** | TRX-01 *(patron du module doré)* | `etablissement_id`, `auteur_compte_id` **(sans FK — `comptes` est un autre module)**, `contenu` | `fk_note_etablissement_etab` | **`SELECT, INSERT`** | `ix_note_etablissement_etab_date` (`etablissement_id`, `cree_le DESC`, `id DESC`) |
| `partenaire` **(PROVISION)** | **C · C2** | ETB-07 | `etablissement_id`, `nom`, `type`, `telephone`, `canal_prefere`, **`tenant_partenaire_id` NULLABLE** | `fk_partenaire_etab` · `ck_partenaire_tenant_distinct` | `SELECT` | — |
| `demande_partenaire` **(PROVISION)** | **C · C2** | ETB-07 | `partenaire_id`, `objet`, `statut`, `canal` | `fk_demande_partenaire_partenaire` | `SELECT` | — |
| `compte_compensation` **(PROVISION)** | **B · B3** | ETB-07 | `partenaire_id`, `solde` (`montant_mineur`), `devise` | `fk_compte_compensation_partenaire` | `SELECT` | — |
| `mouvement_compensation` **(PROVISION)** | **B · B3** | ETB-07 | `compte_compensation_id`, `sens`, `montant`, `motif` | `fk_mouvement_compensation_compte` | `SELECT` | — |
| `convention_inter_etablissements` **(PROVISION)** | **C · C2** | cadrage §4.3 | `etablissement_id`, `tenant_tiers_id`, `objet`, `statut` | `fk_convention_etab` | **aucun** — remplacée par `partenaire` (A12) ; **l'absence de privilège dit qu'elle n'est pas la voie retenue** | — |
| `dispositif` **(PROVISION)** | **A · A4** | cadrage §14.21 | `etablissement_id`, `type`, `identifiant_materiel`, `ressource_id` **(sans FK — verticale)**, `secret_partage_ref` | `fk_dispositif_etab` | `SELECT` | — |

> **`tenant.tenant_id = tenant.id`, et ce n'est pas une bizarrerie.** La règle « chaque table porte `tenant_id` » ne souffre aucune exception, y compris pour la table qui **est** le tenant. La contrainte `ck_tenant_auto_reference` le rend explicite plutôt que conventionnel — sans elle, un jour, une ligne porterait le tenant d'un autre.
>
> **`module_activite` et `capacite` sont deux tables, jamais une** (amendements A6 et A7). Le module est **la verticale** — ce que fait l'établissement ; la capacité est **le transverse** — ce dont il a besoin pour le faire. `module_capacite` porte la déclaration de consommation **et le profil de stock**.
>
> **Deux contraintes d'énumération ont été retirées, et le motif est le même.** Une `CHECK` qui liste des valeurs **fige en dur ce qu'un référentiel existe pour rendre configurable** :
>
> - **`profil_stock`** — ETB-08 promet qu'ajouter une valeur au référentiel est « de la configuration, pas une migration ». Une `CHECK` sur les quatre valeurs rendrait la cinquième impossible sans migration, sur **toutes** les bases du parc. L'intégrité est déjà portée par `fk_module_capacite_profil` ; le refus explicite du MVP est porté par `implemente_au_mvp`, qui est une **donnée**, donc modifiable.
> - **`etablissement.classement`** — les valeurs (sans étoile, 1★ … résidence meublée) sont **propres à la juridiction ivoirienne**. Les figer contredirait le principe 5 : *aucune règle fiscale ne vit hors du trait `JurisdictionAdapter`*. Le second adaptateur de pays (décision B-09) imposerait sinon une migration de schéma pour un simple barème. La validation appartient à l'adaptateur, qui connaît le pays ; la base ne le connaît pas.
>
> **Les `CHECK` d'énumération qui restent sont d'une autre nature** : `ck_file_certification_etat` code un **protocole externe** à cinq états, `ck_journal_audit_famille` code une **taxonomie versionnée dans le dépôt** (registre §9), `ck_document_fiscal_type` code ce que la DGI émet. Aucune de ces trois listes n'est de la configuration d'établissement, et aucune ne change sans que du code change avec elle.

---

## 3 · `20-comptes.sql` — 11 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `personne` | **C · C2** | CPT-00 | `nom`, `prenoms`, `nom_normalise`, `telephone_e164`, `email`, `type_piece`, `numero_piece`, `piece_capturee_le`, `consentement_le` | `uq_personne_telephone` · `ck_personne_telephone_e164` | `SELECT, INSERT, UPDATE` | `ix_personne_nom` (`nom_normalise`) · `ix_personne_telephone` · `ix_personne_piece` (`type_piece`, `numero_piece`) — **SC-009, < 300 ms sur 10 000 fiches** · `ix_personne_purge` (`piece_capturee_le`) — **la purge TRX-06 sans balayage complet** |
| `compte` | **C · C2** | CPT-01 | `personne_id`, `identifiant`, `type_identifiant`, `empreinte_mot_de_passe`, `etat`, `derniere_connexion_le` | `fk_compte_personne` · `uq_compte_identifiant` | `SELECT, INSERT, UPDATE` | `ix_compte_identifiant` |
| `methode_authentification` | **C · C2** | CPT-01 | `code` ∈ {`MOT_DE_PASSE`,`OTP_SMS`}, `libelle`, `activee` | `uq_methode_authentification_code` | `SELECT, INSERT, UPDATE` | — |
| `role` | **C · C2** | CPT-02 | `code`, `libelle` | `uq_role_code` | `SELECT, INSERT, UPDATE` | — |
| `permission` | **C · C2** | CPT-02 | `code` (ex. `pdv.remise.appliquer`), `module_activite_code`, `libelle` | `uq_permission_code` | `SELECT, INSERT, UPDATE` | — |
| `role_permission` | **C · C2** | CPT-02 | `role_id`, `permission_id` | `fk_role_permission_role` · `fk_role_permission_permission` · `uq_role_permission` | `SELECT, INSERT, UPDATE` | — |
| `compte_role` | **C · C2** | CPT-02, ETB-01 | `compte_id`, `role_id`, **`etablissement_id`** *(sans FK — autre module)* | `fk_compte_role_compte` · `fk_compte_role_role` · `uq_compte_role_portee` | `SELECT, INSERT, UPDATE` | `ix_compte_role_compte` |
| `appareil_enrole` | **C · C2** | CPT-05, CPT-06 | `compte_id`, `libelle`, `cle_publique`, `etat`, `enrole_le`, `revoque_le`, `attestation_etat`, `attestation_verifiee_le` | `fk_appareil_enrole_compte` · `uq_appareil_enrole_cle` | `SELECT, INSERT, UPDATE` | `ix_appareil_enrole_compte` |
| `journal_audit` | **A · A4** | CPT-04, DIR-04 | `etablissement_id`, `auteur_compte_id`, `famille`, `action`, `cible_type`, `cible_id`, `contexte` (`JSONB`) | `ck_journal_audit_famille` | **`SELECT, INSERT`** — immuable | `ix_journal_audit_filtre` (`etablissement_id`, `famille`, `cree_le DESC`) · `ix_journal_audit_auteur` (`auteur_compte_id`, `cree_le DESC`) — **DIR-04** |
| ★ `releve_position` | **A · A4** | CPT-06 | `compte_id`, `appareil_enrole_id`, `latitude`, `longitude`, `precision_m`, `position_simulee` | `fk_releve_position_appareil` | **`SELECT, INSERT`** | `ix_releve_position_compte_date` |
| `employe` **(PROVISION)** | **C · C2** | CPT-00 | `personne_id`, `etablissement_id`, `matricule`, `date_embauche`, `numero_cnps`, `salaire_base` (`montant_mineur`) | `fk_employe_personne` | `SELECT` | — |

> **`personne`, `compte` et `employe` sont trois entités, jamais confondues.** Une femme de ménage est un **employé sans compte** ; un comptable externe est un **compte sans contrat**. Écrire « le salaire de l'utilisateur » quelque part rendrait la paie inaccessible sans refonte de l'authentification (CPT-00).
>
> **L'attestation d'intégrité n'a pas sa table** : son résultat est l'état courant de l'appareil, deux colonnes sur `appareil_enrole`. CPT-06 ne demande pas d'historique.
>
> **`compte_role` porte l'établissement** : « un utilisateur peut être rattaché à plusieurs établissements avec des rôles différents sur chacun » (ETB-01). Sans cette colonne, Adjoua gérante à Abengourou serait gérante partout.

---

## 4 · `30-caisse.sql` — 12 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `caisse` | **C · C2** | ETB-03 | `etablissement_id`, `code`, `libelle`, `active` | `uq_caisse_code` | `SELECT, INSERT, UPDATE` | `ix_caisse_etab` |
| `shift` | **B · B3** | CAI-01 | `caisse_id`, `compte_id`, `ouvert_le`, `ferme_le`, `fond_declare` (`montant_mineur`), `etat` | `fk_shift_caisse` · `ck_shift_etat` · `uq_shift_caisse_ouvert` (**un seul shift ouvert par caisse**, index unique partiel) | `SELECT, INSERT, UPDATE` | `ix_shift_caisse_ouvert` |
| `encaissement` | **B · B3** *(espèces, virement, à crédit)* · **D · D1** *(Mobile Money, carte)* | CAI-02 | `shift_id`, `mode`, `montant`, `devise`, `cible_type`, `cible_id` *(sans FK — autre module)*, `reference_externe`, `etat` | `fk_encaissement_shift` · `ck_encaissement_mode` · `ck_encaissement_montant_positif` | `SELECT, INSERT, UPDATE` — **`UPDATE` pour la seule transition d'état des modes D** ; le commentaire d'en-tête déclare **les deux classes** | `ix_encaissement_shift_mode` — **récapitulatif de clôture, CAI-05** |
| `sortie_de_caisse` | **B · B3** | CAI-03 | `shift_id`, `type`, `montant`, `motif`, `piece_justificative_uri`, `beneficiaire` | `fk_sortie_de_caisse_shift` · `ck_sortie_de_caisse_motif_non_vide` | `SELECT, INSERT` | `ix_sortie_de_caisse_shift` |
| `comptage` | **B · B3** | CAI-04 | `shift_id`, `moment` ∈ {`OUVERTURE`,`PASSATION`,`CLOTURE`}, `total_compte`, `compte_id_temoin` | `fk_comptage_shift` · `ck_comptage_moment` | `SELECT, INSERT` | `ix_comptage_shift` |
| ★ `coupure_comptee` | **B · B3** | CAI-04 | `comptage_id`, `valeur_faciale` (`montant_mineur`), `nombre` | `fk_coupure_comptee_comptage` · `uq_coupure_comptee_valeur` | `SELECT, INSERT` | — |
| `ecart_de_caisse` | **B · B3** | CAI-04 | `comptage_id`, `attendu`, `constate`, `ecart`, `motif`, `notifie_le` | `fk_ecart_de_caisse_comptage` · `ck_ecart_motif_si_non_nul` | `SELECT, INSERT` | — |
| `cloture_shift` | **B · B3** | CAI-05 | `shift_id`, `cloture_le`, `recapitulatif` (`JSONB` — par mode, par point de vente, par module) | `fk_cloture_shift_shift` · `uq_cloture_shift` | `SELECT, INSERT` | — |
| `cloture_journaliere` | **B · B3** | CAI-06 | `etablissement_id`, `journee`, `cloture_le`, `recapitulatif` (`JSONB`), `blocages_leves` (`JSONB`) | `uq_cloture_journaliere_jour` (**une seule par établissement et par jour**) | `SELECT, INSERT` | `ix_cloture_journaliere_etab_jour` |
| `compte_client` **(PROVISION)** | **B · B3** | CAI-07 | `etablissement_id`, `personne_id` *(sans FK)*, `raison_sociale`, `plafond` | — | `SELECT` | — |
| `encours` **(PROVISION)** | **B · B3** | CAI-07 | `compte_client_id`, `montant`, `arrete_le` | `fk_encours_compte_client` | `SELECT` | — |
| `condition_reglement` **(PROVISION)** | **B · B3** | CAI-07 | `compte_client_id`, `delai_jours`, `mode_prefere` | `fk_condition_reglement_compte_client` | `SELECT` | — |

> **`encaissement` porte deux classes, et son commentaire d'en-tête le dit.** B en espèces, en virement et à crédit ; **D** en Mobile Money et en carte, parce qu'un agrégateur tranche. Un **règlement fractionné** est **plusieurs lignes**, une par mode — jamais une ligne à modes multiples : « la classe de chaque part » (registre §5.3) n'a de sens que si chaque part est une ligne.
>
> **`sortie_de_caisse`, `comptage` et `ecart_de_caisse` sont en `SELECT, INSERT`** bien qu'ils soient de classe B : une dépense constatée ne se corrige pas, elle se contre-passe. C'est une décision de **forme**, pas de classe — la classe reste B, le commentaire d'en-tête le dit, et le privilège dit en plus qu'aucune ligne ne se récrit.

---

## 5 · `40-fiscalite.sql` — 10 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `parametrage_fiscal` | **C · C2** | FIS-03 | `etablissement_id`, `juridiction_code`, `cle`, `valeur` (`JSONB`), `date_effet`, `date_fin` | `uq_parametrage_fiscal_effet` · `ck_parametrage_fiscal_periode` | `SELECT, INSERT, UPDATE` | `ix_parametrage_fiscal_resolution` (`etablissement_id`, `cle`, `date_effet DESC`) |
| `cle_fne` | **C · C2** | FIS-04 | `etablissement_id`, `canal` ∈ {`PARTENAIRE`,`DIRECT`}, `ncc`, `secret_chiffre` (`BYTEA`), `nonce` (`BYTEA`), `version_cle`, `rotee_le` | `uq_cle_fne_etab_canal` | `SELECT, INSERT, UPDATE` | — |
| `document_fiscal` | **D · D1** | FIS-02, FIS-05 | `etablissement_id`, `type` ∈ {`FACTURE`,`AVOIR`}, `canal_emission` ∈ {`FNE_API`,`TERNE`}, `numero_normalise`, `reference_dgi`, `sceau`, `qr_code_uri`, `total_ht`, `total_tva`, `total_taxe_nuitee`, `total_ttc`, `devise`, `emis_le` | `ck_document_fiscal_type` · `ck_document_fiscal_canal` · `uq_document_fiscal_numero` | `SELECT, INSERT, UPDATE` | `ix_document_fiscal_etab_periode` (`etablissement_id`, `emis_le DESC`) — **FIS-08, IMP-03** |
| `item_certifie` | **D · D1** | FIS-06, FIS-10 | `document_fiscal_id`, `id_item_dgi`, `designation`, `quantite` (`quantite`), `prix_unitaire`, `taux_tva`, **`rne_ref` NULLABLE (PROVISION)** | `fk_item_certifie_document` · `uq_item_certifie_id_dgi` | `SELECT, INSERT` | `ix_item_certifie_document` |
| `avoir` | **D · D1** | FIS-06 | `document_fiscal_id` (l'avoir émis), `facture_origine_id`, `motif`, `reference_dgi` | `fk_avoir_document` · `fk_avoir_origine` | `SELECT, INSERT` | — |
| `file_certification` | **D · D1** | FIS-05 | `document_fiscal_id`, `etat` ∈ {`EN_ATTENTE`,`SOUMISE`,`CERTIFIEE`,`ECHEC`,`INDETERMINEE`}, `tentatives`, `derniere_tentative_le`, `prochaine_tentative_le`, `message_erreur`, `resolu_par_compte_id` | `fk_file_certification_document` · `ck_file_certification_etat` | `SELECT, INSERT, UPDATE` | `ix_file_certification_etat` (`etablissement_id`, `etat`, `prochaine_tentative_le`) — **tableau de bord « documents non certifiés », FIS-05** |
| `compteur_stickers` | **D · D1** | FIS-07 | `etablissement_id`, `restant`, `seuil_bas`, `dernier_releve_le` | `uq_compteur_stickers_etab` | `SELECT, INSERT, UPDATE` | — |
| `etat_reversement_communal` | **A · A4** | FIS-08 | `etablissement_id`, `commune`, `periode_debut`, `periode_fin`, `nuitees_assujetties`, `sejours_assujettis`, `nombre_personnes` *(indicatif)*, `montant_du`, `echeance` | `uq_etat_reversement_periode` | **`SELECT, INSERT`** — rapport dérivé, recalculable | `ix_etat_reversement_commune_periode` |
| `devis` **(PROVISION)** | **B · B3** | FIS-11 | `etablissement_id`, `numero`, `etat` ∈ {`BROUILLON`,`EMIS`,`ACCEPTE`,`CONVERTI`,`EXPIRE`}, `total_ttc`, `valide_jusquau`, `document_fiscal_id` | `ck_devis_etat` | `SELECT` | — |
| `document_commercial` **(PROVISION)** | **B · B3** | FIS-11 | `devis_id`, `type`, `numero`, `etat` | `fk_document_commercial_devis` | `SELECT` | — |

> **`item_certifie.id_item_dgi` est la colonne dont l'oubli serait irrattrapable.** L'avoir FNE se fait **par quantité** et son corps est limité à `{id d'item, quantity}` : sans les identifiants **retournés par l'API**, aucun avoir n'est possible, et aucune reprise a posteriori ne les reconstitue (cadrage §9.4).
>
> **`compteur_stickers` est un compteur en table, jamais une `SEQUENCE`** — le décrément est côté DGI et le stock local doit être verrouillé ligne à ligne pour bloquer préventivement la clôture (FIS-07).
>
> **`parametrage_fiscal` porte des paramètres, jamais un calcul.** Aucune règle fiscale ne vit hors du trait `JurisdictionAdapter` (constitution, principe 5). Ce que la table contient, ce sont des **valeurs datées** : taux de TVA, barème de nuitée par classement, taux de taxe touristique.

---

## 6 · `50-documents.sql` — 3 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `document_operationnel` | **A · A4** *(brouillon)* · **B · B3** *(émission numérotée)* | FIS-02, IMP-02 | `etablissement_id`, `type`, `numero_interne` (nullable tant que brouillon), `cible_type`, `cible_id` *(sans FK)*, `contenu` (`JSONB`), `emis_le` | `ck_document_operationnel_type` · `uq_document_operationnel_numero` (partiel, sur `numero_interne` non nul) | `SELECT, INSERT, UPDATE` — **`UPDATE` pour la seule allocation du numéro** ; les deux classes sont au commentaire d'en-tête | `ix_document_operationnel_etab_date` |
| `numerotation_document` | **B · B3** | FIS-02, §11.3 | `etablissement_id`, `type_document`, `exercice`, `prochain_numero` | `uq_numerotation_document_portee` | `SELECT, INSERT, UPDATE` | — |
| `modele_document` | **C · C2** | IMP-04 | `portee`, `portee_id`, `type_document`, `entete`, `pied`, `mentions`, `gabarit` (`JSONB`) | `uq_modele_document_portee_type` | `SELECT, INSERT, UPDATE` | — |

> **`numerotation_document` est un compteur en table à verrou de ligne, jamais une `SEQUENCE`.** Une `SEQUENCE` n'est pas transactionnelle : chaque transaction annulée laisse un trou, et un trou dans une numérotation de documents est une pièce dont personne ne sait si elle a existé. Le commentaire d'en-tête le dit, et `00-conventions.sql` en fait une règle générale.
>
> **Tout document opérationnel porte la mention « Document non fiscal — ne tient pas lieu de facture ».** C'est une propriété du **gabarit** (`modele_document`), pas une colonne — mais elle est obligatoire et le commentaire d'en-tête l'énonce, pour que le cycle IMP ne la découvre pas.

---

## 7 · `60-synchronisation.sql` — 3 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `evenement_outbox` | **A · A4** | TRX-02 | `etablissement_id`, `sequence` (`BIGINT`, monotone par établissement), `type_evenement`, `agregat_type`, `agregat_id`, `charge_utile` (`JSONB` — **financièrement complète et dénormalisée**) | `uq_evenement_outbox_sequence` (par établissement) | **`SELECT, INSERT`** — immuable, **rétention illimitée** | `ix_evenement_outbox_publication` — sert la boucle du worker |
| ★ `publication_outbox` | **A · A4** | TRX-02 | `evenement_id`, `publie_le`, `consommateur` | `fk_publication_outbox_evenement` · `uq_publication_outbox` | **`SELECT, INSERT`** | `ix_publication_outbox_evenement` |
| `reconciliation_orpheline` | **A · A4** *(création)* · **B · B3** *(résolution)* | SYN-03 | `etablissement_id`, `origine_type`, `origine_id` *(sans FK — autre module)*, `cible_type`, `cible_id`, `constat` (`JSONB`), `etat` | `ck_reconciliation_etat` | **`SELECT, INSERT`** — **jamais `UPDATE`** : la résolution de classe B n'est pas implémentée, et **le privilège absent est ce qui le prouve** | `ix_reconciliation_etab_etat` |

> **L'outbox est un grand livre permanent, pas une file de messages.** Trois règles indissociables : rétention illimitée, charge utile financière complète et dénormalisée, immuabilité. C'est pourquoi le marquage « publié » **n'est pas un `UPDATE`** mais une ligne dans `publication_outbox` — accorder `UPDATE` « juste pour un drapeau » casserait l'immuabilité sans que rien ne le signale (décision [D-04](./research.md)).
>
> **`reconciliation_orpheline` est l'exemple canonique du privilège qui prouve la provision.** Un commentaire disant « la résolution viendra plus tard » ne prouve rien ; un `GRANT` sans `UPDATE` le rend impossible.

---

## 8 · `70-pilotage.sql` — 1 table

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `alerte_configurable` | **C · C2** | DIR-04 | `portee`, `portee_id`, `type` ∈ {`REMISE`,`ECART_CAISSE`,`REBASCULE_PASSAGE`,`STICKERS_BAS`,`TERMINAL_DECONNECTE`}, `seuil`, `destinataires` (`JSONB`), `active` | `uq_alerte_configurable_portee_type` · `ck_alerte_configurable_type` | `SELECT, INSERT, UPDATE` | — |

> **Une seule table, et le fichier dit pourquoi.** Tableaux de bord, KPI, recettes par service, rapports périodiques et consultation du journal d'audit sont **dérivés** — lectures recalculables sur les tables des autres modules et sur l'outbox. Leur donner une table serait dupliquer une vérité qui existe déjà, et se condamner à la resynchroniser. Le fichier porte ce commentaire en tête, pour qu'un cycle ultérieur ne prenne pas l'absence pour un oubli.

---

## 9 · `80-editeur.sql` — 8 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `plan` | **C · C2** | ADM-03 | `code`, `libelle`, `mode` ∈ {`FORFAIT_PALIER`,`COMPTEUR`}, `actif` | `uq_plan_code` · `ck_plan_mode` | `SELECT, INSERT, UPDATE` | — |
| `palier` | **C · C2** | ADM-03 | `plan_id`, `unites_min`, `unites_max` (nullable = sans plafond), `montant_mensuel`, `montant_par_unite` | `fk_palier_plan` · `ck_palier_bornes` | `SELECT, INSERT, UPDATE` | — |
| `abonnement` | **C · C2** | ADM-03, ADM-04 | `tenant_abonne_id`, `plan_id`, `debut`, `fin`, `etat` ∈ {`ACTIF`,`GRATUIT`,`SUSPENDU`,`RESILIE`}, `remise_commerciale`, `motif_gratuite`, `frais_installation` | `fk_abonnement_plan` · `ck_abonnement_etat` | `SELECT, INSERT, UPDATE` | `ix_abonnement_tenant_etat` |
| `unite_facturable` | **C · C2** | ADM-03 | `tenant_abonne_id`, `etablissement_id`, `verticale_code`, `metrique`, `quantite_comptee`, `arrete_le` | `uq_unite_facturable_arret` | `SELECT, INSERT, UPDATE` | `ix_unite_facturable_tenant_arret` |
| `telemetrie_parc` | **A · A4** | TRX-07, ADM-02 | `tenant_observe_id`, `version_application`, `etat_sante`, `derniere_synchronisation_le`, `erreurs` (`JSONB`) | — | **`SELECT, INSERT`** | `ix_telemetrie_parc_tenant_date` |
| `bundle_diagnostic` | **A · A4** | TRX-07, ADM-05 | `tenant_observe_id`, `uri`, `periode_debut`, `periode_fin`, `demande_par_compte_id` | — | **`SELECT, INSERT`** | — |
| ★ `encaissement_abonnement` | **D · D1** | ADM-04 | `abonnement_id`, `montant`, `devise`, `fournisseur`, `reference_session`, `etat`, `regle_le` | `fk_encaissement_abonnement_abonnement` · `uq_encaissement_abonnement_reference` | `SELECT, INSERT, UPDATE` | — |
| ★ `evenement_webhook_paiement` | **D · D1** | ADM-04 | `fournisseur`, `identifiant_evenement_externe`, `signature_verifiee`, `charge_utile` (`JSONB`), `traite_le` | `uq_evenement_webhook_identifiant` — **c'est cette unicité qui porte l'idempotence** | **`SELECT, INSERT`** | `ix_evenement_webhook_non_traite` |

> **`unite_facturable` est une métrique abstraite, jamais « chambre » en dur** (amendement A11). La colonne `verticale_code` dit **qui compte**, `metrique` dit **ce qu'on compte** — la chambre pour l'hébergement, le point de vente pour la restauration, le véhicule pour la livraison. Le moteur de tarification ne connaît qu'un nombre. Au MVP, la seule implémentation est « chambre », et le comportement observable est strictement identique à une facturation à la chambre.
>
> **`plan`, `palier` et les tables d'observation appartiennent au tenant de l'éditeur** — qui est un tenant comme un autre (décision [D-03](./research.md)). `abonnement.tenant_abonne_id` et `telemetrie_parc.tenant_observe_id` désignent le **client observé** ; ce ne sont pas des colonnes d'isolation, et leur nom le dit pour qu'on ne les confonde jamais avec `tenant_id`.
>
> **L'idempotence du webhook est portée par une contrainte, pas par du code.** `uq_evenement_webhook_identifiant` fait échouer la seconde réception au niveau de la base : c'est la seule forme qui résiste à deux processus concurrents.

---

## 10 · `90-metriques.sql` — 2 tables

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `evenement_metrique` | **A · A4** | MET-02 | `etablissement_id`, `nom`, `proprietes` (`JSONB` — tenant, établissement, module, rôle, version, plateforme), `horodatage_serveur` | `uq_evenement_metrique_id` *(l'idempotence est portée par la clé primaire, l'UUID venant du client)* | **`SELECT, INSERT`** | `ix_evenement_metrique_tenant_jour` |
| `agregat_quotidien` | **A · A4** | MET-03 | `etablissement_id`, `journee`, `indicateur`, `valeur`, `calcule_le` | `uq_agregat_quotidien_indicateur` | **`SELECT, INSERT`** — dérivé, recalculable ; un recalcul est **une nouvelle ligne**, pas une mise à jour | `ix_agregat_quotidien_etab_jour` |

> **L'idempotence par UUID d'événement n'a pas besoin d'une seconde colonne.** L'identifiant est fourni par le client (tronc commun) ; un lot renvoyé trois fois entre trois fois en conflit de clé primaire. C'est la même mécanique que le rejeu de la file hors-ligne, et c'est voulu — une seule mécanique, pas deux.

---

## 11 · `95-comptabilite.sql` — 2 tables, provisions seules

| Table | Classe · Branche | Story | Colonnes propres | Contraintes nommées | `kaya_app` | Index |
|---|---|---|---|---|---|---|
| `mapping_comptable` **(PROVISION)** | **C · C2** | TRX-02b | `type_evenement`, `compte_debit`, `compte_credit`, `journal` | `uq_mapping_comptable_type` | `SELECT` | — |
| `exercice_comptable` **(PROVISION)** | **C · C2** | TRX-02b | `debut`, `fin`, `statut` ∈ {`OUVERT`,`CLOS`} | `uq_exercice_comptable_periode` · `ck_exercice_comptable_bornes` | `SELECT` | — |

> **« Une période close n'accepte plus d'écriture » est une contrainte distincte** de la clôture journalière et de la certification fiscale, et elle interagira avec la réconciliation des écritures orphelines (SYN-03). **Aucune logique au MVP** : la table existe pour que la contrainte ait où vivre le jour venu.

---

## Récapitulatif

| Fichier | Tables | Provisions | Classe A | Classe B | Classe C | Classe D | Doubles classes |
|---|---|---|---|---|---|---|---|
| `10-etablissements.sql` | 19 | 6 | 2 | 2 | 15 | — | — |
| `20-comptes.sql` | 11 | 1 | 2 | — | 9 | — | — |
| `30-caisse.sql` | 12 | 3 | — | 11 | 1 | — | `encaissement` (B/D) |
| `40-fiscalite.sql` | 10 | 2 | 1 | 2 | 2 | 5 | — |
| `50-documents.sql` | 3 | — | — | 2 | 1 | — | `document_operationnel` (A/B) |
| `60-synchronisation.sql` | 3 | — | 3 | — | — | — | `reconciliation_orpheline` (A/B) |
| `70-pilotage.sql` | 1 | — | — | — | 1 | — | — |
| `80-editeur.sql` | 8 | — | 2 | — | 4 | 2 | — |
| `90-metriques.sql` | 2 | — | 2 | — | — | — | — |
| `95-comptabilite.sql` | 2 | 2 | — | — | 2 | — | — |
| **Total** | **71** | **14** | **12** | **17** | **35** | **7** | **4** |

**Cinq entités entrent au registre par ce cycle** : `releve_position` (§5.2), `coupure_comptee` (§5.3), `publication_outbox` (§5.6), `encaissement_abonnement` et `evenement_webhook_paiement` (§5.8) — plus une ligne par décision de nommage au journal §13.
