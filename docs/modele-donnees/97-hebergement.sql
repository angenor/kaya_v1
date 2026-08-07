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
--      COROLLAIRE, écrit parce qu'il a été manqué une fois : elle n'a pas non
--      plus de TYPE DE FORMULE propre. Elle se loue à l'heure — en `PASSAGE` —
--      ou à la demi-journée. Voir `ck_formule_type`.
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
    -- LES QUATRE VALEURS SONT CELLES DE LA SPÉCIFICATION, mot pour mot
    -- (spec.md ; HEB-03 ; cadrage §5 l. 170). `MENSUEL` n'est PAS réservé aux
    -- résidences meublées : le cadrage est formel — « aucune formule n'est
    -- réservée à un type d'établissement ; un hôtel peut proposer du mensuel »,
    -- et un client peut séjourner plusieurs mois en hôtel.
    --
    -- ⚠️ IL N'Y A PAS DE VALEUR `SALLE_REUNION`, ET C'EST DÉLIBÉRÉ. Une salle de
    -- réunion est une UNITÉ D'UNE CATÉGORIE DÉDIÉE (PDV-08, HEB-05), pas un type
    -- de formule : elle se loue à l'heure — donc en PASSAGE — ou à la
    -- demi-journée. Lui donner un type propre créerait une cinquième mécanique
    -- de tarification qui ferait exactement ce que les quatre autres font déjà.
    CONSTRAINT ck_formule_type CHECK (type IN (
        'NUITEE', 'PASSAGE', 'DEMI_JOURNEE', 'MENSUEL')),
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

COMMENT ON COLUMN hebergement.calendrier_tarifaire.date_effet IS
    'Période de VALIDITÉ D''UN TARIF, jamais une période de disponibilité — celle-là est le tstzrange de hebergement.occupation. Ne pas confondre les deux (SC-004).';
COMMENT ON COLUMN hebergement.calendrier_tarifaire.date_fin IS
    'NULL = jusqu''à nouvel ordre. Jamais une date sentinelle : une date lointaine finit par être lue comme réelle. Période de VALIDITÉ D''UN TARIF, jamais de disponibilité (SC-004).';

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


-- ############################################################################
-- 2 · DISPONIBILITÉ — le cœur du produit, et sa seule décision irréversible
-- ############################################################################


-- ============================================================================
-- hebergement.occupation — qui occupe quelle unité, de quand à quand
-- CLASSE B · branche B3 — ressource unique sur un intervalle
-- Story : HEB-02, HEB-06
--
-- ============================================================================
-- C'EST LA TABLE LA PLUS STRUCTURANTE DU PRODUIT, ET LA SEULE DÉCISION DE CE
-- MODÈLE QU'ON NE POURRA PLUS DÉFAIRE. Trois propriétés en font le tour.
-- ============================================================================
--
-- (1) UN tstzrange, JAMAIS UNE PAIRE DE COLONNES DE DATE.
--     Le marché pratique massivement le passage horaire et la demi-journée
--     (cadrage §5.1). Une paire de dates rendrait le produit inapte à son
--     marché principal, et le rattraper coûterait la migration de TOUTES les
--     occupations. Les bornes sont [début, fin) — fermée à gauche, ouverte à
--     droite : une occupation qui finit à 18h00 et une qui commence à 18h00 NE
--     SE CHEVAUCHENT PAS, ce qui permet d'exprimer « jusqu'à midi » sans se
--     demander si midi est inclus.
--
-- (2) DEUX PÉRIODES, UNE SEULE CONTRAINTE.
--     `periode` est ce que le client occupe et CE QUI SE FACTURE.
--     `periode_indisponibilite` l'englobe AVEC le temps de remise en état, et
--     c'est ELLE que la contrainte d'exclusion protège.
--     UNE PÉRIODE UNIQUE FORCE UN CHOIX, ET LES DEUX SONT FAUX : soit on
--     facture le ménage au client, soit on attribue une unité encore sale. Une
--     période plus une colonne de durée ne marcherait pas non plus — le calcul
--     de chevauchement devrait reconstruire l'intervalle réel à chaque requête,
--     et la contrainte ne pourrait plus le protéger : on serait revenu à un
--     verrou applicatif.
--
-- (3) LA CONTRAINTE EST PARTIELLE — `WHERE (statut <> 'ANNULEE')`.
--     Sans cette clause, TOUTE ANNULATION RENDRAIT L'UNITÉ DÉFINITIVEMENT
--     INLOUABLE sur son intervalle — alors qu'annulation, no-show et départ
--     anticipé sont TROIS CHEMINS NOMINAUX du produit. C'est le cas qu'on
--     oublie de tester, et c'est le plus coûteux.
--
-- ⚠️ LA CONTRAINTE D'EXCLUSION SE POSE À LA CRÉATION DE LA TABLE, JAMAIS PAR
-- ALTER. Sur une table peuplée, elle échoue sur les données existantes — piège
-- (b) consigné par le cycle D1 dans 00-conventions.sql, ET CE FICHIER EST LE
-- PREMIER À LE RENCONTRER POUR DE VRAI. Corollaire : la forme retenue doit être
-- la bonne AUJOURD'HUI, parce qu'une migration de phase 3 ne pourra plus la
-- durcir — ni ajouter un motif au WHERE, ni changer les bornes.
--
-- `unite_id WITH =` EXIGE L'EXTENSION btree_gist : un UUID ne s'indexe pas en
-- GiST sans elle. Elle est posée par 00-conventions.sql depuis le cycle D1,
-- EXPLICITEMENT POUR CE JOUR.
--
-- CE QUE LA BASE GARANTIT ICI, ET QU'AUCUN SERVICE NE REFAIT :
--   — aucun chevauchement d'indisponibilités sur une même unité, y compris
--     entre deux processus concurrents, y compris sous forte charge ;
--   — le temps de remise en état est respecté ;
--   — la période facturée est incluse dans l'indisponibilité ;
--   — une occupation annulée ne réserve plus rien.
-- Ce n'est PAS un verrou applicatif : un verrou se contourne par un second
-- processus, un rejeu de file après coupure ; une contrainte d'exclusion est
-- évaluée par le moteur pour TOUTE transaction sans exception.
--
-- ⚠️ RÈGLE DE SERVICE OPPOSABLE À LA PHASE 3 : AUCUN `SELECT` DE VÉRIFICATION
-- PRÉALABLE NE TIENT LIEU DE GARANTIE. Lire « l'unité est libre » puis insérer
-- est un intervalle de temps pendant lequel elle cesse de l'être. LA FORME
-- CORRECTE EST D'INSÉRER ET DE TRAITER LE REJET — code 23P01,
-- exclusion_violation. Contrat complet :
-- specs/002-modele-donnees-verticales/contracts/disponibilite.md
--
-- LA MISE HORS SERVICE D'UNE UNITÉ EST UNE OCCUPATION DE MOTIF MAINTENANCE, et
-- non une colonne de `unite` : un seul mécanisme de disponibilité, jamais deux.
-- Elle bénéficie ainsi GRATUITEMENT de la contrainte.
-- ============================================================================
CREATE TABLE hebergement.occupation (
    id                      UUID CONSTRAINT pk_occupation PRIMARY KEY,
    tenant_id               UUID        NOT NULL,
    unite_id                UUID        NOT NULL,
    motif                   TEXT        NOT NULL,
    -- Ce que le client occupe, ET CE QUI SE FACTURE.
    periode                 TSTZRANGE   NOT NULL,
    -- L'occupation PLUS le temps de remise en état. C'est ELLE que la contrainte
    -- d'exclusion protège.
    periode_indisponibilite TSTZRANGE   NOT NULL,
    statut                  TEXT        NOT NULL,
    -- Ce qui a créé l'occupation : un séjour, une réservation, une intervention.
    -- Colonnes NUES et INTERNES au schéma — nues parce que la cible varie, et
    -- qu'une clé étrangère polymorphe n'existe pas.
    origine_type            TEXT            NULL,
    origine_id              UUID            NULL,
    horodatage_client       TIMESTAMPTZ     NULL,
    cree_le                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_occupation_unite FOREIGN KEY (unite_id)
        REFERENCES hebergement.unite (id),
    -- BLOCAGE couvre la fermeture saisonnière et le retrait volontaire ;
    -- MAINTENANCE, la panne. Les distinguer sert le rapport d'exploitation :
    -- une unité fermée pour la saison n'est pas une unité en panne.
    CONSTRAINT ck_occupation_motif CHECK (motif IN (
        'SEJOUR', 'RESERVATION', 'MAINTENANCE', 'BLOCAGE')),
    CONSTRAINT ck_occupation_statut CHECK (statut IN (
        'ACTIVE', 'TERMINEE', 'ANNULEE')),
    -- La période facturée est INCLUSE dans l'indisponibilité. `@>` accepte
    -- l'égalité — une occupation sans remise en état est licite.
    -- ⚠️ Ce CHECK n'est PAS une porte de vérification, et il n'a pas à en être
    -- une : c'est une contrainte de la base, donc déjà garantie à chaque
    -- écriture. Une porte qui vérifierait qu'elle existe vérifierait un fichier,
    -- pas un comportement.
    CONSTRAINT ck_occupation_periode_incluse
        CHECK (periode_indisponibilite @> periode),
    -- ========================================================================
    -- LA CONTRAINTE. Tout le reste du fichier existe pour elle.
    -- ========================================================================
    CONSTRAINT ex_occupation_unite_periode
        EXCLUDE USING gist (unite_id WITH =, periode_indisponibilite WITH &&)
        WHERE (statut <> 'ANNULEE')
);

COMMENT ON COLUMN hebergement.occupation.periode IS
    'Ce que le client occupe et CE QUI SE FACTURE. Bornes [début, fin) — 18h00→18h00 ne se chevauchent pas.';
COMMENT ON COLUMN hebergement.occupation.periode_indisponibilite IS
    'periode + temps de remise en état. C''est ELLE que ex_occupation_unite_periode protège. Posée par le domain à periode.fin + temps_remise_en_etat.duree_minutes — la base ne peut pas le garantir, la contrainte devrait joindre trois tables à chaque écriture.';
COMMENT ON COLUMN hebergement.occupation.motif IS
    'SEJOUR | RESERVATION | MAINTENANCE | BLOCAGE. LA MISE HORS SERVICE EST UNE OCCUPATION, jamais une colonne de unite — un seul mécanisme de disponibilité.';
COMMENT ON COLUMN hebergement.occupation.origine_id IS
    'Rattachement interne au schéma vers sejour, reservation ou intervention — nu, la cible variant selon origine_type.';
COMMENT ON COLUMN hebergement.occupation.horodatage_client IS
    'INDICATIF. AUCUN calcul de durée de passage ne s''y appuie — il s''appuie sur l''horodatage d''autorité, et c''est exactement là que l''écart coûterait de l''argent réel (cadrage §11.4).';

ALTER TABLE hebergement.occupation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.occupation FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.occupation
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.occupation
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- UPDATE est accordé pour les quatre écritures qui touchent la disponibilité :
-- prolongation, départ anticipé, conversion d'une réservation en séjour, et
-- passage du statut à ANNULEE. Aucune n'est une réécriture d'historique — le
-- changement d'unité en cours de séjour crée DEUX LIGNES, il n'en modifie pas
-- une (contrat disponibilite.md §4).
GRANT SELECT, INSERT, UPDATE ON hebergement.occupation TO kaya_app;

-- ⚠️ AUCUN INDEX POUR LE CHEVAUCHEMENT. Une contrainte EXCLUDE est adossée à un
-- index GiST, et cet index sert déjà « cette unité est-elle libre entre T1 et
-- T2 ? ». En créer un second ferait payer chaque écriture deux fois pour la
-- même recherche. La recherche par catégorie, elle, est servie par
-- ix_unite_categorie, posé plus haut.

-- Sert : retrouver l'occupation d'un séjour ou d'une réservation — la
-- prolongation, l'annulation et la conversion partent de là (SEJ-04, RSV-04)
CREATE INDEX ix_occupation_origine
    ON hebergement.occupation (origine_type, origine_id);


-- ############################################################################
-- 3 · SÉJOUR — du client à la note, et la note à la taxe
-- ############################################################################


-- ============================================================================
-- hebergement.client — ce qui est propre au client de l'hébergement
-- CLASSE C · branche C2 — PARTAGÉ ENTRE LES ÉTABLISSEMENTS DU TENANT
-- Story : SEJ-01
--
-- ⚠️ AUCUNE DONNÉE D'IDENTITÉ N'EST DUPLIQUÉE ICI. Nom, prénoms, téléphone,
-- type et numéro de pièce vivent sur `comptes.personne` (cycle D1), qui porte
-- l'index de recherche ET `piece_capturee_le`, la colonne de la purge ARTCI
-- TRX-06. LES DUPLIQUER DONNERAIT DEUX CIBLES À LA PURGE, et une purge qui en
-- oublie une est une non-conformité — découverte au contrôle, pas avant.
-- Cette table ne porte donc que ce qui est propre au CLIENT DE L'HÉBERGEMENT :
-- sa nationalité pour la fiche de police, son adresse de facturation, sa
-- catégorie commerciale, la note interne du personnel.
--
-- ⚠️ AUCUN `etablissement_id`, ET C'EST SEJ-01 QUI L'IMPOSE. La fiche est
-- « rattachée au tenant, PARTAGÉE ENTRE SES ÉTABLISSEMENTS » (registre §7.3).
-- Une colonne d'établissement la rattacherait à un seul et contredirait
-- `uq_client_personne`, unique PAR TENANT. Un établissement retrouve « ses »
-- clients PAR SES SÉJOURS — `sejour.etablissement_id` —, ce qui est exactement
-- ce que « partagée » veut dire. L'isolation reste portée par `tenant_id`,
-- comme sur toute table du modèle.
-- ============================================================================
CREATE TABLE hebergement.client (
    id                    UUID CONSTRAINT pk_client PRIMARY KEY,
    tenant_id             UUID        NOT NULL,
    -- Rattachement inter-modules vers comptes.personne — NU. L'identité vit
    -- là-bas, et NULLE PART AILLEURS.
    personne_id           UUID        NOT NULL,
    nationalite           TEXT            NULL,
    adresse               TEXT            NULL,
    categorie_commerciale TEXT            NULL,
    note_interne          TEXT            NULL,
    cree_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- UNIQUE PAR TENANT, jamais par établissement : c'est la forme qui dit
    -- « partagée entre les établissements du tenant ».
    CONSTRAINT uq_client_personne UNIQUE (tenant_id, personne_id)
);

COMMENT ON TABLE hebergement.client IS
    'Spécialisation de comptes.personne. AUCUNE donnée d''identité dupliquée : la purge ARTCI TRX-06 n''a qu''une cible.';
COMMENT ON COLUMN hebergement.client.personne_id IS
    'Rattachement inter-modules vers comptes.personne — nu, sans REFERENCES. L''identité et piece_capturee_le vivent là-bas.';

ALTER TABLE hebergement.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.client FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.client
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.client
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.client TO kaya_app;

-- Sert : retrouver le client depuis la personne trouvée par la recherche
-- d'identité du socle — le sens de lecture réel à l'arrivée (SEJ-01)
CREATE INDEX ix_client_personne ON hebergement.client (personne_id);


-- ============================================================================
-- hebergement.preference_personne — « chambre calme, étage bas »
-- CLASSE A · branche A4 — append-only, commutative, sans effet monétaire
-- Story : SEJ-01, SEJ-02
--
-- ⚠️ SUR LA PERSONNE, PAS SUR LE CLIENT. Une préférence suit la personne d'un
-- établissement à l'autre : c'est le même homme qui n'aime pas le rez-de-
-- chaussée, qu'il dorme à Abidjan ou à Abengourou. La poser sur `client`
-- l'enfermerait dans la fiche d'hébergement, alors que la personne existe aussi
-- comme cliente du pressing.
--
-- APPEND-ONLY : deux enregistrements de la même préférence ne se contredisent
-- pas, et c'est ce qui la rend commutative — donc atteignable hors ligne.
-- ============================================================================
CREATE TABLE hebergement.preference_personne (
    id                UUID CONSTRAINT pk_preference_personne PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers comptes.personne — NU.
    personne_id       UUID        NOT NULL,
    type              TEXT        NOT NULL,
    valeur            TEXT        NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN hebergement.preference_personne.personne_id IS
    'Rattachement inter-modules vers comptes.personne — nu, sans REFERENCES. SUR LA PERSONNE et non sur le client : la préférence suit l''homme d''un établissement à l''autre.';

ALTER TABLE hebergement.preference_personne ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.preference_personne FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.preference_personne
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.preference_personne
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON hebergement.preference_personne TO kaya_app;

-- Sert : les préférences à afficher à l'arrivée, de la plus récente à la plus
-- ancienne (SEJ-01, SEJ-02)
CREATE INDEX ix_preference_personne_personne
    ON hebergement.preference_personne (personne_id, cree_le DESC);


-- ============================================================================
-- hebergement.sejour — quelqu'un occupe une unité, du check-in au check-out
-- CLASSE B · branche B3 — ressource unique
-- Story : SEJ-02, SEJ-04
--
-- `occupation_id` EST OBLIGATOIRE, et c'est ce qui rend la disponibilité
-- indéformable : IL N'EXISTE PAS DE SÉJOUR SANS OCCUPATION. Un séjour qui
-- n'aurait pas la sienne serait une attribution d'unité que la contrainte
-- d'exclusion n'aurait jamais vue — donc une double attribution possible.
--
-- `client_id` EST NULLABLE, et c'est SEJ-05 qui l'impose : la vente à un client
-- extérieur — passage sans fiche, salle de réunion à l'heure — ne crée pas
-- toujours de fiche client. La rendre obligatoire ferait créer des fiches vides.
--
-- LE CHANGEMENT D'UNITÉ EN COURS DE SÉJOUR NE MODIFIE PAS `unite_id` : il crée
-- DEUX occupations — la première close sur l'instant du changement, la seconde
-- ouverte sur la nouvelle unité — et l'historique est conservé, comme SEJ-04
-- l'exige. `unite_id` porte l'unité COURANTE.
-- ============================================================================
CREATE TABLE hebergement.sejour (
    id                UUID CONSTRAINT pk_sejour PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    -- C'EST PAR LUI qu'un établissement retrouve « ses » clients, `client`
    -- n'en portant pas.
    etablissement_id  UUID        NOT NULL,
    client_id         UUID            NULL,
    unite_id          UUID        NOT NULL,
    formule_id        UUID        NOT NULL,
    occupation_id     UUID        NOT NULL,
    reservation_id    UUID            NULL,
    etat              TEXT        NOT NULL,
    arrive_le         TIMESTAMPTZ NOT NULL,
    parti_le          TIMESTAMPTZ     NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_sejour_client FOREIGN KEY (client_id)
        REFERENCES hebergement.client (id),
    CONSTRAINT fk_sejour_unite FOREIGN KEY (unite_id)
        REFERENCES hebergement.unite (id),
    CONSTRAINT fk_sejour_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id),
    CONSTRAINT fk_sejour_occupation FOREIGN KEY (occupation_id)
        REFERENCES hebergement.occupation (id),
    CONSTRAINT ck_sejour_etat CHECK (etat IN (
        'EN_COURS', 'TERMINE', 'ANNULE')),
    CONSTRAINT ck_sejour_depart_coherent CHECK (
        parti_le IS NULL OR parti_le >= arrive_le)
);

COMMENT ON COLUMN hebergement.sejour.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES. C''est par cette colonne qu''un établissement retrouve « ses » clients : hebergement.client ne porte pas d''établissement (SEJ-01).';
COMMENT ON COLUMN hebergement.sejour.occupation_id IS
    'OBLIGATOIRE. Il n''existe pas de séjour sans occupation — un séjour sans la sienne serait une attribution que la contrainte d''exclusion n''aurait jamais vue.';
COMMENT ON COLUMN hebergement.sejour.client_id IS
    'NULLABLE — la vente à un client extérieur (SEJ-05) ne crée pas toujours de fiche. L''exiger ferait créer des fiches vides.';
COMMENT ON COLUMN hebergement.sejour.arrive_le IS
    '⚠️ CONSTAT de l''instant d''arrivée réel — CETTE PAIRE DE COLONNES NE PORTE PAS LA DISPONIBILITÉ. La période réservée et protégée est le tstzrange de hebergement.occupation, et occupation_id est NOT NULL : aucun séjour n''existe sans la sienne. Aucune recherche de disponibilité ne doit partir d''ici ; s''en servir contournerait la contrainte d''exclusion et produirait des doubles attributions (SC-004).';
COMMENT ON COLUMN hebergement.sejour.parti_le IS
    '⚠️ CONSTAT de l''instant de départ réel — voir arrive_le. NE PORTE PAS LA DISPONIBILITÉ : celle-ci est le tstzrange de hebergement.occupation.';
COMMENT ON COLUMN hebergement.sejour.unite_id IS
    'Unité COURANTE. Un changement d''unité en cours de séjour crée DEUX occupations et ne réécrit aucun historique (SEJ-04).';
COMMENT ON COLUMN hebergement.sejour.reservation_id IS
    'Réservation honorée par ce séjour (RSV-05). Clé étrangère INTERNE au schéma, posée par ALTER à la fin du fichier — hebergement.reservation est déclarée après cette table. Voir fk_sejour_reservation.';

ALTER TABLE hebergement.sejour ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.sejour FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.sejour
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.sejour
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.sejour TO kaya_app;

-- Sert : les séjours en cours d'un établissement — le tableau de réception
-- (SEJ-02)
CREATE INDEX ix_sejour_etab_etat ON hebergement.sejour (etablissement_id, etat);

-- Sert : l'historique des séjours d'un client, du plus récent au plus ancien
-- (SEJ-01)
CREATE INDEX ix_sejour_client ON hebergement.sejour (client_id, arrive_le DESC);

-- Sert : l'occupant courant d'une unité — l'écran de gouvernante et le
-- room-service (HEB-06)
CREATE INDEX ix_sejour_unite_arrivee
    ON hebergement.sejour (unite_id, arrive_le DESC);


-- ============================================================================
-- hebergement.accompagnant — qui d'autre dort là
-- CLASSE A · branche A4 — explicitement A au cadrage §11.3
-- Story : SEJ-02
--
-- APPEND-ONLY, et la conséquence compte : LA BASE DU CALCUL DE TAXE DE SÉJOUR
-- est le nombre de personnes, accompagnants compris (FIS-03). Ajouter un
-- accompagnant hors ligne est donc licite ; le constat de taxe, lui, est figé au
-- départ, en ligne, dans `taxe_sejour_constat` — c'est ce qui empêche une
-- écriture tardive de modifier une taxe déjà déclarée.
--
-- `est_mineur` est une colonne plutôt qu'un calcul sur une date de naissance :
-- l'exonération porte sur le statut au moment du séjour, et la date de naissance
-- n'est pas toujours collectée.
-- ============================================================================
CREATE TABLE hebergement.accompagnant (
    id                UUID CONSTRAINT pk_accompagnant PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    sejour_id         UUID        NOT NULL,
    nom               TEXT        NOT NULL,
    prenoms           TEXT            NULL,
    type_piece        TEXT            NULL,
    numero_piece      TEXT            NULL,
    est_mineur        BOOLEAN     NOT NULL DEFAULT false,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_accompagnant_sejour FOREIGN KEY (sejour_id)
        REFERENCES hebergement.sejour (id)
);

COMMENT ON COLUMN hebergement.accompagnant.est_mineur IS
    'Statut AU MOMENT DU SÉJOUR, colonne et non calcul : l''exonération porte sur ce statut, et la date de naissance n''est pas toujours collectée.';

ALTER TABLE hebergement.accompagnant ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.accompagnant FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.accompagnant
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.accompagnant
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON hebergement.accompagnant TO kaya_app;

-- Sert : les accompagnants d'un séjour — la fiche de police et la base du
-- calcul de taxe (SEJ-02, FIS-03)
CREATE INDEX ix_accompagnant_sejour ON hebergement.accompagnant (sejour_id);


-- ============================================================================
-- hebergement.note_sejour — ce que le séjour doit, à un instant donné
-- CLASSE B · branche B3 — effet monétaire, clôt avec le séjour
-- Story : SEJ-02, SEJ-04
--
-- UNE NOTE PAR SÉJOUR — `uq_note_sejour_sejour` —, et l'unicité EST la
-- structure : deux notes sur un séjour donneraient deux totaux et deux
-- documents fiscaux.
--
-- `total_provisoire` PORTE BIEN SON NOM : c'est un CACHE de lecture, recalculé
-- depuis les lignes. Le total OPPOSABLE est celui du document fiscal certifié.
-- Une colonne de total qu'on croirait faisant foi est le plus court chemin vers
-- une note et une facture qui ne disent pas la même chose.
--
-- L'ÉTAT `ARRETEE` EST CE QUI DÉCLENCHE LE CAS ORPHELIN DES DEUX SAGAS : une
-- consommation qui arrive après l'arrêt ne s'ajoute pas d'office, elle part en
-- réconciliation. Voir contracts/sagas-inter-modules.md.
-- ============================================================================
CREATE TABLE hebergement.note_sejour (
    id                UUID CONSTRAINT pk_note_sejour PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    sejour_id         UUID           NOT NULL,
    etat              TEXT           NOT NULL,
    arretee_le        TIMESTAMPTZ        NULL,
    total_provisoire  montant_mineur NOT NULL DEFAULT 0,
    code_devise       code_devise    NOT NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_note_sejour_sejour FOREIGN KEY (sejour_id)
        REFERENCES hebergement.sejour (id),
    CONSTRAINT uq_note_sejour_sejour UNIQUE (tenant_id, sejour_id),
    CONSTRAINT ck_note_sejour_etat CHECK (etat IN ('OUVERTE', 'ARRETEE'))
);

COMMENT ON COLUMN hebergement.note_sejour.total_provisoire IS
    'CACHE de lecture, recalculé depuis les lignes. Le total OPPOSABLE est celui du document fiscal certifié — jamais celui-ci.';
COMMENT ON COLUMN hebergement.note_sejour.etat IS
    'OUVERTE | ARRETEE. L''état ARRETEE DÉCLENCHE LE CAS ORPHELIN des deux sagas : une consommation qui arrive après ne s''ajoute pas d''office, elle part en réconciliation (contracts/sagas-inter-modules.md).';

ALTER TABLE hebergement.note_sejour ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.note_sejour FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.note_sejour
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.note_sejour
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.note_sejour TO kaya_app;

-- Aucun index : uq_note_sejour_sejour suffit — une note par séjour, et c'est la
-- seule recherche de cette table.


-- ============================================================================
-- hebergement.ligne_sejour — une ligne de la note
-- CLASSE B · branche B3 — effet monétaire sur la note
-- CLASSE « CELLE DE LA LIGNE D'ORIGINE » — quand la ligne vient d'un point de
--         vente : une consommation saisie hors ligne en classe A RESTE une
--         écriture de classe A une fois reportée, et c'est ce qui rend le report
--         possible depuis un terminal déconnecté (registre §7.3)
-- Story : SEJ-03
--
-- ⚠️ CETTE SECONDE CLASSE N'EST PAS UNE VALEUR FIXE, et c'est pourquoi elle ne
-- s'inscrit dans aucune colonne de décompte. Elle se lit sur la ligne d'origine.
--
-- ⚠️ `ligne_commande_id` EST LA PREMIÈRE DES DEUX SAGAS. Voir le bloc de
-- commentaires de colonne, rédigé en T015.
--
-- ⚠️ L'IDEMPOTENCE DES DEUX REPORTS EST PORTÉE PAR UN INDEX UNIQUE PARTIEL,
-- JAMAIS PAR UNE LECTURE PRÉALABLE. Un index ordinaire RETROUVERAIT le doublon ;
-- il ne le REFUSERAIT pas — et un événement rejoué après coupure produirait une
-- SECONDE LIGNE SUR LA NOTE, donc une double facturation découverte au départ du
-- client. La forme est celle du socle : « l'idempotence est portée par une
-- contrainte, pas par du code » (`uq_evenement_metrique_id`, cycle D1). Le
-- service de la phase 3 INSÈRE ET TRAITE LE CONFLIT `23505` — il ne lit pas
-- avant d'écrire, exactement comme pour la contrainte d'exclusion.
--
-- `sejour_origine_id` PORTE LE TRANSFERT DE CHARGES entre séjours (SEJ-03) :
-- la ligne vit sur la note qui paie, et garde la trace du séjour qui a consommé.
-- C'est une clé étrangère INTERNE au schéma — normale et souhaitable.
-- ============================================================================
CREATE TABLE hebergement.ligne_sejour (
    id                UUID CONSTRAINT pk_ligne_sejour PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    note_sejour_id    UUID           NOT NULL,
    type              TEXT           NOT NULL,
    libelle           TEXT           NOT NULL,
    quantite          quantite       NOT NULL,
    prix_unitaire     montant_mineur NOT NULL,
    code_devise       code_devise    NOT NULL,
    taux_tva          NUMERIC        NOT NULL DEFAULT 0,
    -- SAGA `ventes` → `hebergement`. NU, sans REFERENCES.
    ligne_commande_id UUID               NULL,
    -- Transfert de charges — clé étrangère INTERNE au schéma.
    sejour_origine_id UUID               NULL,
    -- Report du pressing sur la note. NU, sans REFERENCES.
    bon_depot_id      UUID               NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_ligne_sejour_note FOREIGN KEY (note_sejour_id)
        REFERENCES hebergement.note_sejour (id),
    CONSTRAINT fk_ligne_sejour_sejour_origine FOREIGN KEY (sejour_origine_id)
        REFERENCES hebergement.sejour (id),
    CONSTRAINT ck_ligne_sejour_type CHECK (type IN (
        'HEBERGEMENT', 'CONSOMMATION', 'PRESSING', 'TAXE', 'DIVERS')),
    CONSTRAINT ck_ligne_sejour_quantite_positive CHECK (quantite > 0)
);

-- ----------------------------------------------------------------------------
-- LES DEUX SAGAS QUI ATTERRISSENT SUR CETTE TABLE
--
-- Les commentaires ci-dessous énoncent les TROIS MÊMES CHOSES pour chacune :
-- que c'est une saga à compensation explicite et jamais une transaction ; que le
-- CAS ORPHELIN — la note est déjà arrêtée — est LE CHEMIN NOMINAL et non
-- l'exception ; que la compensation atterrit dans
-- synchronisation.reconciliation_orpheline, CRÉÉE AU CYCLE D1, et qu'AUCUNE
-- TABLE DE RÉCONCILIATION NOUVELLE N'EST CRÉÉE PAR CE CYCLE.
--
-- Le motif d'écrire cela ici plutôt qu'ailleurs : sans ces commentaires, le
-- cycle qui relira le fichier prendra l'absence de REFERENCES pour un oubli et
-- l'ajoutera — de bonne foi, en croyant réparer. C'est ce que la porte P-05 rend
-- désormais impossible ; c'est ce que ces commentaires rendent COMPRÉHENSIBLE.
-- Contrat complet :
-- specs/002-modele-donnees-verticales/contracts/sagas-inter-modules.md
-- ----------------------------------------------------------------------------

COMMENT ON COLUMN hebergement.ligne_sejour.ligne_commande_id IS
    'SAGA ventes → hebergement, PREMIÈRE DES DEUX. Rattachement NU vers ventes.ligne_commande, SANS REFERENCES ET JAMAIS AVEC — c''est une SAGA À COMPENSATION EXPLICITE, jamais une transaction : aucune transaction ne couvre deux modules. LE CAS ORPHELIN EST LE CHEMIN NOMINAL, pas l''exception : une consommation prise hors ligne arrive régulièrement sur une note DÉJÀ ARRÊTÉE et un document fiscal DÉJÀ CERTIFIÉ ; avec une clé étrangère, l''insertion ÉCHOUERAIT EN BASE au lieu de partir en réconciliation. La compensation est l''écriture d''une ligne dans synchronisation.reconciliation_orpheline, CRÉÉE AU CYCLE D1 — AUCUNE TABLE DE RÉCONCILIATION NOUVELLE n''est créée : il n''y en a qu''une, et deux files seraient deux écrans, deux traitements, et un jour une file que plus personne ne relève. Trois interdits : jamais de rejet silencieux, jamais d''ajout d''office sur une note close, jamais de rejeu automatique — la résolution est HUMAINE. Idempotence par uq_ligne_sejour_ligne_commande : on INSÈRE ET ON TRAITE LE CONFLIT 23505, on ne lit jamais avant d''écrire. Contrat : contracts/sagas-inter-modules.md';

COMMENT ON COLUMN hebergement.ligne_sejour.bon_depot_id IS
    'TRACE, CÔTÉ NOTE, DE LA SECONDE SAGA — pressing → hebergement, portée par pressing.bon_depot.sejour_id. Rattachement NU vers pressing.bon_depot, SANS REFERENCES ET JAMAIS AVEC : deux verticales, une saga à compensation explicite, jamais une transaction. LE CAS ORPHELIN EST ICI PLUS FRÉQUENT QU''AILLEURS, ET C''EST STRUCTUREL — un bon de pressing a un DÉLAI (dépôt, traitement, retrait) et le client peut partir entre les deux : UN BON DONT LE SÉJOUR EST CLOS EST UN CAS COURANT, pas une anomalie. Même compensation : synchronisation.reconciliation_orpheline du cycle D1, AUCUNE TABLE NOUVELLE. Idempotence par uq_ligne_sejour_bon_depot, même mécanique. ⚠️ Le consommateur ne dépend PAS du crate pressing : il consomme un ÉVÉNEMENT OUTBOX dénormalisé dont le type est déclaré AU SOCLE — une verticale ne dépend jamais d''une autre verticale. Contrat : contracts/sagas-inter-modules.md';

COMMENT ON COLUMN hebergement.ligne_sejour.sejour_origine_id IS
    'Transfert de charges (SEJ-03) : la ligne vit sur la note qui PAIE et garde la trace du séjour qui a CONSOMMÉ. Clé étrangère interne au schéma — normale et souhaitable. CE N''EST PAS UNE SAGA : les deux séjours vivent dans le même module.';

ALTER TABLE hebergement.ligne_sejour ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.ligne_sejour FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.ligne_sejour
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.ligne_sejour
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.ligne_sejour TO kaya_app;

-- Sert : la note en temps réel — les lignes d'une note et son total provisoire
-- instantané (SEJ-03)
CREATE INDEX ix_ligne_sejour_note ON hebergement.ligne_sejour (note_sejour_id);

-- ⚠️ INDEX **UNIQUE** PARTIEL, ET LA NUANCE DÉCIDE D'UNE DOUBLE FACTURATION :
-- l'idempotence du report est portée par une CONTRAINTE, jamais par une lecture
-- préalable. Un index ordinaire retrouverait le doublon sans le REFUSER, et un
-- événement rejoué produirait une seconde ligne sur la note.
-- Sert : refuser le second report d'une même ligne de commande sur une note —
-- le rejeu d'un événement après coupure (PDV-02, SEJ-03)
CREATE UNIQUE INDEX uq_ligne_sejour_ligne_commande
    ON hebergement.ligne_sejour (tenant_id, ligne_commande_id)
    WHERE ligne_commande_id IS NOT NULL;

-- Sert : refuser le second report d'un même bon de pressing sur une note —
-- même mécanique, même motif (PDV-06)
CREATE UNIQUE INDEX uq_ligne_sejour_bon_depot
    ON hebergement.ligne_sejour (tenant_id, bon_depot_id)
    WHERE bon_depot_id IS NOT NULL;


-- ============================================================================
-- hebergement.fiche_police — l'obligation déclarative de l'hébergeur
-- CLASSE B · branche B3 — dérivée du check-in, NUMÉROTÉE
-- Story : SEJ-02
--
-- NUMÉROTÉE PAR ÉTABLISSEMENT ET PAR ANNÉE, avec un compteur en table — voir
-- `numerotation_fiche_police`. Un trou dans une numérotation opposable est une
-- fiche dont personne ne sait si elle a existé, et c'est à l'autorité qu'il
-- faudrait l'expliquer.
--
-- `contenu` EN `JSONB` : les mentions exigées varient par juridiction et par
-- époque. Des colonnes fixes imposeraient une migration à chaque évolution
-- réglementaire, et la fiche doit rester lisible TELLE QU'ELLE A ÉTÉ ÉMISE —
-- c'est un document, pas un état courant.
--
-- `complete` distingue la fiche COMPLÈTE de celle qu'il faut finir : SEJ-06
-- autorise un check-in avec une pièce non encore capturée, et l'écran de
-- rattrapage part de cette colonne.
-- ============================================================================
CREATE TABLE hebergement.fiche_police (
    id                UUID CONSTRAINT pk_fiche_police PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    sejour_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    -- ⚠️ COLONNE DÉCOUVERTE À L'IMPLÉMENTATION, absente de data-model.md. Elle
    -- est RENDUE NÉCESSAIRE PAR L'UNICITÉ que ce même document exige — « par
    -- établissement et année ». Le compteur `numerotation_fiche_police` a pour
    -- portée l'établissement ET l'année ; sans cette colonne, l'unicité aurait
    -- dû porter sur le tenant, et LA FICHE N° 1 DU SECOND ÉTABLISSEMENT AURAIT
    -- ÉTÉ REFUSÉE. Lire l'établissement à travers le séjour ne suffit pas : une
    -- contrainte UNIQUE ne traverse pas une jointure.
    etablissement_id  UUID        NOT NULL,
    numero            TEXT        NOT NULL,
    annee             SMALLINT    NOT NULL,
    complete          BOOLEAN     NOT NULL DEFAULT false,
    emise_le          TIMESTAMPTZ NOT NULL,
    contenu           JSONB       NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_fiche_police_sejour FOREIGN KEY (sejour_id)
        REFERENCES hebergement.sejour (id),
    -- L'unicité porte EXACTEMENT sur la portée du compteur qui l'alimente —
    -- établissement et année. Toute autre portée ferait diverger les deux : un
    -- compteur qui rend 1 et une contrainte qui refuse 1.
    CONSTRAINT uq_fiche_police_numero
        UNIQUE (tenant_id, etablissement_id, annee, numero)
);

COMMENT ON COLUMN hebergement.fiche_police.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES. Présente parce que uq_fiche_police_numero doit porter sur LA MÊME PORTÉE que le compteur numerotation_fiche_police : une contrainte UNIQUE ne traverse pas une jointure.';
COMMENT ON COLUMN hebergement.fiche_police.contenu IS
    'JSONB : les mentions exigées varient par juridiction et par époque. La fiche doit rester lisible TELLE QU''ELLE A ÉTÉ ÉMISE — c''est un document, pas un état courant.';
COMMENT ON COLUMN hebergement.fiche_police.complete IS
    'Distingue la fiche complète de celle à finir : SEJ-06 autorise un check-in avec une pièce non encore capturée, et l''écran de rattrapage part d''ici.';

ALTER TABLE hebergement.fiche_police ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.fiche_police FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.fiche_police
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.fiche_police
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.fiche_police TO kaya_app;

-- Sert : la fiche d'un séjour, et la liste des fiches à compléter (SEJ-02)
CREATE INDEX ix_fiche_police_sejour
    ON hebergement.fiche_police (sejour_id, complete);


-- ============================================================================
-- hebergement.numerotation_fiche_police — le compteur de la fiche de police
-- CLASSE B · branche B3 — numérotation continue, sérialisée par verrou de ligne
-- Story : SEJ-02
--
-- ⚠️ UN COMPTEUR EN TABLE, JAMAIS UNE `SEQUENCE` (00-conventions.sql, piège
-- (c)). Une séquence n'est pas transactionnelle : chaque transaction annulée
-- laisse un trou, et POUR UNE NUMÉROTATION OPPOSABLE À L'AUTORITÉ, un trou est
-- une fiche dont personne ne sait si elle a existé.
--
-- Une ligne par établissement ET PAR ANNÉE : la numérotation repart à 1 au
-- 1ᵉʳ janvier, ce qui est la pratique de la déclaration.
-- ============================================================================
CREATE TABLE hebergement.numerotation_fiche_police (
    id                UUID CONSTRAINT pk_numerotation_fiche_police PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id  UUID        NOT NULL,
    annee             SMALLINT    NOT NULL,
    dernier_numero    BIGINT      NOT NULL DEFAULT 0,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_numerotation_fiche_police_portee
        UNIQUE (tenant_id, etablissement_id, annee),
    CONSTRAINT ck_numerotation_fiche_police_positif CHECK (dernier_numero >= 0)
);

COMMENT ON COLUMN hebergement.numerotation_fiche_police.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN hebergement.numerotation_fiche_police.dernier_numero IS
    'Compteur à VERROU DE LIGNE, jamais une SEQUENCE : un trou dans une numérotation opposable est une fiche dont personne ne sait si elle a existé.';

ALTER TABLE hebergement.numerotation_fiche_police ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.numerotation_fiche_police FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.numerotation_fiche_police
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.numerotation_fiche_police
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.numerotation_fiche_police TO kaya_app;

-- Aucun index : uq_numerotation_fiche_police_portee sert le verrou de ligne,
-- qui est la seule recherche de cette table.


-- ============================================================================
-- hebergement.taxe_sejour_constat — ce qui a été constaté au départ
-- CLASSE B · branche B3 — clôt la note
-- Story : SEJ-04
--
-- ⚠️ IMMUABLE PAR PRIVILÈGE : `SELECT, INSERT` SEULS. LE CONSTAT EST FIGÉ AU
-- DÉPART, et c'est ce qui protège les déclarations passées : sans cette
-- immuabilité, un changement de paramétrage fiscal RÉÉCRIRAIT RÉTROACTIVEMENT
-- des taxes déjà déclarées à la commune, et l'état de reversement ne
-- correspondrait plus à ce qui a été versé.
--
-- ⚠️ CETTE TABLE PORTE UNE TRACE, JAMAIS UNE RÈGLE. Le calcul est celui du
-- `JurisdictionAdapter` (constitution, principe 5) ; `regle_appliquee` en garde
-- l'identifiant pour qu'on puisse relire POURQUOI ce montant, sans avoir à
-- rejouer un calcul dont les paramètres ont changé.
--
-- `uq_taxe_sejour_constat_sejour` : UN SEUL CONSTAT PAR SÉJOUR. Deux constats
-- donneraient deux montants au même reversement communal.
-- ============================================================================
CREATE TABLE hebergement.taxe_sejour_constat (
    id                   UUID CONSTRAINT pk_taxe_sejour_constat PRIMARY KEY,
    tenant_id            UUID           NOT NULL,
    sejour_id            UUID           NOT NULL,
    nuitees_assujetties  INTEGER        NOT NULL,
    nombre_personnes     INTEGER        NOT NULL,
    montant_unitaire     montant_mineur NOT NULL,
    montant_total        montant_mineur NOT NULL,
    code_devise          code_devise    NOT NULL,
    regle_appliquee      TEXT           NOT NULL,
    constate_le          TIMESTAMPTZ    NOT NULL,
    horodatage_client    TIMESTAMPTZ        NULL,
    cree_le              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_taxe_sejour_constat_sejour FOREIGN KEY (sejour_id)
        REFERENCES hebergement.sejour (id),
    CONSTRAINT uq_taxe_sejour_constat_sejour UNIQUE (tenant_id, sejour_id),
    CONSTRAINT ck_taxe_sejour_constat_quantites CHECK (
        nuitees_assujetties >= 0 AND nombre_personnes > 0)
);

COMMENT ON TABLE hebergement.taxe_sejour_constat IS
    'TRACE FIGÉE du constat de départ, jamais une règle. Immuable par privilège : un changement de paramétrage ne doit pas réécrire une taxe déjà déclarée.';
COMMENT ON COLUMN hebergement.taxe_sejour_constat.regle_appliquee IS
    'Identifiant de la règle du JurisdictionAdapter appliquée ce jour-là. Permet de relire POURQUOI ce montant sans rejouer un calcul dont les paramètres ont changé.';

ALTER TABLE hebergement.taxe_sejour_constat ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.taxe_sejour_constat FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.taxe_sejour_constat
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.taxe_sejour_constat
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- IMMUABLE PAR PRIVILÈGE — ni UPDATE, ni DELETE. Voir l'en-tête.
GRANT SELECT, INSERT ON hebergement.taxe_sejour_constat TO kaya_app;

-- Sert : l'état de reversement communal par période — ce qui est dû à la
-- commune sur un mois donné (FIS-08)
CREATE INDEX ix_taxe_sejour_constat_date
    ON hebergement.taxe_sejour_constat (constate_le);


-- ############################################################################
-- 4 · RÉSERVATION
--
-- ⚠️ NI LA POLITIQUE D'ANNULATION, NI LE DÉLAI D'EXPIRATION D'UNE PROVISOIRE
-- N'ONT DE TABLE ICI, ET CE N'EST PAS UN OUBLI. Ce sont des CLÉS DU CATALOGUE
-- de configuration, de portée établissement (RSV-01, RSV-03) : « une provisoire
-- expire au bout de 48 h », « on facture 50 % en cas de no-show » sont des
-- valeurs paramétrées, pas des entités. Leur donner une table ici les
-- dupliquerait avec le catalogue du cycle D1, et deux vérités sur le même délai
-- finissent par diverger — celle qu'on lit n'étant jamais celle qu'on modifie.
-- ############################################################################


-- ============================================================================
-- hebergement.reservation — une unité promise, pas encore occupée
-- CLASSE B · branche B3 — ressource unique sur un intervalle
-- Story : RSV-01, RSV-04
--
-- `categorie_id` EST OBLIGATOIRE, `unite_id` NE L'EST PAS : on réserve d'abord
-- une CATÉGORIE — « une chambre standard » — et l'unité précise est attribuée
-- plus tard, parfois à l'arrivée. Exiger l'unité dès la réservation figerait
-- l'affectation des semaines à l'avance et interdirait toute optimisation de
-- plan de chambres.
--
-- `occupation_id` EST NULLABLE POUR LA MÊME RAISON : tant qu'aucune unité n'est
-- désignée, il n'y a rien à bloquer. Dès qu'elle l'est, une occupation de motif
-- RESERVATION est créée, ET LA CONVERSION EN SÉJOUR CONSERVE LA MÊME LIGNE en
-- changeant son motif — jamais une seconde, qui se chevaucherait avec la
-- première (contrat disponibilite.md §4).
--
-- `expire_le` PORTE LA VALEUR RÉSOLUE, pas le délai : le paramètre peut changer,
-- l'échéance d'une réservation déjà prise, non. Même raisonnement que
-- `moment_reglement` sur le bon de dépôt.
-- ============================================================================
CREATE TABLE hebergement.reservation (
    id                UUID CONSTRAINT pk_reservation PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id  UUID        NOT NULL,
    client_id         UUID        NOT NULL,
    categorie_id      UUID        NOT NULL,
    unite_id          UUID            NULL,
    formule_id        UUID        NOT NULL,
    occupation_id     UUID            NULL,
    -- ⚠️ CE QUI EST RÉSERVÉ, ET QUAND. COLONNE DÉCOUVERTE À L'IMPLÉMENTATION,
    -- absente de data-model.md — et son absence rendait le CHEMIN NOMINAL de
    -- cette table impossible à écrire.
    -- Le raisonnement, parce qu'il vaut d'être relu : `unite_id` et
    -- `occupation_id` sont nullables EXPRÈS — on réserve d'abord une CATÉGORIE.
    -- Mais tant qu'aucune unité n'est désignée, il n'y a pas d'occupation, donc
    -- AUCUN tstzrange où loger « du 15 au 17 décembre ». Une réservation de
    -- catégorie se serait insérée sans qu'aucune colonne ne dise POUR QUAND —
    -- et RSV-01 la déclare pourtant « ressource unique SUR UN INTERVALLE ».
    -- ⚠️ AUCUNE CONTRAINTE D'EXCLUSION ICI, et ce n'est pas un oubli : une
    -- réservation de catégorie ne bloque AUCUNE unité en particulier. Le blocage
    -- naît de l'`occupation` créée à l'attribution, et c'est elle qui porte
    -- l'exclusion. Deux réservations concurrentes sur la même catégorie sont
    -- légitimes tant qu'il reste des unités — c'est le surbooking contrôlé, que
    -- le `domain` de la phase 3 arbitre en comptant, jamais la base en refusant.
    periode           TSTZRANGE   NOT NULL,
    statut            TEXT        NOT NULL,
    expire_le         TIMESTAMPTZ     NULL,
    annulee_le        TIMESTAMPTZ     NULL,
    motif_annulation  TEXT            NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_reservation_client FOREIGN KEY (client_id)
        REFERENCES hebergement.client (id),
    CONSTRAINT fk_reservation_categorie FOREIGN KEY (categorie_id)
        REFERENCES hebergement.categorie (id),
    CONSTRAINT fk_reservation_unite FOREIGN KEY (unite_id)
        REFERENCES hebergement.unite (id),
    CONSTRAINT fk_reservation_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id),
    CONSTRAINT fk_reservation_occupation FOREIGN KEY (occupation_id)
        REFERENCES hebergement.occupation (id),
    CONSTRAINT ck_reservation_statut CHECK (statut IN (
        'PROVISOIRE', 'CONFIRMEE', 'HONOREE', 'ANNULEE', 'NO_SHOW', 'EXPIREE'))
);

COMMENT ON COLUMN hebergement.reservation.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN hebergement.reservation.unite_id IS
    'NULLABLE — on réserve une CATÉGORIE, l''unité est attribuée plus tard. L''exiger figerait le plan de chambres des semaines à l''avance.';
COMMENT ON COLUMN hebergement.reservation.occupation_id IS
    'NULLABLE tant qu''aucune unité n''est désignée. La conversion en séjour CONSERVE LA MÊME occupation en changeant son motif — jamais une seconde, qui se chevaucherait avec la première.';
COMMENT ON COLUMN hebergement.reservation.periode IS
    'CE QUI EST RÉSERVÉ, ET QUAND — TSTZRANGE, jamais une paire de dates, comme sur occupation. Elle existe parce que le CHEMIN NOMINAL de cette table est la réservation d''une CATÉGORIE sans unité : sans occupation, il n''y aurait aucun tstzrange où loger l''intervalle, et RSV-01 déclare pourtant la réservation « ressource unique SUR UN INTERVALLE ». ⚠️ AUCUNE contrainte d''exclusion ne la protège, et c''est voulu : une réservation de catégorie ne bloque aucune unité en particulier — le blocage naît de l''occupation créée à l''attribution.';
COMMENT ON COLUMN hebergement.reservation.expire_le IS
    'VALEUR RÉSOLUE de l''échéance, jamais le délai. La clé de catalogue peut changer ; l''échéance d''une réservation déjà prise, non. À ne pas confondre avec `periode`, qui est ce qui est réservé : `expire_le` est la date à laquelle une PROVISOIRE tombe.';

ALTER TABLE hebergement.reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.reservation FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.reservation
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.reservation
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON hebergement.reservation TO kaya_app;

-- Sert : les réservations à honorer d'un établissement, et les provisoires à
-- expirer — la tâche périodique part de là (RSV-01)
CREATE INDEX ix_reservation_etab_statut
    ON hebergement.reservation (etablissement_id, statut, expire_le);

-- Sert : les réservations d'une catégorie qui recouvrent un intervalle donné —
-- le comptage de disponibilité prévisionnelle, qui décide s'il reste des unités
-- à promettre. Index GiST parce que la recherche est un CHEVAUCHEMENT (&&), que
-- b-tree ne sert pas (RSV-01, RSV-02)
CREATE INDEX ix_reservation_categorie_periode
    ON hebergement.reservation USING gist (categorie_id, periode)
    WHERE statut IN ('PROVISOIRE', 'CONFIRMEE');

-- Sert : les réservations d'un client (RSV-01)
CREATE INDEX ix_reservation_client ON hebergement.reservation (client_id);


-- ----------------------------------------------------------------------------
-- LA SEULE CONTRAINTE DE CE MODÈLE POSÉE PAR `ALTER`, ET LE MOTIF EST ÉCRIT
--
-- `hebergement.sejour.reservation_id` désigne la réservation qu'un séjour
-- honore (RSV-05). C'est une clé étrangère INTERNE AU SCHÉMA — normale et
-- souhaitable —, mais `sejour` est déclarée AVANT `reservation` : la narration
-- du fichier suit le cycle de vie du produit (référentiel, disponibilité,
-- séjour, réservation), et `reservation` référence elle-même `client`,
-- `categorie`, `unite`, `formule` et `occupation`, qui viennent tous plus haut.
--
-- ⚠️ POURQUOI CET `ALTER` EST SANS DANGER, ALORS QUE LE PIÈGE (b) DE
-- `00-conventions.sql` EN INTERDIT UN AUTRE. Le piège porte sur les CONTRAINTES
-- D'EXCLUSION ajoutées après coup, qui échouent sur les données existantes. Ici,
-- deux différences décisives : c'est une clé étrangère, et la table est VIDE au
-- moment de l'application — le modèle s'applique sur une base vierge, ce que la
-- porte P-01 vérifie. La contrainte est donc validée sur zéro ligne, comme si
-- elle avait été posée à la création.
--
-- ⚠️ ET POURQUOI ELLE NE RELÈVE PAS DE P-05 : `sejour` et `reservation` sont
-- dans LE MÊME SCHÉMA. P-05 refuse les clés étrangères ENTRE DEUX SCHÉMAS ; à
-- l'intérieur d'un schéma, elles sont exactement ce qu'on veut.
-- ----------------------------------------------------------------------------
ALTER TABLE hebergement.sejour
    ADD CONSTRAINT fk_sejour_reservation FOREIGN KEY (reservation_id)
        REFERENCES hebergement.reservation (id);


-- ============================================================================
-- hebergement.arrhes — ce qui a été versé d'avance, et ce qu'il en advient
-- CLASSE B · branche B3 — espèces, virement : effet monétaire constaté sans
--                          tiers en ligne
-- CLASSE D · branche D1 — Mobile Money, carte : un agrégateur tranche
-- Story : RSV-03
--
-- DEUX CLASSES SUR UNE TABLE, ET C'EST LE MODE DE RÈGLEMENT QUI DÉCIDE — même
-- règle qu'à `caisse.encaissement` au socle (registre §7.4). Mais LE MODE N'EST
-- PAS UNE COLONNE D'ICI : l'encaissement lui-même vit dans `caisse`, et cette
-- table ne porte que L'IMPUTATION — ce qui a été versé, sur quelle réservation,
-- et ce qu'il en advient au check-in ou à l'annulation. La classe se lit donc
-- sur `caisse.encaissement.mode`, à travers `encaissement_id`.
--
-- ⚠️ Conséquence assumée : `ck_encaissement_mode` est au socle, et RIEN ICI NE
-- RÉPLIQUE L'ÉNUMÉRATION DES MODES. La répliquer donnerait deux listes à tenir,
-- et la seconde serait celle qu'on oublierait de mettre à jour.
--
-- `impute_le` et `restitue_le` sont les DEUX SORTIES possibles : les arrhes sont
-- imputées sur la note au check-in, ou restituées à l'annulation — selon la
-- politique, qui est une clé de catalogue. Les deux colonnes nulles veulent dire
-- « versées, en attente ».
-- ============================================================================
CREATE TABLE hebergement.arrhes (
    id                UUID CONSTRAINT pk_arrhes PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    reservation_id    UUID           NOT NULL,
    -- Rattachement inter-modules vers caisse.encaissement — NU.
    -- ⚠️ C'EST CETTE COLONNE QUI PORTE LA CLASSE : le mode de règlement vit
    -- là-bas, et c'est lui qui décide si l'opération est B ou D.
    encaissement_id   UUID               NULL,
    montant           montant_mineur NOT NULL,
    code_devise       code_devise    NOT NULL,
    impute_le         TIMESTAMPTZ        NULL,
    restitue_le       TIMESTAMPTZ        NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_arrhes_reservation FOREIGN KEY (reservation_id)
        REFERENCES hebergement.reservation (id),
    CONSTRAINT ck_arrhes_montant_positif CHECK (montant > 0),
    -- Des arrhes ne peuvent pas être à la fois imputées et restituées : ce
    -- serait les compter deux fois, une au crédit du séjour et une au débit de
    -- la caisse.
    CONSTRAINT ck_arrhes_sortie_unique CHECK (
        impute_le IS NULL OR restitue_le IS NULL)
);

COMMENT ON COLUMN hebergement.arrhes.encaissement_id IS
    'Rattachement inter-modules vers caisse.encaissement — nu, sans REFERENCES. C''EST CETTE COLONNE QUI PORTE LA CLASSE : le mode de règlement vit au socle et décide si l''opération est B (espèces, virement) ou D (Mobile Money, carte).';

ALTER TABLE hebergement.arrhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.arrhes FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.arrhes
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.arrhes
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- UPDATE sert les deux sorties — imputation au check-in, restitution à
-- l'annulation — et la transition d'état des modes D.
GRANT SELECT, INSERT, UPDATE ON hebergement.arrhes TO kaya_app;

-- Sert : les arrhes à imputer au check-in, et celles à restituer à l'annulation
-- (RSV-03, RSV-05)
CREATE INDEX ix_arrhes_reservation ON hebergement.arrhes (reservation_id);


-- ############################################################################
-- 5 · MAINTENANCE
-- ############################################################################


-- ============================================================================
-- hebergement.incident_maintenance — « le climatiseur de la 12 ne marche plus »
-- CLASSE A · branche A4 — explicitement A au cadrage §11.3
-- Story : registre §7.5, HEB-06
--
-- APPEND-ONLY, et c'est ce qui la rend atteignable hors ligne : une femme de
-- chambre signale un incident depuis un couloir sans réseau, et deux
-- signalements du même problème ne se contredisent pas — ils font deux lignes,
-- que la réception rapproche.
--
-- ⚠️ SIGNALER UN INCIDENT NE MET PAS L'UNITÉ HORS SERVICE. La mise hors service
-- est une OCCUPATION de motif MAINTENANCE, qui est de classe B — parce qu'elle
-- retire une ressource de la disponibilité, et qu'on ne retire pas une ressource
-- hors ligne. Les deux opérations sont distinctes, et les confondre rendrait le
-- signalement B, donc impossible depuis le couloir.
-- ============================================================================
CREATE TABLE hebergement.incident_maintenance (
    id                     UUID CONSTRAINT pk_incident_maintenance PRIMARY KEY,
    tenant_id              UUID        NOT NULL,
    unite_id               UUID        NOT NULL,
    -- Rattachement inter-modules vers comptes.compte — NU.
    signale_par_compte_id  UUID            NULL,
    description            TEXT        NOT NULL,
    gravite                TEXT        NOT NULL,
    signale_le             TIMESTAMPTZ NOT NULL,
    horodatage_client      TIMESTAMPTZ     NULL,
    cree_le                TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_incident_maintenance_unite FOREIGN KEY (unite_id)
        REFERENCES hebergement.unite (id),
    CONSTRAINT ck_incident_gravite CHECK (gravite IN (
        'MINEURE', 'MAJEURE', 'BLOQUANTE'))
);

COMMENT ON TABLE hebergement.incident_maintenance IS
    'Signalement APPEND-ONLY, atteignable hors ligne. Signaler ne met PAS l''unité hors service : la mise hors service est une occupation de motif MAINTENANCE, de classe B.';
COMMENT ON COLUMN hebergement.incident_maintenance.signale_par_compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';

ALTER TABLE hebergement.incident_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.incident_maintenance FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.incident_maintenance
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.incident_maintenance
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON hebergement.incident_maintenance TO kaya_app;

-- Sert : les incidents récents d'une unité — l'écran de gouvernante et la
-- décision de mise hors service (HEB-06)
CREATE INDEX ix_incident_maintenance_unite_date
    ON hebergement.incident_maintenance (unite_id, signale_le DESC);


-- ============================================================================
-- hebergement.intervention — ce qui a été fait, et quand
-- CLASSE A · branche A4 — explicitement A au cadrage §11.3
-- Story : registre §7.5, HEB-06
--
-- APPEND-ONLY : plusieurs interventions sur un même incident sont le cas normal
-- — on constate, on commande la pièce, on répare. Un état d'incident mis à jour
-- effacerait cette suite ; des comptes rendus ajoutés la conservent.
--
-- `occupation_id` RELIE L'INTERVENTION À LA MISE HORS SERVICE QUI L'ACCOMPAGNE,
-- quand il y en a une — et il est NULLABLE parce qu'il n'y en a pas toujours :
-- on change une ampoule sans bloquer la chambre. C'est une clé étrangère
-- INTERNE au schéma, donc normale et souhaitable.
-- ============================================================================
CREATE TABLE hebergement.intervention (
    id                      UUID CONSTRAINT pk_intervention PRIMARY KEY,
    tenant_id               UUID        NOT NULL,
    incident_maintenance_id UUID        NOT NULL,
    occupation_id           UUID            NULL,
    compte_rendu            TEXT        NOT NULL,
    intervenant             TEXT            NULL,
    realisee_le             TIMESTAMPTZ NOT NULL,
    horodatage_client       TIMESTAMPTZ     NULL,
    cree_le                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_intervention_incident FOREIGN KEY (incident_maintenance_id)
        REFERENCES hebergement.incident_maintenance (id),
    CONSTRAINT fk_intervention_occupation FOREIGN KEY (occupation_id)
        REFERENCES hebergement.occupation (id)
);

COMMENT ON COLUMN hebergement.intervention.occupation_id IS
    'Relie l''intervention à la mise hors service qui l''accompagne, QUAND IL Y EN A UNE — on change une ampoule sans bloquer la chambre. Clé étrangère INTERNE au schéma : normale et souhaitable.';
COMMENT ON COLUMN hebergement.intervention.intervenant IS
    'LIBELLÉ LIBRE, jamais un identifiant de compte : l''intervenant est le plus souvent un artisan extérieur, qui n''a pas de compte dans le produit.';

ALTER TABLE hebergement.intervention ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.intervention FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.intervention
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.intervention
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON hebergement.intervention TO kaya_app;

-- Sert : les comptes rendus d'un incident, dans l'ordre où ils sont arrivés
-- (HEB-06)
CREATE INDEX ix_intervention_incident
    ON hebergement.intervention (incident_maintenance_id, realisee_le);


-- ############################################################################
-- 6 · PROVISIONS — des tables, et rien d'autre
--
-- Les provisions du registre §10 qui relèvent de ce schéma. TABLES SEULEMENT,
-- AUCUNE LOGIQUE AU MVP (constitution, principe 10).
--
-- ⚠️ POURQUOI MAINTENANT ET PAS PLUS TARD : C'EST LE DERNIER CYCLE OÙ ELLES
-- COÛTENT ZÉRO. Poser une table pendant qu'on écrit le fichier ne demande rien ;
-- la poser en phase 3 demande une migration, une revue, un déploiement — au
-- moment précis où l'on a autre chose à faire, c'est-à-dire écrire la logique.
--
-- ⚠️ CE QUI LES EMPÊCHE DE DEVENIR AUTRE CHOSE QU'UNE PROVISION : le privilège.
-- `SELECT` SEUL. Rien ne peut y être écrit, donc rien ne peut être bâti dessus,
-- et le jour où l'on voudra, IL FAUDRA CHANGER UN GRANT — ce qui se voit dans un
-- diff, et se discute. Une provision qui recevrait INSERT serait une table
-- ordinaire qu'on aurait juste oublié d'utiliser.
--
-- ⚠️ LE DÉCOMPTE D'UNE PRESTATION INCLUSE N'A REÇU AUCUNE TABLE, et c'est
-- délibéré (registre §10, incrément 2). La prestation existe — `prestation_incluse`
-- ci-dessous — ; sa CONSOMMATION n'a aucune story au MVP, et UNE TABLE QU'AUCUNE
-- STORY N'ÉCRIT SE REMPLIT UN JOUR DE CE QUI TRAÎNE. Elle naîtra avec sa story.
-- ############################################################################


-- ============================================================================
-- hebergement.prestation_incluse — ce que la formule comprend — PROVISION
-- CLASSE C · branche C2 — référentiel attaché à la formule
-- Story : HEB-09
-- PROVISION — tables seulement, aucune logique au MVP
--
-- Rattachée à la FORMULE et non à la catégorie : « petit-déjeuner compris » est
-- une propriété de ce qu'on vend, pas de la chambre. La même chambre se vend en
-- nuitée avec petit-déjeuner et en passage sans.
--
-- `valeur_unitaire_plafond` existe dès maintenant parce que c'est la seule
-- colonne qu'on ne pourrait pas ajouter sans reprendre les données : une
-- prestation incluse « jusqu'à 3 000 F » et une prestation incluse « en entier »
-- ne se distinguent pas après coup.
-- ============================================================================
CREATE TABLE hebergement.prestation_incluse (
    id                      UUID CONSTRAINT pk_prestation_incluse PRIMARY KEY,
    tenant_id               UUID           NOT NULL,
    formule_id              UUID           NOT NULL,
    type                    TEXT           NOT NULL,
    quantite                quantite       NOT NULL,
    valeur_unitaire_plafond montant_mineur     NULL,
    code_devise             code_devise        NULL,
    cree_le                 TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_prestation_incluse_formule FOREIGN KEY (formule_id)
        REFERENCES hebergement.formule (id)
);

COMMENT ON TABLE hebergement.prestation_incluse IS
    'PROVISION — tables seulement, aucune logique au MVP (HEB-09). Rattachée à la FORMULE : la même chambre se vend en nuitée avec petit-déjeuner et en passage sans. LE DÉCOMPTE DE LA CONSOMMATION N''A PAS DE TABLE (registre §10, incrément 2).';

ALTER TABLE hebergement.prestation_incluse ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.prestation_incluse FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.prestation_incluse
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.prestation_incluse
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON hebergement.prestation_incluse TO kaya_app;


-- ============================================================================
-- hebergement.contrat_location — la location meublée de longue durée — PROVISION
-- CLASSE C · branche C2 — référentiel contractuel
-- Story : HEB-08 — résidences meublées, INCRÉMENT 3
-- PROVISION — tables seulement, aucune logique au MVP
--
-- La résidence meublée n'est PAS un séjour long : il y a un contrat, un loyer
-- périodique, une caution, des charges et un état des lieux. Aucun de ces
-- objets n'a d'équivalent dans le séjour hôtelier, et les y forcer aurait
-- dénaturé `sejour` — c'est pourquoi ce sont quatre tables et non quatre
-- colonnes de plus.
--
-- ⚠️ Le rattachement à l'unité passe par une clé étrangère INTERNE au schéma,
-- et l'occupation de longue durée restera une `occupation` : un locataire
-- occupe une unité comme un client, et la contrainte d'exclusion vaut pour lui
-- aussi. La provision ne prépare donc PAS une seconde mécanique de
-- disponibilité.
-- ============================================================================
CREATE TABLE hebergement.contrat_location (
    id          UUID CONSTRAINT pk_contrat_location PRIMARY KEY,
    tenant_id   UUID           NOT NULL,
    client_id   UUID           NOT NULL,
    unite_id    UUID           NOT NULL,
    date_debut  DATE           NOT NULL,
    date_fin    DATE               NULL,
    loyer       montant_mineur NOT NULL,
    code_devise code_devise    NOT NULL,
    periodicite TEXT           NOT NULL,
    cree_le     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_contrat_location_client FOREIGN KEY (client_id)
        REFERENCES hebergement.client (id),
    CONSTRAINT fk_contrat_location_unite FOREIGN KEY (unite_id)
        REFERENCES hebergement.unite (id),
    CONSTRAINT ck_contrat_location_periode CHECK (
        date_fin IS NULL OR date_fin >= date_debut)
);

COMMENT ON TABLE hebergement.contrat_location IS
    'PROVISION — tables seulement, aucune logique au MVP (HEB-08, incrément 3). L''occupation de longue durée restera une hebergement.occupation : la provision ne prépare AUCUNE seconde mécanique de disponibilité.';
COMMENT ON COLUMN hebergement.contrat_location.date_debut IS
    'Date de contrat, JAMAIS une période de disponibilité — celle-là est un tstzrange sur occupation. Ne pas confondre les deux (SC-004).';

ALTER TABLE hebergement.contrat_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.contrat_location FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.contrat_location
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.contrat_location
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON hebergement.contrat_location TO kaya_app;


-- ============================================================================
-- hebergement.caution — le dépôt de garantie — PROVISION
-- CLASSE C · branche C2 — référentiel contractuel
-- Story : HEB-08 — résidences meublées, incrément 3
-- PROVISION — tables seulement, aucune logique au MVP
--
-- Une table plutôt que deux colonnes de `contrat_location` : une caution peut
-- être versée en plusieurs fois et restituée partiellement. Deux colonnes ne
-- porteraient qu'un seul versement, et le premier locataire qui paie en deux
-- fois imposerait une migration.
-- ============================================================================
CREATE TABLE hebergement.caution (
    id                  UUID CONSTRAINT pk_caution PRIMARY KEY,
    tenant_id           UUID           NOT NULL,
    contrat_location_id UUID           NOT NULL,
    montant             montant_mineur NOT NULL,
    code_devise         code_devise    NOT NULL,
    versee_le           TIMESTAMPTZ        NULL,
    restituee_le        TIMESTAMPTZ        NULL,
    cree_le             TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_caution_contrat FOREIGN KEY (contrat_location_id)
        REFERENCES hebergement.contrat_location (id)
);

COMMENT ON TABLE hebergement.caution IS
    'PROVISION — tables seulement, aucune logique au MVP (HEB-08, incrément 3).';

ALTER TABLE hebergement.caution ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.caution FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.caution
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.caution
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON hebergement.caution TO kaya_app;


-- ============================================================================
-- hebergement.charge_locative — eau, électricité, charges — PROVISION
-- CLASSE C · branche C2 — référentiel contractuel
-- Story : HEB-08 — résidences meublées, incrément 3
-- PROVISION — tables seulement, aucune logique au MVP
-- ============================================================================
CREATE TABLE hebergement.charge_locative (
    id                  UUID CONSTRAINT pk_charge_locative PRIMARY KEY,
    tenant_id           UUID           NOT NULL,
    contrat_location_id UUID           NOT NULL,
    type                TEXT           NOT NULL,
    montant             montant_mineur NOT NULL,
    code_devise         code_devise    NOT NULL,
    periode_debut       DATE           NOT NULL,
    periode_fin         DATE           NOT NULL,
    cree_le             TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_charge_locative_contrat FOREIGN KEY (contrat_location_id)
        REFERENCES hebergement.contrat_location (id),
    CONSTRAINT ck_charge_locative_periode CHECK (periode_fin >= periode_debut)
);

COMMENT ON TABLE hebergement.charge_locative IS
    'PROVISION — tables seulement, aucune logique au MVP (HEB-08, incrément 3).';
COMMENT ON COLUMN hebergement.charge_locative.periode_debut IS
    'Période de FACTURATION d''une charge, JAMAIS une période de disponibilité — celle-là est un tstzrange sur occupation. Ne pas confondre les deux (SC-004).';

ALTER TABLE hebergement.charge_locative ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.charge_locative FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.charge_locative
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.charge_locative
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON hebergement.charge_locative TO kaya_app;


-- ============================================================================
-- hebergement.etat_des_lieux — l'entrée et la sortie — PROVISION
-- CLASSE C · branche C2 — référentiel contractuel
-- Story : HEB-08 — résidences meublées, incrément 3
-- PROVISION — tables seulement, aucune logique au MVP
--
-- `constat` en `JSONB` pour la même raison que `fiche_police.contenu` : ce qu'on
-- relève varie d'un bien à l'autre, et le document doit rester lisible TEL
-- QU'IL A ÉTÉ ÉTABLI — c'est une pièce contradictoire, pas un état courant.
-- ============================================================================
CREATE TABLE hebergement.etat_des_lieux (
    id                  UUID CONSTRAINT pk_etat_des_lieux PRIMARY KEY,
    tenant_id           UUID        NOT NULL,
    contrat_location_id UUID        NOT NULL,
    type                TEXT        NOT NULL,
    constat             JSONB       NOT NULL,
    realise_le          TIMESTAMPTZ NOT NULL,
    cree_le             TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_etat_des_lieux_contrat FOREIGN KEY (contrat_location_id)
        REFERENCES hebergement.contrat_location (id),
    CONSTRAINT ck_etat_des_lieux_type CHECK (type IN ('ENTREE', 'SORTIE'))
);

COMMENT ON TABLE hebergement.etat_des_lieux IS
    'PROVISION — tables seulement, aucune logique au MVP (HEB-08, incrément 3).';
COMMENT ON COLUMN hebergement.etat_des_lieux.constat IS
    'JSONB — ce qu''on relève varie d''un bien à l''autre, et le document doit rester lisible TEL QU''IL A ÉTÉ ÉTABLI : c''est une pièce contradictoire, pas un état courant.';

ALTER TABLE hebergement.etat_des_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE hebergement.etat_des_lieux FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON hebergement.etat_des_lieux
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON hebergement.etat_des_lieux
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON hebergement.etat_des_lieux TO kaya_app;

-- Aucun index sur les cinq provisions : une table que rien n'écrit et que rien
-- ne lit n'a aucune recherche à servir. Un index sans usage nommé ne se crée
-- pas — et il en naîtra avec les stories qui les activeront.


-- ============================================================================
-- FIN — 97-hebergement.sql
-- ============================================================================
