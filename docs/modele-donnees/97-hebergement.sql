-- ============================================================================
-- SCHÉMA hebergement — la verticale `verticales/hebergement`
--
-- TOUT LE SPÉCIFIQUE HÔTELIER VIT ICI ET NULLE PART AILLEURS (constitution,
-- principe 2). Le socle ne connaît ni chambre, ni séjour : `caisse` encaisse
-- contre une cible opaque, `ventes` facture une cible opaque, et c'est ce qui
-- permet à un pressing seul, ou à un bar seul, d'être un établissement valide.
--
-- DEUX DÉCISIONS DE FORME COMMANDENT TOUT LE RESTE DU FICHIER :
--
--   1. LA SALLE DE RÉUNION EST UNE UNITÉ D'UNE CATÉGORIE DÉDIÉE, pas une entité
--      nouvelle (PDV-08, HEB-05). Elle se réserve, s'occupe et se libère par le
--      même mécanisme que les chambres — donc par la même contrainte
--      d'exclusion. Une entité distincte aurait demandé une seconde mécanique
--      de disponibilité, et deux mécaniques finissent par diverger.
--
--   2. LE STATUT D'OCCUPATION D'UNE UNITÉ — libre, occupée, réservée — EST
--      DÉRIVÉ des occupations et N'A AUCUNE COLONNE (registre §7.2). Le
--      confondre avec le statut MÉNAGE produit des doubles attributions
--      (cadrage §11.4). Le statut ménage, lui, EST une colonne de `unite`, de
--      classe A, en dernier-écrit-gagne — SEUL CAS DU PRODUIT.
--
-- CE QU'IL NE COUVRE PAS, et où c'est :
--   — le calcul qui pose periode_indisponibilite, les contraintes de formule,
--     la bascule passage → nuitée : dans le `domain` de la phase 3
--     (specs/002-modele-donnees-verticales/contracts/disponibilite.md §3) ;
--   — toute règle fiscale : dans le JurisdictionAdapter, et nulle part ailleurs
--     (constitution, principe 5) ;
--   — la politique d'annulation, le délai d'expiration d'une provisoire, le
--     seuil de bascule, les heures d'arrivée et de départ standard : ce sont des
--     CLÉS DU CATALOGUE de configuration, créées au cycle D1.
--
-- Ordre d'application : APRÈS le socle et `stocks`. Aucune contrainte technique
-- ne l'impose — aucune clé étrangère ne traverse un schéma — mais l'ordre
-- lexicographique DIT LA HIÉRARCHIE DE DÉPENDANCE, et c'est la seule
-- information qu'il porte.
-- ============================================================================

CREATE SCHEMA hebergement;
GRANT USAGE ON SCHEMA hebergement TO kaya_app;


-- ############################################################################
-- 1 · RÉFÉRENTIEL — ce qui se paramètre, et ne s'écrit jamais hors ligne
-- ############################################################################


-- ============================================================================
-- hebergement.categorie — une classe d'unités, et son tarif de départ
-- CLASSE C · branche C2 — référentiel de l'établissement
-- Story : HEB-01
--
-- La capacité d'accueil est portée ici parce qu'elle est une propriété de la
-- CATÉGORIE, pas de l'unité : deux chambres « Standard » accueillent le même
-- nombre de personnes, et c'est ce qui rend la recherche par catégorie
-- possible. Une unité qui ferait exception serait une catégorie de plus.
--
-- LE TEMPS DE REMISE EN ÉTAT N'EST PAS UNE COLONNE D'ICI : il varie par
-- catégorie ET par formule, ce qu'une colonne ne porte pas. Voir
-- hebergement.temps_remise_en_etat.
-- ============================================================================
CREATE TABLE hebergement.categorie (
    id               UUID CONSTRAINT pk_categorie PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id UUID        NOT NULL,
    nom              TEXT        NOT NULL,
    capacite_accueil INTEGER     NOT NULL,
    ordre            INTEGER     NOT NULL DEFAULT 0,
    actif            BOOLEAN     NOT NULL DEFAULT true,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_categorie_nom UNIQUE (tenant_id, etablissement_id, nom),
    CONSTRAINT ck_categorie_capacite_positive CHECK (capacite_accueil > 0)
);

COMMENT ON COLUMN hebergement.categorie.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';

ALTER TABLE hebergement.categorie ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.categorie FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.categorie
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.categorie
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.categorie TO kaya_app;

-- Sert : lister les catégories d'un établissement, dans leur ordre d'affichage,
-- au paramétrage et à la recherche de disponibilité (HEB-01)
CREATE INDEX ix_categorie_etab ON hebergement.categorie (etablissement_id, ordre);


-- ============================================================================
-- hebergement.unite — une chambre, une salle, un espace attribuable
-- CLASSE C · branche C2 — référentiel : code, étage, rattachement de catégorie
-- CLASSE A · branche A4 — statut_menage : DERNIER-ÉCRIT-GAGNE AUTORISÉ, et
--                          c'est LE SEUL CAS DU PRODUIT
-- Story : HEB-01, HEB-06
--
-- DEUX CLASSES SUR UNE TABLE, et l'opération de chacune est nommée :
--   — la création, le code, l'étage, le rattachement à une catégorie et la mise
--     hors référentiel sont de CLASSE C : elles se paramètrent en ligne ;
--   — `statut_menage` est de CLASSE A. Une femme de chambre marque une unité
--     propre depuis un couloir sans réseau, et deux marquages du même statut ne
--     se contredisent pas. C'est la SEULE colonne du produit où le
--     dernier-écrit-gagne est admis, et elle est ici parce que sa perte ne coûte
--     rien : au pire on refait un lit déjà fait.
--
-- ⚠️ AUCUNE COLONNE DE STATUT D'OCCUPATION. Libre, occupée, réservée se
-- CALCULENT depuis hebergement.occupation. Une colonne de plus serait une
-- seconde vérité sur la même question, et les doubles attributions naissent
-- exactement là (cadrage §11.4, registre §7.2).
--
-- ⚠️ AUCUNE COLONNE DE MISE HORS SERVICE non plus. Une unité indisponible est
-- une OCCUPATION de motif MAINTENANCE — un seul mécanisme de disponibilité,
-- jamais deux. Elle bénéficie ainsi gratuitement de la contrainte d'exclusion :
-- on ne met pas en maintenance une unité occupée, on n'attribue pas une unité
-- en maintenance.
-- ============================================================================
CREATE TABLE hebergement.unite (
    id            UUID CONSTRAINT pk_unite PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    categorie_id  UUID        NOT NULL,
    code          TEXT        NOT NULL,
    etage         TEXT            NULL,
    statut_menage TEXT        NOT NULL DEFAULT 'PROPRE',
    actif         BOOLEAN     NOT NULL DEFAULT true,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_unite_categorie FOREIGN KEY (categorie_id)
        REFERENCES hebergement.categorie (id),
    -- L'unicité porte sur le tenant et la catégorie plutôt que sur
    -- l'établissement : la catégorie porte déjà son établissement, et une clé
    -- étrangère vers etablissements serait interdite (P-05). Deux unités du même
    -- établissement dans deux catégories peuvent donc partager un code — ce qui
    -- est le cas réel : « 12 » en chambre et « 12 » en salle de réunion.
    CONSTRAINT uq_unite_code UNIQUE (tenant_id, categorie_id, code),
    -- Trois valeurs, et pas une de plus. MAINTENANCE ici est un état de MÉNAGE
    -- (« la chambre attend un plombier »), jamais une indisponibilité : celle-là
    -- est une occupation.
    CONSTRAINT ck_unite_statut_menage CHECK (statut_menage IN (
        'A_NETTOYER', 'PROPRE', 'MAINTENANCE'))
);

COMMENT ON COLUMN hebergement.unite.statut_menage IS
    'CLASSE A · A4 — dernier-écrit-gagne autorisé, SEUL CAS DU PRODUIT. Jamais le statut d''occupation, qui est dérivé.';

ALTER TABLE hebergement.unite ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.unite FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.unite
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.unite
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.unite TO kaya_app;

-- Sert : les unités d'une catégorie — c'est LE SUPPORT DE LA RECHERCHE DE
-- DISPONIBILITÉ « quelles unités de la catégorie X sont libres entre T1 et T2 ? ».
-- La requête part de la catégorie, joint ici, puis exclut par les occupations :
-- cet index est le premier maillon, l'index GiST de la contrainte d'exclusion
-- est le second. C'est la requête que SC-010 mesure (HEB-02, SEJ-02)
CREATE INDEX ix_unite_categorie ON hebergement.unite (categorie_id, actif);

-- Sert : la liste des unités à nettoyer du jour, écran de gouvernante
-- (HEB-06, RSV-02)
CREATE INDEX ix_unite_statut_menage ON hebergement.unite (statut_menage);


-- ============================================================================
-- hebergement.formule — comment on vend une catégorie : nuitée, passage,
--                       demi-journée
-- CLASSE C · branche C2 — référentiel tarifaire ET fiscal
-- Story : HEB-03
--
-- ⚠️ `assujettie_taxe_nuitee` ET `regle_conversion_taxe` SONT DES PARAMÈTRES,
-- JAMAIS DES CONSTANTES ET JAMAIS UNE RÈGLE. Le traitement fiscal du passage et
-- de la demi-journée n'est pas arrêté (cadrage §5.5, décision B-02) et PEUT
-- DIFFÉRER PAR COMMUNE. Ces deux colonnes portent des ENTRÉES DE CALCUL ; le
-- calcul lui-même ne vit que dans le JurisdictionAdapter de la phase 3
-- (constitution, principe 5). Aucune règle fiscale ne vit dans ce fichier.
--
-- LES HEURES STANDARD ET LES DURÉES SONT DES SURCHARGES, pas des sources.
-- `heure_arrivee_standard` et `heure_depart_standard` existent comme clés du
-- CATALOGUE de configuration, de portée établissement, créées au cycle D1. Les
-- colonnes ci-dessous ne portent que ce qu'une formule SURCHARGE — nullables, et
-- le nul veut dire « prendre la valeur de l'établissement ». Les dupliquer sans
-- cette nuance donnerait deux vérités sur la même heure.
--
-- LE SEUIL DE BASCULE passage → nuitée N'EST PAS ICI : c'est la clé de catalogue
-- `seuil_bascule_nuitee_minutes`, de portée établissement (cycle D1).
-- ============================================================================
CREATE TABLE hebergement.formule (
    id                      UUID CONSTRAINT pk_formule PRIMARY KEY,
    tenant_id               UUID           NOT NULL,
    categorie_id            UUID           NOT NULL,
    type                    TEXT           NOT NULL,
    prix_base               montant_mineur NOT NULL,
    code_devise             code_devise    NOT NULL,
    duree_min_minutes       INTEGER            NULL,
    duree_max_minutes       INTEGER            NULL,
    -- Surcharges de formule. NULL = prendre la clé de catalogue de
    -- l'établissement, jamais une valeur en dur.
    heure_arrivee_standard  TIME               NULL,
    heure_depart_standard   TIME               NULL,
    -- Jours de la semaine autorisés, 1 = lundi … 7 = dimanche. NULL = tous.
    jours_autorises         SMALLINT[]         NULL,
    -- ENTRÉES du calcul fiscal, jamais le calcul.
    assujettie_taxe_nuitee  BOOLEAN        NOT NULL DEFAULT true,
    regle_conversion_taxe   TEXT               NULL,
    actif                   BOOLEAN        NOT NULL DEFAULT true,
    cree_le                 TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_formule_categorie FOREIGN KEY (categorie_id)
        REFERENCES hebergement.categorie (id),
    -- SALLE_REUNION est une formule comme une autre : c'est ce qui évite une
    -- seconde mécanique de réservation (PDV-08).
    CONSTRAINT ck_formule_type CHECK (type IN (
        'NUITEE', 'PASSAGE', 'DEMI_JOURNEE', 'SALLE_REUNION')),
    CONSTRAINT ck_formule_duree_coherente CHECK (
        duree_min_minutes IS NULL
        OR duree_max_minutes IS NULL
        OR duree_max_minutes >= duree_min_minutes)
);

COMMENT ON COLUMN hebergement.formule.assujettie_taxe_nuitee IS
    'ENTRÉE de calcul fiscal, jamais une règle. Le calcul vit dans le JurisdictionAdapter (phase 3).';
COMMENT ON COLUMN hebergement.formule.regle_conversion_taxe IS
    'ENTRÉE de calcul : comment un passage ou une demi-journée se convertit en nuitées taxables. Peut différer par commune (cadrage §5.5, B-02). Aucune règle n''est appliquée ici.';
COMMENT ON COLUMN hebergement.formule.heure_arrivee_standard IS
    'SURCHARGE de formule. NULL = clé de catalogue de l''établissement (cycle D1) — jamais une valeur en dur.';
COMMENT ON COLUMN hebergement.formule.heure_depart_standard IS
    'SURCHARGE de formule. NULL = clé de catalogue de l''établissement (cycle D1) — jamais une valeur en dur.';

ALTER TABLE hebergement.formule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.formule FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.formule
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.formule
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.formule TO kaya_app;

-- Sert : les formules proposées pour une catégorie, à l'attribution et au
-- paramétrage (HEB-03)
CREATE INDEX ix_formule_categorie ON hebergement.formule (categorie_id, actif);


-- ============================================================================
-- hebergement.temps_remise_en_etat — combien de temps l'unité reste bloquée
--                                    après le départ
-- CLASSE C · branche C2 — référentiel, sur le régime de sa catégorie
-- Story : HEB-01, HEB-02
--
-- ⚠️ C'EST UNE TABLE, ET L'UNICITÉ PORTE SUR LE COUPLE CATÉGORIE + FORMULE.
-- La durée varie par l'une ET par l'autre : 30 minutes après un passage, deux
-- heures après une nuitée, une heure après une demi-journée — SUR LA MÊME
-- CATÉGORIE. Une colonne de `categorie` ne porterait qu'une valeur et forcerait
-- à choisir laquelle ; une colonne de `formule` ne porterait pas la variation
-- par catégorie. Le couple est la seule forme qui porte les quatre valeurs HEB
-- que le registre §7.1 et les stories nomment.
--
-- Sa classe est celle de sa catégorie : UNE DURÉE DE MÉNAGE NE SE MODIFIE PAS
-- HORS LIGNE, elle se lit.
--
-- Cette durée est ce que le `domain` de la phase 3 ajoute à `periode.fin` pour
-- poser `periode_indisponibilite`. La base ne peut pas le garantir — la
-- contrainte devrait joindre trois tables à chaque écriture (contrat
-- disponibilite.md §3).
-- ============================================================================
CREATE TABLE hebergement.temps_remise_en_etat (
    id            UUID CONSTRAINT pk_temps_remise_en_etat PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    categorie_id  UUID        NOT NULL,
    formule_id    UUID        NOT NULL,
    duree_minutes INTEGER     NOT NULL,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_temps_remise_categorie FOREIGN KEY (categorie_id)
        REFERENCES hebergement.categorie (id),
    CONSTRAINT fk_temps_remise_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id),
    -- L'UNICITÉ EST SUR LE COUPLE. C'est la contrainte qui fait de cette table
    -- autre chose qu'une colonne mal placée.
    CONSTRAINT uq_temps_remise_categorie_formule
        UNIQUE (tenant_id, categorie_id, formule_id),
    -- Zéro serait accepté et voudrait dire « pas de remise en état » — ce qui se
    -- dit en n'ayant pas de ligne. Une durée nulle explicite est une ligne qu'on
    -- oublie de retirer.
    CONSTRAINT ck_temps_remise_duree_positive CHECK (duree_minutes > 0)
);

ALTER TABLE hebergement.temps_remise_en_etat ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.temps_remise_en_etat FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.temps_remise_en_etat
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.temps_remise_en_etat
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.temps_remise_en_etat TO kaya_app;

-- Aucun index : uq_temps_remise_categorie_formule porte déjà la résolution
-- « quelle durée pour cette catégorie et cette formule ? », qui est la seule
-- recherche de cette table.


-- ============================================================================
-- hebergement.bareme_palier — le tarif du passage, par palier de durée
-- CLASSE C · branche C2 — référentiel tarifaire
-- Story : HEB-04
--
-- UNE TABLE PLUTÔT QUE DES COLONNES, parce que le nombre de paliers varie d'un
-- exploitant à l'autre : trois chez l'un, sept chez l'autre. Des colonnes
-- `prix_2h`, `prix_4h`, `prix_6h` imposeraient une migration au premier client
-- qui en veut un huitième — et la rebascule de palier, qui est une opération de
-- classe B tracée au journal d'audit (HEB-04), ne saurait pas quelle colonne
-- viser.
--
-- `est_heure_supplementaire` distingue le palier ORDINAIRE du tarif appliqué
-- AU-DELÀ du dernier palier. Sans lui, l'heure supplémentaire serait un palier
-- de plus, et le calcul ne saurait pas où s'arrêter.
-- ============================================================================
CREATE TABLE hebergement.bareme_palier (
    id                       UUID CONSTRAINT pk_bareme_palier PRIMARY KEY,
    tenant_id                UUID           NOT NULL,
    formule_id               UUID           NOT NULL,
    duree_minutes            INTEGER        NOT NULL,
    prix                     montant_mineur NOT NULL,
    code_devise              code_devise    NOT NULL,
    est_heure_supplementaire BOOLEAN        NOT NULL DEFAULT false,
    cree_le                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_bareme_palier_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id),
    CONSTRAINT uq_bareme_palier_duree UNIQUE (tenant_id, formule_id, duree_minutes),
    CONSTRAINT ck_bareme_palier_duree_positive CHECK (duree_minutes > 0)
);

ALTER TABLE hebergement.bareme_palier ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.bareme_palier FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.bareme_palier
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.bareme_palier
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.bareme_palier TO kaya_app;

-- Sert : le barème ordonné d'une formule de passage — la résolution du palier
-- applicable à une durée, et la rebascule quand la durée franchit un seuil
-- (HEB-04)
CREATE INDEX ix_bareme_palier_formule
    ON hebergement.bareme_palier (formule_id, duree_minutes);


-- ============================================================================
-- hebergement.plage_demi_journee — les créneaux d'une formule demi-journée
-- CLASSE C · branche C2 — référentiel
-- Story : HEB-05
--
-- UNE TABLE PLUTÔT QU'UNE ÉNUMÉRATION « matin / après-midi » : les plages ne
-- sont pas les mêmes d'un exploitant à l'autre, et une salle de réunion peut en
-- avoir trois. `libelle` est ce que l'écran affiche — il ne se déduit pas des
-- heures, parce que « matinée » et « 8h–12h » ne se traduisent pas l'un par
-- l'autre.
-- ============================================================================
CREATE TABLE hebergement.plage_demi_journee (
    id          UUID CONSTRAINT pk_plage_demi_journee PRIMARY KEY,
    tenant_id   UUID        NOT NULL,
    formule_id  UUID        NOT NULL,
    libelle     TEXT        NOT NULL,
    heure_debut TIME        NOT NULL,
    heure_fin   TIME        NOT NULL,
    cree_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_plage_demi_journee_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id),
    CONSTRAINT uq_plage_demi_journee_libelle UNIQUE (tenant_id, formule_id, libelle),
    CONSTRAINT ck_plage_demi_journee_ordre CHECK (heure_fin > heure_debut)
);

ALTER TABLE hebergement.plage_demi_journee ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.plage_demi_journee FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.plage_demi_journee
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.plage_demi_journee
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.plage_demi_journee TO kaya_app;

-- Sert : les plages proposées pour une formule demi-journée, à l'attribution
-- (HEB-05)
CREATE INDEX ix_plage_demi_journee_formule
    ON hebergement.plage_demi_journee (formule_id, heure_debut);


-- ============================================================================
-- hebergement.calendrier_tarifaire — le prix change selon la saison
-- CLASSE C · branche C2 — référentiel tarifaire
-- Story : HEB-07
--
-- UNE TABLE PLUTÔT QU'UNE COLONNE de `formule`, parce qu'un tarif de saison est
-- DATÉ et se superpose : haute saison du 15 décembre au 5 janvier, tarif salon
-- sur trois jours par-dessus. `priorite` tranche la superposition — la valeur la
-- plus haute gagne —, ce qu'un simple ordre de dates ne fait pas.
--
-- `date_fin` NULLABLE veut dire « jusqu'à nouvel ordre », qui est le cas d'un
-- changement de tarif de base. Sans le nul, on écrirait une date arbitraire en
-- 2099, et un jour quelqu'un la lirait comme une date réelle.
-- ============================================================================
CREATE TABLE hebergement.calendrier_tarifaire (
    id          UUID CONSTRAINT pk_calendrier_tarifaire PRIMARY KEY,
    tenant_id   UUID           NOT NULL,
    formule_id  UUID           NOT NULL,
    date_effet  DATE           NOT NULL,
    date_fin    DATE               NULL,
    prix        montant_mineur NOT NULL,
    code_devise code_devise    NOT NULL,
    priorite    INTEGER        NOT NULL DEFAULT 0,
    cree_le     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_calendrier_tarifaire_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id),
    CONSTRAINT ck_calendrier_tarifaire_periode CHECK (
        date_fin IS NULL OR date_fin >= date_effet)
);

COMMENT ON COLUMN hebergement.calendrier_tarifaire.date_fin IS
    'NULL = jusqu''à nouvel ordre. Jamais une date sentinelle : une date lointaine finit par être lue comme réelle.';

ALTER TABLE hebergement.calendrier_tarifaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.calendrier_tarifaire FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.calendrier_tarifaire
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.calendrier_tarifaire
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.calendrier_tarifaire TO kaya_app;

-- Sert : le tarif applicable à une date pour une formule — la résolution du
-- prix, priorité décroissante (HEB-07)
CREATE INDEX ix_calendrier_tarifaire_formule_date
    ON hebergement.calendrier_tarifaire (formule_id, date_effet DESC, priorite DESC);


-- ============================================================================
-- FIN — 97-hebergement.sql
-- ============================================================================
